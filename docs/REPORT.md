# Shri Vile Parle Kelavani Mandal's
## DWARKADAS J. SANGHVI COLLEGE OF ENGINEERING
### (Empowered Autonomous College Affiliated to the University of Mumbai)
#### Department of Artificial Intelligence and Machine Learning
**B.Tech. Sem: V Subject: Augmented Reality and Mixed Reality (DJS23ALH1501)**  
### Assignment 1

**Student:** Vedant Dave (`VedantDave81106`) | **Semester:** V | **Target:** CO1, CO2  

---

### 1. Objective
- Design, optimize, and deploy a marker-based, app-less WebXR experience to understand cross-platform mobile AR delivery and real-time 3D asset performance constraints.

---

### 2. What We Made
- **App-less WebXR Delivery:** Pure browser-based AR running via AR.js, A-Frame, and WebGL with zero application installation.
- **Hiro Marker Tracking:** Tracks the standard black-and-white Hiro marker in real time using the device webcam.
- **Interactive 3D Drone:** Anchors a 3D Cyber Recon Drone directly on top of the marker with hovering rotation.
- **Procedural Audio:** Plays a lock-on sonar tone generated via browser Web Audio API upon marker detection.
- **Interactive Energy Reaction:** Clicking *⚡ React* triggers an expanding shockwave shield and an 8× rotor speed burst.
- **Real-time Telemetry:** In-app HUD shows real-time 60 FPS framerate, polygon count, and draw calls.

---

### 3. Part A — Architectural Trade-off Analysis (CO1)

| Evaluation Factor | Native AR (ARKit / ARCore) | Browser WebAR (AR.js / WebXR) |
| :--- | :--- | :--- |
| **User Onboarding** | High friction (App Store download, >100 MB) | **Zero Friction (Instant URL / QR Scan)** |
| **Cross-Platform Reach**| Platform-locked (ARKit=iOS, ARCore=Android) | **Universal (>95% of mobile & desktop browsers)** |
| **Tracking Method** | Hardware VIO + LiDAR / Depth sensors | Computer Vision Marker Tracking (Wasm ARToolKit) |
| **Graphics API** | Native Metal / Vulkan (Fast multi-threaded) | WebGL / Three.js (Single-threaded JS dispatch) |
| **Draw Call Limit** | Thousands of draw calls per frame | **Must batch into 1–3 draw calls for 60 FPS** |
| **Latency** | 16–30 ms | 30–50 ms |

---

### 4. Our 3D Model: Cyber Recon Drone (CRD-07)
- **Chassis & Hull:** Aerodynamic fuselage housing central avionics.
- **Reactor Core:** Central spherical reactor with an emissive cyan glow.
- **Containment Ring:** Torus ring surrounding the reactor with 12 electromagnetic coils.
- **Propulsion Arms:** 4 diagonal carbon fiber pylons.
- **Turbine Nacelles:** 4 engine ducts with internal rotating turbine blades.
- **Sensor Turret:** Front gimbal pod equipped with dual optical camera lenses.
- **Fins & Cabling:** Top aerodynamic stabilizer fins and rear copper energy conduits.

---

### 5. How We Optimized It (Part B: Blender Pipeline)
- **Step 1: High-Poly Baseline:** Authored initial model with high subdivision: **116,744 triangles**, 10 sub-meshes (10 draw calls), and **2.95 MB** file size.
- **Step 2: Mesh Decimation:** Applied Blender's *Decimate Modifier* (Collapse mode, ratio 0.021) using Quadric Error Metrics (QEM), reducing triangles by **97.86%** down to **2,504 triangles** while preserving silhouettes.
- **Step 3: Draw Call Batching:** Consolidated 8 mechanical parts into a single vertex buffer, reducing draw calls from 10 to 2 (**80.00% reduction**).
- **Step 4: Normal Texture Baking:** Baked fine panel bevels, seams, and rivet details from high-poly onto low-poly UVs via a tangent-space normal map.
- **Step 5: Draco Geometry Compression:** Exported using `KHR_draco_mesh_compression`, reducing the payload to just **15.8 KB**!

---

### 6. Quantitative Optimization Benchmarks

| Metric | High-Poly (Before) | Decimated (After) | Draco Compressed | Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Triangle Count** | 116,744 tris | 2,504 tris | 2,504 tris | **97.86% Reduction** |
| **Vertex Count** | 65,760 vertices | 2,138 vertices | 2,138 vertices | **96.75% Reduction** |
| **Draw Calls** | 10 draw calls | 2 draw calls | 2 draw calls | **80.00% Reduction** |
| **File Size** | 2.95 MB (2,950 KB) | 51.3 KB | **15.8 KB** | **99.49% Reduction** |
| **3G Load Time** | ~31.4 seconds | ~0.52 seconds | **~0.17 seconds** | **Instantaneous** |
| **Mobile Framerate** | 44–58 FPS (Stutter) | **60 FPS (Rock-solid)** | **60 FPS (Rock-solid)** | **Smooth 60 FPS** |

---

### 7. Live Demonstration Output (Part C)

![Live WebAR Capture Output](../OUTPUT.png)

*Figure 1: Live WebAR output running on webcam — 3D Cyber Recon Drone anchored above the Hiro marker with status indicator (TARGET ANCHORED) and live 60 FPS telemetry.*

---

### 8. Verification & Reactions
- **Target Anchored (Green Status):** Status pill switches to green with a lock-on audio chime upon marker capture.
- **Hovering Levitation:** Drone hovers and bobs continuously above the marker in real time.
- **Shockwave Reaction:** Clicking *⚡ React* triggers an energy shockwave ring and rotor spin burst.
- **Model Benchmark Switcher:** Allows evaluators to toggle live between the 2,504-poly model and 116,744-poly model.
- **Clean View Mode:** Clicking *👁️ Clean* hides all buttons for clean presentation recording.

---

### 9. Submission Links
- **Live Public WebXR URL:** [https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/](https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/)
- **GitHub Source Code:** [https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization)
- **Optimized 3D Model:** `assets/model_optimized.glb` (51.3 KB) and `assets/model_draco.glb` (15.8 KB)
