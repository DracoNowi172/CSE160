class Camera {
    constructor(fov, aspect, near, far){
        this.type = "camera";
        this.eye = new Vector3([1,2,3]);
        this.at = new Vector3([0,0,-50]);
        this.up = new Vector3([0,1,0]);
        this.speed = .2;
        this.bounds = { minX: -14.5, maxX: 14.5, minZ: -15, maxZ: 16 };

        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }

    moveForwards() {
        var forwardDirection = new Vector3();
        forwardDirection.set(this.at);
        forwardDirection.sub(this.eye);
        forwardDirection.normalize();
    
        var movementVector = new Vector3([forwardDirection.elements[0], 0, forwardDirection.elements[2]]); // Ignore y component for movement calculation
        movementVector.normalize();
        movementVector.mul(this.speed);
    
        let nextSpot = new Vector3(this.eye.elements);
        nextSpot.add(movementVector);
        if (this.isInBounds(nextSpot)) {
            this.eye.add(movementVector);
            this.at.add(movementVector);
            this.updatePosition();
            let gridX = Math.floor(this.x + 15.5);
            let gridZ = Math.floor(this.z + 15.5);
            if (g_map[gridX] && g_map[gridX][gridZ] === 2) {
                g_map[gridX][gridZ] = 0;  // Clear the block from the map
                refreshRandomBlocks();  // Update the random blocks array
            }
            
        }
    }

    moveBackwards() {
        var forwardDirection = new Vector3();
        forwardDirection.set(this.at);
        forwardDirection.sub(this.eye);
        forwardDirection.normalize();
    
        var movementVector = new Vector3([forwardDirection.elements[0], 0, forwardDirection.elements[2]]);
        movementVector.normalize();
        movementVector.mul(-this.speed); // Multiply by -1 to move in the opposite direction
    
        let nextSpot = new Vector3(this.eye.elements);
        nextSpot.add(movementVector);
        if (this.isInBounds(nextSpot)) {
            this.eye.add(movementVector);
            this.at.add(movementVector);
            this.updatePosition();
            let gridX = Math.floor(this.x + 15.5);
            let gridZ = Math.floor(this.z + 15.5);
            if (g_map[gridX] && g_map[gridX][gridZ] === 2) {
                g_map[gridX][gridZ] = 0;  // Clear the block from the map
                refreshRandomBlocks();  // Update the random blocks array
            }
            
        }
    }

    moveLeft() {
        var left = new Vector3();
        left.set(this.at);  
        left.sub(this.eye);
        left.normalize();
    
        // Calculate the cross product
        var final = Vector3.cross(this.up, left);
        // Now multiply the result vector with the speed
        final.mul(this.speed); // Assuming 'mul' is a method that multiplies each component
    
        let nextSpot = new Vector3(this.eye.elements);
        nextSpot.add(final);
        if (this.isInBounds(nextSpot)) {
            this.updateCameraPosition(final);
            let gridX = Math.floor(this.x + 15.5);
            let gridZ = Math.floor(this.z + 15.5);
            if (g_map[gridX] && g_map[gridX][gridZ] === 2) {
                g_map[gridX][gridZ] = 0;  // Clear the block from the map
                refreshRandomBlocks();  // Update the random blocks array
            }
            
        }
    }
    
    moveRight() {
        var right = new Vector3();    
        right.set(this.eye);
        right.sub(this.at);
        right.normalize();
    
        // Calculate the cross product
        var final = Vector3.cross(this.up, right);
        // Now multiply the result vector with the speed
        final.mul(this.speed); // Ensure 'mul' is correct method to scale the vector
    
        let nextSpot = new Vector3(this.eye.elements);
        nextSpot.add(final);
        if (this.isInBounds(nextSpot)) {
            this.updateCameraPosition(final);
            let gridX = Math.floor(this.x + 15.5);
            let gridZ = Math.floor(this.z + 15.5);
            if (g_map[gridX] && g_map[gridX][gridZ] === 2) {
                g_map[gridX][gridZ] = 0;  // Clear the block from the map
                refreshRandomBlocks();  // Update the random blocks array
            }
            
        }
    }

    updateCameraPosition(vector) {
        this.eye.add(vector);
        this.at.add(vector);
        
    }

    updatePosition() {
        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }

    isInBounds(position) {
        return position.elements[0] >= this.bounds.minX && position.elements[0] <= this.bounds.maxX &&
               position.elements[2] >= this.bounds.minZ && position.elements[2] <= this.bounds.maxZ;
    }
    lookLeft(){
        //init new perspective
        var LRight = new Vector3;
        LRight.set(this.at);
        //Subtract camera's position ("eye") from new vector to get the forward direction
        LRight.sub(this.eye);
        //Calculate the horizontal radius from the camera to the target point
        var radius = Math.sqrt(LRight.elements[0]*LRight.elements[0] + LRight.elements[2]*LRight.elements[2]);
        //Determine the current horizontal angle of the forward direction in the x-z plane
        var theta = Math.atan2(LRight.elements[2], LRight.elements[0]);
        //sub to the angle calculated to look left
        theta -= (2 * Math.PI / 180);
        //Calculate the new x and z components of the vector after rotation
        LRight.elements[0] = radius * Math.cos(theta);
        LRight.elements[2] = radius * Math.sin(theta);
        //Update the camera to use new coordinates
        this.at.set(LRight);
        this.at.add(this.eye);
        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }
    lookRight(){ // Thank u sm prof for the calculations video <3
        //init new perspective
        var LLeft = new Vector3;
        LLeft.set(this.at);
        //Subtract camera's position ("eye") from new vector to get the forward direction
        LLeft.sub(this.eye);
        //Calculate the horizontal radius from the camera to the target point
        var radius = Math.sqrt(LLeft.elements[0] * LLeft.elements[0] + LLeft.elements[2] * LLeft.elements[2]);
        //Determine the current horizontal angle of the forward direction in the x-z plane
        var theta = Math.atan2(LLeft.elements[2], LLeft.elements[0]);
        //add to the angle calculated to look right
        theta += (2 * Math.PI / 180);
        //Calculate the new x and z components of the vector after rotation
        LLeft.elements[0] = radius * Math.cos(theta);
        LLeft.elements[2] = radius * Math.sin(theta);
        //Update the camera to use new coordinates
        this.at.set(LLeft);
        this.at.add(this.eye);
        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }
    lookUp(){
        //change 5 to be any number to affect speed
        this.at.elements[1]+=2;
        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }

    lookDown(){
        this.at.elements[1]-=2;
        this.x = this.eye.elements[0];
        this.y = this.eye.elements[1];
        this.z = this.eye.elements[2];
    }
    getForwardDirection() {
        let forward = new Vector3();
        forward.set(this.at);
        forward.sub(this.eye);
        forward.normalize();
        return forward; // Return the normalized forward direction
    }
}
function refreshRandomBlocks() {
    randomBlocks = [];  // Clear the current list
    for (let x = 0; x < g_map.length; x++) {
        for (let z = 0; z < g_map[x].length; z++) {
            if (g_map[x][z] === 2) {  // Check for random block indicator
                let block = new Cube();
                var textures = [5, 6];
                let textureIndex = Math.floor(Math.random() * textures.length); // Randomly select a texture index
                block.textureNum = textures[textureIndex];
                block.translate(x - 15.5, 0.01, z - 15.5);
                randomBlocks.push(block);
            }
        }
    }
}
//let cameraDirection = { x: Math.cos(g_camera.angle), z: Math.sin(camera.camera.angle) }; // Example calculation
// Function to place a block in front of the camera
function placeBlockAtCameraPosition(camera) {
    let forwardDirection = camera.getForwardDirection();
    let frontX = camera.eye.elements[0] + forwardDirection.elements[0];
    let frontZ = camera.eye.elements[2] + forwardDirection.elements[2];

    let gridX = Math.floor(frontX + 15.5);
    let gridZ = Math.floor(frontZ + 15.5);

    if (gridX >= 0 && gridX < g_map.length && gridZ >= 0 && gridZ < g_map[gridX].length) {
        if (g_map[gridX][gridZ] === 0) { // Check if the position is empty
            g_map[gridX][gridZ] = 3; // Set the block type to '3'
            let block = new Cube();
            block.textureNum = 7; // Choose the texture number for the new block
            block.translate(gridX - 15.5, 0.01, gridZ - 15.5);
            allies.push(block); // Add this block to your blocks array
            renderScene();
        }
    }
}
