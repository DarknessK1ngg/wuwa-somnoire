// Procedural "Mark": a thin horizontal line with sharp, lens-shaped spikes,
// like a frozen sound wave. Deterministic, so it looks the same on every visit.

export const STEP = 30

const hash = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

// Spike falloff: sharp at the tip, concave flanks.
const kern = (u) => {
  u = Math.abs(u)
  return u >= 1 ? 0 : Math.pow(1 - u, 2.6)
}

const cache = new Map()
export function decor(i) {
  let s = cache.get(i)
  if (s) return s
  const r1 = hash(i), r2 = hash(i + 17.3), r3 = hash(i + 91.7), r4 = hash(i + 5.1), r5 = hash(i * 0.37 + 2.2)
  const big = r1 > 0.84
  const slow = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(i * 0.21 + r5 * 2))
  const up = (3 + r2 * 20) * (big ? 3.1 : 1) * slow
  const down = (r3 > 0.45 ? 3 + r4 * 17 : 1 + r4 * 3) * (big ? 2.3 : 1) * slow
  const w = STEP * (0.55 + r3 * 1.3) * (big ? 1.25 : 1)
  const x = i * STEP + (r4 - 0.5) * STEP * 0.6
  s = { x, up, down, w }
  if (cache.size > 4000) cache.clear()
  cache.set(i, s)
  return s
}

// Thickness above and below the baseline at world position wx.
// nodes: [{x, up, down, w, boost}], env: optional envelope fn(wx) => 0..1, t: time (s)
export function profile(wx, nodes, t = 0, env = null, decorScale = 1, base = 1.1) {
  let up = base, down = base
  const e = env ? env(wx) : 1
  const i0 = Math.floor((wx - 3 * STEP) / STEP), i1 = Math.ceil((wx + 3 * STEP) / STEP)
  for (let i = i0; i <= i1; i++) {
    const s = decor(i)
    const k = kern((wx - s.x) / s.w)
    if (k) {
      const b = (1 + 0.14 * Math.sin(t * 1.4 + i * 1.7)) * e * decorScale
      up += s.up * k * b
      down += s.down * k * b
    }
  }
  for (const n of nodes) {
    const k = kern((wx - n.x) / n.w)
    if (k) {
      const b = (1 + 0.05 * Math.sin(t * 2 + n.x * 0.01)) * (n.boost || 1)
      up += n.up * k * b
      down += n.down * k * b
    }
  }
  return [up * e + 0.6 * (1 - e), down * e + 0.6 * (1 - e)]
}

// SVG path for a finite Mark centred on 0 (used by the intro).
export function markPath(half = 600, centre = { up: 190, down: 130, w: 54 }) {
  const env = (x) => Math.exp(-Math.pow(x / (half * 0.55), 2))
  const nodes = [
    { x: 0, ...centre },
    { x: -120, up: 70, down: 40, w: 28 },
    { x: 150, up: 60, down: 75, w: 30 },
    { x: -260, up: 38, down: 52, w: 24 },
    { x: 290, up: 44, down: 20, w: 22 },
  ]
  const top = [], bot = []
  for (let x = -half; x <= half; x += 2) {
    const [u, d] = profile(x, nodes, 0, env, 1.4)
    top.push(`${x.toFixed(0)},${(-u).toFixed(1)}`)
    bot.push(`${x.toFixed(0)},${d.toFixed(1)}`)
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`
}

// A thin Mark line for card edges and dividers. viewBox 0 0 1000 40, baseline at y=20.
export function edgePath(seed = 1, spikes = 3, amp = 16) {
  const r = (i) => { const x = Math.sin((seed * 13.7 + i) * 91.3) * 43758.5453; return x - Math.floor(x) }
  const nodes = []
  for (let i = 0; i < spikes; i++) {
    nodes.push({ x: 1000 * (0.1 + 0.8 * ((i + 0.2 + r(i) * 0.6) / spikes)) + seed * 2000, up: amp * (0.5 + r(i + 9) * 0.6), down: amp * (0.3 + r(i + 4) * 0.5), w: 16 + r(i + 2) * 18 })
  }
  nodes[0].up = amp * 1.15; nodes[0].down = amp * 0.85
  const env = (x) => { const u = (x - seed * 2000) / 1000; return Math.min(1, u * 6, (1 - u) * 6) }
  const top = [], bot = []
  for (let x = 0; x <= 1000; x += 4) {
    const wx = x + seed * 2000
    const [u, d] = profile(wx, nodes, 0, env, 0.22)
    top.push(`${x},${(20 - Math.min(19, u * 0.9)).toFixed(1)}`)
    bot.push(`${x},${(20 + Math.min(19, d * 0.9)).toFixed(1)}`)
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`
}

// A single vertical spike (lens) for number badges. viewBox 0 0 40 100.
export const SPIKE = 'M20,0 C21.5,30 26,44 34,50 C26,56 21.5,70 20,100 C18.5,70 14,56 6,50 C14,44 18.5,30 20,0 Z'
