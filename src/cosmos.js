import * as THREE from 'three'

// Shared pieces for the bottom of the world: Chaos and Aleph-1.
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) }

export function dotTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, '#fff'); g.addColorStop(0.25, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  x.fillStyle = g; x.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

// ---------- a universe in a bubble: glass rim, a spiral galaxy turning inside, a few stars ----------
// Instanced: each instance has aSeed (look) and aB (when it appears, compared against uG).
const uniVert = /* glsl */ `
attribute float aSeed; attribute float aB;
uniform float uG;
varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vOn;
void main() {
  float on = smoothstep(aB, aB + 0.6, uG);
  vOn = on; vSeed = aSeed;
  vec4 wp = modelMatrix * instanceMatrix * vec4(position * max(on, 0.0001), 1.0);
  vec4 mv = viewMatrix * wp;
  vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const uniFrag = /* glsl */ `
uniform float uTime, uAlpha; uniform vec3 uSeam;
varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vOn;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float f = 1.0 - max(dot(vN, vV), 0.0);
  vec2 q = vN.xy;
  float a0 = vSeed * 6.283 + uTime * 0.12 * (0.4 + vSeed);
  float c = cos(a0), s = sin(a0);
  q = mat2(c, -s, s, c) * q;
  q.y /= mix(0.32, 0.95, fract(vSeed * 7.13));
  float r = length(q), th = atan(q.y, q.x);
  float arms = pow(0.5 + 0.5 * cos(2.0 * th - log(r + 0.03) * 4.2), 3.0);
  float disk = exp(-r * 3.0);
  float core = exp(-r * r * 45.0);
  float st = step(0.982, hash(floor(vN.xy * 26.0) + vSeed * 17.0)) * (1.0 - f);
  vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.86, 0.72), step(0.8, fract(vSeed * 3.7)));
  vec3 col = tint * arms * disk * 1.5 + vec3(1.0, 0.97, 0.92) * core * 2.2 + uSeam * disk * arms * 0.3 + vec3(st);
  float rim = pow(f, 2.6);
  col += vec3(0.82, 0.9, 1.0) * rim * 1.2;
  float a = clamp(rim * 0.9 + (arms * disk + core) * 0.9 + st * 0.7, 0.0, 1.0);
  gl_FragColor = vec4(col * vOn * uAlpha, a * vOn * uAlpha);
}`

export function universeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uG: { value: 0 }, uTime: { value: 0 }, uAlpha: { value: 1 }, uSeam: { value: new THREE.Color('#ffc870') } },
    vertexShader: uniVert, fragmentShader: uniFrag,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
}

// fills an InstancedMesh with universes at the given spots: [{p: Vector3, r: radius, b: birth}]
export function placeUniverses(mesh, spots, seed = 1) {
  const r = rng(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3()
  const aSeed = new Float32Array(spots.length), aB = new Float32Array(spots.length)
  spots.forEach((o, i) => {
    s.setScalar(o.r); m.compose(o.p, q, s); mesh.setMatrixAt(i, m)
    aSeed[i] = r(); aB[i] = o.b ?? 0
  })
  mesh.geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1))
  mesh.geometry.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 1))
  mesh.instanceMatrix.needsUpdate = true
  mesh.count = spots.length
}

// ---------- a band of text to wrap round a cylinder (open, front faces only: you read the near half) ----------
export function textBand(text, { width = 4096, height = 160, size = 78, color = '#eef1f8', font = "'Cormorant Garamond', serif", spacing = 22, italic = false } = {}) {
  const c = document.createElement('canvas'); c.width = width; c.height = height
  const x = c.getContext('2d')
  const draw = () => {
    x.clearRect(0, 0, width, height)
    x.font = `${italic ? 'italic ' : ''}400 ${size}px ${font}`
    x.fillStyle = color; x.textBaseline = 'middle'
    try { x.letterSpacing = `${spacing}px` } catch {}
    // repeat the phrase round the whole band
    const w = x.measureText(text).width
    const n = Math.max(1, Math.floor(width / w)), gap = (width - n * w) / n
    for (let i = 0; i < n; i++) x.fillText(text, i * (w + gap) + gap / 2, height / 2)
    tex.needsUpdate = true
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  draw()
  if (document.fonts?.load) document.fonts.load(`${italic ? 'italic ' : ''}400 ${size}px ${font}`, text).then(draw).catch(() => {})
  return tex
}
