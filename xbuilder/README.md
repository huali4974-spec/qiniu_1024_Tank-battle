# XBuilder 原生版：Tank Road Q v1.0

这个目录提供可导入 XBuilder 的 spx 项目。仓库根目录的 React/PixiJS `v0` 保留作玩法参考；XBuilder 运行时不依赖它。

## 构建和导入

在仓库根目录运行 `sh xbuilder/build.sh`，生成 `xbuilder/TankRoadQ.xbp`。

先在 XBuilder 顶部项目菜单导出当前项目作备份。导入 `.xbp` 会**替换当前项目的游戏内容**，不会保留已有的松鼠、草地和脚本。随后在同一菜单选择导入，选中 `TankRoadQ.xbp`，保存并点击 Run。导入后可以继续在 XBuilder 里编辑舞台、精灵、造型和脚本。

游戏使用默认的 480 x 360 舞台。WASD 或方向键移动，空格射击；击毁 10 辆敌方坦克通关。玩家有 3 条命，左右两侧显示分数和剩余生命。

## 源文件

- `TankRoadQ/main.spx`：分数、生命和对局状态。
- `TankRoadQ/*.spx`：道路、玩家、敌人、弹丸和结果画面的行为。
- `TankRoadQ/assets/index.json`：舞台、显示层级和监视器。
- `TankRoadQ/assets/sprites/*/index.json`：造型与碰撞区域。
- `TankRoadQ/assets/**/*.svg`：原创 Q 版游戏素材。

结构遵循 [XBuilder 的项目格式](https://github.com/goplus/builder/blob/dev/docs/product/index.zh.md)和 [XBP 打包实现](https://github.com/goplus/builder/blob/dev/spx-gui/src/models/common/xbp.ts)。本地已检查 JSON、SVG 和 ZIP 结构；最终的 spx 编译与游戏运行需要在 XBuilder 中验证。
