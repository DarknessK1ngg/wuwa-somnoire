import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { usePack } from '../lang'
import { buildIndex, PROOF_UI } from '../proofs'

const norm = (s) => (s || '').toLowerCase().replace(/[«»"“”„'’]/g, '').replace(/ё/g, 'е')

export function SearchButton({ onClick }) {
  const { UI } = usePack()
  return (
    <button className="sr-btn" onClick={onClick} aria-label={PROOF_UI[UI.lang].title}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
      </svg>
      <span>{PROOF_UI[UI.lang].search}</span>
      <kbd>⌘K</kbd>
    </button>
  )
}

export default function Search({ close, go }) {
  const { SECTIONS, UI } = usePack()
  const P = PROOF_UI[UI.lang]
  const index = useMemo(() => buildIndex(SECTIONS, UI.lang), [SECTIONS, UI.lang])
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef()
  const list = useRef()

  const hits = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    if (!words.length) return index
    return index.filter((x) => {
      const hay = norm(`${x.cn} ${x.tr} ${x.key} ${x.where} ${x.who}`)
      return words.every((w) => hay.includes(w))
    })
  }, [q, index])

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => { setSel(0) }, [q])
  useEffect(() => {
    list.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  const open = (h) => {
    close()
    go(h.view)
    // land on the exact line once the page has rendered
    setTimeout(() => {
      const el = document.querySelector(`[data-key="${CSS.escape(h.key)}"]`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash')
    }, 950)
  }

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
    if (e.key === 'Enter' && hits[sel]) open(hits[sel])
    if (e.key === 'Escape') close()
  }

  const mark = (text) => {
    const w = norm(q).split(/\s+/).filter(Boolean)[0]
    if (!w || !text) return text
    const i = norm(text).indexOf(w)
    if (i < 0) return text
    return <>{text.slice(0, i)}<mark>{text.slice(i, i + w.length)}</mark>{text.slice(i + w.length)}</>
  }

  return (
    <motion.div className="sr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div className="sr-panel" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.75, 0.1, 1] }}>
        <p className="sr-eyebrow">{P.title} · {P.lines(hits.length)}</p>
        <input ref={input} className="sr-input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} placeholder={P.placeholder} spellCheck={false} aria-label={P.title} />
        <div className="sr-list" ref={list}>
          {hits.length === 0 && <p className="sr-empty">{P.empty}</p>}
          {hits.map((h, i) => (
            <button key={h.key + h.view + i} data-i={i} className={`sr-row ${i === sel ? 'on' : ''}`} onMouseEnter={() => setSel(i)} onClick={() => open(h)}>
              <span className="sr-cn" lang="zh-Hant">{mark(h.cn)}</span>
              <span className="sr-tr">{mark(h.tr)}</span>
              <span className="sr-meta"><b>{h.where}</b><code>{mark(h.key)}</code>{h.ver && <span>v{h.ver}</span>}</span>
            </button>
          ))}
        </div>
        <p className="sr-hint">{P.hint}</p>
      </motion.div>
    </motion.div>
  )
}
