import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { moodLerp } from '../bus'
import { starGeometry, starMaterial, shellMaterial, fillShells } from '../universes'

// A set of universes: glass bubbles, and inside each a galaxy of real points.
// ctl.current: { g, alpha, dof, focus, voidDim, hover } — read every frame, so the parent can drive it from refs.
export default function Universes({ spots, per = 300, ctl, seed = 1, shells = true, size = 0.03, onHover, onPick, renderOrder = 0 }) {
  const geo = useMemo(() => starGeometry(spots, per, seed), [spots, per, seed])
  const stars = useMemo(starMaterial, [])
  const glass = useMemo(shellMaterial, [])
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 40, 28), [])
  const count = useMemo(() => spots.length * 3, [spots])
  const mesh = useRef(), owner = useRef([])
  useEffect(() => { if (shells && mesh.current) owner.current = fillShells(mesh.current, spots, seed) }, [spots, seed, shells])
  useEffect(() => () => { geo.dispose() }, [geo])

  useFrame((st) => {
    const c = ctl?.current || {}, t = st.clock.elapsedTime
    const cam = st.camera
    stars.uniforms.uTime.value = t
    stars.uniforms.uG.value = c.g ?? 1
    stars.uniforms.uAlpha.value = c.alpha ?? 1
    stars.uniforms.uDof.value = c.dof ?? 0
    stars.uniforms.uFocus.value = c.focus ?? 20
    stars.uniforms.uVoidDim.value = c.voidDim ?? 0
    stars.uniforms.uSize.value = size
    stars.uniforms.uSkip.value = c.skip ?? -1
    stars.uniforms.uPx.value = (st.size.height * st.gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad((cam.fov || 40) / 2)))
    glass.uniforms.uTime.value = t
    glass.uniforms.uG.value = c.g ?? 1
    glass.uniforms.uAlpha.value = c.alpha ?? 1
    glass.uniforms.uHover.value = c.hover ?? -1
    glass.uniforms.uVoidDim.value = c.voidDim ?? 0
    moodLerp(glass.uniforms.uSeam.value, 'seam', 0.05)
    if (mesh.current) mesh.current.visible = (c.alpha ?? 1) > 0.005
  })

  const pick = (e) => owner.current[e.instanceId] ?? -1
  return (
    <>
      <points geometry={geo} material={stars} frustumCulled={false} renderOrder={renderOrder} />
      {shells && (
        <instancedMesh ref={mesh} args={[sphere, glass, count]} frustumCulled={false} renderOrder={renderOrder}
          onPointerMove={onHover ? (e) => { e.stopPropagation(); onHover(pick(e), e) } : undefined}
          onPointerOut={onHover ? () => onHover(-1) : undefined}
          onClick={onPick ? (e) => { e.stopPropagation(); onPick(pick(e)) } : undefined} />
      )}
    </>
  )
}
