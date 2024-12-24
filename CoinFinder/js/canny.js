class Settings{
    constructor(threshold1, threshold2, apertureSize, blurSize){
        this.threshold1 = threshold1;
        this.threshold2 = threshold2;
        this.apertureSize = apertureSize;
        this.blurSize = blurSize;
    }
}

let SettingsTemplate = new Settings(9400, 23300, 7, 7);
let SettingsLive = new Settings(400, 600, 5, 1);

let L2gradient = true;

/**
 * Detects edges in a given Mat and returns a new Mat with the detected edges
 * @param {Mat} src - The Matrix in which the edges should be detected
 * @param {Settings} settings - The settings for the edge detection. Contains the following properties:
 * - threshold1: The first threshold for the hysteresis procedure
 * - threshold2: The second threshold for the hysteresis procedure
 * - apertureSize: The aperture size for the Sobel operator
 * - blurSize: The size of the Gaussian blur kernel
 * @returns {Mat} The Matrix with the detected edges
 */
function DetectEdges(src, settings){
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

    if(settings === undefined){
        console.warn("No settings provided. Using template settings");
        settings = SettingsTemplate;
    }


    //clamp apertureSize to 3, 5 or 7
    let allowedValues = [3, 5, 7];
    settings.apertureSize = allowedValues.includes(settings.apertureSize)
        ? settings.apertureSize
        : allowedValues.reduce((closest, current) =>
            Math.abs(current - settings.apertureSize) < Math.abs(closest - settings.apertureSize) ? current : closest
        );

    //gaussian blur
    allowedValues = [1, 3, 5, 7];
    settings.blurSize = allowedValues.includes(settings.blurSize)
        ? settings.blurSize
        : allowedValues.reduce((closest, current) =>
            Math.abs(current - settings.blurSize) < Math.abs(closest - settings.blurSize) ? current : closest
        );
    cv.GaussianBlur(grayMat, grayMat, new cv.Size(settings.blurSize, settings.blurSize), 0, 0, cv.BORDER_DEFAULT);

    //detect edges
    cv.Canny(grayMat, edgesMat, settings.threshold1, settings.threshold2, settings.apertureSize, L2gradient);

    //delete mats
    grayMat.delete();

    return edgesMat;
}