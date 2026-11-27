import { useEffect, useState } from 'react'
import { bus } from './bus'

// Colour moods. chrome = the Mark's metal, seam = the light inside the opened Mark, fog = the sky and mist.
// c1..aura are kept for older styles and derive from the same mood.
export const PRESETS = {
  somnoire: { name: 'Somnoire', chrome: '#e6e8f2', seam: '#ffc870', fog: '#7f93c0', c1: '#5b2bd6', c2: '#7f93c0', c3: '#14072e', accent: '#e6e8f2', aura: '#ffc870', mode: 'dark' },
  lament: { name: 'Lament', chrome: '#f3dccd', seam: '#ff7a3d', fog: '#b0623c', c1: '#d6332b', c2: '#b0623c', c3: '#2a0610', accent: '#f3dccd', aura: '#ff7a3d', mode: 'dark' },
  tethys: { name: 'Tethys', chrome: '#d2e9ff', seam: '#58d0ff', fog: '#3a6cc0', c1: '#1556ff', c2: '#3a6cc0', c3: '#020f2b', accent: '#d2e9ff', aura: '#58d0ff', mode: 'dark' },
  lily: { name: "Lily's Dream", chrome: '#f6dff0', seam: '#ff9fd2', fog: '#9a6cc8', c1: '#ff5fae', c2: '#9a6cc8', c3: '#1a0e33', accent: '#f6dff0', aura: '#ff9fd2', mode: 'dark' },
  aurora: { name: 'Aurora', chrome: '#d9f6ea', seam: '#7affc0', fog: '#3a9f86', c1: '#19d38a', c2: '#3a9f86', c3: '#06131f', accent: '#d9f6ea', aura: '#7affc0', mode: 'dark' },
  eclipse: { name: 'Eclipse', chrome: '#8f8f9c', seam: '#ffffff', fog: '#3a3a46', c1: '#444450', c2: '#3a3a46', c3: '#050507', accent: '#cfd0d8', aura: '#ffffff', mode: 'dark' },
}

const DEFAULTS = { preset: 'somnoire', ...PRESETS.somnoire, motion: true, grain: true, text: 1, site: 'vsb' }
const KEY = 'somnoire-site-settings'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw)
      // older saves: unknown presets fall back to Somnoire, known ones get their mood colours
      if (saved.preset !== 'custom' && !PRESETS[saved.preset]) saved.preset = 'somnoire'
      const mood = PRESETS[saved.preset] || {}
      return { ...DEFAULTS, ...saved, ...(saved.preset === 'custom' ? {} : { chrome: mood.chrome, seam: mood.seam, fog: mood.fog, mode: 'dark' }) }
    }
  } catch {}
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  return { ...DEFAULTS, motion: !reduce }
}

export function useSettings() {
  const [s, setS] = useState(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {}
    const r = document.documentElement.style
    r.setProperty('--c1', s.c1)
    r.setProperty('--c2', s.c2)
    r.setProperty('--c3', s.c3)
    r.setProperty('--accent', s.accent)
    r.setProperty('--aura', s.seam || s.aura || '#ffc870')
    r.setProperty('--seam', s.seam || '#ffc870')
    r.setProperty('--chrome', s.chrome || '#e6e8f2')
    r.setProperty('--fog', s.fog || '#7f93c0')
    bus.mood = { chrome: s.chrome || '#e6e8f2', seam: s.seam || '#ffc870', fog: s.fog || '#7f93c0' }
    r.setProperty('--text-scale', String(s.text))
    document.documentElement.dataset.mode = s.mode
    document.documentElement.dataset.motion = s.motion ? 'on' : 'off'
  }, [s])
  const update = (patch) => setS((p) => ({ ...p, ...patch }))
  const applyPreset = (id) => setS((p) => ({ ...p, preset: id, ...PRESETS[id] }))
  const reset = () => setS((p) => ({ ...DEFAULTS, site: p.site }))
  return { s, update, applyPreset, reset }
}
