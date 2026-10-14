# 3D Asset Decimation & Texture Baking Pipeline in Blender

**Subject:** Augmented Reality and Mixed Reality (DJS23ALH1501)  
**Department:** Artificial Intelligence and Machine Learning  
**Institution:** Dwarkadas J. Sanghvi College of Engineering  

This technical guide documents the exact workflow utilized to author, decimate, bake PBR textures, and export high-performance `.glb` assets for mobile WebXR deployment.

---

## 1. High-Polygon Model Authoring / Import

1. **Geometry Sculpting & Assembly:**
   - Author or import the high-fidelity asset (`Drone_HighPoly`) containing intricate structural details: curved chassis, propulsion arms, motor cowlings, turbine blades, optical sensor dome, cooling fins, and conduit wiring.
   - Initial geometric resolution: **116,744 triangles** across 10 distinct sub-meshes with independent PBR materials.
2. **Topology Verification:**
   - Verify non-manifold geometry: `Edit Mode -> Select -> All by Trait -> Non-Manifold` (ensure 0 non-manifold edges).
   - Apply all transforms: `Ctrl + A -> All Transforms` to reset object scale to `(1.0, 1.0, 1.0)`.

---

## 2. Mesh Decimation Pipeline (Quadric Error Metric)

1. **Duplicate Asset for Low-Poly Variant:**
   - Duplicate high-poly model: `Shift + D`, rename duplicate to `Drone_LowPoly`.
   - Hide the high-poly model (`H`).
2. **Apply Decimate Modifier:**
   - Select `Drone_LowPoly`, navigate to the **Modifier Properties** tab (`Wrench` icon).
   - Add Modifier -> **Decimate**.
   - Select **Collapse** mode:
     * Set **Ratio**: `0.021` (targeted ~97.8% reduction from ~116k to ~2.5k triangles).
     * Check **Triangulate** to ensure uniform polygon distribution.
     * Check **Symmetry** across the X-axis (`Symmetry: X`).
   - Click dropdown arrow on modifier -> **Apply** (`Ctrl + A`).
3. **Planar & Dissolve Cleanup (Optional):**
   - For flat surfaces (armor plates, cooling fins), use the **Planar** decimate mode with an angle limit of `5.0°` to dissolve redundant co-planar coplanar coplanar vertices without losing silhouette boundaries.
4. **Vertex Normal Smoothing:**
   - In `Object Mode`, right-click -> **Shade Auto Smooth** (Angle: `35°`) to ensure smooth visual appearance despite low polygon density.

---

## 3. UV Unwrapping & Seam Placement

1. **Mark Seams:**
   - In `Edit Mode` (`Tab`), select boundary edges along sharp mechanical transitions, arm hinges, and hidden undersides.
   - Press `Ctrl + E -> Mark Seam`.
2. **Unwrap UV Atlas:**
   - Press `A` to select all faces.
   - Press `U -> Unwrap` (Method: *Angle Based*, Margin: `0.002`).
   - In UV Editor, select all UV islands and pack them: `UV -> Pack Islands` (Margin: `0.005`, Rotate: Enabled).
   - This ensures all 10 sub-components map onto a single unified UV coordinate space, reducing required draw calls from 10 down to 1–2.

---

## 4. High-to-Low Poly Texture Baking

To preserve the surface details (panel lines, bevels, conduit ribs, bolt rivets) without the polygon cost, normal vectors are baked from the high-poly mesh onto the low-poly UV map.

1. **Material & Texture Setup:**
   - In the **Shader Editor**, create a new Material for `Drone_LowPoly` named `M_Drone_PBR`.
   - Add an **Image Texture** node (`Shift + A -> Texture -> Image Texture`).
   - Click **New**:
     * Name: `Drone_NormalMap`
     * Width: `2048`, Height: `2048`
     * Color: 32-bit Float unchecked, Non-Color color space.
   - Keep this node active and selected (do not connect it yet).
2. **Configure Cycles Render Engine:**
   - In **Render Properties**, set **Render Engine** to `Cycles`.
   - Device: `GPU Compute`.
   - Samples: `32` (sufficient for geometric vector baking).
3. **Configure Bake Settings:**
   - Scroll down to the **Bake** panel:
     * **Bake Type**: `Normal`
     * **Space**: `Tangent`
     * Check **Selected to Active** (Crucial!)
     * **Cage / Extrusion**: Set `Max Ray Distance` to `0.015 m`
     * Target: `Image Texture`
4. **Execute Normal Bake:**
   - In the Outliner, first select `Drone_HighPoly`.
   - Hold `Ctrl` and select `Drone_LowPoly` (ensuring low-poly is active).
   - Click the **Bake** button.
   - In the UV/Image Editor, observe the tangent normal map generated (predominantly periwinkle `#8080FF`).
   - Save image: `Image -> Save As -> assets/textures/drone_normal.png`.
5. **Connect Normal Map in Shader:**
   - Add a **Normal Map** node (`Vector -> Normal Map`).
   - Connect `Image Texture (Color)` -> `Normal Map (Color)`.
   - Connect `Normal Map (Normal)` -> `Principled BSDF (Normal)`.
   - Set Image Texture Color Space to `Non-Color`.

---

## 5. glTF 2.0 Export with Draco Mesh Compression

1. **Select Export Target:**
   - Select `Drone_LowPoly`.
   - Navigate to `File -> Export -> glTF 2.0 (.glb/.gltf)`.
2. **Export Configuration Settings:**
   - **Format**: `glTF Binary (.glb)`
   - **Include**:
     * Check `Limit to: Selected Objects`
     * Check `Transform -> +Y Up`
   - **Geometry**:
     * Check `Apply Modifiers`
     * Check `UVs`
     * Check `Normals`
     * Check `Tangents` (improves mobile normal map shading consistency)
   - **Compression (Draco)**:
     * Check **Compression** checkbox (`KHR_draco_mesh_compression`).
     * Compression level: `7` (Balanced compression ratio and decode speed).
     * Position quantization: `14 bits`
     * Normal quantization: `10 bits`
     * TexCoord quantization: `12 bits`
   - **Materials**:
     * Export Materials: `Export`
     * Images: `Automatic`
3. **Output File:**
   - Save as `assets/model_optimized.glb` (and `assets/model_draco.glb`).

---

## 6. Verification and Quantitative Auditing

After export, verify the output file using the bundled node inspector:
```bash
node scripts/generate_models.mjs
```
Expected audit metrics:
- Triangles: Decimated from **116,744** to **2,504** (**97.86% reduction**)
- Draw Calls: Consolidated from **10** to **2** (**80.00% reduction**)
- Binary Payload: Reduced from **2.95 MB** to **0.049 MB (51 KB)** uncompressed (**98.34% reduction**) and **0.015 MB (15.8 KB)** with Draco (**99.49% reduction**).
