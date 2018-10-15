function confirmCall(formattedPhone) {
  var dial = confirm('Call ' + formattedPhone + '? Press Enter or click OK to call.');
    if (dial) {
      var phone = formattedPhone.replace(/\D/g,'');
      chrome.runtime.sendMessage({ dial: phone });
    }
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
    alert('not home!');
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
  }
});

observer.observe(document, { attributes: false, childList: true, characterData: false, subtree: true });
