let dp = 1.1;
let param1 = 50;
let param2 = 30;
let minRadius = 0;
let maxRadius = 0;
function FindCircles(inputMat){
    //Eingabe-Matrix in Graustufen umwandeln
    let grayMat = new cv.Mat();
    cv.cvtColor(inputMat, grayMat, cv.COLOR_RGBA2GRAY);

    let circlesMat = new cv.Mat();

    //Hough-Transformation
    cv.HoughCircles(grayMat, circlesMat, cv.HOUGH_GRADIENT, dp, minRadius, param1, param2, minRadius, maxRadius);

    //create circle objects
    let foundCircle = [];
    for (let i = 0; i < circlesMat.cols; ++i) {
        let x = circlesMat.data32F[i * 3];
        let y = circlesMat.data32F[i * 3 + 1];
        let radius = circlesMat.data32F[i * 3 + 2];

        foundCircle.push(new Circle(x, y, radius));
    }

    //free memory
    grayMat.delete();

    //draw circles
    DrawCircles(foundCircle, inputMat);

    ShowDebugInformation(inputMat);
}

function DrawCircles(circles, outputMat){
    //return if parameter is not set
    if(circles === undefined){
        console.error("Circles is undefined");
        return;
    }

    //draw circles
    for(let i = 0; i < circles.length; i++){
        DrawCircle(circles[i], outputMat, [255, 255, 0, 255]);
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

class Circle{
    x;
    y;
    radius;

    constructor(x, y, radius){
        this.x = x;
        this.y = y;
        this.radius = radius;
    }
}