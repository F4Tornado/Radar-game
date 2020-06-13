let tutorial = false;

let tutorialToShow = "drawDirectionalControls";

const timeBetweenText = 3000;

function tutorialSequence() {
  document.getElementById("radar").style = "opacity: 0";
  setTimeout(() => {
    document.getElementById("radar").hidden = true;
  }, 200);

  setTimeout(() => {
    tutorialToShow = "fastControls";

    setTimeout(() => {
      tutorialToShow = "shootControls";

      setTimeout(() => {
        tutorialToShow = "healthBarText";

        setTimeout(() => {
          document.getElementById("radar").hidden = false;
          setTimeout(() => {
            document.getElementById("radar").style = "opacity: 1";
          }, 1);
          tutorialToShow = "radarScreenText";

          setTimeout(() => {
            tutorialToShow = "missileControls1";

            setTimeout(() => {
              tutorialToShow = "missileControls2";

              if (gamepad) {
                setTimeout(() => {
                  tutorialToShow = "aimingMissile";
                  console.log("aimingMissile");
                }, timeBetweenText);
              }

              setTimeout(() => {
                console.log("canShootMissile");
                tutorialToShow = "canShootMissileText";

                setTimeout(() => {
                  tutorialToShow = "chaffControls";

                  setTimeout(() => {
                    tutorialToShow = "canShootChaffText";

                    setTimeout(() => {
                      tutorialToShow = "lookForAirBase";

                      setTimeout(() => {
                        tutorialToShow = "";
                      }, timeBetweenText);

                    }, timeBetweenText);

                  }, timeBetweenText);

                }, timeBetweenText);

              }, timeBetweenText * (gamepad ? 2 : 1));

            }, timeBetweenText);

          }, timeBetweenText);

        }, timeBetweenText);

      }, timeBetweenText);

    }, timeBetweenText);

  }, timeBetweenText);
}

function drawTutorial() {
  draw.font = "32px Patua One";
  draw.textAlign = "center";
  draw.textBaseline = "middle";
  if (gamepad) {
    switch (tutorialToShow) {
      case "drawDirectionalControls":
        draw.fillText("Left joystick to turn", 144, 92);
        break;

      case "fastControls":
        draw.fillText("A to go fast", 108, 92);
        break;

      case "shootControls":
        draw.fillText("Right bumper to pew", 160, 92);
        break;

      case "healthBarText":
        draw.fillText("This is your health", 144, 92);
        break;

      case "radarScreenText":
        draw.fillText("This is your radar screen", c.width / 2, c.height / 2);
        break;

      case "missileControls1":
        draw.fillText("Left trigger to shoot a missile", c.width / 2, c.height / 2);
        break;

      case "missileControls2":
        draw.fillText("Right trigger to shoot a radar tracking missile", c.width / 2, c.height / 2);
        break;

      case "aimingMissile":
        draw.fillText("Right joystick to aim your missiles", c.width / 2, c.height / 2);
        break;

      case "canShootMissileText":
        draw.fillText("The circle is full if you can shoot missile", 300, 92);
        break;

      case "chaffControls":
        draw.fillText("Press B to dispense chaff", 190, 92);
        break;

      case "canShootChaffText":
        draw.fillText("The circle is full if you can dispense chaff", 310, 92);
        break;

      case "lookForAirBase":
        draw.fillText("Shoot missiles at the air base or aircraft carrier to win", c.width - 400, c.height - 32);
        break;
    }
  } else {
    switch (tutorialToShow) {
      case "drawDirectionalControls":
        draw.fillText("a & d to turn", 108, 92);
        break;

      case "fastControls":
        draw.fillText("w to go fast", 108, 92);
        break;

      case "shootControls":
        draw.fillText("space to pew", 108, 92);
        break;

      case "healthBarText":
        draw.fillText("This is your health", 144, 92);
        break;

      case "radarScreenText":
        draw.fillText("This is your radar screen", c.width / 2, c.height / 2);
        break;

      case "missileControls1":
        draw.fillText("Left click to shoot a missile", c.width / 2, c.height / 2);
        break;

      case "missileControls2":
        draw.fillText("Right click to shoot a radar tracking missile", c.width / 2, c.height / 2);
        break;

      case "canShootMissileText":
        draw.fillText("The circle is full if you can shoot missile", 300, 92);
        break;

      case "chaffControls":
        draw.fillText("Press E to dispense chaff", 190, 92);
        break;

      case "canShootChaffText":
        draw.fillText("The circle is full if you can dispense chaff", 310, 92);
        break;

      case "lookForAirBase":
        draw.fillText("Shoot missiles at the air base or aircraft carrier to win", c.width - 400, c.height - 32);
        break;
    }
  }
}