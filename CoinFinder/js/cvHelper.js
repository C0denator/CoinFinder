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
 */
function ShowMemoryUsage(dst) {

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
        console.log("Diese Funktion wird vom Browser nicht unterstützt");
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