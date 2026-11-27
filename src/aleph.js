// Aleph-1 (阿列夫一): the page below Chaos.
// Chinese is the game text (zh-Hant); `en` is the official English line; `ru` is our translation from the Chinese.
// `act` says which of the three forms the line is shown with (0 shell, 1 eye, 2 void, 3 the multiverse round it).
// Versions: the first patch whose files carry the line.
export const ALEPH_NAME = {
  key: 'Speaker_250112_Name', ver: '3.3', cn: '阿列夫一（宇宙的回聲）',
  en: 'Aleph-1 (Voice of the Cosmos)', ru: 'Алеф-1 (Эхо вселенной)',
}

export const ALEPH_LINES = [
  {
    act: 0, key: 'MAIN_YHX_14_27', ver: '3.1',
    who: { en: 'Main quest · Lahai-Roi', ru: 'Основной сюжет · Лахай-Рой' },
    cn: '鳴式阿列夫一是不屬於索拉里斯的鳴式。',
    en: '"Aleph-1 is a Threnodian alien to Solaris."',
    ru: '«Алеф-1 — тренодиан, который не принадлежит Солярису».',
  },
  {
    act: 0, key: 'MAIN_YHX_55_31', ver: '3.1',
    who: { en: 'Main quest · Lahai-Roi', ru: 'Основной сюжет · Лахай-Рой' },
    cn: '拉海洛的鳴式力量，不過是它本體微不足道的一小部分。',
    en: '"The Threnodian\'s presence in Lahai-Roi is only a sliver of its true self."',
    ru: '«Сила тренодиана в Лахай-Рое — лишь ничтожная часть его настоящего тела».',
  },
  {
    act: 0, key: 'MAIN_YHX_106_20', ver: '3.1',
    who: { en: 'Main quest · Lahai-Roi', ru: 'Основной сюжет · Лахай-Рой' },
    cn: '阿列夫一飢餓太久，哪怕飲盡星海，也無法止住它的飢火。',
    en: '"Its hunger had festered for so long that not even devouring the entire universe could sate it now."',
    ru: '«Алеф-1 голодал так долго, что даже выпив всё звёздное море, не утолил бы голода».',
  },
  {
    act: 1, key: 'FavorStory_121004_Content', ver: '3.1',
    who: { en: "Aemeath's story", ru: 'История Эмит' },
    cn: '她看著那隻巨大的，超越了時間與空間的眼睛',
    en: '"…that impossibly vast eye that transcended space and time."',
    ru: '«…тот огромный глаз, превзошедший время и пространство».',
  },
  {
    act: 1, key: 'FavorStory_121004_Content', ver: '3.1',
    who: { en: "Aemeath's story", ru: 'История Эмит' },
    cn: '被其吞噬和籠罩的東西失去存在……對於處在比之更低維度的生物而言，總要有個稱呼。',
    en: '"Whatever it engulfed simply ceased to be… Beings of a lower dimension needed a term for it."',
    ru: '«То, что оно поглощает и накрывает, теряет существование… Существам более низкой размерности нужно хоть как-то его назвать».',
  },
  {
    act: 1, key: 'MonsterInfo_340000270_DiscoveredDes', ver: '3.3',
    who: { en: 'Enemy file', ru: 'Описание врага' },
    cn: '阿列夫一投影出了「可知」的閾限',
    en: '"Aleph-1 projects the very boundary of the knowable."',
    ru: '«Алеф-1 проецирует сам порог „познаваемого“».',
  },
  {
    act: 2, key: 'MAIN_YHX_55_20', ver: '3.1',
    who: { en: 'Main quest · Lahai-Roi', ru: 'Основной сюжет · Лахай-Рой' },
    cn: '吞噬存在的鳴式阿列夫一所具有的特性是「虛無」，是萬物的消解。',
    en: '"Threnodian Aleph-1, the Devourer of Existence, is the embodiment of voidance. The dissolution of all things."',
    ru: '«Особенность Алефа-1, пожирателя существования, — „небытие“, растворение всего сущего».',
  },
  {
    act: 2, key: 'MAIN_YHX_55_21', ver: '3.1',
    who: { en: 'Main quest · Lahai-Roi', ru: 'Основной сюжет · Лахай-Рой' },
    cn: '而它真正的姿態，類似……黑洞。',
    en: '"Its true form is like… a black hole."',
    ru: '«А его истинный облик похож на… чёрную дыру».',
  },
  {
    act: 2, key: 'LoadingTipsText_610301_TipsText', ver: '3.3',
    who: { en: 'Loading tip', ru: 'Подсказка загрузки' },
    cn: '祂吞噬一切。所有思緒、情感、希望，終為塵埃，終無意義。祂是「虛無」。',
    en: '"It devours everything. Thought, feeling, hope, all reduced to dust and nothingness. It is the Void."',
    ru: '«Он пожирает всё. Все мысли, чувства, надежды в конце концов становятся пылью и теряют смысл. Он — „небытие“».',
  },
  {
    act: 2, key: 'Term750040_Desc', ver: '3.1',
    who: { en: 'Glossary · Voidspace', ru: 'Термин · Пространство пустоты' },
    cn: '高濃度虛質深處的高維空間，位於阿列夫一的「內部」……最終存在將歸於虛無。',
    en: '"A high-dimensional domain… existing \'inside\' Aleph-1… eventually leading to the total dissolution of their existence."',
    ru: '«Пространство высокой размерности „внутри“ Алефа-1… в конце концов существование обращается в небытие».',
  },
  {
    act: 3, key: 'FavorGoods_121103_Content', ver: '3.3',
    who: { en: 'Item · Denia', ru: 'Предмет · Дания' },
    cn: '在祂的尺度上，生命與希望都微不足道、毫無意義。',
    en: '"Life and hope are insignificant noises for it. Meaningless."',
    ru: '«В Его масштабе жизнь и надежда ничтожны и бессмысленны».',
  },
  {
    act: 3, key: 'FavorGoods_121103_Content', ver: '3.3',
    who: { en: 'Item · Denia', ru: 'Предмет · Дания' },
    cn: '那是來自一整片宇宙殘骸的，早在萬億年前就死去的光。',
    en: '"Those are lights from a cosmic graveyard. Starlight that faded trillions of years ago."',
    ru: '«Это свет от останков целой вселенной, умерший триллионы лет назад».',
  },
  {
    act: 3, key: 'Main_LahaiRoi_ZRJDYKX_90_9', ver: '3.3',
    who: { en: 'Main quest · said to Denia', ru: 'Основной сюжет · сказано Дании' },
    cn: '一切都自虛無中誕生',
    en: '"Everything begins in the void."',
    ru: '«Всё рождается из небытия».',
  },
]

export const ALEPH_TXT = {
  en: {
    eyebrow: 'Below Chaos', title: ['Aleph-1', '阿列夫一'], hint: 'Three forms, one void. Keep scrolling',
    acts: [
      { n: 'I', name: 'The shell', cn: '鳴式', line: 'What Solaris sees is a sliver of the body.' },
      { n: 'II', name: 'The eye', cn: '眼睛', line: 'An eye beyond time and space.' },
      { n: 'III', name: 'The void', cn: '虛無', line: 'The true form: a black hole.' },
      { n: 'IV', name: 'Inside the multiverse', cn: '宇宙', line: 'Every universe, and the void among them.' },
    ],
    tierEyebrow: 'Claim', tier: '1-A',
    lead: 'Everything begins in the void, and to the void everything is nothing. Aleph-1 is that void.',
    points: [
      { t: 'The void comes first', x: '"Everything begins in the void" (90_9). Universes, dreams, Sonoro, the waking world above them, every concept: all that exists comes out of nothingness. Nothingness is not one more step of creation. It is what creation comes out of.' },
      { t: 'Aleph-1 is the void', x: 'Its nature is "voidance, the dissolution of all things" (55_20), and that was checked first-hand (55_22). "It devours everything… It is the Void" (610301). Whatever it covers ceases to be (121004), and inside it existence dissolves into nothing (750040).' },
      { t: 'Above by existence, not by rank', x: 'To Aleph-1 the whole structure, every dream layer (High 1-B) and the waking world over them (Low 1-A), is equally meaningless (121103). Beings "of a lower dimension" can only give it a name (121004). That is not one more step on the hierarchy: it is nothingness standing over everything that exists. Hence 1-A.' },
    ],
    note: 'The conclusion is our reading. Every quote above carries its key and version.',
    back: 'Up to the tree', up: 'Up to the map',
  },
  ru: {
    eyebrow: 'Ниже Хаоса', title: ['Алеф-1', '阿列夫一'], hint: 'Три облика, одно небытие. Листай вниз',
    acts: [
      { n: 'I', name: 'Оболочка', cn: '鳴式', line: 'То, что видит Солярис, — ничтожная часть тела.' },
      { n: 'II', name: 'Глаз', cn: '眼睛', line: 'Глаз вне времени и пространства.' },
      { n: 'III', name: 'Небытие', cn: '虛無', line: 'Истинный облик — чёрная дыра.' },
      { n: 'IV', name: 'Внутри мультивселенной', cn: '宇宙', line: 'Все вселенные — и небытие среди них.' },
    ],
    tierEyebrow: 'Заявка', tier: '1-A',
    lead: 'Всё рождается из небытия, и для небытия всё — ничто. Алеф-1 и есть это небытие.',
    points: [
      { t: 'Небытие — раньше всего', x: '«Всё рождается из небытия» (90_9). Вселенные, сны, Соноро, реальность над ними, любые понятия — всё сущее выходит из небытия. Небытие — не ещё одна ступень мироздания, а то, из чего мироздание появляется.' },
      { t: 'Алеф-1 — это небытие', x: 'Его особенность — «небытие, растворение всего сущего» (55_20), и это проверено на себе (55_22). «Он пожирает всё… Он — небытие» (610301). То, что он накрывает, теряет существование (121004), а внутри него существование обращается в ничто (750040).' },
      { t: 'Выше не по ступени, а по бытию', x: 'Для Алефа-1 вся структура — каждый слой снов (1-B) и реальность над ними (Низкий 1-A) — одинаково ничтожна: «в Его масштабе жизнь и надежда бессмысленны» (121103). Существа «более низкой размерности» могут лишь дать ему имя (121004). Это не ещё одна ступень над иерархией, а превосходство небытия над всем, что существует, — экзистенциальное. Отсюда 1-A.' },
    ],
    note: 'Вывод — наше прочтение. Каждая цитата выше дана с ключом и версией.',
    back: 'Наверх, к дереву', up: 'Наверх, к карте',
  },
}
