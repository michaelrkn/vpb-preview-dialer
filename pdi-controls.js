function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '? Press Enter or click OK to call.');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage({ dial: phone });
    }
}

function phoneNumberFormatted() {
  return phoneElement().innerText;
}

function phoneElement() {
  return document.getElementById('phone-voter');
}

function insertsContactData(mutations) {
  if (mutations[1] && mutations[1].addedNodes && mutations[1].addedNodes[0].childNodes[1]) {
    return mutations[1].addedNodes[0].childNodes[1].className === 'call-info';
  }
}

var observer = new MutationObserver(function(mutations) {
  if (insertsContactData(mutations)) {
    phoneElement().addEventListener('click', (event) => {
      event.preventDefault();
      confirmCall(phoneNumberFormatted());
    });

    chrome.runtime.sendMessage({ getCallOnLoad: true }, (callOnLoad) => {
      if (callOnLoad) {
        confirmCall(phoneNumberFormatted());
      }
    });
  }
});

observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
