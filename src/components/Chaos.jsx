import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, PerformanceMonitor, Sparkles, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { usePack } from '../lang'
import { bus, moodLerp } from '../bus'
import { CHAOS_LINES, CHAOS_TXT } from '../chaos'
import { rng, dotTexture, textBand } from '../cosmos'
import { seedSpots, axisOf, KIND_NAME } from '../universes'
import Universes from './Universes'

// ---------- the tree: one trunk with roots, a crown of ever finer branches, grown by a uniform ----------
function buildTree() {
  const r = rng(11)
  const parts = [], tips = [], twigs = []
  const SPEED = 3.0 // world units per second of growth
  const tube = (curve, radAt, birth, radial) => {
    const len = curve.getLength()
    const segs = Math.max(4, Math.round(len * (radial > 8 ? 10 : 5)))
    const g = new THREE.TubeGeometry(curve, segs, 1, radial, false)
    const pos = g.attributes.position, uv = g.attributes.uv, n = pos.count
    const aT = new Float32Array(n), aB = new Float32Array(n), aD = new Float32Array(n)
    const c = new THREE.Vector3()
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      curve.getPointAt(t, c)
      const rr = radAt(t)
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j
        pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * rr, c.y + (pos.getY(k) - c.y) * rr, c.z + (pos.getZ(k) - c.z) * rr)
        uv.setXY(k, (t * len) / 1.5, j / radial)
        aT[k] = t; aB[k] = birth; aD[k] = len / SPEED
      }
    }
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
    g.setAttribute('aB', new THREE.BufferAttribute(aB, 1))
    g.setAttribute('aD', new THREE.BufferAttribute(aD, 1))
    g.computeVertexNormals()
    parts.push(g)
    return birth + len / SPEED
  }
  const branch = (from, dir, len, rad, depth, birth) => {
    const pts = [from.clone()]
    let p = from.clone(), d = dir.clone()
    for (let i = 1; i <= 4; i++) {
      const out = new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.06)
      const lift = rad > 0.05 ? 0.07 : -0.035 // thick limbs reach up, thin twigs start to droop
      d.add(new THREE.Vector3((r() - 0.5) * 0.42, lift + (r() - 0.5) * 0.16, (r() - 0.5) * 0.42)).add(out).normalize()
      p = p.clone().addScaledVector(d, len / 4)
      pts.push(p)
    }
    const curve = new THREE.CatmullRomCurve3(pts)
    const radial = rad > 0.12 ? 12 : rad > 0.05 ? 8 : rad > 0.025 ? 6 : 4
    const end = tube(curve, (t) => rad * (1 - 0.32 * t), birth, radial)
    if (depth >= 6 || rad < 0.016) {
      twigs.push({ curve, birth, end })
      tips.push({ p: p.clone(), t: end, depth })
      return
    }
    const kids = depth < 3 ? 3 : depth < 4 ? 2 + (r() < 0.5 ? 1 : 0) : 2
    for (let k = 0; k < kids; k++) {
      const apical = k === 0
      const at = apical ? 1 : 0.35 + r() * 0.6
      const o = curve.getPointAt(at), tan = curve.getTangentAt(at)
      const side = new THREE.Vector3(r() - 0.5, (r() - 0.5) * 0.3, r() - 0.5).normalize()
      const nd = apical
        ? tan.clone().add(new THREE.Vector3((r() - 0.5) * 0.3, 0.05, (r() - 0.5) * 0.3)).normalize()
        : tan.clone().multiplyScalar(0.5).addScaledVector(side, 0.8 + r() * 0.3).add(new THREE.Vector3(0, 0.25, 0)).normalize()
      const here = rad * (1 - 0.32 * at)
      branch(o, nd, len * (0.72 + r() * 0.12), here * (apical ? 0.78 : 0.55 + r() * 0.15), depth + 1, birth + (end - birth) * at)
    }
  }
  // trunk with a flared foot
  const H = 4.6
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.3, 0), new THREE.Vector3(0.06, 1.1, 0.03), new THREE.Vector3(-0.12, 2.3, 0.1),
    new THREE.Vector3(0.1, 3.5, -0.06), new THREE.Vector3(0, H, 0),
  ])
  const tEnd = tube(trunk, (t) => 0.2 + 0.2 * (1 - t) + 0.32 * Math.exp(-(t + 0.02) * 16), 0, 16)
  // roots running out over the pool
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r() * 0.4, L = 1.8 + r() * 1.6
    const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a))
    const pts = [new THREE.Vector3(dir.x * 0.22, 0.32, dir.z * 0.22)]
    for (let i = 1; i <= 4; i++) {
      const t = i / 4
      const q = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (r() - 0.5) * 0.5 * t)
      pts.push(new THREE.Vector3(q.x * (0.3 + L * t), 0.3 * (1 - t) * (1 - t) - 0.04 * t, q.z * (0.3 + L * t)))
    }
    tube(new THREE.CatmullRomCurve3(pts), (t) => 0.17 * (1 - t) + 0.012, 0, 8)
  }
  // limbs round the upper trunk, plus a leader carrying on up
  for (let k = 0; k < 5; k++) {
    const t = 0.56 + k * 0.1, a = k * 2.399
    const o = trunk.getPointAt(Math.min(1, t))
    branch(o, new THREE.Vector3(Math.cos(a), 0.75 + k * 0.08, Math.sin(a)).normalize(), 2.7 - k * 0.12, 0.17 - k * 0.012, 1, tEnd * t)
  }
  branch(trunk.getPointAt(1), new THREE.Vector3(0.05, 1, 0.02).normalize(), 2.4, 0.17, 1, tEnd)

  const geo = mergeGeometries(parts)
  geo.computeBoundingBox()
  const total = Math.max(...tips.map((t) => t.t))
  const bb = geo.boundingBox
  return { geo, tips, twigs, total, top: bb.max.y, spread: Math.max(bb.max.x, -bb.min.x, bb.max.z, -bb.min.z) }
}

// pale bark: furrows running along the branch, fine grain, dark birch-like marks across. Tiles both ways.
function barkTexture() {
  const W = 512, Hh = 512
  const c = document.createElement('canvas'); c.width = W; c.height = Hh
  const x = c.getContext('2d'), img = x.createImageData(W, Hh), d = img.data
  const r = rng(3), ph = Array.from({ length: 6 }, () => r() * 6.283)
  const hash = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v) }
  for (let j = 0; j < Hh; j++) {
    for (let i = 0; i < W; i++) {
      const u = i / W, v = j / Hh
      // u runs along the branch: furrows are lines of constant v, wavering with u
      const w = v * 9 + 0.18 * Math.sin(6.283 * (u * 2) + ph[0]) + 0.08 * Math.sin(6.283 * (u * 5 + v * 2) + ph[1]) + 0.05 * Math.sin(6.283 * (u * 11) + ph[2])
      const f = Math.abs(Math.sin(Math.PI * w))
      const ridge = Math.pow(f, 0.45)
      const grain = 0.88 + 0.12 * hash(i, j)
      let l = (0.42 + 0.58 * ridge) * grain
      d[(j * W + i) * 4] = l * 236; d[(j * W + i) * 4 + 1] = l * 240; d[(j * W + i) * 4 + 2] = l * 248; d[(j * W + i) * 4 + 3] = 255
    }
  }
  x.putImageData(img, 0, 0)
  // short dark marks across the furrows
  x.fillStyle = 'rgba(40,44,56,.55)'
  for (let k = 0; k < 120; k++) {
    const px = r() * W, py = r() * Hh, w = 2 + r() * 3, h = 10 + r() * 34
    x.fillRect(px, py, w, h); x.fillRect(px, py - Hh, w, h)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function leafTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256
  const x = c.getContext('2d')
  x.beginPath(); x.moveTo(64, 250)
  x.bezierCurveTo(4, 190, 10, 60, 64, 6); x.bezierCurveTo(118, 60, 124, 190, 64, 250); x.closePath()
  const g = x.createLinearGradient(0, 0, 0, 256)
  g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d8e2f4')
  x.fillStyle = g; x.fill()
  x.strokeStyle = 'rgba(150,165,195,.7)'; x.lineWidth = 2.2
  x.beginPath(); x.moveTo(64, 248); x.lineTo(64, 14); x.stroke()
  x.lineWidth = 1.1
  for (let i = 0; i < 7; i++) {
    const y = 210 - i * 26
    x.beginPath(); x.moveTo(64, y); x.quadraticCurveTo(84, y - 14, 102, y - 34 + i * 2); x.stroke()
    x.beginPath(); x.moveTo(64, y); x.quadraticCurveTo(44, y - 14, 26, y - 34 + i * 2); x.stroke()
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t
}

const leafVert = /* glsl */ `
attribute float aB; attribute float aR;
uniform float uG, uTime, uSize;
varying float vA; varying float vR;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.8 + aR * 40.0) * 0.05; p.y += sin(uTime * 0.6 + aR * 17.0) * 0.04;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float on = smoothstep(aB, aB + 0.9, uG);
  vA = on * (0.5 + 0.5 * sin(uTime * (1.5 + aR * 3.0) + aR * 50.0));
  vR = aR;
  gl_PointSize = min(30.0, uSize * (0.3 + aR * aR) * on * (300.0 / -mv.z));
  gl_Position = projectionMatrix * mv;
}`
const leafFrag = /* glsl */ `
uniform vec3 uSeam;
varying float vA; varying float vR;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  float a = smoothstep(0.5, 0.0, d); a = a * a * 0.9;
  vec3 col = mix(vec3(0.78, 0.86, 1.0), vec3(1.0), smoothstep(0.22, 0.0, d)) * 1.3;
  col = mix(col, uSeam, step(0.86, vR) * 0.85);
  gl_FragColor = vec4(col * a * vA, a * vA);
}`

const poolFrag = /* glsl */ `
uniform float uTime, uG; uniform vec3 uSeam; varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
  float rim = exp(-pow((r - 0.62) * 40.0, 2.0));
  float ripple = 0.5 + 0.5 * sin(r * 46.0 - uTime * 1.6);
  float inner = smoothstep(0.62, 0.0, r) * (0.12 + 0.1 * ripple);
  float glow = exp(-r * r * 6.0) * 0.4;
  float a = (rim * 0.9 + inner + glow) * smoothstep(1.0, 0.6, r) * (0.25 + 0.75 * min(1.0, uG * 1.4 + 0.1));
  vec3 col = mix(vec3(0.62, 0.74, 1.0), vec3(1.0), rim) + uSeam * glow * 0.6;
  gl_FragColor = vec4(col * a, a);
}`

const TREE = { data: null, fruit: null }
const treeData = () => (TREE.data ||= buildTree())
const fruitSpots = () => {
  if (TREE.fruit) return TREE.fruit
  const r = rng(17), out = []
  treeData().tips.forEach((t, i) => {
    if (i % 9 !== 4) return
    out.push({ p: t.p.clone().add(new THREE.Vector3(0, -0.28 - r() * 0.2, 0)), r: 0.2 + r() * 0.24, b: t.t + 0.5 })
  })
  return (TREE.fruit = seedSpots(out, 61))
}

function Tree({ grow, inside, low, lang, pointer }) {
  const { geo, tips, twigs, total, top, spread } = treeData()
  const u = useMemo(() => ({ uG: { value: 0 }, uTime: { value: 0 }, uTip: { value: new THREE.Color('#ffc870') }, uSeam: { value: new THREE.Color('#ffc870') } }), [])
  const bark = useMemo(barkTexture, [])
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: '#eef1f7', map: bark, bumpMap: bark, bumpScale: 3.2, roughness: 0.78, metalness: 0.04,
      emissive: '#9fb2d8', emissiveIntensity: 0.16, envMapIntensity: 1.1,
    })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uG = u.uG; sh.uniforms.uTip = u.uTip
      sh.vertexShader = 'attribute float aT; attribute float aB; attribute float aD; varying float vT; varying float vP; uniform float uG;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vT = aT; vP = clamp((uG - aB) / aD, 0.0, 1.0);')
      sh.fragmentShader = 'varying float vT; varying float vP; uniform vec3 uTip;\n' +
        sh.fragmentShader.replace('void main() {', 'void main() {\n if (vT > vP + 0.0001) discard;')
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
 totalEmissiveRadiance += uTip * 2.5 * smoothstep(0.08, 0.0, vP - vT) * step(vP, 0.999);
 float fr = pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 3.0);
 totalEmissiveRadiance += vec3(0.72, 0.8, 1.0) * fr * 0.55;`)
    }
    return m
  }, [u, bark])

  // leaves: real blades along every twig, opening as the twig grows past them
  const leaves = useMemo(() => {
    const r = rng(5), per = 12, N = twigs.length * per
    const geo = new THREE.PlaneGeometry(0.105, 0.2); geo.translate(0, 0.1, 0)
    const aB = new Float32Array(N), aR = new Float32Array(N)
    const mtx = [], cols = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3()
    let i = 0
    for (const tw of twigs) {
      for (let k = 0; k < per; k++) {
        const t = 0.3 + 0.7 * r()
        const p = tw.curve.getPointAt(t)
        p.x += (r() - 0.5) * 0.16; p.y += (r() - 0.5) * 0.12; p.z += (r() - 0.5) * 0.16
        e.set(-0.4 + r() * 1.6, r() * 6.283, (r() - 0.5) * 1.8); q.setFromEuler(e); s.setScalar(0.75 + r() * 0.6)
        m.compose(p, q, s); mtx.push(m.clone())
        const tone = r()
        cols.push(tone < 0.07 ? new THREE.Color('#ffe2b0') : tone < 0.45 ? new THREE.Color('#dfe8ff') : new THREE.Color('#ffffff'))
        aB[i] = tw.birth + (tw.end - tw.birth) * t + 0.25; aR[i] = r(); i++
      }
    }
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 1))
    geo.setAttribute('aR', new THREE.InstancedBufferAttribute(aR, 1))
    return { geo, mtx, cols, N }
  }, [twigs])
  const leafMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: leafTexture(), alphaTest: 0.45, side: THREE.DoubleSide, color: '#f6f8ff', emissive: '#c7d6ff', emissiveIntensity: 0.5,
      roughness: 0.5, metalness: 0.05,
    })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uG = u.uG; sh.uniforms.uTime = u.uTime
      sh.vertexShader = 'attribute float aB; attribute float aR; uniform float uG; uniform float uTime;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
 float on = smoothstep(aB, aB + 0.7, uG);
 transformed *= max(on, 0.0001);
 transformed.x += sin(uTime * 1.4 + aR * 40.0) * 0.08 * position.y;
 transformed.z += cos(uTime * 1.1 + aR * 23.0) * 0.06 * position.y;`)
    }
    return m
  }, [u])
  const leafRef = useRef()
  useEffect(() => {
    const im = leafRef.current
    leaves.mtx.forEach((m, i) => { im.setMatrixAt(i, m); im.setColorAt(i, leaves.cols[i]) })
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  }, [leaves])

  // motes of light in the crown
  const motes = useMemo(() => {
    const r = rng(7), pos = [], aB = [], aR = []
    for (const tw of twigs) {
      for (let i = 0; i < 4; i++) {
        const p = tw.curve.getPointAt(r())
        pos.push(p.x + (r() - 0.5) * 0.9, p.y + (r() - 0.5) * 0.7, p.z + (r() - 0.5) * 0.9); aB.push(tw.end + r() * 0.6); aR.push(r())
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 1))
    g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 1))
    return g
  }, [twigs])
  const moteMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uG: u.uG, uTime: u.uTime, uSize: { value: 0.8 }, uSeam: u.uSeam }, vertexShader: leafVert, fragmentShader: leafFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [u])

  // the multiverse: universes hanging from the crown, each a galaxy of real stars in a glass bubble
  const spots = fruitSpots()
  const fctl = useRef({ g: 0, alpha: 1, hover: -1, skip: -1 })
  const threads = useMemo(() => {
    const pos = []
    spots.forEach((s) => { pos.push(s.p.x, s.p.y + s.r, s.p.z, s.p.x, s.p.y + s.r + 0.3, s.p.z) })
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g
  }, [spots])

  // the crown's name, on a ring of light above it
  const band = useMemo(() => textBand(lang === 'ru' ? 'ДРЕВО МУЛЬТИВСЕЛЕННОЙ   ·   混沌   ·   ' : 'THE TREE OF THE MULTIVERSE   ·   混沌   ·   ', { spacing: 26 }), [lang])
  const ring = useRef(), ringMat = useRef(), hoop = useRef()
  const ringR = Math.max(3.4, spread * 1.02)

  // petals drifting down once the canopy is full
  const petals = useMemo(() => {
    const r = rng(9), N = 260, pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) { pos[i * 3] = (r() - 0.5) * spread * 1.6; pos[i * 3 + 1] = 2 + r() * top; pos[i * 3 + 2] = (r() - 0.5) * spread * 1.6; seed[i] = r() }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return { g, seed, N }
  }, [spread, top])
  const pm = useRef(), rim = useRef()
  const poolMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: u.uTime, uG: u.uG, uSeam: u.uSeam },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: poolFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }), [u])

  const grp = useRef()
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    u.uG.value = grow.current * (total + 1)
    u.uTime.value = t
    Object.assign(fctl.current, { g: u.uG.value, hover: pointer.current.hover, skip: pointer.current.focus })
    moodLerp(u.uTip.value, 'seam', 0.05); moodLerp(u.uSeam.value, 'seam', 0.05)
    const full = THREE.MathUtils.clamp((grow.current - 0.82) / 0.18, 0, 1)
    pm.current.opacity = full * 0.7
    ringMat.current.opacity = full
    hoop.current.material.opacity = full * 0.5
    ring.current.rotation.y -= dt * 0.05
    if (full > 0) {
      const a = petals.g.attributes.position.array
      for (let i = 0; i < petals.N; i++) {
        a[i * 3 + 1] -= dt * (0.25 + petals.seed[i] * 0.35)
        a[i * 3] += Math.sin(t * 0.7 + petals.seed[i] * 30) * dt * 0.2
        if (a[i * 3 + 1] < 0.05) { a[i * 3 + 1] = top * (0.6 + petals.seed[i] * 0.4); a[i * 3] = (Math.random() - 0.5) * spread * 1.4; a[i * 3 + 2] = (Math.random() - 0.5) * spread * 1.4 }
      }
      petals.g.attributes.position.needsUpdate = true
    }
    // the rim light always sits behind the tree, as seen from the camera
    rim.current.position.set(-st.camera.position.x, 9, -st.camera.position.z)
    grp.current.visible = !inside.current
  })
  return (
    <group ref={grp}>
      <directionalLight ref={rim} intensity={2.4} color="#dfe8ff" />
      <pointLight position={[0, top * 0.72, 0]} intensity={36} distance={top * 1.6} color="#e9efff" />
      <mesh geometry={geo} material={mat} />
      <instancedMesh ref={leafRef} args={[leaves.geo, leafMat, leaves.N]} frustumCulled={false} />
      <points geometry={motes} material={moteMat} frustumCulled={false} />
      <Universes spots={spots} per={low ? 160 : 280} ctl={fctl} seed={21} size={0.12}
        onHover={(k, e) => pointer.current.onHover?.(k, e)} onPick={(k) => pointer.current.onPick?.(k)} />
      <lineSegments geometry={threads}>
        <lineBasicMaterial color="#cfd9f2" transparent opacity={0.35} />
      </lineSegments>
      <group ref={ring} position={[0, top * 0.64, 0]}>
        <mesh>
          <cylinderGeometry args={[ringR, ringR, 0.72, 200, 1, true]} />
          <meshBasicMaterial ref={ringMat} map={band} transparent opacity={0} depthWrite={false} side={THREE.FrontSide} toneMapped={false} />
        </mesh>
        <mesh ref={hoop} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
          <torusGeometry args={[ringR, 0.006, 6, 200]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} toneMapped={false} />
        </mesh>
      </group>
      <points geometry={petals.g} frustumCulled={false}>
        <pointsMaterial ref={pm} size={0.05} color="#eaf2ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={poolMat}>
        <planeGeometry args={[11, 11]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[70, 64]} />
        {low
          ? <meshStandardMaterial color="#05060a" roughness={0.2} metalness={0.6} />
          : <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={18} roughness={0.9} depthScale={1.1} minDepthThreshold={0.3} maxDepthThreshold={1.4} color="#06070b" metalness={0.6} mirror={0.5} />}
      </mesh>
    </group>
  )
}

// ---------- inside: threads of possibility, and on them the universes ----------
function Inside({ inside }) {
  const { geo, spots } = useMemo(() => {
    const r = rng(23), pos = [], col = [], c = new THREE.Color(), spots = []
    let n0 = 0
    const walk = (p, d, n, depth) => {
      for (let i = 0; i < n; i++) {
        d.add(new THREE.Vector3((r() - 0.5) * 0.4, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4)).normalize()
        p = p.clone().addScaledVector(d, 0.09)
        pos.push(p.x, p.y, p.z)
        c.setHSL(0.6 + (r() - 0.5) * 0.08, 0.3, 0.5 + r() * 0.25); col.push(c.r, c.g, c.b)
        if (++n0 % 11 === 0) spots.push({ p: p.clone(), r: 0.03 + r() * 0.07, b: 0 })
        if (depth < 4 && r() < 0.035) walk(p.clone(), d.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5)).normalize(), Math.floor(n * 0.7), depth + 1)
      }
    }
    for (let k = 0; k < 60; k++) walk(new THREE.Vector3(), new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), 90, 0)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return { geo: g, spots: seedSpots(spots, 71) }
  }, [])
  const dot = useMemo(dotTexture, [])
  const uctl = useRef({ g: 1, alpha: 0 })
  const g = useRef(), m = useRef()
  useFrame((st, dt) => {
    const want = inside.current ? 1 : 0
    m.current.opacity += (want * 0.5 - m.current.opacity) * Math.min(1, dt * 1.5)
    uctl.current.alpha = m.current.opacity / 0.5
    g.current.visible = m.current.opacity > 0.01
    g.current.rotation.y += dt * 0.04
    g.current.rotation.x = Math.sin(st.clock.elapsedTime * 0.1) * 0.2
  })
  return (
    <group ref={g} position={[0, 3, 0]}>
      <points geometry={geo}>
        <pointsMaterial ref={m} size={0.03} map={dot} alphaMap={dot} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <Universes spots={spots} per={50} ctl={uctl} seed={41} size={0.16} />
    </group>
  )
}

// the universe you clicked, drawn in full: stand inside its bubble, above its galaxy
function Focus({ pointer }) {
  const [k, setK] = useState(-1)
  useFrame(() => { if (pointer.current.focus !== k) setK(pointer.current.focus) })
  const spot = k >= 0 ? fruitSpots()[k] : null
  const detail = useMemo(() => (spot ? [{ ...spot, gr: spot.r * 0.34, stars: 1, b: 0 }] : []), [spot])
  const dctl = useRef({ g: 1, alpha: 1 })
  if (!spot) return null
  return <Universes key={k} spots={detail} per={spot.kind === 3 ? 12000 : 9000} ctl={dctl} seed={k + 3} shells={false} size={0.009} />
}

function Rig({ prog, inside, pointer }) {
  const look = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const off = useRef(0)
  const at = useMemo(() => new THREE.Vector3(), [])
  useFrame((st, dt) => {
    const c = st.camera, p = prog.current, k = Math.min(1, dt * 2)
    let x, y, z, ly
    const f = pointer.current.focus
    if (f >= 0) {
      // fly into the universe: above its galaxy, looking at its core
      const s = fruitSpots()[f], { n } = axisOf(s.seed)
      at.copy(s.p).addScaledVector(n, s.r * 0.86)
      const kk = Math.min(1, dt * 1.6)
      c.position.lerp(at, kk)
      look.lerp(s.p, kk)
      c.lookAt(look)
      if (c.view?.enabled) c.clearViewOffset()
      off.current = 0
      return
    }
    if (inside.current) {
      // drift inside the field
      const t = st.clock.elapsedTime * 0.05
      x = Math.sin(t) * 3.4; y = 3 + Math.sin(t * 1.3) * 0.6; z = Math.cos(t) * 3.4; ly = 3
    } else {
      const g = THREE.MathUtils.clamp((p - 0.12) / 0.6, 0, 1)
      const a = -0.2 + p * 1.6 + bus.mouse.x * 0.15
      // portrait screens are narrow: stand further back so the canopy fits across
      const wide = Math.min(1.6, Math.max(1, 1.25 / (st.size.width / st.size.height)))
      const { top, spread } = treeData()
      const R = THREE.MathUtils.lerp(7, Math.max(spread, top * 0.8) * 2.2, g) * wide
      x = Math.sin(a) * R; z = Math.cos(a) * R
      y = THREE.MathUtils.lerp(1.0, top * 0.45, g) + bus.mouse.y * 0.4
      ly = THREE.MathUtils.lerp(0.6, top * 0.7, g)
    }
    c.position.x += (x - c.position.x) * k; c.position.y += (y - c.position.y) * k; c.position.z += (z - c.position.z) * k
    look.x += (0 - look.x) * k; look.z += (0 - look.z) * k
    look.y += (ly - look.y) * k
    c.lookAt(look)
    // on wide screens slide the grown tree right, so the reading on the left has its own space
    const { width: W, height: Hh } = st.size
    const want = !inside.current && p > 0.8 && W / Hh > 1.15 ? -0.13 * W : 0
    off.current += (want - off.current) * k
    if (Math.abs(off.current) > 0.5) c.setViewOffset(W, Hh, off.current, 0, W, Hh)
    else if (c.view?.enabled) c.clearViewOffset()
  })
  return null
}

export default function Chaos({ go }) {
  const { UI } = usePack()
  const lang = UI.lang
  const T = CHAOS_TXT[lang]
  const prog = useRef(0), grow = useRef(0), inside = useRef(false)
  const [p, setP] = useState(0)
  const [isIn, setIn] = useState(false)
  const [flash, setFlash] = useState(0)
  const [low, setLow] = useState(false)
  const [born] = useState(() => performance.now())
  // pointing at the universes on the tree, and flying into one
  const pointer = useRef({ hover: -1, focus: -1 })
  const [hover, setHover] = useState(null)
  const [focus, setFocus] = useState(-1)
  pointer.current.onHover = (k, e) => {
    const ok = k >= 0 && grow.current > 0.92 && !inside.current && pointer.current.focus < 0
    pointer.current.hover = ok ? k : -1
    document.body.style.cursor = ok ? 'pointer' : ''
    setHover(ok ? { k, x: e?.nativeEvent?.clientX ?? 0, y: e?.nativeEvent?.clientY ?? 0 } : null)
  }
  pointer.current.onPick = (k) => {
    if (k < 0 || grow.current < 0.92 || inside.current || pointer.current.focus >= 0) return
    bus.sfx('plunge')
    pointer.current.focus = k; pointer.current.hover = -1
    document.body.style.cursor = ''
    setHover(null); setFocus(k)
  }
  const unfocus = () => { if (pointer.current.focus < 0) return; bus.sfx('iris'); pointer.current.focus = -1; setFocus(-1) }
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') unfocus() }
    addEventListener('keydown', key)
    return () => { removeEventListener('keydown', key); document.body.style.cursor = '' }
  }, [])

  useEffect(() => {
    let raf
    const tick = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const want = max > 0 ? scrollY / max : 0
      prog.current += (want - prog.current) * 0.08
      grow.current = THREE.MathUtils.clamp((prog.current - 0.12) / 0.6, 0, 1)
      setP((v) => (Math.abs(v - prog.current) > 0.003 ? prog.current : v))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const enter = () => {
    bus.sfx('plunge')
    setFlash(Date.now())
    setTimeout(() => { inside.current = true; setIn(true) }, 650)
  }
  const leave = () => { bus.sfx('iris'); setFlash(Date.now()); setTimeout(() => { inside.current = false; setIn(false) }, 500) }

  // captions spread across the growth; each one shows while the scroll is near its spot
  const N = CHAOS_LINES.length
  const at = (i) => 0.16 + (i / (N - 1)) * 0.64
  const vis = (c, w = 0.036) => Math.max(0, 1 - Math.abs(p - c) / w)

  return (
    <motion.section className="descent chaos" style={{ height: '900vh' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="descent-stage">
        <Canvas dpr={low ? 1 : [1, 1.75]} camera={{ fov: 42, position: [0, 1, 7], near: 0.02, far: 200 }} gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ scene }) => { scene.fog = new THREE.FogExp2('#020205', 0.022); scene.background = new THREE.Color('#010103') }}>
          <PerformanceMonitor onDecline={() => performance.now() - born > 3000 && setLow(true)} flipflops={2} />
          <Suspense fallback={null}><Environment files={studio} environmentIntensity={0.35} /></Suspense>
          <directionalLight position={[-4, 9, 5]} intensity={0.7} color="#cfdcff" />
          <hemisphereLight args={['#cdd8f5', '#05060a', 0.35]} />
          <Tree grow={grow} inside={inside} low={low} lang={lang} pointer={pointer} />
          <Focus pointer={pointer} />
          <Inside inside={inside} />
          <Sparkles count={160} scale={[22, 14, 22]} position={[0, 6, 0]} size={2.2} speed={0.25} opacity={0.5} color="#dfe8ff" />
          <Rig prog={prog} inside={inside} pointer={pointer} />
          {!low && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={1.1} luminanceThreshold={0.45} mipmapBlur />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.18} darkness={0.92} />
            </EffectComposer>
          )}
        </Canvas>

        <div className="descent-ui chaos-ui">
          {!isIn && focus < 0 && (
            <>
              <div className="descent-intro" style={{ opacity: Math.max(0, 1 - p / 0.1) }}>
                <p className="sec-group">{T.eyebrow}</p>
                <h2 className="descent-title"><span>{T.title[0]}</span><i lang="zh-Hant">{T.title[1]}</i></h2>
                <p className="descent-hint">{T.void} <span>↓</span></p>
              </div>
              <p className="chaos-whisper" style={{ opacity: vis(0.12, 0.04) }}>{T.grow}</p>
              <p className="chaos-name" style={{ opacity: Math.min(1, Math.max(0, (p - 0.3) / 0.1)) * Math.max(0, 1 - (p - 0.7) / 0.06) }}>{T.bough}</p>
              <div className="chaos-crown" style={{ opacity: Math.max(0, Math.min(1, (p - 0.76) / 0.08)) }}>
                <p className="sec-group" lang="zh-Hant">{T.crownEyebrow}</p>
                <h2><span>{T.crown[0]}</span> <i>{T.crown[1]}</i></h2>
              </div>
              {CHAOS_LINES.map((l, i) => {
                const o = vis(at(i))
                if (o <= 0) return null
                return (
                  <figure key={l.key} className="descent-cap" style={{ opacity: o, transform: `translateY(${(1 - o) * 16}px)` }}>
                    <p className="descent-n">{l.who[lang]}</p>
                    <blockquote lang="zh-Hant">{l.cn}</blockquote>
                    <figcaption><p>{l[lang]}</p><span><code>{l.key}</code> · v{l.ver}</span></figcaption>
                  </figure>
                )
              })}
              <div className="chaos-end" style={{ opacity: Math.max(0, Math.min(1, (p - 0.84) / 0.06)), pointerEvents: p > 0.86 ? 'auto' : 'none' }}>
                <p className="sec-group">{T.readTitle}</p>
                <p className="chaos-read">{T.read}</p>
                <div className="chaos-actions">
                  <button className="hero-enter" onClick={enter}>{T.enter} →</button>
                  <button className="crumb" onClick={() => go('aleph')}>{T.below} ↓</button>
                </div>
              </div>
            </>
          )}
          <AnimatePresence>
            {isIn && (
              <motion.div className="chaos-inside" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.2, delay: 0.4 }}>
                <h3 className="descent-title"><span>{T.insideTitle[0]}</span><i>{T.insideTitle[1]}</i></h3>
                <p className="chaos-read">{T.inside}</p>
                <p className="chaos-note">{T.reading}</p>
                <div className="chaos-actions">
                  <button className="hero-enter" onClick={leave}>← {T.back}</button>
                  <button className="crumb" onClick={() => go('aleph')}>{T.below} ↓</button>
                  <button className="crumb" onClick={() => go('map')}>{T.up}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {focus >= 0 && (
              <motion.div key="uni" className="chaos-inside chaos-uni" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1, delay: 0.6 }}>
                <p className="sec-group">{T.uniEyebrow}</p>
                <h3 className="descent-title"><span>{T.uniTitle} № {String(focus + 1).padStart(3, '0')}</span><i>{KIND_NAME[lang][fruitSpots()[focus].kind]}</i></h3>
                <p className="chaos-read">{T.uniText}</p>
                <div className="chaos-actions">
                  <button className="hero-enter" onClick={unfocus}>← {T.uniBack}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {hover && <p className="uni-tip" style={{ left: hover.x + 16, top: hover.y + 14 }}>{T.uniTitle} № {String(hover.k + 1).padStart(3, '0')} · {KIND_NAME[lang][fruitSpots()[hover.k].kind]}<span>{T.uniHint}</span></p>}
          <div className="descent-rail" aria-hidden="true">
            <span style={{ transform: `scaleY(${Math.min(1, p)})` }} />
          </div>
        </div>
        {flash > 0 && <div key={flash} className="chaos-flash" aria-hidden="true" />}
      </div>
    </motion.section>
  )
}
