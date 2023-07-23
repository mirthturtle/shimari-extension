// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).

console.log("Service worker (background script)")

const prod = false;
const host = prod ? "mirthturtle.com" : "localhost:3000";
const statusUrl = `http${prod ? 's' : ''}://${host}/go/learners/extension`;
const syncUrl = `http${prod ? 's' : ''}://${host}/go/learners/sync_all.json`;

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Returns logged-in status & settings
  if (message.action === "getShimariStatus") {
    getStatusForExtension(sendResponse);
    return true; // Indicates that the response will be sent asynchronously

  } else if ( message.action === "goToGoSite" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go'
    });

  } else if ( message.action === "goToMainSite" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com'
    });

  } else if ( message.action === "goToGoLogin" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go/login'
    });

  } else if ( message.action === "refreshForWidget" ) {
    getStatusForExtension(sendResponse);
    return true;

  } else if (message.action === "requestServerSync") {
    requestSyncFromBackend(sendResponse);
    return true; // Indicates that the response will be sent asynchronously
  }
});

function getStatusForExtension(sendResponse) {
  chrome.cookies.getAll({ domain: host }, function (cookies) {
    fetch(statusUrl, {
      headers: {
        Cookie: cookies
      },
      credentials: 'include'
    })
    .then((response) => response.json())
    .then((json) => {
      console.log('Status from API', json);

      // Save status data with chrome.storage
      chrome.storage.sync.set(json, function() {
        console.log('Status saved.');
        sendResponse(json);
      });
    });
  });
}

function requestSyncFromBackend(sendResponse) {
  chrome.cookies.getAll({ domain: host }, function (cookies) {
    fetch(syncUrl, {
      method: "post",
      headers: {
        Cookie: cookies
      },
      credentials: 'include'
    })
    .then((response) => response.json())
    .then((json) => {
      console.log('Sync response', json);
      sendResponse(json);
    });
  });
}
