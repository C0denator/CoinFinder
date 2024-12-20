const templatesLoaded = new Event('templatesLoaded');
let path = "../newTemplates/"

function InitTemplates() {
    let coinLength = Object.keys(COINS).length;
    let loadedCoins = 0;
    Object.entries(COINS).forEach(([key, value]) => {
        //is in the template folder a picture with the same name as the key?
        let img = new Image();

        img.onload = () => {

            //save image as matrix in the coin object
            COINS[key].template = cv.imread(img);

            //save edge image as matrix in the coin object
            COINS[key].edges = DetectEdges(COINS[key].template);

            //DownloadMatrixAsImage(COINS[key].edges, key + "_edges.png");

            console.log("loaded template: " + key);

            loadedCoins++;
            if(loadedCoins === coinLength){
                console.log("All oldTemplates loaded");
                document.dispatchEvent(templatesLoaded);
            }
        }

        img.onerror = () => {
            console.log("error: " + key);
        }

        img.src = path + key + ".png";

    });
}

function InitHists(){

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
            /*console.log("Histograms for: " + key);
            PrintHistogram(redHist);
            PrintHistogram(greenHist);
            PrintHistogram(blueHist);*/

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

function MatchTemplates(src, circle){
    //create result string
    let resultsString = [];
    Object.entries(COINS).forEach(([key, value]) => {
        let resultMat = new cv.Mat();

        //resize template to the size of src
        let templateResized = new cv.Mat();
        cv.resize(COINS[key].template, templateResized, COINS[key].template.size(), 0, 0, cv.INTER_AREA);

        cv.matchTemplate(src, templateResized, resultMat, cv.TM_SQDIFF_NORMED);

        //get highest value
        let minMax = cv.minMaxLoc(resultMat);
        let max = minMax.maxVal;

        resultsString.push(new Result(key, max));

        templateResized.delete();
    });

    //sort results from highest to lowest
    resultsString.sort((a, b) => a.value - b.value);

    //console.dir(resultsString);

    //save bestmatch in circle
    circle.bestMatch = COINS[resultsString[0].name];
    circle.matchValue = resultsString[0].value;

    //set matchValue to 2 decimal places
    circle.matchValue = Math.round(circle.matchValue * 100) / 100;

    src.delete();
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

function DownloadMatrixAsImage(mat, name) {
    // Erstellen eines neuen Canvas-Elements
    let canvas = document.createElement('canvas');
    canvas.width = mat.cols;
    canvas.height = mat.rows;
    let ctx = canvas.getContext('2d');

    // Erstellen eines ImageData-Objekts
    let imageData = ctx.createImageData(mat.cols, mat.rows);

    // Prüfen, ob das Bild Graustufen oder Farbe ist
    let channels = mat.channels(); // Anzahl der Kanäle in der Matrix (1 für Graustufen, 3 für Farbe)

    for (let y = 0; y < mat.rows; y++) {
        for (let x = 0; x < mat.cols; x++) {
            let pixelIndex = (y * mat.cols + x) * 4; // Index im ImageData-Array
            if (channels === 1) {
                // Graustufenbild
                let pixelValue = mat.ucharAt(y, x);
                imageData.data[pixelIndex] = pixelValue;     // R
                imageData.data[pixelIndex + 1] = pixelValue; // G
                imageData.data[pixelIndex + 2] = pixelValue; // B
                imageData.data[pixelIndex + 3] = 255;        // A (vollständig undurchsichtig)
            } else if (channels === 4) {
                // Farbbild
                let pixelPtr = mat.ucharPtr(y, x);
                let pixelValueR = pixelPtr[0];  // R
                let pixelValueB = pixelPtr[2];  // B
                let pixelValueG = pixelPtr[1];  // G
                imageData.data[pixelIndex] = pixelValueR;      // R
                imageData.data[pixelIndex + 1] = pixelValueG;  // G
                imageData.data[pixelIndex + 2] = pixelValueB;  // B
                imageData.data[pixelIndex + 3] = 255;          // A (vollständig undurchsichtig)
            } else {
                console.error("Ungültige Anzahl an Kanälen: " + channels);
            }
        }
    }

    // ImageData auf das Canvas anwenden
    ctx.putImageData(imageData, 0, 0);

    // Canvas zu einem Bild umwandeln
    let image = new Image();
    image.src = canvas.toDataURL();

    // Bild herunterladen
    let a = document.createElement('a');
    a.href = image.src;
    a.download = name;

    //Fragen ob heruntergeladen werden soll
    let confirmDownload = confirm("Möchten Sie das Bild herunterladen?");
    if (confirmDownload) {
        a.click();
    }
}

class Result {
    name;
    value;

    constructor(name, value){
        this.name = name;
        this.value = value;
    }

}

