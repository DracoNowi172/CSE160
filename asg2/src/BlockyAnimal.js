// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_GlobalRotateMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';


//global variables 
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

var canvas;
let gl;
let a_Position;
let u_FragColor;
let u_size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_globalAngle=0;
let g_LegsAngle=0;
let g_ArmsAngle=0;
let g_EarLAngle=0;
let g_EarRAngle=0;
let g_EarRAngle2=0;
let g_EarRAngle3=0;
let g_startTime=performance.now()/1000.0;
let g_seconds = performance.now()/1000.0-g_startTime;
let g_animationEarLOn=false;
let g_animationEarROn=false;
let g_animationArmsOn=false;
let g_animationMainOn=false;

var cameraMouse = false;  // Toggle for mouse control
var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var cameraAngleX = 0;  // Camera rotation angle around X-axis
var cameraAngleY = 0;  // Camera rotation angle around Y-axis
var hatAttached = false;  // Initially, the hat is not attached.


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  // Register function (event handler) to be called on a mouse press

  // set up actions for our HTML UI
  addActionsForHtmlUI();
  
  initMouseHandlers();

  // Specify the color for clearing <canvas>
  gl.clearColor(160/255, 160/255, 160/255, 1.0);

  //renderScene();
  requestAnimationFrame(tick);
}

function tick(){
  g_seconds = performance.now()/1000.0-g_startTime;

  updateAnimationAngles();
  //display our information in the log
  //console.log(g_seconds);
  //rerender
  renderScene();
  //tell browser to reanimate
  requestAnimationFrame(tick);
}


function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_globalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  //set initial value for matrix identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}
//DO NOT TOUCH FUNCTION EVER AGAIN IT IS PERFECT AS IS
function setupWebGL(){
  canvas = document.getElementById('webgl'); // Retrieve <canvas> element
   // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  //enable the depth thingy
  gl.enable(gl.DEPTH_TEST);
}

function addActionsForHtmlUI(){
  // Button events
  // document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
  // document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0];};
  // document.getElementById('clearButton').onclick = function(){ g_shapesList = []; renderScene()};

  // document.getElementById('animationEarLOnButton').onclick = function() { g_animationEarLOn = true};
  // document.getElementById('animationEarLOffButton').onclick = function() { g_animationEarLOn = false};
  // // document.getElementById('pointButton').onclick = function() { g_selectedType = POINT;};
  // document.getElementById('animationEarROnButton').onclick = function() { g_animationEarROn = true};
  // document.getElementById('animationEarROnButton').onclick = function() { g_animationEarROn = false};

  document.getElementById('animationMainOnButton').onclick = function() { g_animationMainOn = true};
  document.getElementById('animationMainOffButton').onclick = function() { g_animationMainOn = false};
  // document.getElementById('pointButton').onclick = function() { g_selectedType = POINT;};
  // document.getElementById('animationArmsOnButton').onclick = function() { g_animationArmsOn = true};
  // document.getElementById('animationArmsOnButton').onclick = function() { g_animationArmsOn = false};

  // //Slider events
  // document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
  // document.getElementById('LegsSlide').addEventListener('mousemove', function(){g_LegsAngle = this.value; renderScene(); });
  document.getElementById('ArmsSlide').addEventListener('mousemove', function(){g_ArmsAngle = this.value; renderScene(); });
  document.getElementById('EarLSlide').addEventListener('mousemove', function(){g_EarLAngle = this.value; renderScene(); });
  document.getElementById('EarRSlide').addEventListener('mousemove', function(){g_EarRAngle = this.value; renderScene(); });
  document.getElementById('EarRSlide2').addEventListener('mousemove', function(){g_EarRAngle2 = this.value; renderScene(); });
  document.getElementById('EarRSlide3').addEventListener('mousemove', function(){g_EarRAngle3 = this.value; renderScene(); });

  //Size Slider event
  document.getElementById('angleSlide').addEventListener('mousemove', function(){g_globalAngle = this.value; renderScene(); });
}

var g_shapesList = [];
// var g_points = [];  // The array for the position of a mouse press
// var g_colors = [];  // The array to store the color of a point
// var g_sizes  = [];  // The array to store the size of a point
function click(ev){
  // extracting the coordinates from the event
  let [x,y] = convertCoordinatesEventToGL(ev);
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == TRIANGLE){
    point = new Triangle();
  }
  else{
    point = new Circle();
    point.segments = g_selectedSeg;
  }
  //populate the new point with our old data
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;

  g_shapesList.push(point);

  //render all shapes on the canvas
  renderScene();
}
function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return ([x,y]);
}

function updateAnimationAngles(){
  if(g_animationMainOn){
    g_EarLAngle = 15 * Math.sin(g_seconds) + 5; // Now oscillates between -10 and 20
    g_EarRAngle = 15 * Math.sin(g_seconds) + 5; // Now oscillates between -10 and 20
    g_ArmsAngle = (45*Math.sin(g_seconds));
    g_LegsAngle = (45*Math.sin(g_seconds));
  }
}

function initMouseHandlers() {
  canvas.onmousedown = function(event) {
    if (event.shiftKey) {
      hatAttached = !hatAttached;  // Toggle the attachment state of the hat.
      renderScene();  // Update the scene to reflect the change.
      return;  // Skip the rest of the mouse handling logic.
    }
      if (!cameraMouse) return;
      mouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
  };

  document.onmouseup = function(event) {
      mouseDown = false;
  };

  canvas.onmousemove = function(event) {
      if (!mouseDown) return;
      var newX = event.clientX;
      var newY = event.clientY;

      var deltaX = newX - lastMouseX;
      var deltaY = newY - lastMouseY;

      cameraAngleX += deltaX / 5; // Adjust these values to control the sensitivity
      cameraAngleY -= deltaY / 5; // Invert deltaY to align with typical camera 'pitch' controls

      lastMouseX = newX;
      lastMouseY = newY;

      renderScene(); // Redraw the scene with new camera angles
  };
}

function renderScene(){
  var startTime = performance.now();

  var globalRotMat = new Matrix4();

  if (cameraMouse) {
    // Use angles adjusted by mouse movement
    globalRotMat.rotate(cameraAngleY, 1, 0, 0)  // Pitch
                .rotate(cameraAngleX, 0, 1, 0); // Yaw
  } else {
    // Use angles from sliders or some fixed values
    globalRotMat.rotate(g_globalAngle, 0, 1, 0); // Example: Slider-controlled global angle
  }
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //draws triangle
  //drawCube([-1.0, 0.0, 0.0,  -0.5,-1.0, 0.0,  0.0, 0.0, 0.0]);

  //draw body cube
  var body = new Cube();
  //change the color
  body.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  body.matrix.translate(-.15, -.6, 0.0);
  //rotate the cube, Angle, x, y, z directions
  body.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  body.matrix.scale(.2, .15, .15);
  body.render();

  //draw legs cube
  var legsR = new Cube();
  var RightFootattach = new Matrix4(body.matrix);
  legsR.matrix = RightFootattach;
  //change the color
  legsR.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  legsR.matrix.translate(0, -.4, 0.1);
  //rotate the cube, Angle, x, y, z directions
  legsR.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  legsR.matrix.scale(.4, .5, .7);
  legsR.render();

  //draw legs cube
  var legsL = new Cube();
  var LeftFootattach = new Matrix4(body.matrix);
  legsL.matrix = LeftFootattach;
  //change the color
  legsL.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  legsL.matrix.translate(.6, -.4, 0.1);
  //rotate the cube, Angle, x, y, z directions
  legsL.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  legsL.matrix.scale(.4, .5, .7);
  legsL.render();

  //draw tail circle
  var tail = new Circle();
  var Tailattach = new Matrix4(body.matrix);
  tail.matrix = Tailattach;
  //change the color
  tail.color = [1, 1, 1, 1.0];
  //change the location of the cube
  tail.matrix.translate(.5, .4, 1);
  //rotate the cube, Angle, x, y, z directions
  tail.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  tail.matrix.scale(.2, .2, .2);
  tail.render();

  //draw the right arm
  var armR = new Cube();
  var RightArmattach = new Matrix4(body.matrix);
  armR.matrix = RightArmattach;
  //change the color
  armR.color = [1, 0, 0, 1.0];
  //change the location of the cube
  armR.matrix.setTranslate(.05, -.48, .13);
  //rotate the cube, Angle, x, y, z directions
  if(hatAttached){
    armR.matrix.rotate(g_ArmsAngle+40, 1, 0, 1);
  }
  else{
    armR.matrix.rotate(-g_ArmsAngle, 1, 0, 0);
  }
  // changes the shape of the cube
  armR.matrix.scale(.05, -.1, -.08);
  armR.render();

  //draw left arm
  var armL = new Cube();
  var LeftArmattach = new Matrix4(body.matrix);
  armL.matrix = LeftArmattach;
  //change the color
  armL.color = [1, 0, 0, 1.0];
  //change the location of the cube
  armL.matrix.setTranslate(-.2, -.48, .13);
  //rotate the cube, Angle, x, y, z directions
  if(hatAttached){
  armL.matrix.rotate(0, 1, 0, 0);
  }
  else{
    armL.matrix.rotate(g_ArmsAngle, 1, 0, 0);
  }
  // changes the shape of the cube
  armL.matrix.scale(.05, -.1, -.08);
  armL.render();

  //draw left paw
  var armL2 = new Cube();
  var LeftArmattach2 = new Matrix4(armL.matrix);
  armL2.matrix = LeftArmattach2;
  //change the color
  armL2.color = [1, 1, 1, 1.0];
  //change the location of the cube
  armL2.matrix.translate(0, 1, 0);
  //rotate the cube, Angle, x, y, z directions
  armL2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  armL2.matrix.scale(1, .5, 1);
  armL2.render();

  //draw left paw
  var armR2 = new Cube();
  armR2.matrix = new Matrix4(armR.matrix);
  //change the color
  armR2.color = [1, 1, 1, 1.0];
  //change the location of the cube
  armR2.matrix.translate(0, 1, 0);
  //rotate the cube, Angle, x, y, z directions
  armR2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  armR2.matrix.scale(1, .5, 1);
  armR2.render();

  //draw fluffy collar
  var collar = new Cube();
  collar.matrix = new Matrix4(body.matrix);
  //change the color
  collar.color = [1, 1, 1, 1.0];
  //change the location of the cube
  collar.matrix.translate(-.05, 0.9, -0.05);
  //rotate the cube, Angle, x, y, z directions
  collar.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  collar.matrix.scale(1.1, .1, 1.1);
  collar.render();

  //draw Head
  var Head = new Cube();
  Head.matrix = new Matrix4(body.matrix);
  //change the color
  Head.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  Head.matrix.translate(-.5, 1, -.25);
  //rotate the cube, Angle, x, y, z directions
  Head.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  Head.matrix.scale(2, 2, 2);
  Head.render();

  //draw right cheek
  var faceP1 = new Cube();
  faceP1.matrix = new Matrix4(Head.matrix);
  //change the color
  faceP1.color = [1, 153/255, 204/255, 1.0];
  //change the location of the cube
  faceP1.matrix.translate(0, 0, -0.35);
  //rotate the cube, Angle, x, y, z directions
  faceP1.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  faceP1.matrix.scale(.1429, .40, 0.33);
  faceP1.render();

  //draw left cheek
  var faceP2 = new Cube();
  faceP2.matrix = new Matrix4(Head.matrix);
  //change the color
  faceP2.color = [1, 153/255, 204/255, 1.0];
  //change the location of the cube
  faceP2.matrix.translate(.86, 0, -0.35);
  //rotate the cube, Angle, x, y, z directions
  faceP2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  faceP2.matrix.scale(.1429, .40, 0.33);
  faceP2.render();

  //draw mouth
  var Mouth = new Cube();
  Mouth.matrix = new Matrix4(Head.matrix);
  //change the color
  Mouth.color = [1, 1, 1, 1.0];
  //change the location of the cube
  Mouth.matrix.translate(.14, 0, -0.35);
  //rotate the cube, Angle, x, y, z directions
  Mouth.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  Mouth.matrix.scale(.1438*5, .20, 0.33);
  Mouth.render();

  //draw right eye
  var EyeR1 = new Cube();
  EyeR1.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeR1.color = [51/255, 51/255, 1, 1.0];
  //change the location of the cube
  EyeR1.matrix.translate(0, .4, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeR1.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeR1.matrix.scale(.1429, .40, 0.33);
  EyeR1.render();

  //draw left eye
  var EyeL1 = new Cube();
  EyeL1.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeL1.color = [51/255, 51/255, 1, 1.0];
  //change the location of the cube
  EyeL1.matrix.translate(.86, .4, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeL1.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeL1.matrix.scale(.1429, .40, 0.33);
  EyeL1.render();

  //draw right eye2
  var EyeR2 = new Cube();
  EyeR2.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeR2.color = [51/255, 51/255, 1, 1.0];
  //change the location of the cube
  EyeR2.matrix.translate(.14, .2, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeR2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeR2.matrix.scale(.1429, .2, 0.33);
  EyeR2.render();

  //draw left eye2
  var EyeL2 = new Cube();
  EyeL2.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeL2.color = [51/255, 51/255, 1, 1.0];
  //change the location of the cube
  EyeL2.matrix.translate(0.72, .2, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeL2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeL2.matrix.scale(.1429, .2, 0.33);
  EyeL2.render();

  //draw midface
  var mid = new Cube();
  mid.matrix = new Matrix4(Head.matrix);
  //change the color
  mid.color = [1, 1, 1, 1.0];
  //change the location of the cube
  mid.matrix.translate(.28, .2, -0.35);
  //rotate the cube, Angle, x, y, z directions
  mid.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  mid.matrix.scale(.44, .6, 0.33);
  mid.render();

  //draw midface2
  var mid2 = new Cube();
  mid2.matrix = new Matrix4(Head.matrix);
  //change the color
  mid2.color = [1, 1, 1, 1.0];
  //change the location of the cube
  mid2.matrix.translate(.42, .8, -0.35);
  //rotate the cube, Angle, x, y, z directions
  mid2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  mid2.matrix.scale(.44/3, .2, 0.33);
  mid2.render();

  //draw browR
  var brow1 = new Cube();
  brow1.matrix = new Matrix4(Head.matrix);
  //change the color
  brow1.color = [.1, .1, .1, 1.0];
  //change the location of the cube
  brow1.matrix.translate(0, .8, -0.35);
  //rotate the cube, Angle, x, y, z directions
  brow1.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  brow1.matrix.scale(.14*3, .2, 0.33);
  brow1.render();

  //draw browL
  var brow2 = new Cube();
  brow2.matrix = new Matrix4(Head.matrix);
  //change the color
  brow2.color = [.1, .1, .1, 1.0];
  //change the location of the cube
  brow2.matrix.translate(.56, .8, -0.35);
  //rotate the cube, Angle, x, y, z directions
  brow2.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  brow2.matrix.scale(.14*3, .2, 0.33);
  brow2.render();

  //draw left eye
  var EyeL3 = new Cube();
  EyeL3.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeL3.color = [.1, .1, .1, 1.0];
  //change the location of the cube
  EyeL3.matrix.translate(.14, .4, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeL3.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeL3.matrix.scale(.1429, .40, 0.33);
  EyeL3.render();

  //draw left eye
  var EyeR3 = new Cube();
  EyeR3.matrix = new Matrix4(Head.matrix);
  //change the color
  EyeR3.color = [.1, .1, .1, 1.0];
  //change the location of the cube
  EyeR3.matrix.translate(.72, .4, -0.35);
  //rotate the cube, Angle, x, y, z directions
  EyeR3.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  EyeR3.matrix.scale(.1429, .40, 0.33);
  EyeR3.render();

  //EarL Top joint code
  var EarL1 = new Cube();
  EarL1.matrix = new Matrix4(Head.matrix);
  //change the color
  EarL1.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  if(hatAttached){
    EarL1.matrix.setTranslate(.1, -.15, 0);
    //rotate the cube, Angle, x, y, z directions
    EarL1.matrix.rotate(90, 0, 1, 0);
    EarL1.matrix.rotate(-90, 0, 0, 1);

    EarL1.matrix.rotate(135, 1, 0, 0);
  }
  else{
    EarL1.matrix.setTranslate(.2, 0, .2);
    //rotate the cube, Angle, x, y, z directions
    EarL1.matrix.rotate(90, 0, 1, 0);

    EarL1.matrix.rotate(135, 1, 0, 0);
  }

  EarL1.matrix.rotate(g_EarLAngle,0,0,1);
  // changes the shape of the cube
  EarL1.matrix.scale(.2, .3, .2);
  EarL1.render();

  //EarL Top joint code
  var EarL2 = new Cube();
  EarL2.matrix = new Matrix4(EarL1.matrix);
  //change the color
  EarL2.color = [1, 0, 0, 1.0];
  //change the location of the cube
  EarL2.matrix.translate(-0.05, .5, -.05);
  //rotate the cube, Angle, x, y, z directions
  //EarL2.matrix.rotate(90, 0, 1, 0);

  EarL2.matrix.rotate(g_EarLAngle,0,0,1);

  //EarL2.matrix.rotate(140, 1, 0, 0);
  // changes the shape of the cube
  EarL2.matrix.scale(1.2, .7, 1.1);
  EarL2.render();

  //EarL Top joint code
  var EarL3 = new Cube();
  EarL3.matrix = new Matrix4(EarL2.matrix);
  //change the color
  EarL3.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  EarL3.matrix.translate(.05, .5, 0.01);
  //rotate the cube, Angle, x, y, z directions
  EarL3.matrix.rotate(g_EarLAngle, 0, 0, 1);

  // EarL3.matrix.rotate(135, 1, 0, 0);
  // changes the shape of the cube
  EarL3.matrix.scale(.9, 1.5, .9);
  EarL3.render();

  //EarL Top joint code
  var EarL4 = new Cube();
  EarL4.matrix = new Matrix4(EarL3.matrix);
  //change the color
  EarL4.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  EarL4.matrix.translate(.05, .5, 0.01);
  //rotate the cube, Angle, x, y, z directions
  EarL4.matrix.rotate(g_EarLAngle, 0, 0, 1);

  // EarL3.matrix.rotate(135, 1, 0, 0);
  // changes the shape of the cube
  EarL4.matrix.scale(.9, .9, .9);
  EarL4.render();


  //EarR Top joint code
  var EarR1 = new Cube();
  EarR1.matrix = new Matrix4(Head.matrix);
  //change the color
  EarR1.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  if(hatAttached){
  EarR1.matrix.setTranslate(-.16, -.14, .2);
  //rotate the cube, Angle, x, y, z directions
  EarR1.matrix.rotate(90, 0, 1, 0);
  EarR1.matrix.rotate(-90, 0, 0, 1);
  EarR1.matrix.rotate(-135, 1, 0, 0);
  }
  else{
    EarR1.matrix.setTranslate(-.16, -.14, .2);
  //rotate the cube, Angle, x, y, z directions
  EarR1.matrix.rotate(90, 0, 1, 0);
  
  
  EarR1.matrix.rotate(-135, 1, 0, 0);
  }
  // changes the shape of the cube
  EarR1.matrix.scale(.2, .3, .2);
  EarR1.render();

  //EarR mid joint code
  var EarR2 = new Cube();
  EarR2.matrix = new Matrix4(EarR1.matrix);
  //change the color
  EarR2.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  EarR2.matrix.translate(-0.1, .5, -0.05);
  //rotate the cube, Angle, x, y, z directions
  EarR2.matrix.rotate(g_EarRAngle, 0, 0, 1);

  // EarR2.matrix.rotate(-133, 1, 0, 0);
  // changes the shape of the cube
  EarR2.matrix.scale(1.2, .7, 1.1);
  EarR2.render();

  //EarR bottom joint code
  var EarR3 = new Cube();
  EarR3.matrix = new Matrix4(EarR2.matrix);
  //change the color
  EarR3.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  EarR3.matrix.translate(0.05, .5, 0.05);
  //rotate the cube, Angle, x, y, z directions
  if(g_animationEarROn){
  EarR3.matrix.rotate(g_EarRAngle, 0, 0, 1);
  }
  else{
    EarR3.matrix.rotate(g_EarRAngle2, 1, 0, 0);
  }

  // EarR3.matrix.rotate(-135, 1, 0, 0);
  // changes the shape of the cube
  EarR3.matrix.scale(.9, 1.5, .9);
  EarR3.render();

  //EarR bottom joint code
  var EarR4 = new Cube();
  EarR4.matrix = new Matrix4(EarR3.matrix);
  //change the color
  EarR4.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  EarR4.matrix.translate(0.05, .5, 0.05);
  //rotate the cube, Angle, x, y, z directions
  if(g_animationEarROn){
  EarR4.matrix.rotate(g_EarRAngle, 0, 0, 1);
  }
  else{
    EarR4.matrix.rotate(g_EarRAngle3, 1, 0, 0);
  }

  // EarR3.matrix.rotate(-135, 1, 0, 0);
  // changes the shape of the cube
  EarR4.matrix.scale(.9, .9, .9);
  EarR4.render();

  //draw Hat brim
  var HatBrim = new Cube();
  if(hatAttached){
    HatBrim.matrix = new Matrix4(EarL4.matrix);
    //change the color
    HatBrim.color = [1, 1, 25/255, 1.0];
    HatBrim.matrix.translate(1, 1, -.5);
    //rotate the cube, Angle, x, y, z directions
    HatBrim.matrix.rotate(90, 0, 0, 1);
    // changes the shape of the cube
    HatBrim.matrix.scale(1.2, .19, 1.6);
    HatBrim.render();
  }
  else{
    HatBrim.matrix = new Matrix4(Head.matrix);
    //change the location of the cube
    HatBrim.matrix.translate(-.1, 1, -.5);
    //change the color
    HatBrim.color = [1, 1, 25/255, 1.0];
    
    //rotate the cube, Angle, x, y, z directions
    HatBrim.matrix.rotate(0, 0, 1, 0);
    // changes the shape of the cube
    HatBrim.matrix.scale(1.2, .19, 1.6);
    HatBrim.render();
  }

  //draw Hat central
  var HatBase = new Cube();
  HatBase.matrix = new Matrix4(HatBrim.matrix);
  //change the color
  HatBase.color = [1, 1, 25/255, 1.0];
  //change the location of the cube
  HatBase.matrix.translate(.10, 1, .3);
  //rotate the cube, Angle, x, y, z directions
  HatBase.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  HatBase.matrix.scale(.8, 7.1, .6);
  HatBase.render();


  //draw RedHat central
  var HatBaseR = new Cube();
  HatBaseR.matrix = new Matrix4(HatBrim.matrix);
  //change the color
  HatBaseR.color = [1, 0, 0, 1.0];
  //change the location of the cube
  HatBaseR.matrix.translate(.2, 1, .2);
  //rotate the cube, Angle, x, y, z directions
  HatBaseR.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  HatBaseR.matrix.scale(.6, 7, .8);
  HatBaseR.render();

  //draw LightBase central
  var LightBase = new Cube();
  LightBase.matrix = new Matrix4(HatBrim.matrix);
  //change the color
  LightBase.color = [1, 1, 25/255, 1.0];
  //change the location of the cube
  LightBase.matrix.translate(.35, 1, .1);
  //rotate the cube, Angle, x, y, z directions
  LightBase.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  LightBase.matrix.scale(.3, 4, .2);
  LightBase.render();


  //draw Brimdeco central
  var Brimdeco = new Cube();
  Brimdeco.matrix = new Matrix4(HatBrim.matrix);
  //change the color
  Brimdeco.color = [0, 0, 0, 1.0];
  //change the location of the cube
  Brimdeco.matrix.translate(0, 1, 0);
  //rotate the cube, Angle, x, y, z directions
  Brimdeco.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  Brimdeco.matrix.scale(1, .5, .95);
  Brimdeco.render();

  //draw Light central
  var Light = new Cube();
  Light.matrix = new Matrix4(LightBase.matrix);
  //change the color
  Light.color = [1, 1, 1, 1.0];
  //change the location of the cube
  Light.matrix.translate(.35, 0, -.1);
  //rotate the cube, Angle, x, y, z directions
  Light.matrix.rotate(0, 0, 1, 0);
  // changes the shape of the cube
  Light.matrix.scale(.3, .5, .2);
  Light.render();


  // //draw body cube
  // var HatY = new Cube();
  // //change the color
  // HatY.color = [1.0, 1.0, 0.0, 1.0];
  // //change the location of the cube
  // HatY.matrix.translate(-.3, 0, 0.0);
  // //rotate the cube, Angle, x, y, z directions
  // HatY.matrix.rotate(0, 1, 0, 0);
  // // changes the shape of the cube
  // HatY.matrix.scale(.5, .6, .5);
  // HatY.render();

  // //draw body cube
  // var HatR = new Cube();
  // HatR.matrix = HatY.matrix;
  // //change the color
  // HatR.color = [1.0, 0.0, 0.0, 1.0];
  // //change the location of the cube
  // HatR.matrix.translate(.25, .1, -.10);
  // //rotate the cube, Angle, x, y, z directions
  // HatR.matrix.rotate(0, 1, 0, 0);
  // // changes the shape of the cube
  // HatR.matrix.scale(.5, .2, .5);
  // HatR.render();

  // //draw a left arm
  // var yellow = new Cube();
  // yellow.color = [1.0, 1.0, 0.0, 1.0];
  // yellow.matrix.setTranslate(0, -.5, 0.0);
  // yellow.matrix.rotate(-5, 1, 0, 0);
  // yellow.matrix.rotate(g_yellowAngle, 0, 0, 1);

  // var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  // yellow.matrix.scale(0.25, .7, .5);
  // yellow.matrix.translate(-.5, 0, 0);
  // yellow.render();

  // //test magenta
  // var magenta = new Cube();
  // magenta.color = [1,0,1,1];
  // magenta.matrix = yellowCoordinatesMat
  // magenta.matrix.translate(0, 0.65, 0);
  // magenta.matrix.rotate(g_magentaAngle,0,0,1);
  // magenta.matrix.scale(.3,.3,.3);
  // magenta.matrix.translate(-.5,0,-.001)
  // magenta.render();

  // misc FPS display stuff
  // Calculate time taken to render scene and FPS
  var duration = performance.now() - startTime;
  // Prevent division by zero and handle case where duration might be zero
  var fps = 10000/duration 
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(fps) , "numdot");
}

