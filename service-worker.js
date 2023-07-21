// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).

console.log("service worker (background script)")

const prod = false;
const host = prod ? "mirthturtle.com" : "localhost:3000";
const url = `http${prod ? 's' : ''}://${host}/extension_status`;

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Returns logged-in status & settings
  if (message.action === "getShimariStatus") {
    const { cookies } = message;

    getStatusWithCookies(cookies, sendResponse);
    return true; // Indicates that the response will be sent asynchronously

  } else if( message.action === "goToGoSite" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go'
    });

  } else if( message.action === "goToMainSite" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com'
    });

  } else if( message.action === "goToGoLogin" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go/login'
    });

  } else if( message.action === "refreshForWidget" ) {
    chrome.cookies.getAll({ domain: host }, function (cookies) {
      getStatusWithCookies(cookies, sendResponse);
    });
    return true;
  }
});

function getStatusWithCookies(cookies, sendResponse) {
  fetch(url, {
    headers: {
      Cookie: cookies
    },
    credentials: 'include'
  })
  .then((response) => response.json())
  .then((json) => {
    console.log('Response from API', json);

    // Save it using the Chrome extension storage API.
    chrome.storage.sync.set(json, function() {
      console.log('Status saved.');
      sendResponse(json);
    });
  });
}
