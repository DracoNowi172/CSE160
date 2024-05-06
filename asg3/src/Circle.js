class Circle {
    constructor(radius = 1.0, segments = 8) {
        this.type = 'sphere';
        this.radius = radius;
        this.segments = segments; // Control the detail level of the sphere
        this.color = [1.0, 1.0, 1.0, 1.0]; // Default color white
        this.matrix = new Matrix4();
        this.vertexBuffer = null; // Store vertices in a buffer object
        this.initVertices();
    }

    initVertices() {
        let vertices = [];
        let angleStep = Math.PI / this.segments; // Using radians directly for clarity

        for (let theta = 0; theta < Math.PI; theta += angleStep) {
            for (let phi = 0; phi < 2 * Math.PI; phi += angleStep) {
                // Calculate the four vertices of each quad
                vertices = vertices.concat(this.vertexAt(theta, phi));
vertices = vertices.concat(this.vertexAt(theta + angleStep, phi));
vertices = vertices.concat(this.vertexAt(theta, phi + angleStep));

vertices = vertices.concat(this.vertexAt(theta + angleStep, phi + angleStep));
vertices = vertices.concat(this.vertexAt(theta, phi + angleStep));
vertices = vertices.concat(this.vertexAt(theta + angleStep, phi));
            }
        }
        this.vertices = new Float32Array(vertices);
        this.setupVertexBuffer();
    }

    vertexAt(theta, phi) {
        return [
            this.radius * Math.sin(theta) * Math.cos(phi),
            this.radius * Math.sin(theta) * Math.sin(phi),
            this.radius * Math.cos(theta)
        ];
    }

    setupVertexBuffer() {
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
    }

    render() {
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
    }
}