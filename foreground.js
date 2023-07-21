// This script gets injected into any opened page
// whose URL matches the pattern defined in the manifest
// (see "content_script" key).

console.log("MirthEx active on this page.")
let buttonAutoDisabler;

const initiateOGSObserver = () => {
  let knownHref = document.location.href;
  const body = document.querySelector("body");

  const observer = new MutationObserver(mutations => {
    if (knownHref !== document.location.href) {
      knownHref = document.location.href;
      console.log('page change detected!');

      // discipline blockers
      if (window.location.href == "https://online-go.com/play") {
        console.log('On Play page.');

        runDisciplineBlocker();
      } else if (window.location.href.startsWith('https://online-go.com/game/')) {
        // listen for game ending or change (hook into websocket?)
        // TODO

        chrome.storage.sync.get(['resign_effects'], function(items) {
          console.log('Checking for resign effects setting', items);
          if (items.resign_effects) {
            // TODO do effects
          }
        });
      }
    }
  });
  observer.observe(body, { childList: true, subtree: true });
  console.log('OGS observer activated.');

  // make initial observation
  if (window.location.href == "https://online-go.com/play") {
    runDisciplineBlocker();
  }
};

// TODO hook game-endings & do effects, autosync to shimari


function runDisciplineBlocker() {
  // check localstorage for blockers
  chrome.storage.sync.get(['blocker'], function(items) {
    console.log('Settings retrieved', items);
    if (items.blocker) {
      disablePlayButtons();
      injectBlockerMessage(items.blocker);
    } else {
      enablePlayButtons();
      removeBlockerMessage();
    }
  });
}

// message is either 'focus' or 'review'
function injectBlockerMessage(message) {
  // make new element
  var newEle = document.createElement('p');
  newEle.class = "shimari-message";
  newEle.innerHTML = message == "focus" ? "Do a Pregame Focus." : "Review your last game first.";

  // add to page
  destinationElement = document.getElementsByClassName('custom-game-row')[0];
  destinationElement.parentNode.insertBefore(newEle, destinationElement.nextSibling);
}

function removeBlockerMessage() {
  const elements = document.getElementsByClassName('shimari-message');
  elements[0].parentNode.removeChild(elements[0]);
}

function disablePlayButtons() {
  buttonAutoDisabler = setInterval(function() {
    let buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
      button.disabled = true;
    }
  }, 500);
}

function enablePlayButtons() {
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = false;
  }
  clearInterval(buttonAutoDisabler);
}

window.onload = initiateOGSObserver;
