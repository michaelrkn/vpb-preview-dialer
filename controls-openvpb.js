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
  hangup();
  var nextContact = document.querySelector('.panel-buttons.left button.btn.btn-blue');
  nextContact.click();
}

function insertsContactData(mutations) {
  if (mutations[2]) {
    return mutations[2].addedNodes[0].classList.value === "col-md-9 app-data-container openvpb-data-container"
  }
}

function notHomeSelection() {
  return document.getElementById('result-1');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === 'unanswered') {
    if (!notHomeSelection()) { document.querySelector('.contact-toggle').click(); }
    notHomeSelection().click();
    goToNextContact();
  } else if (message === 'noOutgoingCallerID') {
    alert("You haven't set an outgoing Caller ID. Click the V icon next to your address bar, then Options, and then enter the phone number you'd like to show up when you make calls.");
  }
});

var observer = new MutationObserver(function(mutations) {
  if (insertsContactData(mutations)) {
    var phoneLink = document.querySelector('a[href*="tel:"]');
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

    document.addEventListener('keypress', (event) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      event.preventDefault();

      var keyName = event.key;

      if (keyName === 'h') { hangup(); }

      if (keyName === 's') {
        var skip = document.querySelectorAll('.script-footer.panel-buttons .btn.btn-gray')[1];
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
        if (!notHomeSelection()) {
          document.querySelector('.contact-toggle').click();
        }
        var element = document.getElementById('result-' + status);
        element.click();
      }

      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#'].includes(keyName)) {
        chrome.runtime.sendMessage({ sendDigit: keyName });
      }
    });
  }
});

observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
