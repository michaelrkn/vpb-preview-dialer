if (!inDevelopmentEnvironment()) {
  Sentry.init({ dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962' });
}

var activeTabs = [];

chrome.browserAction.onClicked.addListener(function(tab) {
  if (!activeTabs.includes(tab.id)) {
    checkForVPB(tab);
  }
});

function checkForVPB(tab) {
  var controls = getControls(tab.url);
    if (controls) {
      enableDialer(tab, controls);
    } else {
      chrome.tabs.executeScript({
        code: 'alert("Please load a VPB before enabling the Preview Dialer.")'
      });
    }
}

function getControls(url) {
  if (url.includes('https://www.openvpb.com/VirtualPhoneBank/LoggedIn/')) {
    return 'controls-openvpb.js';
  } else if (url.includes('ContactDetailScript.aspx')) {
    return 'controls-van.js';
  } else if (url.includes('https://phonebank.bluevote.com/Home/PhoneBank?pt=')) {
    return 'controls-pdi.js';
  }
}

function enableDialer(tab, controls) {
  showInstruction();
  setBadgeOn(tab.id);
  loadControls(controls);
  listenForReload(tab, controls);
  activeTabs.push(tab.id);
}

function showInstruction() {
  chrome.tabs.executeScript({
    file: 'instructions.js'
  });
}

function setBadgeOn(tabId) {
  chrome.browserAction.setBadgeText({
    text: 'on',
    tabId: tabId
  });
}

function loadControls(controls) {
  chrome.tabs.executeScript({
    file: controls
  });
}

function listenForReload(tab, controls) {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, updatedTab) => {
    if (tab.id === updatedTab.id) {
      setBadgeOn(tabId);
      if (changeInfo.status === 'complete') {
        loadControls(controls);
      }
    }
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    localStorage.setItem('callOnLoad', true);
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  var tab = sender.tab.id;
  if (message.getCallOnLoad) {
    sendResponse(JSON.parse(localStorage.getItem('callOnLoad')));
  } else if (message.getDevelopment) {
    sendResponse(inDevelopmentEnvironment());
  } else if (message.hangup) {
    hangup();
  } else if (message.sendDigit) {
    sendDigit(message.sendDigit);
  } else if (message.dial) {
    call(message.dial, tab);
  }
});

function call(number, tab) {
  if (localStorage.getItem('campaignCode') === null) {
    chrome.tabs.sendMessage(tab, 'noCampaignCode');
  } else if (localStorage.getItem('outgoingCallerID') === null) {
    chrome.tabs.sendMessage(tab, 'noOutgoingCallerID');
  } else {
    authenticateAndSetup(number, tab);
  }
}

function authenticateAndSetup(number, tab) {
  getAccessToken().then((accessToken) => {
    var device = setupDevice(accessToken);
    device.tab = tab;
    device.number = number;

    device.on('ready', prepareDial);
    device.on('offline', handleOffline);
    device.on('error', ((error) => {
      if (error.code === 31205 || error.code === 31202) { // access token expired
        localStorage.removeItem('accessToken');
        device.removeListener('ready', prepareDial);
        Twilio.Device.destroy();
        authenticateAndSetup(number, tab);
      }
    }));
  });
}

function getAccessToken() {
  var accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    return Promise.resolve(accessToken);
  } else {
    var campaignCode = localStorage.getItem('campaignCode');
    var accessCode = localStorage.getItem('accessCode');

    return fetch('https://' + campaignCode + '.twil.io/access-token?accessCode=' + accessCode)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      localStorage.setItem('accessToken', json.token);
      return json.token;
    });
  }
}

function setupDevice(accessToken) {
  var device = Twilio.Device.setup(accessToken, {
    enableRingingState: true
  });
  device.audio.outgoing(false);
  return device;
}

function prepareDial(device) {
  device.removeListener('ready', prepareDial);

  var audio = new Audio('outgoing.mp3');
  audio.play();

  var connection = dial(device);
  connection.answered = false;
  connection.tab = device.tab;

  connection.on('accept', () => { connection.answered = true; });
  connection.on('disconnect', handleDisconnect);
}

function dial(device) {
  var params = {
    To: device.number,
    From: localStorage.getItem('outgoingCallerID'),
    RingUntilVoicemail: JSON.parse(localStorage.getItem('ringUntilVoicemail'))
  };
  return device.connect(params);
}

function hangup() {
  var connection = Twilio.Device.activeConnection();
  if (connection) {
    connection.removeListener('disconnect', handleDisconnect);
    connection.disconnect();
  }
  Twilio.Device.destroy();
}

function handleDisconnect(connection) {
  if (!connection.answered) {
    chrome.tabs.sendMessage(connection.tab, 'unanswered');
  }
  Twilio.Device.destroy();
}

function handleOffline(device) {
  device.removeListener('offline', handleOffline);
  Twilio.Device.destroy();
}

function sendDigit(digit) {
  var connection = Twilio.Device.activeConnection();
  if (connection) {
    connection.sendDigits(digit);
  }
}

function inDevelopmentEnvironment() {
  return chrome.runtime.getManifest().update_url === undefined;
}
