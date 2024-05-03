class TriangularPrism 
{
    constructor() 
    {
        this.type = 'triangularPrism';
        this.color = [1.0, 1.0, 1.0, 1.0]; // RGBA color
        this.matrix = new Matrix4(); // Transformation matrix
    }

    render() 
    {
        var rgba = this.color;

        // Pass the color to the shader
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // Pass the transformation matrix to the shader
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        //Front Face
        drawTriangle3D( [0.0,0.0,0.0,   1.0,0.0,0.0,   0.5,0.5,0.0]);
        
        //Right Face
        drawTriangle3D( [0.0,0.0,0.0,   0.5,0.0,0.5,   0.5,0.5,0.0]);
        
        //Left Face
        drawTriangle3D( [0.5,0.0,0.5,   1.0,0.0,0.0,   0.5,0.5,0.0]);
        
        //Top Face
        gl.uniform4f(u_FragColor, rgba[0]*0.5, rgba[1]*0.5, rgba[2]*0.5, rgba[3]);
        drawTriangle3D( [0.0,0.0,0.0,   0.5,0.0,0.5,   1.0,0.0,0.0]);
    }
}
function drawTriangle3D(vertices)
    {
        var n = 3; //vertices number
        //buffer creation
        var vertexBuffer = gl.createBuffer();
        if(!vertexBuffer)
        {
            console.log('Failed to create the buffer object');
            return -1;
        }
        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    
        // Enable the assignment to a_Position variable
        gl.enableVertexAttribArray(a_Position);

        gl.drawArrays(gl.TRIANGLES, 0, n);  
    }
