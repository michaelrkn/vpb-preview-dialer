scrollToFirstContact();
setupCallInterface();
handleCallResponses();
setupKeyboardShortcuts();
watchForResultsSubmission();
hangupBeforeUnload();

function scrollToFirstContact() {
  document.querySelector('.custom_listing').scrollIntoView();
}

function setupCallInterface() {
  if (phoneLink()) {
    phoneLink().addEventListener('click', (event) => {
      event.preventDefault();
      confirmCall(formattedPhone());
    });

    chrome.runtime.sendMessage({ getCallOnLoad: true }, (callOnLoad) => {
      if (callOnLoad && formattedPhone()) {
        confirmCall(formattedPhone());
      }
    });
  }
}

function phoneLink() {
  return document.querySelector("a[href^='tel:']");
}

function formattedPhone() {
  return phoneLink().innerText.slice(0, 14);
}

function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '? Press Enter or click OK to call.');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage({ dial: phone });
    }
}

function handleCallResponses() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'unanswered') {
      notHomeOption().click();
      chrome.runtime.sendMessage({ getDevelopment: true }, (development) => {
        if (!development) {
          goToNextContact();
        }
      });
    } else if (message === 'noCampaignCode') {
      alert("You haven't set up the Preview Dialer. Right-click the V icon next to your address bar and choose Options, and then set your campaign code, access code, and phone number.");
    } else if (message === 'noOutgoingCallerID') {
      alert("You haven't set an outgoing Caller ID. Right-click the V icon next to your address bar and choose Options, and then enter the phone number you'd like to show up when you make calls.");
    } else if (message === 'noMicrophonePermissions') {
      alert("You haven't given permission to use your microphone. Right-click the V icon next to your address bar and choose Options, and when asked to use your microphone, click Allow.");
    }
  });
}

function notHomeOption() {
  return document.querySelector('input[value="7"]');
}

function goToNextContact() {
  hangup();
  nextContact().click();
}

function hangup() {
  chrome.runtime.sendMessage({ hangup: true });
}

function nextContact() {
  return document.querySelector('input[value="Log call and remove from list"]');
}

function setupKeyboardShortcuts() {
  document.addEventListener('keypress', (event) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();

    var keyName = event.key;

    if (keyName === 'Enter') {
      goToNextContact();
    }

    if (keyName === 'c' && phoneLink()) {
      confirmCall(formattedPhone());
    }

    if (keyName === 'h') { hangup(); }

    if (keyName === 'n') {
      document.querySelector('input[value="7"]').click();
    }

    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(keyName)) {
      chrome.runtime.sendMessage({ sendDigit: keyName });
    }
  });
}

function watchForResultsSubmission() {
  var observer = new MutationObserver(function(mutations) {
    if (displaysFlashMessage(mutations)) {
      location.reload();
    }
  });
  observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
}

function displaysFlashMessage(mutations) {
  return mutations[0].target.id === 'flash-container';
}

function hangupBeforeUnload() {
  window.addEventListener("beforeunload", (event) => {
    hangup();
  });
}
