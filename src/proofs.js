import { CHARACTERS } from './characters.js'

// Scans that show exactly the quoted line (CN and EN client). Only verified pairs go here.
export const SCANS = {
  Guide_YXQJCZ_7_11: [
    { src: 'scans/illusia-cn.jpg', cap: 'CN · 她並不真實存在，只是門制造出的虛影' },
    { src: 'scans/illusia-en.jpg', cap: 'EN · "she doesn\'t truly exist"' },
  ],
  Event_AYKXBRZM_11_5: [
    { src: 'scans/endless-dreams-cn.jpg', cap: 'CN · 這裡，有無窮無盡的夢湧了進來' },
    { src: 'scans/countless-dreams-en.jpg', cap: 'EN · "Here, countless dreams rush in..."' },
  ],
}

// The 1-B chain on one screen: one main line per step, all of them already on the site.
export const CHAIN = [
  { key: 'Event_AYKXBRZM_61_31', sec: 'structure' },
  { key: 'RogueRes_EventPlot_Des_510022_3', sec: 'sonoro' },
  { key: 'Main_Rinascita_2_12_91_8 · 91_19', sec: 'sonoro' },
  { key: 'Guide_YXQJCZ_7_11', sec: 'fiction' },
  { key: 'InstanceDungeon_8914_Description', sec: 'recursion' },
]

export const PROOF_UI = {
  en: {
    search: 'Search',
    title: 'Search the proofs',
    placeholder: 'A word, a line or a key: Sonoro, 索諾拉, Term850077…',
    empty: 'Nothing found. Try a Chinese word or part of a key.',
    lines: (n) => `${n} ${n === 1 ? 'line' : 'lines'}`,
    hint: 'Enter opens · Esc closes',
    scan: 'Scan',
    record: 'Record',
    chain: {
      menu: 'The chain in five steps',
      short: 'The whole 1-B argument on one screen',
      eyebrow: 'One screen · five lines',
      title: 'The chain',
      lead: 'The whole argument, one line from the game per step. Each step opens its full section.',
      steps: [
        ['The Somnoire is the carrier', 'One place holds every dream on Solaris.'],
        ['Each dream is a Sonoro', 'A world with its own space and time, kept by the Somnoire.'],
        ['A Sonoro unfolds without limit', 'Infinite size, stated outright.'],
        ['To the level above, it is fiction', 'The people inside do not truly exist.'],
        ['And the layers never end', 'Dreams inside dreams, without end.'],
      ],
      result: ['High 1-B', 'Countably infinite layers, each one a full world and recorded fiction for the layer above.'],
      open: 'Open section',
      copy: 'Copy link',
      copied: 'Link copied',
    },
  },
  ru: {
    search: 'Поиск',
    title: 'Поиск по пруфам',
    placeholder: 'Слово, строка или ключ: Соноро, 索諾拉, Term850077…',
    empty: 'Ничего не нашлось. Попробуй китайское слово или часть ключа.',
    lines: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'строка' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'строки' : 'строк'}`,
    hint: 'Enter — открыть · Esc — закрыть',
    scan: 'Скан',
    record: 'Запись',
    chain: {
      menu: 'Цепочка в пять шагов',
      short: 'Весь пруфлайн на 1-B на одном экране',
      eyebrow: 'Один экран · пять строк',
      title: 'Цепочка',
      lead: 'Весь аргумент, по одной строке из игры на шаг. Каждый шаг открывает свой полный раздел.',
      steps: [
        ['Сомнуар — носитель', 'Все сны Соляриса лежат в одном месте.'],
        ['Каждый сон — Соноро', 'Мир со своим пространством и временем, который хранит Сомнуар.'],
        ['Соноро разворачивается без предела', 'Бесконечный размер, сказано прямо.'],
        ['Для уровня выше это вымысел', 'Люди внутри по-настоящему не существуют.'],
        ['И слоям нет конца', 'Сны внутри снов, без конца.'],
      ],
      result: ['1-B', 'Счётно бесконечные слои. Каждый — полноценный мир и записанный вымысел для слоя выше.'],
      open: 'Открыть раздел',
      copy: 'Скопировать ссылку',
      copied: 'Ссылка скопирована',
    },
  },
}

export function findQuote(SECTIONS, key) {
  for (const s of SECTIONS) for (const b of s.blocks) if (b.type === 'quote' && b.key === key) return { ...b, sec: s }
  return null
}

// Every quoted line on the site, in the current language.
export function buildIndex(SECTIONS, lang) {
  const out = []
  for (const s of SECTIONS) {
    for (const b of s.blocks) {
      if (b.type === 'quote') out.push({ cn: b.cn, tr: b.en, key: b.key, ver: b.ver, where: s.title, who: b.who, view: s.id })
      if (b.type === 'objection') out.push({ cn: b.cn, tr: b.q, key: b.key, ver: '', where: s.title, who: '', view: s.id })
    }
  }
  for (const c of CHARACTERS) {
    const push = (q, who) => q && out.push({ cn: q.cn, tr: q[lang], key: q.key, ver: q.ver, where: c.name[lang], who, view: `c-${c.id}` })
    push(c.intro, c.name[lang])
    push(c.lore?.dream, c.name[lang])
    for (const q of c.lore?.quotes || []) push(q, c.name[lang])
    for (const q of c.abilities?.quotes || []) push(q, c.name[lang])
  }
  return out
}
