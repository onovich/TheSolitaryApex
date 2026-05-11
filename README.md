# The Solitary Apex
The Solitary Apex is a canvas climbing prototype rebuilt into a verified Vite + React project with separated data, engine, hook, and view layers.<br/>**The Solitary Apex 已被重建为一个经过构建验证的 Vite + React 工程，并拆分为 data、engine、hook 与 view 分层。**

## Overview
- The original monolithic prototype is preserved in origin/index.html as a fallback snapshot during the migration.<br/>**原始单体原型保存在 origin/index.html 中，作为迁移过程中的可回退快照。**
- The current codebase keeps gameplay rules, wall generation, stamina pressure, chalk boost, and fail states aligned with the original browser prototype.<br/>**当前代码库保留了与原始浏览器原型一致的玩法规则、岩点生成、耐力压力、镁粉增益与失败判定。**
- Core state progression and rule evaluation live in src/logic/engine, while React now focuses on input bridging, lifecycle management, and UI composition.<br/>**核心状态推进与规则判定位于 src/logic/engine，React 现在主要负责输入桥接、生命周期管理与 UI 组装。**

## Architecture
- src/data stores gameplay constants, palette values, and localized UI text for future tuning without touching rendering code.<br/>**src/data 用于存放玩法常量、配色参数与本地化 UI 文案，后续调参时无需直接修改渲染代码。**
- src/logic/engine contains wall generation, limb attachment, stamina updates, particle state, and fail-condition logic that can be migrated toward Unity-friendly runtime code later.<br/>**src/logic/engine 包含岩点生成、肢体吸附、耐力更新、粒子状态与失败条件逻辑，后续可继续迁移为更适合 Unity 的运行时代码。**
- src/logic/hooks keeps the requestAnimationFrame loop and pointer input orchestration isolated from the view layer.<br/>**src/logic/hooks 将 requestAnimationFrame 主循环与指针输入编排从视图层中隔离出来。**
- src/view/screens and src/view/components keep the canvas renderer, HUD, and restart overlay assembled as presentation concerns only.<br/>**src/view/screens 与 src/view/components 将画布渲染、HUD 和重开浮层限定在表现层职责内。**
- The project is migration-oriented rather than a full Unity port today: simulation boundaries are prepared, while the final canvas drawing still lives in the web view layer.<br/>**当前项目属于面向迁移的架构准备，而不是完整的 Unity 移植：模拟边界已经建立，但最终的 Canvas 绘制仍位于 Web 视图层。**

## Getting Started
- Install dependencies with npm install.<br/>**使用 npm install 安装依赖。**
- Start the local development server with npm run dev.<br/>**使用 npm run dev 启动本地开发服务器。**
- Build the production bundle with npm run build.<br/>**使用 npm run build 生成生产构建。**

## Deployment
- GitHub Pages is configured through .github/workflows/deploy.yml and expects the repository path base /TheSolitaryApex/.<br/>**GitHub Pages 通过 .github/workflows/deploy.yml 配置，并使用 /TheSolitaryApex/ 作为仓库路径基座。**
- The deployment workflow uses the official GitHub Pages Actions pipeline and should be paired with the repository Pages Source setting set to GitHub Actions.<br/>**部署流程使用 GitHub 官方 GitHub Pages Actions 流水线，并需要在仓库设置中将 Pages Source 切换为 GitHub Actions。**
- The expected public URL is https://onovich.github.io/TheSolitaryApex/ after the workflow finishes.<br/>**工作流完成后，预期公开地址为 https://onovich.github.io/TheSolitaryApex/。**

## Status
- npm run build has been executed successfully against the current repository state.<br/>**已经基于当前仓库状态成功执行过 npm run build。**
- The repository now has a runnable web entry, preserved origin backup, and a deployment path for GitHub Pages.<br/>**仓库现在具备可运行的 Web 入口、保留的 origin 备份，以及 GitHub Pages 部署路径。**
