let path = "../templates/"

function InitTemplates(){

    Object.entries(COINS).forEach(([key, value]) => {
        //is in the template folder a picture with the same name as the key?
        let img = new Image();

        img.onload = () => {
            console.log("loaded: " + key);

            let src = cv.imread(img); //convert image to matrix
            let histSize = [256];
            let range = [0, 255];

            console.log("Loaded image: " + key + "; Size: " + src.rows + "x" + src.cols);

            let channels = new cv.MatVector();
            cv.split(src, channels);

            //histogramms for each channel
            let redHist = new cv.Mat();
            let greenHist = new cv.Mat();
            let blueHist = new cv.Mat();

            //create mask for the circle
            let mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1); //create a black image
            let center = new cv.Point(src.cols/2, src.rows/2);
            let radius = src.cols/2;
            cv.circle(mask, center, radius, [255, 255, 255, 255], -1); //draw a white circle in the middle of the image

            //calculate histogramm for each channel
            let matVec = new cv.MatVector();
            matVec.push_back(src);
            cv.calcHist(matVec, [0], mask, redHist, histSize, range, false);
            cv.calcHist(matVec, [1], mask, greenHist, histSize, range, false);
            cv.calcHist(matVec, [2], mask, blueHist, histSize, range, false);

            //normalize histograms
            cv.normalize(redHist, redHist, 0, 255, cv.NORM_MINMAX);
            cv.normalize(greenHist, greenHist, 0, 255, cv.NORM_MINMAX);
            cv.normalize(blueHist, blueHist, 0, 255, cv.NORM_MINMAX);

            COINS[key].hist = [redHist, greenHist, blueHist];

            //print each histogram
            console.log("Histograms for: " + key);
            PrintHistogram(redHist);
            PrintHistogram(greenHist);
            PrintHistogram(blueHist);

            //free memory
            src.delete();
            channels.delete();
            mask.delete();
            matVec.delete();
        }

        img.onerror = () => {
            console.log("error: " + key);
        }

        img.src = path + key + ".png";

    });
}

function PrintHistogram(hist) {
    let histArray = Array.from(hist.data32F);
    let maxValue = Math.max(...histArray);
    let maxIndex = histArray.indexOf(maxValue);

    // Titel der Gruppe
    console.groupCollapsed(`Histogram (Max index at: ${maxIndex}, Max value: ${maxValue})`);

    // Jedes Histogramm-Datum ausgeben
    histArray.forEach((value, index) => {
        console.log(`Bin ${index}: ${value.toString().replace(".", ",")}`);
    });

    // Gruppe schließen
    console.groupEnd();
}
