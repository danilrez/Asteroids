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
const SAVE_KEY_SCORE = 'highscore'; // save key for local storage of high score
const SHIP_BLINK_DUR = 0.1; // duration in seconds of a single blink during ship's invisibility
const SHIP_EXPLODE_DUR = 0.3; // duration of the ship's explosion in seconds
const SHIP_INV_DUR = 3; // duration of the ship's invisibility in seconds
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 5; // acceleration of the ship in pixels per second per second
const SHIP_TURN_SPD = 360; // turn speed in degrees per second
const SHOW_BOUNDING = true; // show or hide collision bounding
const SHOW_CENTRE_DOT = false; // show or hide ship's centre dot
const TEXT_FADE_TIME = 2.5; // text fade time in seconds
const TEXT_SIZE = 40; // text font height in pixels

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set up the spaceship object
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: SHIP_SIZE / 2,
  a: (90 / 180) * Math.PI, // convert to radians
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
};

// set up asteroids
let roids = [];
createAsteroidBelt();

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidBelt() {
  roids = [];
  let x, y;
  for (let i = 0; i < ROID_NUM; i++) {
    // random asteroid location (not touching spaceship)
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROID_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y));
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function explodeShip() {
  ctx.fillStyle = 'lime';
  ctx.strokeStyle = 'lime';
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.stroke();
}

function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
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
  switch (ev.keyCode) {
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

function newAsteroid(x, y) {
  let roid = {
    a: Math.random() * Math.PI * 2, // in radians
    offs: [],
    r: ROID_SIZE / 2,

    vert: Math.floor(Math.random() * (ROID_VERT + 1) + ROID_VERT / 1.5), //how asteroids looks like
    x: x,
    y: y,
    xv: ((Math.random() * ROID_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1),
    yv: ((Math.random() * ROID_SPD) / FPS) * (Math.random() < 0.5 ? 1 : -1)
  };

  // populate the offsets array
  for (let i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
  }

  return roid;
}

function update() {
  // DRAW SPACE
  const gradientBG = ctx.createRadialGradient(400, 300, 50, 400, 300, 600);
  gradientBG.addColorStop(1, 'rgb(0, 0, 0)');
  gradientBG.addColorStop(0.5, 'rgb(25, 25, 25)');

  ctx.fillStyle = gradientBG;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // thrust the ship
  if (ship.thrusting) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    // DRAW the thruster (how ship's fire looks like)
    ctx.fillStyle = 'rgb(190, 5, 10)';
    ctx.strokeStyle = 'rgb(255, 215, 0)';

    ctx.lineWidth = SHIP_SIZE / 10;
    ctx.beginPath();
    ctx.moveTo(
      // rear left
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
    );
    ctx.lineTo(
      // rear centre (behind the ship)
      ship.x - ((ship.r * 5) / 3) * Math.cos(ship.a),
      ship.y + ((ship.r * 5) / 3) * Math.sin(ship.a)
    );
    ctx.lineTo(
      // rear right
      ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
      ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // apply friction (slow the ship down when not thrusting)
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }

  // DRAW the triangular SHIP
  ///////////// NEED DRAW COOL SHIP /////////////
  ctx.strokeStyle = 'white';
  ctx.lineWidth = SHIP_SIZE / 20;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
    ship.y - (4 / 3) * ship.r * Math.sin(ship.a)
  );
  ctx.lineTo(
    // rear left
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - Math.cos(ship.a))
  );
  ctx.lineTo(
    // rear right
    ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - Math.sin(ship.a)),
    ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + Math.cos(ship.a))
  );
  ctx.closePath();
  ctx.stroke();
  ////////////////////////////////////////////////

  if (SHOW_BOUNDING) {
    ctx.strokeStyle = 'lime';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2, false);
    ctx.stroke();
  }

  //// DRAW the ASSTEROIDS =>>

  let a, r, x, y, offs, vert;

  for (let i = 0; i < roids.length; i++) {
    ctx.strokeStyle = 'rgb(90, 90, 90)';
    ctx.lineWidth = SHIP_SIZE / 20;

    // get the asteroid properties
    a = roids[i].a;
    r = roids[i].r;
    x = roids[i].x;
    y = roids[i].y;
    offs = roids[i].offs;
    vert = roids[i].vert;

    // DRAW the PATH
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));

    // DRAW the POLYGON
    for (let j = 1; j < vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();

    if (SHOW_BOUNDING) {
      ctx.strokeStyle = 'lime';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2, false);
      ctx.stroke();
    }
  }
  // check for asteroid collisions
  for (let i = 0; i < roids.length; i++) {
    if (
      distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
      ship.r + roids[i].r
    ) {
      explodeShip();
    }
  }

  // rotate the ship
  ship.a += ship.rot;

  // move the ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

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

  // move the asteroids
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
