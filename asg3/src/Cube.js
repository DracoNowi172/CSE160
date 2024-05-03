class Cube{
  constructor(){
      this.type='cube';
      this.color=[1.0,1.0,1.0,1.0];
      this.matrix = new Matrix4();
      this.textureNum = -2;

      this.vertices = { front: null, back: null, top: null, bot: null, right: null, left: null };
      this.UV = { front: null, back: null, top: null, bot: null, right: null, left: null };
  }
  generateVertices() {
    var rgba = this.color;
    var v = { 
        front: [0,0,0,  1,1,0,  1,0,0,  0,0,0,  0,1,0,  1,1,0], // Front of cube
        back: [0,0,1,  1,1,1,  1,0,1,  0,0,1,  0,1,1,  1,1,1], // Back of cube
        top: [0,1,0,  1,1,1,  1,1,0,  0,1,0,  0,1,1,  1,1,1], // Top of cube
        bot: [0,0,0,  1,0,1,  1,0,0,  0,0,0,  0,0,1,  1,0,1], // Bottom of cube
        right: [1,0,0,  1,1,1,  1,0,1,  1,0,0,  1,1,0,  1,1,1], // Right side of cube
        left: [0,0,0,  0,1,1,  0,0,1,  0,0,0,  0,1,0,  0,1,1] // Left side of cube
    };
    var v_uv = { 
        front: [0,0, 1,1, 1,0,  0,0, 0,1, 1,1], // UV coordinates for front face
        back: [1,0, 0,1, 0,0,  1,0, 1,1, 0,1], // UV coordinates for back face
        top: [0,0, 1,1, 1,0,  0,0, 0,1, 1,1], // UV coordinates for top face
        bot: [0,1, 1,0, 1,1,  0,1, 0,0, 1,0], // UV coordinates for bottom face
        right: [0,0, 1,1, 1,0,  0,0, 0,1, 1,1], // UV coordinates for right face
        left: [0,0, 1,1, 1,0,  0,0, 0,1, 1,1] // UV coordinates for left face
    };
      this.vertices.front = new Float32Array(v.front);
      this.vertices.back = new Float32Array(v.back);
      this.vertices.top = new Float32Array(v.top);
      this.vertices.bot = new Float32Array(v.bot);
      this.vertices.right = new Float32Array(v.right);
      this.vertices.left = new Float32Array(v.left);
      // uv stuff
      this.UV.front = new Float32Array(v_uv.front);
      this.UV.back = new Float32Array(v_uv.back);
      this.UV.top = new Float32Array(v_uv.top);
      this.UV.bot = new Float32Array(v_uv.bot);
      this.UV.right = new Float32Array(v_uv.right);
      this.UV.left = new Float32Array(v_uv.left);
  }

  render(){
      var rgba = this.color;

      //generates our vertices in a isolated area
      this.generateVertices();
      //console.log("test");

      // Pass the texture num
      gl.uniform1i(u_whichTexture, this.textureNum);
      // Pass the color of a point to u_FragColor uniform variable
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      // Pass the matrix to u_ModelMatrix attributes
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
      
      //console.log(this.vertices.front);

      drawCubeUV(this.vertices.front, this.UV.front, this.buffer);
      drawCubeUV(this.vertices.back, this.UV.back, this.buffer);
      drawCubeUV(this.vertices.top, this.UV.top, this.buffer);
      drawCubeUV(this.vertices.bot, this.UV.bot, this.buffer);
      drawCubeUV(this.vertices.right, this.UV.right, this.buffer);
      drawCubeUV(this.vertices.left, this.UV.left, this.buffer);
      

  }
}
function drawCube(vertices, cool){
  //vertices number
    var n = 3; 
    // Set the color before drawing
    //gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
    //buffer creation
    var vertexBuffer = gl.createBuffer();
    if(!vertexBuffer){
      console.log('Failed to create the buffer object');
      return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
  
    // var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    // if (a_Position < 0) {
    //   console.log('Failed to get the storage location of a_Position');
    //   return -1;
    // }
    // Assign the buffer object to a_Position variable
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  
    // Enable the assignment to a_Position variable
    gl.enableVertexAttribArray(a_Position);
  
    gl.drawArrays(gl.TRIANGLES, 0, n);  
  }
  
  function drawCubeUV(vertices, uv) {
    var n = vertices.length / 3;  // Calculate the number of vertices dynamically

    // Buffer for vertices
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object for vertices');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    
    // Buffer for UV coordinates
    var uvBuffer = gl.createBuffer();
    if (!uvBuffer) {
        console.log('Failed to create the buffer object for UV');
        return -1;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}