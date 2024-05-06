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
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  varying vec2 v_UV;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform sampler2D u_Sampler5;
  uniform sampler2D u_Sampler6;
  uniform sampler2D u_Sampler7;
  uniform int u_whichTexture;
  void main() {
    if(u_whichTexture == -2){// use color
      gl_FragColor = u_FragColor;
    }
    else if(u_whichTexture == -1){// use UV debug color
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    }
    else if(u_whichTexture == 0){// use texture 0
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    }
    else if(u_whichTexture == 1){// use texture 1
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    }
    else if(u_whichTexture == 2){// use texture 2
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    }
    else if(u_whichTexture == 3){// use texture 3
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    }
    else if(u_whichTexture == 4){// use texture 4
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    }
    else if(u_whichTexture == 5){// use texture 5
      gl_FragColor = texture2D(u_Sampler5, v_UV);
    }
    else if(u_whichTexture == 6){// use texture 6
      gl_FragColor = texture2D(u_Sampler6, v_UV);
    }
    else if(u_whichTexture == 7){// use texture 7
      gl_FragColor = texture2D(u_Sampler7, v_UV);
    }
    else{// error so use redish
      gl_FragColor = vec4(1, .2, .2, 1);
    }
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
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_Sampler5;
let u_Sampler6;
let u_Sampler7;
var u_whichTexture;
var g_camera;
var timerInterval; // This will hold our interval ID for clearing later
var startTime; // When the timer started


var playerPosition = { x: 16, z: 16 }; // Start in the center of the map
var playerTextureNum = 4; // Texture index for the player's block
let lastSpecialPosition = { x: null, z: null };

let g_selectedColor=[1.0, 1.0, 1.0, 1.0];
let g_selectedSize=5;
let g_selectedType=POINT;
let g_globalAngle=0;
let g_yellowAngle=0;
let g_magentaAngle=0;
let g_startTime=performance.now()/1000.0;
let g_seconds = performance.now()/1000.0-g_startTime;
let g_animationEarLOn=false;
let g_animationEarROn=false;
let g_animationArmsOn=false;
let g_animationMainOn=false;

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

  g_camera = new Camera();
  document.onkeydown = keydown;
  initTextures(gl,0);
  
  initMouseHandlers();
  createWorld();
  //initPlayer();
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
  // // Get the storage location of a_Position
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_Position < 0) {
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
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
      console.log('Failed to get the storage location of u_whichTexture');
      return;
  }
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if(!u_Sampler0){
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if(!u_Sampler1){
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if(!u_Sampler2){
    console.log('Failed to get the storage location of u_Sampler2');
    return false;
  }
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if(!u_Sampler3){
    console.log('Failed to get the storage location of u_Sampler3');
    return false;
  }
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if(!u_Sampler4){
    console.log('Failed to get the storage location of u_Sampler4');
    return false;
  }
  u_Sampler5 = gl.getUniformLocation(gl.program, 'u_Sampler5');
  if(!u_Sampler5){
    console.log('Failed to get the storage location of u_Sampler5');
    return false;
  }
  u_Sampler6 = gl.getUniformLocation(gl.program, 'u_Sampler6');
  if(!u_Sampler6){
    console.log('Failed to get the storage location of u_Sampler6');
    return false;
  }
  u_Sampler7 = gl.getUniformLocation(gl.program, 'u_Sampler7');
  if(!u_Sampler7){
    console.log('Failed to get the storage location of u_Sampler7');
    return false;
  }

  
 

  //set initial value for matrix identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, identityM.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, identityM.elements);
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
  document.getElementById('reinforcementsButton').onclick = function() { placeRandomBlocks(10, [5, 6]);};
  //document.getElementById('animationMainOffButton').onclick = function() { g_animationMainOn = false};

  // //Slider events
  // document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
  // document.getElementById('LegsSlide').addEventListener('mousemove', function(){g_LegsAngle = this.value; renderScene(); });
  //document.getElementById('yellowSlide').addEventListener('mousemove', function(){g_yellowAngle = this.value; renderScene(); });
  //document.getElementById('magentaSlide').addEventListener('mousemove', function(){g_magentaAngle = this.value; renderScene(); });
  // document.getElementById('EarRSlide').addEventListener('mousemove', function(){g_EarRAngle = this.value; renderScene(); });
  // document.getElementById('EarRSlide2').addEventListener('mousemove', function(){g_EarRAngle2 = this.value; renderScene(); });
  // document.getElementById('EarRSlide3').addEventListener('mousemove', function(){g_EarRAngle3 = this.value; renderScene(); });

  //Size Slider event
  //document.getElementById('angleSlide').addEventListener('mousemove', function(){g_globalAngle = this.value; renderScene(); });
}

function initTextures(gl, n){
  var image = new Image();
  if(!image){
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function(){ sendImageToTexture0( image);};
  image.src = 'copen.jpeg';

  //add more images for textures here
  var image2 = new Image();
  if(!image2){
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function(){ sendImageToTexture1( image2);};
  image2.src = 'FEMap.jpeg';

  var image3 = new Image();
  if(!image3){
    console.log('Failed to create the image object');
    return false;
  }
  image3.onload = function(){ sendImageToTexture2( image3);};
  image3.src = 'aethersky.jpeg';

  var image4 = new Image();
  if(!image4){
    console.log('Failed to create the image object');
    return false;
  }
  image4.onload = function(){ sendImageToTexture3( image4);};
  image4.src = 'blastermaster.jpeg';

  var image5 = new Image();
  if(!image5){
    console.log('Failed to create the image5 object');
    return false;
  }
  image5.onload = function(){ sendImageToTexture4( image5);};
  image5.src = 'FEHByleth.jpeg';

  //add more images for textures here
  var image6 = new Image();
  if(!image6){
    console.log('Failed to create the image6 object');
    return false;
  }
  image6.onload = function(){ sendImageToTexture5( image6);};
  image6.src = 'FEHFafnir.jpeg';

  var image7 = new Image();
  if(!image7){
    console.log('Failed to create the image7 object');
    return false;
  }
  image7.onload = function(){ sendImageToTexture6( image7);};
  image7.src = 'FEHSwordFighter.jpeg';


  return true;
}

function sendImageToTexture0( image){
  var texture = gl.createTexture();
  if(!texture){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 0 to the sample
  gl.uniform1i(u_Sampler0, 0);

  console.log("Loaded Texture", image);
}

function sendImageToTexture1( image){
  var texture1 = gl.createTexture();
  if(!texture1){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE1); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture1);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample 
  gl.uniform1i(u_Sampler1, 1); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture2( image){
  var texture1 = gl.createTexture();
  if(!texture1){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE2); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture1);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler2, 2); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture3( image){
  var texture3 = gl.createTexture();
  if(!texture3){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE3); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture3);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler3, 3); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture4( image){
  var texture4 = gl.createTexture();
  if(!texture4){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE4); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture4);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler4, 4); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture5( image){
  var texture5 = gl.createTexture();
  if(!texture5){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE5); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture5);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler5, 5); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture6( image){
  var texture6 = gl.createTexture();
  if(!texture6){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE6); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture6);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler6, 6); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
}

function sendImageToTexture7( image){
  var texture7 = gl.createTexture();
  if(!texture7){
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  gl.activeTexture(gl.TEXTURE7); // <- This should be gl.TEXTURE1 for the second texture
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture7);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Set the texture image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
  gl.uniform1i(u_Sampler7, 7); // <- And this index should be 1, not 0

  console.log("Loaded Texture", image);
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
    g_yellowAngle = (45*Math.sin(g_seconds));
    g_magentaAngle = (45*Math.sin(g_seconds));
  }
}

function initMouseHandlers() {
  canvas.onmousedown = function(event) {

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

function keydown(ev){
  //Note: using helldivers movement and camera scheme
  if(ev.keyCode == 87){ //W
    g_camera.moveForwards();
  } 
  else if(ev.keyCode == 83){ //S
    g_camera.moveBackwards();
  } 
  else if(ev.keyCode == 65){ //A
    g_camera.moveLeft();
  } 
  else if(ev.keyCode == 68){//D
    g_camera.moveRight();
  }

  if(ev.keyCode == 81) { // Q
    g_camera.lookLeft();
  } 
  else if(ev.keyCode == 69) { // E
      g_camera.lookRight();
  }
  renderScene();
  console.log(ev.keyCode);
}

var g_camera;// set default camera

function initMouseHandlers() {
  //var factor = 0.0000001 / window.innerHeight; // Use the window's height to scale the mouse movement

  canvas.onmousedown = function(event) {
      mouseDown = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
  };

  document.onmouseup = function(event) {
      mouseDown = false;
  };

  //should only need to edit this portion to work with new camera
  canvas.onmousemove = function(event) {
      if (!mouseDown) return;
      var newX = event.clientX;
      var newY = event.clientY;
      var dx =  (newX - lastMouseX);
      var dy =  (newY - lastMouseY);
      if(dx > 0){
        g_camera.lookRight();
      }
      else if (dx < 0){
        g_camera.lookLeft();
      }
      if(dy < 0){
        g_camera.lookUp();
      } 
      else if (dy > 0){
        g_camera.lookDown();
      }

      lastMouseX = newX;
      lastMouseY = newY;

      renderScene(); // Redraw the scene with new camera angles
  };
}
function getCameraPosition() {
  //can be accessed by doing pos.x, pos.y, or pos.z (pos is a variable)
  return { 
      x: g_camera.eye.elements[0],
      y: g_camera.eye.elements[1],
      z: g_camera.eye.elements[2]
  };
}

// g_camera.eye = new Vector3([0, -2, 7]);
// g_camera.at = new Vector3([0, -2, 1]);
var g_eye = [0,0,1];
var g_at = [0,0,-100];
var g_up = [0,1,0];

function renderScene(){
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(50, 1*canvas.width/canvas.height, 1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  //viewMat.setLookAt(0,0,-1,  0,0,0,  0,1,0);//(eye, at, up)
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2], 
    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);//(eye, at, up)
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //drawMap();
  //draw floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0]; 
  floor.textureNum=1;
  floor.matrix.translate(0, 0, 0.0);  
  floor.matrix.scale(30, 0, 33); 
  floor.matrix.translate(-.5, 0, -.5);
  floor.render();

  //draw sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0]; 
  sky.textureNum=2;  
  sky.matrix.scale(100, 100, 100); 
  sky.matrix.translate(-.5, -.5, -.5);
  sky.render();
  
  // Render each wall
  walls.forEach(wall => wall.render());
  randomBlocks.forEach(block => block.render());
  
  var duration = performance.now() - startTime;
  // Prevent division by zero and handle case where duration might be zero
  var fps = 10000/duration 
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(fps) , "numdot");
}

function startTimer() {
  if (!timerInterval) { // Ensures the timer is not already running
      startTime = Date.now(); // Capture the start time
      timerInterval = setInterval(checkBlocks, 1000); // Check every second
      console.log("Timer started");
  }
}

function checkBlocks() {
  let blockExists = false;
  for (let x = 0; x < g_map.length; x++) {
      for (let z = 0; z < g_map[x].length; z++) {
          if (g_map[x][z] === 2) {
              blockExists = true;
              break;
          }
      }
      if (blockExists) break; // No need to continue if we already found a block
  }

  if (!blockExists) {
      let endTime = Date.now();
      let duration = (endTime - startTime) / 1000; // Duration in seconds
      clearInterval(timerInterval); // Stop checking
      timerInterval = null; // Reset timer ID
      console.log("All enemies defeated. Total time: " + duration + " seconds.");
      alert("All enemies defeated in " + duration + " seconds."); // Show the time to the user
  }
}

function updateBlock(x, z, value) {
  if (x >= 0 && x < g_map.length && z >= 0 && z < g_map[x].length) {
      g_map[x][z] = value; // Update the map to remove or place a block
      renderScene(); // Optional: Call to re-render the scene if necessary
  }
}