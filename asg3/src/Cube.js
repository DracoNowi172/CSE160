class Cube{
  constructor(){
      this.type = 'cube';
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -2;

      //TODO : find a way to store buffers so we dont call new in render  --not Checked
      //       Sleep  -- Checked


      this.generateVertices();  // Call this during construction
  }

  //new and improved generate vertices code that aggregates all into 1 draw cube call
  //no more stuttering!
  generateVertices(){
      const sides = ['front', 'back', 'top', 'bot', 'right', 'left'];
      const vertexData = [];
      const uvData = [];

      // Define vertex positions and UV coordinates for each face
      const vertices ={
          front: [0,0,0,  1,1,0,  1,0,0,  0,0,0,  0,1,0,  1,1,0],
          back: [0,0,1,  1,1,1,  1,0,1,  0,0,1,  0,1,1,  1,1,1],
          top: [0,1,0,  1,1,1,  1,1,0,  0,1,0,  0,1,1,  1,1,1],
          bot: [0,0,0,  1,0,1,  1,0,0,  0,0,0,  0,0,1,  1,0,1],
          right: [1,0,0,  1,1,1,  1,0,1,  1,0,0,  1,1,0,  1,1,1],
          left: [0,0,0,  0,1,1,  0,0,1,  0,0,0,  0,1,0,  0,1,1]
      };

      const uvCoords ={
          front: [0,0, 1,1, 1,0, 0,0, 0,1, 1,1],
          back: [1,0, 0,1, 0,0, 1,0, 1,1, 0,1],
          top: [0,0, 1,1, 1,0, 0,0, 0,1, 1,1],
          bot: [0,1, 1,0, 1,1, 0,1, 0,0, 1,0],
          right: [0,0, 1,1, 1,0, 0,0, 0,1, 1,1],
          left: [0,0, 1,1, 1,0, 0,0, 0,1, 1,1]
      };

      // Aggregate all vertices and UVs into arrays
      sides.forEach(side => {
          vertexData.push(...vertices[side]);
          uvData.push(...uvCoords[side]);
      });

      // Create buffer objects
      this.vertexBuffer = this.createBuffer(new Float32Array(vertexData));
      this.uvBuffer = this.createBuffer(new Float32Array(uvData));
  }

    createBuffer(data){
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }

    translate(x, y, z) {
        this.matrix.translate(x, y, z);
    }

    render(){
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4fv(u_FragColor, this.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Draw all faces at once (I hated you so much but I love the result)
        drawCubeUV(this.vertexBuffer, this.uvBuffer, 36); // Total 6 faces * 6 vertices per face
    }
}

function drawCubeUV(vertexBuffer, uvBuffer, vertexCount){
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}
