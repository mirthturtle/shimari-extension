const host = "localhost:3000"   // "mirthturtle.com"
const url = `http://${host}/extension_status`;

// on popup click, get cookies & send request for info to backend
chrome.cookies.getAll({ domain: host }, function (cookies) {
  chrome.runtime.sendMessage(
    // calls the service worker
    { action: "getShimariStatus", cookies },
    response => {
      console.log('response', response);

      if (response.logged_in) {
        console.log("Logged in on the popup");

        document.getElementById('log-text').innerHTML = `Hi, ${response.username}.`;
        document.getElementById('log-text').style.display = 'inline-block';
        document.getElementById('notlog-text').style.display = 'none';

        // set the settings statuses
        document.getElementById('review-indicator').innerHTML  = response.discipline_review ? '⚪' : '⚫';
        document.getElementById('focus-indicator').innerHTML   = response.discipline_focus ? '⚪' : '⚫';
        document.getElementById('effects-indicator').innerHTML = response.resign_effects ? '⚪' : '⚫';

      } else if (response.logged_in == false) {
        console.log("Logged out on the popup");
        document.getElementById('notlog-text').style.display = 'inline-block';

      } else {
        console.error("Request failed on the popup");
        document.getElementById('error-general').style.display = 'inline-block';
      }
    }
  );
});

// Attach links to site
let element;
['shimari-link'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToGoSite" });
    }, false);
  }
});

['turtle-logo'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToMainSite" });
    }, false);
  }
});

['notlog-text'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToGoLogin" });
    }, false);
  }
});
