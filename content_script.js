window.onload = function() {
  var formattedPhone = document.getElementById('current-number').firstElementChild.innerText;
  var phone = formattedPhone.replace(/\D/g,'');

  var dial = confirm('Dial ' + formattedPhone + '?');
  if (dial) {
    chrome.runtime.sendMessage(phone);
  }

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
    if (keyName === 'c') {
      chrome.runtime.sendMessage(phone);
      return;
    }
  });
}
