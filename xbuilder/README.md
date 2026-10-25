# XBuilder 原生版：Classic Tank Q

`TankRoadQ.xbp` 是可导入 XBuilder 的项目包，包含仓库原版 `src/stages/` 的 35 张 13×13 地图。每次点击 Run 都会随机选择关卡，顶部显示关卡号。砖墙、钢墙、河流、森林和雪地使用明亮的 Q 版渲染，玩家和敌方坦克使用四向装甲造型，弹丸是毛绒球。

## 导入与游玩

在 XBuilder 顶部项目菜单先导出当前项目备份，再导入本目录的 `TankRoadQ.xbp`，保存后点击 Run。导入会替换当前项目的游戏内容；GitHub 文件更新也不会自动同步到已打开的 XBuilder 项目，因此更新后需要重新导入。

方向键或 WASD 移动，空格射击。保护底部基地，击毁 20 辆敌方坦克通关。玩家有 3 条命；一颗炮弹最多击毁一块砖，钢墙不会被炮弹击毁，河流会阻挡坦克。每次启动会在所选关卡的空位额外随机放置最多 3 块钢墙。敌军从该地图上半部的空位随机出现，至少间隔 4 秒，场上最多 4 辆，并在碰到障碍时随机转向。

## 从源码构建

仓库根目录运行 `sh xbuilder/build.sh`。脚本需要 Node.js 18 及以上、`zip` 与 `unzip`。`generate-classic.mjs` 从 35 张原版关卡 JSON 生成所有地形、每关敌军出生点、随机钢墙候选空位和四向坦克图，随后打包到 `TankRoadQ.xbp`。

源码在 `TankRoadQ/`：`main.spx` 保存对局状态，其他 `.spx` 文件是精灵行为，`assets/index.json` 定义舞台和层级，`assets/sprites/` 包含造型与碰撞配置。结算面板使用预渲染 PNG，避免 XBuilder 的 SVG 文字显示成方框。

项目结构遵循 [XBuilder 项目格式](https://github.com/goplus/builder/blob/dev/docs/product/index.zh.md)。本地构建会验证 ZIP；最终的 spx 编译和操作手感仍以 XBuilder 中实际运行结果为准。
