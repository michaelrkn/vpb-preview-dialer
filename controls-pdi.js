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
  return mutations.length > 20;
}

function notHomeSelection() {
  return document.querySelector('input[value="Not Home"]');
}

function skipButton() {
  return document.getElementById('btnSkip');
}

function goToNextContact() {
  hangup();
  nextButton().click();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'unanswered') {
    notHomeSelection().click();
    goToNextContact();
  }  else if (message === 'noCampaignCode') {
    alert("You haven't set up the Preview Dialer. Click the V icon next to your address bar, then Options, and then set your campaign code, access code, and phone number.");
  } else if (message === 'noOutgoingCallerID') {
    alert("You haven't set an outgoing Caller ID. Click the V icon next to your address bar, then Options, and then enter the phone number you'd like to show up when you make calls.");
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

document.addEventListener('keypress', (event) => {
  if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.type === 'text' || document.activeElement.type === 'password') {
    return;
  }

  event.preventDefault();

  var keyName = event.key;

  if (keyName === 'Enter') { goToNextContact(); }
  if (keyName === 'c') { confirmCall(phoneNumberFormatted()); }
  if (keyName === 'h') { hangup(); }

  if (keyName === 's') {
    var skip = skipButton();
    if (skip) {
      skip.click();
    }
  }

  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(keyName)) {
    chrome.runtime.sendMessage({ sendDigit: keyName });
  }
});
