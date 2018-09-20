function confirmDial(formattedPhone) {
  var dial = confirm('Dial ' + formattedPhone + '?');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage(phone);
    }
}

window.onload = function() {
  var numberElement = document.getElementById('current-number');
  if (numberElement) { // make sure they have a phone number
    var phoneLink = numberElement.firstElementChild;
    var formattedPhone = phoneLink.innerText;

    phoneLink.addEventListener('click', (event) => {
      event.preventDefault();
      confirmDial(formattedPhone);
    });
  }

  chrome.runtime.sendMessage('getAskToCall', function(askToCall) {
    if (askToCall && numberElement) {
      confirmDial(formattedPhone);
    }
  });

  var reached = true;
  var switchButton = document.getElementById('switch');
  switchButton.addEventListener('click', function(event) {
    reached = !reached;
  });

  document.addEventListener('keypress', (event) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
      return;
    }

    event.preventDefault();

    var keyName = event.key;
    if (keyName === 'h') {
      chrome.runtime.sendMessage("hangup");
      return;
    }
    if (keyName === 'c' && numberElement) {
      confirmDial(formattedPhone);
      return;
    }

    if (keyName === 'o') {
      var next = document.querySelectorAll('textarea')[0];
      next.focus();
      return;
    }

    if (keyName === 'Enter') {
      var nextContact = document.querySelectorAll('input[value="Save & Next Call"]')[0];
      var nextNumber = document.querySelectorAll('input[value*="Try Number"]')[0];
      if (!nextContact.classList.contains('ng-hide')) {
        nextContact.click();
      } else {
        nextNumber.click();
      }
      chrome.runtime.sendMessage("hangup");
      return;
    }

    if (keyName === 's') {
      var next = document.querySelectorAll('input[value="Skip"]')[0];
      next.click();
      chrome.runtime.sendMessage("hangup");
      return;
    }

    if (keyName === 'e') {
      var next = document.querySelectorAll('input[value="Schedule For Events"]')[0];
      if (next) {
        next.click();
      }
      return;
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
