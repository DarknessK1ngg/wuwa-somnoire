import MarkEdge, { MarkBadge, MarkRule } from './MarkEdge'
import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { usePack } from '../lang'
import { SCANS, PROOF_UI } from '../proofs'

const Corridor = lazy(() => import('./Corridor'))
const ease = [0.2, 0.75, 0.1, 1]
const reveal = {
  initial: { opacity: 0, y: 34, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease },
}

function Key({ k }) {
  const { UI } = usePack()
  const [done, setDone] = useState(false)
  return (
    <button
      className="key"
      title={UI.sec.copy}
      onClick={() => {
        navigator.clipboard?.writeText(k.split(' ·')[0]).then(() => { setDone(true); setTimeout(() => setDone(false), 1200) }, () => {})
      }}
    >
      {done ? UI.sec.copied : k}
    </button>
  )
}

function Quote({ b, open }) {
  const { UI } = usePack()
  const scans = SCANS[b.key]
  return (
    <motion.figure className={`quote ${b.big ? 'quote-big' : ''}`} data-key={b.key} {...reveal}>
      <MarkEdge seed={(b.key || 'x').length} />
      <blockquote className="cn" lang="zh-Hant">{b.cn}</blockquote>
      <figcaption>
        <p className="en">{b.en}</p>
        <div className="meta">
          <span>{b.who}</span>
          <Key k={b.key} />
          <span className="ver">v{b.ver}</span>
          {scans && <button className="scan-btn" onClick={() => open({ items: scans })}>{PROOF_UI[UI.lang].scan} ↗</button>}
        </div>
      </figcaption>
    </motion.figure>
  )
}

function Figs({ items, open }) {
  const { UI } = usePack()
  return (
    <div className={`figs figs-${Math.min(items.length, 2)}`}>
      {items.map((f, i) => (
        <motion.figure key={f.src} className="fig" {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
          <button onClick={() => open(f)} aria-label={UI.sec.open}>
            <motion.img layoutId={f.src} src={f.src} alt={f.cap} loading="lazy" />
          </button>
          <figcaption>{f.cap}</figcaption>
        </motion.figure>
      ))}
    </div>
  )
}

function Ladder() {
  const { UI } = usePack()
  return (
    <div className="ladder">
      {UI.tiers.map(([t, d, mark], i) => (
        <motion.div key={t} className={`rung rung-${mark || 'plain'}`} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
          <b>{t}</b>
          <span>{d}</span>
          {mark === 'yes' && <em>{UI.tierTags.yes}</em>}
          {mark === 'case' && <em>{UI.tierTags.case}</em>}
          {mark === 'no' && <em className="muted">{UI.tierTags.no}</em>}
        </motion.div>
      ))}
    </div>
  )
}

function Nest() {
  const { UI } = usePack()
  const NEST = UI.nest
  const render = (i) => {
    if (i >= NEST.length) {
      return (
        <motion.div className="nest-core" initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, type: 'spring' }}>
          <span className="cn">無窮無盡</span>
          <small>{UI.nestCore}</small>
        </motion.div>
      )
    }
    return (
      <motion.div
        className={`nest nest-${i}`}
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ delay: i * 0.16, duration: 0.7, ease }}
      >
        <div className="nest-label"><b>{NEST[i][0]}</b><span>{NEST[i][1]}</span></div>
        {render(i + 1)}
      </motion.div>
    )
  }
  return <div className="nest-wrap">{render(0)}</div>
}

function Verdict() {
  const cards = usePack().UI.verdict
  return (
    <div className="verdict">
      {cards.map(([t, k, d, m], i) => (
        <motion.div key={t} className={`vcard vcard-${m}`} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }}>
          <MarkEdge seed={i + 3} spikes={2} />
          <span className="vk">{k}</span>
          <b>{t}</b>
          <p>{d}</p>
        </motion.div>
      ))}
    </div>
  )
}

function Steps({ go }) {
  const { UI } = usePack()
  const steps = UI.steps
  const C = PROOF_UI[UI.lang].chain
  return (
    <>
    <ol className="steps">
      {steps.map(([id, t, d], i) => (
        <motion.li key={id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
          <button onClick={() => go(id)}>
            <MarkEdge seed={i + 11} />
            <MarkBadge n={i + 1} />
            <span><b>{t}</b><small>{d}</small></span>
            <span className="arrow">→</span>
          </button>
        </motion.li>
      ))}
    </ol>
    <motion.button className="chain-link" onClick={() => go('chain')} {...reveal}>
      <span>{C.menu}</span><small>{C.short}</small><i>→</i>
    </motion.button>
    </>
  )
}

function Terms() {
  const { TERMS } = usePack()
  return (
    <div className="terms">
      {TERMS.map(([en, cn, d], i) => (
        <motion.div key={en} className="term" {...reveal} transition={{ ...reveal.transition, delay: (i % 4) * 0.05 }}>
          <MarkEdge seed={i + 21} spikes={2} />
          <div className="term-head"><b>{en}</b><span className={cn === 'VSB' || cn === 'АЦФ' ? 'tag' : 'cn'}>{cn}</span></div>
          <p>{d}</p>
        </motion.div>
      ))}
    </div>
  )
}

function Sources() {
  const { UI } = usePack()
  const base = 'https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/a96f6c6e87717d528a340de37374d9fc5a5ba563/Textmaps'
  const href = (u) => (u === 'zh' ? `${base}/zh-Hant/multi_text/MultiText.json` : u === 'en' ? `${base}/en/multi_text/MultiText.json` : u)
  return (
    <motion.div className="sources" {...reveal}>
      <ol className="how">{UI.sources.how.map((t) => <li key={t}>{t}</li>)}</ol>
      <div className="src-links">
        {UI.sources.links.map(([l, u]) => <a key={l} href={href(u)} target="_blank" rel="noreferrer">{l}</a>)}
      </div>
      <p className="small">{UI.sources.note}</p>
    </motion.div>
  )
}

function Remnant() {
  const cls = ['orbit-freq', 'orbit-rem', 'orbit-son'], ns = [4, 4, 0]
  const steps = usePack().UI.remnant.map(([t, cn, p], i) => ({ cls: cls[i], n: ns[i], t, cn, p }))
  return (
    <motion.div className="flowr" {...reveal}>
      {steps.map((s) => (
        <div key={s.t} className="flowr-step">
          <MarkEdge seed={s.t.length + 41} spikes={2} />
          <div className={`orbit ${s.cls}`}>{Array.from({ length: s.n }, (_, i) => <i key={i} />)}</div>
          <b>{s.t} <span className="cn">{s.cn}</span></b>
          <p>{s.p}</p>
        </div>
      ))}
    </motion.div>
  )
}

export default function Section({ id, go, settings }) {
  const { SECTIONS, GALLERY, UI } = usePack()
  const idx = SECTIONS.findIndex((x) => x.id === id)
  const sec = SECTIONS[idx]
  const prev = SECTIONS[idx - 1]
  const next = SECTIONS[idx + 1]
  const [box, setBox] = useState(null)

  const renderBlock = (b, i) => {
    switch (b.type) {
      case 'h': return <motion.h3 key={i} {...reveal}>{b.text}</motion.h3>
      case 'quote': return <Quote key={i} b={b} open={setBox} />
      case 'figs': return <Figs key={i} items={b.items} open={setBox} />
      case 'rule':
        return (
          <motion.aside key={i} className={`rule ${b.tone === 'muted' ? 'rule-muted' : ''}`} {...reveal}>
            <MarkEdge seed={i + 31} spikes={4} />
            <b>{b.title}</b>
            <p>{b.text}</p>
            {b.link && <a href={b.link[1]} target="_blank" rel="noreferrer">{b.link[0]} ↗</a>}
          </motion.aside>
        )
      case 'objection':
        return (
          <motion.div key={i} className="objection" data-key={b.key} {...reveal}>
            <MarkEdge seed={i + 61} spikes={4} />
            <p className="obj-q">“{b.q}”</p>
            <p className="cn obj-cn" lang="zh-Hant">{b.cn} <Key k={b.key} /></p>
            <p>{b.a}</p>
          </motion.div>
        )
      case 'remnant': return <Remnant key={i} />
      case 'ladder': return <Ladder key={i} />
      case 'nest': return <Nest key={i} />
      case 'verdict': return <Verdict key={i} />
      case 'steps': return <Steps key={i} go={go} />
      case 'terms': return <Terms key={i} />
      case 'gallery': return <Figs key={i} items={GALLERY} open={setBox} />
      case 'sources': return <Sources key={i} />
      case 'corridor':
        return (
          <motion.div key={i} {...reveal}>
            <Suspense fallback={<div className="corridor" />}>
              <Corridor color={settings.s.accent} moving={settings.s.motion} caption={UI.corridor} />
            </Suspense>
          </motion.div>
        )
      default: return null
    }
  }

  return (
    <motion.article
      className="section"
      key={id}
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
      transition={{ duration: 0.7, ease }}
    >
      <header className="sec-head">
        <button className="crumb" onClick={() => go('map')}>{UI.sec.map}</button>
        <span className="sec-group">{sec.group}</span>
        <motion.span className="sec-num" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>{sec.num}</motion.span>
        <h2 className="sec-title">
          {sec.title.split(' ').map((w, i) => (
            <motion.span key={i} initial={{ opacity: 0, y: '0.5em', filter: 'blur(10px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: 0.15 + i * 0.08, duration: 0.8, ease }}>
              {w}
            </motion.span>
          ))}
        </h2>
        <motion.p className="sec-lead" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>{sec.lead}</motion.p>
        <motion.div className="mk-rule-wrap" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.6, duration: 1.2, ease }}><MarkRule seed={sec.num.length + Number(sec.num) * 3} /></motion.div>
      </header>

      <div className="sec-body">{sec.blocks.map(renderBlock)}</div>

      <nav className="pager">
        {prev ? <button onClick={() => go(prev.id)}><MarkEdge seed={51} /><small>{UI.sec.prev}</small>{prev.title}</button> : <span />}
        {next ? <button className="next" onClick={() => go(next.id)}><MarkEdge seed={52} /><small>{UI.sec.next}</small>{next.title}</button> : <button className="next" onClick={() => go('map')}><MarkEdge seed={53} /><small>{UI.sec.done}</small>{UI.sec.back}</button>}
      </nav>

      <AnimatePresence>
        {box && (
          <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBox(null)}>
            {box.items ? (
              <div className="lb-pair">
                {box.items.map((f) => <figure key={f.src}><img src={f.src} alt={f.cap} /><figcaption>{f.cap}</figcaption></figure>)}
              </div>
            ) : (
              <>
                <motion.img layoutId={box.src} src={box.src} alt={box.cap} />
                <p>{box.cap}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
