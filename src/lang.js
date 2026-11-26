import { createContext, useContext } from 'react'
import * as vsb from './content'
import * as acf from './content_acf'

const pack = (m) => ({ SECTIONS: m.SECTIONS, TERMS: m.TERMS, GALLERY: m.GALLERY, UI: m.UI })
export const PACKS = { vsb: pack(vsb), acf: pack(acf) }
export const SITES = [
  ['vsb', 'VS Battles', 'English'],
  ['acf', 'АЦФ', 'Русский'],
]
export const LangCtx = createContext(PACKS.vsb)
export const usePack = () => useContext(LangCtx)
