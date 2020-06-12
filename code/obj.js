const assets = {
  player: new Image(),
  chaff: new Image(),
  missileIcon: new Image(),
  missile: new Image(),
  heart: new Image(),
  aircraftCarrier: new Image(),
  airBase: new Image(),
  enemy: new Image(),
  AAship: new Image(),
  AAtank: new Image(),
  AAgun: new Image(),
}

assets.player.src = "player.svg";
assets.chaff.src = "chaff.svg";
assets.missileIcon.src = "Missile.svg";
assets.missile.src = "MissileObject.svg";
assets.heart.src = "heart.svg";
assets.aircraftCarrier.src = "aircraft carrier.svg";
assets.airBase.src = "air base.svg";
assets.enemy.src = "enemy.svg";
assets.AAship.src = "AA ship.svg";
assets.AAtank.src = "AA tank.svg";
assets.AAgun.src = "AA gun.svg";

const π = Math.PI;

let gamepad;

Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

class RadarObject {
  constructor(x, y, radarCrossSection, health) {
    this.x = x;
    this.y = y;
    this.radarCrossSection = radarCrossSection;
    this.id = id;
    this.health = health;
    this.toRemove = false;
    id++;
  }

  damage(v) {
    this.health -= v;
    if (this.health <= 0) {
      this.toRemove = true;
    }
  }
}

class Player extends RadarObject {
  constructor(x, y, a) {
    super(x, y, 1, 100);
    this.vx = 0;
    this.vy = 0;
    this.a = a;
    this.r = 0;

    this.chaffTime = -1000000;
    this.missileTime = -1000000;

    this.acceleration = 1;

    this.trigger1 = false;
    this.trigger2 = false;
  }

  show() {
    if (gamepad) {
      // Point in direction of left joystick
      if (Math.abs(gamepad.axes[0]) > 0.5 || Math.abs(gamepad.axes[1]) > 0.5) {
        this.r = Math.atan2(gamepad.axes[1], gamepad.axes[0]);
      }

      // Go faster on a press
      if (gamepad.buttons[0].pressed) { // Go faster
        this.acceleration = terrainWidth / 8000;
      } else { // Or not
        this.acceleration = terrainWidth / 16000;
      }

      // Dispense 4 chaff if b is pressed and the timer runs out
      if (gamepad.buttons[1].pressed && this.chaffTime < performance.now() - 30000) {
        for (let i = 3; i >= 0; i--) {
          radarObjects.push(new Chaff(this.x + Math.random() * terrainWidth / 50, this.y + Math.random() * terrainHeight / 50));
        }
        this.chaffTime = performance.now();
      }

      // Shoot on right bumper
      if (!bumperPressed && gamepad.buttons[5].pressed) {
        radarObjects.push(new Bullet(player.x + Math.cos(player.r) * (terrainWidth / 200 + 10), player.y + Math.sin(player.r) * (terrainWidth / 200 + 10), player.r, true));
      }

      if (!this.trigger1 && gamepad.buttons[6].pressed && player.missileTime + 5000 < performance.now()) {
        // Make it not radar track if left trigger
        radarObjects.push(new Missile(player.x, player.y, gamepadMouse.x, gamepadMouse.y, false, true));
        player.missileTime = performance.now();
      }

      if (!this.trigger2 && gamepad.buttons[7].pressed && player.missileTime + 5000 < performance.now()) {
        // Make it radar track if right trigger
        radarObjects.push(new Missile(player.x, player.y, gamepadMouse.x, gamepadMouse.y, true, true));
        player.missileTime = performance.now();
      }

      bumperPressed = gamepad.buttons[5].pressed;
      this.trigger1 = gamepad.buttons[6].pressed;
      this.trigger2 = gamepad.buttons[7].pressed

      // Move gamepadMouse in direction of right joystick
      gamepadMouse.x += gamepad.axes[2] * 5;
      gamepadMouse.y += gamepad.axes[3] * 5;
    } else {
      if (keys.a) { // Turn left
        this.r -= 0.05;
      }

      if (keys.d) { // Turn right
        this.r += 0.05;
      }

      if (keys.w) { // Go faster
        this.acceleration = terrainWidth / 8000;
      } else { // Or not
        this.acceleration = terrainWidth / 16000;
      }

      // Dispense 4 chaff if space is pressed and the timer runs out
      if (keys.e && this.chaffTime < performance.now() - 30000) {
        for (let i = 3; i >= 0; i--) {
          radarObjects.push(new Chaff(this.x + Math.random() * terrainWidth / 50, this.y + Math.random() * terrainHeight / 50));
        }
        this.chaffTime = performance.now();
      }
    }

    // Calculate the x and y rotation components
    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    // Draw the player
    draw.save();
    draw.translate(this.x - camera.x, this.y - camera.y);
    draw.rotate(this.r + π / 2);
    draw.drawImage(assets.player, -c.width / 64, -c.width / 64, c.width / 32, c.width / 32);
    draw.restore();

    // Draw the distance missiles can go
    draw.strokeStyle = `rgba(0, 0, 0, 0.2)`;
    draw.beginPath();
    draw.arc(this.x - camera.x, this.y - camera.y, 150 * (terrainWidth / 400), 0, π * 2);
    draw.stroke();

    // Draw the line that shows where the radar is drawing
    draw.strokeStyle = `rgba(0, 255, 0, 0.5)`;
    draw.lineWidth = 2;
    draw.beginPath();
    draw.moveTo(this.x - camera.x, this.y - camera.y);
    draw.lineTo(this.x - camera.x + Math.cos(radarRotation) * 1000, this.y - camera.y + Math.sin(radarRotation) * 1000);
    draw.stroke();

    // Add the acceleration to the velocity
    this.vx += x * this.acceleration;
    this.vy += y * this.acceleration;

    // Add velocity to position
    this.x += this.vx;
    this.y += this.vy;

    // Apply drag
    this.vx *= 0.9;
    this.vy *= 0.9;

    if (this.toRemove) {
      return "remove";
    }
  }
}

class Enemy extends RadarObject {
  constructor(x, y, r) {
    super(x, y, 1, 20);
    this.r = r;
    this.vx = 0;
    this.vy = 0;
    this.randomDirection = false;
    this.chaffTime = -1000000;

    this.toAskRadar = true;

    this.shootMissiles = false;
    this.bulletsShot = 0;

    this.interval = setInterval(() => {
      radar2.postMessage(["radar", this.x, this.y, Math.atan2(player.y - this.y, player.x - this.x), 1000, 0.2, radarObjects.concat([player]), this.id, player.x - 10, player.y - 5, 20, 20]);
    }, 200);
  }

  show() {
    this.acceleration = terrainWidth / 16000;

    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    // let point1 = [x * 32 + this.x - camera.x, y * 32 + this.y - camera.y];
    // let point2 = [Math.cos(this.r + π) * 32 + this.x - camera.x, Math.sin(this.r + π) * 32 + this.y - camera.y];

    this.r = this.r.mod(π * 2);

    // Make the r turn towards the angleToTurn

    if (this.r - this.angleToTurn <= 0) {
      if (this.r - this.angleToTurn <= -π) {
        this.r -= 0.05;
      } else {
        this.r += 0.05;
      }
    } else {
      if (this.r - this.angleToTurn <= π) {
        this.r -= 0.05;
      } else {
        this.r += 0.05;
      }
    }


    // keep this.r within 0 and π*2

    this.r = this.r.mod(π * 2)

    // prevent jiggling

    if (this.r <= (0.05 + this.angleToTurn).mod(π * 2) && this.r >= (-0.05 + this.angleToTurn).mod(π * 2)) {
      this.r = this.angleToTurn;
    }

    // Draw the enemy

    if (dist(this.x, this.y, player.x, player.y) < terrainWidth / 8) {
      draw.save();
      draw.translate(this.x - camera.x, this.y - camera.y);
      draw.rotate(this.r + π / 2);
      draw.drawImage(assets.enemy, -c.width / 64, -c.width / 64, c.width / 32, c.width / 32);
      draw.restore();
    }

    // Add the acceleration to the velocity
    this.vx += x * this.acceleration;
    this.vy += y * this.acceleration;

    // Add velocity to position
    this.x += this.vx;
    this.y += this.vy;

    // Apply drag
    this.vx *= 0.9;
    this.vy *= 0.9;

    if (this.toRemove) {
      clearInterval(this.interval);
      return "remove";
    }
  }

  getRadarValue(radarData, name) {
    // Detect maximum value of radar data send back
    let max = 0;
    for (let i = radarData.length - 1; i >= 0; i--) {
      if (radarData[i][0] > max) {
        max = radarData[i][0];
      }
    }

    if (name == "missile") {
      this.toAskRadar = true;
    }

    if (max > 0.05) {
      if (name !== "missile") {
        let playerr = Math.atan2(player.y - this.y, player.x - this.x);

        // If far enough away, turn towards the player

        if (!this.randomDirection || dist(this.x, this.y, player.x, player.y) > terrainWidth / 4) {
          this.angleToTurn = playerr.mod(π * 2);
          this.randomDirection = false;
        }

        // If too close to player, turn off in random direction

        if (dist(this.x, this.y, player.x, player.y) < terrainWidth / 16 && !this.randomDirection) {
          this.angleToTurn = playerr + π;
          this.randomDirection = true;
        }

        // Shoot a bullet if pointing at the player, and not before or after shooting a missile
        if (!this.shootMissiles && this.r - 0.05 <= playerr.mod(π * 2) && this.r + 0.05 >= playerr.mod(π * 2)) {
          radarObjects.push(new Bullet(this.x + Math.cos(this.r) * (terrainWidth / 200 + 1), this.y + Math.sin(this.r) * (terrainWidth / 200 + 1), this.r, false));
          this.bulletsShot++;
        }

        // Look for any missiles
        if (this.toAskRadar) {
          for (let i = radarObjects.length - 1; i >= 0 && this.toAskRadar; i--) {
            if (radarObjects[i].isMissile && radarObjects[i].playerVisible) {
              console.log("radaring");
              this.toAskRadar = false;
              // If a missile if found, find out if it can be seen
              radar2.postMessage(["radar", this.x, this.y, Math.atan2(radarObjects[i].y - this.y, radarObjects[i].x - this.x), 1000, 0.2, radarObjects, this.id, radarObjects[i].x - 10, radarObjects[i].y - 5, 20, 20, "missile"]);
            }
          }
        }

        // If enough bullets have been shot, stop and shoot a missile
        if (this.bulletsShot >= 20) {
          this.shootMissiles = true;
          this.bulletsShot = 0;
          setTimeout(() => {
            radarObjects.push(new Missile(this.x, this.y, player.x, player.y, true, false));

            setTimeout(() => {
              this.shootMissiles = false;
            }, 2000);
          }, 2000);
        }
      } else {
        // If the missile can be seen and the chaff timer hasn't run out, dispense chaff
        if (this.chaffTime < performance.now() - 30000) {
          this.chaffTime = performance.now();
          for (let i = 3; i >= 0; i--) {
            radarObjects.push(new Chaff(this.x + Math.random() * terrainWidth / 50, this.y + Math.random() * terrainHeight / 50));
          }
        }
      }
    }
  }
}

class Missile extends RadarObject {
  constructor(x, y, tx, ty, radarTracking, playerVisible) {
    super(x, y, 0.5, 10);
    this.tx = tx;
    this.ty = ty;
    this.r = Math.atan2(y - ty, x - tx) + π;
    this.angleToTurn = this.r;
    this.radarDatas = [];
    this.playerVisible = playerVisible;
    this.frames = 150;
    this.isMissile = true;

    let boxx = this.tx - terrainWidth / 25;
    let boxy = this.ty - terrainHeight / 25;
    let boxw = terrainWidth / 12.5;
    let boxh = terrainHeight / 12.5;

    if (radarTracking) {
      for (let i = 0; i < 3; i++) {
        radar2.postMessage(["radar", this.x, this.y, this.r - (i - 1) / 10, 1000, 0.2, radarObjects.concat([player]), this.id, boxx, boxy, boxw, boxh]);
      }
    }
  }

  show() {
    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    // Turn towards the target angle
    if (this.r - this.angleToTurn <= 0) {
      if (this.r - this.angleToTurn <= -π) {
        this.r -= 0.01;
      } else {
        this.r += 0.01;
      }
    } else {
      if (this.r - this.angleToTurn <= π) {
        this.r -= 0.01;
      } else {
        this.r += 0.01;
      }
    }

    // Move
    this.x += x * (terrainWidth / 400);
    this.y += y * (terrainWidth / 400);

    // Drawing code
    if (this.playerVisible || dist(this.x, this.y, player.x, player.y) < terrainWidth / 8) {
      // Draw the missile
      draw.save();
      draw.translate(this.x - camera.x, this.y - camera.y);
      draw.rotate(this.r + π / 2);
      draw.drawImage(assets.missile, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
      draw.restore();

      // Draw the target position
      draw.beginPath();
      draw.arc(this.tx - camera.x, this.ty - camera.y, 4, 0, π * 2);
      draw.fill();

      // Draw the distance this missile can go
      draw.strokeStyle = `rgba(0, 0, 0, 0.2)`;
      draw.beginPath();
      draw.arc(this.x - camera.x, this.y - camera.y, this.frames * (terrainWidth / 400), 0, π * 2);
      draw.stroke();

      // for (let i = 2; i >= 1; i--) {
      particles.push(new Particle(Math.cos(this.r + π) * 32 + this.x, Math.sin(this.r + π) * 32 + this.y, this.r + (Math.random() - 0.5) / 2 + π, (terrainWidth / (400 - Math.random() * 100)), 4, `hsl(${Math.random()*54}, 100%, 50%)`, 5000 + Math.random() * 10000));
      // }
    }

    // Explode if close to the target or if the frames left is 0
    if (dist(this.x, this.y, this.tx, this.ty) < terrainWidth / 100 || this.frames <= 0) {
      explode(this.x, this.y, 50);
      return "remove";
    }

    // Decrease the maximum amount of frames
    this.frames--;

    if (this.toRemove) {
      return "remove";
    }
  }

  targetUpdate() {
    // Squish the 3 radar beams into one data set
    let datas = this.radarDatas[0].concat(this.radarDatas[1]).concat(this.radarDatas[2]);

    // Find the biggest radar value in the radar value list within a square around the target position
    let maxValue = [-Infinity, "no", "no"];
    let boxx = this.tx - terrainWidth / 25;
    let boxy = this.ty - terrainHeight / 25;
    let boxw = terrainWidth / 12.5;
    let boxh = terrainHeight / 12.5;
    for (let i = datas.length - 1; i >= 0; i--) {
      if (datas[i][0] > maxValue[0]) {
        maxValue = datas[i];
      }
    }

    // If the maxValue was changed from it's default, set the target position to the max value.
    if (maxValue[1] !== "no") {
      this.tx = maxValue[1];
      this.ty = maxValue[2];
    }

    // Set the target angle to the angle to the target position
    this.angleToTurn = Math.atan2(this.y - this.ty, this.x - this.tx) + π;

    // Reset the radar data list
    this.radarDatas = [];

    // Request more radar data
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        radar2.postMessage(["radar", this.x, this.y, this.r - (i - 1) / 10, 1000, 0.2, radarObjects.concat([player]), this.id, boxx, boxy, boxw, boxh]);
      }
    }, 100);
  }

  // When the missile gets radar data back, add it to the list and call the above funtion if the list is 3 long
  getRadarValue(data) {
    this.radarDatas.push(data);
    if (this.radarDatas.length == 3) {
      this.targetUpdate();
    }
  }
}

class Chaff extends RadarObject {
  constructor(x, y) {
    super(x, y, 1, 10);

    this.startTime = performance.now();
    this.time = 5000 + Math.random() * 10000;
  }

  show() {
    if (this.toRemove || performance.now() - this.startTime > this.time) {
      return "remove";
    }
  }
}

class Bullet extends RadarObject {
  constructor(x, y, r, playerVisible) {
    super(x, y, 0.2);
    this.vx = Math.cos(r) * (terrainWidth / 200);
    this.vy = Math.sin(r) * (terrainWidth / 200);
    this.frames = 2 * 60;
    this.playerVisible = playerVisible;

    if (playerVisible) {
      for (let i = 3; i > 0; i--) {
        particles.push(new Particle(this.x, this.y, this.r + (Math.random() - 0.5) / 2, terrainWidth / 400, 2, "#111", 500))
      }
    }
  }

  show() {
    // Draw the bullet if it was shot by the player or if it's close to the player
    if (this.playerVisible || dist(this.x, this.y, player.x, player.y) < terrainWidth / 8) {
      draw.beginPath();
      draw.arc(this.x - camera.x, this.y - camera.y, 2, 0, π * 2);
      draw.fill();
    }

    // Check for collisions
    let toTest = radarObjects.concat([player]);
    for (let i = toTest.length - 1; i >= 0; i--) {
      if (this.id !== toTest[i].id && dist(this.x, this.y, toTest[i].x, toTest[i].y) < terrainWidth / 200) {
        toTest[i].damage(5);
        this.toRemove = true;
      }
    }

    this.x += this.vx;
    this.y += this.vy;
    if (this.frames == 0 || this.toRemove) {
      return "remove";
    }

    this.frames--;
  }
}

class AntiAir {
  constructor(x, y, ocean, id) {
    this.x = x;
    this.y = y;
    this.r = 0;
    this.ocean = ocean;
    this.id = id;
    id++;

    this.health = 50;

    this.interval = setInterval(() => {
      radar2.postMessage(["radar", this.x, this.y, Math.atan2(player.y - this.y, player.x - this.x), 1000, 0.2, radarObjects.concat([player]), this.id, player.x - 10, player.y - 5, 20, 20, "aa"]);
    }, 200);
  }

  show() {
    try {
      // If it's the air base, then draw the airbase
      this.showAirBase();
    } catch (error) {
      // Otherwise, draw the AA thing
      if (this.ocean) {
        // Ocean AA
        draw.save();
        draw.translate(this.x - camera.x, this.y - camera.y);
        draw.rotate(0);
        draw.drawImage(assets.AAship, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
        draw.restore();
      } else {
        // Land AA
        draw.save();
        draw.translate(this.x - camera.x, this.y - camera.y);
        draw.rotate(0);
        draw.drawImage(assets.AAtank, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
        draw.restore();
      }
      // The gun
      draw.save();
      draw.translate(this.x - camera.x, this.y - camera.y);
      draw.rotate(this.r + π / 2);
      draw.drawImage(assets.AAgun, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
      draw.restore();
    }

    if (this.toRemove) {
      clearInterval(this.interval);
      return "thingy";
    }
  }

  getRadarValue(radarData, name) {
    // Detect maximum value of radar data send back
    let max = 0;
    for (let i = radarData.length - 1; i >= 0; i--) {
      if (radarData[i][0] > max) {
        max = radarData[i][0];
      }
    }

    // Test if player can be seen
    if (max > 0.05) {
      // Point towards play and shoot
      this.r = Math.atan2(player.y - this.y, player.x - this.x);

      radarObjects.push(new Bullet(this.x + Math.cos(this.r) * (c.width / 42), this.y + Math.sin(this.r) * (c.width / 42), this.r, false));
    }
  }

  damage(v) {
    console.log("damage");
    this.health -= v;
    if (this.health <= 0) {
      this.toRemove = true;
    }
  }
}

class AirBase extends AntiAir {
  constructor(ocean) {
    super(terrainWidth * 0.95, terrainHeight * 0.95, ocean);
    this.health = 250;
    this.ocean = ocean;

    this.frames = 0;
  }

  showAirBase() {
    // draw differently if in ocean or land
    if (this.ocean) {
      draw.save();
      draw.translate(this.x - camera.x, this.y - camera.y);
      draw.rotate(this.r + π / 2);
      draw.drawImage(assets.aircraftCarrier, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
      draw.restore();
    } else {
      draw.save();
      draw.translate(this.x - camera.x, this.y - camera.y);
      draw.rotate(this.r + π / 2);
      draw.drawImage(assets.airBase, -c.width / 64 * 1.6, -c.width / 64 * 1.6, c.width / 32 * 1.6, c.width / 32 * 1.6);
      draw.restore();
    }

    if (this.frames % 600 == 0 && airplanes > 0) {
      radarObjects.push(new Enemy(this.x, this.y, π * 1.125));
      airplanes--;
    }

    this.frames++;
  }

  damage(v) {
    this.health -= v;

    if (this.health <= 0) {
      // Increment level, regenerate terrain, clear radar, reset variables
      level++;
      drawn = false;
      terrainGenerater.postMessage(["terrain", terrainWidth, terrainHeight, level]);
      radar.clearRect(0, 0, c.width, c.height);
      radar.fillStyle = "rgba(0, 0, 0, 0.5)";
      radar.fillRect(0, 0, c.width, c.height);
      restart();
    }
  }
}

class Particle {
  constructor(x, y, r, v, size, color, time) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(r) * v;
    this.vy = Math.sin(r) * v;
    this.size = size;
    this.color = color;
    this.time = time;

    this.startTime = performance.now();
  }

  show() {
    // Draw the particle
    draw.fillStyle = this.color;
    draw.beginPath();
    draw.arc(this.x - camera.x, this.y - camera.y, this.size, 0, π * 2);
    draw.fill();

    // Change position and velocity
    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.96;
    this.vy *= 0.96;

    // Remove after some time
    if (this.startTime + this.time < performance.now()) {
      return "remove";
    }
  }
}

// Listen for which keys are pressed and stick them in an object
const keys = {};
window.addEventListener("keydown",
  function (e) {
    keys[e.key] = true;

    if (e.key == " ") {
      radarObjects.push(new Bullet(player.x + Math.cos(player.r) * (terrainWidth / 200 + 10), player.y + Math.sin(player.r) * (terrainWidth / 200 + 10), player.r, true));
    } else if (menu && e.key == "Enter") {
      start();
    }
  },
  false);

window.addEventListener('keyup',
  function (e) {
    keys[e.key] = false;
  },
  false);

window.addEventListener("gamepadconnected", function (e) {
  gamepad = navigator.getGamepads()[e.gamepad.index];
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    gamepad.index, gamepad.id,
    gamepad.buttons.length, gamepad.axes.length);
});

window.addEventListener("gamepaddisconnected", (e) => {
  gamepad = undefined;
})