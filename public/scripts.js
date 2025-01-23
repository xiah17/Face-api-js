console.log(faceapi)

const run = async()=>{
    //loading the models is going to use await
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
    })
    const videoFeedE1 = document.getElementById('video-feed')
    videoFeedE1.srcObject = stream
    //we need to load our models
    //pre-trained machine learning for our facial detection
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.ageGenderNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models'),
    ])

    //make the canvas the same size and in the same location
    // as our video feed
    const canvas = document.getElementById('canvas')
    canvas.style.left = videoFeedE1.offsetLeft
    canvas.style.top = videoFeedE1.offsetTop
    canvas.height = videoFeedE1.height
    canvas.width = videoFeedE1.width

    //FACIAL RECOGNITION DATA
    //Img URL
    const refFace = await faceapi.fetchImage('./images/Jalen.png')

    //we grab the reference image, and hand it to detectAllFaces method
    let refFaceAiData = await faceapi.detectAllFaces(refFace).withFaceLandmarks().withFaceDescriptors()
    let faceMatcher = new faceapi.FaceMatcher(refFaceAiData)


    //facial detection with points
    setInterval(async()=>{
        //get the video feed and hand it to detectAllFaces method
        let faceAIData = await faceapi.detectAllFaces(videoFeedE1).withFaceLandmarks().withFaceDescriptors().withAgeAndGender().withFaceExpressions()
        // console.log(faceAIData)
        // we have a ton of good facial detection data in faceAIData
        // faceAIData is an array, one element for each face
        
        // draw on our face/canvas
        // first,  clear the canvas
        canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height)
        // draw our bounding box
        faceAIData = faceapi.resizeResults(faceAIData,videoFeedE1)
        faceapi.draw.drawDetections(canvas,faceAIData)
        faceapi.draw.drawFaceLandmarks(canvas,faceAIData)
        faceapi.draw.drawFaceExpressions(canvas,faceAIData)
        
        //ask AI to guess age and gender with confidence level
        faceAIData.forEach(face=>{
            const { age, gender, genderProbability, detection, descriptor } = face
            const genderText = `${gender} - ${Math.round(genderProbability*100)/100}`
            const ageText = `${Math.round(age)} years`
            const textField = new faceapi.draw.DrawTextField([genderText,ageText],face.detection.box.topRight)
            textField.draw(canvas)

            let label = faceMatcher.findBestMatch(descriptor).toString()
            // console.log(label)
            let options = {label:"Miahlyn"}
            if(label.includes("unknown")){
                options = {label:"Unknown subject"}
            }

            const drawBox = new faceapi.draw.DrawBox(detection.box, options)
            drawBox.draw(canvas)
        })
    },600)

}

run()