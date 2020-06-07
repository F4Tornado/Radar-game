// Set up the canvas
const c = document.getElementById("c");
const draw = c.getContext("2d");

const radarC = document.getElementById("radar");
const radar = radarC.getContext("2d");

const backgroundC = document.getElementById("background");
const background = backgroundC.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

radarC.width = window.innerWidth;
radarC.height = window.innerHeight;

radar.fillStyle = "rgba(0, 0, 0, 0.5)";
radar.fillRect(0, 0, c.width, c.height);

let radarData = radar.getImageData(0, 0, c.width, c.height);
let radarPixels = radarData.data;

let drawn = false;

const radarObjects = [];
let id = 0;

let level = 1;

const particles = [];

let player = new Player(100, 100, 0.2);

let airBase;

let menuScreen = false;

// Get the web worker to generate the heightmap
let terrainWidth = c.width * 1;
let terrainHeight = c.width * 1;

backgroundC.width = terrainWidth;
backgroundC.height = terrainHeight;

const camera = {
  x: 0,
  y: 0,
}

let heightmap;

let terrainGenerater = new Worker("terrain.js");

terrainGenerater.postMessage(["terrain", terrainWidth, terrainHeight, level]);

let radar2 = new Worker("radar2.js");

// radarObjects.push(new Missile(200, 200, 100, 100, true));


terrainGenerater.onmessage = (msg) => {
  // console.log(msg.data);
  if (msg.data[0] == "heightmap") {
    console.log("Generated");
    heightmap = msg.data[1];

    radar2.postMessage(["terrain", terrainWidth, terrainHeight, heightmap]);

    // Create the image data
    let imageData = background.getImageData(0, 0, backgroundC.width, backgroundC.height);
    let pixels = imageData.data;
    // Draw each pixel
    for (let i = 0; i < pixels.length; i += 4) {
      // get the height to draw on screen using the heightmap
      let brightness = heightmap[i / 4];

      if (brightness < 0.05) { // Oceans
        pixels[i] = map(brightness, 0, 0.05, 32, 64);
        pixels[i + 1] = map(brightness, 0, 0.05, 64, 192);
        pixels[i + 2] = map(brightness, 0, 0.05, 128, 255);
      } else if (brightness < 0.1) { // Beaches
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 128;
      } else if (brightness <= 1) { // Plains & mountains
        pixels[i] = map(brightness, 0.1, 1, 0, 255);
        pixels[i + 1] = map(brightness, 0.1, 1, 128, 255);
        pixels[i + 2] = map(brightness, 0.1, 1, 0, 255);
      }

      pixels[i + 3] = 255;
    }

    // Draw the image data onto a blank canvas
    background.putImageData(imageData, 0, 0);

    airBase = new AirBase(heightmap[Math.round(terrainWidth * 0.95) + Math.round(terrainHeight * 0.95) * terrainWidth] < 0.05);

    menuScreen = true;
  } else if (msg.data[0] == "radarData" && drawn) {
    if (msg.data[7] == "radarScreen") {
      if (msg.data[3] % (Math.PI * 2) < 0.1) {
        radar.clearRect(0, 0, c.width, c.height);
        radar.fillStyle = "rgba(0, 0, 0, 0.5)";
        radar.fillRect(0, 0, c.width, c.height);
        radarData = radar.getImageData(0, 0, c.width, c.height);
        radarPixels = radarData.data;
      }

      // Loop through ever point sent back in the radar data
      for (let i = 0; i < msg.data[6].length; i++) {
        // Calculate the x and y of the current point to draw
        let x = msg.data[6][i][1] - camera.x;
        let y = msg.data[6][i][2] - camera.y;

        if (x < c.width && x > 0 && y < c.height && y > 0) {
          // Turn the x & y to a pixel index
          let j = ((Math.round(y) * c.width) + Math.round(x)) * 4;

          // Draw the pixel
          radarPixels[j] = 0;
          radarPixels[j + 1] = map(msg.data[6][i][0], 0, 0.1, 0, 255);
          radarPixels[j + 2] = 0;
        }
      }
      terrainGenerater.postMessage(["radar", player.x, player.y, radarRotation, 1000, player.a, radarObjects, "radarScreen"]);
      radarRotation += 0.02;
    } else if (drawn) {
      // Send any radar data not to be drawn to the screen to the radar object with the id in the name
      for (let i = 0; i < radarObjects.length; i++) {
        if (radarObjects[i].id == msg.data[7]) {
          radarObjects[i].getRadarValue(msg.data[6]);
        }
      }
    }
  }
}

radar2.onmessage = (msg) => {
  if (drawn) {
    for (let i = 0; i < radarObjects.length; i++) {
      if (radarObjects[i].id == msg.data[7]) {
        radarObjects[i].getRadarValue(msg.data[6]);
      }
    }
  }
}

function drawLoop() {
  setTimeout(drawLoop, 1000 / 60);

  let t1 = performance.now();

  // Draw the background
  draw.fillStyle = "#000";
  draw.fillRect(0, 0, c.width, c.height);

  if (drawn) {
    // Make the camera follow the player without showing areas outside the map
    camera.x = player.x < c.width / 2 ? 0 : player.x > terrainWidth - c.width / 2 ? terrainWidth - c.width : player.x - c.width / 2;
    camera.y = player.y < c.height / 2 ? 0 : player.y > terrainHeight - c.height / 2 ? terrainHeight - c.height : player.y - c.height / 2;

    // Draw the visible area of the hidden canvas
    draw.drawImage(backgroundC, camera.x, camera.y, c.width, c.height, 0, 0, c.width, c.height);

    // Draw the particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].show()) {
        particles.splice(i, 1);
      }
    }

    // Draw and calculate the player
    player.show();

    // Draw the air base
    airBase.show();

    // Draw a black circle in the corner
    draw.fillStyle = "#000";
    draw.beginPath();
    draw.arc(42, 42, 24, 0, Math.PI * 2);
    draw.fill();

    // Draw an arc around the circle representing how long until you can dispense more chaff
    draw.lineWidth = 4;
    draw.strokeStyle = "#f00";
    draw.beginPath();
    draw.arc(42, 42, 24, 0, (Math.PI * 2) * ((performance.now() - player.chaffTime) / 30000));
    draw.stroke();

    // Draw chaff icon
    draw.save();
    draw.translate(18, 18);
    draw.rotate(this.r + Math.PI / 2);
    draw.drawImage(assets.chaff, 0, 0, 48, 48);
    draw.restore();


    // Same thing for missiles
    draw.fillStyle = "#000";
    draw.beginPath();
    draw.arc((54) * 2, 42, 24, 0, Math.PI * 2);
    draw.fill();

    draw.lineWidth = 4;
    draw.strokeStyle = "#f00";
    draw.beginPath();
    draw.arc((54) * 2, 42, 24, 0, (Math.PI * 2) * ((performance.now() - player.missileTime) / 5000));
    draw.stroke();

    draw.save();
    draw.translate((54) * 2 - 24, 18);
    draw.rotate(this.r + Math.PI / 2);
    draw.drawImage(assets.missileIcon, 0, 0, 48, 48);
    draw.restore();


    // Same thing for health
    draw.fillStyle = "#000";
    draw.beginPath();
    draw.arc((58) * 3, 42, 24, 0, Math.PI * 2);
    draw.fill();

    draw.lineWidth = 4;
    draw.strokeStyle = "#f00";
    draw.beginPath();
    draw.arc((58) * 3, 42, 24, 0, (Math.PI * 2) * (player.health / 100));
    draw.stroke();

    draw.save();
    draw.translate((58) * 3 - 24, 18);
    draw.rotate(this.r + Math.PI / 2);
    draw.drawImage(assets.heart, 0, 0, 48, 48);
    draw.restore();

    // Restart the level limmediately if the player dies
    if (player.health <= 0) {
      restart();
    }

    // Draw the current radar to the screen
    radar.putImageData(radarData, 0, 0);

    // Show/delete the radar objects
    for (let i = 0; i < radarObjects.length; i++) {
      if (radarObjects[i].show()) {
        radarObjects.splice(i, 1);
      }
    }
  } else if (menuScreen) {
    // Draw the map and write the level number to the menu screen
    document.getElementById("menu").style = "";
    document.getElementById("level").innerHTML = `Level ${level}`;
    draw.drawImage(backgroundC, camera.x, camera.y, c.width, c.height, 0, 0, c.width, c.height);
  } else {
    // loading screen
    let time = Date.now();
    for (let i = 0; i < 10; i++) {
      draw.strokeStyle = `hsl(${map(i, 0, 10, 0, 360)}, 100%, 50%)`;
      draw.lineWidth = 16;
      draw.beginPath();
      draw.arc(c.width / 2, c.height / 2, 64 + i * 24, (time / (100 * (i + 1))) % (Math.PI * 2), (time / (100 * (i + 1)) + Math.PI / 2) % (Math.PI * 2));
      draw.stroke();
    }
  }

  // console.log(performance.now() - t1, 1000 / 60);
}

function explode(x, y, power) {
  // Add the player and air base to the things that can be damaged
  let objects = radarObjects.concat([player, airBase]);
  for (let i = objects.length - 1; i >= 0; i--) {

    // Deal damage if close enough and depeding on the distance
    let distance = dist(objects[i].x, objects[i].y, x, y) / terrainWidth;
    if (distance < 0.1) {
      objects[i].damage(Math.min((power / 50) / distance, power));
    }
  }

  // Explosion particles
  for (let i = 100; i > 0; i--) {
    particles.push(new Particle(x, y, Math.random() * Math.PI * 2, Math.random() * power / 25, 4, `hsl(${Math.random()*54}, 100%, 50%)`, 1000 * Math.random() + 1000));
  }
}

// Resize the screen if neccesary
window.onresize = () => {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  radarC.width = window.innerWidth;
  radarC.height = window.innerHeight;

  radar.fillStyle = "rgba(0, 0, 0, 0.5)";
  radar.fillRect(0, 0, c.width, c.height);
  radarData = radar.getImageData(0, 0, c.width, c.height);
  radarPixels = radarData.data;
}

function restart() {
  // Reset the radar objects, particles, and player
  radarObjects.splice(0, radarObjects.length);
  particles.splice(0, radarObjects.length);
  player = new Player(100, 100, 0.2);
}

function start() {
  // Remove the menu
  menu = false;
  document.getElementById("menu").style = "opacity: 0";
  setTimeout(() => {
    document.getElementById("menu").style = "display: none";

    // Let the code go into the regular draw loop
    drawn = true;
    menuScreen = false;

    // Ask for radar data
    terrainGenerater.postMessage(["radar", player.x, player.y, radarRotation, 1000, player.a, radarObjects, "radarScreen"]);
    radarRotation += 0.04;
  }, 200);
}

let radarRotation = 0;

function map(v, min1, max1, min2, max2) {
  return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

radarC.addEventListener("mousedown", (e) => {
  // Dispense a missle when you click
  if (player.missileTime + 5000 < performance.now()) {
    switch (event.which) {
      case 1:
        // Make it not radar track if left click
        radarObjects.push(new Missile(player.x, player.y, e.clientX + camera.x, e.clientY + camera.y, false, true));
        break;
      case 3:
        // Make it radar track if right click
        radarObjects.push(new Missile(player.x, player.y, e.clientX + camera.x, e.clientY + camera.y, true, true));
        break;
    }

    player.missileTime = performance.now();
  }
})

// Prevent right click from opening up menu
radarC.addEventListener("contextmenu", event => event.preventDefault());

drawLoop();