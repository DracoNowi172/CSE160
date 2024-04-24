class Cube{
    constructor(){
      this.type = 'cube';
      //this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      //this.size = 5.0;
      this.matrix = new Matrix4();
    }
    render(color){
      if (this.vertexBuffer == null){
        this.vertexBuffer = gl.createBuffer();
      }
      //var xy = this.position;
      this.color = color;
      var rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      //front of cube
      drawCube([0.0, 0.0, 0.0,    1.0, 1.0, 0.0,   1.0, 0.0, 0.0]);
      drawCube([0.0, 0.0, 0.0,    0.0, 1.0, 0.0,   1.0, 1.0, 0.0]);

      //
      gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

      //top of cube
      drawCube([0.0, 1.0, 0.0,    0.0, 1.0, 1.0,   1.0, 1.0, 1.0]);
      drawCube([0.0, 1.0, 0.0,    1.0, 1.0, 1.0,   1.0, 1.0, 0.0]);

      // Back of cube
      gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
      drawCube([0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0]);
      drawCube([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0]);

      // Bottom of cube
      drawCube([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0]);
      drawCube([0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]);

      // Left of cube
      gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
      drawCube([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]);
      drawCube([0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]);

      // Right of cube
      drawCube([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
      drawCube([1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0]);
    }
    //in the event we dont get a color we still need to render
    render(){
      //var xy = this.position;
      var rgba = this.color;
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      //front of cube
      drawCube([0.0, 0.0, 0.0,    1.0, 1.0, 0.0,   1.0, 0.0, 0.0]);
      drawCube([0.0, 0.0, 0.0,    0.0, 1.0, 0.0,   1.0, 1.0, 0.0]);

      //
      gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

      //top of cube
      drawCube([0.0, 1.0, 0.0,    0.0, 1.0, 1.0,   1.0, 1.0, 1.0]);
      drawCube([0.0, 1.0, 0.0,    1.0, 1.0, 1.0,   1.0, 1.0, 0.0]);

      // Back of cube
      gl.uniform4f(u_FragColor, rgba[0]*0.8, rgba[1]*0.8, rgba[2]*0.8, rgba[3]);
      drawCube([0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0]);
      drawCube([0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0]);

      // Bottom of cube
      drawCube([0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0]);
      drawCube([0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0]);

      // Left of cube
      gl.uniform4f(u_FragColor, rgba[0]*0.7, rgba[1]*0.7, rgba[2]*0.7, rgba[3]);
      drawCube([0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0]);
      drawCube([0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0]);

      // Right of cube
      drawCube([1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0]);
      drawCube([1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0]);
    }
  
}
function drawCube(vertices){
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
  