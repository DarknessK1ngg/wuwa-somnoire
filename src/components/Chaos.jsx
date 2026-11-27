import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, PerformanceMonitor, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { usePack } from '../lang'
import { bus, moodLerp } from '../bus'
import { CHAOS_LINES, CHAOS_TXT } from '../chaos'

// ---------- the tree: a twisted trunk of three strands, branching outward, grown by a uniform ----------
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

function buildTree() {
  const r = rng(11)
  const parts = [], tips = []
  const SPEED = 3.2 // world units per second of growth
  const tube = (pts, r0, r1, birth, depth) => {
    const curve = new THREE.CatmullRomCurve3(pts)
    const len = curve.getLength()
    const segs = Math.max(6, Math.round(len * 5)), rad = depth < 2 ? 10 : 6
    const g = new THREE.TubeGeometry(curve, segs, 1, rad, false)
    const pos = g.attributes.position, n = pos.count
    const aT = new Float32Array(n), aB = new Float32Array(n), aD = new Float32Array(n)
    const c = new THREE.Vector3()
    for (let i = 0; i <= segs; i++) {
      const t = i / segs
      curve.getPointAt(t, c)
      const rr = r0 + (r1 - r0) * t
      for (let j = 0; j <= rad; j++) {
        const k = i * (rad + 1) + j
        pos.setXYZ(k, c.x + (pos.getX(k) - c.x) * rr, c.y + (pos.getY(k) - c.y) * rr, c.z + (pos.getZ(k) - c.z) * rr)
        aT[k] = t; aB[k] = birth; aD[k] = len / SPEED
      }
    }
    g.setAttribute('aT', new THREE.BufferAttribute(aT, 1))
    g.setAttribute('aB', new THREE.BufferAttribute(aB, 1))
    g.setAttribute('aD', new THREE.BufferAttribute(aD, 1))
    g.deleteAttribute('uv')
    g.computeVertexNormals()
    parts.push(g)
    return { curve, end: birth + len / SPEED }
  }
  const branch = (from, dir, len, rad, depth, birth) => {
    const pts = [from.clone()]
    let p = from.clone(), d = dir.clone()
    for (let i = 1; i <= 4; i++) {
      d.add(new THREE.Vector3((r() - 0.5) * 0.35, 0.08 + (r() - 0.5) * 0.15, (r() - 0.5) * 0.35)).normalize()
      p = p.clone().addScaledVector(d, len / 4)
      pts.push(p)
    }
    const { curve, end } = tube(pts, rad, rad * 0.62, birth, depth)
    if (depth >= 5 || rad < 0.025) { tips.push({ p: p.clone(), t: end }); return }
    const kids = depth < 2 ? 3 : 2 + (r() < 0.5 ? 1 : 0)
    for (let k = 0; k < kids; k++) {
      const at = 0.55 + r() * 0.45
      const o = curve.getPointAt(at)
      const tan = curve.getTangentAt(at)
      const side = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize()
      const nd = tan.clone().multiplyScalar(0.55).addScaledVector(side, 0.75 + r() * 0.3).add(new THREE.Vector3(0, 0.35 + r() * 0.3, 0)).normalize()
      branch(o, nd, len * (0.62 + r() * 0.16), rad * 0.6, depth + 1, birth + (end - birth) * at)
    }
  }
  // trunk: three strands twisting around each other, like the bough in the game
  const H = 5.2
  const tops = []
  for (let s = 0; s < 3; s++) {
    const pts = []
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, a = s * (Math.PI * 2 / 3) + t * Math.PI * 1.6
      const w = 0.34 * (1 - t * 0.5)
      pts.push(new THREE.Vector3(Math.cos(a) * w, t * H, Math.sin(a) * w))
    }
    const { end } = tube(pts, 0.2, 0.13, 0, 0)
    tops.push({ p: pts[pts.length - 1], a: s * (Math.PI * 2 / 3), end })
  }
  for (const t of tops) {
    for (let k = 0; k < 2; k++) {
      const a = t.a + k * 1.1 + 0.4
      branch(t.p, new THREE.Vector3(Math.cos(a) * 0.8, 1, Math.sin(a) * 0.8).normalize(), 3.1, 0.12, 1, t.end * 0.92)
    }
  }
  const geo = mergeGeometries(parts)
  const total = Math.max(...tips.map((t) => t.t))
  return { geo, tips, total }
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
  vA = on * (0.55 + 0.45 * sin(uTime * (1.5 + aR * 3.0) + aR * 50.0));
  vR = aR;
  gl_PointSize = min(44.0, uSize * (0.35 + aR * aR) * on * (300.0 / -mv.z));
  gl_Position = projectionMatrix * mv;
}`
const leafFrag = /* glsl */ `
uniform vec3 uSeam;
varying float vA; varying float vR;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  float a = smoothstep(0.5, 0.0, d); a = a * a * 0.9;
  vec3 col = mix(vec3(0.72, 0.84, 1.0), vec3(1.0), smoothstep(0.22, 0.0, d)) * 1.4;
  col = mix(col, uSeam, step(0.93, vR) * 0.8);
  gl_FragColor = vec4(col * a * vA, a * vA);
}`

const poolFrag = /* glsl */ `
uniform float uTime, uG; uniform vec3 uSeam; varying vec2 vUv;
void main() {
  vec2 p = (vUv - 0.5) * 2.0; float r = length(p);
  float rim = exp(-pow((r - 0.62) * 40.0, 2.0));
  float ripple = 0.5 + 0.5 * sin(r * 46.0 - uTime * 1.6);
  float inner = smoothstep(0.62, 0.0, r) * (0.18 + 0.12 * ripple);
  float glow = exp(-r * r * 6.0) * 0.5;
  float a = (rim * 0.9 + inner + glow) * smoothstep(1.0, 0.6, r) * (0.25 + 0.75 * min(1.0, uG * 1.4 + 0.1));
  vec3 col = mix(vec3(0.62, 0.74, 1.0), vec3(1.0), rim) + uSeam * glow * 0.6;
  gl_FragColor = vec4(col * a, a);
}`

function Tree({ grow, inside }) {
  const { geo, tips, total } = useMemo(buildTree, [])
  const u = useMemo(() => ({ uG: { value: 0 }, uTip: { value: new THREE.Color('#ffc870') } }), [])
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#f2f5fc', metalness: 0.2, roughness: 0.35, emissive: '#dfe7ff', emissiveIntensity: 0.8, envMapIntensity: 1.2 })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uG = u.uG; sh.uniforms.uTip = u.uTip
      sh.vertexShader = 'attribute float aT; attribute float aB; attribute float aD; varying float vT; varying float vP; uniform float uG;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vT = aT; vP = clamp((uG - aB) / aD, 0.0, 1.0);')
      sh.fragmentShader = 'varying float vT; varying float vP; uniform vec3 uTip;\n' +
        sh.fragmentShader.replace('void main() {', 'void main() {\n if (vT > vP + 0.0001) discard;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += uTip * 2.5 * smoothstep(0.08, 0.0, vP - vT) * step(vP, 0.999);')
    }
    return m
  }, [u])

  // the canopy: soft points around every tip, appearing as each tip arrives
  const leaves = useMemo(() => {
    const r = rng(5), pos = [], aB = [], aR = []
    for (const t of tips) {
      for (let i = 0; i < 70; i++) {
        const v = new THREE.Vector3(r() - 0.5, (r() - 0.35) * 0.8, r() - 0.5).multiplyScalar(1.7 * Math.sqrt(r()) + 0.15)
        pos.push(t.p.x + v.x, t.p.y + v.y, t.p.z + v.z); aB.push(t.t + r() * 0.6); aR.push(r())
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 1))
    g.setAttribute('aR', new THREE.Float32BufferAttribute(aR, 1))
    return g
  }, [tips])
  const lu = useMemo(() => ({ uG: u.uG, uTime: { value: 0 }, uSize: { value: 1.05 }, uSeam: { value: new THREE.Color('#ffc870') } }), [u])

  // petals drifting down once the canopy is full
  const petals = useMemo(() => {
    const r = rng(9), N = 380, pos = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) { pos[i * 3] = (r() - 0.5) * 9; pos[i * 3 + 1] = 4 + r() * 6; pos[i * 3 + 2] = (r() - 0.5) * 9; seed[i] = r() }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return { g, seed, N }
  }, [])
  const pm = useRef()
  const pu = useMemo(() => ({ uTime: { value: 0 }, uSeam: { value: new THREE.Color('#ffc870') } }), [])

  const grp = useRef(), leafMat = useRef(), poolMat = useRef()
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    u.uG.value = grow.current * (total + 1)
    lu.uTime.value = t
    pu.uTime.value = t
    // R3F hands materials their own copy of the uniforms object, so set the live values on the materials
    for (const m of [leafMat.current, poolMat.current]) {
      if (!m) continue
      m.uniforms.uG.value = u.uG.value
      m.uniforms.uTime.value = t
      m.uniforms.uSeam.value.copy(lu.uSeam.value)
    }
    moodLerp(u.uTip.value, 'seam', 0.05); moodLerp(lu.uSeam.value, 'seam', 0.05); moodLerp(pu.uSeam.value, 'seam', 0.05)
    const full = THREE.MathUtils.clamp((grow.current - 0.85) / 0.15, 0, 1)
    pm.current.opacity = full * 0.85
    if (full > 0) {
      const a = petals.g.attributes.position.array
      for (let i = 0; i < petals.N; i++) {
        a[i * 3 + 1] -= dt * (0.25 + petals.seed[i] * 0.35)
        a[i * 3] += Math.sin(t * 0.7 + petals.seed[i] * 30) * dt * 0.2
        if (a[i * 3 + 1] < 0.05) { a[i * 3 + 1] = 6 + petals.seed[i] * 4; a[i * 3] = (Math.random() - 0.5) * 8; a[i * 3 + 2] = (Math.random() - 0.5) * 8 }
      }
      petals.g.attributes.position.needsUpdate = true
    }
    grp.current.visible = !inside.current
  })
  return (
    <group ref={grp}>
      <mesh geometry={geo} material={mat} />
      <points geometry={leaves} frustumCulled={false}>
        <shaderMaterial ref={leafMat} vertexShader={leafVert} fragmentShader={leafFrag} uniforms={lu} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <points geometry={petals.g} frustumCulled={false}>
        <pointsMaterial ref={pm} size={0.06} color="#eaf2ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[11, 11]} />
        <shaderMaterial ref={poolMat} vertexShader="varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }"
          fragmentShader={poolFrag} uniforms={{ uTime: lu.uTime, uG: u.uG, uSeam: lu.uSeam }} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#05060a" roughness={0.15} metalness={0.6} />
      </mesh>
    </group>
  )
}

// ---------- inside: threads of possibility branching out from a centre, thousands of worlds on them ----------
function Inside({ inside }) {
  const geo = useMemo(() => {
    const r = rng(23), pos = [], col = [], c = new THREE.Color()
    const walk = (p, d, n, depth) => {
      for (let i = 0; i < n; i++) {
        d.add(new THREE.Vector3((r() - 0.5) * 0.4, (r() - 0.5) * 0.4, (r() - 0.5) * 0.4)).normalize()
        p = p.clone().addScaledVector(d, 0.09)
        pos.push(p.x, p.y, p.z)
        c.setHSL(0.6 + (r() - 0.5) * 0.08, 0.35, 0.65 + r() * 0.3); col.push(c.r, c.g, c.b)
        if (depth < 4 && r() < 0.035) walk(p.clone(), d.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5)).normalize(), Math.floor(n * 0.7), depth + 1)
      }
    }
    for (let k = 0; k < 60; k++) walk(new THREE.Vector3(), new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), 90, 0)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return g
  }, [])
  const dot = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32)
    gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const g = useRef(), m = useRef()
  useFrame((st, dt) => {
    const want = inside.current ? 1 : 0
    m.current.opacity += (want - m.current.opacity) * Math.min(1, dt * 1.5)
    g.current.visible = m.current.opacity > 0.01
    g.current.rotation.y += dt * 0.04
    g.current.rotation.x = Math.sin(st.clock.elapsedTime * 0.1) * 0.2
  })
  return (
    <group ref={g} position={[0, 3, 0]}>
      <points geometry={geo}>
        <pointsMaterial ref={m} size={0.05} map={dot} alphaMap={dot} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

function Rig({ prog, inside }) {
  const look = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  useFrame((st, dt) => {
    const c = st.camera, p = prog.current, k = Math.min(1, dt * 2)
    let x, y, z, ly
    if (inside.current) {
      // drift inside the field
      const t = st.clock.elapsedTime * 0.05
      x = Math.sin(t) * 3.4; y = 3 + Math.sin(t * 1.3) * 0.6; z = Math.cos(t) * 3.4; ly = 3
    } else {
      const g = THREE.MathUtils.clamp((p - 0.12) / 0.6, 0, 1)
      const a = -0.2 + p * 1.6 + bus.mouse.x * 0.15
      // portrait screens are narrow: stand further back so the canopy fits across
      const wide = Math.min(1.6, Math.max(1, 1.25 / (st.size.width / st.size.height)))
      const R = THREE.MathUtils.lerp(7, 23, g) * wide
      x = Math.sin(a) * R; z = Math.cos(a) * R
      y = THREE.MathUtils.lerp(1.0, 5.2, g) + bus.mouse.y * 0.4
      ly = THREE.MathUtils.lerp(0.6, 7.3, g)
    }
    c.position.x += (x - c.position.x) * k; c.position.y += (y - c.position.y) * k; c.position.z += (z - c.position.z) * k
    look.y += (ly - look.y) * k
    c.lookAt(0, look.y, 0)
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
        <Canvas dpr={low ? 1 : [1, 1.75]} camera={{ fov: 42, position: [0, 1, 7], near: 0.05, far: 200 }} gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ scene }) => { scene.fog = new THREE.FogExp2('#020205', 0.022); scene.background = new THREE.Color('#010103') }}>
          <PerformanceMonitor onDecline={() => performance.now() - born > 3000 && setLow(true)} flipflops={2} />
          <Suspense fallback={null}><Environment files={studio} environmentIntensity={0.35} /></Suspense>
          <directionalLight position={[-4, 9, 5]} intensity={0.9} color="#cfdcff" />
          <pointLight position={[0, 8, 0]} intensity={40} distance={20} color="#dfe8ff" />
          <Tree grow={grow} inside={inside} />
          <Inside inside={inside} />
          <Sparkles count={160} scale={[16, 10, 16]} position={[0, 4, 0]} size={2.2} speed={0.25} opacity={0.5} color="#dfe8ff" />
          <Rig prog={prog} inside={inside} />
          {!low && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={1.1} luminanceThreshold={0.45} mipmapBlur />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.18} darkness={0.92} />
            </EffectComposer>
          )}
        </Canvas>

        <div className="descent-ui chaos-ui">
          {!isIn && (
            <>
              <div className="descent-intro" style={{ opacity: Math.max(0, 1 - p / 0.1) }}>
                <p className="sec-group">{T.eyebrow}</p>
                <h2 className="descent-title"><span>{T.title[0]}</span><i lang="zh-Hant">{T.title[1]}</i></h2>
                <p className="descent-hint">{T.void} <span>↓</span></p>
              </div>
              <p className="chaos-whisper" style={{ opacity: vis(0.12, 0.04) }}>{T.grow}</p>
              <p className="chaos-name" style={{ opacity: Math.min(1, Math.max(0, (p - 0.3) / 0.1)) * (isIn ? 0 : 1) }}>{T.bough}</p>
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
                <button className="hero-enter" onClick={enter}>{T.enter} →</button>
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
                  <button className="crumb" onClick={() => go('map')}>{T.up}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="descent-rail" aria-hidden="true">
            <span style={{ transform: `scaleY(${Math.min(1, p)})` }} />
          </div>
        </div>
        {flash > 0 && <div key={flash} className="chaos-flash" aria-hidden="true" />}
      </div>
    </motion.section>
  )
}
