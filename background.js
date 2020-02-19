Sentry.init({ dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962' });

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    localStorage.setItem('callOnLoad', true);
    chrome.tabs.create({
      url: chrome.extension.getURL('options.html'),
      active: true
    });
  }
});

chrome.runtime.onStartup.addListener((details) => {
  setupConnection();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  var tab = sender.tab.id;
  if (message.getCallOnLoad) {
    sendResponse(JSON.parse(localStorage.getItem('callOnLoad')));
  } else if (message.getDevelopment) {
    sendResponse(chrome.runtime.getManifest().update_url === undefined);
  } else if (message.hangup) {
    hangup();
  } else if (message.setupConnection) {
    setupConnection();
  } else if (message.sendDigit) {
    sendDigit(message.sendDigit);
  } else if (message.dial) {
    call(message.dial, tab);
  }
});

function setupConnection() {
  var campaignCode = localStorage.getItem('campaignCode');
  var accessCode = localStorage.getItem('accessCode');

  return fetch('https://' + campaignCode + '.twil.io/access-token?accessCode=' + accessCode)
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    var device = Twilio.Device.setup(json.token, {
      enableRingingState: true
    });
    device.audio.outgoing(false);
    return device;
  });
}

Twilio.Device.on('error', function(error) {
  if (error.code === 31205) { // token expired: https://github.com/twilio/twilio-client.js/issues/73
    setupConnection();
  }
});

function call(number, tab) {
  if (localStorage.getItem('campaignCode') === null) {
    chrome.tabs.sendMessage(tab, 'noCampaignCode');
  } else if (localStorage.getItem('outgoingCallerID') === null) {
    chrome.tabs.sendMessage(tab, 'noOutgoingCallerID');
  } else if (!Twilio.Device.isInitialized || Twilio.Device.status() === 'offline') {
    setupConnection().then((device) => {
      device.on('ready', function() {
        prepareDial(number, tab);
      });
    });
  } else {
    prepareDial(number, tab);
  }
}

function prepareDial(number, tab) {
  hangup();
  var connection = dial(number);
  connection.answered = false;
  connection.tab = tab;

  connection.on('accept', () => { connection.answered = true; });
  connection.on('disconnect', handleDisconnect);

  var audio = new Audio('https://sdk.twilio.com/sdk/js/client/sounds/releases/1.0.0/outgoing.mp3');
  audio.play();
}

function dial(number) {
  var params = {
    To: number,
    From: localStorage.getItem('outgoingCallerID'),
    RingUntilVoicemail: JSON.parse(localStorage.getItem('ringUntilVoicemail'))
  };
  return Twilio.Device.connect(params);
}

function hangup() {
  var connection = Twilio.Device.activeConnection();
  if (connection) {
    connection.removeListener('disconnect', handleDisconnect);
    connection.disconnect();
  }
}

function handleDisconnect(connection) {
  if (!connection.answered) {
    chrome.tabs.sendMessage(connection.tab, 'unanswered');
  }
}

function sendDigit(digit) {
  var connection = Twilio.Device.activeConnection();
  if (connection) {
    connection.sendDigits(digit);
  }
}
