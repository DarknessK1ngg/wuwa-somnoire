import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { createPortal } from 'react-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { markOutline } from '../mark'
import { bus } from '../bus'
import { usePack } from '../lang'

// The opening film, ~15 s, shown once per browser before the hero (and on demand from the menu).
// A single spark → a swirl of light → the swirl settles into the outline of the Mark →
// a golden seam runs along its axis and the Mark opens → light, and the hero takes over.
export const FILM_KEY = 'somnoire-film-seen'
const LEN = 14.4
const N = 2600
const ease = (x) => x * x * (3 - 2 * x)
const clamp = (x) => Math.max(0, Math.min(1, x))

function Particles({ clock }) {
  const { geo, home, swirl, target, seed } = useMemo(() => {
    const out = markOutline(600, 2, 5)
    const target = new Float32Array(N * 3), swirl = new Float32Array(N * 3), home = new Float32Array(N * 3), seed = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      const o = out[Math.floor((i / N) * out.length)]
      target[i * 3] = (o[0] / 600) * 4.8 + (Math.random() - 0.5) * 0.02
      target[i * 3 + 1] = (o[1] / 600) * 4.8 + (Math.random() - 0.5) * 0.02
      target[i * 3 + 2] = (Math.random() - 0.5) * 0.06
      const a = Math.random() * Math.PI * 2, r = 0.6 + Math.pow(Math.random(), 0.6) * 3.4
      swirl[i * 3] = Math.cos(a) * r; swirl[i * 3 + 1] = Math.sin(a) * r * 0.55; swirl[i * 3 + 2] = (Math.random() - 0.5) * 2
      seed[i] = Math.random()
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(home, 3))
    return { geo, home, swirl, target, seed }
  }, [])
  const dot = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 64
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, '#fff'); g.addColorStop(0.3, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = g; x.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
  const glow = useMemo(() => {
    // a soft band of light: fades out to both ends and to both edges
    const c = document.createElement('canvas'); c.width = 512; c.height = 64
    const x = c.getContext('2d')
    for (let i = 0; i < 64; i++) {
      const v = Math.exp(-Math.pow((i - 31.5) / 9, 2))
      const g = x.createLinearGradient(0, 0, 512, 0)
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.18, `rgba(255,255,255,${v})`)
      g.addColorStop(0.82, `rgba(255,255,255,${v})`); g.addColorStop(1, 'rgba(255,255,255,0)')
      x.fillStyle = g; x.fillRect(0, i, 512, 1)
    }
    return new THREE.CanvasTexture(c)
  }, [])
  const mat = useRef(), seam = useRef(), spark = useRef()
  useFrame((st) => {
    const t = clock.current
    // portrait: pull the camera back so the whole Mark fits across
    const far = Math.min(1.9, Math.max(1, 1.3 / (st.size.width / st.size.height)))
    st.camera.position.z = 12 * far
    const a = geo.attributes.position.array
    const burst = ease(clamp((t - 2.2) / 2.4)) // spark → swirl
    const settle = ease(clamp((t - 6) / 3.6)) // swirl → Mark
    const open = ease(clamp((t - 10.6) / 2.2)) // the Mark splits along its axis
    for (let i = 0; i < N; i++) {
      const s = seed[i], k = i * 3
      const sp = t * (0.25 + s * 0.35)
      const sx = swirl[k] * Math.cos(sp) - swirl[k + 1] * Math.sin(sp) * 1.6
      const sy = swirl[k] * Math.sin(sp) * 0.4 + swirl[k + 1] * Math.cos(sp)
      let x = sx * burst, y = sy * burst, z = swirl[k + 2] * burst
      const lag = clamp(settle * 1.25 - s * 0.25)
      x += (target[k] - x) * lag; y += (target[k + 1] - y) * lag; z += (target[k + 2] - z) * lag
      y += Math.sign(target[k + 1] || 1) * open * 1.1 * lag
      a[k] = x; a[k + 1] = y; a[k + 2] = z
    }
    geo.attributes.position.needsUpdate = true
    mat.current.opacity = clamp((t - 2) / 0.8) * (1 - clamp((t - 13.4) / 1.2))
    mat.current.size = (0.05 + settle * 0.02) * Math.sqrt(far)
    spark.current.scale.setScalar((0.08 + 0.04 * Math.sin(t * 6)) * (1 - burst) + 0.001)
    spark.current.material.opacity = clamp(t / 0.6) * (1 - burst)
    seam.current.scale.x = 0.001 + ease(clamp((t - 9.8) / 1.4)) * 10.5
    seam.current.material.opacity = clamp((t - 9.8) / 0.4) * (1 - clamp((t - 13.6) / 1.2))
    seam.current.scale.y = 1 + open * 5
  })
  return (
    <>
      <points geometry={geo} frustumCulled={false}>
        <pointsMaterial ref={mat} map={dot} alphaMap={dot} size={0.05} color="#eef1ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      <mesh ref={spark}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0} />
      </mesh>
      <mesh ref={seam}>
        <planeGeometry args={[1, 0.16]} />
        <meshBasicMaterial map={glow} color="#ffd89a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}

export default function Film({ onDone, sound, toggleSound }) {
  const { UI } = usePack()
  const ru = UI.lang === 'ru'
  const clock = useRef(0)
  const [t, setT] = useState(0)
  const done = useRef(false)
  const cues = useRef({})
  const finish = () => {
    if (done.current) return
    done.current = true
    try { localStorage.setItem(FILM_KEY, '1') } catch {}
    onDone()
  }
  useEffect(() => {
    let raf, last = performance.now()
    const tick = (now) => {
      clock.current += Math.min(0.25, (now - last) / 1000)
      last = now
      const c = clock.current
      const cue = (name, at, fx, x) => { if (c >= at && !cues.current[name]) { cues.current[name] = 1; bus.sfx(fx, x) } }
      cue('a', 2.2, 'iris'); cue('b', 6, 'whoosh'); cue('c', 10, 'open'); cue('d', 11.2, 'ring', 0.9); cue('e', 13.2, 'plunge')
      setT(c)
      if (c >= LEN) { finish(); return }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const key = (e) => { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish() }
    addEventListener('keydown', key)
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key) }
  }, [])

  const line = (a, b) => clamp((t - a) / 0.8) * (1 - clamp((t - b) / 0.8))
  const flash = clamp((t - 13.2) / 0.6)
  return createPortal(
    <motion.div className="film" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
      <Canvas dpr={[1, 1.75]} camera={{ fov: 40, position: [0, 0, 12] }} gl={{ antialias: true }} onCreated={({ scene }) => { scene.background = new THREE.Color('#020204') }}>
        <Particles clock={clock} />
        <EffectComposer multisampling={0}><Bloom intensity={1.2} luminanceThreshold={0.25} mipmapBlur /></EffectComposer>
      </Canvas>
      <div className="film-ui">
        <p className="film-l film-l1" style={{ opacity: line(0.8, 4.6) }}>Wuthering Waves</p>
        <p className="film-l film-l2" style={{ opacity: line(5.6, 9.4) }}>{UI.hero.note.join(' ')}</p>
        <h1 className="film-title" style={{ opacity: line(10.6, 13.6), letterSpacing: `${0.5 + clamp((t - 10.6) / 3) * 0.25}em` }}>{UI.hero.kicker}</h1>
      </div>
      <div className="film-flash" style={{ opacity: flash }} />
      <div className="film-ctl">
        <button className={`film-snd ${sound ? 'on' : ''}`} onClick={toggleSound} aria-pressed={!!sound}>{sound ? (ru ? 'Звук: вкл' : 'Sound: on') : (ru ? 'Со звуком' : 'Sound on')}</button>
        <button className="film-skip" onClick={finish}>{ru ? 'Пропустить' : 'Skip'} →</button>
      </div>
      <span className="film-bar" style={{ transform: `scaleX(${clamp(t / LEN)})` }} />
    </motion.div>,
    document.body,
  )
}
