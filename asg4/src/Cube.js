class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
        this.textureNum = -2;
        this.generateVertices();
    }

    generateVertices() {
        const sides = ['front', 'back', 'top', 'bot', 'right', 'left'];
        const vertexData = [];
        const uvData = [];
        const normals = [];

        const vertices = {
            front: [0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0],
            back: [0, 0, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1],
            top: [0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1],
            bot: [0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1],
            right: [1, 0, 0, 1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1],
            left: [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1]
        };

        const uvCoords = {
            front: [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
            back: [1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1],
            top: [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
            bot: [0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0],
            right: [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1],
            left: [0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1]
        };

        const normalcoords = {
            front: [0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1],
            back: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            top: [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
            bot: [0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0],
            right: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0],
            left: [-1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0]
        };

        sides.forEach(side => {
            vertexData.push(...vertices[side]);
            uvData.push(...uvCoords[side]);
            normals.push(...normalcoords[side]);
        });

        this.vertexBuffer = this.createBuffer(new Float32Array(vertexData));
        this.uvBuffer = this.createBuffer(new Float32Array(uvData));
        this.normalBuffer = this.createBuffer(new Float32Array(normals));
    }

    createBuffer(data) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        return buffer;
    }

    render() {
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4fv(u_FragColor, this.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        const normalMatrix = new Matrix4().setInverseOf(this.matrix).transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        const faceVertices = {
            front: { start: 0, count: 6, dimmingFactor: 1.0 },
            back: { start: 6, count: 6, dimmingFactor: 0.8 },
            top: { start: 12, count: 6, dimmingFactor: 0.9 },
            bot: { start: 18, count: 6, dimmingFactor: 0.6 },
            right: { start: 24, count: 6, dimmingFactor: 0.7 },
            left: { start: 30, count: 6, dimmingFactor: 0.5 }
        };

        Object.values(faceVertices).forEach(face => {
            const dimmedColor = this.color.map((component, index) => index < 3 ? component * face.dimmingFactor : component);
            gl.uniform4fv(u_FragColor, dimmedColor);
            drawCubeUVNormal(this.vertexBuffer, this.uvBuffer, face.count, this.normalBuffer, face.start * 3, face.start * 2, face.start * 3);
        });
    }
}

function drawCubeUVNormal(vertexBuffer, uvBuffer, vertexCount, normalBuffer, vertexOffset, uvOffset, normalOffset) {
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, vertexOffset * 4);
    gl.enableVertexAttribArray(a_Position);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, uvOffset * 4);
    gl.enableVertexAttribArray(a_UV);

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, normalOffset * 4);
    gl.enableVertexAttribArray(a_Normal);

    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}
