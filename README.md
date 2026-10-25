# Classic Tank Q：XBuilder Q 版坦克大战

基于 [Battle City Remake](https://github.com/feichao93/battle-city) 改编的 XBuilder 坦克大战。保留经典坦克大战的砖墙、钢墙、河流、森林、雪地和基地防守玩法，改用明亮的 Q 版坦克与毛绒球炮弹。可直接导入的项目包是 [xbuilder/TankRoadQ.xbp](xbuilder/TankRoadQ.xbp)。

## 当前玩法

- 每次运行从原版 35 张地图中随机选取 3 张，纵向拼成 13 × 39 格的大地图；镜头跟随玩家，三段之间留有通路。
- 保护底部基地。每击毁 30 辆敌方坦克进入下一波，保留当前地图、分数和剩余生命。场上最多 10 辆敌军，每 3 秒尝试从全图可到达基地的空位随机生成 1 辆。
- 第 1 波只有普通坦克（1 血）；第 2 波混入白金坦克（3 血）；第 3 波起再混入黄金坦克（5 血）。每波都先出现普通坦克，升级后仍会混合出现低阶坦克。
- 保留六种经典道具：坦克加命、星星提升射速、手雷清屏、时钟冻结敌军、头盔提供护盾、铁锹把基地周围的砖墙升级为钢墙。升级波的首件掉落道具固定为铁锹。星星、时钟、头盔和铁锹的效果持续 60 秒；加命与手雷拾取后立即生效。

方向键或 WASD 移动，空格射击。玩家初始有 3 条命；钢墙无法被炮弹击毁，河流会阻挡坦克。

游戏包含射击、碰撞、爆炸、拾取道具、进入下一波和失败音效，使用仓库原版的 OGG 声音资源。

## 导入 XBuilder 并运行

1. 下载仓库中的 [TankRoadQ.xbp](xbuilder/TankRoadQ.xbp)。如果 XBuilder 中已有需要保留的项目，先从顶部项目菜单导出备份。
2. 在 XBuilder 顶部项目菜单选择导入项目，选中 `TankRoadQ.xbp`。导入会替换当前项目的游戏内容。
3. 保存项目，点击“跑 / Run”进入游戏。

更新本地代码或 GitHub 仓库后，已打开的 XBuilder 项目不会自动同步；需要重新导入新生成的 `.xbp` 文件。

## 从源码生成项目包

需要 Node.js 18 或更高版本，以及 `zip` 和 `unzip`。在仓库根目录运行：

```bash
sh xbuilder/build.sh
```

脚本从 [src/stages](src/stages) 的 35 张原版地图生成地形、三图组合、敌军出生点和美术资源，校验地图与导入包，然后更新 [xbuilder/TankRoadQ.xbp](xbuilder/TankRoadQ.xbp)。XBuilder 游戏脚本及精灵资源位于 [xbuilder/TankRoadQ](xbuilder/TankRoadQ)；更详细的规则和目录说明见 [XBuilder 说明](xbuilder/README.md)。实际运行效果需在 XBuilder 中点击 Run 检查。

## 原版网页项目

仓库还保留了上游的 TypeScript/React 网页实现，主要用于参考地图和原版规则。运行该网页版本需要 pnpm：

```bash
pnpm install
pnpm dev
```

原版在线演示：[battle-city.js.org](https://battle-city.js.org)。项目沿用上游的 [MIT 许可证](LICENSE)。
