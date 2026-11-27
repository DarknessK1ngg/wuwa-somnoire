import { bus } from './bus'

// Sound for the site. Effects and the ambient bed are audio files rendered with earshot
// (public/audio, see CREDITS.txt); they are fetched only once sound is switched on.
let A = null
const BASE = import.meta.env.BASE_URL + 'audio/'
const NAMES = ['tick', 'search', 'ring', 'open', 'shimmer', 'whoosh', 'swell', 'iris', 'suck', 'boom', 'catch', 'layer']
// D minor pentatonic, as playback rates, for the bell on each layer of the descent
const PENTA = [1, 1.189, 1.335, 1.498, 1.782, 2]

function ext() {
  const a = document.createElement('audio')
  return a.canPlayType('audio/webm; codecs="opus"') ? 'webm' : 'mp3'
}

async function load(ctx, name, e) {
  const r = await fetch(`${BASE}${name}.${e}`)
  if (!r.ok) throw new Error(name)
  return ctx.decodeAudioData(await r.arrayBuffer())
}

function build() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)()
  const master = ctx.createGain(); master.gain.value = 0
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 2.5
  master.connect(comp).connect(ctx.destination)
  const music = ctx.createGain(); music.gain.value = 0
  const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 12000
  music.connect(tone).connect(master)
  const fx = ctx.createGain(); fx.gain.value = 0.9; fx.connect(master)
  const S = { ctx, master, music, tone, fx, buf: {}, bed: null }
  const e = ext()
  // the bed first, then the effects
  load(ctx, 'ambient', e).then((b) => {
    S.buf.ambient = b
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true
    src.connect(music); src.start()
    S.bed = src
    music.gain.setTargetAtTime(0.55, ctx.currentTime, 2.2)
  }).catch(() => {})
  NAMES.forEach((n) => load(ctx, n, e).then((b) => { S.buf[n] = b }).catch(() => {}))
  return S
}

function play(name, { gain = 1, rate = 1, when = 0, pan = 0 } = {}) {
  const b = A?.buf[name]
  if (!b) return
  const { ctx, fx } = A
  const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = rate
  const g = ctx.createGain(); g.gain.value = gain
  let out = g
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); out = p }
  src.connect(g); out.connect(fx)
  src.start(ctx.currentTime + when)
}

const SFX = {
  tick: () => play('tick', { gain: 0.55, rate: 0.94 + Math.random() * 0.14, pan: (Math.random() - 0.5) * 0.6 }),
  search: () => play('search', { gain: 0.5 }),
  ring: (x = 0.6) => play('ring', { gain: 0.35 + 0.55 * x, rate: 0.85 + x * 0.3 }),
  open: () => { play('open', { gain: 0.7 }); play('shimmer', { gain: 0.5, when: 0.15 }) },
  whoosh: () => { play('whoosh', { gain: 0.9 }); play('swell', { gain: 0.6, when: 0.1 }) },
  iris: () => play('iris', { gain: 0.7 }),
  plunge: () => { play('suck', { gain: 0.9 }); play('boom', { gain: 0.9, when: 0.42 }); play('layer', { gain: 0.35, when: 0.8, rate: 0.5 }) },
  catch: () => play('catch', { gain: 0.75, rate: 0.95 + Math.random() * 0.1 }),
  layer: (i = 0) => play('layer', { gain: 0.6, rate: PENTA[i % 6] * (i >= 6 ? 0.5 : 1) * 0.75 }),
}

export function setSound(on) {
  if (on) {
    if (!A) A = build()
    A.ctx.resume()
    const t = A.ctx.currentTime
    A.master.gain.cancelScheduledValues(t)
    A.master.gain.setTargetAtTime(0.9, t, 0.4)
    bus.sfx = (name, x) => { try { if (A && A.ctx.state === 'running') SFX[name]?.(x) } catch {} }
  } else {
    bus.sfx = () => {}
    if (!A) return
    A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.25)
    setTimeout(() => A && A.master.gain.value < 0.01 && A.ctx.suspend(), 1200)
  }
}

// deeper places sound darker: the descent closes the filter a little as you fall
export function setDepthTone(depth) {
  if (!A) return
  const f = Math.max(1800, 12000 - depth * 1500)
  A.tone.frequency.setTargetAtTime(f, A.ctx.currentTime, 0.4)
}
