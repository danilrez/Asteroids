const FPS = 30; // frames per second
const FRICTION = 0.7; // friction coefficient of space (0 = no friction, 1 = lots of friction)
const SHIP_SIZE = 30; // ship height in pixels
const SHIP_THRUST = 7; // acceleration of the ship in pixels per second per second
const TURN_SPEED = 360; // turn speed in degrees per second

/** @type {HTMLCanvasElement} */
const canv = document.getElementById('gameCanvas');
const ctx = canv.getContext('2d');

// set up the spaceship object
const ship = {
  x: canv.width / 2,
  y: canv.height / 2,
  r: SHIP_SIZE / 2,
  a: (90 / 180) * Math.PI, // convert to radians
  rot: 0,
  thrusting: false,
  thrust: {
    x: 0,
    y: 0
  }
};

// set up event handlers
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function keyDown(/** @type {KeyboardEvent} */ ev) {
  switch (ev.keyCode) {
    case 37: // left arrow (rotate ship left)
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    case 38: // up arrow (thrust the ship forward)
      ship.thrusting = true;
      break;
    case 39: // right arrow (rotate ship right)
      ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
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

function update() {
  // draw space
  const gradient = ctx.createLinearGradient(400, 0, 400, 600);
  //gradient.addColorStop(1, 'rgb(255, 215, 0)');
  gradient.addColorStop(0.95, 'rgb(44, 0, 53)');
  gradient.addColorStop(0.5, 'rgb(10, 0, 15)');
  gradient.addColorStop(0, 'rgb(5, 5, 5)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canv.width, canv.height);

  // thrust the ship
  if (ship.thrusting) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;

    // draw the thruster
    ctx.fillStyle = 'rgb(255, 0, 98)';
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
      ship.x - ((ship.r * 4.5) / 3) * Math.cos(ship.a),
      ship.y + ((ship.r * 4.5) / 3) * Math.sin(ship.a)
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

  // draw the triangular ship
  ctx.strokeStyle = 'rgb(255,255,255)';

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

  // rotate the ship
  ship.a += ship.rot;

  // move the ship
  ship.x += ship.thrust.x;
  ship.y += ship.thrust.y;

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  }
}
