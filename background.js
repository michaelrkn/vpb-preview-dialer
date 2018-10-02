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
  getToken();
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message === 'getCallOnLoad') {
    sendResponse(JSON.parse(localStorage.getItem('callOnLoad')));
  } else if (message === 'hangup') {
    hangup();
  } else if (message === 'getToken') {
    getToken();
  } else {
    checkConnection().then(() => { dial(message) });
  }
});

function getToken() {
  var campaignCode = localStorage.getItem('campaignCode');
  var accessCode = localStorage.getItem('accessCode');

  return fetch('https://' + campaignCode + '.twil.io/capability-token?accessCode=' + accessCode)
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
    Twilio.Device.setup(json.token);
  });
}

function checkConnection() {
  if (Twilio.Device.status() === 'offline') {
    return getToken();
  } else {
    return Promise.resolve();
  }
}

function dial(number) {
  var params = {
    To: number,
    From: localStorage.getItem('outgoingCallerID')
  };
  Twilio.Device.connect(params);
}

function hangup() {
  Twilio.Device.disconnectAll();
}
