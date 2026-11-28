import * as THREE from 'three'
import { rng } from './cosmos.js'

// Universes as real 3D galaxies: stars laid out by kind, turning about their own axis in the shader.
export const KIND_NAME = {
  ru: ['спиральная', 'эллиптическая', 'туманность', 'мёртвая', 'вложенная'],
  en: ['spiral', 'elliptical', 'nebula', 'dead', 'nested'],
}
export const kindOf = (s) => (s < 0.42 ? 0 : s < 0.58 ? 1 : s < 0.74 ? 2 : s < 0.87 ? 3 : 4)
export const NESTED = [0.56, 0.31] // inner bubbles of a nested universe, as a share of its radius

const gauss = (r) => { let u = 0; for (let i = 0; i < 4; i++) u += r(); return (u - 2) / 0.58 }
const PAL = [[0.75, 0.82, 1], [1, 0.8, 0.55], [0.82, 0.74, 1], [0.68, 0.94, 0.96]]

// one star in the universe's own frame (radius 1): [x, y, z, size, r, g, b, speed]
function star(kind, r, sub) {
  if (kind === 0) { // spiral
    const arms = 2 + Math.floor(sub * 3), tw = 2.6 + sub * 2.2, q = r()
    if (q < 0.16) { const p = Math.abs(gauss(r)) * 0.07; const a = r() * 6.283; return [Math.cos(a) * p, Math.sin(a) * p, gauss(r) * 0.04, 1.3, 1, 0.94, 0.84, 0.9] }
    if (q < 0.3) { const p = Math.sqrt(r()) * 0.85, a = r() * 6.283; return [Math.cos(a) * p, Math.sin(a) * p, gauss(r) * 0.03, 0.6, 0.6, 0.68, 0.85, 0.7] }
    const k = Math.floor(r() * arms), t = Math.pow(r(), 0.75), p = 0.06 + t * 0.8
    const a = (k / arms) * 6.283 + p * tw + gauss(r) * 0.22 * (1 - 0.4 * t)
    const gold = r() < 0.07, blue = 0.6 + 0.4 * r()
    return [Math.cos(a) * p, Math.sin(a) * p, gauss(r) * 0.022 * (1 - p), gold ? 1.4 : 0.8 + r() * 0.6,
      gold ? 1 : blue * 0.82 + 0.18, gold ? 0.8 : blue * 0.88 + 0.12, gold ? 0.5 : 1, 0.7]
  }
  if (kind === 1) { // elliptical: an old, warm ball of stars
    const x = gauss(r) * 0.27, y = gauss(r) * 0.21, z = gauss(r) * 0.16
    const w = 0.85 + r() * 0.15
    return [x, y, z, 0.7 + r() * 0.6, 1 * w, 0.9 * w, 0.76 * w, 0.18]
  }
  if (kind === 2) { // nebula: clumps of coloured gas round young stars
    const c = Math.floor(r() * 6), cr = rng(Math.floor(sub * 1e6) + c * 7)
    const cx = (cr() - 0.5) * 1.0, cy = (cr() - 0.5) * 1.0, cz = (cr() - 0.5) * 0.6
    const col = PAL[Math.floor(cr() * PAL.length)], young = r() < 0.2
    return [cx + gauss(r) * 0.12, cy + gauss(r) * 0.12, cz + gauss(r) * 0.1, young ? 1.1 : 2.6,
      young ? 1 : col[0], young ? 1 : col[1], young ? 1 : col[2], 0.06]
  }
  if (kind === 3) { // dead: a few embers, nothing turns any more
    const p = Math.pow(r(), 0.6) * 0.85, a = r() * 6.283, e = r()
    return [Math.cos(a) * p, Math.sin(a) * p, gauss(r) * 0.12, 0.5 + r() * 0.5, e < 0.5 ? 1 : 0.55, e < 0.5 ? 0.55 : 0.5, e < 0.5 ? 0.32 : 0.48, 0]
  }
  // nested: shells inside shells, a bright core at the bottom of it all
  const q = r()
  const R = q < 0.36 ? 0.86 : q < 0.64 ? NESTED[0] * 0.9 : q < 0.84 ? NESTED[1] * 0.9 : Math.abs(gauss(r)) * 0.06
  const u = r() * 2 - 1, a = r() * 6.283, s = Math.sqrt(1 - u * u)
  const core = q >= 0.84
  return [Math.cos(a) * s * R, Math.sin(a) * s * R, u * R, core ? 1.3 : 0.7, core ? 1 : 0.86, core ? 0.95 : 0.9, core ? 0.85 : 1, 0.12]
}

// a universe's own axis (normal of its disc) and a direction in its plane, fixed by its seed
export function axisOf(sd, n = new THREE.Vector3(), u = new THREE.Vector3()) {
  const sr = rng(Math.floor(sd * 1e7) + 3)
  n.set(sr() - 0.5, sr() - 0.5, sr() - 0.5).normalize()
  const tmp = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  u.crossVectors(n, tmp).normalize()
  return { n, u, sr }
}

// spots: [{ p: Vector3, r, b, seed?, kind? }] → one geometry holding every star of every universe
export function starGeometry(spots, perUnit, seed = 1) {
  const r = rng(seed)
  const counts = spots.map((s) => {
    const kind = s.kind ?? kindOf(s.seed ?? 0)
    return Math.max(8, Math.round(perUnit * (s.stars ?? 1) * (kind === 3 ? 0.4 : 1)))
  })
  const N = counts.reduce((a, b) => a + b, 0)
  const aC = new Float32Array(N * 3), aP = new Float32Array(N * 4), aN = new Float32Array(N * 3), aU = new Float32Array(N * 3)
  const aS = new Float32Array(N * 4), col = new Float32Array(N * 3), aI = new Float32Array(N)
  const n = new THREE.Vector3(), u = new THREE.Vector3()
  let i = 0
  spots.forEach((s, k) => {
    const sd = s.seed ?? r(), kind = s.kind ?? kindOf(sd)
    const { sr } = axisOf(sd, n, u)
    for (let j = 0; j < counts[k]; j++, i++) {
      const [x, y, z, size, cr, cg, cb, sp] = star(kind, sr, sd)
      aC.set([s.p.x, s.p.y, s.p.z], i * 3)
      aP.set([Math.hypot(x, y), Math.atan2(y, x), z, sp], i * 4)
      aN.set([n.x, n.y, n.z], i * 3); aU.set([u.x, u.y, u.z], i * 3)
      aS.set([size, s.b ?? 0, s.gr ?? s.r, sr()], i * 4)
      col.set([cr, cg, cb], i * 3)
      aI[i] = k
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
  g.setAttribute('aC', new THREE.BufferAttribute(aC, 3)); g.setAttribute('aP', new THREE.BufferAttribute(aP, 4))
  g.setAttribute('aN', new THREE.BufferAttribute(aN, 3)); g.setAttribute('aU', new THREE.BufferAttribute(aU, 3))
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aI', new THREE.BufferAttribute(aI, 1))
  return g
}

const starVert = /* glsl */ `
attribute vec3 aC; attribute vec4 aP; attribute vec3 aN; attribute vec3 aU; attribute vec4 aS; attribute vec3 color; attribute float aI;
uniform float uG, uTime, uSize, uFocus, uDof, uVoidDim, uPx, uSkip;
varying vec3 vCol; varying float vA;
void main() {
  float on = smoothstep(aS.y, aS.y + 0.6, uG);
  vec3 v = cross(aN, aU);
  float ph = aP.y + uTime * aP.w * 0.05; // turning as one, so the arms do not wind up and smear
  vec3 p = aC + aS.z * ((cos(ph) * aU + sin(ph) * v) * aP.x + aN * aP.z);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float depth = max(0.001, -mv.z);
  // a lens: what is far from the focus gets big and faint
  float blur = clamp(abs(depth - uFocus) / max(uFocus, 1.0) * uDof, 0.0, 1.6);
  float px = uSize * aS.x * aS.z * uPx / depth * (1.0 + blur * 2.2);
  float a = on / (1.0 + blur * 4.0);
  if (px < 1.6) { a *= px / 1.6; px = 1.6; }
  a *= mix(1.0, smoothstep(10.0, 34.0, length(aC)), uVoidDim);
  a *= 0.6 + 0.4 * sin(uTime * (0.6 + aS.w * 2.0) + aS.w * 60.0);
  a *= step(0.5, abs(aI - uSkip)); // the universe we are inside is drawn by its own detailed galaxy
  vCol = color; vA = a;
  gl_PointSize = min(px, 28.0);
  gl_Position = projectionMatrix * mv;
}`
const starFrag = /* glsl */ `
uniform float uAlpha;
varying vec3 vCol; varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  vec3 c = mix(vCol, vec3(1.0), smoothstep(0.18, 0.0, d) * 0.6);
  gl_FragColor = vec4(c * a * vA * uAlpha, a * vA * uAlpha);
}`

export function starMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uG: { value: 1 }, uTime: { value: 0 }, uSize: { value: 0.03 }, uFocus: { value: 20 }, uDof: { value: 0 },
      uVoidDim: { value: 0 }, uAlpha: { value: 1 }, uPx: { value: 400 }, uSkip: { value: -1 },
    },
    vertexShader: starVert, fragmentShader: starFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
}

// glass bubbles: a rim that shifts colour like a soap film, almost nothing in the middle
const shellVert = /* glsl */ `
attribute float aSeed; attribute float aB; attribute float aIdx; attribute float aInner;
uniform float uG, uHover;
varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vOn; varying float vHi; varying float vInner; varying vec3 vW;
void main() {
  float on = smoothstep(aB, aB + 0.6, uG);
  vOn = on; vSeed = aSeed; vInner = aInner;
  vHi = 1.0 - step(0.5, abs(aIdx - uHover));
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * max(on, 0.0001), 1.0);
  vW = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec4 mv = viewMatrix * wp;
  vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const shellFrag = /* glsl */ `
uniform float uTime, uAlpha, uVoidDim; uniform vec3 uSeam;
varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vOn; varying float vHi; varying float vInner; varying vec3 vW;
void main() {
  float f = 1.0 - abs(dot(vN, vV));
  float film = 0.5 + 0.5 * sin(f * 9.0 + vSeed * 6.283 + uTime * 0.25);
  vec3 tint = mix(vec3(0.72, 0.82, 1.0), mix(uSeam, vec3(0.86, 0.76, 1.0), step(0.5, fract(vSeed * 5.3))), film * 0.55);
  float rim = pow(f, 3.4) * (vInner > 0.5 ? 0.4 : 0.62);
  float haze = (1.0 - f) * 0.035;
  float a = (rim * (1.1 + vHi * 1.6) + haze + vHi * 0.05) * vOn * uAlpha;
  a *= mix(1.0, smoothstep(10.0, 34.0, length(vW)), uVoidDim);
  gl_FragColor = vec4(tint * a, a);
}`

export function shellMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uG: { value: 1 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uHover: { value: -1 }, uVoidDim: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: shellVert, fragmentShader: shellFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })
}

// one instance per bubble (nested universes get their inner bubbles too); returns [universe index per instance]
export function fillShells(mesh, spots, seed = 1) {
  const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3()
  const owner = [], aSeed = [], aB = [], aIdx = [], aInner = []
  spots.forEach((o, k) => {
    const sd = o.seed ?? r(), kind = o.kind ?? kindOf(sd)
    const add = (scale, inner) => {
      s.setScalar(o.r * scale); m.compose(o.p, q, s); mesh.setMatrixAt(owner.length, m)
      owner.push(k); aSeed.push(sd + scale); aB.push(o.b ?? 0); aIdx.push(k); aInner.push(inner)
    }
    add(1, 0)
    if (kind === 4) NESTED.forEach((x) => add(x, 1))
  })
  const g = mesh.geometry
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(aSeed), 1))
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(aB), 1))
  g.setAttribute('aIdx', new THREE.InstancedBufferAttribute(new Float32Array(aIdx), 1))
  g.setAttribute('aInner', new THREE.InstancedBufferAttribute(new Float32Array(aInner), 1))
  mesh.count = owner.length
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere?.()
  return owner
}

// give every spot a fixed look (seed → kind) so the same universe looks the same everywhere it is drawn
export function seedSpots(spots, seed = 1) {
  const r = rng(seed)
  spots.forEach((s) => { if (s.seed == null) s.seed = r(); if (s.kind == null) s.kind = kindOf(s.seed) })
  return spots
}

// bubbles packed into a foam round an empty heart (where the void sits)
export function foam(n, rIn, rOut, seed = 1) {
  const r = rng(seed), S = []
  for (let i = 0; i < n; i++) {
    const d = new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.85, r() - 0.5).normalize()
    S.push({ p: d.multiplyScalar(rIn + r() * (rOut - rIn)), r: 0.9 + Math.pow(r(), 2.4) * 4.8 })
  }
  const gap = 0.25, d = new THREE.Vector3()
  for (let it = 0; it < 90; it++) {
    for (let i = 0; i < n; i++) {
      const a = S[i]
      for (let j = i + 1; j < n; j++) {
        const b = S[j]
        d.subVectors(b.p, a.p)
        const L = d.length(), want = a.r + b.r + gap
        if (L < want && L > 1e-4) {
          const push = (want - L) * 0.5
          d.multiplyScalar(push / L)
          a.p.sub(d); b.p.add(d)
        }
      }
      // keep the heart empty and the foam from drifting off: a gentle pull back into the band
      const L = a.p.length()
      if (L < rIn + a.r) a.p.multiplyScalar((rIn + a.r) / L)
      else a.p.multiplyScalar(1 - 0.004 * Math.max(0, (L - rIn) / (rOut - rIn)))
    }
  }
  return S
}
