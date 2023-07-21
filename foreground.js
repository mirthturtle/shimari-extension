console.log("MirthEx active on this page.")
let buttonAutoDisabler;

const initiateOGSObserver = () => {
  let knownHref = document.location.href;
  const body = document.querySelector("body");

  const observer = new MutationObserver(mutations => {
    if (knownHref !== document.location.href) {
      knownHref = document.location.href;

      // discipline blockers
      if (window.location.href == "https://online-go.com/play") {
        console.log('On Play page.');
        runDisciplineBlocker();

      } else if (window.location.href.startsWith('https://online-go.com/game')) {
        // listen for game ending or change (hook into websocket?)
        // TODO

        chrome.storage.sync.get(['resign_effects'], function(items) {
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
    } else {
      enablePlayButtons();
    }
    injectShimariWidget(items.blocker);
  });
}

function injectShimariWidget(blockerMessage) {
  // make main widget
  var mainWidgetElement = document.createElement('div');
  mainWidgetElement.className = "shimari-main-widget";

  // make message element
  var messageElement = document.createElement('p');
  messageElement.className = "shimari-message";
  if (blockerMessage) {
    messageElement.innerHTML = blockerMessage == "focus" ? "Do a <a href=\"https://mirthturtle.com/go/pregame\" class=\"shimari-link\"> Pre-game Focus.</a>" : "<a href=\"https://mirthturtle.com/go/games\" class=\"shimari-link\">Review</a> your last game.";
  } else {
    messageElement.innerHTML = "Have a good game."
  }

  // lower flex area
  var flexElement = document.createElement('div');
  flexElement.className = "shimari-flex";

  var refreshButton = document.createElement('button');
  refreshButton.className = "shimari-refresh-button";
  refreshButton.innerHTML = "refresh";

  var shimariLogoLink = document.createElement('a');
  shimariLogoLink.href = "https://mirthturtle.com/go/pregame";

  var shimariLogoImage = document.createElement('img');
  shimariLogoImage.className = "shimari-widget-logo";
  shimariLogoImage.src = "https://www.mirthturtle.com/shimari-shine.png";

  shimariLogoLink.appendChild(shimariLogoImage);

  flexElement.appendChild( shimariLogoLink );
  // flexElement.appendChild( refreshButton );

  // add all to main widget
  mainWidgetElement.appendChild( flexElement );
  mainWidgetElement.appendChild( messageElement );

  // add widget to page
  destinationElement = document.getElementsByClassName('custom-game-row')[0];
  destinationElement.appendChild(mainWidgetElement);
}

function disablePlayButtons() {
  buttonAutoDisabler = setInterval(function() {
    let buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
      if (!button.class != 'shimari-refresh-button') {
        button.disabled = true;
      }
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
