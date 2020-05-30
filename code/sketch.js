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

const player = new Player(100, 100, 0.2);

const enemies = [];

// Get the web worker to generate the heightmap
let terrainWidth = c.width * 1;
let terrainHeight = c.width * 1;

for (let i = 0; i < 10; i++) {
  enemies.push(new Enemy(Math.random() * terrainWidth, Math.random() * terrainHeight, Math.random() * Math.PI * 2))
}

backgroundC.width = terrainWidth;
backgroundC.height = terrainHeight;

const camera = {
  x: 0,
  y: 0,
}

let heightmap;

let terrainGenerater = new Worker("terrain.js");

terrainGenerater.postMessage(["terrain", terrainWidth, terrainHeight]);

terrainGenerater.onmessage = (msg) => {
  // console.log(msg.data);
  if (msg.data[0] == "heightmap") {
    console.log("Generated");
    heightmap = msg.data[1];

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
      } else if (brightness < 1) { // Plains & mountains
        pixels[i] = map(brightness, 0.1, 1, 0, 255);
        pixels[i + 1] = map(brightness, 0.1, 1, 128, 255);
        pixels[i + 2] = map(brightness, 0.1, 1, 0, 255);
      }

      pixels[i + 3] = 255;
    }

    // Draw the image data onto a blank canvas
    background.putImageData(imageData, 0, 0);

    drawn = true;
  } else if (msg.data[0] == "radarData") {
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

    // Draw and calculate the player
    player.show();

    // Draw the current radar to the screen
    radar.putImageData(radarData, 0, 0);

    for (let i = 0; i < enemies.length; i++) {
      enemies[i].show();
    }
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

function map(v, min1, max1, min2, max2) {
  return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

drawLoop();