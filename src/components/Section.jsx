import { lazy, Suspense, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { SECTIONS, TERMS, GALLERY } from '../content'

const Corridor = lazy(() => import('./Corridor'))
const ease = [0.2, 0.75, 0.1, 1]
const reveal = {
  initial: { opacity: 0, y: 34, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.8, ease },
}

function Key({ k }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="key"
      title="Copy key"
      onClick={() => {
        navigator.clipboard?.writeText(k.split(' ·')[0]).then(() => { setDone(true); setTimeout(() => setDone(false), 1200) }, () => {})
      }}
    >
      {done ? 'copied' : k}
    </button>
  )
}

function Quote({ b }) {
  return (
    <motion.figure className={`quote ${b.big ? 'quote-big' : ''}`} {...reveal}>
      <blockquote className="cn" lang="zh-Hant">{b.cn}</blockquote>
      <figcaption>
        <p className="en">{b.en}</p>
        <div className="meta">
          <span>{b.who}</span>
          <Key k={b.key} />
          <span className="ver">v{b.ver}</span>
        </div>
      </figcaption>
    </motion.figure>
  )
}

function Figs({ items, open }) {
  return (
    <div className={`figs figs-${Math.min(items.length, 2)}`}>
      {items.map((f, i) => (
        <motion.figure key={f.src} className="fig" {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
          <button onClick={() => open(f)} aria-label="Open full size">
            <motion.img layoutId={f.src} src={f.src} alt={f.cap} loading="lazy" />
          </button>
          <figcaption>{f.cap}</figcaption>
        </motion.figure>
      ))}
    </div>
  )
}

const TIERS = [
  ['1-A', 'Exceeds Low 1-A as far as Low 1-A exceeds High 1-B', 'no'],
  ['Low 1-A', 'Above a High 1-B hierarchy as a whole', 'case'],
  ['High 1-B', 'Countably infinite qualitative steps above a universe', 'yes'],
  ['1-B', '8 to any finite number of levels of infinity (R^12+)', ''],
  ['1-C', '3 to 7 levels of infinity (R^7 to R^11)', ''],
  ['Low 1-C', '1 to 2 levels of infinity (R^5 to R^6)', ''],
  ['Universe', 'The baseline: one standard universe', ''],
]

function Ladder() {
  return (
    <div className="ladder">
      {TIERS.map(([t, d, mark], i) => (
        <motion.div key={t} className={`rung rung-${mark || 'plain'}`} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
          <b>{t}</b>
          <span>{d}</span>
          {mark === 'yes' && <em>dream hierarchy</em>}
          {mark === 'case' && <em>waking reality</em>}
          {mark === 'no' && <em className="muted">not claimed</em>}
        </motion.div>
      ))}
    </div>
  )
}

const NEST = [
  ['Waking reality', 'Solaris. Real people, real bodies.'],
  ['Door → the Somnoire', 'The medium that stores every dream. 載體.'],
  ['A dream', 'A Sonoro, with its own space and time.'],
  ['A dreamer inside it', 'Their dream becomes a new Sonoro.'],
  ['…and again', 'Every layer has dreamers of its own.'],
]

function Nest() {
  const render = (i) => {
    if (i >= NEST.length) {
      return (
        <motion.div className="nest-core" initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.9, type: 'spring' }}>
          <span className="cn">無窮無盡</span>
          <small>without end</small>
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
  const cards = [
    ['High 1-B', 'The dream hierarchy', 'Countably infinite layers. Each one a full universe and recorded fiction for the layer above.', 'yes'],
    ['Low 1-A', 'Waking reality', 'Above the whole hierarchy at once. Every layer is stored dream data to it.', 'case'],
    ['1-A', 'Not claimed', 'Would need a line showing reality itself as fiction to something higher.', 'no'],
  ]
  return (
    <div className="verdict">
      {cards.map(([t, k, d, m], i) => (
        <motion.div key={t} className={`vcard vcard-${m}`} {...reveal} transition={{ ...reveal.transition, delay: i * 0.12 }}>
          <span className="vk">{k}</span>
          <b>{t}</b>
          <p>{d}</p>
        </motion.div>
      ))}
    </div>
  )
}

function Steps({ go }) {
  const steps = [
    ['sonoro', 'A Sonoro is a universe', 'Its own space, its own time, and it unfolds without limit.'],
    ['fiction', 'Dreams are fiction', 'The Somnoire records, backs up and replays them. Their people "do not truly exist".'],
    ['recursion', 'The layers never end', 'Dreamers inside dreams make new Sonoro. 層層夢境無窮無盡.'],
    ['low1a', 'Reality sits above it all', 'One medium holds every layer. To the waking world it is all record.'],
  ]
  return (
    <ol className="steps">
      {steps.map(([id, t, d], i) => (
        <motion.li key={id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.08 }}>
          <button onClick={() => go(id)}>
            <span className="step-n">{i + 1}</span>
            <span><b>{t}</b><small>{d}</small></span>
            <span className="arrow">→</span>
          </button>
        </motion.li>
      ))}
    </ol>
  )
}

function Terms() {
  return (
    <div className="terms">
      {TERMS.map(([en, cn, d], i) => (
        <motion.div key={en} className="term" {...reveal} transition={{ ...reveal.transition, delay: (i % 4) * 0.05 }}>
          <div className="term-head"><b>{en}</b><span className={cn === 'VSB' ? 'tag' : 'cn'}>{cn}</span></div>
          <p>{d}</p>
        </motion.div>
      ))}
    </div>
  )
}

function Sources() {
  const base = 'https://raw.githubusercontent.com/Arikatsu/WutheringWaves_Data/a96f6c6e87717d528a340de37374d9fc5a5ba563/Textmaps'
  return (
    <motion.div className="sources" {...reveal}>
      <ol className="how">
        <li>Copy a key from under any quote. Click it and it copies.</li>
        <li>Open the Chinese or English text file below. It is about 50 MB, give it a moment.</li>
        <li>Press Ctrl+F and paste the key. The line under it is the in-game text.</li>
      </ol>
      <div className="src-links">
        <a href={`${base}/zh-Hant/multi_text/MultiText.json`} target="_blank" rel="noreferrer">Chinese (Traditional) text · 3.8</a>
        <a href={`${base}/en/multi_text/MultiText.json`} target="_blank" rel="noreferrer">English text · 3.8</a>
        <a href="https://github.com/Arikatsu/WutheringWaves_Data" target="_blank" rel="noreferrer">WutheringWaves_Data on GitHub</a>
        <a href="https://vsbattles.fandom.com/wiki/Tiering_System" target="_blank" rel="noreferrer">VSB · Tiering System</a>
        <a href="https://vsbattles.fandom.com/wiki/Reality-Fiction_Transcendence" target="_blank" rel="noreferrer">VSB · Reality-Fiction Transcendence</a>
      </div>
      <p className="small">Version numbers mark the first game version whose files contain the key. Screenshots are in-game captures.</p>
    </motion.div>
  )
}


function Remnant() {
  const steps = [
    { cls: 'orbit-freq', n: 4, t: 'Record', cn: '記錄', p: 'Remnant energy records events across space and time.' },
    { cls: 'orbit-rem', n: 4, t: 'Remnant energy', cn: '回音能量', p: 'Pure, complete frequency energy whose information stays stable beyond space and time.' },
    { cls: 'orbit-son', n: 0, t: 'Sonoro', cn: '索諾拉', p: 'Where it gathers densely, a supernatural region forms. Scholars call it Sonoro.' },
  ]
  return (
    <motion.div className="flowr" {...reveal}>
      {steps.map((s) => (
        <div key={s.t} className="flowr-step">
          <div className={`orbit ${s.cls}`}>{Array.from({ length: s.n }, (_, i) => <i key={i} />)}</div>
          <b>{s.t} <span className="cn">{s.cn}</span></b>
          <p>{s.p}</p>
        </div>
      ))}
    </motion.div>
  )
}

export default function Section({ id, go, settings }) {
  const idx = SECTIONS.findIndex((x) => x.id === id)
  const sec = SECTIONS[idx]
  const prev = SECTIONS[idx - 1]
  const next = SECTIONS[idx + 1]
  const [box, setBox] = useState(null)

  const renderBlock = (b, i) => {
    switch (b.type) {
      case 'h': return <motion.h3 key={i} {...reveal}>{b.text}</motion.h3>
      case 'quote': return <Quote key={i} b={b} />
      case 'figs': return <Figs key={i} items={b.items} open={setBox} />
      case 'rule':
        return (
          <motion.aside key={i} className={`rule ${b.tone === 'muted' ? 'rule-muted' : ''}`} {...reveal}>
            <b>{b.title}</b>
            <p>{b.text}</p>
            {b.link && <a href={b.link[1]} target="_blank" rel="noreferrer">{b.link[0]} ↗</a>}
          </motion.aside>
        )
      case 'objection':
        return (
          <motion.div key={i} className="objection" {...reveal}>
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
              <Corridor color={settings.s.accent} moving={settings.s.motion} />
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
        <button className="crumb" onClick={() => go('map')}>← Map</button>
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
      </header>

      <div className="sec-body">{sec.blocks.map(renderBlock)}</div>

      <nav className="pager">
        {prev ? <button onClick={() => go(prev.id)}><small>Previous</small>{prev.title}</button> : <span />}
        {next ? <button className="next" onClick={() => go(next.id)}><small>Next</small>{next.title}</button> : <button className="next" onClick={() => go('map')}><small>Done</small>Back to the map</button>}
      </nav>

      <AnimatePresence>
        {box && (
          <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBox(null)}>
            <motion.img layoutId={box.src} src={box.src} alt={box.cap} />
            <p>{box.cap}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
