# Stronghold Protocol: Alliance — Typography & Damage FX Patch

[English Description](#english-description) | [中文说明](#中文说明)

---

## 📦 中文说明

这是一个针对《明日方舟》季节性自走棋塔防同人复刻项目 **[Stronghold-Protocol: Alliance](https://github.com/sganggs/Stronghold-Protocol)** 的非官方视觉与机制增强补丁。

本项目旨在修复原版中略显粗糙的字体和战斗反馈，完美还原方舟官方的工业美学及严谨的暴击、元素损伤机制。

### ✨ 核心特性
1. **官方级字体栈适配**：
   - 全局界面与数字引入 **Novecento Wide** 宽体几何字形，告别原版生硬的 Bender 字体。
   - 运行时动态烘焙位图字体，完美支持 **FOT-Rodin Pro**（属性风暴风）与 **Skurri**（街机硬派风）战斗跳字。
2. **严谨的暴击（红字）机制**：
   - 还原官方 1.5 倍期望伤害判定（$X_b \ge 1.5 \times X_a$）。
   - 触发暴击时自动切换为加粗字重（Bold 700）并等比放大字号，不与伤害类型颜色混淆。
3. **元素损伤与伤害精细分流**：
   - **元素损伤（打条阶段）**：白底字体 + 对应四大元素的专属彩色描边。
   - **元素伤害（爆条结算阶段）**：对应元素的纯色填充、无描边字形。
4. **游戏内置高级微调面板**：
   - 内置 5 大数字风格预设（原版经典、官方还原、属性风暴、街机硬派、自定义）。
   - 支持独立调整 12 项伤害类型的颜色、渐变、描边、字号缩放比例，且设置实时自动保存。
5. **自动化补丁与一键无损还原**：
   - 附带智能的 `apply-font-patch.mjs` 脚本，自动备份原文件（`.bak`）。
   - 支持 `node apply-font-patch.mjs --restore` **秒级一键无损回滚**，无需重新下载游戏包。

### 🚀 快速使用指南
1. 将下载好的 **`fot-rodin-b.otf`**（或 m/ub 等字重）和 **`skurri.ttf`** 放入游戏目录的 **`public/fonts/`** 文件夹中。
2. 将 **`apply-font-patch.mjs`** 放入项目根目录（`Stronghold-Protocol` 文件夹下）。
3. 在终端（Terminal / PowerShell）中运行：
   ```bash
   node apply-font-patch.mjs

启动游戏服务器（npm start），在浏览器中按 Ctrl + F5 强制刷新即可体验！
若需撤销修改：运行 node apply-font-patch.mjs --restore 即可瞬间恢复原版。


## 🌍 English Description
This is an unofficial visual and mechanic enhancement patch for Stronghold-Protocol: Alliance, an open-source Arknights auto-chess tower defense fan remake.
### ✨ Key Features
1. **Authentic Font Integration**:
Replaces default numerals with Novecento Wide for clean, industrial-grade geometric headers.
Dynamically bakes runtime bitmap fonts supporting FOT-Rodin Pro and Skurri for high-impact combat text.
2. **Authentic Critical Hit Mechanics**:
Implements 1.5x expected damage crit evaluation.
Triggers dynamic bold weights (700) and scale-ups on crits without cluttering element color identities.
3. **Element EP/HP Damage Separation**:
EP Accumulation (Gauging): White text with element-exclusive colored strokes.
HP Burst Damage: Solid fills with zero stroke.
4. **Interactive In-Game Customization Suite**:
Includes 5 preset modes (Classic, Authentic, Elemental Storm, Arcade Tactical, and Custom).
Features a granular drawer panel for fine-tuning 12 distinct damage styles (colors, dual-gradients, and strokes) with local storage persistence.
5. **Zero-Risk Automated Patching**:
Bundled with a smart Node.js patch script (apply-font-patch.mjs) featuring automatic file backups (.bak).
Supports node apply-font-patch.mjs --restore for an instant, lossless rollback to vanilla assets.
### 🚀 Quick Start
Place font files (fot-rodin-b.otf, skurri.ttf) into the public/fonts/ directory.
Place apply-font-patch.mjs in the project root folder.
Run the automated patch script: node apply-font-patch.mjs
Start the server (npm start), open the browser, and press Ctrl + F5.
To revert: Run node apply-font-patch.mjs --restore at any time.
### ⚠️ Disclaimer
This is an unofficial, non-commercial fan-made modification created for study and personal use. All Arknights-related names, art, and data belong to Hypergryph / Yostar. Not affiliated with or endorsed by Hypergryph.