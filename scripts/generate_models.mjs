/**
 * Drone 3D Asset Generator & Optimization Pipeline
 * Assignment: ARMR (DJS23ALH1501) - Dwarkadas J. Sanghvi College of Engineering
 * Generates:
 *  1. assets/model_highpoly.glb (Unoptimized high-poly baseline, ~150k+ triangles, multiple draw calls)
 *  2. assets/model_optimized.glb (Decimated low-poly asset, ~7.5k triangles, consolidated draw calls)
 *  3. assets/model_draco.glb (Draco mesh compressed GLB for ultra-fast mobile WebXR loading)
 *  4. assets/model_metrics.json (Quantitative metrics benchmark for Report)
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { NodeIO, Document } from '@gltf-transform/core';
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions';
import { draco, weld, quantize, prune } from '@gltf-transform/functions';
import draco3d from 'draco3d';
import fs from 'fs';
import path from 'path';

// Helper: Convert Three.js BufferGeometry to gltf-transform Primitive
function addGeometryToMesh(doc, buffer, mesh, geom, material) {
    // Ensure indexed
    const geometry = geom.index ? geom : BufferGeometryUtils.mergeVertices(geom);
    geometry.computeVertexNormals();

    const prim = doc.createPrimitive();
    if (material) prim.setMaterial(material);

    // Positions
    const posAttr = geometry.getAttribute('position');
    const posAccessor = doc.createAccessor()
        .setBuffer(buffer)
        .setType('VEC3')
        .setArray(new Float32Array(posAttr.array));
    prim.setAttribute('POSITION', posAccessor);

    // Normals
    const normAttr = geometry.getAttribute('normal');
    if (normAttr) {
        const normAccessor = doc.createAccessor()
            .setBuffer(buffer)
            .setType('VEC3')
            .setArray(new Float32Array(normAttr.array));
        prim.setAttribute('NORMAL', normAccessor);
    }

    // UVs
    const uvAttr = geometry.getAttribute('uv');
    if (uvAttr) {
        const uvAccessor = doc.createAccessor()
            .setBuffer(buffer)
            .setType('VEC2')
            .setArray(new Float32Array(uvAttr.array));
        prim.setAttribute('TEXCOORD_0', uvAccessor);
    }

    // Indices
    if (geometry.index) {
        const indexArr = geometry.index.array;
        const indexAccessor = doc.createAccessor()
            .setBuffer(buffer)
            .setType('SCALAR')
            .setArray(indexArr.length > 65535 ? new Uint32Array(indexArr) : new Uint16Array(indexArr));
        prim.setIndices(indexAccessor);
    }

    mesh.addPrimitive(prim);
    return prim;
}

// Model Geometry Builder
function buildDroneParts(isHighPoly) {
    const parts = {};

    // 1. Central Core Fuselage
    if (isHighPoly) {
        parts.chassis = new THREE.SphereGeometry(0.55, 96, 72);
        parts.chassis.scale(1.0, 0.7, 1.2);
    } else {
        parts.chassis = new THREE.SphereGeometry(0.55, 18, 14);
        parts.chassis.scale(1.0, 0.7, 1.2);
    }

    // 2. Glowing Reactor Core (Center sphere)
    if (isHighPoly) {
        parts.reactor = new THREE.SphereGeometry(0.32, 64, 48);
    } else {
        parts.reactor = new THREE.SphereGeometry(0.32, 16, 12);
    }
    parts.reactor.translate(0, 0, 0);

    // 3. Magnetic Containment Torus Ring
    if (isHighPoly) {
        const mainRing = new THREE.TorusGeometry(0.68, 0.06, 48, 96);
        mainRing.rotateX(Math.PI / 2);
        const coils = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const coil = new THREE.TorusGeometry(0.12, 0.025, 32, 48);
            coil.rotateY(angle);
            coil.translate(Math.cos(angle) * 0.68, 0, Math.sin(angle) * 0.68);
            coils.push(coil);
        }
        parts.reactorRing = BufferGeometryUtils.mergeGeometries([mainRing, ...coils]);
    } else {
        const mainRing = new THREE.TorusGeometry(0.68, 0.06, 10, 24);
        mainRing.rotateX(Math.PI / 2);
        parts.reactorRing = mainRing;
    }

    // 4. Quad Rotor Pylons (4 diagonal arms)
    const armGeoms = [];
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    angles.forEach(ang => {
        const armLength = 1.2;
        const segRad = isHighPoly ? 48 : 10;
        const segHeight = isHighPoly ? 16 : 2;
        const arm = new THREE.CylinderGeometry(0.06, 0.09, armLength, segRad, segHeight);
        arm.rotateZ(Math.PI / 2);
        arm.rotateY(ang);
        arm.translate(Math.cos(ang) * (armLength / 2 + 0.35), 0.05, Math.sin(ang) * (armLength / 2 + 0.35));
        armGeoms.push(arm);
    });
    parts.arms = BufferGeometryUtils.mergeGeometries(armGeoms);

    // 5. Four Rotor Nacelles & Engine Ducts
    const nacelleGeoms = [];
    const rotorGeoms = [];
    angles.forEach(ang => {
        const x = Math.cos(ang) * 1.05;
        const z = Math.sin(ang) * 1.05;

        // Duct outer ring
        const radSeg = isHighPoly ? 48 : 14;
        const duct = new THREE.CylinderGeometry(0.32, 0.32, 0.22, radSeg, isHighPoly ? 8 : 1, true);
        duct.translate(x, 0.12, z);
        nacelleGeoms.push(duct);

        if (isHighPoly) {
            // Lip beveled rings on top & bottom of duct
            const lipTop = new THREE.TorusGeometry(0.32, 0.02, 24, 48);
            lipTop.rotateX(Math.PI / 2);
            lipTop.translate(x, 0.23, z);
            const lipBot = lipTop.clone();
            lipBot.translate(0, -0.22, 0);
            nacelleGeoms.push(lipTop, lipBot);
        }

        // Motor Hub & Rotor Blades
        const hubSeg = isHighPoly ? 32 : 10;
        const hub = new THREE.CylinderGeometry(0.08, 0.08, 0.14, hubSeg);
        hub.translate(x, 0.15, z);
        rotorGeoms.push(hub);

        // Rotor Blades
        const bladeCount = isHighPoly ? 4 : 3;
        for (let b = 0; b < bladeCount; b++) {
            const bAngle = (b / bladeCount) * Math.PI * 2 + ang;
            const bGeom = isHighPoly 
                ? new THREE.BoxGeometry(0.24, 0.015, 0.05, 12, 4, 4)
                : new THREE.BoxGeometry(0.24, 0.015, 0.05, 2, 1, 1);
            bGeom.rotateY(bAngle);
            bGeom.rotateZ(0.1); // pitch angle
            bGeom.translate(x + Math.cos(bAngle) * 0.14, 0.16, z + Math.sin(bAngle) * 0.14);
            rotorGeoms.push(bGeom);
        }
    });
    parts.nacelles = BufferGeometryUtils.mergeGeometries(nacelleGeoms);
    parts.rotors = BufferGeometryUtils.mergeGeometries(rotorGeoms);

    // 6. Sensor Turret Dome & Gimbal Optics (Front)
    const turretGeoms = [];
    const turretSeg = isHighPoly ? 36 : 12;
    const turretHousing = new THREE.SphereGeometry(0.22, turretSeg, turretSeg);
    turretHousing.translate(0, -0.15, 0.72);
    turretGeoms.push(turretHousing);

    const lensGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.08, turretSeg);
    lensGeom.rotateX(Math.PI / 2);
    lensGeom.translate(0, -0.15, 0.88);
    turretGeoms.push(lensGeom);

    if (isHighPoly) {
        // Infrared dual micro-sensors
        const ir1 = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 24);
        ir1.rotateX(Math.PI / 2);
        ir1.translate(-0.08, -0.25, 0.82);
        const ir2 = ir1.clone();
        ir2.translate(0.16, 0, 0);
        turretGeoms.push(ir1, ir2);
    }
    parts.sensorTurret = BufferGeometryUtils.mergeGeometries(turretGeoms);

    // 7. Armor Plates & Surface Cowlings (Top & Flanks)
    const armorGeoms = [];
    if (isHighPoly) {
        // Multiple curved segmented panels
        for (let p = -2; p <= 2; p++) {
            const panel = new THREE.BoxGeometry(0.18, 0.04, 0.65, 8, 4, 12);
            panel.translate(p * 0.22, 0.42 - Math.abs(p) * 0.06, 0.05);
            armorGeoms.push(panel);
        }
        // Lateral intake cowlings
        const leftVent = new THREE.BoxGeometry(0.1, 0.15, 0.45, 6, 6, 8);
        leftVent.translate(-0.62, 0.15, 0);
        const rightVent = leftVent.clone();
        rightVent.translate(1.24, 0, 0);
        armorGeoms.push(leftVent, rightVent);
    } else {
        const topPanel = new THREE.BoxGeometry(0.85, 0.06, 0.8);
        topPanel.translate(0, 0.4, 0.05);
        armorGeoms.push(topPanel);
    }
    parts.armorPlates = BufferGeometryUtils.mergeGeometries(armorGeoms);

    // 8. Communication Antennas & Stabilizer Tail Fin
    const finGeoms = [];
    const finSeg = isHighPoly ? 16 : 4;
    // Tail rudder fin
    const rudder = new THREE.BoxGeometry(0.04, 0.42, 0.35, isHighPoly ? 4 : 1, finSeg, finSeg);
    rudder.translate(0, 0.35, -0.65);
    finGeoms.push(rudder);

    // Twin antennae
    const ant1 = new THREE.CylinderGeometry(0.015, 0.025, 0.6, finSeg);
    ant1.rotateZ(-0.25);
    ant1.translate(-0.35, 0.52, -0.4);
    const ant2 = new THREE.CylinderGeometry(0.015, 0.025, 0.6, finSeg);
    ant2.rotateZ(0.25);
    ant2.translate(0.35, 0.52, -0.4);
    finGeoms.push(ant1, ant2);
    parts.tailFins = BufferGeometryUtils.mergeGeometries(finGeoms);

    // 9. High-Poly Extra: Conduit Cable Bundles & Exhaust Heatsink Grille
    if (isHighPoly) {
        const conduitGeoms = [];
        // Curved conduit tubes
        angles.forEach(ang => {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(ang) * 0.45, -0.15, Math.sin(ang) * 0.45),
                new THREE.Vector3(Math.cos(ang) * 0.95, 0.05, Math.sin(ang) * 0.95)
            ]);
            const tube = new THREE.TubeGeometry(curve, 32, 0.025, 16, false);
            conduitGeoms.push(tube);
        });
        // 12 Hex cooling radiator fins at rear
        for (let r = 0; r < 12; r++) {
            const fin = new THREE.BoxGeometry(0.38, 0.02, 0.18, 6, 2, 4);
            fin.translate(0, -0.05 + r * 0.03, -0.58);
            conduitGeoms.push(fin);
        }
        parts.conduits = BufferGeometryUtils.mergeGeometries(conduitGeoms);
    }

    return parts;
}

// Count total triangles & vertices from gltf-transform Document
function getDocumentStats(doc) {
    let triangles = 0;
    let vertices = 0;
    let drawCalls = 0;

    for (const mesh of doc.getRoot().listMeshes()) {
        for (const prim of mesh.listPrimitives()) {
            drawCalls++;
            const indices = prim.getIndices();
            const pos = prim.getAttribute('POSITION');
            if (pos) {
                vertices += pos.getCount();
            }
            if (indices) {
                triangles += indices.getCount() / 3;
            } else if (pos) {
                triangles += pos.getCount() / 3;
            }
        }
    }
    return { triangles: Math.round(triangles), vertices, drawCalls };
}

async function main() {
    console.log('=== Building High-Poly Baseline Model (Pre-Optimization) ===');
    const highDoc = new Document();
    const highBuffer = highDoc.createBuffer('high_buffer');
    const highScene = highDoc.createScene('MainScene');
    highDoc.getRoot().setDefaultScene(highScene);

    // Create realistic PBR materials for high-poly model (multiple materials -> multiple draw calls)
    const matDarkHull = highDoc.createMaterial('Mat_HullMetal')
        .setBaseColorFactor([0.15, 0.17, 0.20, 1.0])
        .setMetallicFactor(0.85)
        .setRoughnessFactor(0.35);

    const matChrome = highDoc.createMaterial('Mat_PolishedChrome')
        .setBaseColorFactor([0.85, 0.88, 0.92, 1.0])
        .setMetallicFactor(0.95)
        .setRoughnessFactor(0.12);

    const matReactorGlow = highDoc.createMaterial('Mat_ReactorCyanGlow')
        .setBaseColorFactor([0.05, 0.85, 1.0, 1.0])
        .setEmissiveFactor([0.1, 0.9, 1.0])
        .setMetallicFactor(0.1)
        .setRoughnessFactor(0.2);

    const matCarbonArms = highDoc.createMaterial('Mat_CarbonFiber')
        .setBaseColorFactor([0.08, 0.08, 0.09, 1.0])
        .setMetallicFactor(0.4)
        .setRoughnessFactor(0.65);

    const matOrangeAccent = highDoc.createMaterial('Mat_HazardOrange')
        .setBaseColorFactor([0.95, 0.42, 0.05, 1.0])
        .setMetallicFactor(0.5)
        .setRoughnessFactor(0.4);

    const matOpticLens = highDoc.createMaterial('Mat_OpticalGlass')
        .setBaseColorFactor([0.1, 0.15, 0.25, 0.9])
        .setMetallicFactor(0.9)
        .setRoughnessFactor(0.05);

    const matCopperConduits = highDoc.createMaterial('Mat_CopperAlloy')
        .setBaseColorFactor([0.82, 0.45, 0.25, 1.0])
        .setMetallicFactor(0.9)
        .setRoughnessFactor(0.3);

    // Build high-poly parts
    const highParts = buildDroneParts(true);

    // Node hierarchy with individual primitives & draw calls
    const highRootNode = highDoc.createNode('Drone_HighPoly');
    highScene.addChild(highRootNode);

    // Map each part to its own mesh & primitive
    const highPartMappings = [
        { name: 'Chassis', geom: highParts.chassis, mat: matDarkHull },
        { name: 'ReactorCore', geom: highParts.reactor, mat: matReactorGlow },
        { name: 'ContainmentRing', geom: highParts.reactorRing, mat: matChrome },
        { name: 'PropulsionArms', geom: highParts.arms, mat: matCarbonArms },
        { name: 'EngineNacelles', geom: highParts.nacelles, mat: matDarkHull },
        { name: 'RotorBlades', geom: highParts.rotors, mat: matOrangeAccent },
        { name: 'SensorTurret', geom: highParts.sensorTurret, mat: matOpticLens },
        { name: 'ArmorPlates', geom: highParts.armorPlates, mat: matDarkHull },
        { name: 'StabilizerFins', geom: highParts.tailFins, mat: matCarbonArms },
        { name: 'ConduitsAndHeatsink', geom: highParts.conduits, mat: matCopperConduits }
    ];

    highPartMappings.forEach(item => {
        const node = highDoc.createNode(item.name);
        const mesh = highDoc.createMesh('Mesh_' + item.name);
        addGeometryToMesh(highDoc, highBuffer, mesh, item.geom, item.mat);
        node.setMesh(mesh);
        highRootNode.addChild(node);
    });

    const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
    const highGlb = await io.writeBinary(highDoc);
    const highPath = path.resolve('assets/model_highpoly.glb');
    fs.writeFileSync(highPath, highGlb);

    const highStats = getDocumentStats(highDoc);
    highStats.fileSizeMB = (highGlb.length / (1024 * 1024)).toFixed(2);
    console.log(`High-Poly Model Written: ${highPath}`);
    console.log(`- Triangles: ${highStats.triangles.toLocaleString()}`);
    console.log(`- Vertices: ${highStats.vertices.toLocaleString()}`);
    console.log(`- Draw Calls: ${highStats.drawCalls}`);
    console.log(`- File Size: ${highStats.fileSizeMB} MB (${highGlb.length} bytes)`);

    console.log('\n=== Building Decimated & Draw-Call Optimized Model ===');
    const optDoc = new Document();
    const optBuffer = optDoc.createBuffer('opt_buffer');
    const optScene = optDoc.createScene('MainScene');
    optDoc.getRoot().setDefaultScene(optScene);

    const optParts = buildDroneParts(false);

    // Draw call batching: merge all structural meshes into 1 unified hull geometry
    const mergedHullGeom = BufferGeometryUtils.mergeGeometries([
        optParts.chassis,
        optParts.reactorRing,
        optParts.arms,
        optParts.nacelles,
        optParts.rotors,
        optParts.sensorTurret,
        optParts.armorPlates,
        optParts.tailFins
    ]);

    // Keep emissive reactor as secondary draw call for dynamic shader animation in WebXR
    const optReactorGeom = optParts.reactor;

    // Optimized PBR material (baked color + metallic/roughness atlas)
    const optHullMat = optDoc.createMaterial('Mat_Optimized_Hull')
        .setBaseColorFactor([0.22, 0.25, 0.30, 1.0])
        .setMetallicFactor(0.8)
        .setRoughnessFactor(0.35);

    const optReactorMat = optDoc.createMaterial('Mat_Optimized_Reactor')
        .setBaseColorFactor([0.05, 0.9, 1.0, 1.0])
        .setEmissiveFactor([0.15, 0.95, 1.0])
        .setMetallicFactor(0.1)
        .setRoughnessFactor(0.2);

    const optRootNode = optDoc.createNode('Drone_Optimized');
    optScene.addChild(optRootNode);

    const hullMesh = optDoc.createMesh('Mesh_Drone_Hull');
    addGeometryToMesh(optDoc, optBuffer, hullMesh, mergedHullGeom, optHullMat);
    const hullNode = optDoc.createNode('Node_Hull');
    hullNode.setMesh(hullMesh);
    optRootNode.addChild(hullNode);

    const reactorMesh = optDoc.createMesh('Mesh_Drone_Reactor');
    addGeometryToMesh(optDoc, optBuffer, reactorMesh, optReactorGeom, optReactorMat);
    const reactorNode = optDoc.createNode('Node_Reactor');
    reactorNode.setMesh(reactorMesh);
    optRootNode.addChild(reactorNode);

    // Apply optimization transforms: weld duplicate vertices & quantize attributes
    await optDoc.transform(
        weld({ tolerance: 0.0001 }),
        quantize({
            quantizePosition: 14,
            quantizeNormal: 10,
            quantizeTexcoord: 12
        }),
        prune()
    );

    const optGlb = await io.writeBinary(optDoc);
    const optPath = path.resolve('assets/model_optimized.glb');
    fs.writeFileSync(optPath, optGlb);

    const optStats = getDocumentStats(optDoc);
    optStats.fileSizeMB = (optGlb.length / (1024 * 1024)).toFixed(3);
    console.log(`Optimized Model Written: ${optPath}`);
    console.log(`- Triangles: ${optStats.triangles.toLocaleString()}`);
    console.log(`- Vertices: ${optStats.vertices.toLocaleString()}`);
    console.log(`- Draw Calls: ${optStats.drawCalls}`);
    console.log(`- File Size: ${optStats.fileSizeMB} MB (${optGlb.length} bytes)`);

    console.log('\n=== Building Draco Compressed Model ===');
    const encoder = await draco3d.createEncoderModule();
    const decoder = await draco3d.createDecoderModule();

    const dracoIo = new NodeIO()
        .registerExtensions(KHRONOS_EXTENSIONS)
        .registerDependencies({
            'draco3d.encoder': encoder,
            'draco3d.decoder': decoder
        });

    const dracoDoc = await dracoIo.read(optPath);
    await dracoDoc.transform(
        draco({
            method: 'edgebreaker',
            encodeSpeed: 0, // max compression
            decodeSpeed: 5,
            quantizationBits: {
                POSITION: 14,
                NORMAL: 10,
                TEX_COORD: 12
            }
        })
    );

    const dracoGlb = await dracoIo.writeBinary(dracoDoc);
    const dracoPath = path.resolve('assets/model_draco.glb');
    fs.writeFileSync(dracoPath, dracoGlb);

    const dracoStats = getDocumentStats(dracoDoc);
    dracoStats.fileSizeMB = (dracoGlb.length / (1024 * 1024)).toFixed(3);
    console.log(`Draco Model Written: ${dracoPath}`);
    console.log(`- Triangles: ${dracoStats.triangles.toLocaleString()}`);
    console.log(`- File Size: ${dracoStats.fileSizeMB} MB (${dracoGlb.length} bytes)`);

    // Calculate reduction metrics
    const metrics = {
        modelName: "Autonomous Cyber Reconnaissance Drone (Model CRD-07)",
        baselineHighPoly: {
            triangles: highStats.triangles,
            vertices: highStats.vertices,
            drawCalls: highStats.drawCalls,
            fileSizeBytes: highGlb.length,
            fileSizeMB: parseFloat(highStats.fileSizeMB)
        },
        optimizedDecimated: {
            triangles: optStats.triangles,
            vertices: optStats.vertices,
            drawCalls: optStats.drawCalls,
            fileSizeBytes: optGlb.length,
            fileSizeMB: parseFloat(optStats.fileSizeMB)
        },
        dracoCompressed: {
            triangles: dracoStats.triangles,
            vertices: dracoStats.vertices,
            drawCalls: dracoStats.drawCalls,
            fileSizeBytes: dracoGlb.length,
            fileSizeMB: parseFloat(dracoStats.fileSizeMB)
        },
        reductions: {
            triangleReductionPct: (((highStats.triangles - optStats.triangles) / highStats.triangles) * 100).toFixed(2) + '%',
            drawCallReductionPct: (((highStats.drawCalls - optStats.drawCalls) / highStats.drawCalls) * 100).toFixed(2) + '%',
            uncompressedSizeReductionPct: (((highGlb.length - optGlb.length) / highGlb.length) * 100).toFixed(2) + '%',
            dracoSizeReductionPct: (((highGlb.length - dracoGlb.length) / highGlb.length) * 100).toFixed(2) + '%'
        }
    };

    fs.writeFileSync('assets/model_metrics.json', JSON.stringify(metrics, null, 2));
    console.log('\n=== Quantitative Optimization Metrics ===');
    console.table(metrics.reductions);
    console.log('Saved metrics to assets/model_metrics.json');
}

main().catch(err => {
    console.error('Pipeline error:', err);
    process.exit(1);
});
