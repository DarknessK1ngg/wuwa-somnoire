import { usePack } from '../lang'

// The site as one world, read top to bottom: where you are on the way down from the surface to Chaos.
const STOPS = [
  { id: 'intro', en: 'Surface', ru: 'Поверхность' },
  { id: 'map', en: 'The Mark', ru: 'Метка' },
  { id: 'verdict', en: 'The dossier', ru: 'Досье', match: (v) => !['intro', 'map', 'inner', 'descent', 'chaos', 'aleph', 'chain'].includes(v) && !v.startsWith('c-') },
  { id: 'inner', en: 'Inner layer', ru: 'Внутренний слой', match: (v) => v === 'inner' || v.startsWith('c-') },
  { id: 'descent', en: 'The descent', ru: 'Спуск' },
  { id: 'chaos', en: 'Chaos', ru: 'Хаос' },
  { id: 'aleph', en: 'Aleph-1', ru: 'Алеф-1' },
]

export default function Depth({ view, go }) {
  const { UI } = usePack()
  const at = Math.max(0, STOPS.findIndex((s) => (s.match ? s.match(view) : s.id === view)))
  if (view === 'intro') return null
  return (
    <nav className="depth" aria-label={UI.lang === 'ru' ? 'Глубина' : 'Depth'}>
      <span className="depth-line" />
      <span className="depth-fill" style={{ height: `${(at / (STOPS.length - 1)) * 100}%` }} />
      {STOPS.map((s, i) => (
        <button key={s.id} className={`depth-stop ${i === at ? 'on' : ''} ${i < at ? 'past' : ''}`} style={{ top: `${(i / (STOPS.length - 1)) * 100}%` }}
          onClick={() => go(s.id)} aria-label={s[UI.lang]} aria-current={i === at ? 'location' : undefined}>
          <i />
          <span>{s[UI.lang]}</span>
        </button>
      ))}
    </nav>
  )
}
