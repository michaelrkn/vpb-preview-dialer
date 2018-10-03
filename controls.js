function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '?');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage(phone);
    }
}

function goToNextContact() {
  var nextContact = document.querySelectorAll('input[value="Save & Next Call"]')[0];
  var nextNumber = document.querySelectorAll('input[value*="Try Number"]')[0];
  if (!nextContact.classList.contains('ng-hide')) {
    nextContact.click();
  } else {
    nextNumber.click();
  }
  chrome.runtime.sendMessage('hangup');
}

window.onload = () => {
  var numberElement = document.getElementById('current-number');
  if (numberElement) { // make sure they have a phone number
    var phoneLink = numberElement.firstElementChild;
    var formattedPhone = phoneLink.innerText;

    phoneLink.addEventListener('click', (event) => {
      event.preventDefault();
      confirmCall(formattedPhone);
    });
  }

  chrome.runtime.sendMessage('getCallOnLoad', (callOnLoad) => {
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
    }
  });

  document.addEventListener('keypress', (event) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    event.preventDefault();

    var keyName = event.key;
    if (keyName === 'h') {
      chrome.runtime.sendMessage('hangup');
      return;
    }
    if (keyName === 'c' && numberElement) {
      confirmCall(formattedPhone);
    }

    if (keyName === 'o') {
      var next = document.querySelectorAll('textarea')[0];
      next.focus();
    }

    if (keyName === 'Enter') {
      goToNextContact();
    }

    if (keyName === 's') {
      var skip = document.querySelectorAll('input[value="Skip"]')[0];
      if (skip) {
        skip.click();
        chrome.runtime.sendMessage('hangup');
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
  });
}
