window.onload = function() {
  var formattedPhone = document.getElementById('current-number').firstElementChild.innerText;
  var dial = confirm('Dial ' + formattedPhone + '?');

  if (dial) {
    listenForH()
    var phone = formattedPhone.replace('(','').replace(')','').replace(' ','').replace('-','');
    chrome.runtime.sendMessage(phone);
  }
}

function listenForH() {
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
  });
}
