import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'
import Scenery from './Scenery'

// Camera framing per screen: the gradient "moves" with the visitor.
const SHOTS = {
  intro: { cAzimuthAngle: 180, cPolarAngle: 90, cDistance: 3.4, uStrength: 3.4, uDensity: 1.3, rotationZ: 50 },
  map: { cAzimuthAngle: 210, cPolarAngle: 115, cDistance: 4.6, uStrength: 2.6, uDensity: 1.1, rotationZ: 20 },
  section: { cAzimuthAngle: 160, cPolarAngle: 75, cDistance: 5.6, uStrength: 2.2, uDensity: 0.9, rotationZ: 70 },
  inner: { cAzimuthAngle: 250, cPolarAngle: 120, cDistance: 3.0, uStrength: 3.8, uDensity: 1.6, rotationZ: 110 },
  char: { cAzimuthAngle: 140, cPolarAngle: 70, cDistance: 4.8, uStrength: 2.4, uDensity: 1.0, rotationZ: 30 },
}

export default function Background({ shot, s }) {
  const cam = SHOTS[shot] || SHOTS.section
  return (
    <div className="bg" aria-hidden="true">
      <ShaderGradientCanvas
        style={{ position: 'absolute', inset: 0 }}
        pixelDensity={1}
        fov={45}
        pointerEvents="none"
        lazyLoad={false}
      >
        <ShaderGradient
          control="props"
          type="waterPlane"
          animate={s.motion ? 'on' : 'off'}
          uTime={0.2}
          uSpeed={0.16}
          uFrequency={5.5}
          uAmplitude={0}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={10}
          color1={s.c1}
          color2={s.c2}
          color3={s.c3}
          reflection={0.1}
          lightType="3d"
          brightness={s.mode === 'light' ? 1.35 : 1.15}
          grain={s.grain ? 'on' : 'off'}
          enableTransition
          smoothTime={0.6}
          {...cam}
        />
      </ShaderGradientCanvas>
      <Scenery shot={shot} s={s} />
      <div className={`veil veil-${shot === 'inner' ? 'map' : shot === 'char' ? 'section' : shot}`} />
    </div>
  )
}
