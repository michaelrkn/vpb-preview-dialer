if (chrome.runtime.getManifest().update_url !== undefined) {
  Sentry.init({
    dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962',
    release: '2.0.4'
  });
  Sentry.configureScope(function(scope) {
    scope.setUser({"username": localStorage.getItem('campaignCode')});
  });
}

const TWILIO_BASE_URL = "vpb-dialer-5062";

window.onload = () => {
  var setupForm = document.getElementById('create-campaign');
  setupForm.addEventListener('submit', (event) => {
    event.preventDefault();

    var campaignCode = document.getElementById('campaign-code').value.replace(" ", "");
    var accessCode = document.getElementById('access-code').value.replace(" ", "");
    var twilioAccountSid = document.getElementById('twilio-account-sid').value.replace(" ", "");
    var twilioAccountAuthToken = document.getElementById('twilio-auth-token').value.replace(" ", "");
    var email = document.getElementById('email').value.replace(" ", "");

    fetch('https://' + TWILIO_BASE_URL + '.twil.io/create-account?campaignCode=' + campaignCode + '&accessCode=' + accessCode + '&accountSid=' + twilioAccountSid + '&authToken=' + twilioAccountAuthToken + '&email=' + email)
    .then((response) => {
      return response.json();
    })
    .then((json) => {
      alert(json.message);
      localStorage.setItem('campaignCode', campaignCode);
      localStorage.setItem('accessCode', accessCode);
      localStorage.removeItem('accessToken');
    })
    .catch((response) => {
      alert('Sorry, there was an issue creating your account. Please try again.');
    });
  });
}
