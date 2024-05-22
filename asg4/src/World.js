// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
   precision mediump float;
   attribute vec4 a_Position;
   attribute vec2 a_UV;
   attribute vec3 a_Normal;
   varying vec2 v_UV;
   varying vec3 v_Normal;
   varying vec4 v_VertPos;
   uniform mat4 u_ModelMatrix;
   uniform mat4 u_NormalMatrix;
   uniform mat4 u_GlobalRotateMatrix;
   uniform mat4 u_ViewMatrix;
   uniform mat4 u_ProjectionMatrix;
   void main() {
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
      v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 1)));
      v_VertPos = u_ModelMatrix * a_Position;
   }`


// Fragment shader program 
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform int u_whichTexture;
    uniform vec3 u_lightPos;
    uniform vec3 u_lightColor;
    uniform vec3 u_cameraPos;
    uniform vec3 u_spotlightPos;
    uniform vec3 u_spotlightDir;
    uniform bool u_lightOn;
    uniform bool u_visualizerOn;
    uniform bool u_spotlightOn;
    varying vec4 v_VertPos;

    void main() {
      vec4 baseColor;

      if(u_whichTexture == -3){
         baseColor = vec4((v_Normal + 1.0) / 2.0, 1.0); // Use normal
      } else if(u_whichTexture == -2){
         baseColor = u_FragColor; // Use color
      } else if (u_whichTexture == -1){
         baseColor = vec4(v_UV, 1.0, 1.0); // Use UV debug color
      } else if(u_whichTexture == 0){
         baseColor = texture2D(u_Sampler0, v_UV); // Use texture0
      } else if(u_whichTexture == 1){
         baseColor = texture2D(u_Sampler1, v_UV); // Use texture1
      } else {
         baseColor = vec4(1, .2, .2, 1); // Error, Red
      }

      if (u_lightOn) {
        if (u_spotlightOn) {
          vec3 spotlightVector = normalize(u_spotlightPos - vec3(v_VertPos));
          vec3 L = normalize(spotlightVector);
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(N, L), 0.0);

          vec3 R = reflect(-L, N);
          vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
          float specular = pow(max(dot(E, R), 0.0), 10.0) * 0.5;

          vec3 diffuse = vec3(baseColor) * nDotL * u_lightColor;
          vec3 ambient = vec3(baseColor) * 0.3;
          gl_FragColor = vec4(specular + diffuse + ambient, baseColor.a);

          float spotEffect = dot(spotlightVector, normalize(u_spotlightDir));
          if (spotEffect > 0.95) { // Adjust the cutoff threshold as needed
            gl_FragColor.rgb *= spotEffect;
          }

          if (u_visualizerOn) {
            float r = length(spotlightVector);
            if (r < 1.0) {
              gl_FragColor = vec4(1, 0, 0, 1);
            } else if (r < 2.0) {
              gl_FragColor = vec4(0, 1, 0, 1);
            }
          }
        } else {
          vec3 lightVector = u_lightPos - vec3(v_VertPos);
          vec3 L = normalize(lightVector);
          vec3 N = normalize(v_Normal);
          float nDotL = max(dot(N, L), 0.0);

          vec3 R = reflect(-L, N);
          vec3 E = normalize(u_cameraPos - vec3(v_VertPos));
          float specular = pow(max(dot(E, R), 0.0), 10.0) * 0.5;

          vec3 diffuse = vec3(baseColor) * nDotL * u_lightColor;
          vec3 ambient = vec3(baseColor) * 0.3;
          gl_FragColor = vec4(specular + diffuse + ambient, baseColor.a);

          if (u_visualizerOn) {
            float r = length(lightVector);
            if (r < 1.0) {
              gl_FragColor = vec4(1, 0, 0, 1);
            } else if (r < 2.0) {
              gl_FragColor = vec4(0, 1, 0, 1);
            }
          }
        }
      } else {
        gl_FragColor = baseColor;
      }
    }`


const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
const FALSE = 0;
const TRUE = 1;
//global variables 
var canvas;
let gl;
let a_UV;
let a_Normal;
let a_Position;
let u_FragColor;
let u_lightPos;
let u_lightColor;
let u_lightOn = false;
let u_ModelMatrix;
let u_NormalMatrix;
let u_cameraPos;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;
let u_visualizerOn = false;
let g_visualizerOn = false;

let u_spotlightPos;
let u_spotlightDir;
let u_spotlightOn = true;
let g_spotlightOn = true;
let g_spotlightPos = [0, 2, -2];
let g_spotlightDir = [0, -1, 0];

let g_YellowON = FALSE;
let g_MagentaON = FALSE;
let g_globalAngle=0;
let g_normalOn = FALSE;
let g_lightPos = [0,4.5,-2];
let g_lightAnim = true;
let g_lightOn = true;
let g_LegsAngle=0;
let g_ArmsAngle=0;
let g_EarLAngle=0;
let g_EarRAngle=0;
let g_EarRAngle2=0;
let g_EarRAngle3=0;
let g_animationEarLOn=false;
let g_animationEarROn=false;
let g_animationArmsOn=false;
let g_animationMainOn=false;
let g_startTime=performance.now()/1000.0;
var hatAttached = false;

function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  // Get the storage location of a_Position
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

  // Get the storage location of u_whichTexture
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return;
  }

  u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
  if (!u_cameraPos) {
    console.log('Failed to get the storage location of u_cameraPos');
    return;
  }

  // Get the storage location of a_Normal
  a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  if (!a_Normal) {
    console.log('Failed to get the storage location of a_Normal');
    return;
  }

  // Get the storage location of a_UV
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (!a_UV) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_NormalMatrix
  u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!u_NormalMatrix) {
    console.log('Failed to get the storage location of u_NormalMatrix');
    return;
  }

  // Get the storage location of u_ProjectionMatrix
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  // Get the storage location of u_ViewMatrix
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
  if (!u_lightPos) {
    console.log('Failed to get the storage location of u_lightPos');
    return;
  }

  u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
  if (!u_lightColor) {
    console.log('Failed to get the storage location of u_lightColor');
    return;
  }

  u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
  if (!u_lightOn) {
    console.log('Failed to get the storage location of u_lightOn');
    return;
  }

  u_visualizerOn = gl.getUniformLocation(gl.program, 'u_visualizerOn');
  if (!u_visualizerOn) {
    console.log('Failed to get the storage location of u_visualizerOn');
    return;
  }

  // Get the storage location of u_Sampler0
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return;
  }

  // Get the storage location of u_Sampler1
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return;
  }

  // Get the storage location of u_spotlightPos
  u_spotlightPos = gl.getUniformLocation(gl.program, 'u_spotlightPos');
  if (!u_spotlightPos) {
    console.log('Failed to get the storage location of u_spotlightPos');
    return;
  }

  // Get the storage location of u_spotlightDir
  u_spotlightDir = gl.getUniformLocation(gl.program, 'u_spotlightDir');
  if (!u_spotlightDir) {
    console.log('Failed to get the storage location of u_spotlightDir');
    return;
  }

  // Get the storage location of u_spotlightOn
  u_spotlightOn = gl.getUniformLocation(gl.program, 'u_spotlightOn');
  if (!u_spotlightOn) {
    console.log('Failed to get the storage location of u_spotlightOn');
    return;
  }

  // Set initial values for matrix identity
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
  gl.enable(gl.DEPTH_TEST); 
}

function addActionsForHtmlUI(){
  // Button events
  document.getElementById('b1').onclick = function(ev) { g_normalOn = TRUE;};
  document.getElementById('b2').onclick = function(ev) { g_normalOn = FALSE;};
  document.getElementById('b3').onclick = function(ev){ g_visualizerOn = TRUE};
  document.getElementById('b3.1').onclick = function(ev){ g_visualizerOn = FALSE};

  document.getElementById('b4').onclick = function() { g_lightOn = true;};
  document.getElementById('b5').onclick = function() { g_lightOn = false};
  document.getElementById('b4.1').onclick = function() { g_spotlightOn = true;};
  document.getElementById('b5.1').onclick = function() { g_spotlightOn = false};
  document.getElementById('b6').onclick = function() { g_lightAnim = true};
  document.getElementById('b7').onclick = function() { g_lightAnim = false};
  document.getElementById('animationMainOnButton').onclick = function() { g_animationMainOn = true};
  document.getElementById('animationMainOffButton').onclick = function() { g_animationMainOn = false};
  //Slider events
  // document.getElementById('redSlide').addEventListener('mouseup', function(){g_});
  document.getElementById('cameraAngle').addEventListener('mousemove', function(){g_globalAngle = this.value; renderScene();});
  document.getElementById('magentaSlide').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_magentaAngle = this.value;renderScene();}});
  document.getElementById('MAnimationON').onclick = function() { g_MagentaON = TRUE;};
  document.getElementById('MAnimationOFF').onclick = function() { g_MagentaON = FALSE;};

  document.getElementById('lightColorR').addEventListener('input', renderScene);
  document.getElementById('lightColorG').addEventListener('input', renderScene);
  document.getElementById('lightColorB').addEventListener('input', renderScene);

  document.getElementById('yellowSlide').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_yellowAngle = this.value;renderScene();}});
  document.getElementById('YAnimationON').onclick = function() { g_YellowON = TRUE;};
  document.getElementById('YAnimationOFF').onclick = function() { g_YellowON = FALSE;};

  document.getElementById('lightSlideX').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[0] = this.value/100;renderScene();}});
  document.getElementById('lightSlideY').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[1] = this.value/100;renderScene();}});
  document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[2] = this.value/100;renderScene();}});

  document.getElementById('spotSlideX').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_spotlightPos[0] = this.value/100;renderScene();}});
  document.getElementById('spotSlideY').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_spotlightPos[1] = this.value/100;renderScene();}});
  document.getElementById('spotSlideZ').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_spotlightPos[2] = this.value/100;renderScene();}});
  canvas.onmousemove = function(ev){if(ev.buttons == 1){click(ev)}};
}

function updateLightColor() {
  const r = parseFloat(document.getElementById('lightColorR').value);
  const g = parseFloat(document.getElementById('lightColorG').value);
  const b = parseFloat(document.getElementById('lightColorB').value);
  gl.uniform3f(u_lightColor, r, g, b);
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  // Register function (event handler) to be called on a mouse press

  // set up actions for our HTML UI
  addActionsForHtmlUI();
  document.onkeydown = keydown;
  initTextures(gl,0);
  initMouseHandlers();

  // canvas.onmousemove = click;
  canvas.onmousemove = function(ev){if(ev.buttons ==1 ){cancelIdleCallback(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(160/255, 160/255, 160/255, 1.0);

  //renderScene();
  requestAnimationFrame(tick);
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

function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return ([x,y]);
}
// g_camera.eye = new Vector3([0, -2, 7]);
// g_camera.at = new Vector3([0, -2, 1]);
let g_camera = new Camera();
var g_eye = [0,0,2];
var g_at = [0,0,0];
var g_up = [0,0,0];
var g_yellowAngle =0;
var g_magentaAngle = 0;
function updateAnimationAngles(){
  if(g_YellowON){
    g_yellowAngle = (45*Math.sin(g_seconds));
  }
  if(g_MagentaON){
    g_magentaAngle = (45*Math.sin(g_seconds));
  }
  if(g_lightAnim){
    g_lightPos[0] = Math.cos(g_seconds);
  }
  if(g_animationMainOn){
    g_EarLAngle = 15 * Math.sin(g_seconds) + 5; // Now oscillates between -10 and 20
    g_EarRAngle = 15 * Math.sin(g_seconds) + 5; // Now oscillates between -10 and 20
    g_ArmsAngle = (45*Math.sin(g_seconds));
    g_LegsAngle = (45*Math.sin(g_seconds));
  }
}

function renderScene(){
  var startTime = performance.now();

  var projMat = new Matrix4();
  projMat.setPerspective(90, 1 * canvas.width / canvas.height, .1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  var viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0], g_camera.at.elements[1], g_camera.at.elements[2],
    g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Update light color and position
  gl.uniform3f(u_lightPos, g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  gl.uniform3f(u_spotlightPos, g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  gl.uniform3f(u_spotlightDir, g_spotlightDir[0], g_spotlightDir[1], g_spotlightDir[2]);
  gl.uniform1i(u_lightOn, g_lightOn);
  gl.uniform1i(u_visualizerOn, g_visualizerOn);
  gl.uniform1i(u_spotlightOn, g_spotlightOn);
  gl.uniform3f(u_cameraPos, g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2]);
  updateLightColor();

  var light = new Cube();
  light.color = [3, 3, 0, 1];
  light.matrix.translate(g_lightPos[0], g_lightPos[1], g_lightPos[2]);
  light.matrix.scale(-.1, -.1, -.1);
  light.matrix.translate(-.5, -.5, -.5);
  light.render();

  var spotlight = new Cube();
  spotlight.color = [1, 1, 0, 1];  // Yellow color to represent the spotlight source
  spotlight.matrix.translate(g_spotlightPos[0], g_spotlightPos[1], g_spotlightPos[2]);
  spotlight.matrix.scale(-.1, -.1, -.1);  // Make it small
  spotlight.matrix.translate(-.5, -.5, -.5);
  spotlight.render();

  // Draw sky
  var sky = new Cube();
  sky.color = [128 / 255, 128 / 255, 128 / 255, 1.0];
  sky.textureNum = 1;
  if (g_normalOn) sky.textureNum = -3;
  sky.matrix.scale(-7, -10, -7);
  sky.matrix.translate(-.5, -.5, -.5);
  sky.render();

  // Draw floor
  var floor = new Cube();
  floor.color = [1.0, 1.0, 1.0, 1.0];
  floor.textureNum = 0;
  floor.matrix.translate(0, -.5, 0.0);
  floor.matrix.scale(7, .01, 7);
  floor.matrix.translate(-.5, 0, -.5);
  floor.render();

  // Draw body cube
  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  if (g_normalOn) body.textureNum = -3;
  body.matrix.translate(1.25, -.25, -1.0);
  body.matrix.rotate(-5, 1, 0, 0);
  body.matrix.scale(0.5, 0.3, .5);
  body.render();

  var leftArm = new Cube();
  leftArm.color = [1, 1, 0, 1];
  if (g_normalOn) leftArm.textureNum = -3;
  leftArm.matrix.setTranslate(1.5, 0, -1.0);
  leftArm.matrix.rotate(-5, 1, 0, 0);

  leftArm.matrix.rotate(-g_yellowAngle, 0, 0, 1);

  var jointACoordinate = new Matrix4(leftArm.matrix);
  leftArm.matrix.scale(0.25, .7, .5);
  leftArm.matrix.translate(-0.5, 0, 0);
  leftArm.render();

  var box = new Cube();
  box.color = [1, 0, 1, 1];
  if (g_normalOn) box.textureNum = -3;
  box.matrix = jointACoordinate;
  box.matrix.translate(0, .65, 0);
  box.matrix.rotate(g_magentaAngle, 0, 0, 1);
  box.matrix.scale(0.3, 0.3, 0.3);
  box.matrix.translate(-0.5, 0, -0.001);
  box.render();

  var orb = new Sphere();
  orb.color = [1, 1, 1, 1];
  if (g_normalOn) orb.textureNum = -3;
  else { orb.textureNum = 1 };
  orb.matrix.translate(-2, .6, -2);
  orb.matrix.scale(1, 1, 1);
  orb.render();

  // Draw the animal
  renderBlockyAnimal();

  var duration = performance.now() - startTime;
  // Prevent division by zero and handle case where duration might be zero
  var fps = 10000 / duration;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(fps), "numdot");
}

function initMouseHandlers() {
  canvas.onmousedown = function(event) {
    if (event.shiftKey) {
      hatAttached = !hatAttached;  // Toggle the attachment state of the hat.
      renderScene();  // Update the scene to reflect the change.
      return;  // Skip the rest of the mouse handling logic.
    }
  };

  document.onmouseup = function(event) {
      mouseDown = false;
  };
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function initTextures(gl, n){
  var image = new Image();
  if(!image){
    console.log('Failed to create the image object');
    return false;
  }
  image.onload = function(){ sendImageToTexture0( image);};
  image.src = 'FEMap.jpeg';

  //add more images for textures here
  var image2 = new Image();
  if(!image2){
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function(){ sendImageToTexture1( image2);};
  image2.src = 'aethersky.jpeg';

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

function renderBlockyAnimal() {
  //draw body cube
  var body = new Cube();
  //change the color
  body.color = [64/255, 64/255, 64/255, 1.0];
  //change the location of the cube
  body.matrix.translate(-.15, 0, 0.0);
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
  armR.matrix.setTranslate(.05, .1, .13);
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
  armL.matrix.setTranslate(-.2, .1, .13);
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
    EarL1.matrix.setTranslate(.1, .4, 0);
    //rotate the cube, Angle, x, y, z directions
    EarL1.matrix.rotate(90, 0, 1, 0);
    EarL1.matrix.rotate(-90, 0, 0, 1);

    EarL1.matrix.rotate(135, 1, 0, 0);
  }
  else{
    EarL1.matrix.setTranslate(.2, .4, .2);
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
  EarR1.matrix.setTranslate(-.16, .3, .2);
  //rotate the cube, Angle, x, y, z directions
  EarR1.matrix.rotate(90, 0, 1, 0);
  EarR1.matrix.rotate(-90, 0, 0, 1);
  EarR1.matrix.rotate(-135, 1, 0, 0);
  }
  else{
    EarR1.matrix.setTranslate(-.16, .3, .2);
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
}