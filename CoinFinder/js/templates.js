window.addEventListener("load", () => {
    InitTemplates();
});

const OnTemplatesLoaded = new Event('OnTemplatesLoaded');
let path = "../templates_2/"

function InitTemplates() {
    let coinLength = Object.keys(COINS).length;
    let loadedCoins = 0;
    Object.entries(COINS).forEach(([key, value]) => {
        //is in the template folder a picture with the same name as the key?
        let img = new Image();

        img.onload = () => {

            //draw edges around the coin black
            let src = cv.imread(img);

            //save image as matrix in the coin object
            COINS[key].template = ClipCorners(src);

            //save edge image as matrix in the coin object
            if(key==="Cent1" || key==="Cent2" || key==="Cent5"){
                blurSize = 5;
            }else{
                blurSize = 7;
            }
            COINS[key].edges = ConvertC1ToC4(DetectEdges(COINS[key].template));

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

/**
 * Compares the src with the templates and saves the best match in the circle object
 * @param {Mat} src
 * @param {Circle} circle
 */
function MatchTemplates(src, circle){
    //create result string
    let resultsString = [];
    let matchType = cv.TM_SQDIFF_NORMED;
    console.group("Template matching");
    Object.entries(COINS).forEach(([key, value]) => {

        //check if src and template have the same type
        if(src.type() !== COINS[key].edges.type()){
            console.error("Type of src and template are not the same");
            console.error("src: " + GetMatrixType(src));
            console.error("template(edges): " + GetMatrixType(COINS[key].edges));
            return;
        }

        console.log("---Matching template: " + key);
        console.log("Size src: " + src.rows + "x" + src.cols);
        console.log("Size template: " + COINS[key].template.rows + "x" + COINS[key].template.cols);

        //resize template to the size of src
        let templateResized = new cv.Mat();
        cv.resize(COINS[key].edges, templateResized, COINS[key].template.size(), 0, 0, cv.INTER_AREA);

        console.log("Size resized template: " + templateResized.rows + "x" + templateResized.cols);
        DownloadMatrixAsImage(src, "src.png");
        DownloadMatrixAsImage(templateResized, key + "_resized.png");

        let resultMat = new cv.Mat();
        cv.matchTemplate(src, templateResized, resultMat, matchType);

        //get highest value
        let minMax = cv.minMaxLoc(resultMat);
        let max = minMax.maxVal;

        resultsString.push(new Result(key, max));

        console.log("Match value: " + max);

        //free memory
        templateResized.delete();
        resultMat.delete();
    });
    console.groupEnd();

    //sort results from highest to lowest
    if (matchType === cv.TM_SQDIFF ||
        matchType === cv.TM_SQDIFF_NORMED) {
        console.log("Sort from lowest to highest");
        //lower values are better, so sort from lowest to highest
        resultsString.sort((a, b) => a.value - b.value);
    }else{
        console.log("Sort from highest to lowest");
        //higher values are better, so sort from highest to lowest
        resultsString.sort((a, b) => b.value - a.value);
    }


    console.dir(resultsString);

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

