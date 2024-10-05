let video
let poseNet
let poses = []
let pg
let noseX = 0 // Initialize nose positions
let noseY = 0
let pNoseX = 0 // Initialize previous nose positions
let pNoseY = 0
let enableHorizontalMirror = false // Set to true for mirroring
let stopDrawingKeypoints = false // Control variable to stop drawing keypoints
let circleX = 160
let circleY // Will be initialized in setup
const circleRadius = 25 // Half of ellipse width (50 / 2)

function setup () {
  cvs = createCanvas(640, 480)
  video = createCapture(VIDEO)
  video.size(width, height)

  pixelDensity(1)
  pg = createGraphics(width, height)

  // Initialize circleY based on height
  circleY = height / 2

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady)
  poseNet.on('pose', function (results) {
    poses = results
  })

  // Hide the video element, and just show the canvas
  video.hide()
}

function draw () {
  if (enableHorizontalMirror) {
    push()
    scale(-1, 1)
    image(video, -width, 0, width, height)
    image(pg, -width, 0, width, height)
    pop()
  } else {
    image(video, 0, 0, width, height)
    image(pg, 0, 0, width, height)
  }

  drawCircleAndText()

  if (!stopDrawingKeypoints) {
    drawKeypoints()
  }

  drawDebugText() // Call the debug text function
}

function drawDebugText () {
  push()
  fill(255)
  textAlign(CENTER)
  textSize(16)
  text(`Nose Position: (${noseX.toFixed(2)}, ${noseY.toFixed(2)})`, width / 2, 30)
  text(`Circle Position: (${circleX}, ${circleY})`, width / 2, 50)
  pop()
}

function drawCircleAndText () {
  noFill()
  stroke(255)
  push()
  strokeWeight(4)
  ellipse(circleX, circleY, 50, 50) // Draw circle at left side
  pop()

  push()
  strokeWeight(1)
  fill(255)
  textAlign(CENTER)
  textSize(16)
  text("Come here to start", circleX, circleY - 40) // Draw text above the circle
  pop()
}

function drawKeypoints () {
  for (let i = 0; i < min(poses.length, 1); i++) {
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j]
      if (keypoint.score > 0.2) {
        if (j == 0) { // We only care about the nose keypoint
          noseX = keypoint.position.x
          noseY = keypoint.position.y

          // Check distance to the circle
          let d
          if (enableHorizontalMirror) {
            d = dist(width - noseX, noseY, circleX, circleY) // Adjust for mirrored video
          } else {
            d = dist(noseX, noseY, circleX, circleY)
          }
          if (d < circleRadius) {
            stopDrawingKeypoints = true // Stop drawing keypoints if within radius
            console.log('reached circle')
          }

          pg.stroke(230, 80, 0)
          pg.strokeWeight(5)
          // Draw line only if this is not the first detection
          if (pNoseX !== 0 && pNoseY !== 0) {
            pg.line(noseX, noseY, pNoseX, pNoseY)
          }
          pNoseX = noseX // Update previous nose positions
          pNoseY = noseY
        }
      }
    }
  }
}

function keyPressed () {
  pg.clear()
  stopDrawingKeypoints = false // Reset drawing when key is pressed
}

function modelReady () {
  select('#status').html('model Loaded')
}
