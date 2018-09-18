window.onload = function() {
  fetch('https://cardinal-moose-3646.twil.io/capability-token').then(function(response) {
    return response.json();
  })
  .then(function(json) {
    Twilio.Device.setup(json.token);
  });

  Twilio.Device.ready(function() {
    Twilio.Device.connect();
    Twilio.Device.disconnectAll();
    window.close();
  });
}
