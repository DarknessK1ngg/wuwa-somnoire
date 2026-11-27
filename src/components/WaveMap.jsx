import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'motion/react'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { WAVE } from '../content'
import { usePack } from '../lang'
import { profile } from '../mark'
import { bus } from '../bus'
import { INNER_UI } from '../characters'

const SP = 520 // world distance between section spikes
const ORDER = Object.entries(WAVE).sort((a, b) => a[1] - b[1]).map(([id]) => id)
const MIN = Math.min(...Object.values(WAVE)) * SP
const MAX = Math.max(...Object.values(WAVE)) * SP
const X0 = MIN - 2100, X1 = MAX + 2100

function makeNodes() {
  return ORDER.map((id) => {
    const p = WAVE[id]
    const centre = p === 0
    const above = centre || Math.abs(p) % 2 === 1
    return {
      id, x: p * SP, above,
      up: centre ? 215 : above ? 165 : 80,
      down: centre ? 175 : above ? 70 : 160,
      w: centre ? 70 : 52,
    }
  })
}

// ---------- The endless Mark as a chrome blade split along its axis ----------
// Two lofted halves (above and below the baseline). Opening the Mark pushes them
// apart from the centre outward; between them is the light inside.
function buildHalf(nodes, k, dir) {
  const scaled = nodes.map((n) => ({ ...n, up: n.up * k * 1.12, down: n.down * k * 1.12, w: n.w * Math.max(0.75, k) * 1.12 }))
  const M = 20, step = 4
  const pos = [], idx = []
  let rings = 0
  for (let x = X0; x <= X1; x += step) {
    const [u, d] = profile(x, scaled, 0, null, k * 1.45, 2.6 * Math.max(0.7, k))
    const h = dir > 0 ? u : d
    const y0 = -dir * 0.8, y1 = dir * h
    const rz = 1.2 + 0.2 * Math.pow(h, 0.82)
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2
      const c = Math.cos(th), sn = Math.sin(th)
      const y = y0 + (y1 - y0) * (1 - c) / 2
      pos.push(x, y, rz * Math.sign(sn) * Math.pow(Math.abs(sn), 1.25))
    }
    rings++
  }
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < M; j++) {
      const a0 = i * M + j, a1 = i * M + ((j + 1) % M), b0 = a0 + M, b1 = a1 + M
      if (dir > 0) idx.push(a0, a1, b0, a1, b1, b0)
      else idx.push(a0, b0, a1, a1, b0, b1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const OPEN_CHUNK = /* glsl */ `
  float fo = clamp((uRad - abs(position.x)) / 260.0, 0.0, 1.0);
  fo = fo * fo * (3.0 - 2.0 * fo);
  float wv = 1.0 + 0.35 * sin(position.x * 0.011 + uTime * 0.9) + 0.2 * sin(position.x * 0.031 - uTime * 1.3);
  transformed.y += uDir * uGap * fo * wv;
`

function Half({ geo, dir, u }) {
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: '#e6e6ef', metalness: 1, roughness: 0.07, iridescence: 1, iridescenceIOR: 1.7,
      iridescenceThicknessRange: [180, 900], clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5, side: THREE.DoubleSide,
    })
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uRad = u.uRad
      sh.uniforms.uGap = u.uGap
      sh.uniforms.uDir = { value: dir }
      sh.uniforms.uTime = u.uTime
      sh.vertexShader = 'uniform float uRad; uniform float uGap; uniform float uDir; uniform float uTime;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + OPEN_CHUNK)
    }
    return m
  }, [dir, u])
  return <mesh geometry={geo} material={mat} frustumCulled={false} />
}

const seamVert = /* glsl */ `
varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const seamFrag = /* glsl */ `
precision highp float;
varying vec2 vP;
uniform float uRad, uGap, uTime;
uniform vec3 uAura;
void main() {
  float fo = clamp((uRad - abs(vP.x)) / 260.0, 0.0, 1.0);
  fo = fo * fo * (3.0 - 2.0 * fo);
  float wv = 1.0 + 0.35 * sin(vP.x * 0.011 + uTime * 0.9) + 0.2 * sin(vP.x * 0.031 - uTime * 1.3);
  float g = uGap * fo * wv;
  if (g < 0.5) discard;
  float yn = abs(vP.y) / g;                       // 0 at the seam, 1 at the blade edges
  float inside = 1.0 - smoothstep(0.82, 1.0, yn);
  // the same opening repeated inward without end
  float rings = smoothstep(0.38, 0.5, abs(fract(yn * 5.0 + uTime * 0.35) - 0.5));
  float core = exp(-yn * yn * 10.0);
  vec3 c = mix(uAura * 0.55, uAura, 1.0 - yn) * (1.0 - rings * 0.45) + vec3(1.0, 0.97, 0.88) * core * 0.9;
  float a = inside * (0.65 + 0.35 * core);
  gl_FragColor = vec4(c * a, a);
}
`

function Seam({ u }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: seamVert, fragmentShader: seamFrag, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uRad: u.uRad, uGap: u.uGap, uTime: u.uTime, uAura: u.uAura },
  }), [u])
  return (
    <mesh position={[0, 0, -40]} material={mat} frustumCulled={false}>
      <planeGeometry args={[X1 - X0, 600]} />
    </mesh>
  )
}

function CursorLight({ st }) {
  const l = useRef(), l2 = useRef()
  const { size } = useThree()
  useFrame(() => {
    const s = st.current
    if (!l.current) return
    const mx = s.mx ?? size.width / 2, my = s.my ?? size.height * 0.4
    l.current.position.set(s.off + (mx - size.width / 2), -(my - size.height * 0.55), 120)
    l2.current.intensity = 400000 * s.openE
  })
  return (
    <>
      <pointLight ref={l} intensity={260000} distance={900} decay={2} color="#eef1ff" />
      <pointLight ref={l2} position={[0, 0, 60]} intensity={0} distance={1400} decay={2} color="#ffcf80" />
    </>
  )
}

function MarkScene({ st, nodes, k, u }) {
  const top = useMemo(() => buildHalf(nodes, k, 1), [nodes, k])
  const bot = useMemo(() => buildHalf(nodes, k, -1), [nodes, k])
  const { camera, size } = useThree()
  useFrame((_, dt) => {
    const s = st.current
    // plunge: the camera falls into the opened seam at the core
    if (s.plunging) s.plunge = Math.min(1, s.plunge + dt / 0.95)
    const pe = s.plunge * s.plunge * s.plunge
    camera.position.x = THREE.MathUtils.lerp(s.off, 0, Math.min(1, s.plunge * 1.6))
    camera.position.y = size.height * 0.05 * (1 - Math.min(1, s.plunge * 1.6))
    camera.zoom = 1 + pe * 9
    camera.updateProjectionMatrix()
    u.uTime.value += Math.min(dt, 0.05)
    u.uRad.value = (60 + size.width * 0.95) * s.openE
    u.uGap.value = (16 + 44 * k) * s.openE * (1 + pe * 2.5)
  })
  return (
    <>
      <Suspense fallback={null}><Environment files={studio} environmentIntensity={1} /></Suspense>
      <directionalLight position={[300, 600, 400]} intensity={2.2} color="#e8ecff" />
      <Seam u={u} />
      <Half geo={top} dir={1} u={u} />
      <Half geo={bot} dir={-1} u={u} />
      <CursorLight st={st} />
      <Sparkles count={260} scale={[X1 - X0, 520, 80]} size={2.2} speed={0.25} opacity={0.45} color="#d6dcf6" noise={30} />
    </>
  )
}

export default function WaveMap({ go, dive }) {
  const { SECTIONS, UI } = usePack()
  const IU = INNER_UI[UI.lang]
  const byId = useMemo(() => Object.fromEntries(SECTIONS.map((x) => [x.id, x])), [SECTIONS])
  const wrap = useRef(), layer = useRef(), view = useRef(), edgeL = useRef(), edgeR = useRef()
  const els = useRef({})
  const nodes = useMemo(makeNodes, [])
  const st = useRef({ plunge: 0, plunging: false, open: 0, openE: 0, force: false, off: 0, mx: null, my: null, drag: null, target: null, hover: null, touch: false, W: 0, H: 0, k: 1 })
  const [touch, setTouch] = useState(false)
  const [k, setK] = useState(1)
  const u = useMemo(() => ({
    uRad: { value: 0 }, uGap: { value: 0 }, uTime: { value: 0 },
    uAura: { value: new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--aura').trim() || '#ffc870') },
  }), [])

  useEffect(() => {
    const s = st.current
    const resize = () => {
      if (!wrap.current) return
      s.W = wrap.current.clientWidth
      s.H = wrap.current.clientHeight
      s.k = Math.min(1, s.H / 900, s.W / 700)
      wrap.current.style.setProperty('--k', s.k)
      setK(Math.round(s.k * 20) / 20)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap.current)

    let raf, last = performance.now()
    const loop = (now) => {
      if (!layer.current || !wrap.current) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { W, H, k: kk } = s
      const base = H * 0.55

      if (s.target != null) {
        s.off += (s.target - s.off) * Math.min(1, dt * 5)
        if (Math.abs(s.target - s.off) < 1) s.target = null
      } else if (s.mx != null && !s.drag && !s.touch) {
        const dx = s.mx - W / 2
        const dead = W * 0.16
        const a = Math.max(0, Math.abs(dx) - dead) / (W / 2 - dead)
        s.off += Math.sign(dx) * Math.pow(a, 1.6) * 1100 * dt
        edgeL.current.style.opacity = dx < 0 ? a : 0
        edgeR.current.style.opacity = dx > 0 ? a : 0
      }
      s.off = Math.max(MIN - 600, Math.min(MAX + 600, s.off))
      bus.pan = s.off

      const want = s.hover === 'rift' || s.force ? 1 : 0
      s.open += (want - s.open) * Math.min(1, dt * (want ? 1.1 : 2.6))
      s.openE = s.open * s.open * (3 - 2 * s.open)
      wrap.current.style.setProperty('--open', s.openE.toFixed(3))

      layer.current.style.transform = `translate3d(${W / 2 - s.off}px, ${base}px, 0)`
      const fx = s.mx != null && !s.touch ? s.mx : W / 2
      for (const n of nodes) {
        const el = els.current[n.id]
        if (!el) continue
        const sx = n.x - s.off + W / 2
        const near = Math.max(0, 1 - Math.abs(sx - fx) / (360 * Math.max(0.6, kk)))
        el.style.setProperty('--near', (s.hover === n.id ? 1 : near).toFixed(3))
      }
      const span = MAX - MIN + 1200
      view.current.style.left = `${(((s.off - W / 2) - (MIN - 600)) / span) * 100}%`
      view.current.style.width = `${(W / span) * 100}%`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onKey = (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      const cur = s.target ?? s.off
      const xs = nodes.map((n) => n.x)
      const nxt = e.key === 'ArrowRight' ? xs.find((x) => x > cur + 5) : [...xs].reverse().find((x) => x < cur - 5)
      if (nxt != null) s.target = nxt
    }
    addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener('keydown', onKey) }
  }, [nodes])

  const s = st.current
  const enterRift = (e) => {
    const r = e.currentTarget.parentElement.querySelector('.rift-core').getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    const fall = () => {
      s.plunging = true
      wrap.current?.classList.add('plunging')
      setTimeout(() => dive(x, y, 'inner'), 420)
    }
    if (s.open > 0.7) { fall(); return }
    s.force = true
    s.target = 0
    setTimeout(fall, 700)
  }
  const handlers = {
    onPointerMove: (e) => {
      if (e.pointerType === 'mouse') { s.touch = false; s.mx = e.clientX; s.my = e.clientY }
      if (s.drag) { s.off = s.drag.off - (e.clientX - s.drag.x); s.target = null }
    },
    onPointerDown: (e) => {
      if (e.pointerType !== 'mouse') { s.touch = true; setTouch(true) }
      if (e.pointerType !== 'mouse' || e.button === 1) s.drag = { x: e.clientX, off: s.off }
    },
    onPointerUp: () => { s.drag = null },
    onPointerCancel: () => { s.drag = null },
    onPointerLeave: (e) => { if (e.pointerType === 'mouse') s.mx = null; edgeL.current.style.opacity = 0; edgeR.current.style.opacity = 0 },
    onWheel: (e) => { s.target = null; s.off += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.9 },
  }

  const span = MAX - MIN + 1200
  return (
    <motion.section
      className="wave"
      ref={wrap}
      {...handlers}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(12px)' }}
      transition={{ duration: 0.8 }}
    >
      <div className="wave-stage">
        <motion.div className="wave-gl" initial={{ opacity: 0, clipPath: 'inset(0% 50% 0% 50%)' }} animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }} transition={{ duration: 1.6, ease: [0.2, 0.8, 0.1, 1] }}>
          <Canvas orthographic dpr={[1, 1.75]} camera={{ zoom: 1, position: [0, 0, 600], near: 1, far: 2000 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
            <MarkScene st={st} nodes={nodes} k={k} u={u} />
          </Canvas>
        </motion.div>
        <div className="wave-layer" ref={layer}>
          {nodes.map((n) => {
            const sec = byId[n.id]
            if (WAVE[n.id] === 0) {
              return (
                <div key={n.id} ref={(el) => { els.current[n.id] = el }} className="wn wn-up wn-core wn-rift" style={{ left: n.x, '--amp': n.up * 1.12 }}>
                  <button
                    className="wn-hit rift-hit"
                    onPointerEnter={() => { s.hover = 'rift' }}
                    onPointerLeave={() => { if (s.hover === 'rift') s.hover = null }}
                    onFocus={() => { s.hover = 'rift'; s.target = 0 }}
                    onBlur={() => { if (s.hover === 'rift') s.hover = null }}
                    onClick={enterRift}
                    aria-label={`${IU.gate}: ${UI.map.coreHint}`}
                  />
                  <span className="rift-core" aria-hidden="true" />
                  <button className="wn-tag wn-tag-btn" onClick={() => go(n.id)} aria-label={`${sec.title}: ${sec.short}`}>
                    <span className="wn-num">{sec.num}</span>
                    <b>{UI.map.core}</b>
                    <small>{UI.map.coreShort}</small>
                    <em className="rift-hint">{UI.map.coreHint}</em>
                  </button>
                </div>
              )
            }
            return (
              <button
                key={n.id}
                ref={(el) => { els.current[n.id] = el }}
                className={`wn ${n.above ? 'wn-up' : 'wn-down'}`}
                style={{ left: n.x, '--amp': (n.above ? n.up : n.down) * 1.12 }}
                onPointerEnter={() => { s.hover = n.id }}
                onPointerLeave={() => { if (s.hover === n.id) s.hover = null }}
                onFocus={() => { s.hover = n.id; s.target = n.x }}
                onBlur={() => { if (s.hover === n.id) s.hover = null }}
                onClick={() => go(n.id)}
                aria-label={`${sec.title}: ${sec.short}`}
              >
                <span className="wn-hit" />
                <span className="wn-ray" />
                <span className="wn-tag">
                  <span className="wn-num">{sec.num}</span>
                  <b>{sec.title}</b>
                  <small>{sec.short}</small>
                </span>
              </button>
            )
          })}
        </div>
        <div className="edge edge-l" ref={edgeL}>←</div>
        <div className="edge edge-r" ref={edgeR}>→</div>
      </div>

      <footer className="wave-foot">
        <p className="wave-eyebrow">{UI.map.eyebrow}</p>
        <div className="mini" aria-label={UI.map.mini}>
          <span className="mini-line" />
          <span className="mini-view" ref={view} />
          {ORDER.map((id) => (
            <button
              key={id}
              className={`mini-dot ${WAVE[id] === 0 ? 'mini-core' : ''}`}
              style={{ left: `${((WAVE[id] * SP - (MIN - 600)) / span) * 100}%` }}
              onClick={() => { s.target = WAVE[id] * SP }}
              title={byId[id].title}
              aria-label={`${UI.map.travel} ${byId[id].title}`}
            >
              <span>{byId[id].num}</span>
            </button>
          ))}
        </div>
        <p className="wave-hint">{touch ? UI.map.hintTouch : UI.map.hintMouse}</p>
      </footer>
    </motion.section>
  )
}
