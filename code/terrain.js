self.importScripts("noise.js");

let width;
let height;

const hillsMap = [];

const heightmap = [];

onmessage = (msg) => {
  // console.log(msg.data);
  if (msg.data[0] == "terrain") {
    width = msg.data[1];
    height = msg.data[2];

    // Start the generation when given the width & height
    generateTerrain();
  } else if (msg.data[0] == "radar") {
    self.postMessage(["radarData", msg.data[1], msg.data[2], msg.data[3], msg.data[4], msg.data[5], radarRay(msg.data[1], msg.data[2], msg.data[3], msg.data[4], msg.data[5], msg.data[6], msg.data[7], msg.data[8], msg.data[9], msg.data[10], msg.data[11]), msg.data[7]]);
  }
}

function map(v, min1, max1, min2, max2) {
  return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function lerp(v1, v2, interpolate) {
  return (v1 * (1 - interpolate) * 2 + v2 * interpolate * 2) / 2
}

function generateTerrain() {
  console.log("starting");
  noise.seed(Math.random());

  // hills(100);

  // Use perlin noise to generate each pixel, and generate a heightmap
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      let biomeValue = 256 - (Math.abs(noise.perlin2((j / width) * 5, (i / height) * 5)) * 256)

      if (biomeValue < 160) { // Oceans
        heightmap.push(map(biomeValue, 0, 160, 0, 0.05));
      } else if (biomeValue < 190) { // Beaches
        heightmap.push(map(biomeValue, 160, 190, 0.05, 0.1));
      } else { // Hills & mountains
        // heightmap.push(map(lerp(map(hillsMap[j * height + i], 0, 1, 0, 1), (1 - Math.abs(noise.simplex2((i / width) * 25, (j / height) * 25))) ** 2, map(biomeValue, 190, 256, 0, 1) ** 2.5), 0, 1, 0.1, map(biomeValue, 190, 256, 0.1, 1) ** 0.7));

        heightmap.push(map(lerp(Math.abs(noise.perlin2(j / width * 100, i / width * 100)) / 4, (1 - Math.abs(noise.simplex2((i / width) * 25, (j / height) * 25))) ** 2, map(biomeValue, 190, 256, 0, 1) ** 2.5), 0, 1, 0.1, map(biomeValue, 190, 256, 0.1, 1) ** 0.7));
      }
    }
  }

  console.log("done");


  self.postMessage(["heightmap", heightmap]);
}

function radarRay(originalX, originalY, r, maxDist, altitude, radarObjects, id, boxx, boxy, boxw, boxh) {
  let x = originalX;
  let y = originalY;
  // Calculate the sin & cos of r in advance, so it doesn't have to be done every step
  let cosr = Math.cos(r);
  let sinr = Math.sin(r);
  let power = 1;
  let data = [];

  let ifCheckingBox = boxx ? true : false;

  // Step the radar beam and add to the list of points to send back
  while (dist(x, y, originalX, originalY) < maxDist && power > 0.01 && x >= 0 && y >= 0 && x <= width && y <= height) {
    // Ignore the point if it's below the plane's altitude
    let radar = 0;
    if (heightmap[Math.round(y) * height + Math.round(x)] > altitude) {
      radar += map(heightmap[Math.round(y) * width + Math.round(x)], altitude, 1, 0, 0.1);
      // Reduce the power; allows radar signals to be blocked by mountains
      power -= radar;
    }

    // For speed, have an option to only draw the points in a box
    if (!ifCheckingBox || (x > boxx && y > boxy && x < boxx + boxw && y < boxy + boxh)) {
      for (let i = 0; i < radarObjects.length; i++) {
        let distance = dist(radarObjects[i].x, radarObjects[i].y, x, y);
        if (radarObjects[i] !== id && distance < width / 40) {
          // Add to the radar value for every radar object so that it's proportional to the distance and power left
          radar += power * Math.min((radarObjects[i].radarCrossSection / 10) / (distance / 5), 0.1);
        }
      }
    }

    data.push([radar, x, y]);

    // Step the radar beam along
    x += cosr * 3;
    y += sinr * 3;
  }

  return data;
}

// function hills(number) {
//   // Generate random points for hilltops
//   let hillTops = []
//   for (let i = 0; i < number; i++) {
//     hillTops.push([Math.random() * width, Math.random() * height]);
//   }

//   // console.log(hillTops);

//   maxDist = 0;

//   // Loop for every point
//   for (let i = 0; i < width; i++) {
//     for (let j = 0; j < height; j++) {
//       // Find the distance to the closest hilltop
//       let minDist = Infinity;
//       for (let k = 0; k < hillTops.length; k++) {
//         let distance = dist(hillTops[k][0], hillTops[k][1], i, j);
//         if (minDist > distance) {
//           minDist = distance;
//         }
//       }

//       // calculate the farthest distance a point is from it's hilltop,
//       if (maxDist < minDist) {
//         maxDist = minDist;
//       }

//       // Push the point to the list
//       hillsMap.push(minDist);
//     }
//   }

//   // squish the values between 0 & 1 depending maxDist
//   for (let i = 0; i < hillsMap.length; i++) {
//     if (!hillsMap[i]) {
//       hillsMap[i] = 0;
//     }
//     hillsMap[i] = map(hillsMap[i], 0, maxDist, 1, 0);
//   }
// }