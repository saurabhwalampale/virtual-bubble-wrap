const container = document.getElementById("bubble-container");
const resetButton = document.getElementById("reset-bubbles");
const sizeSelect = document.getElementById("bubble-size");
const densitySelect = document.getElementById("bubble-density");
const soundCheckbox = document.getElementById("sound-enabled");
const refillButton = document.getElementById("refill-popped");
const streakDisplay = document.getElementById("streak-display");
const totalDisplay = document.getElementById("total-display");

let audioCtx = null;
let totalPoppedCount = 0;
let currentStreak = 0;

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function updateCounters(bumpStreak = false) {
  if (streakDisplay) {
    streakDisplay.textContent = `Streak: ${currentStreak}`;
    if (bumpStreak) {
      streakDisplay.classList.remove('counter-bump');
      void streakDisplay.offsetWidth;
      streakDisplay.classList.add('counter-bump');
    }
  }
  if (totalDisplay) {
    totalDisplay.textContent = `Popped: ${totalPoppedCount}`;
  }
}

function playPop(el) {
  if (!soundCheckbox.checked) return;
  ensureAudio();
  const ctx = audioCtx;

  // Compute stereo pan from bubble position
  let panNode = null;
  const supportsPan = typeof ctx.createStereoPanner === "function";
  if (supportsPan) {
    panNode = ctx.createStereoPanner();
    const rect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const relX = (centerX - containerRect.left) / containerRect.width; // 0..1
    const pan = Math.max(-1, Math.min(1, relX * 2 - 1));
    panNode.pan.value = pan;
  }

  // Noise burst
  const duration = 0.09 + Math.random() * 0.03;
  const sampleRate = ctx.sampleRate;
  const bufferSize = Math.floor(duration * sampleRate);
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const t = i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 5);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1100 + Math.random() * 900;
  filter.Q.value = 7 + Math.random() * 3;

  // Click transient (sine blip)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 320 + Math.random() * 120;
  const oscGain = ctx.createGain();
  oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const master = ctx.createGain();
  master.gain.value = 0.9;

  // Chain
  if (panNode) {
    noise.connect(filter).connect(panNode);
    osc.connect(oscGain).connect(panNode);
    panNode.connect(master).connect(ctx.destination);
  } else {
    noise.connect(filter).connect(master);
    osc.connect(oscGain).connect(master);
    master.connect(ctx.destination);
  }

  // Envelopes
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(1.0, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  // Start
  noise.start();
  osc.start();
  noise.stop(ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration);
}

function hapticPop() {
  if ("vibrate" in navigator) {
    try { navigator.vibrate(10); } catch (_) {}
  }
}

function markPopped(el) {
  if (el.dataset.popped === "true") return false;
  el.dataset.popped = "true";
  el.classList.add("popping");
  el.classList.add("popped");
  el.setAttribute("aria-pressed", "true");
  // Clean up animation class
  setTimeout(() => el.classList.remove("popping"), 160);
  return true;
}

function bubbleEl() {
  const el = document.createElement("button");
  el.className = "bubble";
  el.setAttribute("aria-pressed", "false");
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

resetButton.addEventListener("click", () => {
  renderGrid();
  totalPoppedCount = 0;
  currentStreak = 0;
  updateCounters();
});
sizeSelect.addEventListener("change", renderGrid);
densitySelect.addEventListener("change", renderGrid);

refillButton.addEventListener("click", () => {
  const popped = container.querySelectorAll('.bubble.popped');
  popped.forEach((el) => {
    el.classList.remove('popped', 'popping');
    el.dataset.popped = 'false';
    el.setAttribute('aria-pressed', 'false');
  });
});

// Drag-to-pop interactions via event delegation
let isPointerDown = false;
let activePointerId = null;

function tryPopFromEvent(ev) {
  const target = ev.target;
  if (!target || !(target instanceof Element)) return;
  const bubble = target.closest(".bubble");
  if (!bubble) return;
  if (markPopped(bubble)) {
    currentStreak += 1;
    totalPoppedCount += 1;
    updateCounters(true);
    playPop(bubble);
    hapticPop();
  }
}

container.addEventListener("pointerdown", (ev) => {
  isPointerDown = true;
  activePointerId = ev.pointerId;
  container.setPointerCapture?.(activePointerId);
  currentStreak = 0;
  updateCounters();
  tryPopFromEvent(ev);
});

container.addEventListener("pointermove", (ev) => {
  if (!isPointerDown) return;
  tryPopFromEvent(ev);
});

function endPointer() {
  isPointerDown = false;
  if (activePointerId != null) {
    try { container.releasePointerCapture?.(activePointerId); } catch (_) {}
  }
  activePointerId = null;
  if (currentStreak !== 0) {
    currentStreak = 0;
    updateCounters();
  }
}

container.addEventListener("pointerup", endPointer);
container.addEventListener("pointercancel", endPointer);

function init() {
  renderGrid();
}

init();