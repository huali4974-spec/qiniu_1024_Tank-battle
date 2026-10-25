import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const project = join(here, 'TankRoadQ')
const assets = join(project, 'assets')
const sprites = join(assets, 'sprites')
const stage = JSON.parse(readFileSync(resolve(here, '../src/stages/stage-1.json'), 'utf8').replace(/^\uFEFF/, ''))
const cells = stage.map.map((line) => line.trim().split(/\s+/))
if (cells.length !== 13 || cells.some((row) => row.length !== 13)) {
  throw new Error('The classic stage must have 13 rows and 13 columns')
}

const save = (path, content) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${content.trim()}\n`)
}
const svg = (body, size = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">${body}</svg>`
const placement = (col, row) => [24 * (col - 6), 24 * (6 - row)]

// Short brick masks represent four filled or empty 2x2 quadrants in the source parser.
const brickSvg = (mask) => {
  const bits = parseInt(mask, 16)
  let body = ''
  for (let q = 0; q < 4; q++) {
    if (!(bits & (1 << q))) continue
    const qx = (q % 2) * 12
    const qy = Math.floor(q / 2) * 12
    body += `<rect x="${qx + .35}" y="${qy + .35}" width="11.3" height="11.3" rx="2" fill="#a45461"/>`
    body += `<rect x="${qx + .8}" y="${qy + .8}" width="10.4" height="8.5" rx="1.7" fill="#efa087"/>`
    body += `<path d="M${qx + 2.2} ${qy + 2}h6.6" stroke="#ffe7c5" stroke-opacity=".8" stroke-width="1" stroke-linecap="round"/>`
  }
  return svg(body)
}
const steelSvg = (mask) => {
  const bits = parseInt(mask, 16)
  let body = ''
  for (let q = 0; q < 4; q++) {
    if (!(bits & (1 << q))) continue
    const x = (q % 2) * 12
    const y = Math.floor(q / 2) * 12
    body += `<rect x="${x + .3}" y="${y + .3}" width="11.4" height="11.4" rx="2" fill="#536b72"/>`
    body += `<path d="M${x + 2} ${y + 2}h8l-1.6 2H${x + 3.6}z" fill="#dce8df"/>`
    body += `<path d="M${x + 2} ${y + 2}l1.6 2v5.2L${x + 2} ${y + 10}z" fill="#a8c6c3"/>`
    body += `<rect x="${x + 3.5}" y="${y + 4}" width="5" height="5" rx="1" fill="#8ba9ac"/>`
    body += `<circle cx="${x + 6}" cy="${y + 6.5}" r="1" fill="#eaf5ea"/>`
  }
  return svg(body)
}

for (const [type, filename, make] of [['B', 'Brick', brickSvg], ['T', 'Steel', steelSvg]]) {
  const tiles = []
  const masks = new Set()
  cells.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
    if (!cell.startsWith(type)) return
    const mask = cell.slice(1).toLowerCase()
    masks.add(mask)
    tiles.push({ mask, x: placement(colIndex, rowIndex)[0], y: placement(colIndex, rowIndex)[1] })
  }))
  const costumes = [...masks].sort().map((mask) => {
    save(join(sprites, filename, `${mask}.svg`), make(mask))
    return { name: mask, path: `${mask}.svg`, x: 12, y: 12, bitmapResolution: 1, imageWidth: 24, imageHeight: 24 }
  })
  const index = {
    x: 0, y: 0, size: 1, heading: 0, visible: false, rotationStyle: 'none',
    physicsMode: 'no', collisionShapeType: 'rect', collisionShapeParams: [22, 22],
    costumeIndex: 0, costumes,
  }
  save(join(sprites, filename, 'index.json'), JSON.stringify(index, null, 2))
  let source = `onStart => {
  hide
${tiles.map(({ mask, x, y }) => `  setCostume "${mask}"
  setXYpos ${x}, ${y}
  clone`).join('\n')}
}

onCloned data => {
  show
}
${type === 'B' ? '\nonTouchStart "PlayerShot", sprite => {\n  destroy\n}\n\nonTouchStart "EnemyShot", sprite => {\n  destroy\n}\n' : ''}`
  if (type === 'T') {
    const bands = [
      [[2, 2], [4, 2], [8, 2], [10, 2]],
      [[4, 5], [6, 5], [8, 5]],
      [[2, 9], [4, 9], [8, 9], [10, 9]],
    ]
    const positions = bands.map((band) => band.map(([col, row]) => {
      if (cells[row][col] !== 'X') throw new Error(`Stone slot ${col},${row} is not empty`)
      return placement(col, row)
    }))
    source = `var choice = 0

onStart => {
  hide
  setCostume "f"
${positions.map((band) => `  choice = int(rand(0, ${band.length}))
${band.map(([x, y], i) => `${i === 0 ? '  if' : ' else if'} choice == ${i} {
    setXYpos ${x}, ${y}
  }`).join('')}
  clone`).join('\n')}
}

onCloned data => {
  show
}`
  }
  save(join(project, `${filename}.spx`), source)
}

const arena = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
  <defs>
    <pattern id="ground" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="#dce9d9"/>
      <path d="M0 .5H24M.5 0V24" stroke="#b6d0be" stroke-opacity=".52"/>
      <circle cx="17" cy="17" r=".8" fill="#b5cab6"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="#eff5e8"/>
  <rect x="78" y="18" width="324" height="324" rx="9" fill="#9ebdaa"/>
  <rect x="84" y="24" width="312" height="312" fill="url(#ground)"/>
  <path d="M84 24h312v312H84z" fill="none" stroke="#6e9d89" stroke-width="2"/>
  <path d="M48 24h15M48 336h15M417 24h15M417 336h15" stroke="#8eb7a3" stroke-width="3" stroke-linecap="round"/>
</svg>`
save(join(assets, 'arena.svg'), arena)

const palette = {
  Player: { outline: '#183f60', track: '#244862', tread: '#72b8d3', hull: '#3689bc', armor: '#79ccef', light: '#c6f4ff', turret: '#57b1de', visor: '#144b6e' },
  Enemy: { outline: '#583a52', track: '#60475a', tread: '#e6a5a3', hull: '#bd6980', armor: '#f4a68e', light: '#ffe0b0', turret: '#df8894', visor: '#75394b' },
}
const tankBody = (p) => `
  <ellipse cx="48" cy="80" rx="35" ry="8" fill="#274a50" opacity=".2"/>
  <path d="M13 21Q13 15 19 15h13v67H19q-6 0-6-6zM64 15h13q6 0 6 6v55q0 6-6 6H64z" fill="${p.track}" stroke="${p.outline}" stroke-width="4"/>
  <path d="M19 20h11v57H19zM66 20h11v57H66z" fill="${p.tread}" opacity=".78"/>
  <path d="M14 29h17M14 39h17M14 49h17M14 59h17M14 69h17M65 29h17M65 39h17M65 49h17M65 59h17M65 69h17" stroke="${p.outline}" stroke-width="3"/>
  <path d="M30 17h36l10 14v41l-10 10H30L20 72V31z" fill="${p.hull}" stroke="${p.outline}" stroke-width="4"/>
  <path d="M30 18h36l7 13H23z" fill="${p.light}" opacity=".85"/>
  <path d="M23 32h50v9H23z" fill="${p.armor}" opacity=".86"/>
  <path d="M22 66h52l-8 14H30z" fill="${p.armor}"/>
  <path d="M27 46l8 5-3 11-9 4zM69 46l-8 5 3 11 9 4z" fill="${p.light}" opacity=".7"/>
  <path d="M38 4h20v37H38z" fill="${p.outline}"/>
  <path d="M42 5h12v35H42z" fill="${p.armor}"/>
  <rect x="35" y="1" width="26" height="12" rx="3" fill="${p.outline}"/>
  <path d="M39 3h18v4H39z" fill="${p.light}"/>
  <path d="M40 10h16" stroke="${p.tread}" stroke-width="2"/>
  <path d="M33 32h30l9 13-6 23-18 8-18-8-6-23z" fill="${p.outline}"/>
  <path d="M35 34h26l7 12-5 18-15 7-15-7-5-18z" fill="${p.turret}"/>
  <path d="M35 34h26l7 12H28z" fill="${p.light}" opacity=".85"/>
  <path d="M28 47h40l-5 17-15 7-15-7z" fill="${p.armor}" opacity=".8"/>
  <path d="M40 48h16l5 7-13 8-13-8z" fill="${p.visor}"/>
  <path d="M41 49h14l2 3H39z" fill="${p.light}" opacity=".8"/>
  <circle cx="48" cy="63" r="3" fill="${p.light}"/>
  <path d="M32 74h32" stroke="${p.outline}" stroke-width="2"/>
`
for (const [name, colors] of Object.entries(palette)) {
  for (const [direction, angle] of Object.entries({ up: 0, right: 90, down: 180, left: 270 })) {
    const art = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 96 96"><g transform="rotate(${angle} 48 48)">${tankBody(colors)}</g></svg>`
    save(join(sprites, name, `${direction}.svg`), art)
  }
}

for (const [name, colors] of Object.entries({ PlayerShot: ['#e6f8ff', '#67bce5', '#2a718e'], EnemyShot: ['#fff1df', '#efa394', '#a95d72'] })) {
  const [light, fill, edge] = colors
  let fur = ''
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12
    const x1 = 12 + Math.cos(a) * 7.5
    const y1 = 12 + Math.sin(a) * 7.5
    const x2 = 12 + Math.cos(a) * (i % 2 ? 10.4 : 9.3)
    const y2 = 12 + Math.sin(a) * (i % 2 ? 10.4 : 9.3)
    fur += `<path d="M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}" stroke="${edge}" stroke-width="1.5" stroke-linecap="round"/>`
  }
  const art = svg(`${fur}<circle cx="12" cy="12" r="8" fill="${fill}" stroke="${edge}" stroke-width="1.5"/><ellipse cx="9" cy="9" rx="3.7" ry="2.6" fill="${light}" opacity=".9"/><circle cx="15" cy="15" r="1.3" fill="${edge}" opacity=".38"/>`)
  save(join(sprites, name, 'shot.svg'), art)
}
