// Set up the canvas
const c = document.getElementById("c");
const draw = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

// Get the web worker to generate the heightmap
let terrainWidth = c.width * 2;
let terrainHeight = c.height * 2

let heightmap;

let terrainGenerater = new Worker("terrain.js");

terrainGenerater.postMessage([terrainWidth, terrainHeight]);

terrainGenerater.onmessage = (msg) => {
  console.log(msg.data);
  if (msg.data[0] == "heightmap") {
    console.log("Generated");
    heightmap = msg.data[1];
  }
}

function drawLoop() {
  setTimeout(drawLoop, 1000 / 60);

  // Draw the background
  draw.fillStyle = "#000";
  draw.fillRect(0, 0, c.width, c.height);

  if (heightmap) {
    // Create the image data
    let imageData = draw.getImageData(0, 0, c.width, c.height);
    let pixels = imageData.data;
    // Draw each pixel
    for (let i = 0; i < pixels.length; i += 4) {
      // get the height to draw on screen using the heightmap
      let terrainpos = [(i / 4) % c.width, Math.floor((i / 4) / c.height)];
      let terraini = terrainpos[1] * terrainHeight + terrainpos[0];
      let brightness = heightmap[terraini];

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
    }
    draw.putImageData(imageData, 0, 0);
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
}

window.onresize = () => {
  c.width = window.innerWidth;
  c.height = window.innerHeight;
}

function map(v, min1, max1, min2, max2) {
  return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

drawLoop();