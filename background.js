chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    localStorage.setItem('askToCall', true);
    chrome.tabs.create({
      url: chrome.extension.getURL("options.html"),
      active: true
    });
  }
});

window.onload = function() {
  fetch('https://cardinal-moose-3646.twil.io/capability-token').then(function(response) {
    return response.json();
  })
  .then(function(json) {
    Twilio.Device.setup(json.token);
  });
};

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message === 'getAskToCall') {
    sendResponse(JSON.parse(localStorage.getItem('askToCall')));
  } else if (message === "hangup") {
    hangup();
  } else {
    dial(message);
  }
});

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
