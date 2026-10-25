import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
const stageBlock = (text, stage) => {
  const marker = `stageIndex == ${stage} {`
  const start = text.indexOf(marker)
  assert(start >= 0, `Missing stage ${stage}`)
  const next = stage < 35 ? text.indexOf(`} else if stageIndex == ${stage + 1} {`, start) : text.length
  assert(next > start, `Missing end of stage ${stage}`)
  return text.slice(start, next)
}

let maxTerrain = 0
for (let stage = 1; stage <= 35; stage++) {
  const data = JSON.parse(readFileSync(resolve(here, `../src/stages/stage-${stage}.json`), 'utf8').replace(/^\uFEFF/, ''))
  const cells = data.map.map((row) => row.trim().split(/\s+/))
  assert.equal(cells.length, 13)
  assert(cells.every((row) => row.length === 13))
  assert.equal(cells[12][4], 'X')
  assert(cells[12][6].startsWith('E'))
  const at = (col, row) => `${24 * (col - 6)},${24 * (6 - row)}`

  let terrainCount = 0
  for (const [type, name] of terrain) {
    const block = stageBlock(source[name], stage)
    const expected = []
    cells.forEach((row, y) => row.forEach((cell, x) => {
      if (cell[0] === type) expected.push(`${cell.slice(1).toLowerCase()},${at(x, y)}`)
    }))
    const pattern = type === 'B' || type === 'T'
      ? /setCostume "([0-9a-f]+)"\s+setXYpos (-?\d+), (-?\d+)\s+clone/g
      : /setXYpos (-?\d+), (-?\d+)\s+clone/g
    const actual = [...block.matchAll(pattern)].map((match) => type === 'B' || type === 'T'
      ? `${match[1]},${match[2]},${match[3]}` : `,${match[1]},${match[2]}`)
    assert.deepEqual(actual, expected, `Stage ${stage} ${name} differs from source map`)
    terrainCount += expected.length

    if (type === 'T') {
      for (const [, x, y] of block.matchAll(/setXYpos (-?\d+), (-?\d+)/g)) {
        const col = Number(x) / 24 + 6
        const row = 6 - Number(y) / 24
        assert(['X', 'T'].includes(cells[row]?.[col]?.[0]), `Stage ${stage} steel overlaps terrain`)
      }
    }
  }
  maxTerrain = Math.max(maxTerrain, terrainCount + 3)
  assert(terrainCount + 3 < 300, `Stage ${stage} exceeds XBuilder clone limit`)

  const spawns = [...stageBlock(enemy, stage).matchAll(/spawnX = (-?\d+)\s+spawnY = (-?\d+)/g)]
    .map(([, x, y]) => [Number(x), Number(y)])
  assert(spawns.length >= 8 && spawns.length <= 24, `Stage ${stage} has invalid enemy spawn count`)
  assert.equal(new Set(spawns.map(([x, y]) => `${x},${y}`)).size, spawns.length)
  for (const [x, y] of spawns) {
    assert.equal(cells[6 - y / 24]?.[x / 24 + 6], 'X', `Stage ${stage} enemy spawn is blocked`)
  }
}

console.log(`Verified 35 source maps, terrain layouts and spawn points; maximum terrain count ${maxTerrain}`)
