const assets = {
  player: new Image()
}

assets.player.src = "player.svg";

Number.prototype.mod = function (n) {
  return ((this % n) + n) % n;
};

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

class RadarObject {
  constructor(x, y, radarCrossSection) {
    this.x = x;
    this.y = y;
    this.radarCrossSection = radarCrossSection;
    this.id = id;
    id++;
  }
}

class Player extends RadarObject {
  constructor(x, y, a) {
    super(x, y, 1);
    this.vx = 0;
    this.vy = 0;
    this.a = a;
    this.r = 0;

    this.acceleration = 1;
  }

  show() {
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

    // Calculate the x and y rotation components
    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    // Draw the player
    draw.save();
    draw.translate(this.x - camera.x, this.y - camera.y);
    draw.rotate(this.r + Math.PI / 2);
    draw.drawImage(assets.player, -c.width / 64, -c.width / 64, c.width / 32, c.width / 32);
    draw.restore();

    // Spawn radar beams
    // for (let i = 0; i < 2; i++) {
    // }
    // Draw the line that shows where the radar is drawing
    draw.strokeStyle = `rgba(0, 255, 0, 0.5)`;
    draw.beginPath();
    draw.moveTo(this.x - camera.x, this.y - camera.y);
    draw.lineTo(this.x - camera.x + Math.cos(this.radarRotation) * 1000, this.y - camera.y + Math.sin(this.radarRotation) * 1000);
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
  }
}

class Enemy extends RadarObject {
  constructor(x, y, r) {
    super(x, y, 1);
    this.r = r;
    this.vx = 0;
    this.vy = 0;
    this.randomDirection = false;
  }

  show() {
    this.acceleration = terrainWidth / 16000;

    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    // let point1 = [x * 32 + this.x - camera.x, y * 32 + this.y - camera.y];
    // let point2 = [Math.cos(this.r + Math.PI) * 32 + this.x - camera.x, Math.sin(this.r + Math.PI) * 32 + this.y - camera.y];

    this.r = this.r.mod(Math.PI * 2)

    this.angleToTurn;

    // If far enough away, turn towards the player

    if (!this.randomDirection || dist(this.x, this.y, player.x, player.y) > terrainWidth / 4) {
      this.angleToTurn = Math.atan2(player.y - this.y, player.x - this.x).mod(Math.PI * 2);
      this.randomDirection = false;
    }

    // If too close to player, turn off in random direction

    if (dist(this.x, this.y, player.x, player.y) < terrainWidth / 16 && !this.randomDirection) {
      this.angleToTurn = Math.random() * Math.PI * 2;
      this.randomDirection = true;
    }

    // if (this.r > this.angleToTurn.mod(Math.PI * 2) && this.r - Math.PI * 2 > this.angleToTurn.mod(Math.PI * 2)) {
    //   this.r -= 0.05;
    // } else {
    //   this.r += 0.05;
    // }

    // Make the r turn towards the angleToTurn

    if (this.r - this.angleToTurn <= 0) {
      if (this.r - this.angleToTurn <= -Math.PI) {
        this.r -= 0.05;
      } else {
        this.r += 0.05;
      }
    } else {
      if (this.r - this.angleToTurn <= Math.PI) {
        this.r -= 0.05;
      } else {
        this.r += 0.05;
      }
    }

    // keep this.r within 0 and math.pi*2

    this.r = this.r.mod(Math.PI * 2)

    // prevent jiggling

    if (this.r <= (0.05 + this.angleToTurn).mod(Math.PI * 2) && this.r >= (-0.05 + this.angleToTurn).mod(Math.PI * 2)) {
      this.r = this.angleToTurn;
    }

    // Draw the enemy

    // draw.strokeStyle = "#000";
    // draw.lineWidth = 4;
    // draw.beginPath();
    // draw.moveTo(point1[0], point1[1]);
    // draw.lineTo(point2[0], point2[1]);
    // draw.stroke();

    // Add the acceleration to the velocity
    this.vx += x * this.acceleration;
    this.vy += y * this.acceleration;

    // Add velocity to position
    this.x += this.vx;
    this.y += this.vy;

    // Apply drag
    this.vx *= 0.9;
    this.vy *= 0.9;
  }
}

class Missile extends RadarObject {
  constructor(x, y, tx, ty) {
    super(x, y, 0.5);
    this.tx = tx;
    this.ty = ty;
    this.r = Math.atan2(y - ty, x - tx) + Math.PI;
    this.angleToTurn = this.r;
    this.radarDatas = [];

    for (let i = 0; i < 3; i++) {
      terrainGenerater.postMessage(["radar", this.x, this.y, this.r - (i - 1) / 5, 1000, 0.2, radarObjects.concat([player]), this.id]);
    }
  }

  show() {
    let x = Math.cos(this.r);
    let y = Math.sin(this.r);

    if (this.r - this.angleToTurn <= 0) {
      if (this.r - this.angleToTurn <= -Math.PI) {
        this.r -= 0.01;
      } else {
        this.r += 0.01;
      }
    } else {
      if (this.r - this.angleToTurn <= Math.PI) {
        this.r -= 0.01;
      } else {
        this.r += 0.01;
      }
    }

    this.x += x * 5;
    this.y += y * 5;

    let point1 = [x * 32 + this.x - camera.x, y * 32 + this.y - camera.y];
    let point2 = [Math.cos(this.r + Math.PI) * 32 + this.x - camera.x, Math.sin(this.r + Math.PI) * 32 + this.y - camera.y];

    draw.strokeStyle = "#000";
    draw.lineWidth = 4;
    draw.beginPath();
    draw.moveTo(point1[0], point1[1]);
    draw.lineTo(point2[0], point2[1]);
    draw.stroke();

  }

  targetUpdate() {
    // Squish the 3 radar beams into one data set
    let datas = this.radarDatas[0].concat(this.radarDatas[1]).concat(this.radarDatas[2]);

    // Find the biggest radar value in the radar value list within a square around the target position
    let maxValue = [-Infinity, "no", "no"];
    for (let i = 0; i < datas.length; i++) {
      if (datas[i][1] - this.tx < terrainWidth / 25 && datas[i][1] - this.tx > -terrainWidth / 25 && datas[i][2] - this.ty < terrainHeight / 25 && datas[i][2] - this.ty > -terrainHeight / 25) {
        if (datas[i][0] > maxValue[0]) {
          maxValue = datas[i];
        }
      }
    }

    // If the maxValue was changed from it's default, set the target position to the max value.
    if (maxValue[1] !== "no") {
      this.tx = maxValue[1];
      this.ty = maxValue[2];
    }

    // Set the target angle to the angle to the target position
    this.angleToTurn = Math.atan2(this.y - this.ty, this.x - this.tx) + Math.PI;

    // Reset the radar data list
    this.radarDatas = [];

    // Request more radar data
    for (let i = 0; i < 3; i++) {
      terrainGenerater.postMessage(["radar", this.x, this.y, this.r - (i - 1) / 5, 1000, 0.2, radarObjects.concat([player]), this.id]);
    }
  }

  // When the missile gets radar data back, add it to the list and call the above funtion if the list is 3 long
  getRadarValue(data) {
    this.radarDatas.push(data);
    if (this.radarDatas.length == 3) {
      this.targetUpdate();
    }
  }
}

// Listen for which keys are pressed and stick them in an object
const keys = {};
window.addEventListener("keydown",
  function (e) {
    keys[e.key] = true;
  },
  false);

window.addEventListener('keyup',
  function (e) {
    keys[e.key] = false;
  },
  false);