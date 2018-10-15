function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '? Press Enter or click OK to call.');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage({ dial: phone });
    }
}

function hangup() {
  chrome.runtime.sendMessage({ hangup: true });
}

function phoneNumberFormatted() {
  return phoneElement().innerText;
}

function phoneElement() {
  return document.getElementById('phone-voter');
}

function nextButton() {
  return document.getElementById('btnSave');
}

function insertsContactData(mutations) {
  if (mutations[1] && mutations[1].addedNodes && mutations[1].addedNodes[0].childNodes[1]) {
    return mutations[1].addedNodes[0].childNodes[1].className === 'call-info';
  }
}

function notHomeSelection() {
  return document.querySelector('input[value="Not Home"]');
}

function goToNextContact() {
  hangup();
  nextButton().click();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'unanswered') {
    notHomeSelection().click();
    goToNextContact();
  }
});

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
