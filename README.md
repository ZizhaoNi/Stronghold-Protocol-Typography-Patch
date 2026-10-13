# 《卫戍协议》伤害数字美化补丁 · 使用说明
# Stronghold Protocol Damage-Number Patch · User Guide

**适用游戏 / For：** Stronghold Protocol（明日方舟「卫戍协议：盟约」同人网页游戏）v0.2.6.1
**补丁文件 / Patch file：** `apply-font-patch.mjs`

> 每段中文后面的引用块是英文对照 / The quoted block after each Chinese paragraph is its English version.

---

## 一、这个补丁是干什么的？ / What does this patch do?

一句话：**只改好看，不改好玩。** 它把战斗中飘出的伤害数字彻底翻新——字体、颜色、大小、出现位置、飘动快慢都可以自己调，而且所有调整都在游戏设置里点选完成，不需要再碰任何文件。游戏的规则、数值、玩法完全不受影响。

> In one sentence: **it changes how the game looks, not how it plays.** This patch gives the floating damage numbers in battle a full makeover — font, colors, size, position and floating speed are all adjustable, and everything is done inside the game's settings menu. No game rules or balance numbers are touched.

---

## 二、打完补丁能得到什么？ / What do you get?

### 1. 五种一键切换的数字风格 / Five one-click number styles

| 风格 Style | 效果 Effect |
|---|---|
| 原版经典 Classic | 游戏原本的彩色渐变风格 / The game's original colorful gradient look |
| 官方还原 Authentic | 模仿《明日方舟》本尊的单色数字（打完补丁后默认就是它）/ Faithful to the official Arknights look; this is the default after patching |
| 属性风暴 Elemental | 换用 FOT-Rodin 字体，四种元素各有专属配色 / Uses the FOT-Rodin font; each element type gets its own color |
| 街机硬派 Arcade | 换用 Skurri 字体，复古街机味 / Uses the Skurri font for a retro arcade feel |
| 自定义 Custom | 下面列出的项目全部手动来调 / Everything below, fully manual |

### 2. 十二类数字独立配色 / Twelve number types, each with its own colors

物理、法术、真实、治疗，加上灼燃 / 神经 / 凋亡 / 侵蚀各自的「打条」（损伤累积阶段的数字）与「爆条」（损伤爆发扣血时的数字），一共 12 类。每一类都可以单独设置主色、双色渐变、描边开关和描边颜色；也可以一键把八种元素数字统一成同一个颜色。

> Physical, Arts, True, Heal — plus Burn / Neural / Apoptosis / Erosion, each split into "build-up" numbers (while the gauge fills) and "burst" numbers (when it explodes into HP damage): 12 types in all. Each type has its own main color, gradient option, and outline color. One button can also unify all eight element types to a single color.

### 3. 一块新的「高级微调」设置面板 / A new "Fine-Tuning" settings panel

在游戏设置里新增，点「展开」即可使用：

- 整体字号、治疗数字的缩小比例 / Overall number size, heal-number size ratio
- 数字出现的高度、左右抖动范围、上浮速度 / Spawn height, horizontal jitter, floating speed
- 同一个目标最多同时显示几个数字 / Max numbers shown at once on one target
- 数字合并相加、互相避让，各自可开关 / Merge numbers / dodge overlaps, each toggleable
- 暴击大字、暴击加粗，各自可开关 / Big crit numbers, bold crit numbers, each toggleable
- 暴击判定方式四选一：官方暴击比例 / 单发伤害≥目标生命的 18% / 满足任意一条 / 仅放大显示 / Four crit trigger options: official crit ratio · single hit ≥ 18% of target HP · either one · enlarge only
- 还能从下拉列表选择或直接手填你电脑上的任意字体名 / Pick a font from the dropdown, or type the name of any font installed on your computer

### 4. 其他变化 / Other changes

- 界面上的数字字体也能跟随切换（Novecento、Bender、Rodin、Skurri、Oxanium、Rajdhani、系统默认）/ The UI number font can be switched too.
- 新增的所有选项会自动跟随游戏语言显示：简体中文、繁体中文、English、日本語、한국어 / All new options auto-translate with the game's language.
- 顺带微调了六角数值徽章和商店等级卡片，让它们在新字体下显示得更居中 / Hex badges and shop level cards were slightly adjusted to sit centered under the new fonts.

---

## 三、使用前的两个条件 / Two things you need first

1. **电脑上装了 Node.js。** 运行这个游戏本身就需要它。没装的话，去 [nodejs.org](https://nodejs.org) 下载 LTS 版本，一路「下一步」装完即可。
2. **游戏版本是 v0.2.6.1。** 游戏更新后内部文件会变，补丁可能找不到要改的位置（它会明确提示是哪一步），那时需要等补丁更新后再用。

> 1. **Node.js installed.** You already need it to run the game. If not, download the LTS version from [nodejs.org](https://nodejs.org) and install with defaults.
> 2. **Game version v0.2.6.1.** After a game update the patch may no longer find what to change — it will tell you clearly when that happens.

---

## 四、怎么打补丁（Windows） / How to apply the patch (Windows)

1. 确认 `apply-font-patch.mjs` 就放在游戏主文件夹里——和 `public`、`server` 两个文件夹同一层。
2. 建议先关掉正在运行的游戏（运行游戏的服务器窗口里按 `Ctrl + C`）。
3. 打开游戏主文件夹，点一下上方的地址栏，输入 `cmd` 后回车——会弹出一个黑色命令行窗口，并且已经定位在这个文件夹。
4. 输入下面这行命令，回车：

   ```
   node apply-font-patch.mjs
   ```

5. 看到每个文件都显示 `[成功] 已更新`、最后显示「补丁已应用完成」就大功告成。按平时的方式重新启动游戏，浏览器里按 `Ctrl + F5` 强制刷新页面即可。

> 1. Make sure `apply-font-patch.mjs` sits in the game's main folder — the same level as the `public` and `server` folders.
> 2. Close the game if it's running (`Ctrl + C` in the server window).
> 3. Open the game folder, click the address bar, type `cmd` and press Enter — a black command window opens, already pointed at that folder.
> 4. Type `node apply-font-patch.mjs` and press Enter.
> 5. When every file reports success, restart the game as usual and hard-refresh the browser with `Ctrl + F5`.

---

## 五、怎么一键还原 / How to restore everything

同样打开命令行（同第四节第 3 步），输入：

```
node apply-font-patch.mjs --restore
```

所有被改过的文件会立刻恢复成打补丁之前的原样，不留任何痕迹。之后想再打补丁，直接重复第四节的步骤即可，不需要做别的准备。

> Open the command window the same way as in section 四, then run: `node apply-font-patch.mjs --restore`. Every modified file is instantly restored to its pre-patch state. To re-apply the patch later, just repeat section 四 — no extra steps needed.

---

## 六、它改了哪些东西？安全吗？ / What does it touch? Is it safe?

- 补丁只修改游戏自带的 10 个文件，不删除任何东西，也不联网。
- 第一次打补丁时，每个被修改的文件都会自动留一份备份（原文件名后加 `.bak`）。
- 重复运行补丁不会「越打越乱」：每次都是从最初备份的原始文件重新改起。
- 还原命令会把备份写回原文件并删掉备份，干干净净。
- 两款新字体（FOT-Rodin、Skurri）已经放在游戏的 `public/fonts` 文件夹里，**无需另外下载**。

> - Only 10 game files are modified; nothing is deleted and nothing goes online.
> - On first run, every modified file gets an automatic backup copy (same name + `.bak`).
> - Running the patch again never stacks up changes — it always starts over from the original backup.
> - The restore command writes the backups back and removes them.
> - The two new fonts (FOT-Rodin, Skurri) already ship in `public/fonts` — **nothing to download**.

修改文件清单（仅供留档）/ List of modified files (for the record)：

| 文件 File | 改了什么 What changed |
|---|---|
| `public/fonts/fonts.css` | 注册两款新字体 / Registers the two new fonts |
| `public/css/theme.css` | 切换默认数字字体 / Switches the default number font |
| `public/css/components.css` | 六角徽章微调 / Hex badge tweak |
| `public/css/screens/game-shop.css` | 商店等级卡片微调 / Shop level-card tweak |
| `server/sim/damage.js` | 伤害数字分类与暴击判定 / Damage typing and crit detection |
| `public/js/render/app.js` | 新设置项的读取 / Reads the new settings |
| `public/js/render/style.js` | 12 类数字与样式的对应 / Maps the 12 number types to styles |
| `public/js/render/fx/fonts.js` | 数字字体的动态生成 / Builds number fonts on the fly |
| `public/js/render/fx/numbers.js` | 数字的大小、位置与飘动 / Number size, position and motion |
| `public/js/ui/settings.js` | 设置界面新增面板 / The new settings panel |

---

## 七、打完补丁后，去哪里调设置？ / Where to tweak after patching

进入游戏 → 打开「设置」→ 开启「显示伤害数字」→ 这里会出现「数字风格」五选一，以及「高级微调」面板（点「展开」）。所有调整即时生效，并自动保存在浏览器里，下次打开游戏还在。

> In game, open Settings → enable "Damage Numbers" → you'll find the five-style picker and the "Fine-Tuning" panel (click "Expand"). Every change takes effect immediately and is saved in your browser automatically.

---

## 八、常见问题 / FAQ

**Q1：运行时提示「未匹配到目标代码」？**
游戏版本和补丁对不上。确认游戏是 v0.2.6.1；如果是更新的游戏版本，请等补丁更新。

**Q2：改了设置没反应？**
先按 `Ctrl + F5` 强制刷新页面；数字样式的差异开一局新战斗看得最清楚。

**Q3：我调的颜色和字号存在哪？会丢吗？**
存在浏览器本地，正常关闭不会丢。但清空浏览器数据、换浏览器或换电脑后需要重调一遍。还原补丁不会影响这些个人设置。

**Q4：还原之后想再打补丁，还要先备份吗？**
不用，补丁每次都会自己处理备份，直接运行即可。

> **Q1: "Target code not found" warning?** The game version doesn't match the patch. Make sure the game is v0.2.6.1; for a newer game, wait for an updated patch.
> **Q2: Settings not taking effect?** Hard-refresh with `Ctrl + F5` first; start a new battle to see number-style changes clearly.
> **Q3: Where are my colors and sizes saved?** In your browser. They survive normal restarts, but clearing browser data, switching browsers or computers means setting them again. Restoring the patch does not touch these personal settings.
> **Q4: Do I need to back up before re-patching after a restore?** No — the patch handles backups itself every time. Just run it.

---

## 九、声明 / Disclaimer

这是非官方、非商业的同人修改，仅供学习与个人娱乐。《明日方舟》相关名称、美术与数据的版权归鹰角网络 / Yostar 所有，本补丁与官方无任何关联。

> This is an unofficial, non-commercial fan-made modification for study and personal use only. All Arknights-related names, art, and data belong to Hypergryph / Yostar. Not affiliated with or endorsed by them.
