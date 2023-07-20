// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).

console.log("service worker (background script)")

const prod = false;
const host = prod ? "mirthturtle.com" : "localhost:3000";
const url = `http${prod ? 's' : ''}://${host}/extension_status`;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getShimariStatus") {
    const { cookies } = message;

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
      });

      sendResponse(json);
    });
    return true; // Indicates that the response will be sent asynchronously

  } else if( message.action === "shimari" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go'
    });
  }
});
