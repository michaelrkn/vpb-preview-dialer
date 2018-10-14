function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '? Press Enter or click OK to call.');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage({ dial: phone });
    }
}

var observer = new MutationObserver(function(mutations) {
  var phoneLink = document.querySelector('a[href*="tel:"]');
  if (document.contains(phoneLink)) {
    var formattedPhone = phoneLink.href.replace("tel:","");

    phoneLink.addEventListener('click', (event) => {
      event.preventDefault();
      confirmCall(formattedPhone);
    });

    chrome.runtime.sendMessage({ getCallOnLoad: true }, (callOnLoad) => {
      if (callOnLoad && phoneLink) {
        confirmCall(formattedPhone);
      }
    });
  }
});

observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
