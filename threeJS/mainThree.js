/** @format */

// ============= Initialization =============

// ----- Core Imports -----
import * as THREE from "three";
import { OrbitControls } from "OrbitControls";

import { XRControllerModelFactory } from "./webxr/XRControllerModelFactory.js";
import { VRButton } from "./webxr/VRButton.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.138.3/examples/jsm/loaders/GLTFLoader.js";
const GSAP = gsap;

// ----- Needed Objects -----
const myRayCaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  10000000000
);

// ----- Renderer Set -----
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.getElementById("renderCanvas"),
});

renderer.setClearColor("#000000");
renderer.setPixelRatio(devicePixelRatio);
renderer.setSize(innerWidth, innerHeight);
// ----- Renderer Set -----

// ----- WebXR Initialization -----
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;
// ----- WebXR Initialization -----

// ----- Orbit Set -----
let orbit = new OrbitControls(camera, renderer.domElement);
orbit.maxDistance = 20;
// orbit.maxZoom = 0.523599; // 30 degrees
// ----- Orbit Set -----

// ----- Audio Set -----
let songIndex = 0;
let songsToChoose = ["./sounds/R&J.mp3", "./sounds/SomeoneInTheCrowd.mp3"];
let songsLoaded = [];
let chosenSong;

const listener = new THREE.AudioListener(); // Microphone to our camera (one needed only)
camera.add(listener);

// Help load music files, set it to buffer later
const audioLoader = new THREE.AudioLoader();

// new THREE.Audio(listener) creates a non positional, global audio object (Audio object is the source of sounds)

for (let i = 0; i < songsToChoose.length; ++i) {
  songsLoaded.push(new THREE.Audio(listener));

  audioLoader.load(songsToChoose[i], function (buffer) {
    songsLoaded[i].setBuffer(buffer);
    songsLoaded[i].setLoop(true);
    songsLoaded[i].setVolume(1);
  });
}
chosenSong = songsLoaded[0];

let analyser = new THREE.AudioAnalyser(chosenSong, 64);
// ----- Audio Set -----

// ----- GLTF Set -----
let gltfModels = {};
const loader = new GLTFLoader();

function modelLoader(url) {
  return new Promise((res, rej) => {
    loader.load(url, (data) => res(data), null, rej);
  });
}

// ----- GLTF Set -----

// ============= Initialization =============

// ============= Events =============

// ----- if window resizes -----
window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;

  // update camera's matrix everytime an internal adjustment made
  camera.updateProjectionMatrix();
});
// ----- if window resizes -----

// ============= Events =============

// ============= Scene Objects & Manipulations =============

let pLight1 = new THREE.PointLight(0xffffff, 3, 1000);
let pLight2 = new THREE.PointLight(0xffffff, 1.5, 1000);
pLight1.position.set(0, 0, 0);
pLight2.position.set(0, 0, 25);

scene.add(pLight1, pLight2);

// ===== Grids =====
let gridSize = 20;
let gridSizeHalf = gridSize / 2;

let gridMain = new THREE.GridHelper(
  gridSize,
  gridSize / 2,
  "#168270",
  "#2c1682"
);
gridMain.frustrumCulled = false;

let grid1 = gridMain.clone();
scene.add(grid1);

let grid2 = gridMain.clone();
grid2.rotation.x = Math.PI / 2;
grid2.position.y = gridSizeHalf;
grid2.position.z = gridSizeHalf;
scene.add(grid2);

let grid3 = gridMain.clone();
grid3.rotation.x = Math.PI / 2;
grid3.position.y = gridSizeHalf;
grid3.position.z = -gridSizeHalf;
scene.add(grid3);

let grid4 = gridMain.clone();
grid4.rotation.z = Math.PI / 2;
grid4.position.y = gridSizeHalf;
grid4.position.x = gridSizeHalf;
scene.add(grid4);

let grid5 = gridMain.clone();
grid5.rotation.z = Math.PI / 2;
grid5.position.y = gridSizeHalf;
grid5.position.x = -gridSizeHalf;
scene.add(grid5);

let grid6 = gridMain.clone();
grid6.rotation.y = Math.PI / 2;
grid6.position.y = gridSizeHalf;
grid6.position.y = gridSizeHalf * 2;
scene.add(grid6);

// ===== Grids =====

// Create a sine-like wave
const curve = new THREE.SplineCurve([
  new THREE.Vector2(-10, 0),
  new THREE.Vector2(-5, 5),
  new THREE.Vector2(0, 0),
  new THREE.Vector2(5, -5),
  new THREE.Vector2(10, 0),
]);

const points = curve.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);

// Create the final object to add to the scene
const splineObject = new THREE.Line(
  geometry,
  new THREE.LineBasicMaterial({ color: 0xff0000 })
);

scene.add(splineObject);

// Camera adjustments
camera.position.x = -15;
camera.position.z = 15;
camera.position.y = 10;
camera.lookAt(new THREE.Vector3(0, 0, 0));
// Camera adjustments
let camPositionZ = 0;
// ============= Scene Objects & Manipulations =============

// ============= Controllers =============
let controllerGestures = [];
let controllerModels = [];

let userProfile = new THREE.Group();
userProfile.position.set(0, 0, 0);

let controllerReach = 3;

function onSelectStart() {
  console.log("selected start");
  console.log(this);

  if (this.name == "left") {
    if (chosenSong.isPlaying) {
      chosenSong.pause();
    } else {
      chosenSong = songsLoaded[songIndex];
      analyser = new THREE.AudioAnalyser(chosenSong, 64);
      chosenSong.play();

      songIndex += 1;
      songIndex = songIndex < songsLoaded.length ? songIndex : 0;
    }
  }

  this.children[0].scale.z = controllerReach;
  this.userData.selectPressed = true;
}

function onSelectEnd() {
  console.log("selected stop");

  this.children[0].scale.z = 0;
  this.userData.selectPressed = false;
}

function setUpController(event) {
  this.gamepad = event.data.gamepad;
  this.name = event.data.handedness;
}

function moveFromJoystick() {}

function createControllers() {
  let controllerModelFactory = new XRControllerModelFactory();

  let controlGestureLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -1),
    ]),
    new THREE.LineBasicMaterial({
      color: 0x0000ff,
    })
  );
  controlGestureLine.scale.z = 0;

  for (let i = 0; i < 2; ++i) {
    let controlGesture = renderer.xr.getController(i);
    controlGesture.add(controlGestureLine.clone());

    controlGesture.userData.selectPressed = false; // When select button is pressed
    controlGesture.userData.selectPressedPrev = false; // When select button is previously pressed one frame back

    scene.add(controlGesture);
    controllerGestures.push(controlGesture);

    let controllerGrip = renderer.xr.getControllerGrip(i);
    controllerGrip.add(
      controllerModelFactory.createControllerModel(controllerGrip)
    );
    scene.add(controllerGrip);
    controllerModels.push(controllerGrip);
  }

  controllerGestures.forEach((controllerGesture) => {
    controllerGesture.addEventListener("selectstart", onSelectStart);
    controllerGesture.addEventListener("selectend", onSelectEnd);
    controllerGesture.addEventListener("connected", setUpController);
  });
}

// ============= Controllers =============

// ============= Interactable Objects =============
let interactableObjects = [];
let chosenInteractableObject = []; // 0 => Object | 1 => ObjectOriginalPosition

// ----- Cube Book -----
let cubeBookGroup = new THREE.Group();

let cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffdddd, wireframe: true })
);

cubeBookGroup.add(cube);

// Book Model
gltfModels["bookModel"] = (await modelLoader("./models/scene.gltf")).scene;

let scaleValue = 0.01;
gltfModels["bookModel"].scale.set(scaleValue, scaleValue, scaleValue);
gltfModels["bookModel"].receiveShadow = true;
gltfModels["bookModel"].position.set(0, 0, 0);
gltfModels["bookModel"].rotation.x = Math.PI / 2;
gltfModels["bookModel"].rotation.z = 44;
gltfModels["bookModel"].rotation.y = 50;

cubeBookGroup.add(gltfModels["bookModel"]);
// Book Model

interactableObjects.push(cubeBookGroup);
cubeBookGroup.position.set(0, 2, -3);
// ----- Cube Book -----

// Add all interactable objects into scene
interactableObjects.forEach((obj) => {
  scene.add(obj);
});

// ============= Interactable Objects =============

// Gesture Handling Function
function gestureHandling(controllerGesture) {
  if (controllerGesture.userData.selectPressed) {
    if (!chosenInteractableObject.length > 0) {
      // First time intersect when select is pressed

      controllerGesture.children[0].scale.z = controllerReach;
      const rotationMatrix = new THREE.Matrix4();
      rotationMatrix.extractRotation(controllerGesture.matrixWorld);
      const raycaster = new THREE.Raycaster();
      raycaster.ray.origin.setFromMatrixPosition(controllerGesture.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(rotationMatrix);

      const intersects = raycaster.intersectObjects(interactableObjects);

      if (intersects.length > 0) {
        if (intersects[0].distance <= controllerReach) {
          controllerGesture.children[0].scale.z = intersects[0].distance;

          // chosenInteractableObject[0] is to put the Box's Parent
          chosenInteractableObject.push(intersects[0].object.parent);

          let controllerGestureWorldPos = new THREE.Vector3(0, 0, 0);
          controllerGesture.getWorldPosition(controllerGestureWorldPos);
          // chosenInteractableObject[1] is to put the distance from the Box's parent object with the controller
          chosenInteractableObject.push(
            intersects[0].object.parent.position.distanceTo(
              controllerGestureWorldPos
            )
          );
        }
      }
    } else {
      // Move selected object while always the same distance from controller
      let controllerGestureWorldPos = new THREE.Vector3(0, 0, 0);
      controllerGesture.getWorldPosition(controllerGestureWorldPos);

      const moveVector = controllerGesture
        .getWorldDirection(new THREE.Vector3())
        .multiplyScalar(chosenInteractableObject[1])
        .negate();
      chosenInteractableObject[0].position.copy(
        controllerGestureWorldPos.clone().add(moveVector)
      );
      chosenInteractableObject[0].lookAt(camera.position);
    }
  } else if (controllerGesture.userData.selectPressedPrev) {
    // Select released
    if (chosenInteractableObject.length > 0) {
      chosenInteractableObject.length = 0;
    }
  }
  controllerGesture.userData.selectPressedPrev =
    controllerGesture.userData.selectPressed;
}

// ============= Outside Objects =============
let outsideObj = [];

function plusOrMinus() {
  return Math.random() < 0.5 ? -1 : 1;
}

function getRandColor(brightness) {
  // Six levels of brightness from 0 to 5, 0 being the darkest
  var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
  var mix = [brightness * 51, brightness * 51, brightness * 51]; //51 => 255/5
  var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(
    function (x) {
      return Math.round(x / 2.0);
    }
  );

  return (
    "0x" +
    mixedrgb[0].toString(16) +
    mixedrgb[1].toString(16) +
    mixedrgb[2].toString(16)
  );

  // return "rgb(" + mixedrgb.join(",") + ")";
}

for (let i = 0; i < 350; ++i) {
  let geometry = new THREE.SphereGeometry(1, 12, 12);
  let material = new THREE.MeshBasicMaterial();
  let sphere = new THREE.Mesh(geometry, material);
  sphere.material.color.setHex(getRandColor(5));

  outsideObj.push(sphere);
}

let marginDistance = gridSize + 2;
let axisChoices = ["x", "y", "z"];

// ----- Create Spheres -----
outsideObj.forEach((sphere) => {
  // Initial position outside of the grid
  sphere.position.set(
    (marginDistance / 2) * plusOrMinus() +
      Math.round(Math.random() * 100 * plusOrMinus()),
    (marginDistance / 2) * plusOrMinus() +
      Math.round(Math.random() * 100 * plusOrMinus()),
    (marginDistance / 2) * plusOrMinus() +
      Math.round(Math.random() * 100 * plusOrMinus())
  );

  sphere.uniformDirection = 0.01;
  sphere.randomPosNeg = plusOrMinus();
  sphere.randomAxis = axisChoices[Math.ceil(Math.random() * 3) - 1]; // which axis will be the turning point

  sphere.counter = 0;
  sphere.lastFlash = 0;
  sphere.castShadow = true; //default is false
  sphere.receiveShadow = false; //default

  scene.add(sphere);
});

let outsideObjMomentum = 0.1;
let significantAudChance = false;

function moveOutsideObj() {
  outsideObj.forEach((sphere) => {
    sphere.counter += 1;

    // been 70 frames
    if (sphere.counter % 70 == 0) {
      sphere.randomAxis = axisChoices[Math.ceil(Math.random() * 3) - 1];

      sphere.randomPosNeg = plusOrMinus();
      sphere.counter = 0;
      sphere.lastFlash = 0;
    }

    if (chosenSong.isPlaying) {
      if (significantAudChance) {
        if (sphere.counter - sphere.lastFlash > 5) {
          sphere.lastFlash = sphere.counter;
          sphere.material.color.setHex(getRandColor(5));
        }
      }
      console.log(significantAudChance);
    }

    for (let i = 0; i < 3; ++i) {
      let axis = axisChoices[i];

      // If axis chosen is the random one
      if (axis == sphere.randomAxis) {
        sphere.position[axis] +=
          (sphere.uniformDirection +
            Math.sin(sphere.counter / 4) * outsideObjMomentum) * // go up and down [Math.sin() increase horizontal width]
          sphere.randomPosNeg;
      } else {
        // the rest move on the same direction

        sphere.position[axis] +=
          (sphere.uniformDirection + 0.5) *
          sphere.randomPosNeg *
          outsideObjMomentum;
      }
    }
  });
}
// ============= Outside Objects =============

// ============= Run =============

// ===== Functions to call =====
createControllers();

//=====  Variables for running logic =====
let firstRun = true;
let frame = 0;
let currentAudFrequency = 0;
let prevAudFrequency = 0;

// ===== Misc Functions For Run =====
function initXR() {
  if (renderer.xr.isPresenting) {
    userProfile.add(camera);

    controllerGestures.forEach((gesture) => {
      userProfile.add(gesture);
    });
    controllerModels.forEach((model) => {
      userProfile.add(model);
    });
    scene.add(userProfile);

    firstRun = false;
  }
}

console.log("Ver 14");
renderer.setAnimationLoop(function () {
  if (firstRun) {
    initXR();
  }

  frame += 1;

  currentAudFrequency = analyser.getAverageFrequency();

  if (currentAudFrequency > 60) {
    significantAudChance = true;
  } else if (Math.abs(currentAudFrequency - prevAudFrequency) > 5) {
    significantAudChance = true;
  }

  if (chosenSong.isPlaying) {
    outsideObjMomentum = Math.min(Math.floor(currentAudFrequency) * 0.015, 0.6);
  } else {
    outsideObjMomentum = 0.02;
  }
  moveOutsideObj();

  gltfModels["bookModel"].rotation.z += 0.01;
  gltfModels["bookModel"].rotation.y += 0.01;
  gltfModels["bookModel"].rotation.z += 0.01;

  controllerGestures.forEach((controllerGesture) => {
    if (controllerGesture.name == "right") {
      // left on right joystick
      if (controllerGesture.gamepad.axes[2] > 0) {
        userProfile.position.x -= 0.01;
      } else if (controllerGesture.gamepad.axes[2] < 0) {
        userProfile.position.x += 0.01;
      } else if (controllerGesture.gamepad.axes[3] > 0) {
        userProfile.position.z -= 0.01; // go down
      } else if (controllerGesture.gamepad.axes[3] < 0) {
        userProfile.position.z += 0.01; // go up
      }

      // only right controller can be used to move things around
      gestureHandling(controllerGesture);
    } else if (controllerGesture.name == "left") {
      if (controllerGesture.gamepad.axes[3] > 0) {
        userProfile.position.y -= 0.01; // go down
      } else if (controllerGesture.gamepad.axes[3] < 0) {
        userProfile.position.y += 0.01; // go up
      }
    }
  });

  significantAudChance = false;
  prevAudFrequency = currentAudFrequency;

  renderer.render(scene, camera);
});

// NOTES

// Object3D.position represents the position of a 3D object in local space.  So the position relative to its parent.
// If the 3D object does not have a parent, Object3D.position represents world space too. In order to get the world position of child objects, use Object3D.getWorldPosition()
