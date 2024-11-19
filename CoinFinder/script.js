const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let cv = window.cv;

// Wenn das Fenster die Größe ändert, wird das Canvas neu skaliert
window.addEventListener('resize', resizeCanvas);

// Webcam stream erhalten
navigator.mediaDevices.getUserMedia({
    video: { deviceId: 'USB Kamera ID' }, // Gib die spezifische Kamera-ID hier an
    audio: false
}).then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        resizeCanvas();
        requestAnimationFrame(mainLoop);
    };
}).catch(error => {
    console.error('Error accessing the camera: ', error);
});



function mainLoop() {
    //Show red channel
    showRedChannel();

    //loop the function
    requestAnimationFrame(mainLoop);
}

// Passt das Canvas an die Größe des Videos an
function resizeCanvas() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    updateCanvas();
}



function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Zeichne auf das Canvas (Beispiel: Ein transparenter Rahmen)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

let tempCanvas = document.createElement('canvas');
let tempCtx = tempCanvas.getContext('2d');
function showRedChannel() {
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    tempCtx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

    let frameMat = cv.imread(tempCanvas);

    let channels = new cv.MatVector();

    cv.split(frameMat, channels);

    showFrame(channels.get(0));

    //free memory
    channels.delete();
    frameMat.delete();
}

function showFrame(inputMat){
    //return if openCV is not loaded
    if (typeof cv === 'undefined') {
        console.error('OpenCV.js not loaded');
        return;
    }

    cv.imshow(canvas, inputMat);

    //free memory
    inputMat.delete();
}



