if (chrome.runtime.getManifest().update_url !== undefined) {
  Sentry.init({
    dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962',
    release: '2.0.4'
  });
  Sentry.configureScope(function(scope) {
    scope.setUser({"username": localStorage.getItem('userCampaignCode')});
  });
}

window.onload = () => {
  document.getElementById('user-campaign-code').value = this.localStorage.getItem('userCampaignCode');
  document.getElementById('user-access-code').value = this.localStorage.getItem('userAccessCode');
  document.getElementById('number').value = localStorage.getItem('outgoingCallerID');
  document.getElementById('callOnLoad').checked = JSON.parse(localStorage.getItem('callOnLoad'));
  document.getElementById('ringUntilVoicemail').checked = JSON.parse(localStorage.getItem('ringUntilVoicemail'));

  navigator.mediaDevices.getUserMedia({audio: true}). // get microphone permissions
  then((stream) => stream.getTracks()[0].stop()). // request microphone permissions
  catch((error) => {
    if (error.name === 'NotAllowedError') {
      alert("You can't use the Preview Dialer if you don't give permission to use your microphone. Click the microphone icon on the right side of your address bar and click Allow.");
    }
  });

  // // TODO: 1) Add state to the url here to pass campaign code and access code, 2) add a new chrome extension url to redirect connect to which then submits all of this

  var setupForm = document.getElementById('twilio-connect-button');

  setupForm.addEventListener('click', (event) => {
    // event.preventDefault();

    var userCampaignCode = document.getElementById('user-campaign-code').value.replace(" ", "");
    var userAccessCode = document.getElementById('user-access-code').value.replace(" ", "");

    localStorage.setItem('userCampaignCode', userCampaignCode);
    localStorage.setItem('userAccessCode', userAccessCode);

    var metaData = { userCampaignCode : userCampaignCode, userAccessCode: userAccessCode };
    const authUrl = "https://www.twilio.com/authorize/CN17f6c43d2f65609cf03f2fbcf19b132d";
    setupForm.setAttribute("href", authUrl + "?state=" + encodeURIComponent(JSON.stringify(metaData)));

    console.log(userCampaignCode, userAccessCode);

    //TODO put this in env variables
    var masterCampaignCode = "test-1163";

// Reusing as a credentials check , doesn't even save the token  and would be nice to get rid of capability token
    fetch('https://' + campaignCode + '.twil.io/capability-token?accessCode=' + accessCode)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      alert('You\'re all set up! Make sure to set your caller ID before calling.');
      localStorage.setItem('campaignCode', campaignCode);
      localStorage.setItem('accessCode', accessCode);
      localStorage.removeItem('accessToken');
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
      fetch('https://' + campaignCode + '.twil.io/verify-caller-id?phone=' + phone)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        if (json.code === 21450) {
          setCallerID(phone);
        } else if (json.status === 400) {
          alert(json.message);
        } else if (json.verificationCode) {
          var verificationCode = json.verificationCode;
          var checkVerification = confirm('When called, enter ' + verificationCode + ' when asked for your verification code. Click OK after verifying, or Cancel to enter a new number.');
          if (checkVerification) {
            checkCallerID(phone, verificationCode, campaignCode);
          }
        } else {
          alert("There was an unexpected error: " + json.message);
        }
      })
      .catch((error) => {
        Sentry.captureException(error);
        alert("There was an unexpected error. Sorry!");
      });
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

function checkCallerID(phone, verificationCode, campaignCode) {
  fetch('https://' + campaignCode + '.twil.io/check-caller-id?phone=' + phone)
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    if (json.verified) {
      setCallerID(phone);
    } else {
      checkAgain = confirm('Your caller ID is not verified. Your code was ' + verificationCode + '. If you clicked OK before entering the code, enter it and click OK to check again. If you did not get a verification call, click Cancel, check the phone number you entered, and try again.');
      if (checkAgain) {
        checkCallerID(phone, verificationCode, campaignCode);
      }
    }
  });
}
