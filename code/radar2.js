let heightmap;
let width;
let height;

function map(v, min1, max1, min2, max2) {
  return ((v - min1) / (max1 - min1)) * (max2 - min2) + min2;
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

onmessage = (msg) => {
  if (msg.data[0] == "radar") {
    self.postMessage(["radarData", msg.data[1], msg.data[2], msg.data[3], msg.data[4], msg.data[5], radarRay(msg.data[1], msg.data[2], msg.data[3], msg.data[4], msg.data[5], msg.data[6], msg.data[7], msg.data[8], msg.data[9], msg.data[10], msg.data[11]), msg.data[7]]);
  } else if (msg.data[0] == "terrain") {
    width = msg.data[1];
    height = msg.data[2];
    heightmap = msg.data[3];
  }
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

    let inBox = true;
    if (!ifCheckingBox || (x > boxx && y > boxy && x < boxx + boxw && y < boxy + boxh)) {
      for (let i = radarObjects.length - 1; i >= 0; i--) {
        let distance = dist(radarObjects[i].x, radarObjects[i].y, x, y);
        if (radarObjects[i].id !== id && distance < width / 40) {
          // Add to the radar value for every radar object so that it's proportional to the distance and power left
          radar += power * Math.min((radarObjects[i].radarCrossSection / 10) / (distance / 5), 0.1);
        }
      }
    } else {
      inBox = false;
    }

    if (inBox) {
      data.push([radar, x, y]);
    }

    // Step the radar beam along
    x += cosr * 3;
    y += sinr * 3;
  }

  return data;
}