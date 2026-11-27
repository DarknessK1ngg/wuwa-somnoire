import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { usePack } from '../lang'
import { findQuote } from '../proofs'
import { profile } from '../mark'
import { bus, moodLerp } from '../bus'
import { setDepthTone } from '../sound'

// The descent: scroll and the camera falls through Mark after Mark. Each Mark is one layer of dream;
// it splits along its axis as you reach it and you pass through the seam into the next.
const D = 14 // distance between layers
const SLOTS = 9 // meshes recycled along the fall, so the tunnel never ends
const LAYERS = [
  { key: 'Event_AYKXBRZM_61_31', en: 'The Somnoire', ru: 'Сомнуар' },
  { key: 'RogueRes_EventPlot_Des_510022_3', en: 'A Sonoro', ru: 'Соноро' },
  { key: 'Main_Rinascita_2_12_91_8 · 91_19', en: 'Without limit', ru: 'Без предела' },
  { key: 'Guide_YXQJCZ_7_11', en: 'Fiction', ru: 'Вымысел' },
  { key: 'Event_AYKXBRZM_58_6', en: 'A dream in a dream', ru: 'Сон во сне' },
  { key: 'InstanceDungeon_8914_Description', en: 'Without end', ru: 'Без конца' },
]
const TXT = {
  en: { eyebrow: 'The Descent', title: ['Fall through', 'the dreams'], hint: 'Scroll to descend', layer: 'Layer', end: ['∞', 'And it keeps going.', 'There is no floor. Every layer you passed is fiction to the one above it.'], chain: 'The chain in five steps', map: 'Back to the map' },
  ru: { eyebrow: 'Спуск', title: ['Провалиться', 'сквозь сны'], hint: 'Прокручивай, чтобы падать', layer: 'Слой', end: ['∞', 'И дальше.', 'Дна нет. Каждый слой, который ты прошёл, — вымысел для слоя над ним.'], chain: 'Цепочка в пять шагов', map: 'Назад к карте' },
}

// one half of a Mark (top or bottom of the axis), lofted like the others on the site
function halfGeometry(dir) {
  const nodes = [{ x: 0, up: 230, down: 170, w: 70 }, { x: -330, up: 120, down: 60, w: 46 }, { x: 330, up: 70, down: 140, w: 46 }, { x: -620, up: 60, down: 110, w: 40 }, { x: 640, up: 110, down: 50, w: 40 }]
  const env = (x) => Math.exp(-Math.pow(x / 760, 4))
  const S = 1 / 95, M = 18, pos = [], idx = []
  let n = 0
  for (let x = -900; x <= 900; x += 5, n++) {
    const [u, d] = profile(x, nodes, 0, env, 0.6, 1.3)
    const h = dir > 0 ? u : d
    const ry = Math.max(0.6, h / 2), cy = dir * ry
    const rz = 1.2 + 0.25 * Math.pow(ry, 0.85)
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2, c = Math.cos(th)
      pos.push(x * S, (cy + ry * Math.sin(th)) * S, rz * Math.sign(c) * Math.pow(Math.abs(c), 1.3) * S)
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < M; j++) {
    const a0 = i * M + j, a1 = i * M + ((j + 1) % M), b0 = a0 + M, b1 = a1 + M
    idx.push(a0, b0, a1, a1, b0, b1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const seamFrag = /* glsl */ `
uniform vec3 uCol; uniform float uOpen; varying vec2 vUv;
void main() {
  float y = abs(vUv.y - 0.5) * 2.0, x = abs(vUv.x - 0.5) * 2.0;
  float core = exp(-y * y * 180.0) + 0.35 * exp(-y * y * 18.0);
  float a = core * (1.0 - pow(x, 3.0)) * uOpen;
  gl_FragColor = vec4(mix(uCol, vec3(1.0), 0.45) * a, a);
}`
const seamVert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }'

function Tunnel({ depth }) {
  const top = useMemo(() => halfGeometry(1), [])
  const bot = useMemo(() => halfGeometry(-1), [])
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#e6e8f2', metalness: 1, roughness: 0.08, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 920],
    clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.6,
  }), [])
  const seamU = useMemo(() => Array.from({ length: SLOTS }, () => ({ uCol: { value: new THREE.Color('#ffc870') }, uOpen: { value: 0 } })), [])
  const slots = useRef([])
  const seamMats = useRef([])
  const dust = useMemo(() => {
    const N = 900, a = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) { a[i * 3] = (Math.random() - 0.5) * 22; a[i * 3 + 1] = (Math.random() - 0.5) * 12; a[i * 3 + 2] = -Math.random() * D * SLOTS }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3)); return g
  }, [])
  const dustRef = useRef(), dustMat = useRef(), light = useRef()

  useFrame((st, dt) => {
    const cam = st.camera
    const z = 9 - depth.current * D
    cam.position.z = z
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, bus.mouse.x * 0.6, Math.min(1, dt * 2))
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, bus.mouse.y * 0.35, Math.min(1, dt * 2))
    cam.lookAt(cam.position.x * 0.3, cam.position.y * 0.3, z - 10)
    moodLerp(mat.color, 'chrome', Math.min(1, dt * 3))
    const first = Math.max(0, Math.floor(depth.current) - 1)
    for (let k = 0; k < SLOTS; k++) {
      const g = slots.current[k]
      if (!g) continue
      const i = first + k
      const lz = -i * D
      g.position.z = lz
      g.rotation.z = (i % 2 ? -1 : 1) * (0.22 + 0.12 * Math.sin(i * 1.7)) + i * 0.08
      const dist = z - lz // > 0 while the layer is ahead
      const near = THREE.MathUtils.clamp(1 - (dist - 1.5) / 11, 0, 1)
      const open = near * near * (3 - 2 * near)
      g.children[0].position.y = 0.06 + open * 4.2
      g.children[1].position.y = -0.06 - open * 4.2
      seamU[k].uOpen.value = THREE.MathUtils.clamp(open * 1.4, 0, 1) * THREE.MathUtils.clamp(dist / 2, 0, 1)
      moodLerp(seamU[k].uCol.value, 'seam', 0.08)
      const sm = seamMats.current[k]
      if (sm) { sm.uniforms.uOpen.value = seamU[k].uOpen.value; sm.uniforms.uCol.value.copy(seamU[k].uCol.value) }
    }
    dustRef.current.position.z = Math.floor(z / (D * SLOTS)) * D * SLOTS + D * 2
    moodLerp(dustMat.current.color, 'seam', 0.05)
    light.current.position.set(cam.position.x, cam.position.y + 1, z - 6)
    moodLerp(light.current.color, 'seam', 0.05)
    st.scene.fog.color.setRGB(0.012, 0.012, 0.02)
  })

  return (
    <>
      <Suspense fallback={null}><Environment files={studio} environmentIntensity={1} /></Suspense>
      <directionalLight position={[3, 5, 4]} intensity={1.8} color="#e8ecff" />
      <pointLight ref={light} intensity={60} distance={30} decay={1.6} color="#ffc870" />
      {Array.from({ length: SLOTS }, (_, k) => (
        <group key={k} ref={(el) => { slots.current[k] = el }}>
          <mesh geometry={top} material={mat} />
          <mesh geometry={bot} material={mat} />
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[19, 9]} />
            <shaderMaterial ref={(el) => { seamMats.current[k] = el }} vertexShader={seamVert} fragmentShader={seamFrag} uniforms={seamU[k]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
      <points ref={dustRef} geometry={dust}>
        <pointsMaterial ref={dustMat} size={0.05} color="#ffe9c2" transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  )
}

export default function Descent({ go }) {
  const { SECTIONS, UI } = usePack()
  const T = TXT[UI.lang]
  const quotes = useMemo(() => LAYERS.map((l) => ({ ...l, q: findQuote(SECTIONS, l.key) })).filter((l) => l.q), [SECTIONS])
  const Q = quotes.length
  const depth = useRef(0)
  const [d, setD] = useState(0)
  const [low, setLow] = useState(false)
  const [born] = useState(() => performance.now())
  const lastLayer = useRef(-1)

  useEffect(() => {
    let raf
    const tick = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const p = max > 0 ? scrollY / max : 0
      const want = p * (Q + 1.6)
      depth.current += (want - depth.current) * 0.08
      const L = Math.floor(depth.current + 0.15)
      if (L !== lastLayer.current) { if (L > lastLayer.current && L > 0) bus.sfx('layer', L); lastLayer.current = L; setDepthTone(L) }
      setD((v) => (Math.abs(v - depth.current) > 0.004 ? depth.current : v))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); setDepthTone(0) }
  }, [Q])

  // caption opacity: a layer's line shows while you are passing through it
  const vis = (c) => Math.max(0, 1 - Math.abs(d - c) / 0.42)

  return (
    <motion.section className="descent" style={{ height: `${(Q + 2.2) * 100}vh` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
      <div className="descent-stage">
        <Canvas dpr={low ? 1 : [1, 1.75]} camera={{ fov: 52, position: [0, 0, 6], near: 0.1, far: 140 }} gl={{ antialias: true, powerPreference: 'high-performance' }}
          onCreated={({ scene }) => { scene.fog = new THREE.FogExp2('#040408', 0.028); scene.background = new THREE.Color('#030306') }}>
          <PerformanceMonitor onDecline={() => performance.now() - born > 3000 && setLow(true)} flipflops={2} />
          <Tunnel depth={depth} />
          {!low && (
            <EffectComposer multisampling={0}>
              <Bloom intensity={0.75} luminanceThreshold={0.7} mipmapBlur />
              <Noise opacity={0.05} />
              <Vignette eskil={false} offset={0.2} darkness={0.9} />
            </EffectComposer>
          )}
        </Canvas>

        <div className="descent-ui">
          <div className="descent-intro" style={{ opacity: Math.max(0, 1 - d / 0.35) }}>
            <p className="sec-group">{T.eyebrow}</p>
            <h2 className="descent-title"><span>{T.title[0]}</span><i>{T.title[1]}</i></h2>
            <p className="descent-hint">{T.hint} <span>↓</span></p>
          </div>

          {quotes.map((l, j) => {
            const o = vis(j + 0.55)
            if (o <= 0) return null
            return (
              <figure key={l.key} className="descent-cap" style={{ opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>
                <p className="descent-n">{T.layer} {String(j + 1).padStart(2, '0')} · <b>{l[UI.lang]}</b></p>
                <blockquote lang="zh-Hant">{l.q.cn}</blockquote>
                <figcaption>
                  <p>{l.q.en}</p>
                  <span><code>{l.q.key}</code> · v{l.q.ver}</span>
                </figcaption>
              </figure>
            )
          })}

          <div className="descent-end" style={{ opacity: Math.max(0, Math.min(1, (d - Q - 0.2) / 0.5)), pointerEvents: d > Q + 0.4 ? 'auto' : 'none' }}>
            <b>{T.end[0]}</b>
            <h3>{T.end[1]}</h3>
            <p>{T.end[2]}</p>
            <div>
              <button className="hero-enter" onClick={() => go('chaos')}>{UI.lang === 'ru' ? 'Ниже — Хаос ↓' : 'Below: Chaos ↓'}</button>
              <button className="crumb" onClick={() => go('chain')}>{T.chain} →</button>
              <button className="crumb" onClick={() => go('map')}>{T.map}</button>
            </div>
          </div>

          <div className="descent-rail" aria-hidden="true">
            <span style={{ transform: `scaleY(${Math.min(1, d / (Q + 1))})` }} />
            {quotes.map((_, j) => <i key={j} className={d > j + 0.4 ? 'on' : ''} style={{ top: `${((j + 0.55) / (Q + 1)) * 100}%` }} />)}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
