"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from "framer-motion";
import { MutableRefObject, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import DebugPanel, { DEFAULT_TUNE, Tune } from "./DebugPanel";

/*
 * A 3D reconstruction of the actual CROSTA crisp, modeled from reference
 * photos: a hollow, oven-puffed pillow with four pinched corners, a pale
 * golden surface warming to toast at the center, sparse browned freckles,
 * and a floury, frosted bloom along the rim seam.
 *
 * Around it, a quiet Milky-Way-style galaxy: a tilted disc of gold dust
 * with faint spiral arms that thins out into space, plus a handful of
 * miniature crisps — some square, some rectangular like the 100 g batch
 * packs — drifting along the disc. The crisp sits small and deep
 * (z=-1.07) behind the disc plane (z=+1), so the whole dust field drifts
 * as a translucent veil in front of the product — a planet seen through
 * its own galaxy. The galaxy rotates on its own and ignores the cursor;
 * only the hero chip responds to it. (Composition hand-tuned by Matias
 * via the dev-only DebugPanel; rest values live in DEFAULT_TUNE.)
 */

// Palette sampled from the reference photos, warmed toward the brand gold
// and kept a step below white so the crisp reads as baked cheese, never
// glowing plastic (THREE converts sRGB → linear).
const COL_BASE = new THREE.Color("#d0a95c");
const COL_WARM = new THREE.Color("#bd8a38");
const COL_TOAST = new THREE.Color("#9e6a28");
const COL_FRECKLE_A = new THREE.Color("#a06424");
const COL_FRECKLE_B = new THREE.Color("#824f18");
const COL_BLOOM = new THREE.Color("#eadcb4");

// Deterministic RNG so the scene is identical on every visit.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth, cheap 3D noise from layered sines — enough for baked-dough organics.
function wave(x: number, y: number, z: number) {
  return (
    (Math.sin(x * 1.7 + y * 2.3 - z * 1.1 + 1.3) +
      Math.sin(x * -2.1 + y * 1.3 + z * 2.7 + 4.1) +
      Math.sin(x * 1.1 - y * 2.9 + z * 1.9 + 2.2)) /
    3
  );
}

function fbm(x: number, y: number, z: number) {
  return (
    (wave(x, y, z) +
      0.5 * wave(x * 2.3 + 5.2, y * 2.3 - 1.7, z * 2.3 + 3.1) +
      0.25 * wave(x * 4.9 + 11.3, y * 4.9 + 7.1, z * 4.9 - 2.6)) /
    1.75
  );
}

function smooth(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function addVertexColors(geo: THREE.BufferGeometry) {
  const rand = mulberry32(1234);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);

  // Small browned freckles and broad toasted patches, scattered like the
  // real bake — positions are directions from the chip center.
  const freckles: { d: THREE.Vector3; size: number; str: number; col: THREE.Color }[] = [];
  for (let i = 0; i < 18; i++) {
    freckles.push({
      d: new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize(),
      size: 0.06 + rand() * 0.11,
      str: 0.45 + rand() * 0.45,
      col: rand() > 0.5 ? COL_FRECKLE_A : COL_FRECKLE_B,
    });
  }
  const patches: { d: THREE.Vector3; size: number; str: number }[] = [];
  for (let i = 0; i < 6; i++) {
    patches.push({
      d: new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize(),
      size: 0.45 + rand() * 0.5,
      str: 0.18 + rand() * 0.28,
    });
  }

  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const col = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    dir.copy(v).normalize();
    const rp = Math.hypot(v.x, v.y) / 1.3;
    const nz = Math.abs(v.z);

    col.copy(COL_BASE);

    // Toast deepens toward the center of each face.
    const centerWarm =
      smooth(1.05, 0.25, rp) *
      (0.55 + 0.45 * (0.5 + 0.5 * fbm(v.x * 1.3, v.y * 1.3, v.z * 1.3)));
    col.lerp(COL_WARM, centerWarm * 0.7);

    for (const p of patches) {
      const w = smooth(Math.cos(p.size), Math.cos(p.size * 0.3), dir.dot(p.d));
      if (w > 0) col.lerp(COL_TOAST, w * p.str);
    }

    // Fine mottling so no region reads as flat color — a touch stronger so
    // the surface reads baked, not molded.
    const mott = 0.5 + 0.5 * fbm(v.x * 2.6 + 9.1, v.y * 2.6 - 4.2, v.z * 2.6 + 1.7);
    col.lerp(COL_TOAST, mott * 0.28);
    col.lerp(COL_BLOOM, (1 - mott) * 0.1);

    for (const f of freckles) {
      const w = smooth(Math.cos(f.size), Math.cos(f.size * 0.35), dir.dot(f.d));
      if (w > 0) col.lerp(f.col, w * f.str);
    }

    // Toasted stretches along some edges — noise-gated so only parts of the
    // perimeter brown in the oven, warm but well short of burnt.
    const edge = smooth(0.62, 1.0, rp);
    const toastGate = smooth(
      0.08,
      0.6,
      fbm(dir.x * 2.1 + 13.7, dir.y * 2.1 - 6.4, dir.z * 2.1 + 8.5)
    );
    col.lerp(COL_TOAST, edge * toastGate * 0.62);

    // Floury frost along the rim seam, patchy like the photos.
    const rimBand = smooth(0.34, 0.1, nz) * smooth(0.55, 0.95, rp);
    const frost =
      rimBand * (0.45 + 0.55 * (0.5 + 0.5 * fbm(v.x * 3.1 - 2, v.y * 3.1 + 5, v.z * 3.1)));
    col.lerp(COL_BLOOM, frost * 0.42);

    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function createChipGeometry(): THREE.BufferGeometry {
  const rand = mulberry32(7);

  // Each corner gets its own character: how far it protrudes, how tightly
  // it pinches shut, and whether the tip bends up or down.
  const cornerExt: number[] = [];
  const cornerBend: number[] = [];
  const cornerPinch: number[] = [];
  for (let k = 0; k < 4; k++) {
    cornerExt.push(0.13 + rand() * 0.16);
    cornerBend.push((rand() - 0.5) * 0.34);
    cornerPinch.push(0.45 + rand() * 0.25);
  }

  let geo: THREE.BufferGeometry = new THREE.SphereGeometry(1, 180, 128);
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");

  const pos = geo.attributes.position as THREE.BufferAttribute;
  // Superellipse exponent → rounded-square cross-section. Higher keeps the
  // sides full so the silhouette reads pillow, not four-pointed star.
  const N = 4.5;

  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sy = pos.getY(i);
    const sz = pos.getZ(i);
    const rp = Math.hypot(sx, sy);
    const phi = Math.atan2(sy, sx);

    // Square the circular cross-section (corners land on the diagonals).
    const cA = Math.abs(Math.cos(phi));
    const sA = Math.abs(Math.sin(phi));
    const m = Math.pow(Math.pow(cA, N) + Math.pow(sA, N), -1 / N);

    const corner = Math.pow(Math.abs(Math.sin(2 * phi)), 3);
    const kIdx = ((Math.round((phi - Math.PI / 4) / (Math.PI / 2)) % 4) + 4) % 4;
    const rim = Math.pow(rp, 3);

    // Corners protrude into little tips near the rim.
    const ext = 1 + cornerExt[kIdx] * corner * rim;
    let x = sx * m * ext;
    let y = sy * m * ext * 1.04;

    // Pillow profile: full dome in the middle, tapering to a thin seam.
    // The top half puffs higher than the bottom, like the real crisp.
    const half = sz >= 0 ? 0.64 : 0.48;
    let z = Math.sign(sz) * Math.pow(Math.abs(sz), 0.7) * half;

    // Pinch the corners nearly closed and bend each tip its own way.
    z *= 1 - cornerPinch[kIdx] * corner * rim;
    z += cornerBend[kIdx] * Math.pow(corner, 1.6) * rim;

    // Organic undulation + fine baked-surface irregularity (kept gentle so
    // the sides don't cave inward).
    const d =
      0.042 * fbm(x * 1.7 + 3.1, y * 1.7 - 1.2, z * 1.7) +
      0.018 * fbm(x * 6.1, y * 6.1 + 7.7, z * 6.1 - 2.4);
    x += sx * d;
    y += sy * d;
    z += sz * d * 0.7;

    pos.setXYZ(i, x, y, z);
  }

  // Weld the sphere's UV seam and poles so normals smooth cleanly.
  geo = mergeVertices(geo, 1e-4);
  geo.computeVertexNormals();
  addVertexColors(geo);
  return geo;
}

// Procedural studio lighting — no external HDR fetches.
function Env() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return null;
}

/* ------------------------------ galaxy ------------------------------ */

const GALAXY_R = 2.55;
const GALAXY_R0 = 0.85; // dust band starts just past the chip's silhouette
const DUST_FINE = 380;
const DUST_COARSE = 130;
const STARS = 54;
const MINIS = 10;

// Dust disc with two faint spiral arms. Density peaks near the core and the
// per-point color fades with radius, so the disc dissolves into space with
// no visible outer edge.
function makeDust(count: number, seed: number) {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const gold = new THREE.Color("#d8b55b");
  const pale = new THREE.Color("#e8cd8a");
  const col = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Density peaks just outside the chip (the inner disc would be hidden
    // behind it) and dissolves outward with no visible edge.
    const band = Math.pow(rand(), 0.8);
    const r = GALAXY_R0 + band * (GALAXY_R - GALAXY_R0);
    let phi: number;
    if (rand() < 0.55) {
      // Two-armed spiral: angle advances with radius, with gaussian spread.
      const arm = rand() < 0.5 ? 0 : Math.PI;
      const spread = (rand() + rand() + rand() - 1.5) * 0.5;
      phi = arm + r * 1.9 + spread;
    } else {
      phi = rand() * Math.PI * 2;
    }
    const thin = 0.04 + 0.06 * (1 - band);
    positions[i * 3] = Math.cos(phi) * r;
    positions[i * 3 + 1] = Math.sin(phi) * r;
    positions[i * 3 + 2] = (rand() - 0.5) * 2 * thin;

    const fade = Math.pow(1 - band, 1.2) * (0.55 + 0.45 * rand()) * 1.15;
    col.copy(rand() < 0.3 ? pale : gold).multiplyScalar(fade);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  return { positions, colors };
}

// A sparse scatter of distant specks so the disc sits in space rather than
// on a black void.
function makeStars(count: number, seed: number) {
  const rand = mulberry32(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const col = new THREE.Color();
  const tint = new THREE.Color("#e8dcc0");

  for (let i = 0; i < count; i++) {
    const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)
      .normalize()
      .multiplyScalar(1.7 + rand() * 1.2);
    positions[i * 3] = d.x;
    positions[i * 3 + 1] = d.y;
    positions[i * 3 + 2] = d.z * 0.4;
    col.copy(tint).multiplyScalar(0.06 + rand() * 0.16);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  return { positions, colors };
}

// Dust material with a depth-aware fade injected into the stock points
// shader: brightness eases from full (world z ≤ 0.05) to half (z ≥ 0.35).
// With the disc now riding at z≈+1 — fully forward of the deep-set chip —
// the whole field sits past the fade knee and renders as a uniform ~50%
// veil. That soft-focus dust is part of the hand-tuned look; don't remove
// the fade thinking it's inert.
function makeDustMaterial(size: number, opacity: number) {
  const mat = new THREE.PointsMaterial({
    vertexColors: true,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vWorldZ;")
      .replace(
        "#include <project_vertex>",
        "vWorldZ = ( modelMatrix * vec4( transformed, 1.0 ) ).z;\n\t#include <project_vertex>"
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vWorldZ;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n\tdiffuseColor.rgb *= mix( 1.0, 0.5, smoothstep( 0.05, 0.35, vWorldZ ) );"
      );
  };
  return mat;
}

interface Mini {
  phi: number;
  radius: number;
  z: number;
  scale: number;
  rect: boolean;
  base: THREE.Quaternion;
  axis: THREE.Vector3;
  tumble: number;
  speed: number;
}

// The whole galaxy lives on a tilted transversal plane, position/rotation/
// scale driven by the DebugPanel tune (rest values in DEFAULT_TUNE: z=+1,
// rotation [-0.87, -0.05, -0.35], scale 0.855 — Matias's hand-tuned
// composition). The plane rides well in front of the deep-set chip, so the
// dust field reads as a translucent veil the product floats behind (see
// makeDustMaterial for the brightness fade). Minis (nested z=-0.5) and
// stars (nested z=-1) hang back within the group, giving the field its
// depth spread. It spins on its own and never follows the cursor.
function Galaxy({
  geometry,
  z,
  scale,
  rx,
  ry,
  rz,
}: {
  geometry: THREE.BufferGeometry;
  z: number;
  scale: number;
  rx: number;
  ry: number;
  rz: number;
}) {
  const dustSpin = useRef<THREE.Group>(null);
  const inst = useRef<THREE.InstancedMesh>(null);

  const fine = useMemo(() => makeDust(DUST_FINE, 41), []);
  const coarse = useMemo(() => makeDust(DUST_COARSE, 87), []);
  const stars = useMemo(() => makeStars(STARS, 133), []);

  // Point sizes are pre-multiplied by the group scale (gl_PointSize ignores
  // object scale), so the dust grain matches the old z=-1 look exactly.
  const fineMat = useMemo(() => makeDustMaterial(0.029, 0.7), []);
  const coarseMat = useMemo(() => makeDustMaterial(0.05, 0.55), []);
  useEffect(
    () => () => {
      fineMat.dispose();
      coarseMat.dispose();
    },
    [fineMat, coarseMat]
  );

  const minis = useMemo<Mini[]>(() => {
    const rand = mulberry32(99);
    return Array.from({ length: MINIS }, (_, i) => {
      const radius = 1.5 + rand() * 0.5;
      return {
        phi: (i / MINIS) * Math.PI * 2 + (rand() - 0.5) * 0.5,
        radius,
        z: (rand() - 0.5) * 0.4,
        scale: 0.05 + rand() * 0.055,
        // Every third mini is stretched into the rectangular 100 g batch shape.
        rect: i % 3 === 0,
        base: new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2)
        ),
        axis: new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize(),
        tumble: 0.15 + rand() * 0.35,
        // Differential rotation: inner minis orbit a touch faster.
        speed: 0.04 * (1.75 / radius) + rand() * 0.01,
      };
    });
  }, []);

  const helper = useMemo(
    () => ({ obj: new THREE.Object3D(), q: new THREE.Quaternion() }),
    []
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;

    if (dustSpin.current) dustSpin.current.rotation.z += dt * 0.045;

    const im = inst.current;
    if (im) {
      for (let i = 0; i < minis.length; i++) {
        const c = minis[i];
        const phi = c.phi + t * c.speed;
        // Manual elliptical orbit (y squashed) so the mini shapes themselves
        // stay undistorted.
        helper.obj.position.set(
          Math.cos(phi) * c.radius,
          Math.sin(phi) * c.radius * 0.5,
          c.z
        );
        helper.obj.quaternion
          .copy(c.base)
          .multiply(helper.q.setFromAxisAngle(c.axis, t * c.tumble));
        helper.obj.scale.set(
          c.scale * (c.rect ? 1.8 : 1),
          c.scale,
          c.scale * (c.rect ? 1.05 : 1)
        );
        helper.obj.updateMatrix();
        im.setMatrixAt(i, helper.obj.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, z]} rotation={[rx, ry, rz]} scale={scale}>
      {/* Squash → spin → circular disc = an ellipse with fixed axes that
          rotates in place instead of tumbling. */}
      <group scale={[1, 0.5, 1]}>
        <group ref={dustSpin}>
          <points frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[fine.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[fine.colors, 3]} />
            </bufferGeometry>
            <primitive object={fineMat} attach="material" />
          </points>
          <points frustumCulled={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[coarse.positions, 3]} />
              <bufferAttribute attach="attributes-color" args={[coarse.colors, 3]} />
            </bufferGeometry>
            <primitive object={coarseMat} attach="material" />
          </points>
        </group>
      </group>

      {/* Minis ride slightly behind the disc plane, drifting between the
          dust and the deep-set chip. */}
      <group position={[0, 0, -0.5]}>
        <instancedMesh ref={inst} args={[geometry, undefined, MINIS]} frustumCulled={false}>
          <meshPhysicalMaterial
            vertexColors
            roughness={0.72}
            sheen={0.35}
            sheenRoughness={0.9}
            sheenColor="#ffe9bf"
            envMapIntensity={0.24}
          />
        </instancedMesh>
      </group>

      {/* Stars hang furthest back in the group, a sparse backdrop. */}
      <group position={[0, 0, -1]}>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[stars.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[stars.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={0.028}
            sizeAttenuation
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      </group>
    </group>
  );
}

/* ----------------------------- hero chip ----------------------------- */

interface ChipSceneProps {
  pointer: MutableRefObject<{ x: number; y: number }>;
  spin: MutableRefObject<number>;
  hovered: MutableRefObject<boolean>;
  chipScale: number;
  tuneRef: MutableRefObject<Tune>;
  galaxy: Tune["galaxy"];
}

function ChipScene({ pointer, spin, hovered, chipScale, tuneRef, galaxy }: ChipSceneProps) {
  const rig = useRef<THREE.Group>(null);
  const spinner = useRef<THREE.Group>(null);

  const geometry = useMemo(() => createChipGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const rg = rig.current;
    const sp = spinner.current;
    if (!rg || !sp) return;

    const offset = tuneRef.current.chip;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.1);
    const k = 1 - Math.exp(-5 * dt);

    // Face the cursor with weighty, damped motion.
    rg.rotation.y += (pointer.current.x * 0.55 - rg.rotation.y) * k;
    rg.rotation.x += (pointer.current.y * 0.42 - rg.rotation.x) * k;

    // Slight positional parallax plus a slow idle float, offset by the
    // (normally zero) debug-panel nudge.
    rg.position.x += (pointer.current.x * 0.13 + offset.x - rg.position.x) * k;
    const bobY = Math.sin(t * 0.8) * 0.05 - pointer.current.y * 0.09;
    rg.position.y += (bobY + offset.y - rg.position.y) * k;
    rg.position.z += (offset.z - rg.position.z) * k;

    // Click-to-spin settles with its own softer damping.
    sp.rotation.y += (spin.current - sp.rotation.y) * (1 - Math.exp(-3.2 * dt));

    const target = hovered.current ? 1.05 : 1;
    rg.scale.setScalar(rg.scale.x + (target - rg.scale.x) * k);
  });

  return (
    <>
      {/* Rig starts at the tuned rest depth so there's no settle drift on
          load; the frame loop keeps z pinned to tune.chip.z (-1.07). */}
      <group ref={rig} position={[0, 0, -1.07]}>
        <group ref={spinner}>
          {/* Diamond orientation with a slight casual tilt, as photographed.
              Scaled down so it reads like the real ~2 cm crisp. */}
          <mesh geometry={geometry} rotation={[0.1, 0, Math.PI / 4 + 0.05]} scale={chipScale}>
            <meshPhysicalMaterial
              vertexColors
              roughness={0.72}
              sheen={0.26}
              sheenRoughness={0.85}
              sheenColor="#ffe9bf"
              clearcoat={0.02}
              clearcoatRoughness={0.7}
              envMapIntensity={0.12}
            />
          </mesh>
        </group>
      </group>

      <Galaxy geometry={geometry} z={galaxy.z} scale={galaxy.scale} rx={galaxy.rx} ry={galaxy.ry} rz={galaxy.rz} />
    </>
  );
}

/* ------------------------- floating highlights ------------------------- */

// Each connector filament is a hand-tuned bezier in the 0–100 viewBox of the
// square hero container: it rises just outside the galaxy band (`from`),
// waves once or twice, and dies out just short of its label (`to`) — no two
// curves alike. `dur`/`begin` drive the traveling spark, `delay` staggers the
// shimmer so the six lines never breathe in unison.
//
// From sm: up the labels float well beyond the galaxy's outer edge (chip =
// planet, aura = atmosphere, labels = satellites past it), so the desktop
// paths run long to bridge the gap. On phones there is no room for that —
// the three mobile lines keep their original short runs in `mob`, matching
// the labels' compact mobile positions in `pos`.
interface Connector {
  d: string;
  from: [number, number];
  to: [number, number];
  dur: number;
  begin: number;
  delay: number;
  mob?: { d: string; to: [number, number]; dur: number };
}

const HIGHLIGHTS: {
  text: string;
  pos: string;
  depth: number;
  duration: number;
  delay: number;
  mobile: boolean;
  conn: Connector;
}[] = [
  {
    text: "Rich in BCAAs",
    pos: "top-[5%] left-[1%] sm:top-[1%] sm:left-[-23.5%]",
    depth: 10, duration: 6.5, delay: 0, mobile: true,
    conn: {
      d: "M 22 32 C 15 27, 19 21, 14.5 16 S 12 13, 14 10.5 C 9 8.5, 1 10, -7 5.5 C -11 4.3, -13.5 6.8, -17.5 5.3",
      from: [22, 32], to: [-17.5, 5.3], dur: 10, begin: -1, delay: 0,
      mob: { d: "M 22 32 C 15 27, 19 21, 14.5 16 S 12 13, 14 10.5", to: [14, 10.5], dur: 7.5 },
    },
  },
  {
    text: "High in Leucine",
    pos: "top-[7%] right-[-20.4%]",
    depth: 14, duration: 7.5, delay: 1.2, mobile: false,
    conn: { d: "M 72 31 C 80 27, 68 24, 75 19.5 S 74 14, 84.4 11", from: [72, 31], to: [84.4, 11], dur: 9.5, begin: -4, delay: 1.5 },
  },
  {
    text: "Essential Amino Acids",
    pos: "top-[58.9%] left-[-54.1%]",
    depth: 7, duration: 8, delay: 0.6, mobile: false,
    conn: { d: "M 30 69 C 21 72.5, 18 70, 12 67.2 S 0 69.5, -8 66.5 S -16 67, -20 64.8 C -26 61.5, -36 66.5, -48 62.7", from: [30, 69], to: [-48, 62.7], dur: 11.5, begin: -2.5, delay: 3 },
  },
  {
    text: "Vitamin B12",
    pos: "top-[44%] right-[-8%] sm:top-[43%] sm:right-[-34.1%]",
    depth: 12, duration: 6, delay: 1.8, mobile: true,
    conn: {
      d: "M 82 62 C 90 58, 81 54, 86.5 51.5 S 88 47.5, 94 46 C 98 45.2, 101.5 47.2, 106 46",
      from: [82, 62], to: [106, 46], dur: 8.5, begin: -6, delay: 4.5,
      mob: { d: "M 82 62 C 90 58, 81 54, 86.5 51.5", to: [86.5, 51.5], dur: 7 },
    },
  },
  {
    text: "Calcium",
    pos: "bottom-[8%] left-[3%] sm:bottom-[-3%] sm:left-[-31.5%]",
    depth: 13, duration: 7, delay: 0.9, mobile: true,
    conn: {
      d: "M 34 74 C 24 76.5, 26 82, 15 85.8 S 2 88, -2 93 S -9 97.5, -11 99.5 C -15.5 101, -22 97.8, -27.5 99.3",
      from: [34, 74], to: [-27.5, 99.3], dur: 12, begin: -3, delay: 6,
      mob: { d: "M 34 74 C 24 76.5, 26 82, 15 85.8", to: [15, 85.8], dur: 9.5 },
    },
  },
  {
    text: "Phosphorus",
    pos: "bottom-[-5%] right-[-6.7%]",
    depth: 8, duration: 8.5, delay: 2.1, mobile: false,
    conn: { d: "M 64 78 C 73 80.5, 66 86, 76 90.3 S 69.5 96.5, 80.5 100.5", from: [64, 78], to: [80.5, 100.5], dur: 9.5, begin: -5, delay: 7.5 },
  },
];

// Gold filaments drawn from just outside the orbit to each label — thin,
// asymmetric, shimmering slowly, with the occasional spark drifting along
// them. They parallax at a shallow depth so they sit between the galaxy and
// the labels; the per-path gradient fades them in from the orbit so they
// look pulled outward rather than pinned on.
function ConnectorLines({ sx, sy }: { sx: MotionValue<number>; sy: MotionValue<number> }) {
  const x = useTransform(sx, (v) => v * 5);
  const y = useTransform(sy, (v) => v * 5);

  // Flatten each highlight into breakpoint-scoped runs: the long desktop
  // path always renders from sm: up; a mobile-visible highlight adds its
  // original short run below sm. Gradient endpoints track each run's own
  // from/to, so every run needs its own gradient.
  const runs = HIGHLIGHTS.flatMap((h, i) => {
    const desk = {
      id: `conn-${i}`,
      cls: "hidden sm:block",
      d: h.conn.d,
      from: h.conn.from,
      to: h.conn.to,
      dur: h.conn.dur,
      begin: h.conn.begin,
      delay: h.conn.delay,
    };
    return h.mobile && h.conn.mob
      ? [desk, { ...desk, id: `conn-${i}-m`, cls: "sm:hidden", d: h.conn.mob.d, to: h.conn.mob.to, dur: h.conn.mob.dur }]
      : [desk];
  });

  return (
    <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0 z-[15]">
      <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          {runs.map((r) => (
            <linearGradient
              key={r.id}
              id={`${r.id}-grad`}
              gradientUnits="userSpaceOnUse"
              x1={r.from[0]}
              y1={r.from[1]}
              x2={r.to[0]}
              y2={r.to[1]}
            >
              <stop offset="0" stopColor="#d6b15a" stopOpacity="0" />
              <stop offset="0.22" stopColor="#d6b15a" stopOpacity="0.8" />
              <stop offset="0.85" stopColor="#dfc07a" stopOpacity="1" />
              <stop offset="1" stopColor="#e8cd8a" stopOpacity="0.5" />
            </linearGradient>
          ))}
        </defs>
        {runs.map((r) => (
          <g key={r.id} className={r.cls}>
            <path
              id={`${r.id}-path`}
              d={r.d}
              fill="none"
              stroke={`url(#${r.id}-grad)`}
              strokeWidth={1.3}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="conn-line"
              style={{
                animationDelay: `${r.delay}s`,
                filter: "drop-shadow(0 0 3px rgba(214, 177, 90, 0.45))",
              }}
            />
            <circle className="conn-dot" r={0.5} fill="#eed9a4" opacity={0}>
              <animateMotion dur={`${r.dur}s`} begin={`${r.begin}s`} repeatCount="indefinite">
                <mpath href={`#${r.id}-path`} xlinkHref={`#${r.id}-path`} />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0;0.9;0.9;0"
                keyTimes="0;0.2;0.65;1"
                dur={`${r.dur}s`}
                begin={`${r.begin}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}
      </svg>
    </motion.div>
  );
}

function FloatLabel({
  pos,
  depth,
  duration,
  delay,
  mobile,
  sx,
  sy,
  nudge,
  children,
}: {
  pos: string;
  depth: number;
  duration: number;
  delay: number;
  mobile: boolean;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  nudge: { dx: number; dy: number };
  children: ReactNode;
}) {
  // Each label parallaxes at its own depth, drifting gently against the
  // cursor for a layered, dimensional feel. Positioning lives in `pos`
  // (Tailwind classes) so mobile and desktop can anchor differently.
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  return (
    <motion.div
      style={{ x, y }}
      className={`absolute ${pos} ${mobile ? "flex" : "hidden sm:flex"}`}
    >
      {/* Plain (non-framer) wrapper so the debug-panel nudge — normally
          {0,0} — applies instantly without waiting on the cursor springs. */}
      <div style={{ transform: `translate(${nudge.dx}px, ${nudge.dy}px)` }}>
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
          className="flex items-center gap-2 whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.19em] text-foreground/45"
          style={{ textShadow: "0 0 16px rgba(216, 181, 91, 0.3)" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold/50" />
          {children}
        </motion.span>
      </div>
    </motion.div>
  );
}

/* ------------------------------- export ------------------------------- */

export default function ChipVisual() {
  const pointer = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const hovered = useRef(false);

  // Live-tunable overrides for the debug panel — every field defaults to the
  // value already baked into the scene below, so leaving the panel alone
  // reproduces the committed look exactly. tuneRef mirrors the state for the
  // r3f frame loop, which can't read React state directly without going stale.
  const [tune, setTune] = useState<Tune>(() => JSON.parse(JSON.stringify(DEFAULT_TUNE)));
  const tuneRef = useRef(tune);
  useEffect(() => {
    tuneRef.current = tune;
  }, [tune]);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 18 });
  const sy = useSpring(my, { stiffness: 50, damping: 18 });

  // Track the cursor across the whole viewport so the chip feels aware of
  // it anywhere on the page, not only when hovering the canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const nx = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1));
      const ny = Math.max(-1, Math.min(1, (e.clientY / window.innerHeight) * 2 - 1));
      pointer.current.x = nx;
      pointer.current.y = ny;
      mx.set(-nx);
      my.set(-ny);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
      onClick={() => (spin.current += Math.PI * 2)}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
      role="img"
      aria-label="A baked-gold CROSTA Parmesan crisp floating inside a slowly rotating galaxy of gold dust and miniature crisps, with fine golden filaments flowing out past the galaxy to its nutrient labels, tilting toward your cursor"
      className="relative mx-auto h-[320px] w-[320px] cursor-pointer sm:h-[430px] sm:w-[430px]"
    >
      {/* Soft ambient glow behind the crisp — dialed well down so the crisp
          never reads as backlit plastic. */}
      <div className="absolute inset-14 rounded-full bg-gold/[0.045] blur-3xl" />

      {/* Grounding shadow — anchors it like a product shot. */}
      <div className="absolute bottom-[4%] left-1/2 h-8 w-2/5 -translate-x-1/2 rounded-[50%] bg-black/55 blur-xl" />

      <Canvas
        className="relative z-10"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Env />
        <ambientLight intensity={0.08} color="#fff4e0" />
        <directionalLight position={[4, 5, 1.5]} intensity={0.46} color="#ffe2ae" />
        <directionalLight position={[-3.5, -2, 2.5]} intensity={0.28} color="#d8b55b" />
        <directionalLight position={[0, 2, -4]} intensity={0.4} color="#e8cd8a" />
        <ChipScene
          pointer={pointer}
          spin={spin}
          hovered={hovered}
          chipScale={tune.chip.scale}
          tuneRef={tuneRef}
          galaxy={tune.galaxy}
        />
      </Canvas>

      {/* Filaments flowing from the orbit out to each nutrient label. */}
      <ConnectorLines sx={sx} sy={sy} />

      {/* Floating nutrient highlights — quiet, parallaxed, never competing
          with the chip. */}
      <div className="pointer-events-none absolute inset-0 z-20">
        {HIGHLIGHTS.map((h, i) => (
          <FloatLabel
            key={h.text}
            pos={h.pos}
            depth={h.depth}
            duration={h.duration}
            delay={h.delay}
            mobile={h.mobile}
            sx={sx}
            sy={sy}
            nudge={tune.labels[i]}
          >
            {h.text}
          </FloatLabel>
        ))}
      </div>
    </motion.div>

    {/* TEMP — dev-only tuning panel, tree-shaken out of production builds.
        Portaled to <body> so it isn't clipped by the hero's own transform. */}
    {process.env.NODE_ENV !== "production" &&
      typeof document !== "undefined" &&
      createPortal(
        <DebugPanel tune={tune} setTune={setTune} labelNames={HIGHLIGHTS.map((h) => h.text)} />,
        document.body
      )}
    </>
  );
}
