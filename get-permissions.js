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
  });

  var form = document.getElementById('verify-phone');
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    var phone = document.getElementById('number').value;
    fetch('https://cardinal-moose-3646.twil.io/verify-caller-id?phone=' + phone)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if (json.code === 21450) {
        alert('Your Caller ID is set.');
      } else {
        alert('When called, enter ' + json.code + ' when asked for your verification code.');
      }
    });
  }, false);
}
