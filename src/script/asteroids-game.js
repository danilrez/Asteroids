const FPS = 30; // frames per second
const FRICTION = 0.7; // friction coefficient of space (0 = no friction, 1 = lots of friction)
const GAME_LIVES = 3; // starting number of lives
const LASER_DIST = 0.6; // max distance laser can travel as fraction of screen width
const LASER_EXPLODE_DUR = 0.1; // duration of the lasers' explosion in seconds
const LASER_MAX = 10; // maximum number of lasers on screen at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const ROID_JAG = 0.3; // jaggedness of the asteroids (0 = none, 1 = lots)
const ROID_PTS_LGE = 20; // points scored for a large asteroid
const ROID_PTS_MED = 50; // points scored for a medium asteroid
const ROID_PTS_SML = 100; // points scored for a small asteroid
const ROID_NUM = 3; // starting number of asteroids
const ROID_SIZE = 100; // starting size of asteroids in pixels
const ROID_SPD = 50; // max starting speed of asteroids in pixels per second
const ROID_VERT = 10; // average number of vertices on each asteroid
const SAVE_KEY_SCORE = 'HIGHSCORE'; // save key for local storage of high score
const SHIP_BLINK_DUR = 0.1; // duration in seconds of a single blink during ship's invisibility
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion in seconds
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const SHIP_TURN_SPD = 360; // turn speed in degrees per second

let SHOW_BOUNDING = false; // show or hide collision bounding
let SHOW_CENTRE_DOT = false; // show or hide ship's centre dot
let MUSIC_ON = false;
let SOUND_ON = false;

const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

////MENU onClick =>>
document
  .querySelector('#menu_btns')
  .addEventListener('keydown', (e) => e.preventDefault());

function soundOn() {
  SOUND_ON = !SOUND_ON;
  SOUND_ON
    ? (document.querySelector('#btn_s').className = 'fas fa-volume-up')
    : (document.querySelector('#btn_s').className = 'fas fa-volume-mute');
}
function musicOn() {
  MUSIC_ON = !MUSIC_ON;
  MUSIC_ON
    ? (document.querySelector('#btn_m').className = 'fas fa-music on')
    : (document.querySelector('#btn_m').className = 'fas fa-music off');
}
function centreDor() {
  SHOW_CENTRE_DOT = !SHOW_CENTRE_DOT;
  SHOW_CENTRE_DOT
    ? (document.querySelector('#btn_cd').className = 'far fa-dot-circle on')
    : (document.querySelector('#btn_cd').className = 'far fa-dot-circle off');
}
function collisionBounding() {
  SHOW_BOUNDING = !SHOW_BOUNDING;
  SHOW_BOUNDING
    ? (document.querySelector('#btn_cb').className = 'fas fa-expand on')
    : (document.querySelector('#btn_cb').className = 'fas fa-expand off');
}
////MENU onClick <<=

// setup sound effects
let fxlaser = new Sound('src/sounds/laser.m4a', 5, 0.25);
let fxThrust = new Sound('src/sounds/thrust.m4a');
let fxHit = new Sound('src/sounds/hit.m4a', 5);
let fxExplode = new Sound('src/sounds/explode.m4a');

// setup the music
let music = new Music('src/sounds/music-low.m4a', 'src/sounds/music-high.m4a');
let roidsLeft, roidsTotal;

// setup the game parametrs
let level, lives, roids, ship, score, scoreHigh, text, textAlpha;
newGame();

// setup event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// setup the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  roids = [];
  roidsTotal = (ROID_NUM + level) * 7;
  roidsLeft = roidsTotal;
  let x, y;
  for (let i = 0; i < ROID_NUM + level; i++) {
    // random asteroid location (not touching spaceship)
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 2)));
  }
}

function destroyAsteroid(index) {
  let x = roids[index].x;
  let y = roids[index].y;
  let r = roids[index].r;

  // split the asteroids in two if necessary
  if (r == Math.ceil(ROID_SIZE / 2)) {
    //large asteroid
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 4)));
    score += ROID_PTS_LGE;
  } else if (r == Math.ceil(ROID_SIZE / 4)) {
    //medium asteroid
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROID_SIZE / 8)));
    score += ROID_PTS_MED;
  } else {
    score += ROID_PTS_SML;
  }

  // check high score
  if (score > scoreHigh) {
    scoreHigh = score;
    localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
  }

  // destroy the asteroid
  roids.splice(index, 1);
  fxHit.play();

  // calculate the ratio of remaining asteroids to determine music tempo
  roidsLeft--;
  music.setAsteroidRatio(roidsLeft == 0 ? 1 : roidsLeft / roidsTotal);

  // new level when no more asteroids
  if (roids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a, colour = 'white') {
  ctx.lineWidth = SHIP_SIZE / 15;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    // nose -> rear left
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    // bottom
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.lineTo(
    // rear right -> nose
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );

  ctx.strokeStyle = colour;
  ctx.shadowBlur = 0;
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
  fxExplode.play();
}

function gameOver() {
  ship.dead = true;
  //text = 'Game Over';
  //textAlpha = 3.0;

  const modal = document.getElementById('modal');
  const closeModal = document.getElementById('close');
  const fullscreen = document.getElementById('fullscreen-body');
  modal.style.display = 'flex';
  fullscreen.classList.add('blur-bg');

  closeModal.onclick = function () {
    modal.style.display = 'none';
    fullscreen.classList.remove('blur-bg');
    newGame();
  };

  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = 'none';
      fullscreen.classList.remove('blur-bg');
      newGame();
    }
  };
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: // spacebar (shoot laser)
      shootLaser();
      break;
    case 0: // spacebar (shoot laser)
      shootLaser();
      break;
    case 37: // left arrow (rotate ship left)
      ship.rot = ((SHIP_TURN_SPD / 180) * Math.PI) / FPS;
      break;
    case 38: // up arrow (thrust the ship forward)
      ship.thrusting = true;
      break;
    case 39: // right arrow (rotate ship right)
      ship.rot = ((-SHIP_TURN_SPD / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp(/** @type {KeyboardEvent} */ ev) {
  if (ship.dead) {
    return;
  }

  switch (ev.keyCode) {
    case 32: // spacebar (aloow shooting again)
      ship.canShoot = true;
      break;
    case 0: // spacebar (shoot laser)
      shootLaser();
      break;
    case 37: // left arrow (stop rotating left)
      ship.rot = 0;
      break;
    case 38: // up arrow (stop thrusting)
      ship.thrusting = false;
      break;
    case 39: // right arrow (stop rotating right)
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y, r) {
  let lvlMult = 1 + 0.1 * level;
  let roid = {
    x: x,
    y: y,
    xv: ((Math.random() * ROID_SPD * lvlMult) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    yv: ((Math.random() * ROID_SPD * lvlMult) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    a: Math.random() * Math.PI * 2, // in radians
    r: r,
    offs: [],
    vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 2),
  };

  // populate the offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
  }
  return roid;
}

function newGame() {
  level = 0;
  score = 0;
  lives = GAME_LIVES;

  ship = newShip();

  // get the high score from local storage
  let scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
  if (scoreStr == null) {
    scoreHigh = 0;
  } else {
    scoreHigh = parseInt(scoreStr);
  }

  newLevel();
}

function newLevel() {
  text = `Level ${level + 1}`;
  textAlpha = 2.0;
  createAsteroidBelt();
}

function newShip() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    a: (90 / 180) * Math.PI, // convert to radians
    r: SHIP_SIZE / 2,
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0,
    },
  };
}

function shootLaser() {
  //create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      // from the nose of the ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0,
    });
    fxlaser.play();
  }

  //prevent further shooting
  ship.canShoot = false;
}

function Music(srcLow, srcHigh) {
  this.soundLow = new Audio(srcLow);
  this.soundHigh = new Audio(srcHigh);
  this.low = true;
  this.tempo = 1.0; //sec per beat
  this.beatTime = 0; //frames left until next beat

  this.play = async function () {
    if (MUSIC_ON) {
      if (this.low) {
        this.soundLow.play();
      } else {
        this.soundHigh.play();
      }
      this.low = !this.low;
    }
  };

  this.setAsteroidRatio = function (ratio) {
    this.tempo = 1.0 - 0.5 * (1.0 - ratio);
  };

  this.tick = async function () {
    if (this.beatTime == 0) {
      this.play();
      this.beatTime = Math.ceil(this.tempo * FPS);
    } else [this.beatTime--];
  };
}

function Sound(src, maxStreams = 1, vol = 0.5) {
  this.streamNum = 0;
  this.streams = [];
  for (let i = 0; i < maxStreams; i++) {
    this.streams.push(new Audio(src));
    this.streams[i].volume = vol;
  }
  this.play = function () {
    if (SOUND_ON) {
      this.streamNum = (this.streamNum + 1) % maxStreams;
      this.streams[this.streamNum].play();
    }
  };

  this.stop = function () {
    this.streams[this.streamNum].pause();
    this.streams[this.streamNum].currentTime = 0;
  };
}

////////////////////////////////////////////////////////////////////////
function update() {
  const blinkOn = ship.blinkNum % 2 == 0;
  const exploding = ship.explodeTime > 0;

  // tick the music
  music.tick();

  //// DRAW space =>>
  const gradientBG = ctx.createRadialGradient(400, 300, 50, 400, 300, 450);
  gradientBG.addColorStop(1, 'rgb(10, 10, 15)');
  gradientBG.addColorStop(0.7, 'rgb(10, 10, 15)');
  gradientBG.addColorStop(0, 'rgb(20, 20, 27)');

  ctx.fillStyle = gradientBG;

  ctx.fillRect(0, 0, canvas.width, canvas.height);
  //// DRAW space <<=

  //// DRAW the asteroids =>>
  let a, r, x, y, offs, vert;
  for (let i = 0; i < roids.length; i++) {
    ctx.strokeStyle = 'slategray';
    ctx.shadowBlur = 0;
    ctx.lineWidth = SHIP_SIZE / 20;
    // get the asteroid properties
    a = roids[i].a;
    r = roids[i].r;
    x = roids[i].x;
    y = roids[i].y;
    offs = roids[i].offs;
    vert = roids[i].vert;

    // DRAW the path
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));

    // DRAW the polygon
    for (let j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    // show asteroid's collision circle
    if (SHOW_BOUNDING) {
      ctx.strokeStyle = 'greenyellow';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.1, 0, Math.PI * 2, false);
      ctx.stroke();
    }
  }
  //// DRAW the asteroids <<=

  /////////////////////////////////////////////////////////
  //==> TOP MENU <<=//
  // BG for MENU
  ctx.fillStyle = 'rgba(10, 10 , 15, 0.75)';
  ctx.strokeStyle = 'rgb(130, 140, 150)';
  ctx.lineWidth = SHIP_SIZE / 15;
  ctx.beginPath();
  ctx.fillRect(0, 0, canvas.width, SHIP_SIZE * 1.75);
  ctx.moveTo(0, SHIP_SIZE * 1.75);
  ctx.lineTo(canvas.width, SHIP_SIZE * 1.75);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // DRAW the level
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgb(130, 140, 150)';
  ctx.font = `${TEXT_SIZE * 0.3}px Fira Code Medium`;
  ctx.fillText('level: ' + (level + 1), canvas.width / 2, SHIP_SIZE * 0.6);
  ctx.shadowBlur = 0;
  textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;

  // DRAW the score
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // colorize score
  if (score < 100) {
    ctx.fillStyle = 'rgb(55, 65, 80)';
  } else if (100 <= score && score < 500) {
    ctx.fillStyle = '130, 140, 150';
  } else if (500 <= score && score < 1000) {
    ctx.fillStyle = 'white';
  } else if (1000 <= score && score < 2500) {
    ctx.fillStyle = 'wheat';
  } else if (2500 <= score && score < 5000) {
    ctx.fillStyle = 'gold';
  } else if (5000 <= score && score < 7500) {
    ctx.fillStyle = 'orange';
  } else if (7500 <= score && score < 10000) {
    ctx.fillStyle = 'tomato';
  } else if (10000 <= score && score < 1000000) {
    ctx.fillStyle = 'blueviolet';
  }
  ctx.shadowBlur = 0;
  ctx.font = `${TEXT_SIZE * 0.45}px Fira Code`;
  ctx.fillText('SCORE ' + score, canvas.width / 2, SHIP_SIZE * 1.2);
  ctx.shadowBlur = 0;
  textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;

  //// DRAW the HIGH score ==>
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgb(130, 140, 150)';
  ctx.font = `${TEXT_SIZE * 0.75}px Fira Code Light`;
  textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  // add '0'
  let addZero = '0';
  switch (String(scoreHigh).length) {
    case 0:
      ctx.fillText(
        'HIGH ' + addZero.repeat(8) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 1:
      ctx.fillText(
        'HIGH ' + addZero.repeat(7) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      ctx.fillStyle = 'red';
      break;
    case 2:
      ctx.fillText(
        'HIGH ' + addZero.repeat(6) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 3:
      ctx.fillText(
        'HIGH ' + addZero.repeat(5) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 4:
      ctx.fillText(
        'HIGH ' + addZero.repeat(4) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 5:
      ctx.fillText(
        'HIGH ' + addZero.repeat(3) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 6:
      ctx.fillText(
        'HIGH ' + addZero.repeat(2) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 7:
      ctx.fillText(
        'HIGH ' + addZero.repeat(1) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
    case 8:
      ctx.fillText(
        'HIGH ' + addZero.repeat(0) + scoreHigh,
        canvas.width - SHIP_SIZE / 2,
        SHIP_SIZE
      );
      break;
  }
  //// <<=

  // DRAW the  LIVES
  let lifeColour;
  for (let i = 0; i < lives; i++) {
    lifeColour = exploding && i == lives - 1 ? 'tomato' : 'rgb(130, 140, 150)';
    drawShip(SHIP_SIZE + i * SHIP_SIZE * 1.25, SHIP_SIZE, 0.5 * Math.PI, lifeColour);
    ctx.shadowBlur = 0;
  }

  // DRAW the game TEXT (LEVELS)
  if (textAlpha >= 0) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    ctx.font = `small-caps ${TEXT_SIZE}px Fira Code Medium`;
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.15);
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  }
  /////////////////////////////////////////////////////////

  //// thrust the ship
  if (ship.thrusting && !ship.dead) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;
    fxThrust.play();

    // DRAW the thruster
    if (!exploding && blinkOn) {
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 10;

      ctx.fillStyle = 'tomato';
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo(
        // rear left
        ship.x - ship.r * ((5 / 4.5) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((5 / 4.5) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      );
      ctx.lineTo(
        // rear centre (behind the ship)
        ship.x - ((ship.r * 5) / 2.5) * Math.cos(ship.a),
        ship.y + ((ship.r * 5) / 2.5) * Math.sin(ship.a)
      );
      ctx.lineTo(
        // rear right
        ship.x - ship.r * ((5 / 4.5) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((5 / 4.5) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // apply friction (slow the ship down when not thrusting)
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
    fxThrust.stop();
  }

  //// DRAW the SHIP =>>
  if (!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }

    // handle blinking
    if (ship.blinkNum > 0) {
      // reduce the blink time
      ship.blinkTime--;

      // reduce the blink num
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
        ctx.shadowBlur = 0;
      }
    }
  }

  // DRAW the explosion (concentric circles of different colours)
  else {
    ctx.fillStyle = 'darkred';
    ctx.shadowColor = 'darkred';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.5, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = 'tomato';
    ctx.shadowColor = 'tomato';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = 'orange';
    ctx.shadowColor = 'orange';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.9, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = 'gold';
    ctx.shadowColor = 'gold';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.5, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = 'wheat';
    ctx.shadowColor = 'wheat';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.2, 0, Math.PI * 2, false);
    ctx.fill();
  }

  // show ship's collision circle
  if (SHOW_BOUNDING) {
    ctx.strokeStyle = 'greenyellow';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1.2, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  // show ship's centre dot
  if (SHOW_CENTRE_DOT) {
    ctx.fillStyle = 'tomato';
    ctx.fillRect(ship.x - 1, ship.y - 1, 2, 2);
  }

  // DRAW the LASERS
  for (let i = 0; i < ship.lasers.length; i++) {
    if (ship.lasers[i].explodeTime == 0) {
      ctx.fillStyle = 'lightgreen';
      ctx.strokeStyle = 'green';
      ctx.lineWidth = SHIP_SIZE / 10;
      ctx.beginPath();

      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, SHIP_SIZE / 25, 0, Math.PI * 2, false);
      ctx.stroke();
      ctx.fill();
    } else {
      //DRAW the explosion
      ctx.fillStyle = 'tomato';
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.95, 0, Math.PI * 2, false);
      ctx.fill();

      ctx.fillStyle = 'orange';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.75, 0, Math.PI * 2, false);
      ctx.fill();

      ctx.fillStyle = 'gold';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(ship.lasers[i].x, ship.lasers[i].y, ship.r * 0.35, 0, Math.PI * 2, false);
      ctx.fill();
    }
  }

  // detect laser hits on asteroids
  let ax, ay, ar, lx, ly;
  for (let i = roids.length - 1; i >= 0; i--) {
    // grab the asteroid properties
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;

    // loop over the lasers
    for (let j = ship.lasers.length - 1; j >= 0; j--) {
      // grab the laser properties
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;

      // detect hits
      if (ship.lasers[j].explodeTime == 0 && distBetweenPoints(ax, ay, lx, ly) < ar) {
        // destroy the asteroid and activate the laser explosion
        destroyAsteroid(i);
        ship.lasers[j].explodeTime = Math.ceil(LASER_EXPLODE_DUR * FPS);

        break;
      }
    }
  }

  // check for asteroid collisions (when not exploding)
  if (!exploding) {
    // only check when not blinking
    if (ship.blinkNum == 0 && !ship.dead) {
      for (let i = 0; i < roids.length; i++) {
        if (
          distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
          ship.r + roids[i].r
        ) {
          explodeShip();
          destroyAsteroid(i);
          break;
        }
      }
    }

    // rotate the ship
    ship.a += ship.rot;

    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    // reduce the explode time
    ship.explodeTime--;

    // reset the ship after the explosion has finished
    if (ship.explodeTime == 0) {
      lives--;
      if (lives == 0) {
        gameOver();
      } else {
        ship = newShip();
      }
    }
  }

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canvas.width + ship.r;
  } else if (ship.x > canvas.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canvas.height + ship.r;
  } else if (ship.y > canvas.height + ship.r) {
    ship.y = 0 - ship.r;
  }

  // MOVE the LASERS
  for (let i = ship.lasers.length - 1; i >= 0; i--) {
    //check distance travel
    if (ship.lasers[i].dist > LASER_DIST * canvas.width) {
      ship.lasers.splice(i, 1);
      continue;
    }

    //handle the explosion
    if (ship.lasers[i].explodeTime > 0) {
      ship.lasers[i].explodeTime--;

      //destroy the laser after the duration is up
      if (ship.lasers[i].explodeTime == 0) {
        ship.lasers.splice(i, 1);
        continue;
      }
    } else {
      //move the laser
      ship.lasers[i].x += ship.lasers[i].xv;
      ship.lasers[i].y += ship.lasers[i].yv;

      //calculate the distance tracelled
      ship.lasers[i].dist += Math.sqrt(
        Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
      );
    }

    //handle edge of screen
    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canvas.width;
    } else if (ship.lasers[i].x > canvas.width) {
      ship.lasers[i].x = 0;
    }

    if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = canvas.height;
    } else if (ship.lasers[i].y > canvas.height) {
      ship.lasers[i].y = 0;
    }
  }
  // MOVE the ASTEROIDS
  for (let i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;

    // handle asteroid edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canvas.width + roids[i].r;
    } else if (roids[i].x > canvas.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canvas.height + roids[i].r;
    } else if (roids[i].y > canvas.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }
}
