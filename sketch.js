let x_vals = [];
let y_vals = [];

let coeffs = [];

let learningRate = 0.1;
let optimizer = tf.train.sgd(learningRate);

let coeffSlider;
let coeffP;
let learnSlider;
let learnP;

let canvas;

let dragging = false;

const PARENT_INTERACTION_ID = "interaction";

function setup() {
  let canvasCont = select("#canvas-cont");
  canvas = createCanvas(canvasCont.width - 10, canvasCont.width - 10);
  canvas.parent("canvas-cont");
  canvas.id("canvas");

  canvas.mouseClicked(() => {
    dragging = false;
    addPoint()
  });
  canvas.mousePressed(dragged);
  canvas.mouseReleased(dragged);
  canvas.mouseOut(() => dragging = false);

  coeffP = select("#coeffP");
  coeffSlider = select("#coeffSlider");

  learnP = select("#learnP");
  learnSlider = select("#learnSlider");

  coeffs.push(tf.variable(tf.scalar(random(-1, 1))));

}

function addPoint() {
  let x = map(mouseX, 0, width, -1, 1);
  let y = map(mouseY, 0, height, 1, -1);
  x_vals.push(x);
  y_vals.push(y);
}

function updateCoeffs() {
  let numCoeffs = coeffSlider.value();
  if (coeffs.length < numCoeffs) {
    let differ = numCoeffs - coeffs.length;
    for (let i = 0; i < differ; i++) {
      coeffs.push(tf.variable(tf.scalar(random(-1, 1))));
    }
  } else {
    let differ = coeffs.length - numCoeffs;
    for (let i = 0; i < differ; i++) coeffs.pop();
  }
  coeffP.html("Order: " + coeffs.length);
}

function updateLearningRate() {
  learningRate = learnSlider.value();
  optimizer = tf.train.sgd(learningRate);
  learnP.html("Learning rate: " + learningRate);
}

function dragged() {
  dragging = !dragging;
}

function predict(input) {
  const xs = tf.tensor1d(input);
  // ax^n + bx^n-1 + cx^n-2 + ....
  let output = xs.pow(coeffs.length - 1).mul(coeffs[0]);
  for (let i = 1; i < coeffs.length; i++) {
    output = output.add(xs.pow(coeffs.length - 1 - i).mul(coeffs[i]));
  }
  return output;
}

function loss(pred, labels) {
  return pred.sub(labels).square().mean();
}

function reset() {
  x_vals = [];
  y_vals = [];
  let firstCoeff = coeffs[0];
  coeffs = [];
  coeffs[0] = firstCoeff;
  coeffP.html("Order: " + coeffs.length);
  coeffSlider.value(1);
  optimizer = tf.train.sgd(learningRate);
}

function draw() {
  if (dragging) {
    addPoint();
  } else {
    tf.tidy(() => {
      if (x_vals.length > 0) {
        const ys = tf.tensor1d(y_vals);
        optimizer.minimize(() => loss(predict(x_vals), ys))
      }
    });
  }

  background(0);
  drawGrid();
  drawPoints(x_vals, y_vals);
  drawFunc();
}

function drawPoints(iX, iY) {
  stroke(255);
  strokeWeight(4);
  for (let i = 0; i < iX.length; i++) {
    let x = map(iX[i], -1, 1, 0, width);
    let y = map(iY[i], -1, 1, height, 0);
    point(x, y);
  }
}

function drawFunc() {
  const curveX = [];
  for (let x = -1; x <= 1; x += 0.005) {
    curveX.push(x);
  }

  const ys = tf.tidy(() => predict(curveX));
  const curveY = ys.dataSync();
  ys.dispose();

  beginShape();
  noFill();
  stroke(255);
  strokeWeight(2);

  for (let i = 0; i < curveX.length; i++) {
    let x = map(curveX[i], -1, 1, 0, width);
    let y = map(curveY[i], -1, 1, height, 0);
    vertex(x, y);
  }

  endShape();
}

function drawGrid() {
  let div = 16;
  for (let i = width / div; i < width; i += width / div) {
    strokeWeight(i == width / 2 ? 3 : 1);
    stroke("rgba(255, 255, 255, 0.4)");
    line(i, 0, i, height);
    line(0, i, width, i);
  }
}