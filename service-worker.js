// This is the service worker script, which executes in its own context
// when the extension is installed or refreshed (or when you access its console).

console.log("Service worker (background script)")

const prod = true;
const host = prod ? "https://mirthturtle.com" : "http://localhost:3000";
const statusUrl = `${host}/go/learners/extension`;
const syncUrl = `${host}/go/learners/sync_all.json`;
const highlightUrl = `${host}/go/games`;

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Returns logged-in status & settings
  if (message.action === "getShimariStatus") {
    getStatusForExtension(sendResponse);
    return true;

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

  } else if ( message.action === "goToSourceCode" ) {
    chrome.tabs.update(null, {
      url: 'https://github.com/christiancodes/shimari-extension'
    });

  } else if ( message.action === "goToSettingsPage" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go/settings#extension'
    });

  } else if ( message.action === "goToPregame" ) {
    chrome.tabs.update(null, {
      url: 'https://mirthturtle.com/go/pregame'
    });

  } else if ( message.action === "refreshForWidget" ) {
    getStatusForExtension(sendResponse);
    return true;

  } else if (message.action === "requestServerSync") {
    requestSyncFromBackend(sendResponse);
    return true;

  } else if (message.action === "sendHighlightRequest") {
    const response =
      fetch(`${highlightUrl}/highlight?ogs_id=${message.ogsId}&move=${message.moveNumber}&type_id=${message.typeId}`, {
        method: "POST"
      });
    return true;
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
    }).catch(error => {
      if (typeof error.json === "function") {
        error.json().then(jsonError => {
          console.log("Json error from status API", jsonError);
          sendResponse('error');
        }).catch(genericError => {
          console.log("Generic error from status API", error.statusText);
          sendResponse('error');
        });
      } else {
          console.log("Shimari status error");
          console.log(error);
          sendResponse('error');
      }
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

      console.log('Updating status for widget...');
      getStatusForExtension(sendResponse);
    }).catch(error => {
      if (typeof error.json === "function") {
        error.json().then(jsonError => {
            console.log("Shimari sync error");
            console.log(jsonError);
        }).catch(genericError => {
            console.log("Shimari sync generic error");
            console.log(error.statusText);
        });
      } else {
        console.log("Sync error");
        console.log(error);
      }
    });;
  });
}
