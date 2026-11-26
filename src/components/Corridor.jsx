import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const COUNT = 18
const GAP = 3.2

// One door: an arch outline built from a line loop.
function doorGeometry() {
  const pts = []
  const w = 1.1, h = 1.5, r = w
  pts.push(new THREE.Vector3(-w, -h, 0))
  pts.push(new THREE.Vector3(-w, h - r * 0.2, 0))
  for (let i = 0; i <= 32; i++) {
    const a = Math.PI - (i / 32) * Math.PI
    pts.push(new THREE.Vector3(Math.cos(a) * w, h - r * 0.2 + Math.sin(a) * w, 0))
  }
  pts.push(new THREE.Vector3(w, -h, 0))
  return new THREE.BufferGeometry().setFromPoints(pts)
}

function Doors({ color, moving }) {
  const group = useRef()
  const geo = useMemo(doorGeometry, [])
  useFrame((state, dt) => {
    if (!moving) return
    const g = group.current
    g.children.forEach((d) => {
      d.position.z += dt * 2.4
      if (d.position.z > 4) d.position.z -= COUNT * GAP
      const near = THREE.MathUtils.clamp(1 - Math.abs(d.position.z) / (COUNT * GAP * 0.6), 0, 1)
      d.material.opacity = near * 0.95
    })
    g.rotation.z = Math.sin(state.clock.elapsedTime * 0.25) * 0.08
  })
  return (
    <group ref={group}>
      {Array.from({ length: COUNT }, (_, i) => (
        <line key={i} geometry={geo} position={[0, 0, -i * GAP]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.02 * i]}>
          <lineBasicMaterial color={color} transparent opacity={0.9} />
        </line>
      ))}
    </group>
  )
}

export default function Corridor({ color = '#7ff2e6', moving = true, caption = '' }) {
  return (
    <div className="corridor">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }}>
        <fog attach="fog" args={['#05030c', 4, 40]} />
        <Doors color={color} moving={moving} />
        <Sparkles count={120} scale={[8, 6, 40]} position={[0, 0, -16]} size={2.2} speed={moving ? 0.4 : 0} color={color} opacity={0.7} />
      </Canvas>
      <div className="corridor-cap">
        <span className="cn">層層夢境無窮無盡</span>
        <span>{caption}</span>
      </div>
    </div>
  )
}
