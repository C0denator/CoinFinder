let video;
let outputCanvas;
let videoContainer;

window.onload = () => {
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

            Init();
        };
    }).catch(error => {
        console.error('Error accessing the camera: ', error);
    });
};

function Init(){
    InitTemplates();

    console.log("Templates loaded");
    console.dir(COINS);

    requestAnimationFrame(mainLoop);
}

function mainLoop() {
    if (typeof window.cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    let currentFrame = GetFrame();
    let foundCircles = FindCircles(currentFrame);
    FilterCircles(foundCircles, currentFrame);
    UpdateCircles(foundCircles);
    DrawCircles(savedCircles, currentFrame);

    ShowMemoryUsage(currentFrame);
    ShowFrame(currentFrame);

    //loop the function
    requestAnimationFrame(mainLoop);
}

let tempCanvas = document.createElement('canvas');
let tempCtx= tempCanvas.getContext('2d', { willReadFrequently: true });
function GetFrame(){
    //set the size of the temp canvas to the size of the output canvas
    tempCanvas.width = outputCanvas.width;
    tempCanvas.height = outputCanvas.height;

    //draw the video frame on the temp canvas
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    //create a matrix from the temp canvas
    return cv.imread(tempCanvas);
}

function ShowFrame(inputMat){
    //return if openCV is not loaded
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    cv.imshow('canvas', inputMat);

    //free memory
    inputMat.delete();
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



