import { useState } from 'react'
import { motion } from 'motion/react'
import { usePack } from '../lang'
import { CHAIN, PROOF_UI, findQuote } from '../proofs'

const ease = [0.2, 0.75, 0.1, 1]

export default function Chain({ go }) {
  const { SECTIONS, UI } = usePack()
  const C = PROOF_UI[UI.lang].chain
  const [copied, setCopied] = useState(false)
  const copy = () => {
    const url = `${location.origin}${location.pathname}#chain`
    navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }, () => {})
  }

  return (
    <motion.article className="chain" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }} transition={{ duration: 0.7, ease }}>
      <header className="chain-head">
        <button className="crumb" onClick={() => go('map')}>{UI.sec.map}</button>
        <p className="sec-group">{C.eyebrow}</p>
        <h2 className="sec-title">{C.title}</h2>
        <p className="sec-lead">{C.lead}</p>
      </header>

      <ol className="chain-list">
        {CHAIN.map((c, i) => {
          const q = findQuote(SECTIONS, c.key)
          if (!q) return null
          const [t, d] = C.steps[i]
          return (
            <motion.li key={c.key} className="chain-step" data-key={c.key}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.8, ease, delay: 0.05 * i }}>
              <span className="chain-n">{String(i + 1).padStart(2, '0')}</span>
              <div className="chain-claim">
                <b>{t}</b>
                <p>{d}</p>
                <button className="chain-open" onClick={() => go(c.sec)}>{C.open} · {q.sec.title} →</button>
              </div>
              <figure className="chain-proof">
                <blockquote className="cn" lang="zh-Hant">{q.cn}</blockquote>
                <figcaption>
                  <p className="en">{q.en}</p>
                  <div className="meta"><span>{q.who}</span><code>{q.key}</code><span className="ver">v{q.ver}</span></div>
                </figcaption>
              </figure>
            </motion.li>
          )
        })}
      </ol>

      <motion.footer className="chain-result" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}>
        <span className="chain-eq">=</span>
        <b>{C.result[0]}</b>
        <p>{C.result[1]}</p>
        <div className="chain-actions">
          <button className="hero-enter" onClick={copy}>{copied ? C.copied : C.copy}</button>
          <button className="crumb" onClick={() => go('verdict')}>{SECTIONS.find((x) => x.id === 'verdict')?.title} →</button>
        </div>
      </motion.footer>
    </motion.article>
  )
}
