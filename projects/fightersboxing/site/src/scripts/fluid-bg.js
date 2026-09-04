// Ambient fluid gradient: vanilla port of the PixelLiquidBg component Ben
// supplied (React/Next original), trimmed to what this site uses: no theme
// switching (light site), no viscous pass, no bounce boundary. Tuned per
// Ben: lighter ground, brighter but faded red (not pink), slower drift,
// minimal grain.
import {
  WebGLRenderer,
  WebGLRenderTarget,
  Scene,
  Camera,
  Mesh,
  PlaneGeometry,
  RawShaderMaterial,
  DataTexture,
  Color,
  Vector2,
  Vector4,
  Clock,
  HalfFloatType,
  RGBAFormat,
  LinearFilter,
  NearestFilter,
  ClampToEdgeWrapping,
  RepeatWrapping,
  AdditiveBlending,
} from 'three';

const face_vert = `
attribute vec3 position;
uniform vec2 px;
uniform vec2 boundarySpace;
varying vec2 uv;
precision highp float;
void main(){
  vec3 pos = position;
  vec2 scale = 1.0 - boundarySpace * 2.0;
  pos.xy = pos.xy * scale;
  uv = vec2(0.5) + pos.xy * 0.5;
  gl_Position = vec4(pos, 1.0);
}
`;

const mouse_vert = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 pos = position.xy * scale * 2.0 * px + center;
  vUv = uv;
  gl_Position = vec4(pos, 0.0, 1.0);
}
`;

const advection_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 fboSize;
uniform vec2 px;
varying vec2 uv;
void main(){
  vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
  vec2 vel = texture2D(velocity, uv).xy;
  vec2 uv2 = uv - vel * dt * ratio;
  vec2 newVel = texture2D(velocity, uv2).xy;
  gl_FragColor = vec4(newVel, 0.0, 0.0);
}
`;

const externalForce_frag = `
precision highp float;
uniform vec2 force;
uniform vec2 center;
uniform vec2 scale;
uniform vec2 px;
varying vec2 vUv;
void main(){
  vec2 circle = (vUv - 0.5) * 2.0;
  float d = 1.0 - min(length(circle), 1.0);
  d *= d;
  gl_FragColor = vec4(force * d, 0.0, 1.0);
}
`;

const divergence_frag = `
precision highp float;
uniform sampler2D velocity;
uniform float dt;
uniform vec2 px;
varying vec2 uv;
void main(){
  float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;
  float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;
  float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;
  float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;
  float divergence = (x1 - x0 + y1 - y0) / 2.0;
  gl_FragColor = vec4(divergence / dt);
}
`;

const poisson_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D divergence;
uniform vec2 px;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
  float div = texture2D(divergence, uv).r;
  float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
  gl_FragColor = vec4(newP);
}
`;

const pressure_frag = `
precision highp float;
uniform sampler2D pressure;
uniform sampler2D velocity;
uniform vec2 px;
uniform float dt;
varying vec2 uv;
void main(){
  float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;
  float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;
  float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;
  float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;
  vec2 v      = texture2D(velocity, uv).xy;
  vec2 gradP  = vec2(p0 - p1, p2 - p3) * 0.5;
  v = v - gradP * dt;
  gl_FragColor = vec4(v, 0.0, 1.0);
}
`;

// Softer than the source component: fluid intensity 1.4 (was 2.2), dither
// 0.06 (was 0.12), noise 0.04 band, grain 0.02 (was 0.085).
const color_frag = `
precision highp float;
uniform sampler2D velocity;
uniform sampler2D palette;
uniform sampler2D uBayer;
uniform vec4 bgColor;
uniform float uTime;
uniform vec2 uRes;
uniform float uPixelSize;

varying vec2 uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main(){
  vec2 pixGrid = uRes / uPixelSize;
  vec2 pixUV   = (floor(uv * pixGrid) + 0.5) / pixGrid;

  vec2 vel  = texture2D(velocity, pixUV).xy;
  float len = clamp(length(vel) * 1.4, 0.0, 1.0);

  vec2 bayerUV = (mod(floor(gl_FragCoord.xy), 4.0) + 0.5) / 4.0;
  float dither  = texture2D(uBayer, bayerUV).r - 0.5;

  float noiseVal = noise(uv * 6.0 + uTime * 0.1) * 0.04 - 0.02;

  float t = clamp(len + dither * 0.06 + noiseVal, 0.0, 1.0);

  vec3 fluidColor = texture2D(palette, vec2(t, 0.5)).rgb;
  vec3 col        = mix(bgColor.rgb, fluidColor, t);

  float grain = hash(gl_FragCoord.xy + vec2(uTime * 137.0, uTime * 91.0));
  col += (grain - 0.5) * 0.02;

  float alpha = mix(bgColor.a, 1.0, t);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
}
`;

// Faded bright red on white, not the source pink.
const PALETTE = ['#FFFFFF', '#FFE3DE', '#FFB3A8', '#F26D5E', '#E03A2E'];

function makePaletteTexture(stops) {
  const data = new Uint8Array(stops.length * 4);
  stops.forEach((s, i) => {
    const c = new Color(s);
    data[i * 4] = Math.round(c.r * 255);
    data[i * 4 + 1] = Math.round(c.g * 255);
    data[i * 4 + 2] = Math.round(c.b * 255);
    data[i * 4 + 3] = 255;
  });
  const tex = new DataTexture(data, stops.length, 1, RGBAFormat);
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function makeBayerTexture() {
  const raw = [0, 136, 34, 170, 204, 68, 238, 102, 51, 187, 17, 153, 255, 119, 221, 85];
  const data = new Uint8Array(16 * 4);
  raw.forEach((v, i) => {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  });
  const tex = new DataTexture(data, 4, 4, RGBAFormat);
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

class ShaderPass {
  constructor(renderer, frag, uniforms, output, vert = face_vert) {
    this.renderer = renderer;
    this.uniforms = uniforms;
    this.output = output;
    this.scene = new Scene();
    this.camera = new Camera();
    this.material = new RawShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms });
    this.geometry = new PlaneGeometry(2, 2);
    this.scene.add(new Mesh(this.geometry, this.material));
  }
  render(to = this.output) {
    const r = this.renderer();
    if (!r) return;
    r.setRenderTarget(to);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
  }
  dispose() {
    this.material.dispose();
    this.geometry.dispose();
  }
}

export function mountFluidBg(container, opts = {}) {
  const o = {
    resolution: 0.28,
    mouseForce: 5,
    cursorSize: 110,
    dt: 0.008,
    iterationsPoisson: 8,
    pixelSize: 14,
    autoSpeed: 0.22,      // was 0.45: Ben wants it slower
    autoIntensity: 1.2,   // was 2.4
    resumeDelay: 1500,
    opacity: 0.5,         // overall fade, per "not in your face"
    ...opts,
  };

  let width = 1;
  let height = 1;
  const rect = () => container.getBoundingClientRect();

  const renderer = new WebGLRenderer({ antialias: false, alpha: true });
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  const canvas = renderer.domElement;
  canvas.style.cssText =
    `position:absolute;inset:0;width:100%;height:100%;display:block;` +
    `pointer-events:none;opacity:${o.opacity};z-index:0;`;
  container.prepend(canvas);

  const clock = new Clock();
  clock.start();
  let time = 0;

  // --- mouse ---
  const coords = new Vector2();
  const coordsOld = new Vector2();
  const diff = new Vector2();
  let autoActive = false;
  let lastInteraction = performance.now();

  function setFromClient(cx, cy) {
    const r = rect();
    if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
    lastInteraction = performance.now();
    coords.set(((cx - r.left) / r.width) * 2 - 1, -(((cy - r.top) / r.height) * 2 - 1));
  }
  const onMove = (e) => setFromClient(e.clientX, e.clientY);
  const onTouch = (e) => {
    if (e.touches.length === 1) setFromClient(e.touches[0].clientX, e.touches[0].clientY);
  };
  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  window.addEventListener('touchstart', onTouch, { passive: true });

  // --- auto driver ---
  const autoCurrent = new Vector2();
  const autoTarget = new Vector2(
    (Math.random() * 2 - 1) * 0.8,
    (Math.random() * 2 - 1) * 0.8
  );
  let autoLast = performance.now();
  const tmp = new Vector2();
  function autoUpdate() {
    const now = performance.now();
    if (now - lastInteraction < o.resumeDelay) {
      autoActive = false;
      autoLast = now;
      return;
    }
    autoActive = true;
    const dt = Math.min((now - autoLast) / 1000, 0.05);
    autoLast = now;
    const dir = tmp.subVectors(autoTarget, autoCurrent);
    const dist = dir.length();
    if (dist < 0.02) {
      autoTarget.set((Math.random() * 2 - 1) * 0.8, (Math.random() * 2 - 1) * 0.8);
      return;
    }
    dir.normalize();
    autoCurrent.addScaledVector(dir, Math.min(o.autoSpeed * dt, dist));
    coords.copy(autoCurrent);
  }

  // --- sim state ---
  const fboSize = new Vector2();
  const cellScale = new Vector2();
  const r = () => renderer;

  function calcSize() {
    const w = Math.max(1, Math.round(o.resolution * width));
    const h = Math.max(1, Math.round(o.resolution * height));
    cellScale.set(1 / w, 1 / h);
    fboSize.set(w, h);
  }

  function makeFBO() {
    return new WebGLRenderTarget(fboSize.x, fboSize.y, {
      type: HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      wrapS: ClampToEdgeWrapping,
      wrapT: ClampToEdgeWrapping,
    });
  }

  function resize() {
    const rc = rect();
    width = Math.max(1, Math.floor(rc.width));
    height = Math.max(1, Math.floor(rc.height));
    renderer.setSize(width, height, false);
    calcSize();
    for (const k in fbos) fbos[k].setSize(fboSize.x, fboSize.y);
    outputUniforms.uRes.value.set(width, height);
  }

  const rc0 = rect();
  width = Math.max(1, Math.floor(rc0.width));
  height = Math.max(1, Math.floor(rc0.height));
  renderer.setSize(width, height, false);
  calcSize();

  const fbos = {};
  for (const n of ['vel_0', 'vel_1', 'div', 'p0', 'p1']) fbos[n] = makeFBO();

  const advection = new ShaderPass(
    r,
    advection_frag,
    {
      boundarySpace: { value: cellScale },
      px: { value: cellScale },
      fboSize: { value: fboSize },
      velocity: { value: fbos.vel_0.texture },
      dt: { value: o.dt },
    },
    fbos.vel_1
  );

  const efScene = new Scene();
  const efCam = new Camera();
  const efMesh = new Mesh(
    new PlaneGeometry(1, 1),
    new RawShaderMaterial({
      vertexShader: mouse_vert,
      fragmentShader: externalForce_frag,
      blending: AdditiveBlending,
      depthWrite: false,
      uniforms: {
        px: { value: cellScale },
        force: { value: new Vector2() },
        center: { value: new Vector2() },
        scale: { value: new Vector2(o.cursorSize, o.cursorSize) },
      },
    })
  );
  efScene.add(efMesh);

  const divergence = new ShaderPass(
    r,
    divergence_frag,
    {
      boundarySpace: { value: cellScale },
      velocity: { value: fbos.vel_1.texture },
      px: { value: cellScale },
      dt: { value: o.dt },
    },
    fbos.div
  );

  const poisson = new ShaderPass(
    r,
    poisson_frag,
    {
      boundarySpace: { value: cellScale },
      pressure: { value: fbos.p0.texture },
      divergence: { value: fbos.div.texture },
      px: { value: cellScale },
    },
    fbos.p1
  );

  const pressure = new ShaderPass(
    r,
    pressure_frag,
    {
      boundarySpace: { value: cellScale },
      pressure: { value: fbos.p0.texture },
      velocity: { value: fbos.vel_1.texture },
      px: { value: cellScale },
      dt: { value: o.dt },
    },
    fbos.vel_0
  );

  const palette = makePaletteTexture(PALETTE);
  const bayer = makeBayerTexture();
  const outputUniforms = {
    velocity: { value: fbos.vel_0.texture },
    palette: { value: palette },
    uBayer: { value: bayer },
    bgColor: { value: new Vector4(1, 1, 1, 0) },
    uTime: { value: 0 },
    uRes: { value: new Vector2(width, height) },
    uPixelSize: { value: o.pixelSize },
    boundarySpace: { value: new Vector2() },
    px: { value: new Vector2() },
  };
  const outputPass = new ShaderPass(r, color_frag, outputUniforms, null);
  outputPass.material.transparent = true;
  outputPass.material.depthWrite = false;

  const ro = new ResizeObserver(resize);
  ro.observe(container);

  let raf = 0;
  let running = true;
  let visible = true;

  const vio = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  vio.observe(container);

  function simStep() {
    advection.render();

    diff.subVectors(coords, coordsOld);
    coordsOld.copy(coords);
    if (coordsOld.x === 0 && coordsOld.y === 0) diff.set(0, 0);
    if (autoActive) diff.multiplyScalar(o.autoIntensity);

    const cs = o.cursorSize;
    const cx = cellScale.x;
    const cy = cellScale.y;
    const u = efMesh.material.uniforms;
    u.force.value.set((diff.x / 2) * o.mouseForce, (diff.y / 2) * o.mouseForce);
    u.center.value.set(
      Math.min(Math.max(coords.x, -1 + cs * cx * 2 + cx * 2), 1 - cs * cx * 2 - cx * 2),
      Math.min(Math.max(coords.y, -1 + cs * cy * 2 + cy * 2), 1 - cs * cy * 2 - cy * 2)
    );
    renderer.setRenderTarget(fbos.vel_1);
    renderer.render(efScene, efCam);
    renderer.setRenderTarget(null);

    divergence.render();

    let pIn = fbos.p0;
    let pOut = fbos.p1;
    for (let i = 0; i < o.iterationsPoisson; i++) {
      [pIn, pOut] = i % 2 === 0 ? [fbos.p0, fbos.p1] : [fbos.p1, fbos.p0];
      poisson.uniforms.pressure.value = pIn.texture;
      poisson.render(pOut);
    }
    pressure.uniforms.pressure.value = pOut.texture;
    pressure.render();
  }

  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) return;
    autoUpdate();
    time += clock.getDelta();
    outputUniforms.uTime.value = time;
    simStep();
    renderer.setRenderTarget(null);
    renderer.render(outputPass.scene, outputPass.camera);
  }
  loop();

  return function dispose() {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    vio.disconnect();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('touchmove', onTouch);
    window.removeEventListener('touchstart', onTouch);
    for (const k in fbos) fbos[k].dispose();
    advection.dispose();
    divergence.dispose();
    poisson.dispose();
    pressure.dispose();
    outputPass.dispose();
    efMesh.material.dispose();
    efMesh.geometry.dispose();
    palette.dispose();
    bayer.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
