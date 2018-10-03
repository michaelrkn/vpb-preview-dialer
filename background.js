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

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  var tab = sender.tab.id;
  if (message === 'getCallOnLoad') {
    sendResponse(JSON.parse(localStorage.getItem('callOnLoad')));
  } else if (message === 'hangup') {
    hangup();
  } else if (message === 'setupConnection') {
    setupConnection();
  } else {
    call(message, tab);
  }
});

function setupConnection() {
  var campaignCode = localStorage.getItem('campaignCode');
  var accessCode = localStorage.getItem('accessCode');

  return fetch('https://' + campaignCode + '.twil.io/capability-token?accessCode=' + accessCode)
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
    var device = Twilio.Device.setup(json.token, {
      enableRingingState: true
    });
  });
}

function call(number, tab) {
  checkConnection().then(() => {
    var connection = dial(number);
    handleUnanswered(connection, tab);
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
    From: localStorage.getItem('outgoingCallerID')
  };
  return Twilio.Device.connect(params);
}

function hangup() {
  Twilio.Device.disconnectAll();
}

function handleUnanswered(connection, tab) {
  var answered = false;
  connection.on('accept', function() {
    answered = true;
  });
  connection.on('disconnect', function() {
    if (!answered) {
      chrome.tabs.sendMessage(tab, 'unanswered');
    }
  });
}
