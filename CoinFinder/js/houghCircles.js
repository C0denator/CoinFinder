let dp = 2;
let param1 = 230;
let param2 = 149;
let minRadius = 18;
let maxRadius = 75;
let grayMat;
let circlesMat;

window.addEventListener("load", function () {
    cv.onRuntimeInitialized = () => {
        //create Mats
        grayMat = new cv.Mat();
        circlesMat = new cv.Mat();
    }
});

/**
 * Find all circles in the inputMat and draw them in the guiMat. Returns an array of Circle-objects
 * @param {Mat} inputMat - The Matrix in which the circles should be found
 * @param {Mat} guiMat - The Matrix in which the circles should be drawn
 * @returns {Circle[]} - Array of Circle-objects
 */
function FindCircles(inputMat, guiMat){

    //Eingabe-Matrix in Graustufen umwandeln
    cv.cvtColor(inputMat, grayMat, cv.COLOR_RGBA2GRAY);

    //reset circlesMat
    circlesMat.delete();
    circlesMat = new cv.Mat();

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
        DrawCircle(foundCircles[i], guiMat, [255,255,255,255]);
    }

    ShowDebugInformation(guiMat);

    return foundCircles;
}

/**
 * Filters the circles by deleting every circle that is inside of another circle
 * @param {Circle[]} circles - The array of circles that should be filtered
 * @param {Mat} guiMat - The Matrix where deleted circles will be drawn in pink
 */
function FilterCircles(circles, guiMat){
    //delete every circle within another circle
    for(let i = 0; i < circles.length; i++) {
        for (let j = 0; j < circles.length; j++) {
            if (i === j) {
                continue;
            }

            if (circles[i].IsInsideOf(circles[j])) {
                //draw pink circle
                DrawCircle(circles[i], guiMat, [255, 0, 255, 255]);

                circles.splice(i, 1);
                i--;

                console.log("Deleted circle");

                break;
            }

        }
    }
}

function DrawCircles(circles, guiMat){
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
        DrawCircle(circles[i], guiMat, color);
    }
}

function DrawCircle(circle, guiMat, color){
    //return if parameter is not set
    if(circle === undefined){
        console.error("Circle is undefined");
        return;
    }

    //draw circle
    cv.circle(guiMat, new cv.Point(circle.x, circle.y), circle.radius, color, 2);
}

function ShowDebugInformation(guiMat){
    //draw min and max radius in the top left corner
    cv.putText(guiMat, "Min Radius: " + minRadius, new cv.Point(100, 20), cv.FONT_HERSHEY_SIMPLEX, 0.5, [0, 255, 0, 255]);
    cv.putText(guiMat, "Max Radius: " + maxRadius, new cv.Point(100, 40), cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 0, 0, 255]);
    DrawCircle(new Circle(50, 50, minRadius), guiMat, [0, 255, 0, 255]);
    DrawCircle(new Circle(50, 50, maxRadius), guiMat, [255, 0, 0, 255]);

    //draw resolution of guiMat
    cv.putText(guiMat, "Resolution: " + guiMat.cols + "x" + guiMat.rows, new cv.Point(10, guiMat.rows-10), cv.FONT_HERSHEY_SIMPLEX, 0.5, [255, 255, 255, 255]);
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

    //make a hard copy of newCircles
    newCircles = newCircles.slice();

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

                    //update circle
                    savedCircles[j].Update(newCircles[i]);

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
        let margin = 0.4 //how much of the radius can be outside of the other circle to be still inside
        return otherCircle.radius * (1+margin) >= distance + this.radius;
    }

    /**
     * Returns a clipped matrix with only the pixels inside the circle
     * @param {Mat} src - The Matrix from which the image should be clipped
     * @returns {Mat} - Matrix with only the pixels inside the circle
     */
    GetImageData(src){
        let clippedImage = src.roi(new cv.Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2));

        return ClipCorners(clippedImage);
    }

    Update(otherCircle){
        this.ftl = this.max_ftl;

        this.x = (this.x + otherCircle.x) / 2;
        this.y = (this.y + otherCircle.y) / 2;
        this.radius = (this.radius + otherCircle.radius) / 2;
    }

}