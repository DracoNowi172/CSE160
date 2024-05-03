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
var u_whichTexture;

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

  g_camera = new Camera();
  document.onkeydown = keydown;
  initTextures(gl,0);
  
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
    document.getElementById('animationMainOnButton').onclick = function() { g_animationMainOn = true};
  document.getElementById('animationMainOffButton').onclick = function() { g_animationMainOn = false};

  // //Slider events
  // document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
  // document.getElementById('LegsSlide').addEventListener('mousemove', function(){g_LegsAngle = this.value; renderScene(); });
  document.getElementById('yellowSlide').addEventListener('mousemove', function(){g_yellowAngle = this.value; renderScene(); });
  document.getElementById('magentaSlide').addEventListener('mousemove', function(){g_magentaAngle = this.value; renderScene(); });
  // document.getElementById('EarRSlide').addEventListener('mousemove', function(){g_EarRAngle = this.value; renderScene(); });
  // document.getElementById('EarRSlide2').addEventListener('mousemove', function(){g_EarRAngle2 = this.value; renderScene(); });
  // document.getElementById('EarRSlide3').addEventListener('mousemove', function(){g_EarRAngle3 = this.value; renderScene(); });

  //Size Slider event
  document.getElementById('angleSlide').addEventListener('mousemove', function(){g_globalAngle = this.value; renderScene(); });
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
  image2.src = 'fodlan.jpeg';

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
  // Set the texture unit 1 to the sample  <- This should be gl.TEXTURE1 for the second texture
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



// function loadTexture(gl, n, texture, u_Sampler, image){
//   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);//flips image y axis
//   //enable texture 0
//   gl.activeTexture(gl.TEXTURE0);
//   //bind texture 0
//   gl.bindTexture(gl.TEXTURE_2D, texture);

//   //set texture parameters
//   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//   //set the texture image
//   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

//   gl.uniform1i(u_Sampler, 0);

//   console.log('finished loadTexture');
// }

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
    if (event.shiftKey) {
      hatAttached = !hatAttached;  // Toggle the attachment state of the hat.
      renderScene();  // Update the scene to reflect the change.
      return;  // Skip the rest of the mouse handling logic.
    }
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
  if(ev.keyCode == 39){//rightArrow
    g_eye[0] += 0.2;
  }
  else if (ev.keyCode == 37){//left arrow
    g_eye[0] -= 0.2;
  }
  renderScene();
  console.log(ev.keyCode);
}

var g_camera// set default camera
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

  //draw floor
  var floor = new Cube();
  floor.color = [1.0, 0.0, 0.0, 1.0]; 
  floor.textureNum=1;
  floor.matrix.translate(0, -.75, 0.0);  
  floor.matrix.scale(10, 0, 10); 
  floor.matrix.translate(-.5, 0, -.5);
  floor.render();

  //draw sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0]; 
  sky.textureNum=2;  
  sky.matrix.scale(50, 50, 50); 
  sky.matrix.translate(-.5, -.5, -.5);
  sky.render();
  
  //draw body cube
  var body = new Cube(); 
  body.color = [1.0, 0.0, 0.0, 1.0]; 
  body.textureNum=0;
  body.matrix.translate(-.25, -.75, 0.0); 
  body.matrix.rotate(-5,1,0,0); 
  body.matrix.scale(0.5, 0.3, .5); 
  body.render();

  var leftArm = new Cube(); 
  leftArm.color = [1,1,0,1]; 
  leftArm.textureNum=-2;
  leftArm.matrix.setTranslate(0, -0.5, 0.0); 
  leftArm.matrix.rotate(-5, 1, 0, 0); 

  leftArm.matrix.rotate(-g_yellowAngle,0,0,1);

  var jointACoordinate = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, .7, .5); 
  leftArm.matrix.translate(-0.5,0,0); 
  leftArm.render(); 

  var box = new Cube(); 
  box.color = [1,0,1,1];
  box.textureNum=3;
  box.matrix = jointACoordinate;
  box.matrix.translate(0, .65, 0); 
  box.matrix.rotate(g_magentaAngle, 0, 0, 1); 
  box.matrix.scale(0.3, 0.3, 0.3); 
  box.matrix.translate(-0.5, 0, -0.001); 
  box.render();

  var duration = performance.now() - startTime;
  // Prevent division by zero and handle case where duration might be zero
  var fps = 10000/duration 
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(fps) , "numdot");
}

