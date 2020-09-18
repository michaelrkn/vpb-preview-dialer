if (chrome.runtime.getManifest().update_url !== undefined) {
  Sentry.init({
    dsn: 'https://ed97abb64b8f40bf969f4c6ad509123c@sentry.io/2650962',
    release: '2.0.4'
  });
  Sentry.configureScope(function(scope) {
    scope.setUser({"username": localStorage.getItem('campaignCode')});
  });
}

window.onload = () => {
  var setupForm = document.getElementById('twilio-connect-button');

  setupForm.addEventListener('click', (event) => {
    // event.preventDefault();

    var campaignCode = document.getElementById('campaign-code').value.replace(" ", "");
    var accessCode = document.getElementById('access-code').value.replace(" ", "");

    localStorage.setItem('campaignCode', campaignCode);
    localStorage.setItem('accessCode', accessCode);

    var metaData = { userCampaignCode : campaignCode, userAccessCode: accessCode };
    const authUrl = "https://www.twilio.com/authorize/CN17f6c43d2f65609cf03f2fbcf19b132d";
    setupForm.setAttribute("href", authUrl + "?state=" + encodeURIComponent(JSON.stringify(metaData)));
}
