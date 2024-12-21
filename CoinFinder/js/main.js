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
    console.log("Page loaded");
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

        //change color depending on the state
        let button = document.getElementById("toogleLoop");
        if(loopActive){
            button.style.backgroundColor = "green";
        }
        else{
            button.style.backgroundColor = "#ffa300";
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
let angle = 0;
function mainLoop() {
    waitingForAnimationFrame = false;

    console.log("loop started-------------------");

    //videoCapture.read(inputMat);
    //videoCapture.read(guiMat);

    /*let templates = Object.values(COINS).map(coin => coin.template);
    let edgesTemplates = templates.map(template => DetectEdges(template));
    ShowMatrices(templates, outputCanvas);
    edgesTemplates.forEach(mat => mat.delete());*/

    let template = COINS.Euro2.template;
    angle += 1;
    RotateMat(template, guiMat, angle);
    ShowMemoryUsage(guiMat);
    ShowMatrix(guiMat, outputCanvas);

    if(loopActive){
        waitingForAnimationFrame = true;
        requestAnimationFrame(mainLoop);
    }

    console.log("loop finieshed-------------------");
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



