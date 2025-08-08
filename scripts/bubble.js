const container = document.getElementById("bubble-container");
const resetButton = document.getElementById("reset-bubbles");
const sizeSelect = document.getElementById("bubble-size");
const densitySelect = document.getElementById("bubble-density");
const soundCheckbox = document.getElementById("sound-enabled");

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playPop() {
  if (!soundCheckbox.checked) return;
  ensureAudio();
  const ctx = audioCtx;

  // A short pop sound: filtered noise + decay
  const duration = 0.08;
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    // white noise with exponential decay
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 5);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200 + Math.random() * 800;
  filter.Q.value = 8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.9, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start();
}

function bubbleEl() {
  const el = document.createElement("button");
  el.className = "bubble";
  el.setAttribute("aria-pressed", "false");
  el.addEventListener("pointerdown", () => {
    if (el.dataset.popped === "true") return;
    el.dataset.popped = "true";
    el.classList.add("popped");
    el.setAttribute("aria-pressed", "true");
    playPop();
  });
  return el;
}

function gridConfig() {
  const size = sizeSelect.value; // small, medium, large
  const density = densitySelect.value; // sparse, normal, dense

  const baseCols = size === "small" ? 20 : size === "large" ? 10 : 14;
  const baseRows = size === "small" ? 14 : size === "large" ? 8 : 10;

  let factor = 1;
  if (density === "sparse") factor = 0.8;
  if (density === "dense") factor = 1.3;

  const cols = Math.max(6, Math.round(baseCols * factor));
  const rows = Math.max(4, Math.round(baseRows * factor));

  return { cols, rows };
}

function renderGrid() {
  const { cols, rows } = gridConfig();
  container.innerHTML = "";
  container.style.setProperty("--cols", String(cols));

  const total = cols * rows;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i += 1) {
    frag.appendChild(bubbleEl());
  }
  container.appendChild(frag);
}

resetButton.addEventListener("click", renderGrid);
sizeSelect.addEventListener("change", renderGrid);
densitySelect.addEventListener("change", renderGrid);

function init() {
  renderGrid();
}

init();