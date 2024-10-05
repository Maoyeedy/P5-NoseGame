let video
let poseNet
let poses = []
let pg
let noseX = 0 // Initialize nose positions
let noseY = 0
let pNoseX = 0 // Initialize previous nose positions
let pNoseY = 0

// Settings
let enableHorizontalMirror = true
let hasReachedStartingPoint = false
let pauseGame = false
let isModelLoaded = false

// Starting
const circleDiameter = 40
let circleX = 160
let circleY

// Squares
let score = 0
let squares = []
const squareSpeed = 3
const squareWidth = 40
const squareInterval = 45

// Nose Point
let noseHue = 210
let noseSaturation = 100
let noseLightness = 50
let noseStrokeWeight = 6

// Assets
let scoreSFX
let music

function preload () {
  soundFormats('mp3')
  music = loadSound('./assets/music.mp3')
  scoreSFX = loadSound('./assets/SFXmistake.mp3')
  // scoreSFX = loadSound('./assets/SFXfinish.mp3')
  music.setVolume(0.25)
  scoreSFX.setVolume(1)
}
function setup () {
  cvs = createCanvas(640, 480)

  video = createCapture(VIDEO)
  video.size(width, height)

  pixelDensity(1)
  pg = createGraphics(width, height)

  // Initialize circleY based on height
  circleY = height / 2

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, onModelLoaded)
  poseNet.on('pose', function (results) {
    poses = results
  })

  // Hide the video element, and just show the canvas
  video.hide()
}

function draw () {
  if (!isModelLoaded) return

  if (pauseGame) {
    background(255)
    image(pg, 0, 0, width, height)
    return
  }

  if (enableHorizontalMirror) {
    push()
    scale(-1, 1)
    image(video, -width, 0, width, height)
    pop()
  } else {
    image(video, 0, 0, width, height)
  }

  image(pg, 0, 0, width, height)

  if (!hasReachedStartingPoint)
    drawStartingCircle()
  else
    drawSquares()

  drawKeypoints()
  handlePos()
  drawText()
}


function handlePos () {
  // Check distance to the circle
  if (!hasReachedStartingPoint) checkCircle()
  else checkSquares()

  function checkCircle () {
    let d = dist(noseX, noseY, circleX, circleY)
    if (d < circleDiameter / 2) {
      hasReachedStartingPoint = true
      // scoreSFX.play()
      if (!music.isPlaying()) music.loop()
    }
  }

  function checkSquares () {
    for (let i = squares.length - 1; i >= 0; i--) {
      let square = squares[i]
      let distToSquare = dist(noseX, noseY, square.x + square.width / 2, square.y + square.width / 2)

      if (distToSquare < square.width / 2) {
        squares.splice(i, 1) // Remove square
        score++
        scoreSFX.play()
      }
    }
  }
}

function drawText () {
  let scoreElement = select('#score')
  if (scoreElement) {
    scoreElement.html('Score: ' + score)
  }
}

function drawStartingCircle () {
  noFill()
  stroke(255)
  push()
  strokeWeight(4)
  ellipse(circleX, circleY, circleDiameter, circleDiameter)
  pop()

  // push()
  // strokeWeight(1)
  // fill(255)
  // textAlign(CENTER)
  // textSize(16)
  // text("Come here to start", circleX, circleY - circleDiameter)
  // pop()
}

function drawKeypoints () {
  noseHue = (noseHue + 1) % 360 // Cycle hue between 0-360
  let [r, g, b] = hslToRgb(noseHue, noseSaturation, noseLightness)

  for (let i = 0; i < min(poses.length, 1); i++) {
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j]
      if (keypoint.score > 0.2) {
        if (j == 0) { // We only care about the nose keypoint
          if (!enableHorizontalMirror) {
            noseX = keypoint.position.x
            noseY = keypoint.position.y
          } else {
            noseX = width - keypoint.position.x
            noseY = keypoint.position.y
          }

          pg.stroke(r, g, b)
          pg.strokeWeight(noseStrokeWeight)

          if (pNoseX !== 0 && pNoseY !== 0) {
            pg.line(noseX, noseY, pNoseX, pNoseY)
          }
          pNoseX = noseX
          pNoseY = noseY
        }
      }
    }
  }
}

function keyPressed () {
  if (key === 's') {
    saveCanvas(cvs, 'output', 'png')
    // if (pauseGame) togglePause()
  }

  if (key === ' ') {
    togglePause()
  }

  if (key === 'm') {
    enableHorizontalMirror = !enableHorizontalMirror
  }

  // - and + to adjust nose stroke weight
  if (key === '-' && noseStrokeWeight > 1) {
    noseStrokeWeight--
  }

  if (key === '=' && noseStrokeWeight < 10) {
    noseStrokeWeight++
  }
}

function togglePause () {
  if (pauseGame) {
    ResetGame()
    pauseGame = false
  }
  else {
    pauseGame = true
  }
}

function ResetGame () {
  score = 0
  hasReachedStartingPoint = false

  // Reset squares
  squares = []

  // Reset nose
  noseX = 0
  noseY = 0
  pNoseX = 0
  pNoseY = 0

  pg.clear()
}

function onModelLoaded () {
  console.log('Model loaded!')
  isModelLoaded = true

  // for html #score and #keymap, rm class .hide, add class .show
  let scoreElement = select('#score')
  if (scoreElement) {
    scoreElement.class('show')
  }

  let keymapElement = select('#keymap')
  if (keymapElement) {
    keymapElement.class('show')
  }

  let loaddingElement = select('#loading')
  if (loaddingElement) {
    loaddingElement.class('hide')
  }
}
class Square {
  constructor (x, y, w) {
    this.x = x
    this.y = y
    this.width = w
  }

  update () {
    this.x -= squareSpeed
  }

  display () {
    fill(255)
    noStroke()
    rect(this.x, this.y, this.width, this.width)
  }
}

function instantiateSquare () {
  if (frameCount % squareInterval === 0) {
    squares.push(new Square(width, random(height - squareWidth), squareWidth))
  }
}

function drawSquares () {
  instantiateSquare()

  for (let i = squares.length - 1; i >= 0; i--) {
    squares[i].update()
    squares[i].display()

    if (squares[i].x < -squareWidth) {
      squares.splice(i, 1)
    }
  }
}
