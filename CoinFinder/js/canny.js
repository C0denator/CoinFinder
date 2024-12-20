let threshold1 = 50;
let threshold2 = 100;
let apertureSize = 3;
let blurSize = 3;
let L2gradient = true;

function DetectEdges(inputMat){
    //create output mat
    let edgesMat = new cv.Mat();

    //clamp apertureSize to 3, 5 or 7
    let allowedValues = [3, 5, 7];
    apertureSize = allowedValues.includes(apertureSize)
        ? apertureSize
        : allowedValues.reduce((closest, current) =>
            Math.abs(current - apertureSize) < Math.abs(closest - apertureSize) ? current : closest
        );

    //gaussian blur
    allowedValues = [1, 3, 5, 7];
    blurSize = allowedValues.includes(blurSize)
        ? blurSize
        : allowedValues.reduce((closest, current) =>
            Math.abs(current - blurSize) < Math.abs(closest - blurSize) ? current : closest
        );
    cv.GaussianBlur(inputMat, inputMat, new cv.Size(blurSize, blurSize), 0, 0, cv.BORDER_DEFAULT);

    //detect edges
    cv.Canny(inputMat, edgesMat, threshold1, threshold2, apertureSize, L2gradient);

    return edgesMat;
}