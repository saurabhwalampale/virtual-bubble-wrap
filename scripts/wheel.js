const canvas = document.getElementById("wheel-canvas");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spin-btn");
const resetRotationButton = document.getElementById("reset-rotation-btn");
const labelsInput = document.getElementById("labels-input");
const updateButton = document.getElementById("update-btn");
const shuffleButton = document.getElementById("shuffle-btn");
const showLabelsCheckbox = document.getElementById("show-labels");
const useRainbowCheckbox = document.getElementById("use-rainbow");
const resultEl = document.getElementById("result");

const TAU = Math.PI * 2;
let labels = [];
let currentRotation = 0; // radians
let spinning = false;

function parseLabelsInput() {
  return labelsInput.value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function colorForIndex(i, n) {
  if (useRainbowCheckbox.checked) {
    const hue = Math.round((i / n) * 360);
    return `hsl(${hue} 85% 55%)`;
    
  }
  // alternating indigo/slate
  return i % 2 === 0 ? "#6366f1" : "#334155";
}

function drawWheel() {
  const size = Math.min(canvas.width, canvas.height);
  const radius = size / 2 - 8;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (labels.length === 0) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "16px Poppins, system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.fillText("Add options to build the wheel", centerX, centerY);
    return;
  }

  const sliceAngle = TAU / labels.length;

  // draw slices
  for (let i = 0; i < labels.length; i += 1) {
    const startAngle = currentRotation + i * sliceAngle;
    const endAngle = startAngle + sliceAngle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(i, labels.length);
    ctx.fill();

    // border line
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (showLabelsCheckbox.checked) {
    // draw labels
    ctx.save();
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 16px Poppins, system-ui, -apple-system";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < labels.length; i += 1) {
      const angle = currentRotation + i * sliceAngle + sliceAngle / 2;
      const textX = centerX + Math.cos(angle) * (radius * 0.65);
      const textY = centerY + Math.sin(angle) * (radius * 0.65);
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(angle);
      const text = labels[i];
      // trim long labels
      const maxLen = 18;
      const finalText = text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
      ctx.fillText(finalText, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  // outer ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, TAU);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 6;
  ctx.stroke();
}

function getWinningIndex() {
  // The pointer is at angle -90deg (upwards). Translate currentRotation accordingly.
  const sliceAngle = TAU / labels.length;
  let normalized = (TAU - (currentRotation % TAU)) % TAU; // 0 at +x axis, increasing CCW
  // Adjust so that 0 is at -90deg
  normalized = (normalized + TAU / 4) % TAU;
  const index = Math.floor(normalized / sliceAngle) % labels.length;
  return index;
}

function announceWinner(index) {
  const winner = labels[index];
  resultEl.textContent = `Result: ${winner}`;
  if (window.confetti) {
    const rect = canvas.getBoundingClientRect();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { x: 0.5, y: (rect.top + rect.height * 0.3) / window.innerHeight },
      colors: ["#a78bfa", "#60a5fa", "#34d399", "#f472b6", "#f59e0b"],
    });
  }
}

function spinWheel() {
  if (spinning || labels.length === 0) return;
  spinning = true;
  resultEl.textContent = "";

  const extraSpins = 4 + Math.floor(Math.random() * 3); // 4-6 spins
  const targetSliceIndex = Math.floor(Math.random() * labels.length);
  const sliceAngle = TAU / labels.length;
  const pointerAngle = -Math.PI / 2; // up
  const targetAngle = TAU * extraSpins + (TAU - (targetSliceIndex * sliceAngle + sliceAngle / 2) + pointerAngle);

  const durationMs = 3400 + Math.random() * 800;
  const start = performance.now();
  const startRotation = currentRotation;
  const finalRotation = startRotation + targetAngle;

  function tick(now) {
    const t = Math.min(1, (now - start) / durationMs);
    const eased = easeOutCubic(t);
    currentRotation = lerp(startRotation, finalRotation, eased);
    drawWheel();

    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      spinning = false;
      // Normalize rotation to keep numbers small
      currentRotation = currentRotation % TAU;
      const winIndex = getWinningIndex();
      announceWinner(winIndex);
    }
  }

  requestAnimationFrame(tick);
}

function updateFromInput() {
  labels = parseLabelsInput();
  if (labels.length === 0) {
    resultEl.textContent = "";
  }
  drawWheel();
}

function resetRotation() {
  if (spinning) return;
  currentRotation = 0;
  drawWheel();
  resultEl.textContent = "";
}

function init() {
  labels = parseLabelsInput();
  drawWheel();

  window.addEventListener("resize", drawWheel);
  spinButton.addEventListener("click", spinWheel);
  resetRotationButton.addEventListener("click", resetRotation);
  updateButton.addEventListener("click", updateFromInput);
  shuffleButton.addEventListener("click", () => {
    labels = parseLabelsInput();
    shuffleArray(labels);
    labelsInput.value = labels.join(", ");
    drawWheel();
  });
  showLabelsCheckbox.addEventListener("change", drawWheel);
  useRainbowCheckbox.addEventListener("change", drawWheel);
}

init();