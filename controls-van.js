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

function goToNextContact() {
  var nextContact = document.querySelectorAll('input[value="Save & Next Call"]')[0];
  var nextNumber = document.querySelectorAll('input[value*="Try Number"]')[0];
  if (!nextContact.classList.contains('ng-hide')) {
    nextContact.click();
  } else {
    nextNumber.click();
  }
}

window.addEventListener("beforeunload", (event) => {
  hangup();
});

window.addEventListener("load", (event) => {
  var numberElement = document.getElementById('current-number');
  if (numberElement) {
    var phoneLink = numberElement.firstElementChild;
    var formattedPhone = phoneLink.innerText;

    phoneLink.addEventListener('click', (event) => {
      event.preventDefault();
      confirmCall(formattedPhone);
    });
  }

  chrome.runtime.sendMessage({ getCallOnLoad: true }, (callOnLoad) => {
    if (callOnLoad && numberElement) {
      confirmCall(formattedPhone);
    }
  });

  var reached = true;
  var switchButton = document.getElementById('switch');
  switchButton.addEventListener('click', (event) => {
    reached = !reached;
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === 'unanswered') {
      if (reached) { switchButton.click(); }
      var element = document.querySelectorAll('input[name="resultCodeId"][value="1"]')[0];
      element.click();
      goToNextContact();
    }  else if (message === 'noCampaignCode') {
      alert("You haven't set up the Preview Dialer. Click the V icon next to your address bar, then Options, and then set your campaign code, access code, and phone number.");
    } else if (message === 'noOutgoingCallerID') {
      alert("You haven't set an outgoing Caller ID. Click the V icon next to your address bar, then Options, and then enter the phone number you'd like to show up when you make calls.");
    }
  });

  document.addEventListener('keypress', (event) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();

    var keyName = event.key;

    if (keyName === 'Enter') {
      goToNextContact();
    }

    if (keyName === 'c' && numberElement) { confirmCall(formattedPhone); }
    if (keyName === 'h') { hangup(); }

    if (keyName === 's') {
      var skip = document.querySelectorAll('input[value="Skip"]')[0];
      if (skip) {
        skip.click();
      }
    }
    if (keyName === 'o') {
      var textarea = document.querySelectorAll('textarea')[0];
      if (textarea) {
        textarea.focus();
      }
    }
    if (keyName === 'e') {
      var schedule = document.querySelectorAll('input[value="Schedule For Events"]')[0];
      if (schedule) {
        schedule.click();
      }
    }

    var status = {
      n: 1,
      r: 2,
      m: 5,
      b: 18,
      w: 20,
      d: 25,
      l: 31
    }[keyName];

    if (status) {
      if (reached) {
        switchButton.click();
      }
      var element = document.querySelectorAll('input[name="resultCodeId"][value="' + status + '"]')[0];
      element.click();
    }

    if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(keyName)) {
      chrome.runtime.sendMessage({ sendDigit: keyName });
    }
  });
});
