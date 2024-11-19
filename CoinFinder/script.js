const video = document.getElementById('video');
const outputCanvas = document.getElementById('canvas');

let cv = window.cv;

// Webcam stream erhalten
navigator.mediaDevices.getUserMedia({
    video: { deviceId: 'USB Kamera ID' }, // Gib die spezifische Kamera-ID hier an
    audio: false
}).then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        requestAnimationFrame(mainLoop);

        //print video size
        console.log("Video size: " + video.videoWidth + "x" + video.videoHeight);
    };
}).catch(error => {
    console.error('Error accessing the camera: ', error);
});

function mainLoop() {
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    //Show red channel
    showRedChannel();

    //loop the function
    requestAnimationFrame(mainLoop);
}


function showRedChannel() {
    let frameMat = GetFrame();

    let channels = new cv.MatVector();

    cv.split(frameMat, channels);

    ShowFrame(channels.get(0));

    //free memory
    channels.delete();
    frameMat.delete();
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
    let frameMat = cv.imread(tempCanvas);

    return frameMat;
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



