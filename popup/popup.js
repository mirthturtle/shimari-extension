const host = "localhost:3000"   // "mirthturtle.com"
const url = `http://${host}/extension_status`;

chrome.cookies.getAll({ domain: host }, function (cookies) {
  console.log('cookies', cookies);   // _mirthturtle_session

  chrome.runtime.sendMessage(
    // calls the service worker
    { action: "getShimariStatus", url, cookies },
    response => {
      console.log('response', response);

      if (response.logged_in) {
        console.log("Logged in");

        document.getElementById('username').innerHTML = response.username;
        document.getElementById('logged-in').style.display = 'block';

      } else if (response.logged_in == false) {
        console.log("Logged out");
        document.getElementById('not-logged-in').style.display = 'block';

      } else {
        console.error("Fetch request failed");
        document.getElementById('error-general').style.display = 'block';
      }
    }
  );
});

// Links to site
document.getElementById('shimari-link').addEventListener('click', function() {
  chrome.runtime.sendMessage(
    { action: "shimari" });
}, false);
document.getElementById('notlog-text').addEventListener('click', function() {
  chrome.runtime.sendMessage(
    { action: "shimari" });
}, false);
