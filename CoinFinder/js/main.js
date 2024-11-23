const video = document.getElementById('video');
const outputCanvas = document.getElementById('canvas');
const videoContainer = document.getElementById('videoContainer');

window.onload = () => {
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
            console.log("Camera id: " + stream.getVideoTracks()[0].getSettings().deviceId);

            //set the aspect ratio of the video to the div
            //videoContainer.style.aspectRatio = (video.videoWidth).toString() + " / " + (video.videoHeight).toString();

            //start the main loop
            requestAnimationFrame(mainLoop);
        };
    }).catch(error => {
        console.error('Error accessing the camera: ', error);
    });
};

function mainLoop() {
    if (typeof window.cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    //loop the function
    requestAnimationFrame(mainLoop);
}


function DetectCircles(inputMat){}

let tempCanvas = document.createElement('canvas');
let tempCtx= tempCanvas.getContext('2d', { willReadFrequently: true });
function GetFrame(){
    //set the size of the temp canvas to the size of the output canvas
    tempCanvas.width = outputCanvas.width;
    tempCanvas.height = outputCanvas.height;

    //draw the video frame on the temp canvas
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    //create a matrix from the temp canvas
    let frameMat = cv.imread(tempCanvas);

    return frameMat;
}

function ShowFrame(inputMat){
    //return if openCV is not loaded
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    //print the size of the input matrix
    console.log("Input size: " + inputMat.cols + "x" + inputMat.rows);

    cv.imshow('canvas', inputMat);

    //free memory
    inputMat.delete();
}



