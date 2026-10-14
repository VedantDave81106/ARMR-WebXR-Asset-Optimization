# Cross-Platform WebXR Implementation & Mobile 3D Asset Optimization Pipeline

[![ARMR Assignment 1](https://img.shields.io/badge/Course-ARMR%20(DJS23ALH1501)-0284c7.svg)](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization)
[![WebXR](https://img.shields.io/badge/WebXR-AR.js%20%7C%20A--Frame-00f3ff.svg)](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization)
[![Optimization](https://img.shields.io/badge/3D%20Optimization-97.8%25%20Decimated-00ff88.svg)](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Dwarkadas J. Sanghvi College of Engineering**  
> **Department of Artificial Intelligence and Machine Learning**  
> **B.Tech. Sem: V | Subject: Augmented Reality and Mixed Reality (DJS23ALH1501)**  
> **Assignment 1:** Cross-Platform WebXR Implementation & Mobile 3D Asset Optimization Pipeline  
> **Student:** Vedant Dave (`VedantDave81106`)

---

## 🌐 Live WebXR Demonstration URL

🔗 **Live Public WebXR URL:** [https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/](https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/)  
*(Hosted via GitHub Pages with HTTPS for WebRTC camera stream access)*

📄 **Printable Marker Sheet:** [https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/marker_sheet.html](https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/marker_sheet.html)

### 📸 Live Augmented Reality Demonstration
![Live WebXR Marker Anchoring Output](OUTPUT.png)
*Figure 1: Real-time 3D Cyber Recon Drone anchored to the Hiro marker target via web camera stream with holographic reticle and interactive HUD telemetry.*

---

## 📑 Required Deliverables Index

| Deliverable | Description | File Path / Link |
| :--- | :--- | :--- |
| **Deliverable 1** | **2–3 Page Technical Survey & Asset Optimization Report** | [docs/REPORT.md](docs/REPORT.md) & [report.html (Print to PDF)](report.html) |
| **Deliverable 2** | **Final Optimized `.glb` 3D Asset** | [assets/model_optimized.glb](assets/model_optimized.glb) & [assets/model_draco.glb](assets/model_draco.glb) |
| **Deliverable 3** | **Live Public WebXR URL & Source Code Repository** | [GitHub Repository](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization) |
| **Supplemental** | **Blender Decimate & Texture Baking Step-by-Step Guide** | [docs/blender_workflow.md](docs/blender_workflow.md) |
| **Supplemental** | **Target Tracking Marker Image (Hiro)** | [hiro.png](hiro.png) & [marker_sheet.html](marker_sheet.html) |

---

## 🚀 Key Project Features

1. **App-less WebXR Delivery:**
   - Pure browser-based AR running on **AR.js (v3.4.5)** and **A-Frame (v1.4.2)** on top of **Three.js**.
   - Zero app store download required; runs instantly on iOS Safari, Android Chrome, and desktop webcams via WebRTC `getUserMedia()`.

2. **Real-Time Marker Tracking & Reaction Mechanics:**
   - **Target Lock-on:** Detects standard Hiro marker pattern and immediately fires `markerFound` event.
   - **Audio-Visual Feedback:** Procedural lock-on sonar ping generated via the Web Audio API (no external sound file dependencies), and illuminated holographic reticle on the marker plane.
   - **Dynamic Drone Animation:** Hovering vertical levitation ($y(t) = y_0 + A \sin(\omega t)$) and rotational surveillance yaw.
   - **Interactive Energy Shockwave Reaction:** Tapping the screen or clicking **"⚡ Trigger Drone Reaction"** triggers an expanding holographic shockwave sphere, rotor speed overdrive ($8\times$), emissive color flash, and acoustic pulse.

3. **In-App Asset Benchmarking & Wireframe Inspection:**
   - **Real-Time Switcher:** Toggle between **Optimized Decimated Model** (2,504 tris | 2 draw calls | 51 KB) and **High-Poly Baseline Model** (116,744 tris | 10 draw calls | 2.95 MB) live in AR.
   - **Wireframe Mode:** Toggle mesh wireframe on/off to visually inspect the low-poly topology and Quadric Error Metric decimation directly in the mobile camera viewport.

4. **Zero-Print Testing (On-Screen Marker Modal):**
   - Click **"🎯 Show Marker"** to display the Hiro marker right on your laptop screen. Simply point your mobile phone camera at your monitor to test instantly without needing a physical printer!

---

## 📊 Quantitative 3D Asset Optimization Benchmarks (Part B)

The 3D asset (*Cyber Reconnaissance Drone CRD-07*) was optimized using Quadric Error Metric (QEM) edge collapse decimation, draw call consolidation, normal vector baking, and Draco entropy compression.

| Quantitative Metric | Baseline High-Poly | Decimated Optimized | Draco Compressed | Overall Reduction (%) |
| :--- | :--- | :--- | :--- | :--- |
| **Triangle Count** | **116,744** | **2,504** | 2,504 | **-97.86%** |
| **Vertex Count** | 65,760 | 2,138 | 2,138 | **-96.75%** |
| **Draw Calls** | 10 calls | 2 calls | 2 calls | **-80.00%** |
| **Binary File Size** | 2,950 KB (2.95 MB) | 49.0 KB (0.049 MB) | **15.8 KB (0.015 MB)** | **-99.49%** |
| **3G Network Load (750 kbps)** | ~31.4 seconds | ~0.52 seconds | **~0.17 seconds** | **99.4% faster** |
| **4G LTE Load (15 Mbps)** | ~1.57 seconds | ~0.026 seconds | **~0.008 seconds** | **Instantaneous** |
| **GPU VRAM Buffer Allocation** | ~14.2 MB | ~0.42 MB | ~0.42 MB | **-97.04%** |
| **Mobile Framerate (iPhone / Galaxy)** | 44–58 FPS (Stutter) | **60 FPS (Rock-solid)** | **60 FPS (Rock-solid)** | **Smooth 60 FPS** |

*Full optimization metrics stored in [`assets/model_metrics.json`](assets/model_metrics.json).*

---

## 📂 Project Repository Structure

```
ARMR_SLA_1/
├── index.html                  # Main WebXR AR application with HUD & A-Frame scene
├── style.css                   # Glassmorphic sci-fi HUD overlay styling
├── app.js                      # Application logic, audio synthesis, telemetry & reactions
├── hiro.png                    # High-contrast Hiro tracking target image
├── marker.png                  # Alternate marker target
├── marker_sheet.html           # Printable A4 marker sheet with testing instructions
├── package.json                # Project dependencies and build scripts
├── assets/
│   ├── model_optimized.glb     # Primary decimated 3D model (2,504 tris, 51 KB)
│   ├── model_draco.glb         # Draco-compressed variant (15.8 KB)
│   ├── model_highpoly.glb      # High-poly benchmark baseline (116,744 tris, 2.95 MB)
│   ├── model_metrics.json      # Quantitative benchmark metrics database
│   └── patt.hiro               # Trained ARToolKit Hiro pattern file
├── scripts/
│   ├── generate_models.mjs     # Procedural 3D model generator & Draco compressor
│   └── generate_marker.mjs     # Hiro marker SVG generator
└── docs/
    ├── REPORT.md               # 2-3 page comprehensive academic technical report
    ├── report.html             # Print-ready 3-page IEEE-style paper (Print -> Save as PDF)
    └── blender_workflow.md     # Step-by-step Blender Decimate & Normal Bake tutorial
```

---

## 🛠️ Step-by-Step GitHub Setup & Deployment Guide

Follow these exact steps to push this project to your GitHub account and make the live WebXR link active on GitHub Pages:

### Step 1: Create a New GitHub Repository
1. Open your browser and go to: [https://github.com/new](https://github.com/new)
2. Log in with your account: `VedantDave81106`
3. Repository Name: `ARMR-WebXR-Asset-Optimization`
4. Description: `Cross-Platform WebXR Implementation & Mobile 3D Asset Optimization Pipeline | ARMR Assignment 1`
5. Select **Public**.
6. **Do NOT** initialize with a README, .gitignore, or license (they are already included here).
7. Click **Create repository**.

### Step 2: Push the Local Repository to GitHub
In your terminal (PowerShell), execute the following commands:

```powershell
# 1. Initialize git (if not already initialized)
git init

# 2. Add all files to staging
git add .

# 3. Create the initial commit
git commit -m "feat: complete WebXR marker AR implementation, 3D decimation pipeline, and academic report"

# 4. Set main branch
git branch -M main

# 5. Link your remote repository
git remote add origin https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization.git

# 6. Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages (Instant 1-Click Hosting)
1. On your GitHub repository page, click **Settings** (top right tab).
2. In the left sidebar, click **Pages**.
3. Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
4. Under **Branch**, select `main` and folder `/ (root)`.
5. Click **Save**.
6. Within 1–2 minutes, your live URL will be active at:  
   👉 **`https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/`**

---

## 📱 How to Test the Augmented Reality Experience

### Option A: Using Your Phone + Laptop Screen (Zero Printing!)
1. Open [`marker_sheet.html`](marker_sheet.html) or [`hiro.png`](hiro.png) on your laptop screen.
2. On your mobile phone (iPhone Safari or Android Chrome), open your live URL:  
   `https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/`
3. Tap **"Allow"** when prompted for camera access.
4. Point your phone camera at the Hiro marker on your laptop screen (from ~25–40 cm distance).
5. The 3D Cyber Recon Drone will immediately pop up hovering above the marker!
6. Tap the screen or press **"⚡ Trigger Drone Reaction"** to see the energy shockwave and rotor overdrive!
7. Tap **"🔄 Model: Low-Poly"** to switch to the High-Poly baseline and see the live FPS telemetry comparison!

### Option B: Printing the Marker Sheet
1. Open [`marker_sheet.html`](marker_sheet.html) and click **"🖨️ Print Marker Sheet (A4)"**.
2. Place the printed sheet on your desk.
3. Open the live URL on your mobile phone and point your camera at the sheet.

---

## 🎓 Academic Submission Details

- **College:** Dwarkadas J. Sanghvi College of Engineering
- **Department:** Artificial Intelligence and Machine Learning
- **Semester:** B.Tech. Semester V
- **Subject:** Augmented Reality and Mixed Reality (`DJS23ALH1501`)
- **Assignment:** Assignment 1 (Cross-Platform WebXR Implementation & Mobile 3D Asset Optimization Pipeline)
- **Target Course Outcomes:** CO1, CO2
- **Mapped POs/PSOs:** PO1, PO3, PO5, PO11 | PSO 2
