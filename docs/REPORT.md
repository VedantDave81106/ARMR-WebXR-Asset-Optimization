# Augmented Reality & Mixed Reality (DJS23ALH1501) - Assignment 1 Report

**Institution:** Dwarkadas J. Sanghvi College of Engineering  
**Department:** Artificial Intelligence and Machine Learning  
**Semester:** B.Tech. Semester V  
**Student Name:** Vedant Dave (`VedantDave81106`)  
**Target Outcomes:** CO1 (Literature Survey & Architecture), CO2 (3D Decimation & WebXR Deployment)  

---

## 1. What We Made (System Overview)

We designed and deployed an **app-less, cross-platform WebXR Augmented Reality application** running directly in mobile and desktop browsers (iOS Safari, Android Chrome, and PC webcams) without requiring Unity or app installations.

- **Fiducial Marker Tracking:** Uses standard Hiro marker pattern recognition via WebAssembly ARToolKit.
- **3D Asset Rendering:** Anchors a 3D Cyber Recon Drone directly on top of the physical marker in real time.
- **Interactive Reactions:**
  - **Lock-On Audio & Green Status:** Status turns green (`TARGET ANCHORED`) with a procedural lock-on sound upon marker capture.
  - **Hovering Levitation:** Smooth floating vertical bobbing and rotational surveillance animation.
  - **Energy Shockwave Reaction:** Clicking *⚡ React* triggers an expanding shockwave shield and bursts rotor RPM by $8\times$.
  - **Model Benchmark Switcher:** Toggle live between Optimized Low-Poly and High-Poly baseline models.
  - **Wireframe & Clean View:** Toggle wireframe inspection and hide buttons with one click for clean video recording.

---

## 2. Part A: Native AR SDKs vs. Browser WebXR (Technical Survey)

| Evaluation Factor | Native Mobile AR (ARKit / ARCore) | Browser-Based WebAR (AR.js / WebXR) |
| :--- | :--- | :--- |
| **User Onboarding** | High friction (App Store download, >100 MB) | **Zero friction (Instant HTTPS URL / QR scan)** |
| **Cross-Platform Reach**| Platform-locked (iOS vs. Android) | **Universal (>95% all mobile & desktop browsers)** |
| **Tracking Pipeline** | Hardware VIO + LiDAR / ToF sensors | Wasm ARToolKit Computer Vision |
| **Graphics API** | Metal / Vulkan (Very low draw call cost) | WebGL / Three.js (High JavaScript overhead) |
| **Draw Call Sensitivity**| Can handle 1,000+ draw calls easily | **Must batch into 1–3 draw calls for 60 FPS** |
| **Latency** | 16–30 ms | 30–50 ms |

---

## 3. What is Our 3D Model?

Our 3D model is the **Autonomous Cyber Reconnaissance Drone (Model CRD-07)**, designed with distinct functional components:
- **Central Fuselage:** Aerodynamic main hull housing core avionics.
- **Glowing Reactor Core:** Center spherical energy reactor with emissive cyan glow.
- **Magnetic Containment Ring:** Torus ring wrapped with 12 electromagnetic coils.
- **Quad Propulsion Arms:** 4 diagonal carbon fiber pylons.
- **Turbine Engine Nacelles:** 4 cylindrical motor ducts with inner turbine rotor blades.
- **Optical Sensor Turret:** Front gimbal pod with dual infrared optical camera lenses.
- **Armor & Conduits:** Segmented top cowlings, aerodynamic tail fins, and rear copper conduit wiring.

---

## 4. How We Optimized It (Part B: Blender Decimation Pipeline)

To achieve rock-solid 60 FPS rendering on mobile devices, we implemented a 5-step optimization pipeline:

1. **High-Poly Sculpt Baseline:**
   - Authored the baseline model with high subdivision: **116,744 triangles**, 65,760 vertices, and 10 separate sub-meshes (10 draw calls), totaling **2.95 MB**.
2. **Mesh Decimation (Quadric Error Metric):**
   - Applied Blender's *Decimate Modifier* in *Collapse* mode (ratio: `0.021`).
   - Collapsed redundant coplanar vertices while strictly preserving outer silhouettes.
   - Reduced triangles by **97.86%** down to **2,504 triangles**.
3. **Draw Call Batching & Material Consolidation:**
   - Merged 8 structural sub-meshes into a single vertex buffer, consolidating draw calls from 10 down to 2 (**80.00% reduction**).
4. **Normal Vector Texture Baking:**
   - Baked surface micro-geometry (panel lines, bevels, conduit ribs, bolt rivets) from the high-poly mesh onto low-poly UV coordinates via a $2048 \times 2048$ tangent-space normal map.
5. **Draco Geometry Compression:**
   - Exported the model using `KHR_draco_mesh_compression`, compressing the asset down to just **15.8 KB (0.015 MB)**!

---

## 5. Quantitative Optimization Benchmarks

| Metric | High-Poly (Baseline) | Decimated (Optimized) | Draco Compressed | Net Improvement |
| :--- | :--- | :--- | :--- | :--- |
| **Triangles** | 116,744 tris | 2,504 tris | 2,504 tris | **-97.86%** |
| **Vertices** | 65,760 vertices | 2,138 vertices | 2,138 vertices | **-96.75%** |
| **Draw Calls** | 10 calls | 2 calls | 2 calls | **-80.00%** |
| **Binary File Size** | 2.95 MB (2,950 KB) | 51.3 KB | **15.8 KB** | **-99.49%** |
| **3G Load Time (750 kbps)** | ~31.4 seconds | ~0.52 seconds | **~0.17 seconds** | **Instantaneous** |
| **Mobile Framerate** | 44–58 FPS (Stutter) | **60 FPS (Rock-solid)** | **60 FPS (Rock-solid)** | **Smooth 60 FPS** |

---

## 6. Live Demonstration Output Screenshot (Part C)

Below is the verified output screenshot captured from the live WebAR camera stream showing the 3D Cyber Recon Drone anchored above the physical Hiro marker:

![Live WebAR Capture Output](../OUTPUT.png)

*Figure: Live WebAR output running on webcam — 3D Cyber Recon Drone anchored above the Hiro marker with status indicator (TARGET ANCHORED) and live 60 FPS telemetry.*

---

## 7. Submission Deliverables & Links

- **Live Public WebXR URL:** [https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/](https://vedantdave81106.github.io/ARMR-WebXR-Asset-Optimization/)
- **GitHub Source Code Repository:** [https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization](https://github.com/VedantDave81106/ARMR-WebXR-Asset-Optimization)
- **Printable 3-Page Academic Paper:** Open [report.html](report.html) -> `Ctrl + P` -> Save as PDF
- **Final Optimized 3D Assets:** `assets/model_optimized.glb` (51.3 KB) and `assets/model_draco.glb` (15.8 KB)
