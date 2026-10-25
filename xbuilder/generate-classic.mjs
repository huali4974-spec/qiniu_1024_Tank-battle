import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const project = join(here, 'TankRoadQ')
const assets = join(project, 'assets')
const sprites = join(assets, 'sprites')
const stages = Array.from({ length: 35 }, (_, index) => {
  const number = index + 1
  const stage = JSON.parse(readFileSync(resolve(here, `../src/stages/stage-${number}.json`), 'utf8').replace(/^\uFEFF/, ''))
  const cells = stage.map.map((line) => line.trim().split(/\s+/))
  if (cells.length !== 13 || cells.some((row) => row.length !== 13) || cells[12][6][0] !== 'E' || cells[12][4] !== 'X') {
    throw new Error(`Stage ${number} has an invalid layout or starting position`)
  }
  return { number, cells }
})
const terrainCount = (stage) => stage.cells.flat().filter((cell) => 'BTRSF'.includes(cell[0])).length
const reserveRoute = (cells, start, allowBase) => {
  const queue = [start]
  const previous = new Map([[start.join(','), null]])
  for (let index = 0; index < queue.length; index++) {
    const [col, row] = queue[index]
    if (col === 6 && row === 0) break
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const nextCol = col + dx
      const nextRow = row + dy
      const key = `${nextCol},${nextRow}`
      if (nextCol < 0 || nextCol >= 13 || nextRow < 0 || nextRow >= 13 || previous.has(key)) continue
      const cell = cells[nextRow][nextCol]
      if (cell[0] === 'T' || cell[0] === 'R' || (!allowBase && cell[0] === 'E')) continue
      previous.set(key, `${col},${row}`)
      queue.push([nextCol, nextRow])
    }
  }
  const route = new Set()
  for (let key = '6,0'; key !== null; key = previous.get(key)) {
    if (!previous.has(key)) throw new Error('A classic stage has no route through its center')
    route.add(key)
  }
  return route
}
const reservedCells = stages.map(({ cells }) => new Set([
  ...reserveRoute(cells, [6, 12], true),
  ...reserveRoute(cells, [4, 12], false),
]))

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

const terrainSvg = {
  River: svg(`<rect width="24" height="24" fill="#3d9fb6"/><path d="M-2 7Q4 3 10 7T26 7M-2 17Q4 13 10 17T26 17" fill="none" stroke="#a8e7e8" stroke-width="2" opacity=".85"/><circle cx="18" cy="12" r="1.3" fill="#d3f5e9"/>`),
  Snow: svg(`<rect width="24" height="24" fill="#d8ebea"/><path d="M5 6l3 3m9-4l-3 4M4 17l4-2m11 2l-4-2M12 4v3m0 10v3" stroke="#97c1c7" stroke-width="1.3" stroke-linecap="round"/><circle cx="12" cy="12" r="2.4" fill="#f4fbf8"/>`),
  Forest: svg(`<rect width="24" height="24" fill="#91c3a0" opacity=".7"/><path d="M1 8q5-6 10 0t12 0M-1 18q6-5 12 0t14 0" fill="none" stroke="#5e9e7c" stroke-width="2" opacity=".5"/><path d="M7 5l2 2m8 7l-2 3M6 18l2-2" stroke="#d2e9b8" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`),
}

const terrainTypes = [
  { type: 'B', name: 'Brick', art: brickSvg },
  { type: 'T', name: 'Steel', art: steelSvg },
  { type: 'R', name: 'River' },
  { type: 'S', name: 'Snow' },
  { type: 'F', name: 'Forest' },
]

for (const { type, name, art } of terrainTypes) {
  const layouts = stages.map(({ cells }) => cells.flatMap((row, rowIndex) => row.flatMap((cell, colIndex) => {
    if (cell[0] !== type) return []
    const [x, y] = placement(colIndex, rowIndex)
    return [{ mask: cell.slice(1).toLowerCase(), x, y, row: rowIndex, col: colIndex }]
  })))
  const masks = [...new Set(layouts.flatMap((tiles) => tiles.map((tile) => tile.mask)))].sort()
  const costumes = masks.map((mask) => {
    const filename = art ? `${mask}.svg` : `${name.toLowerCase()}.svg`
    save(join(sprites, name, filename), art ? art(mask) : terrainSvg[name])
    return { name: mask || name.toLowerCase(), path: filename, x: 12, y: 12, bitmapResolution: 1, imageWidth: 24, imageHeight: 24 }
  })
  save(join(sprites, name, 'index.json'), JSON.stringify({
    x: 0, y: 0, size: 1, heading: 0, visible: false, rotationStyle: 'none',
    physicsMode: 'no', collisionShapeType: 'rect', collisionShapeParams: [22, 22],
    costumeIndex: 0, costumes,
  }, null, 2))

  const randomSteel = (cells, reserved) => {
    const positions = []
    for (let row = 2; row <= 10; row++) {
      for (let col = 1; col <= 11; col++) {
        if (cells[row][col] === 'X' && !reserved.has(`${col},${row}`)) positions.push(placement(col, row))
      }
    }
    const count = Math.min(3, Math.floor(positions.length / 4))
    return Array.from({ length: count }, (_, band) => {
      const from = Math.floor(band * positions.length / count)
      const to = Math.floor((band + 1) * positions.length / count)
      return positions.slice(from, to)
    }).map((band) => `    choice = int(rand(0, ${band.length - 1}))
${band.map(([x, y], i) => `${i === 0 ? '    if' : ' else if'} choice == ${i} {
      setXYpos ${x}, ${y}+offsetY
    }`).join('')}
    setCostume "f"
    clone`).join('\n')
  }

  const branches = layouts.map((tiles, index) => {
    const placementCode = tiles.map(({ mask, x, y, row, col }) => {
      const code = `${art ? `    setCostume "${mask}"\n` : ''}    setXYpos ${x}, ${y}+offsetY
    clone`
      if (col >= 5 && col <= 7 && row >= 11) return `    if section == 2 {
${code}
    }`
      if (col >= 5 && col <= 7 && row === 0) return `    if section == 0 {
${code}
    }`
      return code
    }).join('\n')
    const extra = type === 'T' ? randomSteel(stages[index].cells, reservedCells[index]) : ''
    return `${index === 0 ? '  if' : ' else if'} targetStage == ${index + 1} {
${placementCode}${extra ? `\n${extra}` : ''}
  }`
  }).join('')
  save(join(project, `${name}.spx`), `${type === 'T' ? 'var choice = 0\n\n' : ''}func loadSelected(targetStage int, offsetY float64, section int) {
${branches}
}

onMsg "loadStage", => {
  hide
  loadSelected(stageTop, 312, 0)
  loadSelected(stageMiddle, 0, 1)
  loadSelected(stageBottom, -312, 2)
}

onCloned data => {
  show
}`)
}

const spawnOrder = [0, 3, 1, 4, 2, 5]
const columnOrder = [0, 6, 12, 3, 9, 1, 11, 5, 7, 2, 10, 4, 8]
const spawnBranches = stages.map(({ number, cells }, index) => {
  const slots = spawnOrder.flatMap((row) => columnOrder.flatMap((col) =>
    cells[row][col] === 'X' ? [placement(col, row)] : [])).slice(0, 24)
  if (slots.length < 8) throw new Error(`Stage ${number} has too few enemy spawn points`)
  return `${index === 0 ? '            if' : ' else if'} spawnMap == ${number} {
                spawnChoice = int(rand(0, ${slots.length - 1}))
${slots.map(([x, y], choice) => `${choice === 0 ? '                if' : ' else if'} spawnChoice == ${choice} {
                    spawnX = ${x}
                    spawnY = ${y}+spawnOffset
                }`).join('')}
            }`
}).join('')
const enemyPath = join(project, 'Enemy.spx')
const enemySource = readFileSync(enemyPath, 'utf8')
const spawnBlock = /[ \t]*\/\/ GENERATED SPAWN START[\s\S]*?\/\/ GENERATED SPAWN END/
if (!spawnBlock.test(enemySource)) throw new Error('Enemy spawn block markers are missing')
save(enemyPath, enemySource.replace(spawnBlock, `\t\t\t// GENERATED SPAWN START\n${spawnBranches}\n\t\t\t// GENERATED SPAWN END`))

const pairsByStage = stages.map((stage) => {
  const pairs = []
  for (const middle of stages) {
    for (const bottom of stages) {
      if (middle.number >= bottom.number || stage.number === middle.number || stage.number === bottom.number) continue
      if (terrainCount(stage) + terrainCount(middle) + terrainCount(bottom) <= 250) {
        pairs.push([middle.number, bottom.number])
      }
    }
  }
  if (!pairs.length) throw new Error(`Stage ${stage.number} has no valid composite pair`)
  const count = Math.min(8, pairs.length)
  return Array.from({ length: count }, (_, index) => pairs[Math.floor((index + 0.5) * pairs.length / count)])
})
const compositionBranches = pairsByStage.map((pairs, index) => `${index === 0 ? '  if' : ' else if'} stageTop == ${index + 1} {
    pairChoice = int(rand(0, ${pairs.length - 1}))
${pairs.map(([middle, bottom], choice) => `${choice === 0 ? '    if' : ' else if'} pairChoice == ${choice} {
      stageMiddle = ${middle}
      stageBottom = ${bottom}
    }`).join('')}
  }`).join('')
const mainPath = join(project, 'main.spx')
const mainSource = readFileSync(mainPath, 'utf8')
const compositionBlock = /[ \t]*\/\/ GENERATED COMPOSITION START[\s\S]*?\/\/ GENERATED COMPOSITION END/
if (!compositionBlock.test(mainSource)) throw new Error('Composite map block markers are missing')
save(mainPath, mainSource.replace(compositionBlock, `\t// GENERATED COMPOSITION START\n${compositionBranches}\n\t// GENERATED COMPOSITION END`))

const arena = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="1008" viewBox="0 0 480 1008">
  <defs>
    <pattern id="ground" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect width="24" height="24" fill="#dce9d9"/>
      <path d="M0 .5H24M.5 0V24" stroke="#b6d0be" stroke-opacity=".52"/>
      <circle cx="17" cy="17" r=".8" fill="#b5cab6"/>
    </pattern>
  </defs>
  <rect width="480" height="1008" fill="#eff5e8"/>
  <rect x="78" y="30" width="324" height="948" rx="9" fill="#9ebdaa"/>
  <rect x="84" y="36" width="312" height="936" fill="url(#ground)"/>
  <path d="M84 36h312v936H84z" fill="none" stroke="#6e9d89" stroke-width="2"/>
  <path d="M48 348h15M48 660h15M417 348h15M417 660h15" stroke="#8eb7a3" stroke-width="3" stroke-linecap="round"/>
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
  const art = svg(`${fur}<circle cx="12" cy="12" r="8" fill="${fill}" stroke="${edge}" stroke-width="1.5"/><ellipse cx="9" cy="9" rx="3.7" ry="2.6" fill="${light}" opacity=".9"/><circle cx="15" cy="15" r="1.3" fill="${edge}" opacity=".38"/>`, 6)
  save(join(sprites, name, 'shot.svg'), art)
}
