# XBuilder 原生版：Classic Tank Q

`TankRoadQ.xbp` 是可导入 XBuilder 的项目包，基于仓库原版 `src/stages/stage-1.json` 的 13×13 第一关布局。背景、砖墙和钢墙使用明亮的 Q 版渲染，玩家和敌方坦克使用四向装甲造型，弹丸是毛绒球。

## 导入与游玩

在 XBuilder 顶部项目菜单先导出当前项目备份，再导入本目录的 `TankRoadQ.xbp`，保存后点击 Run。导入会替换当前项目的游戏内容；GitHub 文件更新也不会自动同步到已打开的 XBuilder 项目，因此更新后需要重新导入。

方向键或 WASD 移动，空格射击。保护底部基地，击毁 20 辆敌方坦克通关。玩家有 3 条命，砖墙可被击毁；每次启动会在关卡空位随机放置 3 块钢墙，钢墙会阻挡坦克和弹丸。敌军从顶部 3 个经典出生点随机出场，并在碰到障碍时随机转向。

## 从源码构建

仓库根目录运行 `sh xbuilder/build.sh`。脚本需要 Node.js 18 及以上、`zip` 与 `unzip`。`generate-classic.mjs` 从第一关 JSON 生成砖墙坐标、钢墙候选空位、墙体造型和四向坦克图，随后打包到 `TankRoadQ.xbp`。

源码在 `TankRoadQ/`：`main.spx` 保存对局状态，其他 `.spx` 文件是精灵行为，`assets/index.json` 定义舞台和层级，`assets/sprites/` 包含造型与碰撞配置。结算面板使用预渲染 PNG，避免 XBuilder 的 SVG 文字显示成方框。

项目结构遵循 [XBuilder 项目格式](https://github.com/goplus/builder/blob/dev/docs/product/index.zh.md)。本地构建会验证 ZIP；最终的 spx 编译和操作手感仍以 XBuilder 中实际运行结果为准。
