// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'uniform float u_size;\n' +
  'attribute vec4 a_Position;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = u_size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;
//global variables 
var canvas;
let gl;
let a_Position;
let u_FragColor;
let u_size;
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedSeg = 10;
let g_selectedType = POINT;

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

  // Get the storage location of u_FragColor
  u_size = gl.getUniformLocation(gl.program, 'u_size');
  if (!u_size) {
    console.log('Failed to get the storage location of u_size');
    return;
  }

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
}

function addActionsForHtmlUI(){
  // Button events
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0];};
  document.getElementById('clearButton').onclick = function(){ g_shapesList = []; renderAllShapes()};

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT;};
  document.getElementById('triangleButton').onclick = function() { g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE};
  document.getElementById('imageButton').onclick = function() {Xeno()};
  document.getElementById('fancyCleanButton').onclick = function() {fancyClean()};

  //Slider events
  document.getElementById('redSlide').addEventListener('mouseup', function(){g_selectedColor[0] = this.value/100;});
  document.getElementById('greenSlide').addEventListener('mouseup', function(){g_selectedColor[1] = this.value/100;});
  document.getElementById('blueSlide').addEventListener('mouseup', function(){g_selectedColor[2] = this.value/100;});

  //Size Slider event
  document.getElementById('sizeSlide').addEventListener('mouseup', function(){g_selectedSize = this.value;});
  document.getElementById('segSlide').addEventListener('mouseup', function(){g_selectedSeg = this.value;});
}

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  // Register function (event handler) to be called on a mouse press

  // set up actions for our HTML UI
  addActionsForHtmlUI();
  
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev){ if(ev.buttons == 1){click(ev)}};

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// class Point{
//   constructor(){
//     this.type = 'point';
//     this.position = [0.0, 0.0, 0.0];
//     this.color = [1.0, 1.0, 1.0, 1.0];
//     this.size = 5.0;
//   }
//   render(){
//     //console.log("Render method called");
//     var xy = this.position;
//     var rgba = this.color;
//     var size = this.size;

//     // Pass the position of a point to a_Position variable
//     gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
//     // Pass the color of a point to u_FragColor variable
//     gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
//     // Pass the size of a point to u_size variable
//     gl.uniform1f(u_size, size);
//     // Draw
//     gl.drawArrays(gl.POINTS, 0, 1);
//   }

// }
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
  renderAllShapes();
}
function convertCoordinatesEventToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  return ([x,y]);
}
function renderAllShapes(){
  var startTime = performance.now();
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  //var len = g_points.length;
  var len = g_shapesList.length;
  for(var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }
  //var duration = performance.now() - startTime;
  //sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration), "numdot")
}

function sendTextToHTML(text, htmlID){
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm){
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}
function Xeno(){
  //first clear canvas
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  g_shapesList = [];
  //Top
  Pyra = [0,0.3,  0.2,0.5,  -0.2,0.5];
  g_shapesList.push(Pyra);
  Pyra = [0.2,0.58,  -0.2,0.58, 0.2,0.5];
  g_shapesList.push(Pyra);
  Pyra = [-0.2,0.5,  -0.2,0.58, 0.2,0.5];
  g_shapesList.push(Pyra);

  //Bottom
  Pyra = [0,0.09,  0.15,-0.11,  -0.15,-0.11];
  g_shapesList.push(Pyra);
  Pyra = [-0.15,-0.11,  -0.15,-0.6,  0.15,-0.6];
  g_shapesList.push(Pyra);
  Pyra = [0.15,-0.6,  0.15,-0.11,  -0.15,-0.11];
  g_shapesList.push(Pyra);
  
  //Bottom outer
  Pyra = [0.16,-0.11,  0.16,-0.18,  0.2,-0.18];
  g_shapesList.push(Pyra);
  Pyra = [0.16,-0.11,  0.2,-0.18 , 0.16,-0.64];
  g_shapesList.push(Pyra);
  Pyra = [0.2,-0.18 , 0.16,-0.615, 0.2,-0.65];
  g_shapesList.push(Pyra);

  Pyra = [-0.2,-0.65, -0.16,-0.615, 0.2,-0.65];
  g_shapesList.push(Pyra);
  Pyra = [-0.16,-0.615, 0.16,-0.615, 0.2,-0.65];
  g_shapesList.push(Pyra);
  
  Pyra = [-0.16,-0.11,  -0.16,-0.18,  -0.2,-0.18];
  g_shapesList.push(Pyra);
  Pyra = [-0.16,-0.11,  -0.2,-0.18 , -0.16,-0.64];
  g_shapesList.push(Pyra);
  Pyra = [-0.2,-0.18 , -0.16,-0.615, -0.2,-0.65];
  g_shapesList.push(Pyra);

  //Right
  Pyra = [0.12,0.2 ,  0.22,0.08,  0.22,0.31];
  g_shapesList.push(Pyra);
  Pyra = [0.22,0.31 ,  0.22,0.08,  0.35,0.16];
  g_shapesList.push(Pyra);
  Pyra = [0.35,0.16 ,  0.22,0.31,  0.35,0.25];
  g_shapesList.push(Pyra);

  //Left
  Pyra = [-0.12,0.2 ,  -0.22,0.08,  -0.22,0.31];
  g_shapesList.push(Pyra);
  Pyra = [-0.22,0.31 ,  -0.22,0.08,  -0.35,0.16];
  g_shapesList.push(Pyra);
  Pyra = [-0.35,0.16 ,  -0.22,0.31,  -0.35,0.25];
  g_shapesList.push(Pyra);

  //Shell
  Pyra = [-0.26,0.65,  0.25,0.65, -0.22,0.62];
  g_shapesList.push(Pyra);
  Pyra = [-0.26,0.62,  0.25,0.65, 0.22,0.62];
  g_shapesList.push(Pyra);

  Pyra = [-0.26,-0.71,  0.26,-0.71, -0.22, -0.68];
  g_shapesList.push(Pyra);
  Pyra = [-0.22, -0.68, 0.22,-0.68, 0.25,-0.71 ];
  g_shapesList.push(Pyra);

  
  Pyra = [0.22,-0.68, 0.25,-0.71, 0.25, 0.05 ];
  g_shapesList.push(Pyra);
  Pyra = [0.22,0.01, 0.22,-0.68, 0.25, 0.01 ];
  g_shapesList.push(Pyra);
  Pyra = [0.22,0.01, 0.4,0.11, 0.25, 0.01 ];
  g_shapesList.push(Pyra);
  Pyra = [0.4,0.11, 0.22,0.01, 0.37, 0.11 ];
  g_shapesList.push(Pyra);

  Pyra = [0.41,0.11, 0.38,0.28, 0.38, 0.11 ];
  g_shapesList.push(Pyra);
  Pyra = [0.41,0.28, 0.38,0.28, 0.41, 0.11 ];
  g_shapesList.push(Pyra);

  Pyra = [0.22,0.38, 0.38,0.28, 0.25, 0.4 ];
  g_shapesList.push(Pyra);
  Pyra = [0.25,0.4, 0.38,0.28, 0.41, 0.28 ];
  g_shapesList.push(Pyra);

  
  Pyra = [0.25,0.38,  0.25,0.65, 0.22,0.62];
  g_shapesList.push(Pyra);
  Pyra = [0.22,0.38,  0.22,0.65, 0.25,0.38];
  g_shapesList.push(Pyra);


  Pyra = [-0.22,-0.68, -0.25,-0.71, -0.25, 0.05 ];
  g_shapesList.push(Pyra);
  Pyra = [-0.22,0.01, -0.22,-0.68, -0.25, 0.01 ];
  g_shapesList.push(Pyra);
  Pyra = [-0.22,0.01, -0.4,0.11, -0.25, 0.01 ];
  g_shapesList.push(Pyra);
  Pyra = [-0.4,0.11, -0.22,0.01, -0.37, 0.11 ];
  g_shapesList.push(Pyra);

  Pyra = [-0.41,0.11, -0.38,0.28, -0.38, 0.11 ];
  g_shapesList.push(Pyra);
  Pyra = [-0.41,0.28, -0.38,0.28, -0.41, 0.11 ];
  g_shapesList.push(Pyra);

  Pyra = [-0.22,0.38, -0.38,0.28, -0.25, 0.4 ];
  g_shapesList.push(Pyra);
  Pyra = [-0.25,0.4, -0.38,0.28, -0.41, 0.28 ];
  g_shapesList.push(Pyra);

  
  Pyra = [-0.25,0.38,  -0.25,0.65, -0.22,0.62];
  g_shapesList.push(Pyra);
  Pyra = [-0.22,0.38,  -0.22,0.65, -0.25,0.38];
  g_shapesList.push(Pyra);

  var len = g_shapesList.length;
  // Draw the rectangle
  
  for(var i = 0; i < len; i++) {
    drawTriangle(g_shapesList[i]);
  }
  g_shapesList = [];
  
}
function fancyClean(){
    function removeShapeAndRender(){
        if(g_shapesList.length > 0){
            g_shapesList.pop();  //Remove the last shape from the list
            renderAllShapes();   //Redraw the remaining shapes
        }else{
            clearInterval(intervalId);  //If no shapes are left, stop the timer
        }
    }
    var intervalId = setInterval(removeShapeAndRender, 10);  //Set the interval time in milliseconds
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}