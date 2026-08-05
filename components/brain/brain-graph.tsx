"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The "brain" — a rotating 3D node graph in the Obsidian graph-view idiom
 * (spec §7): connected nodes, always moving, sci-fi.
 *
 * The clusters are real: one per business plus one per workspace panel, so the
 * visual is a picture of the command center rather than decoration. Motion is
 * sinusoidal per-node rather than a force simulation — it reads the same at
 * this scale and costs almost nothing on a screen that stays open all day.
 */

interface Cluster {
  label: string;
  /** Node count in this cluster. */
  size: number;
  color: number;
}

const CLUSTERS: Cluster[] = [
  { label: "nashville-mma", size: 9, color: 0x22d3ee },
  { label: "fighters-boxing", size: 8, color: 0x22d3ee },
  { label: "growth-factor-ai", size: 11, color: 0x8b5cf6 },
  { label: "fuel-fortress", size: 7, color: 0x34d399 },
  { label: "aeterna-club", size: 8, color: 0x34d399 },
  { label: "furst-place-mma", size: 7, color: 0x22d3ee },
  { label: "drhoward-compass", size: 7, color: 0xfbbf24 },
  { label: "megatron", size: 10, color: 0x8b5cf6 },
  { label: "claude-code", size: 10, color: 0x22d3ee },
  { label: "workspace", size: 12, color: 0x64748b },
];

const NODE_COUNT = CLUSTERS.reduce((sum, c) => sum + c.size, 0);
const RADIUS = 4.2;

/** Deterministic PRNG so the graph looks the same on every load. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Soft round sprite for the point material — keeps nodes from looking square. */
function makeDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.85)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function BrainGraph({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
    camera.position.set(0, 0, 10);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    // The graph rotates inside `group`; `stretch` widens the whole thing to fill
    // a header band that is much wider than it is tall. Stretching the parent
    // keeps the rotation itself circular — scaling the rotating group would make
    // it wobble as it turns.
    const stretch = new THREE.Group();
    const group = new THREE.Group();
    stretch.add(group);
    scene.add(stretch);

    // ---- layout -------------------------------------------------------
    const random = rng(0x6c6d6e);
    const base = new Float32Array(NODE_COUNT * 3);
    const colors = new Float32Array(NODE_COUNT * 3);
    const sizes = new Float32Array(NODE_COUNT);
    const phase = new Float32Array(NODE_COUNT);
    // Which cluster each node belongs to, so edges can prefer siblings.
    const clusterOf = new Int32Array(NODE_COUNT);

    let node = 0;
    CLUSTERS.forEach((cluster, clusterIndex) => {
      // Cluster centre on a sphere, spread by the golden angle.
      const t = (clusterIndex + 0.5) / CLUSTERS.length;
      const inclination = Math.acos(1 - 2 * t);
      const azimuth = clusterIndex * 2.399963;
      const center = new THREE.Vector3(
        Math.sin(inclination) * Math.cos(azimuth),
        Math.sin(inclination) * Math.sin(azimuth) * 0.62,
        Math.cos(inclination),
      ).multiplyScalar(RADIUS);

      const color = new THREE.Color(cluster.color);
      for (let i = 0; i < cluster.size; i++) {
        const spread = i === 0 ? 0 : 0.75 + random() * 0.95;
        const dir = new THREE.Vector3(
          random() * 2 - 1,
          random() * 2 - 1,
          random() * 2 - 1,
        ).normalize();
        const p = center.clone().addScaledVector(dir, spread);

        base[node * 3] = p.x;
        base[node * 3 + 1] = p.y;
        base[node * 3 + 2] = p.z;

        // Hub node of each cluster is brighter and larger.
        const shade = i === 0 ? 1 : 0.55 + random() * 0.3;
        colors[node * 3] = color.r * shade;
        colors[node * 3 + 1] = color.g * shade;
        colors[node * 3 + 2] = color.b * shade;

        sizes[node] = i === 0 ? 20 : 7 + random() * 7;
        phase[node] = random() * Math.PI * 2;
        clusterOf[node] = clusterIndex;
        node++;
      }
    });

    const live = new Float32Array(base);

    // ---- nodes --------------------------------------------------------
    const dotTexture = makeDotTexture();
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute("position", new THREE.BufferAttribute(live, 3));
    nodeGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    nodeGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Per-point sizing needs a shader; PointsMaterial only takes one size.
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: dotTexture }, uScale: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float size;
        varying vec3 vColor;
        uniform float uScale;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          // Perspective sizing: the constant sets on-screen pixels at the
          // camera's working distance, so nodes stay visible without ballooning
          // as the graph rotates toward the viewer.
          gl_PointSize = size * uScale * (16.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTexture;
        varying vec3 vColor;
        void main() {
          vec4 tex = texture2D(uTexture, gl_PointCoord);
          if (tex.a < 0.02) discard;
          gl_FragColor = vec4(vColor, tex.a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });
    const points = new THREE.Points(nodeGeometry, nodeMaterial);
    group.add(points);

    // ---- edges --------------------------------------------------------
    // Mostly intra-cluster, with a few long links so the graph reads as one
    // connected brain rather than ten separate blobs.
    const pairs: Array<[number, number]> = [];
    let clusterStart = 0;
    CLUSTERS.forEach((cluster) => {
      const hub = clusterStart;
      for (let i = 1; i < cluster.size; i++) {
        pairs.push([hub, clusterStart + i]);
        if (random() > 0.55 && i > 1) {
          pairs.push([clusterStart + i, clusterStart + 1 + Math.floor(random() * (i - 1))]);
        }
      }
      clusterStart += cluster.size;
    });
    for (let i = 0; i < 26; i++) {
      const a = Math.floor(random() * NODE_COUNT);
      const b = Math.floor(random() * NODE_COUNT);
      if (a !== b && clusterOf[a] !== clusterOf[b]) pairs.push([a, b]);
    }

    const edgePositions = new Float32Array(pairs.length * 6);
    const edgeColors = new Float32Array(pairs.length * 6);
    pairs.forEach(([a, b], i) => {
      for (let k = 0; k < 3; k++) {
        edgeColors[i * 6 + k] = colors[a * 3 + k] * 0.5;
        edgeColors[i * 6 + 3 + k] = colors[b * 3 + k] * 0.5;
      }
    });

    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(edgePositions, 3),
    );
    edgeGeometry.setAttribute("color", new THREE.BufferAttribute(edgeColors, 3));
    const edgeMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(lines);

    function writeEdges() {
      pairs.forEach(([a, b], i) => {
        for (let k = 0; k < 3; k++) {
          edgePositions[i * 6 + k] = live[a * 3 + k];
          edgePositions[i * 6 + 3 + k] = live[b * 3 + k];
        }
      });
      edgeGeometry.attributes.position.needsUpdate = true;
    }

    // ---- interaction / sizing -----------------------------------------
    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Keep node sizes stable across viewport heights.
      nodeMaterial.uniforms.uScale.value = Math.max(0.55, h / 220);
      // Fill the band horizontally without letting the graph leave the top and
      // bottom edges: the wider the header, the further the nodes spread.
      stretch.scale.x = Math.min(3.4, Math.max(1, w / h / 3.4));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    // ---- loop ---------------------------------------------------------
    let frame = 0;
    const start = performance.now();

    function draw(now: number) {
      const t = (now - start) / 1000;

      for (let i = 0; i < NODE_COUNT; i++) {
        const drift = 0.16;
        live[i * 3] = base[i * 3] + Math.sin(t * 0.45 + phase[i]) * drift;
        live[i * 3 + 1] =
          base[i * 3 + 1] + Math.cos(t * 0.38 + phase[i] * 1.3) * drift;
        live[i * 3 + 2] =
          base[i * 3 + 2] + Math.sin(t * 0.31 + phase[i] * 0.7) * drift;
      }
      nodeGeometry.attributes.position.needsUpdate = true;
      writeEdges();

      group.rotation.y = t * 0.11 + pointer.x * 0.28;
      group.rotation.x = Math.sin(t * 0.17) * 0.14 + pointer.y * 0.16;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      writeEdges();
      group.rotation.set(0.12, 0.6, 0);
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      nodeGeometry.dispose();
      edgeGeometry.dispose();
      nodeMaterial.dispose();
      edgeMaterial.dispose();
      dotTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
