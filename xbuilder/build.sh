#!/bin/sh
set -eu

cd "$(dirname "$0")/TankRoadQ"
zip -q -X -FS ../TankRoadQ.xbp \
  builder-meta.json \
  main.spx RoadA.spx RoadB.spx RoadC.spx RoadD.spx Player.spx Enemy.spx \
  PlayerShot.spx EnemyShot.spx Burst.spx Result.spx \
  assets/index.json assets/road.svg assets/river.svg assets/outpost.svg assets/canyon.svg \
  assets/sprites/*/index.json assets/sprites/*/*.svg assets/sprites/Result/*.png
unzip -t ../TankRoadQ.xbp
