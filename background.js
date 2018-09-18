chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.extension.getURL("get-permissions.html"),
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

chrome.runtime.onMessage.addListener(function(message) {
  if (message === "hangup") {
    hangup();
  } else {
    dial(message);
  }
});

function dial(number) {
  var params = {
    To: number
  };
  Twilio.Device.connect(params);
}

function hangup() {
  Twilio.Device.disconnectAll();
}
