import { useEffect, useState } from 'react'

export const PRESETS = {
  somnoire: { name: 'Somnoire', c1: '#5b2bd6', c2: '#10b9b2', c3: '#14072e', accent: '#7ff2e6', mode: 'dark' },
  lament: { name: 'Lament', c1: '#d6332b', c2: '#ff9e45', c3: '#2a0610', accent: '#ffb27c', mode: 'dark' },
  tethys: { name: 'Tethys', c1: '#1556ff', c2: '#00d2ff', c3: '#020f2b', accent: '#86dcff', mode: 'dark' },
  lily: { name: 'Lily\'s Dream', c1: '#ff5fae', c2: '#8a5cff', c3: '#1a0e33', accent: '#ffc3e3', mode: 'dark' },
  aurora: { name: 'Aurora', c1: '#19d38a', c2: '#3b6cff', c3: '#06131f', accent: '#9bffd2', mode: 'dark' },
  ivory: { name: 'Ivory', c1: '#c9b6ff', c2: '#a6f0ea', c3: '#fff6ec', accent: '#5b2bd6', mode: 'light' },
}

const DEFAULTS = { preset: 'somnoire', ...PRESETS.somnoire, motion: true, grain: true, text: 1 }
const KEY = 'somnoire-site-settings'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
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
    r.setProperty('--text-scale', String(s.text))
    document.documentElement.dataset.mode = s.mode
    document.documentElement.dataset.motion = s.motion ? 'on' : 'off'
  }, [s])
  const update = (patch) => setS((p) => ({ ...p, ...patch }))
  const applyPreset = (id) => setS((p) => ({ ...p, preset: id, ...PRESETS[id] }))
  const reset = () => setS({ ...DEFAULTS })
  return { s, update, applyPreset, reset }
}
