console.log("Shimari Extension active on this page.")
let buttonAutoDisabler;
let gameStateObserver;

const initiatePageObserver = () => {
  let knownHref = document.location.href;

  const body = document.querySelector("body");

  // these are called when the Href changes; OGS is a single-page app
  const hrefObserver = new MutationObserver(mutations => {
    if (knownHref !== document.location.href) {
      knownHref = document.location.href;

      if (window.location.href.startsWith("https://online-go.com/play") &&
          !window.location.href.startsWith("https://online-go.com/player")) {
        runDisciplineBlocker();

      } else if (window.location.href.startsWith('https://online-go.com/game')) {
        clearExistingAutoDisablers();
        setUpGameObserver();

      } else {
        clearExistingAutoDisablers();
      }
    }
  });
  hrefObserver.observe(body, { childList: true, subtree: true });

  makeInitialObservations();
};

function makeInitialObservations() {
  if (window.location.href.startsWith("https://online-go.com/play") &&
     !window.location.href.startsWith("https://online-go.com/player")) {
    refreshForWidget();
  } else if (window.location.href.startsWith("https://online-go.com/game")) {
    setUpGameObserver();
  } else if (window.location.href.includes('mirthturtle.com/go') || window.location.href.includes('localhost:3000/go')) {
    clearAnyExtensionCallouts();
  }
}

// hide any ads for the extension itself
function clearAnyExtensionCallouts() {
  const callout = document.querySelector('.interface-extension-callout');
  if (callout) {
    callout.remove();
  }
}

// check localstorage for blockers
function runDisciplineBlocker() {
  window.setTimeout(() => {
    if (chrome.storage) {
      chrome.storage.sync.get(['blocker', 'logged_in'], function(items) {
        console.log('Shimari discipline blocker says:', items);
        if (items.logged_in && items.blocker) {
          disablePlayButtons();
        } else {
          enablePlayButtons();
        }
        removeExistingShimariWidgets();
        injectShimariWidget(items.logged_in, items.blocker);
      });
    }
  }, 250);
}

// keep buttons enabled on other pages
function clearExistingAutoDisablers() {
  if (buttonAutoDisabler) {
    clearInterval(buttonAutoDisabler);
  }
}

// get fresh data in chrome storage and redraw the blocker widget
function refreshForWidget() {
  let el = document.querySelector('.shimari-refresh-link');
  if (el) {
    el.remove();
  }

  chrome.runtime.sendMessage(
    { action: 'refreshForWidget'},
    response => {
      runDisciplineBlocker();
    }
  );
}

function injectShimariWidget(loggedIn, blockerMessage) {
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

  // refresh image/link
  var refreshLink = document.createElement('a');
  refreshLink.href = "#";
  refreshLink.className = "shimari-refresh-link";
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
  flexElement.appendChild(flameLink);
  flexElement.appendChild(shimariLogoLink);

  if (blockerMessage) {
    mainWidgetElement.appendChild(refreshLink);
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
  clearExistingAutoDisablers();
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
  clearExistingAutoDisablers();
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = false;
  }
}

// GAME PAGE LOGIC

function setUpGameObserver() {
  let knownGame;
  let knownGameState;
  let newState;
  let usernameB;
  let usernameW;

  if (gameStateObserver) {
    gameStateObserver.disconnect();
  }

  window.setTimeout(() => {
    let stateDiv = document.getElementsByClassName("PlayControls")[0];

    gameStateObserver = new MutationObserver((mutations, observer) => {
      let gameId = window.location.href.split("https://online-go.com/game/")[1];

      if (knownGame === gameId) {
        // we've been on this game for a bit.
        newState = findGameStatusOnPage();

        // check for a change in state to detect win
        if (knownGameState !== newState) {
          // B wins
          if (newState === "B") {
            chrome.storage.sync.get(['resign_effects', 'integrations'], function(items) {
              if (items.resign_effects && usernameB) {
                popStoneEffectWithUsername("B", usernameB);
              }
              // autosync if our game
              if (usernameB && usernameW && items.integrations &&
                (items.integrations.includes(usernameB) || items.integrations.includes(usernameW))) {
                doAutosync();
                addReviewContainer();
                setChatFocus();

                observer.disconnect();
              }
            });

          // W wins
          } else if (newState === "W") {
            chrome.storage.sync.get(['resign_effects', 'integrations'], function(items) {
              if (items.resign_effects && usernameW) {
                popStoneEffectWithUsername("W", usernameW);
              }
              // autosync if our game
              if (usernameB && usernameW && items.integrations &&
                (items.integrations.includes(usernameB) || items.integrations.includes(usernameW))) {
                doAutosync();
                addReviewContainer();
                setChatFocus();

                observer.disconnect();
              }
            });
          }
        }
      } else {
        // newly arrived at game; lock in game info
        knownGame = gameId;
        newState = findGameStatusOnPage();
        knownGameState = newState;
        usernameB = getUsernameFor("B");
        usernameW = getUsernameFor("W");
      }
    });

    gameStateObserver.observe(stateDiv, {characterData: true, attributes: true, childList: true, subtree: true});
  }, 500);
}

function addReviewContainer() {
  window.setTimeout(() => {
    let analyzeModeButtonsDiv = document.getElementsByClassName("analyze-mode-buttons")[0];
    if (analyzeModeButtonsDiv) {
      let reviewGameContainer = document.createElement('div');
      reviewGameContainer.className = "review-container";

      // create logo image
      var reviewLogoLink = document.createElement('a');
      reviewLogoLink.href = "https://mirthturtle.com/go/games/latest";
      reviewLogoLink.target = "_blank";
      var reviewGameImage = document.createElement('img');
      reviewGameImage.className = "review-image-logo";
      reviewGameImage.src = "https://www.mirthturtle.com/shimari-shine.png";
      reviewLogoLink.appendChild(reviewGameImage);

      // create text link
      let reviewTextLink = document.createElement('a');
      reviewTextLink.className = "review-text-link";
      reviewTextLink.innerText = "Review now";
      reviewTextLink.target = "_blank";
      reviewTextLink.href = "https://mirthturtle.com/go/games/latest";

      // add items to container
      reviewGameContainer.appendChild(reviewLogoLink);
      reviewGameContainer.appendChild(reviewTextLink);

      // add to page
      analyzeModeButtonsDiv.insertBefore(reviewGameContainer, analyzeModeButtonsDiv.firstChild);
    }
  }, 500);
}

function getUsernameFor(color) {
  return document.getElementsByClassName(`${(color === "B" ? 'black' : 'white')} player-name-container`)[0].getElementsByClassName('Player-username')[0].innerHTML;
}

function findGameStatusOnPage() {
  let rawStatusString;
  let gameStateDiv = document.getElementsByClassName("game-state")[0];
  if (gameStateDiv) {
    rawStatusString = gameStateDiv.children[0].innerHTML;

    if (rawStatusString.includes("White wins")) {
      return "W";
    } else if (rawStatusString.includes("Black wins")) {
      return "B";
    } else if (rawStatusString.includes("to move")) {
      return "?";
    }

  } else {
    return false;
  }
}

function doAutosync() {
  console.log('Shimari initiating autosync...');

  window.setTimeout(() => {
    chrome.runtime.sendMessage(
      { action: 'requestServerSync'},
      response => {
        console.log('Shimari sync completed.');
      }
    );
  }, 2000);
}

// GAMEOVER EFFECTS

function setChatFocus() {
  document.getElementsByClassName('chat-input')[0].focus();
}

const stonesArray = [];
let stoneboxWidth = window.innerWidth;
let stoneboxHeight = window.innerHeight;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createAnimationOverlay() {
  const gobanElement = document.querySelectorAll('.Goban')[1];

  var overlay = document.createElement('div');
  overlay.className = "shimari-animation-overlay";
  gobanElement.appendChild(overlay);
}

function popAccolade(color, username) {
  const gobanElement = document.querySelector('.shimari-animation-overlay');
  const accoladeElement = document.createElement('span');

  accoladeElement.className = `accolade-text ${color.toLowerCase()}-accolade`;
  accoladeElement.innerHTML = `${username} wins`;
  gobanElement.appendChild(accoladeElement);
}

function popStoneEffectWithUsername(color, username) {
  createAnimationOverlay();
  const numStones = 100;

  for (let i = 0; i < numStones; i++) {
    stonesArray.push(createMovingStone(color));
  }
  popAccolade(color, username);
}

const radius = 15;
const Cd = 0.47; // Dimensionless
const rho = 1.22; // kg / m^3
const A = Math.PI * radius * radius / 10000; // m^2
// const ag = 9.81; // m / s^2
const ag = 0; // m / s^2
const frameRate = 1 / 60;

function createMovingStone(color) {
  const vx = getRandomArbitrary(-6, 6); // x velocity
  const vy = getRandomArbitrary(-6, 6);  // y velocity
  const wrapperElement = document.querySelector('.shimari-animation-overlay');

  const outerStone = document.createElement("div");
  outerStone.className = `moving-stone `;

  let stoneVariant = (color === "B") ? getRandomInt(0, 3) : getRandomInt(0, 10);
  const innerStone = document.createElement("img");
  innerStone.src = chrome.runtime.getURL(`img/go-assets/${(color === "B") ? 'black' : 'white'}${stoneVariant.toString()}.png`);
  innerStone.className = `inner stone-${getRandomInt(3, 5)}`;

  outerStone.appendChild(innerStone);
  wrapperElement.appendChild(outerStone);

  const rect = outerStone.getBoundingClientRect();
  const lifetime = getRandomArbitrary(2000, 3500);
  outerStone.style.setProperty("--lifetime", lifetime);

  const newStone = {
    outerStone,
    absolutePosition: { x: rect.left, y: rect.bottom },
    position: { x: rect.left, y: rect.bottom },
    velocity: { x: vx, y: vy },
    mass: 40, //kg
    radius: outerStone.offsetWidth, // 1px = 1cm
    restitution: -.7,
    lifetime,
    direction: vx > 0 ? 1 : -1,
    animating: true,

    remove() {
      this.animating = false;
      this.outerStone.parentNode.removeChild(this.outerStone);
    },

    animate() {
      const newStone = this;
      let Fx =
        -0.5 *
        Cd *
        A *
        rho *
        newStone.velocity.x *
        newStone.velocity.x *
        newStone.velocity.x /
        Math.abs(newStone.velocity.x);
      let Fy =
        -0.5 *
        Cd *
        A *
        rho *
        newStone.velocity.y *
        newStone.velocity.y *
        newStone.velocity.y /
        Math.abs(newStone.velocity.y);

      Fx = isNaN(Fx) ? 0 : Fx;
      Fy = isNaN(Fy) ? 0 : Fy;

      // Calculate acceleration ( F = ma )
      var ax = Fx / newStone.mass;
      var ay = ag + Fy / newStone.mass;

      // Integrate to get velocity
      newStone.velocity.x += ax * frameRate;
      newStone.velocity.y += ay * frameRate;

      // Integrate to get position
      newStone.position.x += newStone.velocity.x * frameRate * 100;
      newStone.position.y += newStone.velocity.y * frameRate * 100;

      newStone.checkBounds();
      newStone.update();
    },

    checkBounds() {
      if (newStone.position.y > stoneboxHeight - newStone.radius) {
        newStone.velocity.y *= newStone.restitution;
        newStone.position.y = stoneboxHeight - newStone.radius;
      }
      if (newStone.position.x > stoneboxWidth - newStone.radius) {
        newStone.velocity.x *= newStone.restitution;
        newStone.position.x = stoneboxWidth - newStone.radius;
        newStone.direction = -1;
      }
      if (newStone.position.x < newStone.radius) {
        newStone.velocity.x *= newStone.restitution;
        newStone.position.x = newStone.radius;
        newStone.direction = 1;
      }
    },

    update() {
      const relX = this.position.x - this.absolutePosition.x;
      const relY = this.position.y - this.absolutePosition.y;

      this.outerStone.style.setProperty("--x", relX);
      this.outerStone.style.setProperty("--y", relY);
      this.outerStone.style.setProperty("--direction", this.direction);
    }
  };

  setTimeout(() => {
    newStone.remove();
  }, lifetime);

  return newStone;
}

function stoneAnimationLoop() {
  var i = stonesArray.length;
  while (i--) {
    stonesArray[i].animate();

    if (!stonesArray[i].animating) {
      stonesArray.splice(i, 1);
    }
  }
  requestAnimationFrame(stoneAnimationLoop);
}

stoneAnimationLoop();

// SCROLL HELPER

function detectMouseWheelDirection( e ) {
  var delta = null,  direction = false;
  if ( !e ) { // if the event is not provided, we get it from the window object
    e = window.event;
  }
  if ( e.wheelDelta ) { // will work in most cases
    delta = e.wheelDelta / 60;
  } else if ( e.detail ) { // fallback for Firefox
    delta = -e.detail / 2;
  }
  if ( delta !== null ) {
    direction = delta > 0 ? 'up' : 'down';
  }
  return direction;
}

function handleMouseWheelDirection( direction ) {
  const prevBtn = document.querySelectorAll('.move-control')[2];
  const nextBtn = document.querySelectorAll('.move-control')[4];

  if ( prevBtn && direction == 'down' ) {
    var a = document.querySelector('.Goban:hover');
    if (a) {
      prevBtn.click();
    }
  } else if ( nextBtn && direction == 'up' ) {
    var b = document.querySelector('.Goban:hover');
    if (b) {
      nextBtn.click();
    }
  }
}

document.onmousewheel = function( e ) {
  handleMouseWheelDirection( detectMouseWheelDirection( e ) );
};

if ( window.addEventListener ) {
  document.addEventListener( 'DOMMouseScroll', function( e ) {
    handleMouseWheelDirection( detectMouseWheelDirection( e ) );
  });
}

// ON PAGE LOAD

window.onload = initiatePageObserver;
