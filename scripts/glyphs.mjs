import opentype from 'opentype.js'
import fs from 'fs'
const font = opentype.loadSync('/home/claude/site/node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff')
const path = font.getPath('SOMNOIRE', 0, 0, 200, { kerning: true, letterSpacing: 0.06 })
const bb = path.getBoundingBox()
const d = path.toPathData(2)
fs.writeFileSync('/home/claude/site/src/wordmark.js',
`// Outline of "SOMNOIRE" set in Cormorant Garamond 400 (the site's own font, SIL OFL), generated with opentype.js.
export const WORDMARK = { d: ${JSON.stringify(d)}, w: ${(bb.x2 - bb.x1).toFixed(1)}, h: ${(bb.y2 - bb.y1).toFixed(1)}, x: ${bb.x1.toFixed(1)}, y: ${bb.y1.toFixed(1)} }
`)
console.log(d.length, bb)
