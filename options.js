window.onload = function() {
  document.getElementById('number').value = localStorage.getItem('outgoingCallerID');
  document.getElementById('callOnLoad').checked = localStorage.getItem('callOnLoad');

  navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => stream.getTracks()[0].stop()); // get microphone permissions

  fetch('https://cardinal-moose-3646.twil.io/capability-token').then(function(response) {
    return response.json();
  })
  .then(function(json) {
    Twilio.Device.setup(json.token);
  });

  var form = document.getElementById('verify-phone');
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    var phone = document.getElementById('number').value.replace(/\D/g,'');
    fetch('https://cardinal-moose-3646.twil.io/verify-caller-id?phone=' + phone)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      if (json.code === 21450) {
        alert('Your Caller ID is set.');
      } else {
        alert('When called, enter ' + json.verificationCode + ' when asked for your verification code.');
      }
      localStorage.setItem('outgoingCallerID', phone);
    });
  }, false);

  document.getElementById('callOnLoad').onclick = function(event) {
    localStorage.setItem('callOnLoad', document.getElementById('callOnLoad').checked);
  }
}
