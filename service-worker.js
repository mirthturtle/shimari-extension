// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).

console.log("service worker (background script)")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getShimariStatus") {
    const { url, cookies } = message;

    fetch(url, {
      headers: {
        Cookie: cookies // Include the cookies in the request headers
      },
      credentials: 'include'
    })
    .then((response) => response.json())
    .then((json) => {
      console.log('from service worker', json);
      sendResponse(json);
    });
    return true; // Indicates that the response will be sent asynchronously

  } else if( message.action === "shimari" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go'
    });
  }
});
