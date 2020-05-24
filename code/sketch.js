const c = document.getElementById("c");
const draw = c.getContext("2d");

c.width = window.innerWidth;
c.height = window.innerHeight;

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

  draw.fillStyle = "#000";
  draw.fillRect(0, 0, c.width, c.height);

  if (heightmap) {
    let imageData = draw.getImageData(0, 0, c.width, c.height);
    let pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      let terrainpos = [(i / 4) % c.width, Math.floor((i / 4) / c.height)];
      let terraini = terrainpos[1] * terrainHeight + terrainpos[0];
      let brightness = heightmap[terraini];

      if (brightness < 50) {
        pixels[i] = 0;
        pixels[i + 1] = map(brightness, 0, 50, 64, 128);
        pixels[i + 2] = map(brightness, 0, 50, 128, 255);
      } else if (brightness < 60) {
        pixels[i] = 255;
        pixels[i + 1] = 255;
        pixels[i + 2] = 128;
      } else if (brightness < 140) {
        pixels[i] = map(brightness, 60, 140, 64, 128);
        pixels[i + 1] = map(brightness, 60, 140, 128, 255);
        pixels[i + 2] = map(brightness, 60, 140, 64, 128);
      } else {
        pixels[i] = brightness;
        pixels[i + 1] = brightness;
        pixels[i + 2] = brightness;
      }
    }
    draw.putImageData(imageData, 0, 0);
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