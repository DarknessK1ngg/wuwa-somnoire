// Tiny shared state between the DOM layers and the WebGL scenery.
export const bus = {
  pan: 0, // world px travelled along the Mark map
  shock: { x: 0, y: 0, t: -100 }, // last shockwave (client px, performance.now()/1000)
}

export function shockAt(x, y) {
  bus.shock = { x, y, t: performance.now() / 1000 }
}
