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
            //let croppedMat = CropMatrix(src, 20);
            let clippedMat = ClipCorners(src);
            COINS[key].template = clippedMat;

            //save edge image as matrix in the coin object
            if(key==="Cent1" || key==="Cent2" || key==="Cent5"){
                blurSize = 5;
            }else{
                blurSize = 7;
            }
            COINS[key].edges = ConvertC1ToC4(DetectEdges(COINS[key].template, SettingsTemplate));

            //DownloadMatrixAsImage(COINS[key].edges, key + "_edges.png");

            console.log("loaded template: " + key +" with img-path: " + img.src);

            loadedCoins++;
            if(loadedCoins === coinLength){
                console.log("All templates loaded");
                console.dir(COINS);
                document.dispatchEvent(OnTemplatesLoaded);
            }
            src.delete();
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
async function MatchTemplates(src, circle){
    //create result string
    let matchType = cv.TM_CCOEFF_NORMED;
    let iterations = 180;
    let angleStep = 360 / iterations;
    let allResults = [];

    for(let i = 0; i < iterations; i++){
        //pause so the browser can update the gui
        await new Promise(r => setTimeout(r, 0));


        let rotatedSrc = new cv.Mat();
        if(i>0){
            //rotate image
            RotateMatrix(src, rotatedSrc, angleStep * i);
        }else{
            rotatedSrc = src.clone();
        }

        let templateSimilarity = [];
        Object.entries(COINS).forEach(([key, value]) => {

            //check if src and template have the same type
            if(rotatedSrc.type() !== COINS[key].edges.type()){
                console.error("Type of src and template are not the same");
                console.error("src: " + GetMatrixType(rotatedSrc));
                console.error("template(edges): " + GetMatrixType(COINS[key].edges));
                return;
            }

            let templateResized = new cv.Mat();
            cv.resize(COINS[key].edges, templateResized, rotatedSrc.size(), 0, 0, cv.INTER_AREA);

            let resultMat = new cv.Mat();
            cv.matchTemplate(rotatedSrc, templateResized, resultMat, matchType);

            //get highest and lowest value
            let minMax = cv.minMaxLoc(resultMat);
            let max = minMax.maxVal;
            let min = minMax.minVal;

            templateSimilarity.push(new Result(key, min, max));

            //console.log("Match value: " + max);

            //free memory
            templateResized.delete();
            resultMat.delete();
        });

        //find lowest and highest value
        let lowest = templateSimilarity.reduce((prev, current) => (prev.min < current.min) ? prev : current);
        let highest = templateSimilarity.reduce((prev, current) => (prev.max > current.max) ? prev : current);
        allResults.push(new Result("Iteration " + i, lowest, highest));

        //draw loading bar
        DrawLoadingBar(guiMat, (i+1) / iterations);
        DrawMemoryUsage(guiMat);
        //ShowMatrix(guiMat, outputCanvas);
        ShowMatrices([guiMat, COINS[lowest.name].edges, src, rotatedSrc],outputCanvas);
    }

    console.log("Results for all iterations:");
    console.dir(allResults);

    //sort results from highest to lowest
    if (matchType === cv.TM_SQDIFF ||
        matchType === cv.TM_SQDIFF_NORMED) {
        //find lowest value
        allResults.sort((a, b) => a.min.min - b.min.min);
        circle.matchValue = allResults[0].min.min;
        circle.bestMatch = allResults[0].min.name;
    }else{
        //find highest value
        allResults.sort((a, b) => b.max.max - a.max.max);
        circle.matchValue = allResults[0].max.max;
        circle.bestMatch = allResults[0].max.name;
    }

    console.log("Best match:");
    console.dir(allResults[0]);

    //set matchValue to 2 decimal places
    circle.matchValue = Math.round(circle.matchValue * 100) / 100;

    DrawCoinValue([circle], guiMat);

    src.delete();
}

class Result {
    name;
    min;
    max;

    constructor(name, min, max){
        this.name = name;
        this.min = min;
        this.max = max;
    }

}

