let threshold1 = 9400;
let threshold2 = 23300;
let apertureSize = 7;
let blurSize = 7;
let L2gradient = true;

/**
 * Detects edges in a given Mat and returns a new Mat with the detected edges
 * @param {Mat} src - The Matrix in which the edges should be detected
 * @returns {Mat} The Matrix with the detected edges
 */
function DetectEdges(src){
    if(!CheckForCorrectMatType(src, [MatTypes.CV_8UC4, MatTypes.CV_8UC1])) return null;

    //create output mat
    let edgesMat = new cv.Mat();

    //create gray mat
    let grayMat = new cv.Mat();

    if(src.type() === MatTypes.CV_8UC4){
        cv.cvtColor(src, grayMat, cv.COLOR_RGBA2GRAY, 0);
    }else if(src.type() === MatTypes.CV_8UC1) {
        //clone the matrix
        console.warn("src is already a gray matrix. Cloning it");
        grayMat = src.clone();
    }else{
        console.error("Unsupported type of src-matrix: " + GetMatrixType(src));
        return null;
    }


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
    cv.GaussianBlur(grayMat, grayMat, new cv.Size(blurSize, blurSize), 0, 0, cv.BORDER_DEFAULT);

    //detect edges
    cv.Canny(grayMat, edgesMat, threshold1, threshold2, apertureSize, L2gradient);

    //delete mats
    grayMat.delete();

    return edgesMat;
}