let dp = 1.1;
let param1 = 50;
let param2 = 30;
let minRadius = 0;
let maxRadius = 0;
let grayMat;
let circlesMat;

window.addEventListener("load", function () {
    cv.onRuntimeInitialized = () => {
        //create Mats
        grayMat = new cv.Mat();
        circlesMat = new cv.Mat();
    }
});

function FindCircles(inputMat){

    //Eingabe-Matrix in Graustufen umwandeln
    cv.cvtColor(inputMat, grayMat, cv.COLOR_RGBA2GRAY);

    //Hough-Transformation
    cv.HoughCircles(grayMat, circlesMat, cv.HOUGH_GRADIENT, dp, minRadius, param1, param2, minRadius, maxRadius);

    //create circle objects
    let foundCircles = [];
    for (let i = 0; i < circlesMat.cols; ++i) {
        let x = circlesMat.data32F[i * 3];
        let y = circlesMat.data32F[i * 3 + 1];
        let radius = circlesMat.data32F[i * 3 + 2];

        foundCircles.push(new Circle(x, y, radius));
    }

    //draw circles
    for(let i = 0; i < foundCircles.length; i++){
        DrawCircle(foundCircles[i], inputMat, [255,255,255,255]);
    }

    ShowDebugInformation(inputMat);

    return foundCircles;
}

function FilterCircles(circles, inputMat){
    //delete every circle within another circle
    for(let i = 0; i < circles.length; i++) {
        for (let j = 0; j < circles.length; j++) {
            if (i === j) {
                continue;
            }

            if (circles[i].IsInsideOf(circles[j])) {
                //draw red circle
                DrawCircle(circles[i], inputMat, [255, 0, 0, 255]);

                circles.splice(i, 1);
                i--;
                break;
            }

        }
    }
}

function DrawCircles(circles, outputMat){
    //return if parameter is not set
    if(circles === undefined){
        console.error("Circles is undefined");
        return;
    }

    //draw circles
    for(let i = 0; i < circles.length; i++){
        let c = circles[i];
        let ratio = c.ftl / c.max_ftl;
        let color = [255-(255*ratio), 255*ratio, 0, 255];
        DrawCircle(circles[i], outputMat, color);
    }
}

function DrawCircle(circle, outputMat, color){
    //return if parameter is not set
    if(circle === undefined){
        console.error("Circle is undefined");
        return;
    }

    //draw circle
    cv.circle(outputMat, new cv.Point(circle.x, circle.y), circle.radius, color, 2);
}

function ShowDebugInformation(inputMat){
    //draw min and max radius in the top left corner
    cv.putText(inputMat, "Min Radius: " + minRadius, new cv.Point(100, 20), cv.FONT_HERSHEY_SIMPLEX, 0.5, [0, 255, 0, 255]);
    cv.putText(inputMat, "Max Radius: " + maxRadius, new cv.Point(100, 40), cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 0, 0, 255]);
    DrawCircle(new Circle(50, 50, minRadius), inputMat, [0, 255, 0, 255]);
    DrawCircle(new Circle(50, 50, maxRadius), inputMat, [255, 0, 0, 255]);

    //draw resolution of inputMat
    cv.putText(inputMat, "Resolution: " + inputMat.cols + "x" + inputMat.rows, new cv.Point(10, inputMat.rows-10), cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255]);
}

/**
 * Enthält alle Kreise, die in den letzten 5 Frames gefunden wurden
 * @type {Circle[]}
 */
let savedCircles = [];

/**
 * Compares the new-found circles with the saved circles and updates the saved circles
 * @param {Circle[]} newCircles
 */
function UpdateCircles(newCircles){
    //console.log("Length of savedCircles: " + savedCircles.length);
    //console.log("Length of newCircles: " + newCircles.length);

    //return if parameter is not set
    if(newCircles === undefined){
        console.error("newCircles is undefined");
        return;
    }

    //check ftl for all old circles
    for(let i = 0; i < savedCircles.length; i++){
        savedCircles[i].ftl--;
        if(savedCircles[i].ftl <= 0){
            savedCircles.splice(i, 1);
            i--;
        }
    }

    /*console.log("SavedCircles: ");
    console.dir([...savedCircles]);
    console.log("NewCircles: ");
    console.dir([...newCircles]);
    console.log("------------------------------------------------------");*/

    if(newCircles.length === 0){
        return;
    }

    if (savedCircles.length === 0) {
        savedCircles = newCircles.slice();
    }else{
        //check if new circles are already in savedCircles
        for(let i = 0; i < newCircles.length; i++){
            let found = false;
            for(let j = 0; j < savedCircles.length; j++){
                if(newCircles[i].Equals(savedCircles[j])){
                    found = true;
                    savedCircles[j].ftl = savedCircles[j].max_ftl;

                    //update position of saved circle, by calculating the average of the old and new position
                    savedCircles[j].x = (savedCircles[j].x + newCircles[i].x) / 2;
                    savedCircles[j].y = (savedCircles[j].y + newCircles[i].y) / 2;
                    savedCircles[j].radius = (savedCircles[j].radius + newCircles[i].radius) / 2;

                    break;
                }
            }

            if(!found){
                savedCircles.push(newCircles[i]);
            }
        }
    }

}

class Circle {
    x;
    y;
    radius;
    ftl; //frame to live
    max_ftl;

    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.ftl = 20;
        this.max_ftl = this.ftl;
    }

    Equals(otherCircle){
        let margin = 0.5; //how much the circles can touch each other
        let distance = Math.sqrt(Math.pow(this.x - otherCircle.x, 2) + Math.pow(this.y - otherCircle.y, 2));
        return distance <= (this.radius + otherCircle.radius) * margin;
    }

    IsInsideOf(otherCircle){
        let distance = Math.sqrt(Math.pow(this.x - otherCircle.x, 2) + Math.pow(this.y - otherCircle.y, 2));
        let margin = 0.25 //how much of the radius can be outside of the other circle to be still inside
        return otherCircle.radius * (1+margin) >= distance + this.radius;
    }

}