"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The Jarvis core: the centrepiece of the Command Center.
 *
 * It isn't only decoration — it's the agent's status light. Idle it drifts in
 * cyan; thinking it speeds up and shifts violet; working (a tool is running) it
 * runs hot with a sweeping arc. So the thing that looks cool is also how you
 * know, from across the room, whether it's doing something.
 */

export type CoreState = "idle" | "thinking" | "working";

interface StateStyle {
  /** Rotation speed multiplier. */
  speed: number;
  /** Overall brightness. */
  intensity: number;
  color: THREE.Color;
}

const STYLES: Record<CoreState, StateStyle> = {
  idle: { speed: 1, intensity: 0.62, color: new THREE.Color(0x22d3ee) },
  thinking: { speed: 2.4, intensity: 1, color: new THREE.Color(0x8b5cf6) },
  working: { speed: 3.6, intensity: 1.25, color: new THREE.Color(0x22d3ee) },
};

/** Arc segment counts per ring, and their tilts. */
const RINGS = [
  { radius: 1.15, arcs: 3, tilt: [0.42, 0, 0], speed: 0.55 },
  { radius: 1.5, arcs: 4, tilt: [-0.28, 0.5, 0.2], speed: -0.36 },
  { radius: 1.85, arcs: 2, tilt: [1.15, 0, 0.35], speed: 0.22 },
] as const;

export function JarvisCore({
  state = "idle",
  className,
}: {
  state?: CoreState;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Read by the animation loop without re-creating the scene on every change.
  const stateRef = useRef<CoreState>(state);
  stateRef.current = state;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
    camera.position.set(0, 0, 4.7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const root = new THREE.Group();
    scene.add(root);

    const materials: THREE.MeshBasicMaterial[] = [];

    // --- core ----------------------------------------------------------------
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const coreGeometry = new THREE.IcosahedronGeometry(0.52, 1);
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    root.add(core);
    materials.push(coreMaterial);

    // Wireframe shell around the core — the "contained energy" read.
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const shellGeometry = new THREE.IcosahedronGeometry(0.86, 1);
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    root.add(shell);
    materials.push(shellMaterial);

    // --- rings ---------------------------------------------------------------
    const ringGroups: Array<{ group: THREE.Group; speed: number }> = [];
    const ringGeometries: THREE.BufferGeometry[] = [];

    for (const ring of RINGS) {
      const group = new THREE.Group();
      group.rotation.set(ring.tilt[0], ring.tilt[1], ring.tilt[2]);

      const arcLength = (Math.PI * 2) / ring.arcs - 0.34; // gap between arcs
      for (let i = 0; i < ring.arcs; i++) {
        const geometry = new THREE.TorusGeometry(
          ring.radius,
          0.012,
          6,
          96,
          arcLength,
        );
        const material = new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
        });
        const arc = new THREE.Mesh(geometry, material);
        arc.rotation.z = ((Math.PI * 2) / ring.arcs) * i;
        group.add(arc);
        materials.push(material);
        ringGeometries.push(geometry);
      }

      root.add(group);
      ringGroups.push({ group, speed: ring.speed });
    }

    // --- particle halo -------------------------------------------------------
    const HALO_COUNT = 420;
    const haloPositions = new Float32Array(HALO_COUNT * 3);
    for (let i = 0; i < HALO_COUNT; i++) {
      // Even-ish spread on a shell, thicker near the equator.
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() * 2 - 1) * 0.55;
      const radius = 1.35 + Math.random() * 0.85;
      haloPositions[i * 3] = Math.cos(theta) * radius;
      haloPositions[i * 3 + 1] = y;
      haloPositions[i * 3 + 2] = Math.sin(theta) * radius;
    }
    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(haloPositions, 3),
    );
    const haloMaterial = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.028,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Points(haloGeometry, haloMaterial);
    root.add(halo);

    // --- sizing --------------------------------------------------------------
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    // --- loop ----------------------------------------------------------------
    // Eased so a state change ramps rather than snapping.
    let speed = STYLES.idle.speed;
    let intensity = STYLES.idle.intensity;
    const colour = STYLES.idle.color.clone();
    const start = performance.now();
    let frame = 0;
    let previous = start;

    function draw(now: number) {
      const elapsed = (now - start) / 1000;
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;

      const target = STYLES[stateRef.current];
      const ease = 1 - Math.pow(0.0015, dt); // ~time-independent lerp
      speed += (target.speed - speed) * ease;
      intensity += (target.intensity - intensity) * ease;
      colour.lerp(target.color, ease);

      for (const { group, speed: ringSpeed } of ringGroups) {
        group.rotation.z += ringSpeed * speed * dt;
        group.rotation.y += ringSpeed * 0.35 * speed * dt;
      }

      const pulse = 1 + Math.sin(elapsed * (1.4 + speed * 0.7)) * 0.06;
      core.scale.setScalar(pulse);
      shell.rotation.y -= 0.25 * speed * dt;
      shell.rotation.x += 0.12 * speed * dt;
      halo.rotation.y += 0.08 * speed * dt;

      for (const material of materials) {
        material.color.copy(colour);
      }
      coreMaterial.opacity = 0.55 + intensity * 0.35;
      shellMaterial.opacity = 0.18 + intensity * 0.22;
      haloMaterial.opacity = 0.3 + intensity * 0.45;

      root.rotation.y = Math.sin(elapsed * 0.12) * 0.25;
      root.rotation.x = Math.sin(elapsed * 0.09) * 0.12;

      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      renderer.render(scene, camera);
    } else {
      frame = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      coreGeometry.dispose();
      shellGeometry.dispose();
      haloGeometry.dispose();
      for (const geometry of ringGeometries) geometry.dispose();
      for (const material of materials) material.dispose();
      haloMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
