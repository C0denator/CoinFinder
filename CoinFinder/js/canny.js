let threshold1 = 50;
let threshold2 = 100;
let apertureSize = 3;
let blurSize = 3;
let L2gradient = true;

function DetectEdges(inputMat){
    //create output mat
    let edgesMat = new cv.Mat();

    //gaussian blur
    if(blurSize>0 && blurSize%2 !== 0) cv.GaussianBlur(inputMat, inputMat, {width: blurSize, height: blurSize}, 0, 0, cv.BORDER_DEFAULT);

    //detect edges
    cv.Canny(inputMat, edgesMat, threshold1, threshold2, apertureSize, L2gradient);

    return edgesMat;
}