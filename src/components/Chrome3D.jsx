import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import * as THREE from 'three'
import studio from '@pmndrs/assets/hdri/studio.exr.js'
import { bus, moodLerp } from '../bus'
import { WORDMARK } from '../wordmark'

// Small chrome pieces for the section pages. A canvas only renders while it is on screen.
function useInView(ref) {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: '120px' })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return on
}

function useChrome(rough = 0.07) {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#e6e8f2', metalness: 1, roughness: rough, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 920],
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6,
  }), [rough])
  useFrame((_, dt) => moodLerp(mat.color, 'chrome', Math.min(1, dt * 3)))
  return mat
}

function useSeam() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffc870', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  useFrame(() => moodLerp(mat.color, 'seam', 0.08))
  return mat
}

// ---- the pieces ----
function Rings() {
  const m = useChrome(), seam = useSeam()
  const r = useRef([])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    r.current.forEach((g, i) => { if (g) { g.rotation.x = t * (0.3 + i * 0.17); g.rotation.y = t * (0.21 - i * 0.09) } })
  })
  return (
    <group>
      {[1.25, 0.98, 0.72].map((R, i) => (
        <mesh key={i} ref={(el) => { r.current[i] = el }} material={m}><torusGeometry args={[R, 0.035, 24, 160]} /></mesh>
      ))}
      <mesh material={seam}><sphereGeometry args={[0.12, 32, 32]} /></mesh>
      <mesh material={m}><sphereGeometry args={[0.22, 48, 48]} /></mesh>
    </group>
  )
}

function Door() {
  const m = useChrome(), seam = useSeam()
  const geo = useMemo(() => {
    const arch = (w, h, r) => { const s = new THREE.Shape(); s.moveTo(-w, -h); s.lineTo(-w, h - r); s.absarc(0, h - r, w, Math.PI, 0, true); s.lineTo(w, -h); s.lineTo(-w, -h); return s }
    const outer = arch(0.82, 1.25, 0.82), inner = arch(0.62, 1.05, 0.62)
    outer.holes.push(new THREE.Path(inner.getPoints(48).reverse()))
    const g = new THREE.ExtrudeGeometry(outer, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 6, curveSegments: 48 })
    g.center()
    return g
  }, [])
  const g = useRef()
  useFrame((st) => { g.current.rotation.y = Math.sin(st.clock.elapsedTime * 0.4) * 0.5 })
  return (
    <group ref={g}>
      <mesh geometry={geo} material={m} />
      <mesh position={[0, -0.1, 0]} material={seam}><planeGeometry args={[0.04, 1.9]} /></mesh>
      <mesh position={[0, -0.1, -0.02]}><planeGeometry args={[1.2, 2]} /><meshBasicMaterial color="#020204" /></mesh>
    </group>
  )
}

function Mirror() {
  const m = useChrome(0.015)
  const g = useRef()
  useFrame((st) => { const t = st.clock.elapsedTime; g.current.rotation.y = t * 0.35; g.current.rotation.x = Math.sin(t * 0.5) * 0.15 })
  return <mesh ref={g} material={m}><boxGeometry args={[1.3, 1.9, 0.04, 1, 1, 1]} /></mesh>
}

function Nested() {
  const m = useChrome()
  const r = useRef([])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    r.current.forEach((g, i) => { if (g) { g.rotation.z = t * 0.2 * (i % 2 ? -1 : 1) + i * 0.4; g.position.z = -i * 0.32 + Math.sin(t * 0.8 - i * 0.6) * 0.05 } })
  })
  return (
    <group rotation={[0.25, -0.5, 0]}>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} ref={(el) => { r.current[i] = el }} material={m} scale={Math.pow(0.8, i)}>
          <torusGeometry args={[1.2, 0.04, 20, 6]} />
        </mesh>
      ))}
    </group>
  )
}

function Orb() {
  const m = useChrome(0.05)
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.95, 24), [])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])
  useFrame((st) => {
    const t = st.clock.elapsedTime, a = geo.attributes.position.array
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], y = base[i + 1], z = base[i + 2]
      const k = 1 + 0.06 * Math.sin(y * 9 + t * 2) + 0.03 * Math.sin(x * 14 - t * 3)
      a[i] = x * k; a[i + 1] = y * k; a[i + 2] = z * k
    }
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
  })
  return <mesh geometry={geo} material={m} />
}

function Void() {
  const m = useChrome(), seam = useSeam()
  const r = useRef()
  useFrame((st) => { r.current.rotation.x = 1.2 + Math.sin(st.clock.elapsedTime * 0.3) * 0.2; r.current.rotation.z = st.clock.elapsedTime * 0.25 })
  return (
    <group>
      <mesh><sphereGeometry args={[0.8, 64, 64]} /><meshPhysicalMaterial color="#040406" roughness={0.25} metalness={0.4} clearcoat={1} /></mesh>
      <mesh ref={r} material={m}><torusGeometry args={[1.2, 0.03, 16, 180]} /></mesh>
      <mesh material={seam} scale={0.835}><torusGeometry args={[1, 0.006, 8, 180]} /></mesh>
    </group>
  )
}

function Shard() {
  const m = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e6e8f2', metalness: 1, roughness: 0.05, iridescence: 1, iridescenceIOR: 1.7, clearcoat: 1, flatShading: true, envMapIntensity: 1.6 }), [])
  useFrame((_, dt) => moodLerp(m.color, 'chrome', Math.min(1, dt * 3)))
  const g = useRef()
  useFrame((st) => { g.current.rotation.y = st.clock.elapsedTime * 0.4 })
  return <mesh ref={g} material={m} scale={[0.75, 1.5, 0.75]}><octahedronGeometry args={[1, 0]} /></mesh>
}

const PIECES = { rings: Rings, door: Door, mirror: Mirror, nested: Nested, orb: Orb, void: Void, shard: Shard }

function Follow({ children, k = 0.35 }) {
  const g = useRef()
  useFrame((_, dt) => {
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, bus.mouse.x * k, Math.min(1, dt * 2))
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -bus.mouse.y * k * 0.6, Math.min(1, dt * 2))
  })
  return <group ref={g}>{children}</group>
}

export function Sculpture({ type = 'shard', className = '' }) {
  const box = useRef()
  const on = useInView(box)
  const Piece = PIECES[type] || Shard
  return (
    <div ref={box} className={`sculpt ${className}`} aria-hidden="true">
      <Canvas frameloop={on ? 'always' : 'never'} dpr={[1, 1.75]} camera={{ fov: 30, position: [0, 0, 6] }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}><Environment files={studio} /></Suspense>
        <directionalLight position={[3, 4, 3]} intensity={2} color="#e8ecff" />
        <Follow><Piece /></Follow>
      </Canvas>
    </div>
  )
}

// ---- the closing wordmark ----
function Word() {
  const geo = useMemo(() => {
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${WORDMARK.d}"/></svg>`)
    const shapes = data.paths.flatMap((p) => SVGLoader.createShapes(p))
    const g = new THREE.ExtrudeGeometry(shapes, { depth: 18, bevelEnabled: true, bevelThickness: 3, bevelSize: 1.6, bevelSegments: 5, curveSegments: 10 })
    g.scale(1, -1, 1) // SVG y points down
    g.center()
    g.computeVertexNormals()
    return g
  }, [])
  const m = useChrome(0.06)
  const g = useRef()
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime
    g.current.rotation.y = THREE.MathUtils.lerp(g.current.rotation.y, bus.mouse.x * 0.3 + Math.sin(t * 0.3) * 0.06, Math.min(1, dt * 2))
    g.current.rotation.x = THREE.MathUtils.lerp(g.current.rotation.x, -bus.mouse.y * 0.18, Math.min(1, dt * 2))
    const fit = Math.min(1, (st.size.width / st.size.height) / 3.2)
    g.current.scale.setScalar((10.5 / WORDMARK.w) * fit)
  })
  return <group ref={g}><mesh geometry={geo} material={m} /></group>
}

export function Wordmark() {
  const box = useRef()
  const on = useInView(box)
  return (
    <div ref={box} className="wordmark" aria-hidden="true">
      <Canvas frameloop={on ? 'always' : 'never'} dpr={[1, 1.75]} camera={{ fov: 26, position: [0, 0, 9] }} gl={{ alpha: true, antialias: true }}>
        <Suspense fallback={null}><Environment files={studio} /></Suspense>
        <directionalLight position={[0, 5, 4]} intensity={2.2} color="#e8ecff" />
        <Word />
      </Canvas>
    </div>
  )
}
