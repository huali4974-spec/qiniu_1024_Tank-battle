import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const project = join(here, 'TankRoadQ')
const terrain = [
  ['B', 'Brick'], ['T', 'Steel'], ['R', 'River'], ['S', 'Snow'], ['F', 'Forest'],
]
const source = Object.fromEntries(terrain.map(([, name]) =>
  [name, readFileSync(join(project, `${name}.spx`), 'utf8')]))
const enemy = readFileSync(join(project, 'Enemy.spx'), 'utf8')
const main = readFileSync(join(project, 'main.spx'), 'utf8')
const stageBlock = (text, stage, variable) => {
  const marker = `${variable} == ${stage} {`
  const start = text.indexOf(marker)
  assert(start >= 0, `Missing stage ${stage}`)
  const next = stage < 35 ? text.indexOf(`} else if ${variable} == ${stage + 1} {`, start) : text.length
  assert(next > start, `Missing end of stage ${stage}`)
  return text.slice(start, next)
}
const routeThrough = (cells, start, goal, allowBase = false) => {
  const queue = [start]
  const previous = new Map([[start.join(','), null]])
  for (let index = 0; index < queue.length; index++) {
    const [col, row] = queue[index]
    if (col === goal[0] && row === goal[1]) break
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const x = col + dx
      const y = row + dy
      const key = `${x},${y}`
      if (x < 0 || x >= 13 || y < 0 || y >= cells.length || previous.has(key)) continue
      if ('TR'.includes(cells[y][x][0]) || (!allowBase && cells[y][x][0] === 'E')) continue
      previous.set(key, `${col},${row}`)
      queue.push([x, y])
    }
  }
  const route = new Set()
  for (let key = goal.join(','); key !== null; key = previous.get(key)) {
    assert(previous.has(key), `No route from ${start} to ${goal}`)
    route.add(key)
  }
  return route
}

const terrainCounts = []
const maps = []
for (let stage = 1; stage <= 35; stage++) {
  const data = JSON.parse(readFileSync(resolve(here, `../src/stages/stage-${stage}.json`), 'utf8').replace(/^\uFEFF/, ''))
  const cells = data.map.map((row) => row.trim().split(/\s+/))
  assert.equal(cells.length, 13)
  assert(cells.every((row) => row.length === 13))
  assert.equal(cells[12][4], 'X')
  assert(cells[12][6].startsWith('E'))
  assert.deepEqual([cells[11][5], cells[11][6], cells[11][7], cells[12][5], cells[12][7]].map((cell) => cell.toLowerCase()),
    ['b8', 'bc', 'b4', 'ba', 'b5'], `Stage ${stage} has a different base wall`)
  maps.push(cells)
  const reserved = new Set([
    ...routeThrough(cells, [6, 12], [6, 0], true),
    ...routeThrough(cells, [4, 12], [6, 0]),
  ])
  const at = (col, row) => `${24 * (col - 6)},${24 * (6 - row)}+offsetY`

  let terrainCount = 0
  for (const [type, name] of terrain) {
    const block = stageBlock(source[name], stage, 'targetStage')
    const expected = []
    cells.forEach((row, y) => row.forEach((cell, x) => {
      if (cell[0] === type) expected.push(`${cell.slice(1).toLowerCase()},${at(x, y)}`)
    }))
    const pattern = type === 'B' || type === 'T'
      ? /setCostume "([0-9a-f]+)"\s+setXYpos (-?\d+), (-?\d+)\+offsetY\s+clone/g
      : /setXYpos (-?\d+), (-?\d+)\+offsetY\s+clone/g
    const actual = [...block.matchAll(pattern)].map((match) => type === 'B' || type === 'T'
      ? `${match[1]},${match[2]},${match[3]}+offsetY` : `,${match[1]},${match[2]}+offsetY`)
    assert.deepEqual(actual, expected, `Stage ${stage} ${name} differs from source map`)
    terrainCount += expected.length

    cells.forEach((row, y) => row.forEach((cell, x) => {
      if (cell[0] !== type || x < 5 || x > 7 || (y !== 0 && y < 11)) return
      const position = block.indexOf(`setXYpos ${at(x, y)}`)
      const guard = y === 0 ? 'if section == 0 {' : 'if section == 2 {'
      assert(block.slice(Math.max(0, position - 80), position).includes(guard), `Stage ${stage} has an unguarded seam tile`)
    }))

    if (type === 'T') {
      for (const [, x, y] of block.matchAll(/setXYpos (-?\d+), (-?\d+)\+offsetY/g)) {
        const col = Number(x) / 24 + 6
        const row = 6 - Number(y) / 24
        const tile = cells[row]?.[col]?.[0]
        assert(['X', 'T'].includes(tile), `Stage ${stage} steel overlaps terrain`)
        if (tile === 'X') assert(!reserved.has(`${col},${row}`), `Stage ${stage} steel blocks a protected route`)
      }
    }
  }
  assert(terrainCount + 3 < 300, `Stage ${stage} exceeds XBuilder clone limit`)
  terrainCounts.push(terrainCount)

  const spawns = [...stageBlock(enemy, stage, 'spawnMap').matchAll(/spawnX = (-?\d+)\s+spawnY = (-?\d+)\+spawnOffset/g)]
    .map(([, x, y]) => [Number(x), Number(y)])
  assert(spawns.length >= 8 && spawns.length <= 48, `Stage ${stage} has invalid enemy spawn count`)
  assert.equal(new Set(spawns.map(([x, y]) => `${x},${y}`)).size, spawns.length)
  assert(spawns.some(([, y]) => y >= 72), `Stage ${stage} has no upper spawn point`)
  assert(spawns.some(([, y]) => y <= -48), `Stage ${stage} has no lower spawn point`)
  const reachable = new Set(['4,12'])
  const queue = [[4, 12]]
  for (let index = 0; index < queue.length; index++) {
    const [col, row] = queue[index]
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
      const nextCol = col + dx
      const nextRow = row + dy
      const key = `${nextCol},${nextRow}`
      if (nextCol < 0 || nextCol >= 13 || nextRow < 0 || nextRow >= 13 || reachable.has(key)) continue
      if ('TRE'.includes(cells[nextRow][nextCol][0])) continue
      reachable.add(key)
      queue.push([nextCol, nextRow])
    }
  }
  for (const [x, y] of spawns) {
    const col = x / 24 + 6
    const row = 6 - y / 24
    assert.equal(cells[row]?.[col], 'X', `Stage ${stage} enemy spawn is blocked`)
    assert(reachable.has(`${col},${row}`), `Stage ${stage} enemy spawn cannot reach the base`)
  }
}

let maxComposite = 0
let compositeCount = 0
for (let top = 1; top <= 35; top++) {
  const pairs = [...stageBlock(main, top, 'stageTop').matchAll(/stageMiddle = (\d+)\s+stageBottom = (\d+)/g)]
    .map(([, middle, bottom]) => [Number(middle), Number(bottom)])
  assert(pairs.length >= 1 && pairs.length <= 8)
  for (const [middle, bottom] of pairs) {
    compositeCount++
    assert(new Set([top, middle, bottom]).size === 3)
    const total = terrainCounts[top - 1] + terrainCounts[middle - 1] + terrainCounts[bottom - 1]
    assert(total <= 250, `Composite ${top}/${middle}/${bottom} exceeds terrain budget`)
    maxComposite = Math.max(maxComposite, total)

    const combined = [top, middle, bottom].flatMap((number, section) => maps[number - 1].map((row, y) => row.map((cell, x) => {
      if (x >= 5 && x <= 7 && ((section < 2 && y >= 11) || (section > 0 && y === 0))) return 'X'
      return section < 2 && cell[0] === 'E' ? 'X' : cell
    })))
    routeThrough(combined, [4, 38], [6, 0])
  }
}

const assets = JSON.parse(readFileSync(join(project, 'assets/index.json'), 'utf8'))
assert.equal(assets.map.height, 1008)
assert.equal(assets.run.height, 360)
assert.equal(assets.camera.on, 'Player')
assert(assets.zorder.includes('PowerUp') && assets.zorder.includes('Shield'))
assert(assets.zorder.some((entry) => entry?.val === 'roundNumber'))

const soundNames = new Set(readdirSync(join(project, 'assets/sounds')))
const playedSounds = new Set(readdirSync(project).filter((name) => name.endsWith('.spx'))
  .flatMap((name) => [...readFileSync(join(project, name), 'utf8').matchAll(/\bplay "([^"]+)"/g)]
    .map((match) => match[1])))
assert.deepEqual(playedSounds, soundNames, 'Sound assets must match the sounds used by scripts')
for (const name of soundNames) {
  const directory = join(project, 'assets/sounds', name)
  const { path } = JSON.parse(readFileSync(join(directory, 'index.json'), 'utf8'))
  assert.equal(path, `${name}.ogg`)
  const data = readFileSync(join(directory, path))
  assert(data.length > 1000 && data.subarray(0, 4).toString() === 'OggS', `${name} is not a valid OGG asset`)
}

const enemyCostumes = JSON.parse(readFileSync(join(project, 'assets/sprites/Enemy/index.json'), 'utf8')).costumes
const expectedEnemyCostumes = ['', 'platinum_', 'gold_'].flatMap((prefix) =>
  ['up', 'right', 'down', 'left'].map((direction) => `${prefix}${direction}`))
assert.deepEqual(enemyCostumes.map((costume) => costume.name), expectedEnemyCostumes)
for (const costume of enemyCostumes) {
  assert(existsSync(join(project, 'assets/sprites/Enemy', costume.path)))
}
const powerUpCostumes = JSON.parse(readFileSync(join(project, 'assets/sprites/PowerUp/index.json'), 'utf8')).costumes
assert.deepEqual(powerUpCostumes.map((costume) => costume.name),
  ['tank', 'star', 'grenade', 'timer', 'helmet', 'shovel'])
for (const costume of powerUpCostumes) {
  assert(existsSync(join(project, 'assets/sprites/PowerUp', costume.path)))
}
assert.match(enemy, /enemyHP = 3/)
assert.match(enemy, /enemyHP = 5/)
assert.match(enemy, /roundNumber >= 3 && spawned >= 8 && spawned % 6 == 2/)
assert.match(enemy, /roundNumber >= 2 && spawned >= 4 && spawned % 3 == 1/)
assert.match(main, /spawned >= 30 && defeated >= 30 && activeEnemies <= 0/)
assert.match(enemy, /onCloned data => \{\s+spawned\+\+\s+activeEnemies\+\+/)
const powerUp = readFileSync(join(project, 'PowerUp.spx'), 'utf8')
const timedEffects = [...powerUp.matchAll(/(playerUpgradeUntil|enemyFreezeUntil|playerShieldUntil|baseFortifiedUntil) = timer \+ (\d+)/g)]
assert.equal(timedEffects.length, 4)
assert(timedEffects.every(([, , seconds]) => Number(seconds) === 60))
assert.match(source.Brick, /onMsg "clearBaseWall"/)
assert.match(source.Brick, /onMsg "restoreBaseWall"/)
assert.match(source.Steel, /onMsg "buildBaseWall"/)
for (const [mask, x, y] of [['8', -24, -432], ['c', 0, -432], ['4', 24, -432], ['a', -24, -456], ['5', 24, -456]]) {
  assert.match(source.Brick, new RegExp(`setCostume "${mask}"\\s+setXYpos ${x}, ${y}\\s+clone`))
}
console.log(`Verified 35 source maps, ${compositeCount} connected composites and spawn points; maximum base terrain ${maxComposite}`)
