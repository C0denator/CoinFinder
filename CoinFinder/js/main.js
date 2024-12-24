let video;
let outputCanvas;
let videoContainer;

/**
 * the video capture object
 * @type {VideoCapture}
 */
let videoCapture;
/**
 * the current frame of the video. The video capture object stores the current frame in this matrix
 * @type {Mat}
 */
let inputMat;

/**
 * the matrix in which the gui elements are drawn
 * @type {Mat}
 */
let guiMat;
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

            //check if everything is loaded
            cameraLoaded = true;
            console.log("Camera loaded");
            CheckIfLoadingFinished();
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
    document.getElementById("showTemplates").addEventListener("click", () => {
        let edgesTemplates = Object.values(COINS).map(coin => coin.edges);
        ShowMatrices(edgesTemplates, outputCanvas);
    });
});

document.addEventListener("OnTemplatesLoaded", () => {
    templatesLoaded = true;
    CheckIfLoadingFinished();
});

let cameraLoaded = false;
let templatesLoaded = false;
let loadingFinished = false;
function CheckIfLoadingFinished(){
    loadingFinished = cameraLoaded && templatesLoaded;
    if(loadingFinished){
        console.log("Everything is loaded");
    }
}

let waitingForAnimationFrame = false;
let angle = 0;
async function mainLoop() {
    if(!loadingFinished){
        console.warn("Can't start the loop because something is not loaded yet");
        return;
    }

    waitingForAnimationFrame = false;

    console.log("--- loop started");

    videoCapture.read(inputMat);
    videoCapture.read(guiMat);

    /*let edges = DetectEdges(inputMat, SettingsLive);
    ShowMatrix(edges, outputCanvas);
    //free the memory
    edges.delete();*/


    let foundCircles = FindCircles(inputMat, guiMat);
    FilterCircles(foundCircles, guiMat);
    console.log("Found circles: " + foundCircles.length);

    await matchAllCircles(foundCircles);

    console.log("after matchAllCircles");
    ShowTotalValue(foundCircles);
    DrawMemoryUsage(guiMat);
    ShowMatrix(guiMat, outputCanvas);

    if(loopActive){
        waitingForAnimationFrame = true;
        setTimeout(mainLoop, 1000 / 30);
    }

    console.log("--- loop ended");
}

async function matchAllCircles(circles){
    for (const c of circles) {
        await MatchTemplates(ConvertC1ToC4(DetectEdges(c.GetImageData(inputMat), SettingsLive)), c);
    }
    console.log("All circles matched");
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
            totalValue += NameToValue(c.bestMatch);
        }
    });

    //round to 2 decimal places
    totalValue = Math.round(totalValue * 100) / 100;

    totalValueLabel.innerText = totalValue + "€";
}

function DrawCoinValue(circles, dist){
    if (circles === undefined || circles.length === 0) {
        return;
    }

    for(let i = 0; i < circles.length; i++){
        //does circle have "bestMatch" property?
        if (circles[i].bestMatch === undefined) {
            //print "?"
            cv.putText(dist, "?", new cv.Point(circles[i].x, circles[i].y), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 0, 255, 255), 1);
        }else{
            //print bestMatch
            cv.putText(dist, circles[i].bestMatch, new cv.Point(circles[i].x-10, circles[i].y-6), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
            cv.putText(dist, circles[i].matchValue.toString(), new cv.Point(circles[i].x-10, circles[i].y+6), cv.FONT_HERSHEY_SIMPLEX, 0.5, new cv.Scalar(255, 255, 255, 255), 1);
        }
    }
}



