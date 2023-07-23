console.log("MirthEx active on this page.")
let buttonAutoDisabler;
let gameStateObserver;

const initiateOGSObserver = () => {
  let knownHref = document.location.href;

  const body = document.querySelector("body");

  const hrefObserver = new MutationObserver(mutations => {
    if (knownHref !== document.location.href) {
      knownHref = document.location.href;

      // discipline blockers
      if (window.location.href.startsWith("https://online-go.com/play")) {
        console.log('On Play page.');
        runDisciplineBlocker();

      } else if (window.location.href.startsWith('https://online-go.com/game')) {
        console.log('On Game page.');
        setUpGameObserver();
      }
    }
  });
  hrefObserver.observe(body, { childList: true, subtree: true });
  console.log('OGS observer activated.');

  // make initial observation
  if (window.location.href.startsWith("https://online-go.com/play")) {
    refreshForWidget();
  } else if (window.location.href.startsWith("https://online-go.com/game")) {
    setUpGameObserver();
  }
};

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
    let stateDiv = document.getElementsByClassName("play-controls")[0];

    gameStateObserver = new MutationObserver(mutations => {
      let gameId = window.location.href.split("https://online-go.com/game/")[1];

      if (knownGame === gameId) {
        // we've been on this game for a bit.
        newState = findGameStatusOnPage();
        console.log('newstate', newState);

        // check for a change in state
        if (knownGameState !== newState) {
          if (newState === "B") {
            console.log('B wins!');
            chrome.storage.sync.get(['resign_effects', 'integrations'], function(items) {
              if (items.resign_effects) {
                popStoneEffectWithUsername("B", usernameB);
              }
            });

            // autosync if our game
            if (items.integrations.includes?(usernameB) || items.integrations.includes?(usernameW)) {
              doAutosync();
            }

          } else if (newState === "W") {
            console.log('W wins!');

            chrome.storage.sync.get(['resign_effects', 'username'], function(items) {
              if (items.resign_effects) {
                popStoneEffectWithUsername("W", usernameW);
              }
            });

            // autosync if our game
            if (items.integrations.includes?(usernameB) || items.integrations.includes?(usernameW)) {
              doAutosync();
            }
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
    console.log('Game status observer activated.');
  }, 500);
}

function getUsernameFor(color) {
  return document.getElementsByClassName(`${(color === "B" ? 'black' : 'white')} player-name-container`)[0].getElementsByClassName('Player-username')[0].innerHTML;
}

function runDisciplineBlocker() {
  // check localstorage for blockers
  chrome.storage.sync.get(['blocker', 'logged_in'], function(items) {
    console.log('Discipline blocker says:', items);
    if (items.logged_in && items.blocker) {
      disablePlayButtons();
    } else {
      enablePlayButtons();
    }
    removeExistingShimariWidgets();
    injectShimariWidget(items.logged_in, items.blocker);
  });
}

// get fresh data in chrome storage and redraw the widget
function refreshForWidget() {
  chrome.runtime.sendMessage(
    { action: 'refreshForWidget'},
    response => {
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

  // refresh image/link
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
  if (buttonAutoDisabler) {
    clearInterval(buttonAutoDisabler);
  }
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
  if (buttonAutoDisabler) {
    clearInterval(buttonAutoDisabler);
  }
  const buttons = document.getElementsByTagName("button");
  for (const button of buttons) {
    button.disabled = false;
  }
}

// STONE POPPER

const stonesArray = [];
let stoneboxWidth = window.innerWidth;
let stoneboxHeight = window.innerHeight;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function accoladeForUser(username) {
  const gobanElement = document.getElementsByClassName('goban-container')[0];
  const accoladeElement = document.createElement('span');

  accoladeElement.className = "accolade-text";
  accoladeElement.innerHTML = `${username} wins`;
  gobanElement.appendChild(accoladeElement);
}

function doAutosync() {
  console.log('Autosync request to service worker');

  chrome.runtime.sendMessage(
    { action: 'requestServerSync'},
    response => {
      console.log('Sync completed.');
    }
  );
}

function popStoneEffectWithUsername(color, username) {
  const numStones = 100;
  const usernameStoneDelay = 10;  // pop the username announcement a little ways in

  for (let i = 0; i < numStones; i++) {
    stonesArray.push(createMovingStone(color));
    if (i === usernameStoneDelay) {
      accoladeForUser(username);
    }
  }
}

const radius = 15;
const Cd = 0.47; // Dimensionless
const rho = 1.22; // kg / m^3
const A = Math.PI * radius * radius / 10000; // m^2
// const ag = 9.81; // m / s^2
const ag = 0; // m / s^2
const frameRate = 1 / 60;

function createMovingStone(color) {
  const vx = getRandomArbitrary(-12, 12); // x velocity
  const vy = getRandomArbitrary(-12, 12);  // y velocity
  const wrapperElement = document.getElementsByClassName('goban-container')[0];

  const outerStone = document.createElement("div");
  outerStone.className = `moving-stone stone-${getRandomInt(1, 4)}`;
  var emojiset = [(color === "B") ? '⚫' : '⚪'];

  const innerStone = document.createElement("span");
  innerStone.className = "inner";
  innerStone.innerText = emojiset[getRandomInt(0, emojiset.length - 1)];

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
    mass: 10, //kg
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

window.onload = initiateOGSObserver;
