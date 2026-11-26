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
uniform sampler2D tS, tF, tM, tN, gS, gF, gM, gN, rF, rN;
uniform vec2 uRes, uMouse, uVel;
uniform float uTime, uPan, uZoom, uDim, uFade, uSpeed, uMotion;
uniform vec2 uShot;
uniform vec4 uShock;
uniform vec3 uAura, uFog;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

vec2 toUv(vec2 q) { return vec2(q.x * 0.5 + 0.5, q.y + 0.5); }

void sampleLayer(sampler2D t, sampler2D g, vec2 p, float depth, float blur, out vec4 body, out float glow, out vec2 uvo) {
  vec2 q = p / uZoom;
  q.x += (uPan + uShot.x) * depth;
  q.y += uShot.y * depth * 0.6;
  q -= uMouse * depth * 0.035;
  vec2 uv = toUv(q);
  uvo = uv;
  if (uv.y < 0.0 || uv.y > 1.0) { body = vec4(0.0); glow = 0.0; return; }
  uv.x = fract(uv.x);
  uvo = uv;
  body = texture2D(t, uv);
  if (blur > 0.0) {
    // atmospheric softness for distant layers
    body = body * 0.4 + (texture2D(t, uv + vec2(blur, 0.0)) + texture2D(t, uv - vec2(blur, 0.0))
         + texture2D(t, uv + vec2(0.0, blur * 1.6)) + texture2D(t, uv - vec2(0.0, blur * 1.6))) * 0.15;
  }
  float o = 0.0028;
  glow = texture2D(g, uv).a * 0.6
    + (texture2D(g, uv + vec2(o, 0.0)).a + texture2D(g, uv - vec2(o, 0.0)).a
     + texture2D(g, uv + vec2(0.0, o * 2.0)).a + texture2D(g, uv - vec2(0.0, o * 2.0)).a) * 0.18;
}

// Living light inside a Tacet Field. m is the stepped depth mask (0 at the rim, 1 deep inside).
vec3 riftColor(vec2 uv, float m) {
  float t = uTime;
  vec2 w = vec2(fbm(uv * vec2(160.0, 22.0) + vec2(0.0, -t * 0.35)), fbm(uv * vec2(160.0, 22.0) + vec2(5.2, 1.3 - t * 0.28)));
  float grain = sin(uv.x * 2600.0 + w.x * 9.0 + sin(uv.y * 120.0 + t) * 1.5) * 0.5 + 0.5;
  float flow = fbm(vec2(uv.x * 420.0 + w.y * 3.0, uv.y * 60.0 - t * 0.9));
  float rings = smoothstep(0.34, 0.5, abs(fract(m * 4.5 - t * 0.25) - 0.5));
  vec3 deep = vec3(0.42, 0.17, 0.02);
  vec3 hot = vec3(1.0, 0.96, 0.82);
  vec3 c = mix(deep, uAura, smoothstep(0.0, 0.45, m));
  c = mix(c, hot, smoothstep(0.5, 1.0, m) * 0.85);
  c *= 0.72 + 0.5 * flow;
  c += hot * 0.22 * smoothstep(0.55, 1.0, grain) * (0.4 + m);
  c *= 1.0 - rings * 0.3;
  return c * (1.15 + 0.15 * sin(t * 1.7));
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

  vec4 s, fa, m, n; float gs, gf, gm, gn; vec2 uS, uF, uM, uN;
  sampleLayer(tS, gS, p + warp * 0.35, 0.04, 0.0, s, gs, uS);
  sampleLayer(tF, gF, p + warp * 0.6, 0.22, 0.0016, fa, gf, uF);
  sampleLayer(tM, gM, p + warp * 0.85, 0.5, 0.0, m, gm, uM);
  sampleLayer(tN, gN, p + warp * 1.1, 1.0, 0.0, n, gn, uN);
  float rf = (uF.y >= 0.0 && uF.y <= 1.0) ? texture2D(rF, uF).a : 0.0;
  float rn = (uN.y >= 0.0 && uN.y <= 1.0) ? texture2D(rN, uN).a : 0.0;
  if (rf > 0.002) fa.rgb = mix(fa.rgb, riftColor(uF, rf), smoothstep(0.0, 0.07, rf));
  if (rn > 0.002) n.rgb = mix(n.rgb, riftColor(uN * vec2(1.0, 1.0) + 0.37, rn), smoothstep(0.0, 0.05, rn));

  // Dark atmosphere: the colour field behind shows through as a tint.
  float sky = smoothstep(-0.5, 0.6, p.y);
  vec3 col = uFog * 0.05;
  float a = mix(0.62, 0.42, sky);
  col = s.rgb * s.a + col * (1.0 - s.a); a = s.a + a * (1.0 - s.a);
  vec3 farC = mix(fa.rgb, uFog * 0.7, 0.3 * (1.0 - smoothstep(0.0, 0.1, rf) * 0.7));
  col = farC * fa.a + col * (1.0 - fa.a); a = fa.a + a * (1.0 - fa.a);
  // haze band between far and mid
  float haze = smoothstep(-0.05, -0.3, p.y) * 0.25;
  col = mix(col, uFog * 0.9, haze * 0.5); a = max(a, haze);
  // drifting mist between the far ridge and the floating shards
  vec2 fp = p / uZoom + vec2((uPan + uShot.x) * 0.35 + uTime * 0.012, uTime * 0.004);
  float mist = fbm(fp * vec2(1.6, 3.2) + warp * 2.0);
  mist = smoothstep(0.42, 0.85, mist) * smoothstep(0.35, -0.25, p.y) * 0.55 * uMotion + smoothstep(0.42, 0.85, mist) * smoothstep(0.35, -0.25, p.y) * 0.25 * (1.0 - uMotion);
  col = mix(col, uFog * 1.15 + 0.03, mist * 0.55); a = max(a, mist * 0.7);
  vec3 midC = mix(m.rgb, uFog, 0.12);
  col = midC * m.a + col * (1.0 - m.a); a = m.a + a * (1.0 - m.a);
  col = n.rgb * n.a + col * (1.0 - n.a); a = n.a + a * (1.0 - n.a);

  // Light shafts from the pale planet, hidden behind whatever stands in front.
  vec2 pp = (vec2(0.32, 0.24) - vec2((uPan + uShot.x) * 0.04, uShot.y * 0.024) + uMouse * 0.0014) * uZoom;
  vec2 rd = p - pp;
  float rl = length(rd);
  float ang = atan(rd.y, rd.x);
  float shafts = pow(vnoise(vec2(ang * 7.0, uTime * 0.08)), 3.0) + 0.5 * pow(vnoise(vec2(ang * 19.0 + 3.0, uTime * 0.05)), 4.0);
  float occl = (1.0 - n.a) * (1.0 - m.a * 0.85) * (1.0 - fa.a * 0.6);
  float rays = shafts * exp(-rl * 1.6) * smoothstep(0.05, 0.25, rl) * occl * 0.42;
  col += vec3(0.86, 0.84, 1.0) * rays; a = max(a, rays);

  // Aura: light in the cracks, breathing.
  float pulse = 0.7 + 0.3 * sin(uTime * 1.3 + p.x * 4.0) * uMotion;
  float glow = gs * 0.5 + gf * 0.45 + gm * 0.95 + gn * 1.15;
  glow *= pulse;
  glow += band * 0.35 * uShock.w;
  // warm light pooling at the ground line
  glow += smoothstep(-0.25, -0.5, p.y) * 0.12 * pulse;
  vec3 aura = uAura * glow * 1.35 + vec3(1.0, 0.95, 0.85) * pow(min(glow, 1.0), 3.0) * 0.22;
  col += aura; a = max(a, min(1.0, glow * 0.85));

  // Twinkling stars in the open sky, behind everything else
  vec2 stG = (p / uZoom + vec2((uPan + uShot.x) * 0.02, 0.0)) * 90.0;
  vec2 stC = floor(stG);
  float stR = hash(stC + 41.0);
  float star = step(0.985, stR) * smoothstep(0.35, 0.0, length(fract(stG) - 0.5)) * (0.5 + 0.5 * sin(uTime * (1.5 + stR * 4.0) + stR * 50.0));
  star *= smoothstep(-0.05, 0.3, p.y) * (1.0 - fa.a) * (1.0 - m.a) * (1.0 - n.a);
  col += vec3(0.95, 0.95, 1.0) * star * 0.9; a = max(a, star * 0.9);

  // Embers (gold) and ash (pale).
  float e = motes(p + warp, 26.0, 0.10, 1.0) + motes(p * 1.6 + warp, 26.0, 0.16, 9.0) * 0.7;
  float ash = motes(p * 0.8 + warp * 0.5, 34.0, 0.05, 4.0) * 0.5;
  col += uAura * e * 0.9 + vec3(0.85, 0.83, 0.95) * ash * 0.5; a = max(a, max(e * 0.9, ash * 0.5));

  // Vignette darkness.
  float vig = smoothstep(0.45, 1.25, length(p * vec2(0.85, 1.25)));
  a = a + vig * 0.55 * (1.0 - a);
  col *= 1.0 - vig * 0.35;

  // fine film grain so flat areas never look plastic
  float fg = hash(gl_FragCoord.xy + fract(uTime * 7.0) * 113.0) - 0.5;
  col += fg * 0.035 * a;
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
    rF: { value: tex(layers.far[2]) }, rN: { value: tex(layers.near[2]) },
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
    k.fade = lerp(k.fade, 1, dt * 2)
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
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' }}
      flat
      linear
      events={undefined}
    >
      <Plane shot={shot} s={s} layers={layers} />
    </Canvas>
  )
}
