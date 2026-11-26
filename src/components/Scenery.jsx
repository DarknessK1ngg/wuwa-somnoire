import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { buildScenery } from '../scenery/textures'
import { bus } from '../bus'

const SHOTS = {
  intro: { x: 0, y: 0.02, zoom: 1.0, dim: 1 },
  map: { x: 0.35, y: -0.06, zoom: 1.08, dim: 0.95 },
  section: { x: -0.5, y: 0.1, zoom: 1.22, dim: 0.45 },
  inner: { x: 1.4, y: 0.2, zoom: 1.55, dim: 0.6 },
  char: { x: 1.9, y: 0.12, zoom: 1.35, dim: 0.42 },
}

const vert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const frag = /* glsl */ `
precision highp float;
uniform sampler2D tS, tF, tM, tN, gS, gF, gM, gN;
uniform vec2 uRes, uMouse, uVel;
uniform float uTime, uPan, uZoom, uDim, uFade, uSpeed, uMotion;
uniform vec2 uShot;
uniform vec4 uShock;
uniform vec3 uAura, uFog;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

vec2 toUv(vec2 q) { return vec2(q.x * 0.5 + 0.5, q.y + 0.5); }

void sampleLayer(sampler2D t, sampler2D g, vec2 p, float depth, out vec4 body, out float glow) {
  vec2 q = p / uZoom;
  q.x += (uPan + uShot.x) * depth;
  q.y += uShot.y * depth * 0.6;
  q -= uMouse * depth * 0.035;
  vec2 uv = toUv(q);
  if (uv.y < 0.0 || uv.y > 1.0) { body = vec4(0.0); glow = 0.0; return; }
  uv.x = fract(uv.x);
  body = texture2D(t, uv);
  float o = 0.0028;
  glow = texture2D(g, uv).a * 0.6
    + (texture2D(g, uv + vec2(o, 0.0)).a + texture2D(g, uv - vec2(o, 0.0)).a
     + texture2D(g, uv + vec2(0.0, o * 2.0)).a + texture2D(g, uv - vec2(0.0, o * 2.0)).a) * 0.18;
}

// Rising threads of light anchored to the ground.
float threads(vec2 p, float depth) {
  float x0 = p.x / uZoom + (uPan + uShot.x) * depth - uMouse.x * depth * 0.035;
  float acc = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float cx = (fi - 1.0) * 1.33 + 0.18;
    float cell = floor((x0 - cx + 2.0) / 4.0);
    float lx = mod(x0 - cx + 2.0, 4.0) - 2.0;
    float y = p.y;
    float wob = sin(y * 5.0 + uTime * 0.6 + fi * 2.0 + cell) * 0.05 * (0.6 + y)
              + sin(y * 13.0 - uTime * 1.1 + fi) * 0.012;
    float dist = abs(lx - wob);
    float fade = smoothstep(-0.55, -0.2, y) * smoothstep(0.55, 0.05, y);
    acc += (smoothstep(0.012, 0.0, dist) * 0.9 + smoothstep(0.08, 0.0, dist) * 0.25) * fade;
  }
  return acc;
}

// Embers and ash drifting up.
float motes(vec2 p, float scale, float speed, float seed) {
  vec2 g = p * scale + vec2(seed, -uTime * speed);
  vec2 c = floor(g);
  vec2 f = fract(g) - 0.5;
  float r = hash(c + seed);
  vec2 o = vec2(hash(c + 3.1) - 0.5, hash(c + 7.7) - 0.5) * 0.6;
  float d = length(f - o);
  float tw = 0.6 + 0.4 * sin(uTime * (1.0 + r * 3.0) + r * 20.0);
  return step(0.86, r) * smoothstep(0.08, 0.0, d) * tw;
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;

  // Lens: space bulges toward the viewer around the cursor and bends with its motion.
  vec2 d = p - uMouse;
  float f = exp(-dot(d, d) / 0.11);
  vec2 warp = -d * f * (0.085 + uSpeed) * uMotion - uVel * f * 0.22 * uMotion;

  // Shockwave ring.
  vec2 sd = p - uShock.xy;
  float sr = length(sd);
  float age = uTime - uShock.z;
  float R = age * 1.15;
  float band = exp(-pow((sr - R) / 0.06, 2.0)) * exp(-age * 1.4) * step(0.0, age);
  warp -= normalize(sd + 1e-5) * band * 0.08 * uShock.w;

  vec4 s, fa, m, n; float gs, gf, gm, gn;
  sampleLayer(tS, gS, p + warp * 0.35, 0.04, s, gs);
  sampleLayer(tF, gF, p + warp * 0.6, 0.22, fa, gf);
  sampleLayer(tM, gM, p + warp * 0.85, 0.5, m, gm);
  sampleLayer(tN, gN, p + warp * 1.1, 1.0, n, gn);

  // Dark atmosphere: the colour field behind shows through as a tint.
  float sky = smoothstep(-0.5, 0.6, p.y);
  vec3 col = uFog * 0.05;
  float a = mix(0.62, 0.42, sky);
  col = s.rgb * s.a + col * (1.0 - s.a); a = s.a + a * (1.0 - s.a);
  vec3 farC = mix(fa.rgb, uFog * 0.7, 0.3);
  col = farC * fa.a + col * (1.0 - fa.a); a = fa.a + a * (1.0 - fa.a);
  // haze band between far and mid
  float haze = smoothstep(-0.05, -0.3, p.y) * 0.25;
  col = mix(col, uFog * 0.9, haze * 0.5); a = max(a, haze);
  vec3 midC = mix(m.rgb, uFog, 0.12);
  col = midC * m.a + col * (1.0 - m.a); a = m.a + a * (1.0 - m.a);
  col = n.rgb * n.a + col * (1.0 - n.a); a = n.a + a * (1.0 - n.a);

  // Aura: light in the cracks, breathing.
  float pulse = 0.7 + 0.3 * sin(uTime * 1.3 + p.x * 4.0) * uMotion;
  float glow = gs * 0.5 + gf * 0.45 + gm * 0.95 + gn * 1.15;
  glow *= pulse;
  glow += band * 0.35 * uShock.w;
  glow += threads(p + warp * 0.9, 0.75) * 0.55 * (0.8 + 0.2 * sin(uTime * 2.0));
  // warm light pooling at the ground line
  glow += smoothstep(-0.25, -0.5, p.y) * 0.12 * pulse;
  vec3 aura = uAura * glow * 1.35 + vec3(1.0) * pow(glow, 3.0) * 0.35;
  col += aura; a = max(a, min(1.0, glow * 0.85));

  // Embers (gold) and ash (pale).
  float e = motes(p + warp, 26.0, 0.10, 1.0) + motes(p * 1.6 + warp, 26.0, 0.16, 9.0) * 0.7;
  float ash = motes(p * 0.8 + warp * 0.5, 34.0, 0.05, 4.0) * 0.5;
  col += uAura * e * 0.9 + vec3(0.85, 0.83, 0.95) * ash * 0.5; a = max(a, max(e * 0.9, ash * 0.5));

  // Vignette darkness.
  float vig = smoothstep(0.45, 1.25, length(p * vec2(0.85, 1.25)));
  a = a + vig * 0.55 * (1.0 - a);
  col *= 1.0 - vig * 0.35;

  gl_FragColor = vec4(col * uDim * uFade, a * uFade * mix(0.85, 1.0, uDim));
}
`

// Raw 0..1 rgb from a hex string (no colour-space conversion: the canvas outputs as-is).
function hex3(h, out = new THREE.Vector3()) {
  const c = new THREE.Color()
  c.setHex(parseInt(String(h).replace('#', ''), 16), THREE.LinearSRGBColorSpace)
  return out.set(c.r, c.g, c.b)
}

function tex(c) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  t.anisotropy = 4
  t.needsUpdate = true
  return t
}

function Plane({ shot, s, layers }) {
  const mat = useRef()
  const { size, gl } = useThree()
  const st = useRef({ mouse: new THREE.Vector2(), target: new THREE.Vector2(), vel: new THREE.Vector2(), speed: 0, x: 0, y: 0, zoom: 1, dim: 1, fade: 0 })

  const uniforms = useMemo(() => ({
    tS: { value: tex(layers.sky[0]) }, gS: { value: tex(layers.sky[1]) },
    tF: { value: tex(layers.far[0]) }, gF: { value: tex(layers.far[1]) },
    tM: { value: tex(layers.mid[0]) }, gM: { value: tex(layers.mid[1]) },
    tN: { value: tex(layers.near[0]) }, gN: { value: tex(layers.near[1]) },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2() },
    uVel: { value: new THREE.Vector2() },
    uTime: { value: 0 }, uPan: { value: 0 }, uZoom: { value: 1 }, uDim: { value: 1 }, uFade: { value: 0 }, uSpeed: { value: 0 }, uMotion: { value: 1 },
    uShot: { value: new THREE.Vector2() },
    uShock: { value: new THREE.Vector4(0, 0, -100, 0) },
    uAura: { value: hex3('#ffc870') },
    uFog: { value: hex3('#2a2448') },
  }), [layers])

  useEffect(() => {
    const onMove = (e) => {
      const h = window.innerHeight
      st.current.target.set((e.clientX - window.innerWidth / 2) / h, -(e.clientY - h / 2) / h)
    }
    addEventListener('pointermove', onMove, { passive: true })
    return () => removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    const u = uniforms
    hex3(s.aura || '#ffc870', u.uAura.value)
    const a = hex3(s.c3), b = hex3(s.c1), c = hex3('#9a94c0')
    u.uFog.value.copy(a.lerp(b, 0.35).lerp(c, 0.25))
    u.uMotion.value = s.motion ? 1 : 0
  }, [s.aura, s.c1, s.c3, s.motion, uniforms])

  useFrame((_, dtRaw) => {
    const dt = Math.min(0.05, dtRaw)
    const u = uniforms
    const k = st.current
    const sh = SHOTS[shot] || SHOTS.section
    const lerp = (a, b, t) => a + (b - a) * Math.min(1, t)
    const px = k.mouse.x, py = k.mouse.y
    k.mouse.x = lerp(k.mouse.x, k.target.x, dt * 6)
    k.mouse.y = lerp(k.mouse.y, k.target.y, dt * 6)
    const vx = (k.mouse.x - px) / Math.max(dt, 1e-3), vy = (k.mouse.y - py) / Math.max(dt, 1e-3)
    k.vel.x = lerp(k.vel.x, vx, dt * 8); k.vel.y = lerp(k.vel.y, vy, dt * 8)
    k.speed = lerp(k.speed, Math.min(0.16, Math.hypot(k.vel.x, k.vel.y) * 0.05), dt * 6)
    k.x = lerp(k.x, sh.x, dt * 1.4); k.y = lerp(k.y, sh.y, dt * 1.4)
    k.zoom = lerp(k.zoom, sh.zoom, dt * 1.4)
    k.dim = lerp(k.dim, sh.dim * (s.mode === 'light' ? 0.35 : 1), dt * 2)
    k.fade = lerp(k.fade, 1, dt * 1.2)
    const dpr = gl.getPixelRatio()
    u.uRes.value.set(size.width * dpr, size.height * dpr)
    u.uMouse.value.copy(k.mouse)
    u.uVel.value.set(Math.max(-1, Math.min(1, k.vel.x)), Math.max(-1, Math.min(1, k.vel.y)))
    u.uSpeed.value = k.speed
    if (s.motion) u.uTime.value += dt
    u.uPan.value = bus.pan / 1500
    u.uShot.value.set(k.x, k.y)
    u.uZoom.value = k.zoom
    u.uDim.value = k.dim
    u.uFade.value = k.fade
    const sk = bus.shock
    const h = window.innerHeight
    const age = performance.now() / 1000 - sk.t
    u.uShock.value.set((sk.x - window.innerWidth / 2) / h, -(sk.y - h / 2) / h, u.uTime.value - age, age < 4 ? 1 : 0)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={uniforms} transparent premultipliedAlpha depthTest={false} depthWrite={false} />
    </mesh>
  )
}

export default function Scenery({ shot, s }) {
  const [layers, setLayers] = useState(null)
  useEffect(() => {
    let id
    const run = () => setLayers(buildScenery())
    if ('requestIdleCallback' in window) id = requestIdleCallback(run, { timeout: 600 })
    else id = setTimeout(run, 50)
    return () => ('cancelIdleCallback' in window ? cancelIdleCallback(id) : clearTimeout(id))
  }, [])
  if (!layers) return null
  return (
    <Canvas
      className="scenery"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }}
      flat
      linear
      events={undefined}
    >
      <Plane shot={shot} s={s} layers={layers} />
    </Canvas>
  )
}
