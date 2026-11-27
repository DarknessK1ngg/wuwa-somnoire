import { bus } from './bus'

// All sound is synthesised in the browser: a low fog drone with wind, and metallic chimes for the Mark.
// Nothing plays until the visitor switches sound on (browsers also require that click).
let A = null

function impulse(ctx, sec = 3.2) {
  const len = Math.floor(ctx.sampleRate * sec)
  const b = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6)
  }
  return b
}

function noiseBuffer(ctx, sec = 4) {
  const len = Math.floor(ctx.sampleRate * sec)
  const b = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = b.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5 }
  return b
}

function build() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain(); master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -18; comp.ratio.value = 3
  master.connect(comp).connect(ctx.destination)
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx)
  const wet = ctx.createGain(); wet.gain.value = 0.55
  verb.connect(wet).connect(master)
  const dry = ctx.createGain(); dry.gain.value = 0.8
  dry.connect(master)
  const noise = noiseBuffer(ctx)

  // ambient: a soft open fifth that breathes, and wind through a moving band-pass
  const amb = ctx.createGain(); amb.gain.value = 0.0
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 0.6
  amb.connect(lp); lp.connect(dry); lp.connect(verb)
  const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05
  const lfoG = ctx.createGain(); lfoG.gain.value = 180
  lfo.connect(lfoG).connect(lp.frequency); lfo.start()
  for (const [f, type, g] of [[73.42, 'sine', 0.34], [110, 'triangle', 0.12], [146.8, 'sine', 0.1], [220.5, 'sine', 0.035]]) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = f
    o.detune.value = (Math.random() - 0.5) * 8
    const og = ctx.createGain(); og.gain.value = g
    o.connect(og).connect(amb); o.start()
  }
  const wind = ctx.createBufferSource(); wind.buffer = noise; wind.loop = true
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.9
  const wg = ctx.createGain(); wg.gain.value = 0.12
  const wl = ctx.createOscillator(); wl.frequency.value = 0.07
  const wlg = ctx.createGain(); wlg.gain.value = 260
  wl.connect(wlg).connect(bp.frequency); wl.start()
  wind.connect(bp).connect(wg).connect(amb); wind.start()

  return { ctx, master, verb, dry, amb, noise }
}

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + a)
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d)
}

// a struck metal bar: inharmonic partials, long tail
function bell(f, vol = 0.12, dur = 2.6, wet = true) {
  const { ctx, verb, dry } = A
  const t = ctx.currentTime
  for (const [r, g] of [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * r
    const og = ctx.createGain()
    env(og, t, 0.004, vol * g, dur / Math.sqrt(r))
    o.connect(og); og.connect(dry); if (wet) og.connect(verb)
    o.start(t); o.stop(t + dur + 0.1)
  }
}

function whoosh(dur = 1, from = 300, to = 2600, vol = 0.18) {
  const { ctx, verb, dry, noise } = A
  const t = ctx.currentTime
  const src = ctx.createBufferSource(); src.buffer = noise
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4
  bp.frequency.setValueAtTime(from, t); bp.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(bp).connect(g); g.connect(dry); g.connect(verb)
  src.start(t); src.stop(t + dur + 0.05)
}

const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]

const SFX = {
  tick() {
    const { ctx, dry } = A
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain()
    o.frequency.value = 1900 + Math.random() * 300
    env(g, t, 0.002, 0.025, 0.05)
    o.connect(g).connect(dry); o.start(t); o.stop(t + 0.08)
  },
  ring(x = 0.6) { bell(330 * (0.85 + x * 0.5), 0.06 + 0.1 * x, 3) },
  open() { PENTA.forEach((r, i) => setTimeout(() => A && bell(523 * r, 0.035, 1.8), i * 70)) },
  whoosh() { whoosh(0.9, 260, 2400, 0.14) },
  iris() { whoosh(0.55, 900, 240, 0.08) },
  plunge() {
    const { ctx, dry, verb } = A
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(34, t + 1.3)
    env(g, t, 0.02, 0.35, 1.4)
    o.connect(g); g.connect(dry); g.connect(verb); o.start(t); o.stop(t + 1.6)
    whoosh(1.1, 200, 3200, 0.16)
    setTimeout(() => A && bell(196, 0.12, 4), 650)
  },
  catch() {
    bell(1046, 0.08, 1.6)
    for (let i = 0; i < 5; i++) setTimeout(() => A && bell(1568 * PENTA[(Math.random() * 6) | 0], 0.025, 0.9), 60 + i * 55)
  },
  layer(i = 0) { bell(262 * PENTA[i % 6] * (i >= 6 ? 0.5 : 1), 0.07, 3.4) },
}

export function setSound(on) {
  if (on) {
    if (!A) A = build()
    A.ctx.resume()
    const t = A.ctx.currentTime
    A.master.gain.cancelScheduledValues(t)
    A.master.gain.setTargetAtTime(0.75, t, 0.4)
    A.amb.gain.setTargetAtTime(0.55, t, 1.5)
    bus.sfx = (name, x) => { try { if (A && A.ctx.state === 'running') SFX[name]?.(x) } catch {} }
  } else {
    bus.sfx = () => {}
    if (!A) return
    const t = A.ctx.currentTime
    A.master.gain.setTargetAtTime(0, t, 0.25)
    setTimeout(() => A && A.master.gain.value < 0.01 && A.ctx.suspend(), 1200)
  }
}
