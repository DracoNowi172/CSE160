class Camera {//builds off of vector3 class from cuon matrix
    constructor(fov, aspect, near, far){
      this.type = "camera";
      this.eye = new Vector3( [0,0,3] );    // point in space
      this.at = new Vector3( [0,0,-100] );    // this is a point space
      this.up = new Vector3( [0,1,0] );
      this.speed = 0.2;//added speed modification to help with forward movement
    }
    moveForwards(mod=0){//equations from videos thanks prof!
        var forwards = new Vector3;// f = at - eye
        forwards.set(this.at);
        forwards.sub(this.eye);
        forwards.normalize();
        forwards.mul(this.speed + mod);//SPEEDUP
        this.eye.add(forwards);//eye = eye + forwards
        this.at.add(forwards);// at = at + forwards
    }
    moveBackwards(mod=0){
        var back = new Vector3;// back = eye - at
        back.set(this.eye);
        back.sub(this.at);
        back.normalize();
        back.mul(this.speed + mod);
        this.at.add(back);
        this.eye.add(back);
    }
    moveLeft(){
        var left = new Vector3;// left = at - eye
        left.set(this.at);
        left.sub(this.eye);
        left.normalize();
        left.mul(this.speed);
        var s = Vector3.cross(this.up, left);
        this.at.add(s);
        this.eye.add(s);
    }
    moveRight(){
        var right = new Vector3;    // l = eye - at
        right.set(this.eye);
        right.sub(this.at);
        right.normalize();
        right.mul(this.speed);
        var s = Vector3.cross(this.up, r);
        this.at.add(s);
        this.eye.add(s);
    }
    lookLeft(mod=1){
        var lookleft = new Vector3;
        lookleft.set(this.at);
        lookleft.sub(this.eye);
        let rotationMatrix = new Matrix4();
		rotationMatrix.setIdentity();
		rotationMatrix.setRotate(1 * mod, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
		// Get the vec3 translation of Matrix4 Rotation Matrix
		let d3D = rotationMatrix.multiplyVector3(pl);
		this.at = d3D.add(this.eye);
    }
    lookRight(mod=1){
        var lookright = new Vector3;
        lookright.set(this.at);
        lookright.sub(this.eye);
        let rotationMatrix = new Matrix4();
		rotationMatrix.setIdentity();
		rotationMatrix.setRotate(-1 * mod, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
		// Get the vec3 translation of Matrix4 Rotation Matrix
		let d3D = rotationMatrix.multiplyVector3(pr);
		this.at = d3D.add(this.eye);
    }
    lookUp(mod=1){
        var lookup = new Vector3;
        var nv = new Vector3( [0,(this.speed * mod)/2,0] );
        lookup.set(this.at);
        lookup.add(nv);
        lookup.sub(this.eye);
        let rotationMatrix = new Matrix4();
		rotationMatrix.setIdentity();
		let d3D = rotationMatrix.multiplyVector3(pl);
		this.at = d3D.add(this.eye);
    }
    lookDown(mod=1){
        var lookdown = new Vector3;
        var nv = new Vector3( [0,(this.speed * mod)/2,0] );
        lookdown.set(this.at);
        lookdown.sub(nv);
        lookdown.sub(this.eye);
        let rotationMatrix = new Matrix4();
		rotationMatrix.setIdentity();
		let d3D = rotationMatrix.multiplyVector3(pr);
		this.at = d3D.add(this.eye);
    }
    

}