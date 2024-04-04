// Draw Rectangle.js
var ctx
var canvas
function drawVector(v, color){
    //scale by 20 as said
    ctx.strokeStyle = color;
    ctx.beginPath();
    // move to the center of the canvas (0,0) is top left
    ctx.moveTo(canvas.width/2,canvas.height/2);
    //add a offset to our x and y equal to 200 to take care of our canvas size
    //ctx.lineTo(200+v.elements[0]*20, 200-v.elements[1]*20, 0);
    ctx.lineTo(canvas.width / 2 + v.elements[0] * 20, canvas.height / 2 - v.elements[1] * 20);
    ctx.stroke();
}
function handleDrawEvent() {
    // Clear the canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Read values from input fields
    var X = document.getElementById('xCoord').value;
    var Y = document.getElementById('yCoord').value;
    // inputs are strings so change them to float first, can use parseFloat as well 
    X = Number(X);
    Y = Number(Y);
    // Check if the inputs are numbers, to avoid drawing when the input is invalid
    if(isNaN(X) || isNaN(Y)) {
        console.log("Please enter valid numbers for both coordinates.");
        return;
    }
    // Read values from input fields
    var X2 = document.getElementById('xCoord2').value;
    var Y2 = document.getElementById('yCoord2').value;
    // inputs are strings so change them to float first, can use parseFloat as well 
    X2 = Number(X2);
    Y2 = Number(Y2);
    // Check if the inputs are numbers, to avoid drawing when the input is invalid
    if(isNaN(X2) || isNaN(Y2)) {
        console.log("Please enter valid numbers for both coordinates.");
        return;
    }

    // Create vector and draw
    var v1 = new Vector3([X, Y, 0]);
    var v2 = new Vector3([X2, Y2, 0]);
    drawVector(v1, "red");
    drawVector(v2, "blue");
}
function angleBetween(v1, v2){
    //dot(v1, v2) = ||v1|| * ||v2|| * cos(alpha).
    //α=cos^−1( ∣∣v1∣∣×∣∣v2∣∣dot(v1,v2))
    //we need magnitude of v1 and v2 since magnitude is just the abs value 
    var base = Vector3.dot(v1, v2);
    var cosAlpha = base/(v1.magnitude()*v2.magnitude());
    //Math.acos returns the arccosine of a number in radians
    var angleRadians = Math.acos(cosAlpha);
    //turn to degrees (thank u google!)
    var Final = angleRadians*(180/Math.PI);
    return Final;

}
function areaTriangle(v1,v2){
    //||v1 x v2]]  equals to the area of the parallelogram that the vectors span.
    var base = Vector3.cross(v1,v2); // this makes a trapezoid
    // this vector holds the total area of the trapezoid
    // console.log("baseX:" + base[0].value);
    // console.log("basey:" + base[1].value);
    // console.log("basez:" + base[2].value);
    var v1 = new Vector3([base[0],base[1],base[2]]);
    //since a trapezoid is just 2 triangles we can simply divide by 2 for our area
    var final = v1.magnitude()/2;
    return final;
}
function handleDrawOperationEvent(){
    // Clear the canvas
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Read values from input fields
    var X = document.getElementById('xCoord').value;
    var Y = document.getElementById('yCoord').value;
    // inputs are strings so change them to float first, can use parseFloat as well 
    X = Number(X);
    Y = Number(Y);
    // Check if the inputs are numbers, to avoid drawing when the input is invalid
    if(isNaN(X) || isNaN(Y)) {
        console.log("Please enter valid numbers for both coordinates.");
        return;
    }
    // Read values from input fields
    var X2 = document.getElementById('xCoord2').value;
    var Y2 = document.getElementById('yCoord2').value;
    // inputs are strings so change them to float first, can use parseFloat as well 
    X2 = Number(X2);
    Y2 = Number(Y2);
    // Check if the inputs are numbers, to avoid drawing when the input is invalid
    if(isNaN(X2) || isNaN(Y2)) {
        console.log("Please enter valid numbers for both coordinates.");
        return;
    }
    // Create vector and draw
    var v1 = new Vector3([X, Y, 0]);
    var v2 = new Vector3([X2, Y2, 0]);
    drawVector(v1, "red");
    drawVector(v2, "blue");

    // Read value of selector
    var selector = document.getElementById("Op").value;
    //I originally used if statements but found out switch cases are in javascript as well
    switch(selector){
        case "add":
            // Vector addition
            var v3 = new Vector3();
            v3 = v1.add(v2);
            drawVector(v3, "green");
            break;
        case "sub":
            // Vector subtraction
            var v3 = new Vector3();
            v3 = v1.sub(v2);
            drawVector(v3, "green");
            break;
        case "div":
            //need to handle divide by zero
            var scalar = document.getElementById("scal").value;
            var v3 = new Vector3();
            v3 = v1.div(scalar);
            var v4 = new Vector3();
            v4 = v2.div(scalar);
            drawVector(v3, "green");
            drawVector(v4, "green");
            break;
        case "mul":
            //need to handle divide by zero
            var scalar = document.getElementById("scal").value;
            var v3 = new Vector3();
            v3 = v1.mul(scalar);
            var v4 = new Vector3();
            v4 = v2.mul(scalar);
            drawVector(v3, "green");
            drawVector(v4, "green");
            break;
        case "magnitude":
            //use the + operator to add to a string just like in python
            console.log("Magnitude v1: "+ v1.magnitude());
            console.log("Magnitude v2: "+ v2.magnitude());
            break;
        case "normalize":
            //use the + operator to add to a string just like in python
            var v1N = v1.normalize();
            drawVector(v1N, "green");
            var v2N = v2.normalize();
            drawVector(v2N, "green");
            break;
        case "Angle between":
            //use the + operator to add to a string just like in python
            //round to 2nd decimal place in order for tests to pass
            console.log("Angle: "+ angleBetween(v1, v2).toFixed(2));
            break;
        case "Area":
            //use the + operator to add to a string just like in python
            //round to 2nd decimal place in order for tests to pass
            console.log("Area: "+ areaTriangle(v1, v2).toFixed(2));
            break;
        
    }
}

function main(){
    //Question 1
    //retrieve <canvas> element
    canvas = document.getElementById('example');
    if(!canvas){
        console.log('Failed to retrieve the <canvas> element');
        return;
    }
    //get the rendering context for 2DCG
    ctx = canvas.getContext('2d');

    //Draw a blue rectangle
    //ctx.fillStyle = 'rgba(0, 0, 255, 1.0)'; //set a blue color
    //ctx.fillRect(120, 10, 150, 150); // Fill a rectangle with the color

    //Question 2
    //make canvas black
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //create vector and draw
    var v1 = new Vector3([2.25, 2.25, 0]);
    drawVector(v1, "red");
}