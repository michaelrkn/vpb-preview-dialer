if (!inDevelopmentEnvironment()) {
  Sentry.init({
    dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962',
    release: '2.0.4'
  });
  Sentry.configureScope(function(scope) {
    scope.setUser({"username": localStorage.getItem('campaignCode')});
  });
}

var activeTabs = {};
const TWILIO_BASE_URL = "vpb-dialer-5062";

chrome.browserAction.onClicked.addListener(function(tab) {
  showInstructions(tab);
});

function showInstructions(tab) {
  chrome.tabs.executeScript(tab.id, {
    file: 'instructions.js'
  }, () => {
    if (activeTabs[tab.id] === undefined) {
      determineVPB(tab);
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (activeTabs[tab.id] && changeInfo.status === 'complete') {
    enableDialer(tab, activeTabs[tab.id]);
  }
});

function setTabOff(tab) {
  chrome.browserAction.setBadgeText({
    text: '',
    tabId: tab.id
  });
  delete activeTabs[tab.id];
}

function determineVPB(tab) {
  var controls = getControls(tab.url);
  if (controls) {
    enableDialer(tab, controls);
  } else {
    chrome.tabs.executeScript(tab.id, {
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
  } else if (url.includes('nationbuilder.com/admin/custom_lists/')) {
    return 'controls-nb.js';
  } else if (inDevelopmentEnvironment()) {
    return "test-dial.js";
  }
}

function enableDialer(tab, controls) {
  setBadgeOn(tab);
  loadControls(tab, controls);
  activeTabs[tab.id] = controls;
}

function setBadgeOn(tab) {
  chrome.browserAction.setBadgeText({
    text: 'on',
    tabId: tab.id
  });
}

function loadControls(tab, controls) {
  chrome.tabs.executeScript(tab.id, {
    file: controls
  }, (result) => {
    if (result === undefined) {
      setTabOff(tab);
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
  } else if (message.getDisableLoadNextContact) {
    sendResponse(disableLoadNextContact());
  } else if (message.hangup) {
    hangup();
  } else if (message.sendDigit) {
    sendDigit(message.sendDigit);
  } else if (message.dial) {
    dial(message.dial, tab);
  }
});

function dial(number, tab) {
  if (localStorage.getItem('campaignCode') === null) {
    chrome.tabs.sendMessage(tab, 'noCampaignCode');
  } else if (localStorage.getItem('outgoingCallerID') === null) {
    chrome.tabs.sendMessage(tab, 'noOutgoingCallerID');
  } else {
    checkMicrophonePermissions(number, tab);
  }
}

function checkMicrophonePermissions(number, tab) {
  navigator.permissions.query({ name: 'microphone' }).
  then((result) => {
    if (result.state === 'granted') {
      authenticateAndSetup(number, tab);
    } else {
      chrome.tabs.sendMessage(tab, 'noMicrophonePermissions');
    }
  });
}

function authenticateAndSetup(number, tab) {
  getAccessToken().then((accessToken) => {
    var device = setupDevice(accessToken);
    device.tab = tab;
    device.number = number;

    device.on('ready', prepareToConnect);
    device.on('offline', handleOffline);
    device.on('error', ((error) => {
      chrome.extension.getBackgroundPage().console.log(error);
      if (error.code === 31205 || error.code === 31202) { // access token expired
        localStorage.removeItem('accessToken');
        device.removeListener('ready', prepareToConnect);
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

    return fetch('https://' + TWILIO_BASE_URL + '.twil.io/access-token?campaignCode=' + campaignCode + '&accessCode=' + accessCode)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      localStorage.setItem('accessToken', json.token);
      return json.token;
    })
    .catch((error) => {
      Sentry.captureException(error);
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

function prepareToConnect(device) {
  device.removeListener('ready', prepareToConnect);

  var audio = new Audio('outgoing.mp3');
  audio.play();

  var connection = connect(device);
  connection.answered = false;
  connection.tab = device.tab;

  connection.on('accept', () => { connection.answered = true; });
  connection.on('disconnect', handleDisconnect);
}

function connect(device) {
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

function disableLoadNextContact() {
  return JSON.parse(localStorage.getItem('disableLoadNextContact'));
}

function inDevelopmentEnvironment() {
  return chrome.runtime.getManifest().update_url !== undefined;
}
