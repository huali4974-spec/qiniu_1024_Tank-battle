#!/bin/sh
set -eu

cd "$(dirname "$0")/TankRoadQ"
node ../generate-classic.mjs
node ../verify-classic.mjs
zip -q -X -FS ../TankRoadQ.xbp \
  builder-meta.json \
  main.spx Brick.spx Steel.spx River.spx Snow.spx Forest.spx Eagle.spx Player.spx Enemy.spx \
  PlayerShot.spx EnemyShot.spx Burst.spx Result.spx PowerUp.spx Shield.spx \
  assets/index.json assets/arena.svg \
  assets/sprites/*/index.json assets/sprites/*/*.svg assets/sprites/Result/*.png \
  assets/sounds/*/index.json assets/sounds/*/*.ogg
unzip -t ../TankRoadQ.xbp
