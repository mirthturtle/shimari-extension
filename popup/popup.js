const host = "localhost:3000"   // "mirthturtle.com"
const url = `http://${host}/extension_status`;

chrome.cookies.getAll({ domain: url }, function (cookies) {
  chrome.runtime.sendMessage(
    // calls the service worker
    { action: "getShimariStatus", cookies },
    response => {
      console.log('response', response);

      if (response.logged_in) {
        console.log("Logged in on the popup");

        document.getElementById('username').innerHTML = response.username;
        document.getElementById('logged-in').style.display = 'block';
        document.getElementById('not-logged-in').style.display = 'none';

      } else if (response.logged_in == false) {
        console.log("Logged out on the popup");
        document.getElementById('not-logged-in').style.display = 'block';

      } else {
        console.error("Request failed on the popup");
        document.getElementById('error-general').style.display = 'block';
      }
    }
  );
});

// Links to site
let element;
['shimari-link', 'nolog', 'notlog-text'].forEach(ele => {
  element = document.getElementById(ele);
  if (element) {
    element.addEventListener('click', function() {
      chrome.runtime.sendMessage(
        { action: "shimari" });
    }, false);
  }
});

