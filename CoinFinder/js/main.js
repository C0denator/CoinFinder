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

window.addEventListener("load", function () {
    video = document.getElementById('video');
    outputCanvas = document.getElementById('canvas');
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
});

function Init(){
    InitTemplates();

    document.addEventListener("templatesLoaded", () => {
        console.log("Templates loaded");
        console.dir(COINS);

        requestAnimationFrame(mainLoop);
    });

}

let test=false;
function mainLoop() {
    if (typeof window.cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    //console.log("loop started-------------------");

    videoCapture.read(inputMat);
    videoCapture.read(guiMat);
    let foundCircles = FindCircles(inputMat, guiMat);
    FilterCircles(foundCircles, inputMat, guiMat);
    UpdateCircles(foundCircles);

    if (!test && savedCircles.length > 0) {
        console.log("MatchTemplates Test");
        MatchTemplates(savedCircles[0].GetImageData(inputMat));
        test = true;
        DrawCircles(savedCircles, guiMat);
        ShowFrame(guiMat);
        return;
    }

    DrawCircles(savedCircles, guiMat);

    ShowMemoryUsage(guiMat);
    ShowFrame(guiMat);

    //loop the function
    requestAnimationFrame(mainLoop);

    //console.log("loop finieshed-------------------");
}

function ShowFrame(inputMat){
    //return if openCV is not loaded
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    cv.imshow('canvas', inputMat);
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



