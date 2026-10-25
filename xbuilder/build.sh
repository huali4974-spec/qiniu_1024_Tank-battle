#!/bin/sh
set -eu

cd "$(dirname "$0")/TankRoadQ"
node ../generate-classic.mjs
zip -q -X -FS ../TankRoadQ.xbp \
  builder-meta.json \
  main.spx Brick.spx Steel.spx Eagle.spx Player.spx Enemy.spx \
  PlayerShot.spx EnemyShot.spx Burst.spx Result.spx \
  assets/index.json assets/arena.svg \
  assets/sprites/*/index.json assets/sprites/*/*.svg assets/sprites/Result/*.png
unzip -t ../TankRoadQ.xbp
