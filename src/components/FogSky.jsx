import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bus } from '../bus'

// ---------- Fog: a full-screen shader drawn behind (and a thinner veil in front of) the Mark ----------
const fogVert = /* glsl */ `
varying vec2 vUv;
uniform float uDepth;
void main() { vUv = uv; gl_Position = vec4(position.xy, uDepth, 1.0); }
`
const fogFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime, uProg, uFront, uAspect, uPan;
uniform vec2 uMouse, uMouseP, uClickP;
uniform float uClickT;
uniform vec3 uTint, uAura;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a * noise(p); p = p * 2.02 + 11.3; a *= 0.5; } return v; }
void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
  float t = uTime * 0.035;
  vec2 q = p * (uFront > 0.5 ? 1.6 : 1.1) + uMouse * 0.04 + vec2(uPan, 0.0);
  // domain-warped clouds, drifting sideways and slowly opening as you descend
  vec2 w = vec2(fbm(q * 1.4 + vec2(t, 0.0)), fbm(q * 1.4 + vec2(-t * 0.7, 3.1)));
  float c = fbm(q * 1.9 + w * 1.6 + vec2(t * 0.6, -t * 0.2) + uProg * vec2(0.0, 0.8));
  if (uFront < 0.5) {
    // the sky behind: near black, a cold moonlit bloom from above, layered cloud banks
    float glow = exp(-pow(length(p - vec2(0.0, 0.42)) * 1.4, 2.0));
    vec3 col = mix(vec3(0.008, 0.009, 0.014), mix(uTint, vec3(0.55, 0.6, 0.7), 0.6) * 0.13, glow);
    // the cloud banks thin out around the cursor, as if a hand moved through them
    float md = length(p - uMouseP);
    float clear = smoothstep(0.04, 0.34, md);
    float bank = smoothstep(0.38, 0.85, c) * (0.55 + 0.45 * smoothstep(-0.5, 0.3, p.y)) * mix(0.2, 1.0, clear);
    col += mix(uTint, vec3(0.8, 0.84, 0.95), 0.5) * 0.035 * exp(-md * md * 26.0);
    // a ring that runs out through the mist from the last click
    float ct = uTime - uClickT;
    float cr = length(p - uClickP) - ct * 0.42;
    col += uAura * 0.11 * exp(-cr * cr * 900.0) * exp(-ct * 1.6) * step(0.0, ct);
    col += vec3(0.72, 0.75, 0.84) * bank * (0.07 + 0.14 * glow);
    // god rays falling from the light
    float ang = atan(p.x, 0.9 - p.y);
    float rays = pow(noise(vec2(ang * 9.0, uTime * 0.05)), 3.0) * glow * 0.22;
    col += vec3(0.85, 0.88, 1.0) * rays;
    // a faint warm horizon line far below
    col += uAura * 0.05 * exp(-pow((p.y + 0.42) * 10.0, 2.0));
    col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.025;
    gl_FragColor = vec4(col, 1.0);
  } else {
    // a veil of mist in front of the Mark that parts from the centre as you scroll
    float hole = smoothstep(0.15 + uProg * 0.9, 0.6 + uProg * 1.2, length(p * vec2(0.7, 1.2)));
    float a = smoothstep(0.45, 0.9, c) * (0.55 - uProg * 0.45) * mix(0.25, 1.0, hole);
    a *= mix(0.12, 1.0, smoothstep(0.05, 0.3, length(p - uMouseP)));
    a *= smoothstep(0.55, -0.1, p.y) * 0.9 + 0.1;
    a *= 0.75;
    gl_FragColor = vec4(vec3(0.7, 0.73, 0.8) * a, a);
  }
}
`

export function Fog({ front, prog, tint, aura, pan }) {
  const mat = useRef()
  const lastClick = useRef(-100)
  const { size } = useThree()
  const uniforms = useMemo(() => ({
    uTime: { value: 0 }, uProg: { value: 0 }, uFront: { value: front ? 1 : 0 }, uAspect: { value: 1 },
    uMouse: { value: new THREE.Vector2() }, uPan: { value: 0 }, uDepth: { value: front ? -0.5 : 0.999 },
    uTint: { value: new THREE.Color(tint) }, uAura: { value: new THREE.Color(aura) },
    uMouseP: { value: new THREE.Vector2(0, 0) }, uClickP: { value: new THREE.Vector2(0, 0) }, uClickT: { value: -100 },
  }), [front])
  useEffect(() => { uniforms.uTint.value.set(tint); uniforms.uAura.value.set(aura) }, [tint, aura])
  useFrame((st, dt) => {
    uniforms.uTime.value += Math.min(dt, 0.05)
    uniforms.uProg.value = prog.current
    if (pan) uniforms.uPan.value += ((pan.current || 0) - uniforms.uPan.value) * 0.08
    uniforms.uAspect.value = size.width / size.height
    uniforms.uMouse.value.lerp(st.pointer, 0.05)
    // pointer anywhere on the page (the canvas itself does not receive events)
    const a = size.width / size.height
    const mp = uniforms.uMouseP.value
    mp.x += (bus.mouse.x * 0.5 * a - mp.x) * Math.min(1, dt * 4)
    mp.y += (bus.mouse.y * 0.5 - mp.y) * Math.min(1, dt * 4)
    const ck = bus.click
    if (ck.t !== lastClick.current) {
      lastClick.current = ck.t
      uniforms.uClickP.value.set(ck.x * 0.5 * a, ck.y * 0.5)
      uniforms.uClickT.value = uniforms.uTime.value
    }
  })
  return (
    <mesh frustumCulled={false} renderOrder={front ? 10 : -10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={fogVert} fragmentShader={fogFrag} uniforms={uniforms}
        transparent={front} depthWrite={false} depthTest={!front ? false : false} blending={front ? THREE.NormalBlending : THREE.NoBlending} premultipliedAlpha={front} />
    </mesh>
  )
}

