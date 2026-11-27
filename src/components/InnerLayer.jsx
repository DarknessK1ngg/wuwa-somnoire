import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, PerformanceMonitor, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { CHARACTERS, INNER_UI } from '../characters'
import { usePack } from '../lang'
import { profile } from '../mark'
import MarkEdge from './MarkEdge'

const W = 1200, H = 760, MY = 330
// spike under each character: x, which way the branch goes, card centre
const LAYOUT = [
  { x: 360, up: 150, down: 38, card: [150, 200], side: 'l' },
  { x: 600, up: 54, down: 90, card: [600, 580], side: 'b' },
  { x: 840, up: 150, down: 38, card: [1050, 200], side: 'r' },
]
const CW = 270, CHh = 340

function innerMark() {
  const nodes = LAYOUT.map((l) => ({ x: l.x - 600, up: l.up, down: l.down, w: 34 }))
  const env = (x) => Math.exp(-Math.pow(x / 520, 4))
  const top = [], bot = []
  for (let x = -600; x <= 600; x += 3) {
    const [u, d] = profile(x, nodes, 0, env, 0.55, 1.4)
    top.push(`${x + 600},${(MY - u).toFixed(1)}`)
    bot.push(`${x + 600},${(MY + d).toFixed(1)}`)
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`
}

// Same Mark, as lofted chrome. World units = viewBox units, origin at the stage centre.
function innerGeometry() {
  const nodes = LAYOUT.map((l) => ({ x: l.x - 600, up: l.up, down: l.down, w: 34 }))
  const env = (x) => Math.exp(-Math.pow(x / 520, 4))
  const M = 22, pos = [], idx = []
  let n = 0
  for (let x = -600; x <= 600; x += 3, n++) {
    const [u, d] = profile(x, nodes, 0, env, 0.55, 1.4)
    const ry = (u + d) / 2, cy = (u - d) / 2
    const rz = 1.4 + 0.3 * Math.pow(ry, 0.85)
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2, c = Math.cos(th)
      pos.push(x, cy + ry * Math.sin(th), rz * Math.sign(c) * Math.pow(Math.abs(c), 1.3))
    }
  }
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < M; j++) {
      const a0 = i * M + j, a1 = i * M + ((j + 1) % M), b0 = a0 + M, b1 = a1 + M
      idx.push(a0, b0, a1, a1, b0, b1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function InnerScene({ hover }) {
  const geo = useMemo(innerGeometry, [])
  const { camera, size } = useThree()
  const g = useRef(), key = useRef()
  useFrame((st, dt) => {
    const k = Math.min(1, dt * 2.4)
    camera.zoom = size.width / W
    camera.updateProjectionMatrix()
    const t = st.clock.elapsedTime
    const m = g.current
    m.scale.x = THREE.MathUtils.lerp(m.scale.x, 1, Math.min(1, dt * 1.8))
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, Math.sin(t * 0.35) * 0.1 - st.pointer.y * 0.12, k)
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, st.pointer.x * 0.05, k)
    const i = CHARACTERS.findIndex((c) => c.id === hover.current)
    const tx = i >= 0 ? LAYOUT[i].x - 600 : st.pointer.x * 600
    key.current.position.x = THREE.MathUtils.lerp(key.current.position.x, tx, k)
    key.current.intensity = THREE.MathUtils.lerp(key.current.intensity, i >= 0 ? 520000 : 260000, k)
  })
  return (
    <>
      <Suspense fallback={null}><Environment files={studio} environmentIntensity={1} /></Suspense>
      <directionalLight position={[200, 500, 400]} intensity={2} color="#e8ecff" />
      <pointLight ref={key} position={[0, 160, 240]} intensity={260000} color="#fff2dc" />
      <group ref={g} position={[0, H / 2 - MY, 0]} scale={[0.001, 1, 1]}>
        <mesh geometry={geo}>
          <meshPhysicalMaterial color="#e4e4ee" metalness={1} roughness={0.07} iridescence={1} iridescenceIOR={1.7}
            iridescenceThicknessRange={[180, 920]} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.5} />
        </mesh>
      </group>
      <Sparkles count={90} scale={[W, 300, 60]} position={[0, H / 2 - MY, 0]} size={2} speed={0.2} opacity={0.4} color="#d6dcf6" noise={20} />
    </>
  )
}

function useWide() {
  const q = '(min-width: 761px)'
  const [wide, setWide] = useState(() => matchMedia(q).matches)
  useEffect(() => {
    const m = matchMedia(q), f = () => setWide(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return wide
}

function branch(l) {
  const [cx, cy] = l.card
  if (l.side === 'b') {
    const ty = MY + l.down
    return `M${l.x},${ty} C${l.x},${ty + 20} ${cx},${cy - CHh / 2 - 30} ${cx},${cy - CHh / 2 + 6}`
  }
  const ty = MY - l.up
  const ex = l.side === 'l' ? cx + CW / 2 - 6 : cx - CW / 2 + 6
  const dir = l.side === 'l' ? -1 : 1
  return `M${l.x},${ty} C${l.x},${ty - 90} ${ex - dir * 90},${cy} ${ex},${cy}`
}

export default function InnerLayer({ open, surface }) {
  const { UI } = usePack()
  const lang = UI.lang
  const IU = INNER_UI[lang]
  const mark = useMemo(innerMark, [])
  const [hover, setHover] = useState(null)
  const hoverRef = useRef(null)
  hoverRef.current = hover
  const wide = useWide()
  const [dpr, setDpr] = useState(1.75)
  const [born] = useState(() => performance.now())

  return (
    <motion.section
      className="inner"
      initial={{ opacity: 0, scale: 1.12, filter: 'blur(14px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.92, filter: 'blur(12px)' }}
      transition={{ duration: 0.9, ease: [0.2, 0.75, 0.1, 1] }}
    >
      <header className="inner-head">
        <p className="eyebrow">{IU.eyebrow} · ∞</p>
        <h2>{IU.title}</h2>
      </header>

      <div className={`inner-stage ${wide ? 'has-gl' : ''}`}>
        {wide && (
          <Canvas className="inner-gl" orthographic resize={{ offsetSize: true }} dpr={dpr} camera={{ zoom: 1, position: [0, 0, 600], near: 1, far: 2000 }}
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <PerformanceMonitor onDecline={() => performance.now() - born > 3000 && setDpr(1)} flipflops={2} />
            <InnerScene hover={hoverRef} />
          </Canvas>
        )}
        <svg className="inner-svg" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <defs>
            <filter id="innerglow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {LAYOUT.map((l, i) => (
            <g key={i} className={`br ${hover === CHARACTERS[i].id ? 'on' : ''}`} style={{ '--hue': CHARACTERS[i].hue }}>
              <motion.path d={branch(l)} className="br-base" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.5 + i * 0.15, duration: 1.1 }} />
              <path d={branch(l)} className="br-flow" />
            </g>
          ))}
          <motion.path
            d={mark}
            className="inner-mark"
            filter="url(#innerglow)"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            style={{ transformOrigin: '600px 330px' }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.1, 1] }}
          />
          {LAYOUT.map((l, i) => (
            <circle key={i} cx={l.x} cy={MY} r={hover === CHARACTERS[i].id ? 9 : 5} className="inner-core" style={{ '--hue': CHARACTERS[i].hue }} />
          ))}
        </svg>

        {CHARACTERS.map((ch, i) => {
          const [cx, cy] = LAYOUT[i].card
          return (
            <motion.button
              key={ch.id}
              className={`icard icard-${LAYOUT[i].side} ${hover === ch.id ? 'on' : ''}`}
              style={{
                '--hue': ch.hue,
                left: `${((cx - CW / 2) / W) * 100}%`,
                top: `${((cy - CHh / 2) / H) * 100}%`,
                width: `${(CW / W) * 100}%`,
                height: `${(CHh / H) * 100}%`,
              }}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 140, damping: 18 }}
              onPointerEnter={() => setHover(ch.id)}
              onPointerLeave={() => setHover((h) => (h === ch.id ? null : h))}
              onFocus={() => setHover(ch.id)}
              onBlur={() => setHover(null)}
              onClick={(e) => open(ch.id, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2)}
            >
              <span className="icard-frame">
                <img src={ch.art[0]} alt={ch.name[lang]} loading="eager" />
                <span className="icard-scan" />
              </span>
              <span className="icard-text">
                <small>{ch.pos[lang]}</small>
                <b>{ch.name[lang]} <span className="cn">{ch.cn}</span></b>
                <em>{ch.title[lang]}</em>
              </span>
              <MarkEdge seed={i + 81} spikes={3} />
            </motion.button>
          )
        })}
      </div>

      <footer className="inner-foot">
        <p className="wave-hint">{IU.hint}</p>
        <button className="surface" onClick={(e) => surface(e.clientX || innerWidth / 2, e.clientY || innerHeight / 2)}>{IU.surface}</button>
      </footer>
    </motion.section>
  )
}
