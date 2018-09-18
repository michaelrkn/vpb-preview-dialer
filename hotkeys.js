function setupHotkeys() {
  var reached = true;

  document.addEventListener('keypress', (event) => {
    if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
      return;
    }

    event.preventDefault();

    var keyName = event.key;

    if (keyName === 'c') {
      var formattedPhone = document.getElementById('current-number').firstElementChild.innerText;
      var phone = formattedPhone.replace('(','').replace(')','').replace(' ','').replace('-','');
      chrome.runtime.sendMessage(phone);
      return;
    }

    if (keyName === 'h') {
      chrome.runtime.sendMessage("hangup");
      return;
    }
  });
}
window.onload = setupHotkeys;
