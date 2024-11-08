// const url = `http://localhost:3000/go/learners/extension`;
const url = `https://mirthturtle.com/go/learners/extension`;

// on popup click, send request for info to backend
chrome.runtime.sendMessage(
  // calls the service worker
  { action: "getShimariStatus" },
  response => {
    console.log('response', response);

    if (response.logged_in) {
      console.log("Logged in on the popup");

      document.getElementById('connecting-msg').style.display = 'none';
      document.getElementById('log-text').innerHTML = `Welcome, ${response.username}.`;
      document.getElementById('log-text').style.display = 'inline-block';
      document.getElementById('edit-settings-link').style.display = 'inline-block';

      // set the settings statuses
      document.getElementById('review-indicator').innerHTML  = response.discipline_review ? '⚪' : '⚫';
      document.getElementById('focus-indicator').innerHTML   = response.discipline_focus ? '⚪' : '⚫';
      document.getElementById('effects-indicator').innerHTML = response.resign_effects ? '⚪' : '⚫';

    } else if (response.logged_in == false) {
      console.log("Logged out on the popup");

      document.getElementById('connecting-msg').style.display = 'none';
      document.getElementById('notlog-text').style.display = 'inline-block';

    } else {
      console.error("Request failed on the popup");
      document.getElementById('connecting-msg').style.display = 'none';
      document.getElementById('error-general').style.display = 'inline-block';
    }
  }
);

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

['source-link'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToSourceCode" });
    }, false);
  }
});

['edit-settings-link'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToSettingsPage" });
    }, false);
  }
});

['pregame-link'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "goToPregame" });
    }, false);
  }
});

