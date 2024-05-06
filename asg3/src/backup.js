// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = 
  `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix  * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

var FSHADER_SOURCE = 
  `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
    gl_FragColor = vec4(v_UV,1,1);
  }`;


//global variables 
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

var canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;


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

  // // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
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

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  //set initial value for matrix identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

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

function addActionsForHtmlUI(){

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
    // Use angles adjusted by mouse movement
    globalRotMat.rotate(cameraAngleY, 1, 0, 0)  // Pitch
                .rotate(cameraAngleX, 0, 1, 0); // Yaw
    // Use angles from sliders or some fixed values
    globalRotMat.rotate(g_globalAngle, 0, 1, 0); // Example: Slider-controlled global angle
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //draw body cube
  var HatY = new Cube();
  //change the color
  HatY.color = [1.0, 1.0, 0.0, 1.0];
  //change the location of the cube
  HatY.matrix.translate(-.3, 0, 0.0);
  //rotate the cube, Angle, x, y, z directions
  HatY.matrix.rotate(0, 1, 0, 0);
  // changes the shape of the cube
  HatY.matrix.scale(.5, .6, .5);
  HatY.render();

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

