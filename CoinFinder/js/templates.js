window.addEventListener("load", () => {
    InitTemplates();
});

const OnTemplatesLoaded = new Event('OnTemplatesLoaded');
let path = "../newTemplates/"

function InitTemplates() {
    let coinLength = Object.keys(COINS).length;
    let loadedCoins = 0;
    Object.entries(COINS).forEach(([key, value]) => {
        //is in the template folder a picture with the same name as the key?
        let img = new Image();

        img.onload = () => {

            //draw edges around the coin black
            let src = cv.imread(img);
            let radius = src.cols/2;
            let center = new cv.Point(src.cols/2, src.rows/2);

            let mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            cv.circle(mask, center, radius, [255, 255, 255, 255], -1);

            let maskedImage = new cv.Mat();
            cv.bitwise_and(src, src, maskedImage, mask);

            //delete mats
            src.delete();

            //save image as matrix in the coin object
            COINS[key].template = maskedImage;

            //save edge image as matrix in the coin object
            COINS[key].edges = DetectEdges(COINS[key].template);

            //DownloadMatrixAsImage(COINS[key].edges, key + "_edges.png");

            console.log("loaded template: " + key +" with img-path: " + img.src);

            loadedCoins++;
            if(loadedCoins === coinLength){
                console.log("All templates loaded");
                console.dir(COINS);
                document.dispatchEvent(OnTemplatesLoaded);
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

class Result {
    name;
    value;

    constructor(name, value){
        this.name = name;
        this.value = value;
    }

}

