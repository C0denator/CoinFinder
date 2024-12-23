/**
 * Zeigt eine Matrix auf einem Canvas an
 * @param {Mat} src
 * @param {HTMLCanvasElement} canvas
 */
function ShowMatrix(src, canvas){
    cv.imshow(canvas, src);
}

/**
 * Zeigt mehrere Matrizen in einem Gitter auf einem Canvas an
 * @param {Mat[]} src
 * @param {HTMLCanvasElement} canvas
 */
function ShowMatrices(src, canvas) {
    if (src.length === 0) {
        console.error("No src to show");
        return;
    }

    if (src.length === 1) {
        console.warn("Only one matrix to show. Using ShowMatrix instead");
        ShowMatrix(src[0], canvas);
        return;
    }

    let numberOfMatrices = src.length;

    // Berechnung der Gittergröße
    let gridCols = Math.ceil(Math.sqrt(numberOfMatrices));
    let gridRows = Math.ceil(numberOfMatrices / gridCols);

    // Maximalbreite und -höhe der Matrizen basierend auf der Größe des Canvas
    let cellWidth = canvas.width / gridCols;
    let cellHeight = canvas.height / gridRows;

    // Canvas leeren
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Jede Matrix im Gitter zeichnen
    src.forEach((mat, index) => {
        // Spalte und Zeile bestimmen
        let col = index % gridCols;
        let row = Math.floor(index / gridCols);

        // Zielbereich für diese Matrix
        let x = col * cellWidth;
        let y = row * cellHeight;
        let targetSize = new cv.Size(cellWidth, cellHeight);

        // Matrix auf passende Größe skalieren
        let resizedMat = new cv.Mat();
        cv.resize(mat, resizedMat, targetSize, 0, 0, cv.INTER_AREA);

        console.log("Matrix hat " + resizedMat.channels() + " Kanäle");

        // Matrix in RGBA umwandeln wenn es sich um eine Graustufenmatrix handelt
        if (resizedMat.channels() === 1) {
            let rgbaMat = new cv.Mat();
            cv.cvtColor(resizedMat, rgbaMat, cv.COLOR_GRAY2RGBA);
            resizedMat.delete();
            resizedMat = rgbaMat;
        }

        // Erstelle ein temporäres Canvas für diese Matrix
        let tempCanvas = document.createElement('canvas');
        let tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = resizedMat.cols;
        tempCanvas.height = resizedMat.rows;

        // In ein ImageData konvertieren und in das temporäre Canvas zeichnen
        let imageData = new ImageData(new Uint8ClampedArray(resizedMat.data), resizedMat.cols, resizedMat.rows);
        tempCtx.putImageData(imageData, 0, 0);

        // Zeichne das temporäre Canvas auf das Haupt-Canvas
        ctx.drawImage(tempCanvas, 0, 0, resizedMat.cols, resizedMat.rows, x, y, cellWidth, cellHeight);

        console.log("Matrix " + index + " gezeichnet");

        // Bereinige die temporären Matrizen
        resizedMat.delete();
    });
}

/**
 * Rotiert eine Matrix um einen bestimmten Winkel
 * @param {Mat} src Die zu rotierende Matrix
 * @param {Mat} dist Die Matrix, in die das Ergebnis geschrieben wird
 * @param {number} angle Der Winkel in Grad
 */
function RotateMat(src, dist, angle){

    let center = new cv.Point(src.cols / 2, src.rows / 2);
    let interpolation = cv.INTER_LINEAR;
    let borderMode = cv.BORDER_CONSTANT;
    let borderValue = new cv.Scalar();

    //Rotationsmatrix erstellen
    let rotationMatrix = cv.getRotationMatrix2D(center, angle, 1);

    //Matrix rotieren
    cv.warpAffine(src, dist, rotationMatrix, new cv.Size(src.cols, src.rows), interpolation, borderMode, borderValue);

    //Matrix freigeben
    rotationMatrix.delete();
}

/**
 * Sets all pixels in the corners of the image to black.
 * Only use this function if the circle takes up the whole image.
 * @param {Mat} src The matrix to clip
 * @returns {Mat} The clipped matrix
 */
function ClipCorners(src){
    console.log("Clipping corners. src has type: " + GetMatrixType(src));
    //draw edges around the coin black
    let radius = src.cols/2;
    let center = new cv.Point(src.cols/2, src.rows/2);

    let mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    cv.circle(mask, center, radius, [255, 255, 255, 255], -1);
    console.log("Clipping corners. mask has type: " + GetMatrixType(mask));

    let maskedImage = new cv.Mat();
    let channels = new cv.MatVector();
    cv.split(src, channels);

    //apply mask to each channel
    for(let i = 0; i < channels.size(); i++){
        cv.bitwise_and(channels.get(i), mask, channels.get(i));
    }

    //merge channels to one image
    cv.merge(channels, maskedImage);

    //delete mats
    mask.delete();
    channels.delete();

    console.log("Clipped corners. maskedImage has type: " + GetMatrixType(maskedImage));

    return maskedImage;
}

/**
 * Lässt den Benutzer die übergebene Matrix als Bild herunterladen
 * @param {Mat} src Die Matrix, die heruntergeladen werden soll
 * @param {string} name Der Name der Datei
 */
function DownloadMatrixAsImage(src, name) {
    // Erstellen eines neuen Canvas-Elements
    let canvas = document.createElement('canvas');
    canvas.width = src.cols;
    canvas.height = src.rows;
    let ctx = canvas.getContext('2d');

    // Erstellen eines ImageData-Objekts
    let imageData = ctx.createImageData(src.cols, src.rows);

    // Prüfen, ob das Bild Graustufen oder Farbe ist
    let channels = src.channels(); // Anzahl der Kanäle in der Matrix (1 für Graustufen, 3 für Farbe)

    for (let y = 0; y < src.rows; y++) {
        for (let x = 0; x < src.cols; x++) {
            let pixelIndex = (y * src.cols + x) * 4; // Index im ImageData-Array
            if (channels === 1) {
                // Graustufenbild
                let pixelValue = src.ucharAt(y, x);
                imageData.data[pixelIndex] = pixelValue;     // R
                imageData.data[pixelIndex + 1] = pixelValue; // G
                imageData.data[pixelIndex + 2] = pixelValue; // B
                imageData.data[pixelIndex + 3] = 255;        // A (vollständig undurchsichtig)
            } else if (channels === 4) {
                // Farbbild
                let pixelPtr = src.ucharPtr(y, x);
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

/**
 * Zeigt die Speichernutzung des Browsers unten rechts an
 * @param {Mat} dst Die Matrix, auf der die Speichernutzung angezeigt werden soll
 */
function DrawMemoryUsage(dst) {

    if (performance.memory) {
        let memoryInfo = performance.memory;

        let jsHeapSizeLimit = memoryInfo.jsHeapSizeLimit;
        let totalJSHeapSize = memoryInfo.totalJSHeapSize;
        let usedJSHeapSize = memoryInfo.usedJSHeapSize;

        //Umrechnung in MB
        jsHeapSizeLimit = Math.round(jsHeapSizeLimit / 1048576);
        totalJSHeapSize = Math.round(totalJSHeapSize / 1048576);
        usedJSHeapSize = Math.round(usedJSHeapSize / 1048576);

        let percentage = Math.round(totalJSHeapSize / jsHeapSizeLimit * 100);

        //Speichernutzung unten rechts anzeigen
        cv.putText(dst, "Memory: " + totalJSHeapSize + "MB / " + jsHeapSizeLimit + "MB (" + percentage + "%)", new cv.Point(dst.cols - 260, dst.rows - 10), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
    } else {
        console.warn("Diese Funktion wird vom Browser nicht unterstützt");
    }
}

/**
 * Gibt die Werte eines Histogramms in der Konsole aus
 * @param {Mat} hist Das Histogramm welches ausgegeben werden soll
 */
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

/**
 * Checks if the src-matrix has the expected type. Use this as guard clause
 * @param {Mat} src The matrix to check
 * @param {number[]} expectedTypes The expected types of the matrix
 * @returns {boolean} True if the matrix has the expected type
 */
function CheckForCorrectMatType(src, expectedTypes){
    if(!expectedTypes.includes(src.type())){
        console.error("Wrong type of src-matrix. Expected: " + expectedTypes.map(type => MapNumberToType(type)).join(", ")
            + "; Actual: " + GetMatrixType(src));
        return false;
    }
    return true;
}

/**
 * Returns the type of the matrix as a string
 * @param {Mat} mat
 * @returns {String} The openCV type of the matrix
 */
function GetMatrixType(mat) {
    return MapNumberToType(mat.type());
}

/**
 * Maps the number to the corresponding openCV type
 * @param {number} number The matrix type number
 * @returns {String} The openCV type of the matrix as a string
 */
function MapNumberToType(number){
    const types = {
        0: "CV_8UC1",  1: "CV_8SC1",  2: "CV_16UC1",  3: "CV_16SC1",
        4: "CV_32SC1", 5: "CV_32FC1", 6: "CV_64FC1",
        8: "CV_8UC2",  9: "CV_8SC2",  10: "CV_16UC2", 11: "CV_16SC2",
        12: "CV_32SC2",13: "CV_32FC2",14: "CV_64FC2",
        16: "CV_8UC3", 17: "CV_8SC3", 18: "CV_16UC3", 19: "CV_16SC3",
        20: "CV_32SC3",21: "CV_32FC3",22: "CV_64FC3",
        24: "CV_8UC4", 25: "CV_8SC4", 26: "CV_16UC4", 27: "CV_16SC4",
        28: "CV_32SC4",29: "CV_32FC4",30: "CV_64FC4"
    };

    return types[number] || `Unknown type: ${number}`;
}

/**
 * Returns the number of channels of the matrix
 * @type {{CV_32FC1: number, CV_32FC3: number, CV_32FC2: number, CV_32FC4: number, CV_32SC4: number, CV_32SC3: number, CV_32SC2: number, CV_32SC1: number, CV_8UC1: number, CV_8SC3: number, CV_8SC2: number, CV_8SC1: number, CV_8UC4: number, CV_8UC3: number, CV_8UC2: number, CV_8SC4: number, CV_64FC3: number, CV_64FC4: number, CV_16UC4: number, CV_16UC3: number, CV_16UC2: number, CV_16SC4: number, CV_16UC1: number, CV_16SC3: number, CV_64FC1: number, CV_16SC2: number, CV_16SC1: number, CV_64FC2: number}}
 */
const MatTypes = {
    CV_8UC1: 0,  CV_8SC1: 1,  CV_16UC1: 2,  CV_16SC1: 3,
    CV_32SC1: 4, CV_32FC1: 5, CV_64FC1: 6,
    CV_8UC2: 8,  CV_8SC2: 9,  CV_16UC2: 10, CV_16SC2: 11,
    CV_32SC2: 12, CV_32FC2: 13, CV_64FC2: 14,
    CV_8UC3: 16,  CV_8SC3: 17,  CV_16UC3: 18, CV_16SC3: 19,
    CV_32SC3: 20, CV_32FC3: 21, CV_64FC3: 22,
    CV_8UC4: 24,  CV_8SC4: 25,  CV_16UC4: 26, CV_16SC4: 27,
    CV_32SC4: 28, CV_32FC4: 29, CV_64FC4: 30
}
