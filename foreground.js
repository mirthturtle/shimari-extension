// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).

console.log("MirthEx active on this page.")

// discipline blockers
if (window.location.href == "https://online-go.com/play") {
  console.log('On Play page.');

  // check localstorage for blockers
  chrome.storage.sync.get(['blocker'], function(items) {
    console.log('Settings retrieved', items);
    if (items.blocker) {
      disablePlayButtons();
      injectMessage(items.blocker);
    } else {
      enablePlayButtons();
      removeInjectedMessage();
    }

  });
}

// TODO hook game-endings & do effects, autosync to shimari
if (window.location.href.startsWith('https://online-go.com/game/')) {
  // TODO listen for game ending or change (hook into websocket?)

  chrome.storage.sync.get(['resign_effects'], function(items) {
    console.log('Settings retrieved', items);
    if (items.resign_effects) {
      // TODO do effects
    }
  });

}

function disablePlayButtons() {
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = true;
  }
}

function enablePlayButtons() {
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = false;
  }
}

function injectMessage(message) {
  // TODO add after .custom-game-row
  // message is either focus or review
}

function removeInjectedMessage() {

}
