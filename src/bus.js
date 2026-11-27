import { Color } from 'three'

// Tiny shared state between the DOM layers and the WebGL scenery.
export const bus = {
  pan: 0, // world px travelled along the Mark map
  shock: { x: 0, y: 0, t: -100 }, // last shockwave (client px, performance.now()/1000)
  mouse: { x: 0, y: 0 }, // pointer anywhere on the page, -1..1 (y up)
  click: { x: 0, y: 0, t: -100 }, // last click, same space, seconds
  mood: { chrome: '#e6e8f2', seam: '#ffc870', fog: '#7f93c0' }, // current colour mood
  sfx: () => {}, // replaced by the sound engine once it is switched on
}

export function shockAt(x, y) {
  bus.shock = { x, y, t: performance.now() / 1000 }
}

const tmp = new Color()
// ease a three.js Color toward the current mood colour
export function moodLerp(color, key, k) {
  const v = bus.mood[key]
  if (v && color) color.lerp(tmp.set(v), k)
}

if (typeof window !== 'undefined') {
  addEventListener('pointermove', (e) => {
    bus.mouse.x = (e.clientX / innerWidth) * 2 - 1
    bus.mouse.y = -((e.clientY / innerHeight) * 2 - 1)
  }, { passive: true })
  addEventListener('pointerdown', (e) => {
    bus.click = { x: (e.clientX / innerWidth) * 2 - 1, y: -((e.clientY / innerHeight) * 2 - 1), t: performance.now() / 1000 }
  }, { passive: true })
}
