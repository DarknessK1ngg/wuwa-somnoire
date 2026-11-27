import { useEffect, useRef } from 'react'

// One-off entrance effect over a character's art, different for each record:
// Hiyuki — frost grows over the card and thaws; Denia — the art comes out of the void;
// Aemeath — the record arrives as a broken signal and locks in.
const DUR = { hiyuki: 2100, denia: 1900, aemeath: 1500 }

function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

function frostSegments(W, H) {
  const r = rng(7), segs = []
  const grow = (x, y, a, len, depth, t0) => {
    if (depth > 4 || len < 6) return
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len
    segs.push([x, y, x2, y2, t0, depth])
    const t1 = t0 + len / 900
    grow(x2, y2, a + (r() - 0.5) * 0.3, len * 0.78, depth + 1, t1)
    if (r() < 0.8) grow(x + (x2 - x) * 0.5, y + (y2 - y) * 0.5, a + Math.PI / 3, len * 0.5, depth + 1, t0 + len / 1800)
    if (r() < 0.8) grow(x + (x2 - x) * 0.5, y + (y2 - y) * 0.5, a - Math.PI / 3, len * 0.5, depth + 1, t0 + len / 1800)
  }
  const seeds = 16
  for (let i = 0; i < seeds; i++) {
    const side = i % 4, f = r()
    const [x, y] = side === 0 ? [f * W, 0] : side === 1 ? [W, f * H] : side === 2 ? [f * W, H] : [0, f * H]
    const a = Math.atan2(H / 2 - y, W / 2 - x) + (r() - 0.5) * 0.9
    grow(x, y, a, Math.min(W, H) * (0.16 + r() * 0.12), 0, r() * 0.15)
  }
  return segs
}

export default function Signature({ id, imgRef, run }) {
  const cv = useRef()
  useEffect(() => {
    const c = cv.current
    if (!c || document.documentElement.dataset.motion === 'off') return
    const box = c.parentElement.getBoundingClientRect()
    const W = box.width, H = box.height
    if (!W || !H) return
    const dpr = Math.min(2, devicePixelRatio || 1)
    c.width = W * dpr; c.height = H * dpr
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const dur = DUR[id] || 1200
    const t0 = performance.now() + 320
    let raf

    const frost = id === 'hiyuki' ? frostSegments(W, H) : null
    const r = rng(11)
    const cell = 8, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell)
    const thr = id === 'denia'
      ? Array.from({ length: cols * rows }, (_, i) => {
          const cx = (i % cols) * cell - W / 2, cy = Math.floor(i / cols) * cell - H * 0.4
          return Math.hypot(cx / W, cy / H) * 1.1 + r() * 0.35
        })
      : null
    const motes = id === 'denia' ? Array.from({ length: 60 }, () => [r() * W, r() * H, 0.6 + r() * 2.2, r() * 0.6 + 0.2]) : null

    const drawCover = (img, sx, sy, sw, sh, dx, dy, dw, dh) => ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
    const coverMap = (img) => {
      const iw = img.naturalWidth, ih = img.naturalHeight
      const s = Math.max(W / iw, H / ih)
      const vw = W / s, vh = H / s
      return { s, ox: (iw - vw) * 0.5, oy: (ih - vh) * 0.2 }
    }

    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur))
      ctx.clearRect(0, 0, W, H)

      if (id === 'hiyuki') {
        const grow = Math.min(1, p / 0.45), thaw = p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55
        const veil = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75)
        veil.addColorStop(0, `rgba(220, 238, 255, ${0.18 * thaw})`)
        veil.addColorStop(1, `rgba(235, 245, 255, ${0.78 * thaw})`)
        ctx.fillStyle = veil
        ctx.fillRect(0, 0, W, H)
        ctx.lineCap = 'round'
        for (const [x1, y1, x2, y2, s, d] of frost) {
          const k = Math.max(0, Math.min(1, (grow * 0.75 - s) / 0.25))
          if (!k) continue
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 * thaw})`
          ctx.lineWidth = Math.max(0.5, 1.8 - d * 0.35)
          ctx.shadowColor = 'rgba(159, 216, 255, .9)'
          ctx.shadowBlur = 6
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k); ctx.stroke()
        }
        ctx.shadowBlur = 0
      }

      if (id === 'denia') {
        const T = p * 1.7
        for (let i = 0; i < thr.length; i++) {
          const left = thr[i] - T
          if (left <= 0) continue
          const x = (i % cols) * cell, y = Math.floor(i / cols) * cell
          ctx.fillStyle = left < 0.08 ? `rgba(201, 167, 255, ${0.9 * (1 - p)})` : '#030306'
          ctx.fillRect(x, y, cell + 0.5, cell + 0.5)
        }
        for (const m of motes) {
          m[1] -= m[3] * 1.5
          ctx.fillStyle = `rgba(3, 3, 6, ${0.8 * (1 - p)})`
          ctx.beginPath(); ctx.arc(m[0], m[1], m[2] * (1 + p), 0, Math.PI * 2); ctx.fill()
        }
      }

      if (id === 'aemeath') {
        const img = imgRef.current
        const k = 1 - p
        if (img && img.complete && img.naturalWidth) {
          const { s, ox, oy } = coverMap(img)
          const n = Math.round(6 + 10 * k)
          for (let i = 0; i < n; i++) {
            if (Math.random() > 0.35 + 0.6 * k) continue
            const y = Math.random() * H, h = 2 + Math.random() * 26 * k
            const dx = (Math.random() - 0.5) * 70 * k
            drawCover(img, ox + 0, oy + y / s, W / s, h / s, dx, y, W, h)
          }
        }
        ctx.globalCompositeOperation = 'screen'
        for (let i = 0; i < 5; i++) {
          if (Math.random() > k) continue
          ctx.fillStyle = i % 2 ? `rgba(255, 179, 217, ${0.35 * k})` : `rgba(127, 242, 230, ${0.35 * k})`
          ctx.fillRect(0, Math.random() * H, W, 1 + Math.random() * 3)
        }
        ctx.globalCompositeOperation = 'source-over'
        if (p < 0.12) { ctx.fillStyle = `rgba(3, 3, 6, ${1 - p / 0.12})`; ctx.fillRect(0, 0, W, H) }
      }

      if (p < 1) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [id, run])

  return <canvas ref={cv} className="char-sig" aria-hidden="true" />
}
