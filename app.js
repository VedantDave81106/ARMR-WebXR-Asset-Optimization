/**
 * WebXR AR Application Logic
 * Department of AI & ML - Dwarkadas J. Sanghvi College of Engineering
 * Course: Augmented Reality and Mixed Reality (DJS23ALH1501)
 */

// Model performance database
const MODEL_CONFIGS = {
  optimized: {
    name: "Optimized Decimated",
    path: "assets/model_optimized.glb",
    triangles: 2504,
    drawCalls: 2,
    fileSize: "51.3 KB",
    scale: "0.45 0.45 0.45"
  },
  highpoly: {
    name: "High-Poly Baseline",
    path: "assets/model_highpoly.glb",
    triangles: 116744,
    drawCalls: 10,
    fileSize: "2.95 MB",
    scale: "0.45 0.45 0.45"
  }
};

let currentModelKey = "optimized";
let isWireframeActive = false;
let isMarkerTracked = false;
let audioCtx = null;

// Initialize Web Audio API Synthesizer (Zero external audio files required)
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// Sound FX: Target Lock Beep
function playLockSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn("Audio play error", e);
  }
}

// Sound FX: Reaction Blast / Shockwave
function playReactionSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.warn("Audio play error", e);
  }
}

// Sound FX: Switch Mode Ping
function playSwitchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.warn("Audio play error", e);
  }
}

// DOM Elements
const statusPill = document.getElementById("status-pill");
const statusText = document.getElementById("status-text");
const scanGuidance = document.getElementById("scan-guidance");
const valFps = document.getElementById("val-fps");
const valModel = document.getElementById("val-model");
const valTris = document.getElementById("val-tris");
const valDrawCalls = document.getElementById("val-drawcalls");
const valSize = document.getElementById("val-size");
const droneModel = document.getElementById("drone-model");
const markerRing = document.getElementById("marker-ring");
const shockwaveSphere = document.getElementById("shockwave-sphere");
const btnReaction = document.getElementById("btn-react");
const btnSwitchModel = document.getElementById("btn-switch-model");
const btnWireframe = document.getElementById("btn-wireframe");
const btnShowMarker = document.getElementById("btn-show-marker");
const btnCloseModal = document.getElementById("btn-close-modal");
const markerModal = document.getElementById("marker-modal");

// Live FPS telemetry counter
let frameCount = 0;
let lastTime = performance.now();
function updateFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime));
    if (valFps) valFps.textContent = fps;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
}
requestAnimationFrame(updateFPS);

// Setup AR.js Marker Event Listeners
window.addEventListener("DOMContentLoaded", () => {
  const marker = document.querySelector("#hiro-marker");

  if (marker) {
    marker.addEventListener("markerFound", () => {
      isMarkerTracked = true;
      if (statusPill) {
        statusPill.className = "status-pill locked interactive";
        statusText.textContent = "TARGET ANCHORED (LOCKED)";
      }
      if (scanGuidance) {
        scanGuidance.classList.add("hidden");
      }
      if (markerRing) {
        markerRing.setAttribute("visible", "true");
      }
      playLockSound();
      console.log("Marker Found: Drone Activated");
    });

    marker.addEventListener("markerLost", () => {
      isMarkerTracked = false;
      if (statusPill) {
        statusPill.className = "status-pill searching interactive";
        statusText.textContent = "SCANNING FOR HIRO MARKER...";
      }
      if (scanGuidance) {
        scanGuidance.classList.remove("hidden");
      }
      if (markerRing) {
        markerRing.setAttribute("visible", "false");
      }
      console.log("Marker Lost: Searching...");
    });
  }

  // Model Wireframe handler helper
  if (droneModel) {
    droneModel.addEventListener("model-loaded", () => {
      console.log("Model loaded successfully into scene");
      applyWireframeState();
    });
  }
});

// Model Hovering & Rotation Component Registration
AFRAME.registerComponent("drone-hover", {
  init: function () {
    this.initialY = 0.35;
    this.time = 0;
    this.spinSpeed = 1.0;
    this.targetSpinSpeed = 1.0;
  },
  tick: function (t, dt) {
    if (!dt) return;
    this.time += dt * 0.002;

    // Hover bobbing
    const yOffset = Math.sin(this.time * 2.5) * 0.08;
    this.el.object3D.position.y = this.initialY + yOffset;

    // Drone orientation gentle sway
    this.el.object3D.rotation.z = Math.sin(this.time * 1.5) * 0.05;
    this.el.object3D.rotation.x = Math.cos(this.time * 1.2) * 0.04;

    // Smooth return of spin speed
    this.spinSpeed += (this.targetSpinSpeed - this.spinSpeed) * 0.08;
    this.el.object3D.rotation.y += (dt * 0.001) * this.spinSpeed;
  },
  boostSpin: function () {
    this.spinSpeed = 8.0;
    this.targetSpinSpeed = 1.0;
  }
});

// Interactive Reaction Trigger
function triggerDroneReaction() {
  playReactionSound();

  // Visual button pulse
  if (btnReaction) {
    btnReaction.classList.add("pulsing");
    setTimeout(() => btnReaction.classList.remove("pulsing"), 500);
  }

  // Accelerate drone rotor spin
  const hoverComp = droneModel.components["drone-hover"];
  if (hoverComp) {
    hoverComp.boostSpin();
  }

  // Expand and animate holographic energy shield shockwave
  if (shockwaveSphere) {
    shockwaveSphere.setAttribute("visible", "true");
    shockwaveSphere.setAttribute("scale", "0.2 0.2 0.2");
    shockwaveSphere.setAttribute("material", "opacity: 0.8; color: #00f3ff;");

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.08;
      const s = 0.2 + progress * 1.6;
      shockwaveSphere.setAttribute("scale", `${s} ${s} ${s}`);
      const opacity = Math.max(0, 0.8 - progress * 0.8);
      shockwaveSphere.setAttribute("material", `opacity: ${opacity}; color: #ff0055;`);

      if (progress >= 1.0) {
        clearInterval(interval);
        shockwaveSphere.setAttribute("visible", "false");
      }
    }, 25);
  }

  console.log("Reaction triggered: Energy pulse dispatched!");
}

// Switch between Optimized Low-Poly and High-Poly Benchmark models
function switchModel() {
  playSwitchSound();
  currentModelKey = currentModelKey === "optimized" ? "highpoly" : "optimized";
  const cfg = MODEL_CONFIGS[currentModelKey];

  // Update Telemetry Display
  if (valModel) valModel.textContent = cfg.name;
  if (valTris) valTris.textContent = cfg.triangles.toLocaleString() + " tris";
  if (valDrawCalls) valDrawCalls.textContent = cfg.drawCalls;
  if (valSize) valSize.textContent = cfg.fileSize;

  // Swap 3D model asset in A-Frame
  if (droneModel) {
    droneModel.setAttribute("gltf-model", cfg.path);
    droneModel.setAttribute("scale", cfg.scale);
  }

  if (btnSwitchModel) {
    btnSwitchModel.textContent = currentModelKey === "optimized" ? "🔄 Low-Poly" : "🔄 High-Poly";
  }

  console.log(`Switched 3D model to: ${cfg.name} (${cfg.triangles} tris)`);
}

// Toggle Wireframe inspection mode across all sub-meshes
function toggleWireframe() {
  playSwitchSound();
  isWireframeActive = !isWireframeActive;

  if (btnWireframe) {
    btnWireframe.classList.toggle("active", isWireframeActive);
    btnWireframe.textContent = isWireframeActive ? "🔲 Wire: ON" : "🔲 Wireframe";
  }

  applyWireframeState();
  console.log("Wireframe inspection mode:", isWireframeActive);
}

function applyWireframeState() {
  if (!droneModel || !droneModel.object3D) return;
  droneModel.object3D.traverse((child) => {
    if (child.isMesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.wireframe = isWireframeActive);
      } else {
        child.material.wireframe = isWireframeActive;
      }
    }
  });
}

// Event Listeners for UI
if (btnReaction) {
  btnReaction.addEventListener("click", triggerDroneReaction);
  btnReaction.addEventListener("touchstart", (e) => {
    e.preventDefault();
    triggerDroneReaction();
  });
}

if (btnSwitchModel) {
  btnSwitchModel.addEventListener("click", switchModel);
}

if (btnWireframe) {
  btnWireframe.addEventListener("click", toggleWireframe);
}

// Show Marker Modal handlers
if (btnShowMarker) {
  btnShowMarker.addEventListener("click", () => {
    if (markerModal) markerModal.classList.add("open");
  });
}

if (btnCloseModal) {
  btnCloseModal.addEventListener("click", () => {
    if (markerModal) markerModal.classList.remove("open");
  });
}

// Close modal when clicking outside dialog
if (markerModal) {
  markerModal.addEventListener("click", (e) => {
    if (e.target === markerModal) {
      markerModal.classList.remove("open");
    }
  });
}

// Clean View Mode (hides all buttons for unobstructed recording/screenshots)
const btnCleanView = document.getElementById("btn-clean-view");
const arHud = document.getElementById("ar-hud");

if (btnCleanView && arHud) {
  btnCleanView.addEventListener("click", () => {
    arHud.classList.add("clean-hidden");
  });
}

// Tap screen to trigger reaction or restore hidden HUD
window.addEventListener("click", (e) => {
  if (arHud && arHud.classList.contains("clean-hidden")) {
    arHud.classList.remove("clean-hidden");
    return;
  }
  if (e.target.closest(".interactive") || e.target.closest("button") || e.target.closest(".modal-dialog")) {
    return;
  }
  if (isMarkerTracked) {
    triggerDroneReaction();
  }
});

// Flip Mirror Feature (Ideal for desktop/laptop webcams)
const btnFlipCamera = document.getElementById("btn-flip-camera");
let isCameraMirrored = false;

function toggleCameraMirror() {
  playSwitchSound();
  isCameraMirrored = !isCameraMirrored;
  const video = document.querySelector("video") || document.getElementById("arjs-video");
  if (video) {
    video.style.transform = isCameraMirrored ? "scaleX(-1)" : "none";
  }
  if (btnFlipCamera) {
    btnFlipCamera.classList.toggle("active", isCameraMirrored);
    btnFlipCamera.textContent = isCameraMirrored ? "🪞 Mirror: ON" : "🪞 Mirror: OFF";
  }
  console.log("Webcam mirror toggled:", isCameraMirrored);
}

if (btnFlipCamera) {
  btnFlipCamera.addEventListener("click", toggleCameraMirror);
}

// Camera Permission & Stream Watchdog
const btnStartCamera = document.getElementById("btn-start-camera");

function checkAndEnforceVideoFeed() {
  const video = document.querySelector("video") || document.getElementById("arjs-video");
  if (video) {
    video.style.setProperty("position", "fixed", "important");
    video.style.setProperty("top", "0px", "important");
    video.style.setProperty("left", "0px", "important");
    video.style.setProperty("width", "100vw", "important");
    video.style.setProperty("height", "100vh", "important");
    video.style.setProperty("object-fit", "cover", "important");
    video.style.setProperty("z-index", "0", "important");
    video.style.setProperty("display", "block", "important");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.muted = true;

    if (isCameraMirrored) {
      video.style.transform = "scaleX(-1)";
    }

    if (video.paused) {
      video.play().catch(() => {
        if (btnStartCamera) btnStartCamera.style.display = "block";
      });
    } else if (btnStartCamera) {
      btnStartCamera.style.display = "none";
    }
  }
}

// Watch video element periodically
setInterval(checkAndEnforceVideoFeed, 500);

// If video stream is not active after 3 seconds, show permission helper button
setTimeout(() => {
  const video = document.querySelector("video") || document.getElementById("arjs-video");
  if (!video || video.paused || video.readyState < 2) {
    if (btnStartCamera) btnStartCamera.style.display = "block";
  }
}, 2500);

// Direct camera request when user clicks prompt
if (btnStartCamera) {
  btnStartCamera.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      const video = document.querySelector("video") || document.getElementById("arjs-video");
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      btnStartCamera.style.display = "none";
    } catch (err) {
      alert("Camera access was blocked by your browser.\n\nPlease click the lock / tune icon on the left of your URL bar, select 'Allow' for Camera, and refresh the page.");
    }
  });
}

