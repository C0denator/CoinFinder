let path = "../templates/"

function InitTemplates(){

    Object.entries(COINS).forEach(([key, value]) => {
        //is in the template folder a picture with the same name as the key?
        let img = new Image();

        img.onload = () => {
            console.log("loaded: " + key);

            let src = cv.imread(img);
            let histSize = 256;
            let range = [0, 255];

            let channels = new cv.MatVector();
            cv.split(src, channels);

            //histogramms for each channel
            let redHist = new cv.Mat();
            let greenHist = new cv.Mat();
            let blueHist = new cv.Mat();

            //round mask (diameter = width = height)
            let mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            let center = new cv.Point(src.cols/2, src.rows/2);
            let radius = src.cols/2;
            cv.circle(mask, center, radius, [255, 255, 255], -1, cv.LINE_8, 0);

            //calculate histogramm for each channel
            cv.calcHist(channels.get(0), [0], mask, redHist, histSize, range, false);
            cv.calcHist(channels.get(1), [0], mask, greenHist, histSize, range, false);
            cv.calcHist(channels.get(2), [0], mask, blueHist, histSize, range, false);

            COINS[key].hist = [redHist, greenHist, blueHist];

            //free memory
            src.delete();
            channels.delete();
            mask.delete();
        }

        img.onerror = () => {
            console.log("error: " + key);
        }

        img.src = path + key + ".png";

    });
}