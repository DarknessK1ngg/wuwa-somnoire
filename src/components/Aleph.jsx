import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { usePack } from '../lang'
import { bus, moodLerp } from '../bus'
import { ALEPH_LINES, ALEPH_NAME, ALEPH_TXT } from '../aleph'
import { rng, textBand } from '../cosmos'
import { foam, seedSpots, axisOf } from '../universes'
import Universes from './Universes'

// Aleph-1, below Chaos. Three forms out of one cloud of light, driven by the scroll:
// a shell of rings → dust → an eye → dust → the void (a black hole eating its own disc),
// then the camera pulls back and the void sits inside the whole multiverse.
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
const clamp01 = (x) => Math.min(1, Math.max(0, x))

// scroll → state
function state(p) {
  // morph index through the targets: 0 dust, 1 shell, 2 dust, 3 eye, 4 dust, 5 void
  let m = 0
  if (p < 0.03) m = 0
  else if (p < 0.12) m = (p - 0.03) / 0.09
  else if (p < 0.27) m = 1
  else if (p < 0.34) m = 1 + (p - 0.27) / 0.07
  else if (p < 0.41) m = 2 + (p - 0.34) / 0.07
  else if (p < 0.54) m = 3
  else if (p < 0.6) m = 3 + (p - 0.54) / 0.06
  else if (p < 0.67) m = 4 + (p - 0.6) / 0.07
  else m = 5
  const cut = p > CUT
  return {
    m, cut,
    shell: ss(0.04, 0.12, p) * (1 - ss(0.26, 0.31, p)),
    eye: ss(0.38, 0.43, p) * (1 - ss(0.53, 0.57, p)),
    void: ss(0.63, 0.7, p),
    multi: cut ? ss(CUT, CUT + 0.012, p) : 0,
    fly: ss(0.786, 0.91, p),
    orbit: Math.max(0, p - 0.9) * 6,
  }
}
const CUT = 0.765

// ---------- I. the shell: a gyroscope of chrome rings round a dark core, a halo of blades ----------
const RINGS = [
  { r: 4.7, tube: 0.07, arc: Math.PI * 1.86, rot: [0, 0, 0], spin: 0.05 },
  { r: 4.15, tube: 0.04, arc: Math.PI * 2, rot: [Math.PI / 2, 0, 0], spin: -0.08 },
  { r: 3.65, tube: 0.1, arc: Math.PI * 1.5, rot: [0.6, 0.4, 0], spin: 0.12 },
  { r: 3.15, tube: 0.035, arc: Math.PI * 2, rot: [1.2, -0.5, 0.3], spin: -0.15 },
  { r: 2.6, tube: 0.065, arc: Math.PI * 1.7, rot: [-0.4, 1.1, 0], spin: 0.2 },
  { r: 2.0, tube: 0.03, arc: Math.PI * 2, rot: [0.3, 0.2, 1.4], spin: -0.26 },
  { r: 1.45, tube: 0.05, arc: Math.PI * 2, rot: [Math.PI / 2, 0.5, 0], spin: 0.32 },
]
const BLADES = 36, BLADE_R = 5.5

function bladeGeometry() {
  const parts = []
  for (let i = 0; i < BLADES; i++) {
    const a = (i / BLADES) * Math.PI * 2, long = i % 3 === 0
    const g = new THREE.BoxGeometry(0.05, long ? 1.6 : 0.9, 0.16)
    g.translate(0, BLADE_R + (long ? 0.8 : 0.45), 0)
    g.rotateZ(a)
    parts.push(g)
  }
  return mergeGeometries(parts)
}

function Shell({ st, mats }) {
  const grp = useRef(), spins = useRef([]), halo = useRef(), core = useRef()
  const chrome = useMemo(() => new THREE.MeshStandardMaterial({ color: '#dde1ea', metalness: 1, roughness: 0.16, envMapIntensity: 1.6, transparent: true }), [])
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, toneMapped: false }), [])
  const blades = useMemo(bladeGeometry, [])
  useFrame((s3, dt) => {
    const on = st.current.shell
    grp.current.visible = on > 0.002
    chrome.opacity = on; glow.opacity = on
    grp.current.scale.setScalar(1.25 - 0.25 * ss(0, 1, on))
    spins.current.forEach((m, i) => { if (m) m.rotation.z += dt * RINGS[i].spin })
    halo.current.rotation.z -= dt * 0.03
    core.current.rotation.y += dt * 0.2
    grp.current.rotation.y = Math.sin(s3.clock.elapsedTime * 0.1) * 0.25
    grp.current.updateMatrixWorld(true)
    // hand the ring frames to the particles, so the dust leaves exactly from the rings
    spins.current.forEach((m, i) => m && mats.current[i].copy(m.matrixWorld))
    mats.current[7].copy(halo.current.matrixWorld)
  })
  return (
    <group ref={grp}>
      {RINGS.map((r, i) => (
        <group key={i} rotation={r.rot}>
          <mesh ref={(el) => { spins.current[i] = el }} material={chrome}>
            <torusGeometry args={[r.r, r.tube, 12, 220, r.arc]} />
          </mesh>
        </group>
      ))}
      <mesh ref={halo} geometry={blades} material={chrome} />
      <group ref={core}>
        <mesh><sphereGeometry args={[0.85, 48, 32]} /><meshStandardMaterial color="#050507" metalness={0.9} roughness={0.25} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={glow}><torusGeometry args={[0.87, 0.012, 8, 160]} /></mesh>
      </group>
    </group>
  )
}

// ---------- II. the eye: an iris of light fibres round a black pupil ----------
const irisFrag = /* glsl */ `
uniform float uOn, uTime; uniform vec3 uSeam; varying vec2 vUv;
float h1(float n) { return fract(sin(n) * 43758.5453); }
float n1(float x) { float i = floor(x), f = fract(x); return mix(h1(i), h1(i + 1.0), f * f * (3.0 - 2.0 * f)); }
void main() {
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x) + 3.14159;
  float pr = 0.31 + 0.02 * sin(uTime * 0.6);
  float t = clamp((r - pr) / (1.0 - pr), 0.0, 1.0);
  float fib = n1(a * 44.0 + t * 3.0) * 0.6 + n1(a * 101.0 - t * 6.0) * 0.4;
  fib = pow(fib, 1.5);
  vec3 col = mix(vec3(0.42, 0.5, 0.7), vec3(0.95, 0.97, 1.0), fib) * (0.35 + 0.95 * fib);
  col = mix(uSeam * 1.5, col, smoothstep(0.0, 0.28, t));
  col *= 0.15 + 0.85 * smoothstep(1.0, 0.84, r);
  col += vec3(0.85, 0.92, 1.0) * exp(-pow((r - 0.975) * 32.0, 2.0)) * 0.7;
  col *= smoothstep(pr, pr + 0.012, r);
  gl_FragColor = vec4(col * uOn, uOn);
}`

function Eye({ st, eyeM }) {
  const grp = useRef(), iris = useRef(), halo = useRef()
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 }, uTime: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: irisFrag, transparent: true,
  }), [])
  const haloTex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 256
    const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 30, 128, 128, 128)
    g.addColorStop(0, 'rgba(210,222,255,.55)'); g.addColorStop(0.4, 'rgba(160,180,240,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)')
    x.fillStyle = g; x.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame((s3) => {
    const on = st.current.eye
    mat.uniforms.uOn.value = on
    mat.uniforms.uTime.value = s3.clock.elapsedTime
    moodLerp(mat.uniforms.uSeam.value, 'seam', 0.05)
    halo.current.material.opacity = on
    grp.current.visible = on > 0.002
    // the eye turns to face you, a little after the cursor
    look.copy(s3.camera.position)
    look.x += bus.mouse.x * 3; look.y += bus.mouse.y * 2
    grp.current.lookAt(look)
    grp.current.updateMatrixWorld(true)
    eyeM.current.copy(grp.current.matrixWorld)
  })
  return (
    <group ref={grp}>
      <mesh ref={halo} position={[0, 0, -0.2]}>
        <planeGeometry args={[19, 19]} />
        <meshBasicMaterial map={haloTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={iris} material={mat}><circleGeometry args={[3.3, 128]} /></mesh>
    </group>
  )
}

// ---------- III. the void: a black hole, its disc, the true formula turning round it ----------
const diskFrag = /* glsl */ `
uniform float uOn, uTime; uniform vec3 uSeam; varying vec2 vUv;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p) * 6.4;
  if (r < 1.45 || r > 6.4) discard;
  float a = atan(p.y, p.x);
  float sw = a + uTime * 1.2 / pow(r, 1.3);
  float bands = n2(vec2(sw * 3.0, r * 2.2)) * 0.6 + n2(vec2(sw * 9.0, r * 6.0)) * 0.4;
  float fall = smoothstep(6.4, 2.2, r) * smoothstep(1.45, 1.9, r);
  float dop = 0.55 + 0.45 * cos(a + 0.6);
  vec3 col = mix(uSeam, vec3(1.0, 0.97, 0.93), smoothstep(4.0, 1.6, r)) * (0.3 + 1.4 * bands) * fall * (0.4 + dop);
  float al = fall * (0.25 + 0.75 * bands);
  gl_FragColor = vec4(col * uOn, al * uOn);
}`
const ringFrag = /* glsl */ `
uniform float uOn; varying vec2 vUv;
void main() {
  float r = length((vUv - 0.5) * 2.0) * 3.0;
  float ring = exp(-pow((r - 1.42) * 26.0, 2.0)) * 1.6 + exp(-pow((r - 1.42) * 5.0, 2.0)) * 0.35;
  float halo = exp(-max(0.0, r - 1.4) * 1.6) * 0.18 * step(1.35, r);
  float a = (ring + halo) * uOn;
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.9) * a, a);
}`

function tesseract() {
  const v = []
  for (let i = 0; i < 16; i++) v.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1])
  const e = []
  for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (i < j) e.push([i, j]) }
  return { v, e }
}

function Void({ st, voidM, lang }) {
  const grp = useRef(), disk = useRef(), tilt = useRef(), band = useRef(), lines = useRef(), hole = useRef()
  const diskMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 }, uTime: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: diskFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }), [])
  const ringMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uOn: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: ringFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [])
  const holeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#000000', transparent: true }), [])
  const T = useMemo(tesseract, [])
  const tGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(T.e.length * 6), 3))
    return g
  }, [T])
  const word = useMemo(() => textBand('祂是「虛無」   ·   萬物的消解   ·   一切都自虛無中誕生   ·   ', { spacing: 30, size: 70, font: "'Noto Serif TC', 'Songti TC', 'PMingLiU', 'MingLiU', 'Microsoft JhengHei', serif" }), [lang])
  const ringFace = useRef()
  useFrame((s3, dt) => {
    const on = st.current.void, t = s3.clock.elapsedTime
    grp.current.visible = on > 0.002
    diskMat.uniforms.uOn.value = on; diskMat.uniforms.uTime.value = t
    moodLerp(diskMat.uniforms.uSeam.value, 'seam', 0.05)
    ringMat.uniforms.uOn.value = on
    holeMat.opacity = on
    band.current.material.opacity = on * 0.85 * (1 - st.current.multi * 0.85)
    band.current.rotation.y -= dt * 0.06
    lines.current.material.opacity = on * 0.32 * (1 - st.current.multi * 0.5)
    ringFace.current.quaternion.copy(s3.camera.quaternion)
    // the 4-cube: two rotations through the fourth axis, projected down
    const a1 = t * 0.35, a2 = t * 0.22, pos = tGeo.attributes.position.array, P = []
    for (const q of T.v) {
      let [x, y, z, w] = q
      let x1 = x * Math.cos(a1) - w * Math.sin(a1), w1 = x * Math.sin(a1) + w * Math.cos(a1)
      let y1 = y * Math.cos(a2) - z * Math.sin(a2), z1 = y * Math.sin(a2) + z * Math.cos(a2)
      let z2 = z1 * Math.cos(a2 * 0.7) - w1 * Math.sin(a2 * 0.7), w2 = z1 * Math.sin(a2 * 0.7) + w1 * Math.cos(a2 * 0.7)
      const k = 3.4 / (2.6 - w2)
      P.push([x1 * k, y1 * k, z2 * k])
    }
    T.e.forEach(([i, j], n) => { pos.set(P[i], n * 6); pos.set(P[j], n * 6 + 3) })
    tGeo.attributes.position.needsUpdate = true
    tilt.current.updateMatrixWorld(true)
    voidM.current.copy(tilt.current.matrixWorld)
  })
  return (
    <group ref={grp}>
      <mesh ref={hole} material={holeMat} renderOrder={2}><sphereGeometry args={[1.3, 64, 48]} /></mesh>
      <mesh ref={ringFace} material={ringMat} renderOrder={3}><planeGeometry args={[6, 6]} /></mesh>
      <group ref={tilt} rotation={[1.18, 0, 0.18]}>
        <mesh ref={disk} material={diskMat}><planeGeometry args={[12.8, 12.8]} /></mesh>
      </group>
      <lineSegments ref={lines} geometry={tGeo}>
        <lineBasicMaterial color="#e8edf8" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <mesh ref={band} rotation={[0.22, 0, -0.12]}>
        <cylinderGeometry args={[7.4, 7.4, 0.55, 220, 1, true]} />
        <meshBasicMaterial map={word} transparent opacity={0} depthWrite={false} side={THREE.FrontSide} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------- the dust: every form is made of the same points ----------
const dustVert = /* glsl */ `
attribute vec3 aA; attribute float aRing; attribute vec3 aE; attribute vec3 aV; attribute vec3 aS; attribute float aR;
uniform mat4 uRingM[8]; uniform mat4 uEyeM; uniform mat4 uVoidM;
uniform float uM, uTime, uSize, uShell, uEye, uVoid;
varying float vA; varying float vHot; varying float vR;
float ease(float x) { return x * x * (3.0 - 2.0 * x); }
void main() {
  vec3 S0 = aS * 1.7;
  vec3 A = (uRingM[int(aRing + 0.5)] * vec4(aA, 1.0)).xyz;
  vec3 S1 = aS + vec3(sin(uTime * 0.3 + aR * 20.0), cos(uTime * 0.27 + aR * 13.0), 0.0) * 0.4;
  vec3 B = (uEyeM * vec4(aE, 1.0)).xyz;
  vec3 S2 = aS.zxy * 1.25;
  float rr = mix(1.32, 6.6, fract(aV.x - uTime * 0.02 * (0.5 + aR)));
  float ang = aV.y + uTime * 1.5 / pow(rr, 1.3);
  vec3 C = (uVoidM * vec4(cos(ang) * rr, sin(ang) * rr, aV.z * (0.04 + 0.03 * rr), 1.0)).xyz;
  float seg = min(floor(uM), 4.0), f = clamp(uM - seg, 0.0, 1.0);
  float k = ease(clamp((f - aR * 0.35) / 0.65, 0.0, 1.0));
  vec3 p;
  if (seg < 0.5) p = mix(S0, A, k);
  else if (seg < 1.5) p = mix(A, S1, k);
  else if (seg < 2.5) p = mix(S1, B, k);
  else if (seg < 3.5) p = mix(B, S2, k);
  else p = mix(S2, C, k);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // how bright: dim sparks while a solid form is up, full in flight, and in the void fading as they fall in
  float inShell = (seg < 0.5 ? k : (seg < 1.5 ? 1.0 - k : 0.0));
  float inVoid = seg > 3.5 ? k : 0.0;
  float edge = smoothstep(1.32, 1.9, rr);
  float a = mix(1.0, 0.28, inShell * uShell);
  a *= mix(1.0, edge * (0.5 + 0.5 * smoothstep(6.6, 3.0, rr)), inVoid);
  vA = a * (0.55 + 0.45 * sin(uTime * (1.0 + aR * 2.0) + aR * 40.0));
  vHot = inVoid * smoothstep(4.5, 1.5, rr);
  vR = aR;
  gl_PointSize = min(26.0, uSize * (0.45 + aR * 0.9) * (260.0 / -mv.z));
  gl_Position = projectionMatrix * mv;
}`
const dustFrag = /* glsl */ `
uniform vec3 uSeam; uniform float uAlpha;
varying float vA; varying float vHot; varying float vR;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  vec3 col = mix(vec3(0.78, 0.85, 1.0), vec3(1.0), smoothstep(0.25, 0.0, d));
  col = mix(col, uSeam * 1.3, max(step(0.9, vR) * 0.8, vHot * 0.7));
  gl_FragColor = vec4(col * a * vA * uAlpha, a * vA * uAlpha);
}`

function buildDust(N) {
  const r = rng(77)
  const aA = new Float32Array(N * 3), aRing = new Float32Array(N), aE = new Float32Array(N * 3), aV = new Float32Array(N * 3), aS = new Float32Array(N * 3), aR = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    // shell: on a ring (local torus frame) or on a blade of the halo
    if (r() < 0.82) {
      const k = Math.floor(r() * RINGS.length), R0 = RINGS[k], a = r() * R0.arc, b = r() * Math.PI * 2
      const rad = R0.r + Math.cos(b) * R0.tube
      aA.set([Math.cos(a) * rad, Math.sin(a) * rad, Math.sin(b) * R0.tube], i * 3); aRing[i] = k
    } else {
      const bl = Math.floor(r() * BLADES), long = bl % 3 === 0, a = (bl / BLADES) * Math.PI * 2
      const y = BLADE_R + r() * (long ? 1.6 : 0.9), x = (r() - 0.5) * 0.05
      aA.set([x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), (r() - 0.5) * 0.16], i * 3); aRing[i] = 7
    }
    // eye (local: looking down +z)
    const e = r()
    let ex, ey
    if (e < 0.46) { // iris fibres
      const f = Math.floor(r() * 300), th = (f / 300) * Math.PI * 2 + (r() - 0.5) * 0.01, t = Math.pow(r(), 0.85)
      const rad = 1.05 + 2.2 * t, w = th + 0.035 * Math.sin(rad * 5 + f)
      ex = Math.cos(w) * rad; ey = Math.sin(w) * rad
    } else if (e < 0.58) { const th = r() * Math.PI * 2, rad = 3.28 + (r() - 0.5) * 0.08; ex = Math.cos(th) * rad; ey = Math.sin(th) * rad }
    else if (e < 0.66) { const th = r() * Math.PI * 2, rad = 1.02 + (r() - 0.5) * 0.04; ex = Math.cos(th) * rad; ey = Math.sin(th) * rad }
    else if (e < 0.88) { // lids: an almond, upper and lower
      const s = r() * 2 - 1, up = r() < 0.5 ? 1 : -1
      ex = s * 7.4; ey = up * 3.9 * (1 - s * s) * (1 + (r() - 0.5) * 0.04)
    } else { // rays outward, beyond the lids
      const th = r() * Math.PI * 2, rad = 4 + Math.pow(r(), 1.8) * 7
      ex = Math.cos(th) * rad * 1.35; ey = Math.sin(th) * rad * 0.8
    }
    aE.set([ex, ey, (r() - 0.5) * 0.08], i * 3)
    // void: a place on the disc (fraction of radius, angle, thickness)
    aV.set([r(), r() * Math.PI * 2, (r() - 0.5) * 2], i * 3)
    // dust: a lumpy cloud
    const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(3 + Math.pow(r(), 0.6) * 7)
    aS.set([d.x, d.y * 0.7, d.z], i * 3)
    aR[i] = r()
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
  g.setAttribute('aA', new THREE.BufferAttribute(aA, 3)); g.setAttribute('aRing', new THREE.BufferAttribute(aRing, 1))
  g.setAttribute('aE', new THREE.BufferAttribute(aE, 3)); g.setAttribute('aV', new THREE.BufferAttribute(aV, 3))
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 3)); g.setAttribute('aR', new THREE.BufferAttribute(aR, 1))
  return g
}

function Dust({ st, ringMs, eyeM, voidM, N }) {
  const geo = useMemo(() => buildDust(N), [N])
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uRingM: { value: ringMs.current }, uEyeM: { value: eyeM.current }, uVoidM: { value: voidM.current },
      uM: { value: 0 }, uTime: { value: 0 }, uSize: { value: 0.5 }, uShell: { value: 1 }, uEye: { value: 0 }, uVoid: { value: 0 },
      uSeam: { value: new THREE.Color('#ffc870') }, uAlpha: { value: 1 },
    },
    vertexShader: dustVert, fragmentShader: dustFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [ringMs, eyeM, voidM])
  useFrame((s3) => {
    const S = st.current
    mat.uniforms.uM.value = S.m
    mat.uniforms.uTime.value = s3.clock.elapsedTime
    mat.uniforms.uShell.value = S.shell
    mat.uniforms.uAlpha.value = 1 - S.multi * 0.55
    moodLerp(mat.uniforms.uSeam.value, 'seam', 0.05)
  })
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

// ---------- IV. the multiverse: a foam of universes round the void ----------
const FOAM = { d: null }
function foamData() {
  if (FOAM.d) return FOAM.d
  const raw = foam(230, 13, 72, 91)
  const spots = seedSpots(raw.map((o) => ({ p: o.p, r: o.r, b: 0 })), 33)
  // the universe we start inside: a big spiral close to the heart
  let U = null
  for (const s of spots) if (s.r > 3.4 && (!U || Math.abs(s.p.length() - 34) < Math.abs(U.p.length() - 34))) U = s
  U.kind = 0
  U.stars = 0.05 // drawn in full by its own detailed galaxy
  U.gr = U.r * 0.34 // its galaxy sits in the middle of the bubble, so from inside you can see all of it
  // threads of light between bubbles that touch, surface to surface
  const seg = []
  const d = new THREE.Vector3()
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const a = spots[i], b = spots[j]
      d.subVectors(b.p, a.p)
      const L = d.length()
      if (L < a.r + b.r + 2.2) {
        d.divideScalar(L)
        seg.push(a.p.clone().addScaledVector(d, a.r), b.p.clone().addScaledVector(d, -b.r))
      }
    }
  }
  // the nearest universes are the ones the void is eating
  const near = [...spots].sort((x, y) => x.p.length() - y.p.length()).slice(0, 14)
  FOAM.d = { spots, U, seg, near }
  return FOAM.d
}

const flowVert = /* glsl */ `
attribute vec3 aA; attribute vec3 aB; attribute float aR;
uniform float uTime, uPx;
varying float vA; varying float vHot;
void main() {
  vHot = 0.0;
  float s = fract(aR * 7.0 + uTime * (0.05 + aR * 0.08));
  vec3 p = mix(aA, aB, s);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = sin(3.14159 * s);
  gl_PointSize = clamp(0.06 * uPx / -mv.z, 1.5, 10.0);
  gl_Position = projectionMatrix * mv;
}`
const drainVert = /* glsl */ `
attribute vec3 aA; attribute float aR;
uniform float uTime, uPx;
varying float vA; varying float vHot;
void main() {
  float s = fract(aR * 13.0 + uTime * (0.025 + aR * 0.03));
  float k = pow(s, 1.6);
  float L = length(aA) * (1.0 - k) + 1.5 * k;
  float a = atan(aA.z, aA.x) + k * 5.0;
  vec3 p = vec3(cos(a) * L, aA.y * (1.0 - k) * (1.0 - k), sin(a) * L);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vA = smoothstep(0.0, 0.08, s) * (1.0 - smoothstep(0.85, 1.0, s));
  vHot = k;
  gl_PointSize = clamp(0.09 * uPx / -mv.z, 1.5, 12.0);
  gl_Position = projectionMatrix * mv;
}`
const softFrag = /* glsl */ `
uniform float uAlpha; uniform vec3 uSeam;
varying float vA; varying float vHot;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a * vA * uAlpha;
  vec3 c = mix(vec3(0.8, 0.87, 1.0), uSeam * 1.3, vHot);
  gl_FragColor = vec4(c * a, a);
}`
const nebFrag = /* glsl */ `
uniform float uAlpha; uniform vec3 uSeam; varying vec3 vD;
float h3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n3(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec3 d = normalize(vD);
  float n = fbm(d * 2.4), m = fbm(d * 5.0 + 7.0);
  float cloud = smoothstep(0.45, 0.85, n) * 0.5 + smoothstep(0.6, 0.95, m) * 0.25;
  vec3 c = mix(vec3(0.16, 0.2, 0.42), vec3(0.42, 0.3, 0.55), m) * cloud + uSeam * 0.12 * smoothstep(0.75, 0.95, n);
  float st = step(0.9965, h3(floor(d * 380.0)));
  gl_FragColor = vec4((c * 0.5 + vec3(st) * 0.7) * uAlpha, 1.0);
}`

function Multiverse({ st, low }) {
  const F = foamData()
  const uctl = useRef({ g: 1, alpha: 0, dof: 0, focus: 40, voidDim: 0 })
  const dctl = useRef({ g: 1, alpha: 0, dof: 0, focus: 3 })
  const detail = useMemo(() => [{ ...F.U, stars: 1 }], [F])
  const flow = useMemo(() => {
    const r = rng(12), A = [], B = [], R = []
    for (let i = 0; i < F.seg.length; i += 2) {
      for (let k = 0; k < 6; k++) { A.push(F.seg[i].x, F.seg[i].y, F.seg[i].z); B.push(F.seg[i + 1].x, F.seg[i + 1].y, F.seg[i + 1].z); R.push(r()) }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(A.length), 3))
    g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 1))
    const lines = new THREE.BufferGeometry().setFromPoints(F.seg)
    return { g, lines }
  }, [F])
  const drain = useMemo(() => {
    const r = rng(14), A = [], R = [], N = low ? 2500 : 5000
    for (let i = 0; i < N; i++) {
      const s = F.near[Math.floor(r() * F.near.length)]
      const o = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(s.r * Math.sqrt(r()))
      A.push(s.p.x + o.x, s.p.y + o.y, s.p.z + o.z); R.push(r())
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(A.length), 3))
    g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 1))
    return g
  }, [F, low])
  const mk = (vert) => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPx: { value: 800 }, uAlpha: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: vert, fragmentShader: softFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
  const flowMat = useMemo(() => mk(flowVert), [])
  const drainMat = useMemo(() => mk(drainVert), [])
  const nebMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: nebFrag, side: THREE.BackSide, depthWrite: false,
  }), [])
  const lineMat = useRef(), grp = useRef()
  useFrame((s3) => {
    const S = st.current, t = s3.clock.elapsedTime
    const px = (s3.size.height * s3.gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(s3.camera.fov / 2)))
    const on = S.multi
    grp.current.visible = on > 0.002
    const camToU = s3.camera.position.distanceTo(F.U.p), inU = camToU < F.U.r
    Object.assign(uctl.current, {
      alpha: on, dof: 0.55 * S.fly, focus: inU ? F.U.r : s3.camera.position.length(), voidDim: 0.75 * on,
    })
    Object.assign(dctl.current, { alpha: on * (1 - ss(0.3, 0.6, S.fly)), focus: Math.max(0.5, camToU), dof: 0.15 })
    for (const m of [flowMat, drainMat]) { m.uniforms.uTime.value = t; m.uniforms.uPx.value = px; moodLerp(m.uniforms.uSeam.value, 'seam', 0.05) }
    flowMat.uniforms.uAlpha.value = on * 0.9
    drainMat.uniforms.uAlpha.value = on * ss(0.2, 0.6, S.fly)
    lineMat.current.opacity = on * 0.12
    nebMat.uniforms.uAlpha.value = on
    moodLerp(nebMat.uniforms.uSeam.value, 'seam', 0.05)
  })
  return (
    <group ref={grp}>
      <mesh material={nebMat} renderOrder={-1}><sphereGeometry args={[330, 48, 32]} /></mesh>
      <Universes spots={F.spots} per={low ? 240 : 560} ctl={uctl} seed={5} size={0.06} />
      <Universes spots={detail} per={low ? 6000 : 14000} ctl={dctl} seed={9} shells={false} size={0.009} />
      <lineSegments geometry={flow.lines}><lineBasicMaterial ref={lineMat} color="#b9c6e6" transparent opacity={0} depthWrite={false} /></lineSegments>
      <points geometry={flow.g} material={flowMat} frustumCulled={false} />
      <points geometry={drain} material={drainMat} frustumCulled={false} />
    </group>
  )
}

// gravity bends the light round the void: a screen-space pull toward its centre
const lensFrag = /* glsl */ `
uniform vec2 uCenter; uniform float uR; uniform float uStr; uniform float uAspect;
void mainUv(inout vec2 uv) {
  vec2 d = uv - uCenter; d.x *= uAspect;
  float r = length(d);
  float k = uStr * uR * uR / max(r, uR * 0.7);
  d -= d / max(r, 1e-5) * min(k, r * 0.95);
  d.x /= uAspect; uv = uCenter + d;
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) { outputColor = inputColor; }`
class LensEffect extends Effect {
  constructor() {
    super('LensEffect', lensFrag, {
      uniforms: new Map([['uCenter', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))], ['uR', new THREE.Uniform(0.1)], ['uStr', new THREE.Uniform(0)], ['uAspect', new THREE.Uniform(1)]]),
    })
  }
}
function Lens({ st, effect }) {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame((s3) => {
    const c = s3.camera
    v.set(0, 0, 0).project(c)
    const dist = c.position.length()
    const u = effect.uniforms
    const behind = v.z > 1 || v.z < -1
    u.get('uCenter').value.set(v.x * 0.5 + 0.5, v.y * 0.5 + 0.5)
    u.get('uAspect').value = s3.size.width / s3.size.height
    u.get('uR').value = (1.9 / (dist * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)))) * 0.5
    u.get('uStr').value = behind ? 0 : st.current.void * 0.35
  })
  return null
}

function Rig({ st }) {
  const look = useMemo(() => new THREE.Vector3(), [])
  const F = foamData()
  // the flight out: start inside one universe, leave through its wall toward the void, swing out, pull back over the whole foam
  const path = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0), U = F.U
    const dirIn = U.p.clone().negate().normalize()
    const side = new THREE.Vector3().crossVectors(dirIn, up).normalize()
    // inside: above the galaxy's own disc, looking down at its core
    const { n } = axisOf(U.seed)
    const P0 = U.p.clone().addScaledVector(n, U.r * 0.88).addScaledVector(dirIn, -U.r * 0.22)
    const Pw = U.p.clone().addScaledVector(dirIn, U.r * 0.85).addScaledVector(n, U.r * 0.15)
    const P1 = U.p.clone().addScaledVector(dirIn, U.r * 2.4).addScaledVector(up, 1.5)
    const P2 = P1.clone().addScaledVector(side, 24).addScaledVector(up, 14).addScaledVector(dirIn, -6)
    const P3 = side.clone().multiplyScalar(100).addScaledVector(dirIn, -40).addScaledVector(up, 44)
    return { curve: new THREE.CatmullRomCurve3([P0, Pw, P1, P2, P3]), core: U.p.clone(), aimIn: U.p.clone().addScaledVector(dirIn, U.r * 5), far: P3 }
  }, [F])
  const was = useRef(false), pos = useMemo(() => new THREE.Vector3(), []), aim = useMemo(() => new THREE.Vector3(), [])
  useFrame((s3, dt) => {
    const S = st.current, c = s3.camera, k = Math.min(1, dt * 2), t = s3.clock.elapsedTime
    if (S.cut) {
      path.curve.getPoint(S.fly, pos)
      // once out, keep turning slowly round the heart
      const turn = S.orbit * 0.9 + t * 0.008 * S.fly
      pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), turn * S.fly)
      // first the core of our galaxy, then the wall ahead, then the heart of the foam
      aim.copy(path.core).lerp(path.aimIn, ss(0.04, 0.16, S.fly)).lerp(new THREE.Vector3(0, 0, 0), ss(0.18, 0.5, S.fly))
      pos.x += bus.mouse.x * 0.3 * S.fly; pos.y += bus.mouse.y * 0.3 * S.fly
      const kk = was.current ? Math.min(1, dt * 3) : 1 // the cut: jump straight in
      c.position.lerp(pos, kk); look.lerp(aim, kk)
      was.current = true
    } else {
      const wide = Math.min(3.2, Math.max(1, 1.45 / (s3.size.width / s3.size.height)))
      // each form is seen from its own height: the shell from below, the eye level, the void from above
      const yForm = S.m < 1.5 ? -1.8 : S.m < 3.5 ? 0 : 3.2
      const near = S.m < 1.5 ? 20 : S.m < 3.5 ? 16.5 : 15
      const a = Math.sin(t * 0.05) * 0.25 + bus.mouse.x * 0.12
      const R = near * wide
      const kk = was.current ? 1 : k
      pos.set(Math.sin(a) * R, yForm + bus.mouse.y * 0.8, Math.cos(a) * R)
      c.position.lerp(pos, kk); look.lerp(aim.set(0, 0, 0), kk)
      was.current = false
    }
    c.lookAt(look)
    if (c.far !== 800) { c.far = 800; c.updateProjectionMatrix() }
  })
  return null
}

export default function Aleph({ go }) {
  const { UI } = usePack()
  const lang = UI.lang
  const T = ALEPH_TXT[lang]
  const prog = useRef(0)
  const st = useRef(state(0))
  const ringMs = useRef(Array.from({ length: 8 }, () => new THREE.Matrix4()))
  const eyeM = useRef(new THREE.Matrix4()), voidM = useRef(new THREE.Matrix4())
  const [p, setP] = useState(0)
  const [low, setLow] = useState(false)
  const [born] = useState(() => performance.now())
  const cues = useRef({})
  const lens = useMemo(() => new LensEffect(), [])

  useEffect(() => {
    let raf
    const tick = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const want = max > 0 ? scrollY / max : 0
      prog.current += (want - prog.current) * 0.08
      st.current = state(prog.current)
      const m = st.current.m
      const cue = (name, hit, fx) => { if (hit && !cues.current[name]) { cues.current[name] = 1; bus.sfx(fx) } else if (!hit) cues.current[name] = 0 }
      cue('shell', m > 0.9, 'open'); cue('break1', m > 1.4, 'whoosh'); cue('eye', m > 2.9, 'iris'); cue('break2', m > 3.4, 'whoosh'); cue('void', m > 4.8, 'plunge')
      cue('multi', st.current.cut, 'plunge'); cue('out', st.current.fly > 0.3, 'open')
      setP((v) => (Math.abs(v - prog.current) > 0.003 ? prog.current : v))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const S = state(p)
  const act = S.multi > 0.5 ? 3 : S.void > 0.5 ? 2 : S.eye > 0.5 ? 1 : S.shell > 0.5 ? 0 : -1
  const actOn = act === 3 ? clamp01((p - 0.772) / 0.02) * (1 - clamp01((p - 0.93) / 0.02)) : act === 2 ? (1 - clamp01((p - 0.755) / 0.01)) * clamp01((p - 0.67) / 0.03) : act >= 0 ? 1 : 0
  // captions: each act's lines spread over its hold
  const spans = [[0.13, 0.25], [0.43, 0.52], [0.69, 0.755], [0.8, 0.925]]
  const caps = ALEPH_LINES.map((l, i) => {
    const same = ALEPH_LINES.filter((x) => x.act === l.act), j = same.indexOf(l)
    const [a, b] = spans[l.act]
    const c = same.length === 1 ? (a + b) / 2 : a + (j / (same.length - 1)) * (b - a)
    const w = Math.min(0.03, (b - a) / (same.length * 2.1))
    return { l, i, o: Math.max(0, 1 - Math.abs(p - c) / w) }
  })

  return (
    <motion.section className="descent chaos aleph" style={{ height: '1300vh' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="descent-stage">
        <Canvas dpr={low ? 1 : [1, 1.75]} camera={{ fov: 40, position: [0, -1.8, 15], near: 0.05, far: 400 }} gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ scene }) => { scene.background = new THREE.Color('#010103') }}>
          <PerformanceMonitor onDecline={() => performance.now() - born > 3000 && setLow(true)} flipflops={2} />
          <Suspense fallback={null}><Environment files={studio} environmentIntensity={0.6} /></Suspense>
          <directionalLight position={[5, 8, 6]} intensity={1.2} color="#e8eeff" />
          <directionalLight position={[-6, -3, -4]} intensity={0.6} color="#9fb0d8" />
          <Shell st={st} mats={ringMs} />
          <Eye st={st} eyeM={eyeM} />
          <Void st={st} voidM={voidM} lang={lang} />
          <Dust st={st} ringMs={ringMs} eyeM={eyeM} voidM={voidM} N={low ? 9000 : 16000} />
          <Multiverse st={st} low={low} />
          <Rig st={st} />
          {!low && <Lens st={st} effect={lens} />}
          {!low && (
            <EffectComposer multisampling={0}>
              <primitive object={lens} />
              <Bloom intensity={1.15} luminanceThreshold={0.38} mipmapBlur />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.18} darkness={0.9} />
            </EffectComposer>
          )}
        </Canvas>

        <div className="descent-ui chaos-ui aleph-ui">
          <div className="descent-intro" style={{ opacity: Math.max(0, 1 - p / 0.06) }}>
            <p className="sec-group">{T.eyebrow}</p>
            <h2 className="descent-title"><span>{T.title[0]}</span><i lang="zh-Hant">{T.title[1]}</i></h2>
            <p className="aleph-name"><span lang="zh-Hant">{ALEPH_NAME.cn}</span> {ALEPH_NAME[lang]} <code>{ALEPH_NAME.key}</code> · v{ALEPH_NAME.ver}</p>
            <p className="descent-hint">{T.hint} <span>↓</span></p>
          </div>

          {act >= 0 && (
            <div key={act} className="aleph-act" style={{ opacity: actOn }}>
              <span className="aleph-num">{T.acts[act].n}</span>
              <p className="aleph-act-name">{T.acts[act].name} <i lang="zh-Hant">{T.acts[act].cn}</i></p>
              <p className="aleph-act-line">{T.acts[act].line}</p>
            </div>
          )}

          {caps.map(({ l, i, o }) => o > 0 && (
            <figure key={i} className="descent-cap" style={{ opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
              <p className="descent-n">{l.who[lang]}</p>
              <blockquote lang="zh-Hant">{l.cn}</blockquote>
              <figcaption><p>{l[lang]}</p><span><code>{l.key}</code> · v{l.ver}{l.ownEn && lang === 'en' ? ` · ${T.ownEn}` : ''}</span></figcaption>
            </figure>
          ))}

          <div className="aleph-flash" style={{ opacity: Math.max(0, 1 - Math.abs(p - CUT) / 0.01) }} />
          <div className="aleph-end" style={{ opacity: clamp01((p - 0.94) / 0.035), pointerEvents: p > 0.955 ? 'auto' : 'none' }}>
            <p className="sec-group">{T.tierEyebrow}</p>
            <p className="aleph-tier">{T.tier}</p>
            <p className="aleph-lead">{T.lead}</p>
            <ol className="aleph-points">
              {T.points.map((x) => <li key={x.t}><b>{x.t}</b><span>{x.x}</span></li>)}
            </ol>
            <p className="chaos-note">{T.note}</p>
            <div className="chaos-actions">
              <button className="hero-enter" onClick={() => go('chaos')}>↑ {T.back}</button>
              <button className="crumb" onClick={() => go('map')}>{T.up}</button>
            </div>
          </div>
          <div className="descent-rail" aria-hidden="true"><span style={{ transform: `scaleY(${Math.min(1, p)})` }} /></div>
        </div>
      </div>
    </motion.section>
  )
}
