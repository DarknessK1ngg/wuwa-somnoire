import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { motion } from 'motion/react'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { markOutline } from '../mark'
import { usePack } from '../lang'
import { shockAt } from '../bus'
import { Fog } from './FogSky'

const ease = [0.2, 0.75, 0.1, 1]

// ---------- The Mark as an iridescent chrome sculpture ----------
function MarkSculpture({ prog, intro }) {
  const group = useRef()
  // Lofted blade: every slice along the Mark is a lens-shaped cross-section, so the
  // surface curves everywhere and the chrome catches real reflections.
  const geo = useMemo(() => {
    const pts = markOutline(600, 3, 4)
    const n = pts.length / 2
    const top = pts.slice(0, n), bot = pts.slice(n).reverse()
    const S = 1 / 150, M = 28
    const pos = [], idx = []
    for (let i = 0; i < n; i++) {
      const x = top[i][0] * S
      const u = top[i][1] * S, d = -bot[i][1] * S
      const ry = (u + d) / 2, cy = (u - d) / 2
      const rz = 0.02 + 0.2 * Math.pow(ry / 1.6, 0.75)
      for (let j = 0; j < M; j++) {
        const th = (j / M) * Math.PI * 2
        const c = Math.cos(th), sn = Math.sin(th)
        pos.push(x, cy + ry * sn, rz * Math.sign(c) * Math.pow(Math.abs(c), 1.35))
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
    g.center()
    return g
  }, [])
  useFrame((st, dt) => {
    const g = group.current
    if (!g) return
    const t = st.clock.elapsedTime
    const p = prog.current
    const k = intro.current
    // rise out of the fog on load, then follow the cursor and descend with the scroll
    g.position.y = THREE.MathUtils.lerp(-2.2, 0.05, k) + Math.sin(t * 0.6) * 0.04 - p * 0.3
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, st.pointer.x * 0.4 + Math.sin(t * 0.25) * 0.22 + p * 0.5, Math.min(1, dt * 2.5))
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -st.pointer.y * 0.25 + 0.05, Math.min(1, dt * 2.5))
    const fit = Math.min(1, (st.size.width / st.size.height) / 1.25)
    g.scale.setScalar((0.82 + k * 0.18) * (1 + p * 0.25) * (0.45 + 0.55 * fit))
  })
  return (
    <group ref={group}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          color="#e4e4ee"
          metalness={1}
          roughness={0.06}
          iridescence={1}
          iridescenceIOR={1.7}
          iridescenceThicknessRange={[180, 920]}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.5}
        />
      </mesh>
    </group>
  )
}

function Rig({ prog }) {
  useFrame((st, dt) => {
    const c = st.camera
    const z = 7.2 - prog.current * 2.4
    c.position.x = THREE.MathUtils.lerp(c.position.x, st.pointer.x * 0.35, Math.min(1, dt * 2))
    c.position.y = THREE.MathUtils.lerp(c.position.y, st.pointer.y * 0.2, Math.min(1, dt * 2))
    c.position.z = THREE.MathUtils.lerp(c.position.z, z, Math.min(1, dt * 3))
    c.lookAt(0, 0, 0)
  })
  return null
}

function Scene({ prog, intro, tint, aura, motionOn }) {
  return (
    <>
      <Fog front={false} prog={prog} tint={tint} aura={aura} />
      <Suspense fallback={null}>
        <Environment files={studio} environmentIntensity={1} />
      </Suspense>
      <directionalLight position={[3, 4, 2]} intensity={2.2} color="#e8ecff" />
      <pointLight position={[-3, -1, 2]} intensity={6} color={aura} distance={8} />
      <Float speed={motionOn ? 1.2 : 0} rotationIntensity={0.15} floatIntensity={0.3}>
        <MarkSculpture prog={prog} intro={intro} />
      </Float>
      <Sparkles count={90} scale={[9, 5, 5]} size={1.6} speed={motionOn ? 0.25 : 0} opacity={0.5} color="#d8defa" />
      <Fog front prog={prog} tint={tint} aura={aura} />
      <Rig prog={prog} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur />
        <ChromaticAberration offset={[0.0007, 0.0005]} radialModulation modulationOffset={0.35} blendFunction={BlendFunction.NORMAL} />
        <Noise opacity={0.07} premultiply blendFunction={BlendFunction.SCREEN} />
        <Vignette eskil={false} offset={0.22} darkness={0.85} />
      </EffectComposer>
    </>
  )
}

function Line({ text, delay, className }) {
  return (
    <span className={`hero-line ${className || ''}`} aria-hidden="true">
      {[...text].map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: '0.35em', filter: 'blur(12px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: delay + i * 0.045, duration: 1.2, ease }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  )
}

export default function Hero({ onExplore, settings }) {
  const { UI } = usePack()
  const H = UI.hero
  const prog = useRef(0)
  const target = useRef(0)
  const intro = useRef(0)
  const [pct, setPct] = useState(0)
  const leaving = useRef(false)
  const s = settings.s
  const motionOn = s.motion

  const go = (x = innerWidth / 2, y = innerHeight / 2) => {
    if (leaving.current) return
    leaving.current = true
    shockAt(x, y)
    onExplore(x, y)
  }

  useEffect(() => {
    let raf, last = performance.now()
    const t0 = last
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      intro.current = Math.min(1, Math.max(0, ((now - t0) / 1000 - 0.3) / 2.2))
      intro.current = 1 - Math.pow(1 - intro.current, 3)
      prog.current += (target.current - prog.current) * Math.min(1, dt * 3.5)
      setPct((v) => { const n = Math.round(prog.current * 100); return n === v ? v : n })
      if (prog.current > 0.985 && !leaving.current) go()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const bump = (d) => { if (!leaving.current) target.current = Math.max(0, Math.min(1, target.current + d)) }
    const onWheel = (e) => bump(e.deltaY * 0.0009)
    let ty = null
    const onTs = (e) => { ty = e.touches[0].clientY }
    const onTm = (e) => { if (ty == null) return; const y = e.touches[0].clientY; bump((ty - y) * 0.0025); ty = y }
    const onKey = (e) => { if (['ArrowDown', 'PageDown', ' '].includes(e.key)) bump(0.12); if (['ArrowUp', 'PageUp'].includes(e.key)) bump(-0.12) }
    addEventListener('wheel', onWheel, { passive: true })
    addEventListener('touchstart', onTs, { passive: true })
    addEventListener('touchmove', onTm, { passive: true })
    addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); removeEventListener('wheel', onWheel); removeEventListener('touchstart', onTs); removeEventListener('touchmove', onTm); removeEventListener('keydown', onKey) }
  }, [])

  const [w1, w2] = H.title
  return (
    <motion.section className="hero" exit={{ opacity: 0, filter: 'blur(14px)', scale: 1.04 }} transition={{ duration: 0.8, ease }}>
      <div className="hero-canvas">
        <Canvas dpr={[1, 1.75]} camera={{ fov: 32, position: [0, 0, 7.2], near: 0.1, far: 50 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Scene prog={prog} intro={intro} tint={s.c2} aura={s.aura || '#ffc870'} motionOn={motionOn} />
        </Canvas>
      </div>
      <motion.div className="hero-black" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.8, ease: 'easeOut' }} />

      <div className="hero-ui" style={{ '--p': pct / 100 }}>
        <motion.div className="hero-brand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}>
          <span>Somnoire</span><i /><span>{UI.lang === 'ru' ? 'Досье' : 'Dossier'}</span>
        </motion.div>
        <h1 className="hero-title" aria-label={`${w1} ${w2}`}>
          <Line text={w1} delay={0.9} className="hero-l1" />
          <Line text={w2} delay={1.3} className="hero-l2" />
        </h1>

        <motion.div className="hero-tier" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 1 }}>
          <span>{H.tier}</span>
          <i />
          <span>{H.built}</span>
        </motion.div>

        <motion.div className="hero-note" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4, duration: 1, ease }}>
          <small>{H.kicker}</small>
          <p>{H.note[0]}<br />{H.note[1]}</p>
        </motion.div>

        <motion.div className="hero-count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6, duration: 1 }}>
          <b>{String(pct).padStart(2, '0')}</b><span>/100</span>
          <small>{H.depth}</small>
        </motion.div>

        <motion.div className="hero-cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8, duration: 1 }}>
          <span className="hero-scroll"><i /></span>
          <small>{H.scroll}</small>
          <button className="hero-enter" onClick={(e) => go(e.clientX, e.clientY)}>
            <span>{H.enter}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </button>
        </motion.div>
      </div>
    </motion.section>
  )
}
