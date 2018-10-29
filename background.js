window.LogRocket && window.LogRocket.init('0bvywm/preview-dialer');

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

  return fetch('https://' + campaignCode + '.twil.io/capability-token?accessCode=' + accessCode)
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    var device = Twilio.Device.setup(json.token, {
      enableRingingState: true
    });
    device.audio.outgoing(false);
  });
}

function call(number, tab) {
  checkConnection().then(() => {
    var connection = dial(number);
    connection.answered = false;
    connection.tab = tab;

    connection.on('accept', () => { connection.answered = true; });
    connection.on('disconnect', handleDisconnect);

    var audio = new Audio('https://media.twiliocdn.com/sdk/js/client/sounds/releases/1.0.0/outgoing.mp3');
    audio.play();
  });
}

function checkConnection() {
  if (Twilio.Device.status() === 'offline') {
    return setupConnection();
  } else {
    return Promise.resolve();
  }
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
