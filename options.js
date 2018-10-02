window.onload = function() {
  document.getElementById('campaign-code').value = this.localStorage.getItem('campaignCode');
  document.getElementById('access-code').value = this.localStorage.getItem('accessCode');
  document.getElementById('number').value = localStorage.getItem('outgoingCallerID');
  document.getElementById('callOnLoad').checked = localStorage.getItem('callOnLoad');

  navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => stream.getTracks()[0].stop()); // get microphone permissions

  var setupForm = document.getElementById('campaign-setup');
  setupForm.addEventListener('submit', function(event) {
    event.preventDefault();
    var campaignCode = document.getElementById('campaign-code').value;
    var accessCode = document.getElementById('access-code').value;

    fetch('https://' + campaignCode + '.twil.io/capability-token?accessCode=' + accessCode)
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      alert('You're all set up! Make sure to read the keyboard commands on the right, and review the options below.');
      localStorage.setItem('campaignCode', campaignCode);
      localStorage.setItem('accessCode', accessCode);
      chrome.runtime.sendMessage('getToken');
    })
    .catch(function(response) {
      alert('Sorry, the campaign or access code you entered was incorrect.');
    });
  });

  var phoneForm = document.getElementById('verify-phone');
  phoneForm.addEventListener('submit', function(event) {
    event.preventDefault();

    var phone = document.getElementById('number').value.replace(/\D/g,'');
    var campaignCode = localStorage.getItem('campaignCode');

    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
    } else if (!campaignCode) {
      alert('Set your campaign and access codes before setting your caller ID.')
    } else {
      fetch('https://' + campaignCode + '.twil.io/verify-caller-id?phone=' + phone)
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
    }
  }, false);

  document.getElementById('callOnLoad').onclick = function(event) {
    localStorage.setItem('callOnLoad', document.getElementById('callOnLoad').checked);
  }
}
