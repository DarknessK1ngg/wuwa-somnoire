import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CHARACTERS, INNER_UI } from '../characters'
import { usePack } from '../lang'
import MarkEdge, { MarkBadge, MarkRule } from './MarkEdge'
import Signature from './Signature'

const ease = [0.2, 0.75, 0.1, 1]
const GL = '01ABCDEF夢境層索諾拉回音頻率虛質'

// Text that resolves from random glyphs, like a record being decoded.
function Scramble({ text, delay = 0, speed = 28 }) {
  const [out, setOut] = useState('')
  useEffect(() => {
    let raf
    const t0 = performance.now() + delay
    const total = text.length * speed
    const tick = (now) => {
      const t = now - t0
      if (t < 0) { raf = requestAnimationFrame(tick); return }
      const done = Math.min(text.length, Math.floor(t / speed))
      if (done >= text.length) { setOut(text); return }
      setOut(text.slice(0, done) + [...text.slice(done, done + 6)].map((c) => (c === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0])).join(''))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // never leave the text scrambled, even if frames stall
    const safety = setTimeout(() => setOut(text), delay + total + 400)
    return () => { cancelAnimationFrame(raf); clearTimeout(safety) }
  }, [text])
  return <span className="scramble">{out || '\u00a0'}</span>
}

function Key({ k, copy, copied }) {
  const [done, setDone] = useState(false)
  return (
    <button
      className="key"
      title={copy}
      onClick={() => navigator.clipboard?.writeText(k.split(' ·')[0]).then(() => { setDone(true); setTimeout(() => setDone(false), 1200) }, () => {})}
    >
      {done ? copied : k}
    </button>
  )
}

const reveal = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.7, ease },
}

function Q({ q, lang, UI }) {
  return (
    <motion.figure className="quote cq" {...reveal}>
      <MarkEdge seed={q.key.length + 5} />
      <blockquote className="cn" lang="zh-Hant">{q.cn.replace(/\\n/g, '\n')}</blockquote>
      <figcaption>
        <p className="en">{q[lang]}</p>
        <div className="meta">
          <Key k={q.key} copy={UI.sec.copy} copied={UI.sec.copied} />
          <span className="ver">v{q.ver}</span>
        </div>
      </figcaption>
    </motion.figure>
  )
}

export default function CharacterView({ id, back, openChar }) {
  const { UI } = usePack()
  const lang = UI.lang
  const IU = INNER_UI[lang]
  const idx = CHARACTERS.findIndex((c) => c.id === id)
  const ch = CHARACTERS[idx]
  const [tab, setTab] = useState('lore')
  const [art, setArt] = useState(0)
  const tilt = useRef()
  const imgRef = useRef()

  useEffect(() => { setTab('lore'); setArt(0) }, [id])

  const onMove = (e) => {
    const el = tilt.current
    if (!el || document.documentElement.dataset.motion === 'off') return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `rotateY(${(x * 10).toFixed(2)}deg) rotateX(${(-y * 8).toFixed(2)}deg)`
  }
  const prev = CHARACTERS[(idx + CHARACTERS.length - 1) % CHARACTERS.length]
  const next = CHARACTERS[(idx + 1) % CHARACTERS.length]

  return (
    <motion.article
      className="char"
      style={{ '--hue': ch.hue }}
      initial={{ opacity: 0, scale: 1.06, filter: 'blur(12px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease }}
    >
      <div className="char-grid">
        <div className="char-art" onPointerMove={onMove} onPointerLeave={() => { if (tilt.current) tilt.current.style.transform = '' }}>
          <div className="char-art-sticky">
            <div className="char-tilt" ref={tilt}>
              <span className="char-halo" aria-hidden="true" />
              <span className="char-rings" aria-hidden="true"><i /><i /><i /></span>
              <AnimatePresence mode="wait">
                <motion.img
                  ref={imgRef}
                  key={ch.art[art]}
                  src={ch.art[art]}
                  alt={ch.name[lang]}
                  className="char-img"
                  initial={{ opacity: 0, scale: 1.08, filter: 'blur(10px) brightness(1.8)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px) brightness(1)' }}
                  exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                  transition={{ duration: 0.6, ease }}
                />
              </AnimatePresence>
              <Signature id={ch.id} imgRef={imgRef} run={ch.art[art]} />
              <span className="char-scan" aria-hidden="true" />
            </div>
            <div className="char-thumbs">
              {ch.art.map((a, i) => (
                <button key={a} className={i === art ? 'on' : ''} onClick={() => setArt(i)} aria-label={`${ch.name[lang]} ${i + 1}`}>
                  <img src={a} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <p className="char-credit">{IU.art}</p>
          </div>
        </div>

        <div className="char-body">
          <div className="char-crumbs">
            <button className="crumb" onClick={(e) => back(e.clientX, e.clientY)}>{IU.back}</button>
            <span className="sec-group">{ch.pos[lang]} · {ch.from[lang]}</span>
          </div>
          <h2 className="char-name">
            <span className="char-cn" lang="zh-Hant">{ch.cn}</span>
            <Scramble text={ch.name[lang]} delay={250} speed={70} />
          </h2>
          <p className="char-title"><Scramble text={ch.title[lang]} delay={600} speed={22} /></p>
          <motion.div className="mk-rule-wrap" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 1.1, ease }}>
            <MarkRule seed={idx * 5 + 9} />
          </motion.div>
          <motion.blockquote className="char-intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}>
            <span className="cn" lang="zh-Hant">{ch.intro.cn}</span>
            <span className="char-intro-tr">{ch.intro[lang]}</span>
            <span className="meta"><Key k={ch.intro.key} copy={UI.sec.copy} copied={UI.sec.copied} /><span className="ver">v{ch.intro.ver}</span></span>
          </motion.blockquote>

          <div className="char-tabs" role="tablist">
            {Object.entries(IU.tabs).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
                {tab === k && <motion.span layoutId="chartab" className="char-tabline" />}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="char-panel"
              initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease }}
            >
              {tab === 'lore' && (
                <>
                  {ch.lore[lang].map((p, i) => (
                    <motion.p key={i} className="char-p" {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>{p}</motion.p>
                  ))}
                  <motion.aside className="rule dreamtie" {...reveal}>
                    <MarkEdge seed={idx + 91} spikes={4} />
                    <b>{IU.dream}</b>
                    <p>{ch.lore.dream[lang]}</p>
                    <p className="cn" lang="zh-Hant">{ch.lore.dream.cn}</p>
                    <span className="meta"><Key k={ch.lore.dream.key} copy={UI.sec.copy} copied={UI.sec.copied} /><span className="ver">v{ch.lore.dream.ver}</span></span>
                  </motion.aside>
                  <h3 className="char-h">{IU.quotes}</h3>
                  {ch.lore.quotes.map((q) => <Q key={q.key + q.cn.length} q={q} lang={lang} UI={UI} />)}
                </>
              )}
              {tab === 'abilities' && (
                <>
                  <ol className="abil">
                    {ch.abilities[lang].map(([t, d], i) => (
                      <motion.li key={t} {...reveal} transition={{ ...reveal.transition, delay: i * 0.05 }}>
                        <MarkEdge seed={i + 101} spikes={3} />
                        <MarkBadge n={i + 1} />
                        <div><b>{t}</b><p>{d}</p></div>
                      </motion.li>
                    ))}
                  </ol>
                  <h3 className="char-h">{IU.quotes}</h3>
                  {ch.abilities.quotes.map((q) => <Q key={q.key + q.cn.length} q={q} lang={lang} UI={UI} />)}
                </>
              )}
              {tab === 'likes' && (
                <div className="likes">
                  {ch.likes.map((l, i) => (
                    <motion.div key={l.key + i} className="term like" {...reveal} transition={{ ...reveal.transition, delay: (i % 2) * 0.06 }}>
                      <MarkEdge seed={i + 121} spikes={2} />
                      <b>{l[lang][0]}</b>
                      <p>{l[lang][1]}</p>
                      <span className="meta"><Key k={l.key} copy={UI.sec.copy} copied={UI.sec.copied} /><span className="ver">v{l.ver}</span></span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <nav className="pager">
            <button onClick={(e) => openChar(prev.id, e.clientX, e.clientY)}><MarkEdge seed={131} /><small>{prev.pos[lang]}</small>{prev.name[lang]}</button>
            <button className="next" onClick={(e) => openChar(next.id, e.clientX, e.clientY)}><MarkEdge seed={132} /><small>{next.pos[lang]}</small>{next.name[lang]}</button>
          </nav>
        </div>
      </div>
    </motion.article>
  )
}
