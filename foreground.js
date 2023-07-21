console.log("MirthEx active on this page.")
let buttonAutoDisabler;

const initiateOGSObserver = () => {
  let knownHref = document.location.href;
  const body = document.querySelector("body");

  const observer = new MutationObserver(mutations => {
    if (knownHref !== document.location.href) {
      knownHref = document.location.href;

      // discipline blockers
      if (window.location.href.startsWith("https://online-go.com/play")) {
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
  if (window.location.href.startsWith("https://online-go.com/play")) {
    refreshForWidget();
  }
};

function runDisciplineBlocker() {
  // check localstorage for blockers
  chrome.storage.sync.get(['blocker', 'logged_in'], function(items) {
    console.log('Discipline blocker:', items);
    if (items.blocker) {
      disablePlayButtons();
    } else {
      enablePlayButtons();
    }
    removeExistingShimariWidgets();
    injectShimariWidget(items.logged_in, items.blocker);
  });
}

  // call service worker to trigger popup & get fresh data in chrome storage
function refreshForWidget() {
  chrome.runtime.sendMessage(
    { action: 'refreshForWidget'},
    response => {
      console.log('response from refresh', response);

      // redraw the widget
      runDisciplineBlocker();
    }
  );
}

function injectShimariWidget(loggedIn, blockerMessage) {
  // main widget
  var mainWidgetElement = document.createElement('div');
  mainWidgetElement.className = "shimari-main-widget";

  // message element
  var messageElement = document.createElement('p');
  messageElement.className = "shimari-message";
  if (loggedIn) {
    if (blockerMessage) {
      messageElement.innerHTML = blockerMessage == "focus" ? "Do a <a href=\"https://mirthturtle.com/go/pregame\" class=\"shimari-link\"> Pre-game Focus.</a>" : "<a href=\"https://mirthturtle.com/go/games/latest\" class=\"shimari-link\" target=\"_blank\">Review</a> your last game.";
    } else {
      messageElement.innerHTML = "Have a good game."
    }
  } else {
    messageElement.innerHTML = "<a href=\"https://mirthturtle.com/go/login\" class=\"shimari-link\" target=\"_blank\">Log in</a> to activate.";
  }

  // logo/button flex area
  var flexElement = document.createElement('div');
  flexElement.className = "shimari-flex";

  // Flame image/link
  var flameLink = document.createElement('a');
  flameLink.href = "https://mirthturtle.com/go/pregame";
  var flameImage = document.createElement('img');
  flameImage.className = "shimari-flame-image";
  flameImage.src = "https://www.mirthturtle.com/shimari-flame.png";
  flameLink.appendChild(flameImage)

  // refresh image/link # TODO refrech
  var refreshLink = document.createElement('a');
  refreshLink.href = "#";
  refreshLink.onclick = refreshForWidget;
  var refreshImage = document.createElement('img');
  refreshImage.className = "shimari-refresh-image";
  refreshImage.src = "https://www.mirthturtle.com/refresh.svg";
  refreshLink.appendChild(refreshImage)

  // logo image/link
  var shimariLogoLink = document.createElement('a');
  shimariLogoLink.href = "https://mirthturtle.com/go";
  shimariLogoLink.target = "_blank";
  var shimariLogoImage = document.createElement('img');
  shimariLogoImage.className = "shimari-widget-logo";
  shimariLogoImage.src = "https://www.mirthturtle.com/shimari-shine.png";
  shimariLogoLink.appendChild(shimariLogoImage);

  // add items to flex row
  flexElement.appendChild(shimariLogoLink);
  flexElement.appendChild(flameLink);
  if (blockerMessage) {
    flexElement.appendChild(refreshLink);
  }

  // add all to main widget
  mainWidgetElement.appendChild(flexElement);
  mainWidgetElement.appendChild(messageElement);

  // add widget to page
  destinationElement = document.getElementsByClassName('custom-game-row')[0];
  destinationElement.appendChild(mainWidgetElement);
}

function removeExistingShimariWidgets() {
  const widgets = document.querySelectorAll('.shimari-main-widget');
  widgets.forEach(wid => {
    wid.remove();
  });
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
