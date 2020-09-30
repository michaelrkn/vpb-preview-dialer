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
  var testForm = document.getElementById('test-dial');
  testForm.addEventListener('submit', (event) => {
    event.preventDefault();
    var number = document.getElementById('test-number').value.replace(" ", "");
    chrome.runtime.sendMessage({ dial: number });
  });
}
