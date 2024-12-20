let video;
let outputCanvas;
let videoContainer;

/**
 * the video capture object
 * @type {cv.VideoCapture}
 */
let videoCapture;
/**
 * the current frame of the video. The video capture object stores the current frame in this matrix
 * @type {cv.Mat}
 */
let inputMat;

/**
 * the matrix in which the gui elements are drawn
 * @type {cv.Mat}
 */
let guiMat;

let loadingFinished = false;
let loopActive = false;

window.addEventListener("load", function () {
    video = document.getElementById('video');
    outputCanvas = document.getElementById('outputCanvas');
    videoContainer = document.getElementById('videoContainer');

    // Webcam stream erhalten
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    }).then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play()

            //print camera stats
            console.log("Camera resolution: " + video.videoWidth + "x" + video.videoHeight);
            console.log("Camera frame rate: " + stream.getVideoTracks()[0].getSettings().frameRate+ " fps");

            //set the aspect ratio of the video to the div
            //videoContainer.style.aspectRatio = (video.videoWidth).toString() + " / " + (video.videoHeight).toString();

            //initialize the inputMat-Matrix
            inputMat = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            guiMat = new cv.Mat(video.height, video.width, cv.CV_8UC4);
            videoCapture = new cv.VideoCapture(video);

            Init();
        };
    }).catch(error => {
        console.error('Error accessing the camera: ', error);
    });

    //add event to startButton
    document.getElementById("readFrame").addEventListener("click", () => {
        if(loadingFinished){
            if(!waitingForAnimationFrame) mainLoop();
        }else{
            console.error("Can't start the loop because the templates are not loaded yet");
        }
    });
    document.getElementById("toogleLoop").addEventListener("click", () => {
        loopActive = !loopActive;
        if(loadingFinished){
            if(!waitingForAnimationFrame) mainLoop();
        }else{
            console.error("Can't start the loop because the templates are not loaded yet");
        }
    });

    requestAnimationFrame(Init);
});

function Init(){
    InitTemplates();

    document.addEventListener("templatesLoaded", () => {
        console.log("Templates loaded");
        console.dir(COINS);

        loadingFinished = true;
    });

}

let test=false;
let waitingForAnimationFrame = false;
function mainLoop() {
    waitingForAnimationFrame = false;

    console.log("loop started-------------------");

    //videoCapture.read(inputMat);
    //videoCapture.read(guiMat);

    let edgesMat = DetectEdges(COINS.Euro1.template);

    let newSize = new cv.Size(120, 120);
    let resizeMat = new cv.Mat();
    let Interpolation = cv.INTER_AREA;
    cv.resize(edgesMat, resizeMat, newSize, 0, 0, Interpolation);

    ShowFrame(resizeMat);

    edgesMat.delete();
    resizeMat.delete();

    /*let foundCircles = FindCircles(inputMat, guiMat);
    FilterCircles(foundCircles, inputMat, guiMat);
    UpdateCircles(foundCircles);

    if(savedCircles.length > 0){
        savedCircles.forEach(c => {
           MatchTemplates(c.GetImageData(inputMat), c);
        });
    }

    DrawCircles(savedCircles, guiMat);

    ShowMemoryUsage(guiMat);
    ShowTotalValue(savedCircles);
    ShowFrame(guiMat);*/

    if(loopActive){
        waitingForAnimationFrame = true;
        requestAnimationFrame(mainLoop);
    }

    console.log("loop finieshed-------------------");
}

function ShowFrame(inputMat){
    //return if openCV is not loaded
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    cv.imshow(outputCanvas, inputMat);
}


function ShowTotalValue(circles){
    let totalValueLabel = document.getElementById("value");
    if(totalValueLabel === null){
        console.error("Label not found");
        return;
    }

    let totalValue = 0;
    circles.forEach(c => {
        if(c.bestMatch !== undefined){
            totalValue += c.bestMatch.value;
        }
    });

    totalValueLabel.innerText = totalValue + "€";
}

/**
 * Zeigt die Speichernutzung des Browsers unten rechts an
 */
function ShowMemoryUsage(inputMat) {

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
        cv.putText(inputMat, "Memory: " + totalJSHeapSize + "MB / " + jsHeapSizeLimit + "MB (" + percentage + "%)", new cv.Point(inputMat.cols - 260, inputMat.rows - 10), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
    } else {
        console.log("Diese Funktion wird vom Browser nicht unterstützt");
    }
}



