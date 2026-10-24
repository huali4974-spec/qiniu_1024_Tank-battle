#!/bin/sh
set -eu

cd "$(dirname "$0")/TankRoadQ"
zip -q -X -FS ../TankRoadQ.xbp \
  builder-meta.json \
  main.spx RoadA.spx RoadB.spx Player.spx Enemy.spx \
  PlayerShot.spx EnemyShot.spx Burst.spx Result.spx \
  assets/index.json assets/road.svg \
  assets/sprites/*/index.json assets/sprites/*/*.svg
unzip -t ../TankRoadQ.xbp
