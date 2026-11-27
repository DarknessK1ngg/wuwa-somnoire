import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { Fog } from './FogSky'
import { bus } from '../bus'

// The same moonlit fog as the hero, behind every other screen. The clouds drift with
// travel along the Mark and each screen sits at its own depth.
const DEPTH = { intro: 0, map: 0.12, section: 0.3, inner: 0.55, char: 0.4 }

function World({ shot, s }) {
  const prog = useRef(0)
  const pan = useRef(0)
  useFrame((_, dt) => {
    prog.current += ((DEPTH[shot] ?? 0.3) - prog.current) * Math.min(1, dt * 1.5)
    pan.current = bus.pan / 2600
  })
  return (
    <>
      <Fog front={false} prog={prog} tint={s.fog || s.c2} aura={s.seam || s.aura || '#ffc870'} pan={pan} />
      <Sparkles count={70} scale={[12, 7, 4]} size={1.4} speed={s.motion ? 0.2 : 0} opacity={0.35} color="#d6dcf6" />
    </>
  )
}

export default function Background({ shot, s }) {
  return (
    <div className="bg" aria-hidden="true">
      <Canvas
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        dpr={[1, 1.25]}
        frameloop={shot === 'intro' ? 'never' : 'always'}
        camera={{ fov: 32, position: [0, 0, 7] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <World shot={shot} s={s} />
      </Canvas>
      <div className={`veil veil-${shot === 'inner' ? 'map' : shot === 'char' ? 'section' : shot}`} />
    </div>
  )
}
