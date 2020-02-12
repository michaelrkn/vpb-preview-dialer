window.LogRocket && window.LogRocket.init('0bvywm/preview-dialer');

window.onload = () => {
  document.getElementById('campaign-code').value = this.localStorage.getItem('campaignCode');
  document.getElementById('access-code').value = this.localStorage.getItem('accessCode');
  document.getElementById('number').value = localStorage.getItem('outgoingCallerID');
  document.getElementById('callOnLoad').checked = JSON.parse(localStorage.getItem('callOnLoad'));
  document.getElementById('ringUntilVoicemail').checked = JSON.parse(localStorage.getItem('ringUntilVoicemail'));

  navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => stream.getTracks()[0].stop()); // get microphone permissions

  var setupForm = document.getElementById('campaign-setup');
  setupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    var campaignCode = document.getElementById('campaign-code').value.replace(" ", "");
    var accessCode = document.getElementById('access-code').value.replace(" ", "");

    updateTwilioSubdomain()
    .then(() => fetch('https://' + localStorage.getItem('twilioSubdomain') + '.twil.io/capability-token?accessCode=' + accessCode))
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      alert('You\'re all set up! Make sure to set your caller ID before calling.');
      localStorage.setItem('campaignCode', campaignCode);
      localStorage.setItem('accessCode', accessCode);
      chrome.runtime.sendMessage({ setupConnection: true });
    })
    .catch((response) => {
      alert('Sorry, the campaign or access code you entered was incorrect.');
    });
  });

  var phoneForm = document.getElementById('verify-phone');
  phoneForm.addEventListener('submit', (event) => {
    event.preventDefault();

    var phone = document.getElementById('number').value.replace(/\D/g,'');
    var campaignCode = localStorage.getItem('campaignCode');

    if (phone.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
    } else if (!campaignCode) {
      alert('Set your campaign and access codes before setting your caller ID.')
    } else {
      updateTwilioSubdomain()
      .then(() => fetch('https://' + localStorage.getItem('twilioSubdomain') + '.twil.io/verify-caller-id?phone=' + phone))
      .then(async (response) => {
        if (response.status === 400) {
          alert('Invalid phone number. Please check that your phone number is entered correctly, and try again.')
          document.forms["verify-phone"].elements.item('number').focus()
        }
        const json = await response.json();
        if (json.code === 21450) {
          setCallerID(phone);
        } else {
          var verificationCode = json.verificationCode;
          var checkVerification = confirm('When called, enter ' + verificationCode + ' when asked for your verification code. Click OK after verifying, or Cancel to enter a new number.');
          if (checkVerification) {
            checkCallerID(phone, verificationCode, localStorage.getItem('twilioSubdomain'));
          }
        }
      })
    }
  }, false);

  document.getElementById('callOnLoad').onclick = (event) => {
    localStorage.setItem('callOnLoad', document.getElementById('callOnLoad').checked);
  }

  document.getElementById('ringUntilVoicemail').onclick = (event) => {
    localStorage.setItem('ringUntilVoicemail', document.getElementById('ringUntilVoicemail').checked);
  }
}

function setCallerID(phone) {
  alert('Your Caller ID is set.');
  localStorage.setItem('outgoingCallerID', phone);
}

function checkCallerID(phone, verificationCode, twilioSubdomain) {
  fetch('https://' + twilioSubdomain + '.twil.io/check-caller-id?phone=' + phone)
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    if (json.verified) {
      setCallerID(phone);
    } else {
      checkAgain = confirm('Your caller ID is not verified. Your code was ' + verificationCode + '. If you clicked OK before entering the code, enter it and click OK to check again. If you did not get a verification call, click Cancel, check the phone number you entered, and try again.');
      if (checkAgain) {
        checkCallerID(phone, verificationCode, twilioSubdomain);
      }
    }
  });
}

function updateTwilioSubdomain() {
  var twilioSubdomain = localStorage.getItem('twilioSubdomain');

  if(!twilioSubdomain) {
    return fetch('https://' + campaignCode + '.twil.io/legacy-update')
    .then(resp => resp.json())
    .then(payload => {
      localStorage.setItem('twilioSubdomain', payload.twilioSubdomain)
    })
  }

  return Promise.resolve()
}