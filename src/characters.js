// Inner layer: Resonator lore. Every Chinese line is an exact excerpt from the game's
// Traditional Chinese text (data 3.8). ver = first game version whose files contain the key.

const C = (n) => `chars/${n}.jpg`

export const CHARACTERS = [
  {
    id: 'hiyuki',
    cn: '緋雪',
    name: { ru: 'Хиюки', en: 'Hiyuki' },
    title: { ru: 'Последняя мико Пылающей сакуры', en: 'The last Miko of Flaming Sakura' },
    from: { ru: 'Асинохара · Отряд особого реагирования', en: 'Ashinohara · Special Response Force' },
    hue: '#9fd8ff',
    art: [C('hiyuki-1'), C('hiyuki-2'), C('hiyuki-3'), C('hiyuki-4'), C('hiyuki-5')],
    pos: { ru: 'Слой I', en: 'Layer I' },
    intro: {
      cn: '緋雪，最後的灼櫻巫女，若是為了討伐鳴式，我與手中的刀，便都可為你所用。',
      ru: '«Хиюки, последняя мико Пылающей сакуры. Если ты идёшь сразить Плачущих — и я, и мой клинок к твоим услугам».',
      en: '"I am Hiyuki, the last Miko of Flaming Sakura. Should you seek to slay the Threnodians, my blade and I stand at your service."',
      key: 'Role_1108_ShareDesc', ver: '3.3',
    },
    lore: {
      ru: [
        'Сирота из Асинохары. Её семья погибла под снегом во время нападения Плачущего, и девочку подобрала Гёкуро — тогдашняя мико Пылающей сакуры. Больше десяти лет Хиюки ходила за ней по всей Асинохаре и выучила всё, что должна знать мико: бой, обряды, плетение оберегов.',
        'Сила мико держится на «Судзу» — колокольчике на запястье, одной из пяти реликвий, которые оставили Хранители. Судзу берёт силу у будущего, и каждый раз платишь частью собственной жизни. Гёкуро не хотела делать Хиюки преемницей, но та настояла. Вскоре Гёкуро погибла, а Хиюки достался её листок с желанием. Она приняла его: «Больше не будет следующей мико Пылающей сакуры».',
        'С тех пор прошло около века. Её зовут «Вечной мико», её имя есть в учебниках Асинохары, и о ней пишут: сильнейшая из ныне живущих воинов страны. Однажды у неё на глазах исчез целый город — Хонами: Плачущий за долю секунды утянул его в другое пространство.',
        'Чтобы получить клинок, способный разрубить Плачущего, Хиюки заключила сделку с Объединением Дальнего космоса в Лахай-Рое. Она охраняет их экспедиции как последний и единственный член Отряда особого реагирования, а Объединение куёт ей меч.',
      ],
      en: [
        'An orphan from Ashinohara. Her family was buried in snow during a Threnodian attack, and the girl was taken in by Gyokuro, the Miko of Flaming Sakura at the time. For over a decade Hiyuki followed her across Ashinohara and learned every art a miko needs: combat, ceremony, the weaving of charms.',
        'A miko\'s power rests on the Suzu, a bell on the wrist and one of five relics left behind by the Sentinels. The Suzu draws upon the future, and every use costs the bearer part of her own life. Gyokuro refused to name Hiyuki as successor, but Hiyuki insisted. Soon Gyokuro was gone, and Hiyuki inherited her wish slip. She accepted it: "There will never be another Miko of Flaming Sakura."',
        'About a century has passed since. People call her the Miko of Eternal Flaming Sakura, her name is in Ashinohara\'s textbooks, and they describe her as the strongest living warrior in the land. Once she watched a whole city vanish: in a fraction of a second, a Threnodian pulled Honami into another dimension.',
        'To get a blade that can cut down a Threnodian, Hiyuki struck a deal with the Spacetrek Collective in Lahai-Roi. She guards their expeditions as the last and only member of the Special Response Force, and the Collective forges her a sword.',
      ],
      quotes: [
        {
          cn: '……你的願望，我收下了。」\n「……不會再有下一個灼櫻巫女。',
          ru: '«…Твоё желание я принимаю». «…Следующей мико Пылающей сакуры не будет».',
          en: '"...I accept your wish." "...There will never be another Miko of Flaming Sakura."',
          key: 'FavorStory_110802_Content', ver: '3.3',
        },
        {
          cn: '依據葦原的觀測記錄表明，那一瞬，穗波似乎被拉入了另一個空間。',
          ru: '«Согласно наблюдениям Асинохары, в тот миг Хонами, похоже, утянуло в другое пространство».',
          en: '"According to Ashinohara\'s records, Honami had been pulled into another dimension at that moment."',
          key: 'FavorStory_110804_Content', ver: '3.3',
        },
      ],
      dream: {
        ru: 'Хонами, который исчез у неё на глазах, — это тот самый город, чьи погибшие жители теперь «живут» в Соноро в виде эха. Сумика провела в этом Соноро больше 160 дней — подробнее в разделе «Соноро».',
        en: 'Honami, the city that vanished before her eyes, is the same city whose lost citizens now "live" in a Sonoro as echoes. Sumika spent over 160 days in that Sonoro — see the Sonoro section.',
        cn: '曾在悲鳴中逝去的一部分穗波市市民，正以回音的形式「生活」於索諾拉中',
        key: 'Term851065_Desc', ver: '2.8',
      },
    },
    abilities: {
      ru: [
        ['Судзу: заимствовать у будущего', 'Через колокольчик Хиюки видит возможности своего будущего «я» и пользуется ими. Говорить с этими «тенями будущих возможностей» она не может. Учёные Объединения в шутку спросили, не её ли это двойники из параллельных миров, — коллега ответил, что нет: это сила Судзу, которая «в какой-то мере позволяет брать будущее заранее».'],
        ['Миллион будущих', 'Рассказ о падении Хонами называет её той, кто может «призвать миллион будущих в один миг». Она может взять будущее, где идеально исполняет нужную технику, или выбрать до конца одно будущее, чтобы его больше не было: так она навсегда отрезала себе путь стать резонатором Плачущего.'],
        ['Печать из будущих', 'Чтобы закрыть трещину, из которой вырывалась пустотная материя, Хиюки взяла огромное число возможностей своего будущего «я» и оставила их в печати под землёй Лахай-Роя.'],
        ['Лёд', 'Её ледяная сила тоже идёт от Судзу. Одним касанием она покрыла инеем письмо Фрактсидуса и раскрошила печать. Её лёд замедляет разъедание пустотной материей: древнее дерево в Тёмных землях стоит вмёрзшим в лёд, но не съеденным.'],
        ['Белые птицы', 'Бумажные птицы-фамильяры несут её частоту и связаны с её разумом. Мико по всей Асинохаре держат их: раздавишь птицу — Хиюки придёт. Птицы ведут путь даже сквозь пустотную материю.'],
        ['Цена', 'Будущее, у которого можно брать, не бесконечно. Объединение не советует пользоваться силой слишком рьяно: все прежние мико Пылающей сакуры погибли одинаково — бесследно исчезли с поля боя.'],
      ],
      en: [
        ['The Suzu: drawing upon the future', 'Through the bell Hiyuki perceives the possibilities of her future self and puts them to use. She cannot talk to these "shadows of future possibility." Collective staff joked about parallel-universe versions of her; a colleague said no, it is the Suzu\'s power to "draw upon the future."'],
        ['A million futures', 'The story of Honami calls her one "who could draw a million futures to safeguard the present." She can take the future in which she performs a technique perfectly, or use up one future entirely so it can never happen: that is how she cut off her path to becoming a Threnodian\'s Resonator.'],
        ['A seal made of futures', 'To close a rift leaking Voidmatter, Hiyuki took a vast number of her future self\'s possibilities and left them in a seal beneath Lahai-Roi.'],
        ['Ice', 'Her freezing power also comes from the Suzu. With a touch she frosted a Fractsidus letter and shattered its seal. Her ice slows Voidmatter erosion: an ancient tree in the Dimmr Plains stands frozen in ice but not eaten away.'],
        ['White birds', 'Her paper familiars carry her frequency and are linked to her mind. Mikos across Ashinohara keep them: crush the bird and Hiyuki will come. The birds can guide a path even through Voidmatter.'],
        ['The price', 'The futures she can draw upon are not infinite. The Collective advises against using the power aggressively: every previous Miko of Flaming Sakura died the same way, vanishing from the battlefield without a trace.'],
      ],
      quotes: [
        {
          cn: '緋雪本人對「鈴」的描述為：能夠透過它看到未來自身的可能性，並加以利用，但無法做到與「未來可能性的影子」溝通。',
          ru: '«Сама Хиюки описывает „Судзу“ так: через него можно видеть возможности своего будущего „я“ и использовать их, но говорить с „тенями будущих возможностей“ нельзя».',
          en: '"Hiyuki describes the Suzu as follows: It grants the bearer the ability to perceive and utilize \'future possibilities\' of oneself, though it does not allow for direct communication with these \'shadows of future possibility.\'"',
          key: 'FavorRoleInfo_1108_TalentDoc', ver: '3.3',
        },
        {
          cn: '在鳴式面前，單薄一人，即便能預取百萬種未來於此刻，又算得上什麼？',
          ru: '«Что значит перед Плачущим одинокий человек — даже тот, кто может призвать миллион будущих в один миг?»',
          en: '"Against the power of a Threnodian, a single person didn\'t matter—even one who could draw a million futures to safeguard the present."',
          key: 'FavorStory_110804_Content', ver: '3.3',
        },
        {
          cn: '稍等我一陣吧，這封印是藉由「預求身」達成——嗯，你就簡單理解成，我預取了未來自身的大量可能性，留存在此處鎮壓虛質。',
          ru: '«Подожди немного. Эта печать держится на силе „Заём у будущего“ — проще говоря, я взяла у будущего огромное число возможностей себя и оставила их здесь, чтобы сдерживать пустотную материю».',
          en: '"Give me a moment. This seal works through Foreclaiming — put simply, I drew a vast number of my future self\'s possibilities and left them here to suppress the Voidmatter."',
          key: 'Zuoyequnxing_163_1', ver: '3.3',
        },
        {
          cn: '因此，我為你預取了我能最完美使用這個術法的未來。',
          ru: '«Поэтому для тебя я взяла то будущее, в котором владею этой техникой безупречно».',
          en: '"So for you, I drew the future in which I can use this technique perfectly."',
          key: 'Zuoyequnxing_168_9', ver: '3.3',
        },
        {
          cn: '（冰霜似乎在延緩它被虛質侵蝕的速度，這頻率……似乎是緋雪留下的。）',
          ru: '«(Иней будто замедляет то, как его разъедает пустотная материя. Эта частота… похоже, её оставила Хиюки.)»',
          en: '"(The frost seems to slow how fast the Voidmatter erodes it. This frequency... it seems Hiyuki left it.)"',
          key: 'Zuoyequnxing_114_3', ver: '3.3',
        },
      ],
    },
    likes: [
      { ru: ['Вырезает фигурки', 'В свободное время Хиюки уходит в тихий угол и режет фигурки: людей, животных, пейзажи. Говорит, что сложный процесс заставляет сосредоточиться и успокаивает. Недавно её потянуло на механизмы Объединения — студенты видели, как она на ледяной равнине пыталась вырезать Экзостража.'], en: ['Carving', 'In her spare time Hiyuki retreats to a quiet corner and carves figurines: people, animals, landscapes. She says the fiddly process forces focus and calms the mind. Lately she has moved on to the Collective\'s machines; students saw her in the frostlands trying to carve the Exostrider.'], key: 'FavorWord_110806_Content', ver: '3.3' },
      { ru: ['Оригами не даётся', 'Её белые птицы, что кружат над Лахай-Роем, вблизи выглядят трогательно мило. «Профессиональная» птица у неё не выходит никак, хотя она даже подслушивала уроки оригами из-под окна.'], en: ['Origami won\'t cooperate', 'Her white birds circling over Lahai-Roi look endearingly cute up close. A "professional" bird never comes out, even though she eavesdropped on origami lessons from outside a window.'], key: 'FavorGoods_110801_Content', ver: '3.3' },
      { ru: ['Любимое: чай', 'Лучший — гёкуро из Асинохары. В детстве тайком отпила из чашки взрослых и решила, что горько; теперь, когда чувствует аромат, ищет ту первую горечь. Гёкуро (玉露) — так звали и её наставницу.'], en: ['Favourite: tea', 'Best of all, Gyokuro from Ashinohara. As a child she secretly sipped from an adult\'s cup and found it bitter; now that she tastes the fragrance, she looks for that first bitterness. Gyokuro (玉露) was also her mentor\'s name.'], key: 'FavorWord_110808_Content', ver: '3.3' },
      { ru: ['Не любит сладкое', 'Не из-за вкуса: сладкое напоминает о горьком. «Чем слаще было то, что ты пережил, тем кислее терять».'], en: ['Dislikes sweets', 'Not the taste: sweets bring back bitter memories. "The sweeter something was, the more sour it is to lose."'], key: 'FavorWord_110809_Content', ver: '3.3' },
      { ru: ['Её сокровище', 'Шнурок на колокольчике — лента для волос, которую в детстве сплела ей Гёкуро. Судзу — реликвия Асинохары, а вот шнурок принадлежит только ей.'], en: ['Her treasure', 'The cord on the bell is a hair ribbon Gyokuro braided for her as a child. The Suzu is Ashinohara\'s relic; the cord is hers alone.'], key: 'FavorWord_110811_Content', ver: '3.3' },
      { ru: ['Мечта', 'Чтобы больше не было ни следующей мико, ни следующей судьбы, сплетённой с Плачущими. Мир, где каждый может жить «обычным человеком».'], en: ['Her wish', 'No next miko, and no next fate entangled with the Threnodians. A world where everyone gets to live as an ordinary person.'], key: 'FavorWord_110810_Content', ver: '3.3' },
    ],
  },
  {
    id: 'aemeath',
    cn: '愛彌斯',
    name: { ru: 'Эмис', en: 'Aemeath' },
    title: { ru: 'Синхронистка Экзостража, цифровой призрак', en: 'Exostrider Synchronist, digital ghost' },
    from: { ru: 'Лахай-Рой · Академия Звёздного факела', en: 'Lahai-Roi · Startorch Academy' },
    hue: '#ffb3d9',
    art: [C('aemeath-1'), C('aemeath-2'), C('aemeath-3'), C('aemeath-4')],
    pos: { ru: 'Слой II', en: 'Layer II' },
    intro: {
      cn: '愛彌斯，拉貝爾學部的隧者適格者！不過，那都是生前的事了。現在的我，是電子幽靈喔~',
      ru: '«Эмис, синхронистка Экзостража с факультета Рабель! Правда, это было при жизни. Теперь я — цифровой призрак~»',
      en: '"Aemeath, Synchronist of the Exostrider from Rabelle College. That was me back when I was alive. Now? I\'m a digital ghost!"',
      key: 'Role_1210_ShareDesc', ver: '3.1',
    },
    lore: {
      ru: [
        'Детство Эмис прошло в домике на ледяной равнине Лахай-Роя рядом с «тем человеком» — героем, которого она звала семьёй. Она сражалась водорослями со снежными тюленями, обожала серию игр «Space Fantasy: Katya» и мечтала, как её герой, путешествовать по космосу и спасать мир.',
        'В Академии Звёздного факела она стала синхронисткой — студенткой факультета Рабель, способной связать сознание с гигантским мехом Экзостражем. Экзостраж пришёл в Солярис через Врата. Он вынул своё ядро-реактор и поместил его под землю, и это «солнце» до сих пор держит подземный оазис Лахай-Роя. Лезвие его меча уходит в озеро Сандермир, а рукоять подпирает свод пещеры. Из его клеток выросли Экзорои — биомеханические существа, которые заново собрали экосистему края.',
        'Во время испытания в капсуле Эмис срезонировала с Экзостражем, чтобы Плачущий не сломал печать. Тело разорвало, но она осталась — цифровым призраком, который поёт среди звёзд. Её песни выходят под ником «Летучий снежный пушок», а фигурки пиксельного тюленя с её рисунка до сих пор перепродают втридорога.',
        'Как синхронистка, внутри ядра Экзостража она нашла скрытое послание, которое не мог прочесть никто из людей Лахай-Роя. Больше десяти лет она навещала Экзостража на равнине и стояла рядом с ним в снегу.',
      ],
      en: [
        'Aemeath grew up in a cabin on Lahai-Roi\'s frostlands beside "that person," the hero she called family. She fought Snowfluff Seals with stalks of kelp, loved the Space Fantasy: Katya games and dreamed of travelling through space and saving the world like her hero.',
        'At Startorch Academy she became a Synchronist, a Rabelle College student able to link her mind to the giant mech, the Exostrider. The Exostrider came to Solaris through the Stridergate. It removed its Reactor Drive and placed it underground, and that "sun" still keeps Lahai-Roi\'s underground haven alive. Its sword\'s blade sinks into Sundermere while the hilt holds up the cavern\'s ceiling. From its cells grew the Exoswarm, biomechanical creatures that rebuilt the region\'s ecosystem.',
        'During a test in the simulation cockpit, Aemeath resonated with the Exostrider to stop a Threnodian from breaking the seal. Her body was torn apart, but she remained, a digital ghost who sings among the stars. Her songs go out under the name Fleet Snowfluff, and figurines of the pixel seal she drew still resell for a fortune.',
        'As a Synchronist, she found a hidden message inside the Exostrider\'s Reactor Drive that no one in Lahai-Roi could ever read. For more than a decade she visited the Exostrider on the frostlands and stood beside it in the snow.',
      ],
      quotes: [
        {
          cn: '「隧者」的動力核心，照亮拉海洛地底的「太陽」。',
          ru: '«Энергетическое ядро Экзостража — „солнце“, освещающее подземелье Лахай-Роя».',
          en: '"The Exostrider\'s power core and Lahai-Roi\'s underground "sun.""',
          key: 'Term700010_Desc', ver: '3.0',
        },
        {
          cn: '「隧者」遺存的兵裝，其劍體下端深入墜劍湖，上端劍柄支撐起地下空間的穹頂',
          ru: '«Оставшееся оружие Экзостража: нижний конец клинка уходит в озеро Сандермир, а рукоять наверху подпирает свод подземного пространства».',
          en: '"The Exostrider\'s remaining weapon. The blade is buried deep within Sundermere, while its hilt supports the very ceiling of the cavern."',
          key: 'Term700012_Desc', ver: '3.0',
        },
        {
          cn: '是什麼讓它在拉海洛文明尚未萌發的時刻，決定取出爐芯，將光帶給地下呢？',
          ru: '«Что заставило его ещё до рождения цивилизации Лахай-Роя вынуть ядро и принести свет под землю?»',
          en: '"What made it decide, before Lahai-Roi\'s civilization even began, to take out its Reactor Drive and bring light underground?"',
          key: 'FavorWord_121017_Content', ver: '3.1',
        },
      ],
      dream: {
        ru: 'Спать ей больше не нужно, но сны остались: для цифрового призрака сон — это воспоминания, проигранные в другой форме. Та же мысль, что у Сомнуара, — сон как записанная память.',
        en: 'She no longer needs sleep, yet she still dreams: for a digital ghost, a dream is memory replayed in another form. The same idea as the Somnoire — a dream as recorded memory.',
        cn: '事實上，她本就無需睡眠，夢也更像是記憶以另一種形式進行重播。',
        key: 'FavorStory_121005_Content', ver: '3.1',
      },
    },
    abilities: {
      ru: [
        ['Доспех Экзостража', 'Эмис вызывает «доспех Экзостража» и сливается с ним — по её словам, просто «превращается». Мех она спроектировала сама по принципам работы Экзостража.'],
        ['Самопилотируемый мех', 'Как цифровой призрак она встраивается в мех как система управления и оставляет в нём часть своей вычислительной мощи. Мех действует вместе с ней, а лазерные пушки накрывают всё поле боя. «Я ведь уже не человек — могу работать в два потока».'],
        ['Вход в данные', 'Как цифровой призрак Эмис может проникнуть в любую систему данных. Сама она не уверена, часть ли это её силы или побочный эффект её особого состояния.'],
        ['Частота вместо тела', 'Зеркало её не отражает. Тело разорвано, но она существует, и сама объясняет это так: сущность человека — частота.'],
        ['Меч', 'Владеет мечом, которому её научил «тот человек», и с тех пор переделала стиль под себя.'],
      ],
      en: [
        ['Exostrider Armament', 'Aemeath manifests an Exostrider Armament and merges with it — "Yes, I get to transform!" She designed the mech herself from how the Exostrider works.'],
        ['A self-piloting mech', 'As a digital ghost she fuses into the mech as its control system and leaves part of her own processing power inside. The mech fights alongside her, and its laser arrays cover the whole battlefield. "I\'m not even human anymore, so I can run on two threads."'],
        ['Into the data', 'As a digital ghost, Aemeath can slip into any data system. She is not sure whether that is part of her Forte or a perk of her unusual state.'],
        ['Frequency instead of a body', 'Mirrors show no reflection. Her body was torn apart, yet she exists, and she explains it herself: the essence of a person is frequency.'],
        ['Swordplay', 'She fights with the sword style "that person" taught her, reworked to suit her since.'],
      ],
      quotes: [
        {
          cn: '能力……可以顯化「隧者兵裝」並與之融合，簡單來說就是變身啦！',
          ru: '«Способность… могу проявить „доспех Экзостража“ и слиться с ним — проще говоря, превратиться!»',
          en: '"As for my abilities, I can manifest an Exostrider Armament and synchronize with it directly. Translation—Yes, I get to transform!"',
          key: 'FavorRoleInfo_1210_TalentDoc', ver: '3.1',
        },
        {
          cn: '除此之外，我也能以電子幽靈的形式進入數據系統內部。',
          ru: '«А ещё в виде цифрового призрака я могу проникать внутрь систем данных».',
          en: '"Oh, and the digital ghost thing lets me slip into any data system."',
          key: 'FavorRoleInfo_1210_TalentDoc', ver: '3.1',
        },
        {
          cn: '我還在裡面留了一部分自己的算力，讓它能在我需要共同行動時配合我……我都不做人了，當然可以雙線程運轉啦~',
          ru: '«Я оставила в нём часть своей вычислительной мощи, чтобы он подстраивался, когда нужно действовать вместе… Я уже не человек, так что, конечно, могу работать в два потока~»',
          en: '"I left part of my own processing power inside so it can back me up when we act together... I\'m not human anymore, so of course I can run on two threads~"',
          key: 'FavorWord_121011_Content', ver: '3.1',
        },
        {
          cn: '不對，愛彌斯想，人的本質是頻率。',
          ru: '«Нет, подумала Эмис, сущность человека — частота».',
          en: '"No," Aemeath thought. "Humanity\'s essence is frequency."',
          key: 'FavorStory_121003_Content', ver: '3.1',
        },
      ],
    },
    likes: [
      { ru: ['Всё и сразу', 'Увлечения у неё приходят и уходят быстро. Она дружит со всей академией и помогает разным клубам, так что всё время пробует что-то новое. Больше всего любит делать что-то весело и вместе — «надо жить легко и радостно».'], en: ['A bit of everything', 'Her hobbies come and go quickly. She gets along with the whole academy and helps out various clubs, so she is always trying something new. Most of all she loves doing things together and having fun — "live easy and happy."'], key: 'FavorWord_121006_Content', ver: '3.1' },
      { ru: ['Еда', 'Пробует всё новое и модное, что студенты привозят со всего мира. Нелюбимой еды нет — да и есть ей теперь не нужно.'], en: ['Food', 'She tries every new trend students bring from around the world. No food she dislikes — and she no longer needs to eat anyway.'], key: 'FavorWord_121008_Content', ver: '3.1' },
      { ru: ['Игры', 'Любимая серия детства — «Space Fantasy: Katya»: путешествовать по космосу и спасать мир. Её рекорды до сих пор стоят на каждом автомате игрового зала академии.'], en: ['Games', 'Her favourite childhood series was Space Fantasy: Katya: travel through space and save the world. Her top scores still sit on every machine in the academy arcade.'], key: 'FavorStory_121001_Content · FavorWord_121117_Content', ver: '3.1' },
      { ru: ['Летучий снежный пушок', 'Ник взяла от снежных тюленей, когда регистрировала домен. Пиксельного тюленя нарисовала сама и гордится им.'], en: ['Fleet Snowfluff', 'She took the name from Snowfluff Seals when registering a domain. She drew the pixel seal herself and is proud of it.'], key: 'FavorWord_121001_Content', ver: '3.1' },
      { ru: ['Бумажные самолётики', 'Сложила их бесчисленное множество, но помнит самый первый — его сложил для неё «тот человек» в домике на равнине.'], en: ['Paper planes', 'She has folded countless ones but remembers the first, folded for her by "that person" in the cabin on the frostlands.'], key: 'FavorGoods_121003_Content', ver: '3.1' },
    ],
  },
  {
    id: 'denia',
    cn: '達妮婭',
    name: { ru: 'Дения', en: 'Denia' },
    title: { ru: 'Хозяйка пустотной материи', en: 'Wielder of Voidmatter' },
    from: { ru: 'Фрактсидус · факультет пустотной материи', en: 'Fractsidus · Department of Voidmatters' },
    hue: '#c9a7ff',
    art: [C('denia-1'), C('denia-2'), C('denia-3')],
    pos: { ru: 'Слой III', en: 'Layer III' },
    intro: {
      cn: '見到我很意外嗎？哈哈，別緊張嘛，我說過我們會再見面的。',
      ru: '«Удивлён меня видеть? Ха-ха, расслабься. Я же говорила, что мы ещё встретимся».',
      en: '"Surprised to see me? Haha, relax. I told you we\'d meet again."',
      key: 'Role_1211_ShareDesc', ver: '3.3',
    },
    lore: {
      ru: [
        'Для всех в Академии Звёздного факела Дения — студентка факультета пустотной материи, которая спит на парах, зато не пропускает ни одного мероприятия и всем дарит «добрую» улыбку. Для тех, кто её вырастил, она — актив Фрактсидуса и пешка в руках Великого архитектора.',
        'Своё имя она выбрала сама: там, где она родилась, прощаются словом «досвидания». От семьи у неё осталась только размытая сцена прощания, и она даже не знает, не создана ли искусственно. Архитектор отвечал одно: «Память ненадёжна. Забудь».',
        'Архитектор выбрал её сосудом для силы Плачущего именно потому, что она была пустой — а пустота совпадала с логикой этой силы. В капсуле с пустотной материей её частота распалась на нити, тело растворилось, и пустотная материя потекла по её венам.',
        'Но, подражая людям, Дения обрела сердце — хрупкое, но своё. В конце она забрала последний осколок силы Плачущего в свою метку. Падая во тьму, она думала о друзьях — Сигрике, библиотекаре Настасье, человеке, которого когда-то обманула, — и поняла: у неё есть своё сердце, а у пустоты нет ничего.',
      ],
      en: [
        'To everyone at Startorch Academy, Denia is a Department of Voidmatters student who dozes through classes yet never misses a campus event, always flashing her "gentle" smile. To those who raised her, she is a Fractsidus asset and a pawn of the Grand Architect.',
        'She chose her own name: where she was born, people part with "Dasvidaniya." All that remains of her family is a blurred scene of farewell, and she does not even know whether she was made artificially. The Grand Architect always answered the same way: "Memories are unreliable. Let it go."',
        'The Grand Architect chose her as the vessel for a Threnodian\'s power precisely because she was empty, and emptiness matched that power\'s logic. In a Voidmatter Pod her frequency splintered into threads, her body dissolved, and Voidmatter came to flow through her veins.',
        'But by imitating people, Denia gained a heart, fragile but her own. In the end she drew the last fragment of the Threnodian\'s power into her Tacet Mark. Falling into the dark, she thought of her friends — Sigrika, the librarian Nastasha, the person she once deceived — and understood that she had a heart of her own, while the void has nothing.',
      ],
      quotes: [
        {
          cn: '對於將她撫養長大的人們而言，「達妮婭」只是殘星會資產的一部分。她的生命，是會長手中的一枚籌碼。',
          ru: '«Для тех, кто её вырастил, „Дения“ была лишь частью имущества Фрактсидуса. Её жизнь — фишка в руке Архитектора».',
          en: '"To those who raised her, "Denia" was merely another asset of the Fractsidus, another pawn for the Grand Architect."',
          key: 'FavorStory_121101_Content', ver: '3.3',
        },
        {
          cn: '在模仿人類行為和情緒的過程中，她獲得了一顆脆弱而痛苦的心。',
          ru: '«Подражая человеческим поступкам и чувствам, она обрела хрупкое и страдающее сердце».',
          en: '"In imitating human behaviour and emotion, she gained a fragile, aching heart."',
          key: 'FavorStory_121102_Content', ver: '3.3',
        },
        {
          cn: '達妮婭，已找到自己的路。',
          ru: '«Дения нашла свой путь».',
          en: '"Denia had found her own path."',
          key: 'FavorStory_121105_Content', ver: '3.3',
        },
      ],
      dream: {
        ru: 'Её прибор для пузырей называется «Создатель снов» (造夢者). А о сне она говорит так: каждый раз, засыпая, ты будто репетируешь смерть.',
        en: 'Her bubble device is called "Dream Maker" (造夢者). And about sleep she says: every time you fall asleep, it is like practising death.',
        cn: '畢竟每次入睡，都像是在練習死亡一樣。',
        key: 'FavorWord_121102_Content', ver: '3.1',
      },
    },
    abilities: {
      ru: [
        ['Пустотная материя (虛質)', 'Что это: в Лахай-Рое пустотная материя — явление, которое растворяет без разбора всякую материю и само существование. Её всплески, пустотные бури, поглощают всё вокруг. Предметы под её действием попадают в «неустойчивое существование» — их становится невозможно наблюдать.'],
        ['Пространство пустоты (虛質空間)', 'Пространство высших измерений в глубине густой пустотной материи. Время и пространство там в полном хаосе, а живое быстро теряет частоту, пока его существование не растворится. По словам Ровера, там вообще нет понятий времени и пространства, и координаты не построить.'],
        ['Управление частицами', 'Сила Плачущего дала Дении власть над частицами пустотной материи и связь с самим пространством пустоты. Со временем она научилась стабилизировать форму пустотной материи.'],
        ['Кубы из пустоты', 'Учёные академии пишут о ней с ужасом: «Ты видел резонатора, который скатывает пустотную материю в кубы и швыряет ими в людей?» В бою с ней у Хиюки, по её же отчёту, треснула метка.'],
        ['Пузыри', 'Официально её сила — пузыри с остаточной энергией: защита, поддержка и подрыв по команде. По тестам их текучая структура блокирует пустотную материю не хуже покрытия Экзостража. А внутри пузырей она прятала саму пустотную материю.'],
      ],
      en: [
        ['Voidmatter (虛質)', 'What it is: in Lahai-Roi, Voidmatter is a phenomenon that indiscriminately dissolves all matter and existence. Its outbursts, Void Storms, swallow everything around them. Objects under its influence enter an unstable "existence" and become impossible to observe.'],
        ['Voidspace (虛質空間)', 'A high-dimensional domain deep within dense Voidmatter. Time and space there are in total chaos, and the living rapidly lose frequency until their existence dissolves. Rover says there is no concept of time or space there at all, so no coordinates can be set.'],
        ['Particle control', 'The Threnodian\'s power gave Denia control over Voidmatter particles and a link to Voidspace itself. Over time she learned to stabilize Voidmatter\'s form.'],
        ['Void cubes', 'Academy scientists write about her in horror: "Have you ever seen a Resonator that can roll Voidmatter into cubes and start flinging it at people?" Fighting her, Hiyuki reported her own Tacet Mark started tearing.'],
        ['Bubbles', 'Officially her power is bubbles of Remnant Energy: defence, support, and detonation on command. Tests show their fluid structure blocks Voidmatter on par with the Exostrider coating. Inside those bubbles, she hid Voidmatter itself.'],
      ],
      quotes: [
        {
          cn: '其具備無差別的對一切「存在」的消解，能吞噬影響範圍內的事物，引發大規模的災難。',
          ru: '«Она без разбора растворяет всякое „существование“, поглощает всё в зоне действия и вызывает масштабные бедствия». О пустотной буре.',
          en: '"It indiscriminately dissolves all matter and existence within its range, causing widespread devastation." On the Void Storm.',
          key: 'Term700029_Desc', ver: '3.0',
        },
        {
          cn: '高濃度虛質深處的高維空間……在這裡，時間與空間都變得混亂，而生者一旦進入其中，頻率便會急速流失，最終存在將歸於虛無。',
          ru: '«Пространство высших измерений в глубине густой пустотной материи… Время и пространство здесь в хаосе, а у вошедшего живого частота быстро утекает, и в конце концов его существование обращается в ничто».',
          en: '"A high-dimensional domain embedded deep within high-density Voidmatter... The fundamental laws of time and space descend into total chaos here. Any living entity entering this domain suffers a rapid loss of frequency, eventually leading to the total dissolution of their existence."',
          key: 'Term750040_Desc', ver: '3.1',
        },
        {
          cn: '那些虛質自此開始流經她的血管與臟器，賦予了她操縱虛質粒子，以及連結虛質空間的能力。',
          ru: '«С тех пор пустотная материя текла по её сосудам и органам и дала ей способность управлять частицами пустотной материи и связываться с пространством пустоты».',
          en: '"Voidmatter came to flood her veins and organs. It granted her the power to manipulate Voidmatter particles and forged a link to Voidspace itself."',
          key: 'FavorStory_121102_Content', ver: '3.3',
        },
        {
          cn: '你見過把虛質揉成方塊拿來砸人的共鳴者嗎？',
          ru: '«Ты видел резонатора, который скатывает пустотную материю в кубы и швыряет ими в людей?»',
          en: '"Have you ever seen a Resonator that can roll Voidmatter into cubes and start flinging it at people?"',
          key: 'FavorRoleInfo_1211_TalentCertification', ver: '3.3',
        },
      ],
    },
    likes: [
      { ru: ['Всё, что усыпляет', 'Любит лекции с мягким голосом и непонятным содержанием, тёплую сладкую еду и малопонятные справочники — с ними быстрее засыпаешь. «Дома-то я сплю плохо».'], en: ['Anything that helps her sleep', 'She likes gentle-voiced lectures nobody understands, warm sweet food and obscure reference books, because they help her fall asleep. "I don\'t sleep well at home, you know."'], key: 'FavorWord_121106_Content', ver: '3.1' },
      { ru: ['Любимая еда', 'Торт на день рождения со свежими фруктами, сливками и свечами. «Я ведь его ещё ни разу не ела».'], en: ['Favourite food', 'A birthday cake with fresh fruit, cream and candles. "After all, I\'ve never had one."'], key: 'FavorWord_121108_Content', ver: '3.1' },
      { ru: ['Мечта', 'Каждый день высыпаться, вкусно есть — и быть с друзьями.'], en: ['Her dream', 'Sleep well every day, eat something good — and be with her friends.'], key: 'FavorWord_121110_Content', ver: '3.1' },
      { ru: ['Цветник у двери', 'Из лабораторных дней ей нравился только маленький цветник у двери комнаты: растения, которые растут лишь под действием пустотной материи, но красивы по-своему.'], en: ['The little garden', 'The only thing she liked from her lab days was a small garden by her door: plants that grow only under Voidmatter, but have their own beautiful colours.'], key: 'FavorWord_121112_Content', ver: '3.1' },
      { ru: ['Скрипка Фроловы', 'Фролова — одна из немногих в Фрактсидусе, кто сам с ней заговаривал. Когда Дения лежала в капсуле, та играла ей на скрипке. Дении нравилась эта музыка.'], en: ['Phrolova\'s violin', 'Phrolova was one of the few Fractsidus Overseers who spoke to her. While Denia lay in the pod, she played the violin for her. Denia loved that music.'], key: 'FavorWord_121115_Content', ver: '3.1' },
      { ru: ['Без формы', 'Почему не носит школьную форму? Форма защищает от пустотной материи, а её «зарегистрированная» способность — как раз пузыри, которые от неё защищают.'], en: ['No uniform', 'Why no school uniform? The uniform protects against Voidmatter, and her "registered" ability is exactly bubbles that do the same.'], key: 'FavorWord_121111_Content', ver: '3.1' },
    ],
  },
]

export const INNER_UI = {
  ru: {
    gate: 'Внутренний слой', gateShort: 'Резонаторы · нажми, чтобы нырнуть', gateNum: '∞',
    eyebrow: 'Внутренний слой', title: 'Резонаторы', hint: 'Наведи на ветвь метки · нажми, чтобы раскрыть запись',
    surface: '↑ Всплыть', back: '← К слою', decoding: 'расшифровка слоя',
    tabs: { lore: 'Лор', abilities: 'Способности', likes: 'Увлечения' },
    dream: 'Связь со снами', quotes: 'Из файлов игры', art: 'Арт © Kuro Games',
  },
  en: {
    gate: 'Inner layer', gateShort: 'Resonators · click to dive', gateNum: '∞',
    eyebrow: 'Inner layer', title: 'Resonators', hint: 'Hover a branch of the Mark · click to open the record',
    surface: '↑ Surface', back: '← Back to layer', decoding: 'decoding layer',
    tabs: { lore: 'Lore', abilities: 'Abilities', likes: 'Likes' },
    dream: 'Tie to the dreams', quotes: 'From the game files', art: 'Art © Kuro Games',
  },
}
