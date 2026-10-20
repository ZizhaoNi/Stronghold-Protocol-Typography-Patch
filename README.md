# 《卫戍协议》伤害数字美化补丁 · 使用说明
# Stronghold Protocol Damage-Number Patch · User Guide

**适用游戏 / For：** Stronghold Protocol（明日方舟「卫戍协议：盟约」同人网页游戏）v0.3.1
**补丁文件 / Patch file：** `apply-font-patch.mjs`

> 每段中文后面的引用块是英文对照 / The quoted block after each Chinese paragraph is its English version.

---

## 一、这个补丁是干什么的？ / What does this patch do?

把战斗中飘出的伤害数字彻底翻新——字体、颜色、大小、出现位置、飘动快慢都可以自己调，而且所有调整都在游戏设置里点选完成，不需要再碰任何文件。游戏的规则、数值、玩法完全不受影响。

> This patch gives the floating damage numbers in battle a full makeover — font, colors, size, position and floating speed are all adjustable, and everything is done inside the game's settings menu. No game rules or balance numbers are touched.

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

在游戏设置里新增，点「展开」即可使用。只要调整了其中任何一项，顶部的风格就会自动变成「自定义」：

- 整体字号、治疗数字的缩小比例 / Overall number size, heal-number size ratio
- 「官方数字行为」总开关：点亮 = 数字走官方管线（见第 6 节）且高度 / 抖动 / 上浮速度 / 同目标上限 / 合并 / 避让六项全在官方出厂值——点亮时点击会关闭开关、回到原版跳字管线并把六项恢复原版默认；六项一旦偏离出厂值，开关会自动熄灭，但**数字仍走官方管线**、所见即所得，再点开关即恢复官方出厂值 / An "Official Number Behavior" switch: lit = the official pipeline (§6) with the six behavior knobs (height / jitter / rise / cap / merge / dodge) all at the official factory values — clicking it while lit switches to the classic pipeline and restores the author's defaults. If any of the six deviates, the switch dims automatically, but **the numbers stay on the official pipeline** (what you see is what you get); clicking it again snaps all six back to the official factory values
- 数字出现的高度、左右抖动范围（以「格」计，与原版同单位）、上浮速度——两条管线里都自由生效，高度同时也控制官方风格的 SP / COST 弹字 / Spawn height, horizontal jitter (in tiles, the author's own unit), floating speed — free to tune in both pipelines, and the height also drives the Authentic-style SP / COST popups
- 同一个目标最多同时显示几个数字，最高档 **∞ 无上限**（官方出厂值）/ Max numbers per target, top step **∞ unlimited** (the official factory value)
- 数字合并相加、互相避让，各自可开关（官方出厂为全关）/ Merge numbers / dodge overlaps, each toggleable (off at the official factory settings)
- 暴击入场动画（快速放大→缩小）开关，作用于官方数字行为下的暴击 / Crit pop-in toggle — crits under Official Number Behavior
- 暴击大字、暴击加粗，各自可开关 / Big crit numbers, bold crit numbers, each toggleable
- 暴击判定方式四选一：官方暴击比例 / 单发伤害≥目标生命的 18% / 满足任意一条 / 仅放大显示 / Four crit trigger options: official crit ratio · single hit ≥ 18% of target HP · either one · enlarge only
- 还能从下拉列表选择或直接手填你电脑上的任意字体名 / Pick a font from the dropdown, or type the name of any font installed on your computer

### 4. 官方风格的 COST / SP 弹字 / Official-style COST / SP popups

**这些弹字只在「官方还原」风格下出现，其他风格一律保持原样**（只加文字，不改任何动画）。

在官方还原风格里有两档显示，由原「官方伤害数字」按钮（现已更名为**「仅显示官方数字」**）切换：

- **按钮关闭（默认）：** 所有费用变动都弹字——回费是金色 `COST 10`（#E0A32C），扣费是红色 `COST −5`（#D4121A，含行商特性扣费、个别干员的特性 / 复活类扣费）；技力方面，只有天赋、技能描述、盟约等**明确写出的回复手段**弹青色 `SP 1`（#6FC6D2），时间流逝、攻击、受击的自然回复不弹字，与官方一致。
- **按钮开启（完全对齐官方本尊）：** 费用只弹冲锋手、情报官等**跟随攻击的回费**和**行商扣费**，技能型回费不再弹字；技力规则不变。

弹字使用专用白色小字体染色，颜色精确，字号与治疗数字相当，并跟随「高级微调」里的整体字号滑块。弹字位置与官方伤害数字一致：挂在单位头顶正中央上方（同样随模型身高取等比、跟随「高度」滑块；与治疗数字一样，这类小字的间距取常规数字的 0.8 倍、稍低），不再贴在胸口、也不再有向右的偏移；非官方风格的 `+N` 回费弹字仍在原位置。

> **These popups appear only in the "Authentic" style; every other style keeps the game's original look.** No animations are changed — text only.
>
> Within the Authentic style there are two levels, switched by the old "Official Damage Numbers" button (renamed to **"Official Numbers Only"**):
>
> - **Button off (default):** every DP change pops text — gains in gold `COST 10` (#E0A32C), spends in red `COST −5` (#D4121A: the Merchant trait's pays and a few operators' trait / revive-style costs). For SP, only sources explicitly described in talents / skill texts / bonds pop a cyan `SP 1` (#6FC6D2); natural recovery (time, attacking, being hit) shows nothing, same as official.
> - **Button on (fully matches the official game):** DP only pops for attack-followed gains (Charger / Agent kills) and Merchant spends — skill-based gains no longer show text; SP rules unchanged.
>
> The popups use a dedicated small white font tinted to exact colors, sized like heal numbers (heals were bumped to match them exactly), following the overall size slider in "Fine-Tuning". They sit where the official damage numbers sit — dead-center above the unit's head, proportionally to the model's height and following the height slider, at 0.8× the regular gap like heals — instead of at the chest, with no rightward offset anymore; the non-Authentic `+N` cost label keeps its original spot.

### 5. 官方规则的红字（暴击）判定 / Official-rule red numbers (crits)

修复了红字触发机制，对齐官方《明日方舟》的「伤害红字」规则（参考 PRTS 社区文档）。核心是按官方规则计算**期望伤害**：期望 = 该伤害来源「不带任何倍率的一次普通攻击」——攻击力属性照常计入（面板类「攻击力+X%」在内），防御 / 法抗照常参与但不考虑贯穿；一切攻击倍率——无论「攻击力提升至X%」还是技能文本里的「造成相当于攻击力X%的伤害」——以及其它临时增益，只抬高实际伤害、不进期望。**最终伤害 ≥ 期望 × 1.5 即出红。**规则对所有干员一视同仁，这里只讲判定口径，不逐个点名技能：

- **概率型 / 条件型的「当次攻击力提升至X%」**：这类提升属于对倍率的临时增加，从期望中剔除，由倍率自身去比 1.5 阈值——≥150% 的自然出红，不足 1.5 的保持白字。本可红字的攻击被闪避时显示黄色 MISS。
- **技能倍率一律剔除，与措辞和形态无关**：「攻击力提升至X%」与「造成相当于攻击力X%的伤害」一视同仁；瞬发、蓄力、持续、弹药、开关等技能形态同样不影响判定，≥150% 的脱手技能伤害也出红。
- **面板型增益不触发红字**：直接改变攻击力面板的「攻击力+X%」类增益在期望与实际两侧同时计入，保持白字；蓄力、随机类等临时倍率则从期望侧剔除，按官方规则判定。
- **强制红字仅限官方点名的一小撮技能**：无视阈值必定红字。这类红字被护盾 / 屏障挡下时官方会转蓝字或黄字 BLOCK，该特显本补丁暂未实现。
- 同人在 1.0~1.5 倍之间显示白字（官方此时不显示数字）；打开「仅显示官方数字」后，非红字数字隐藏、红字为不加粗的 #E34C25；其余情况（含官方还原未开该选项时）一律用加大 / 加粗表示暴击。

> The red-number (crit) rules follow the official game's (compiled from the PRTS community doc). The core is an **expected damage** = the source's plain unscaled normal attack: the ATK attribute counts as-is (panel 攻击力+X% buffs included), mitigation applies but ignores penetration, and every attack scale — "ATK raised to X%" and the inline skill formulas "deals X% ATK as damage" alike — plus any other temporary raise only lifts the final damage, never the expectation. **Red when final ≥ expected × 1.5.** The rule treats every operator alike, so this states the policy rather than a per-skill list:
> - Probability / conditional "当次攻击力提升至X%" raises are excluded from the expected side, so the multiplier itself faces the 1.5 threshold — ≥150% reddens, below 1.5 stays white. A would-be-red hit that gets dodged shows a yellow MISS.
> - Skill scales are all excluded, wording and form alike: "ATK raised to X%" and "deals X% ATK as damage" behave identically, and instant / charged / duration / ammo / toggle forms don't matter — off-field skill damage ≥150% reddens too.
> - Panel-ATK buffs (攻击力+X%) stay on both sides and never redden; charged / random-type temporary scales are excluded from the expected side and judged by the official rule.
> - Forced red is reserved for the small officially listed set of skills — always red regardless of threshold. When such a hit is blocked by a shield the official client switches to a blue number or yellow BLOCK; that special display is not implemented yet.
> - The fan game shows white numbers between 1.0–1.5× (official shows none); with "Official Numbers Only" on, non-red numbers hide and the red shows as the non-bold #E34C25; otherwise crits (the Authentic style included) keep the bold / enlarged treatment.

### 6. 官方还原风格的数字行为 / Number behavior in the Authentic style

「官方还原」在保留同人「普攻就有数字」这一特点的前提下，弹字行为全面对齐官方本尊；**「原版经典」在出厂设置下原封不动保留作者的全部原有样式**（数字合并、左右抖动、同目标数量上限、头高 80% 处的锚点等照旧——微调滑块同样可以在它身上偏离作者原样）。

- **头顶正中央，全棋盘逐排一致**：模型是直立立绘，头顶就取立绘画出的头顶，数字底边悬在头顶上方一小段固定间距，并按模型身高取等比（矮敌不会被顶到半空、高敌也不会贴着头）。间距以画布上的真实「格」计量（1 格即战术地砖一格在画布上的边长），因此近处几排与最上几排观感完全一致——旧的世界坐标换算会让同一间距在近处被压扁、在远处被拉长。出厂不左右抖动，也不再贴在模型身上。治疗数字、黄色 MISS 与官方风格的 SP / COST 弹字用的也是这同一套定位，只是这几类小字的间距为常规数字的 0.8 倍、稍低一些，字号也与 SP / COST 一致（MISS 同大）；治疗数字前同样带 `+` 号（与原版经典管线一致）。
- **迅速上浮、迅速消失**：0.3 秒完成上浮，一共存活 0.6 秒、末尾 0.18 秒淡出——官方的快节奏。
- **出厂不合并、无上限、不避让**：每一击都是独立数字，同屏数量不设上限。这六项（合并 / 避让 / 同目标上限最高档 ∞ / 抖动 / 高度 / 上浮速度）可以随意调、官方管线上同样生效；一旦偏离官方出厂值，「官方数字行为」开关会自动熄灭作标记（数字仍走官方管线、不会被拽回原版），再点开关即恢复官方出厂值。避让的表现：官方管线上新数字向上叠放、不横移（保持居中）；原版管线则是作者原版的五车道让位（横向让开 + 纵向叠放）。
- **暴击仍加大加粗**：官方还原下暴击（红字机制命中）与原路径一致——加大、加粗、伤害类型色（「暴击加粗」开关照常有效）；只有开启「仅显示官方数字」后，红字才变成官方的不加粗 #E34C25 纯色（此时除红字机制外的一切伤害数字也全部隐藏）。
- **暴击入场动画（可开关）**：官方数字行为下的**暴击**数字出现时会快速放大再迅速缩小回落（约 0.17 秒，峰值 +50%）——红字（开「仅显示官方数字」时）和加大加粗两档都有，正是官方红字的登场感。「暴击入场动画」开关默认开启。普攻、技能、治疗、MISS 的数字以及关闭官方数字行为后的跳字完全不受影响，一律保持原有节奏。
- 本可红字的攻击被闪避时的黄色 MISS 也走同一套官方弹字。
- 想在不换风格预设的情况下直接开 / 关这套官方弹字行为，用「高级微调」里的「官方数字行为」开关即可。

> Within the Authentic style — while keeping the fan game's trait that normal attacks also show numbers — popups now fully match the official game's behavior; **the Classic style, at its factory settings, keeps every one of the author's original behaviors** (merging, jitter, per-target caps, the anchor at 80% of head height — all unchanged, and the Fine-Tuning sliders can deviate from the author's look there too).
>
> - **Head-top centered, uniform across every board row**: the models are upright billboards, so the head top is the sprite's drawn head; a number's bottom edge hangs a small fixed gap above it, scaled to the model's height (short enemies no longer send numbers into the sky, tall ones no longer keep them glued to the head). The gap is measured in true on-screen tiles (one tile = a tactical grid cell's on-screen edge), so the near rows and the top rows read identically — the old world-space conversion squeezed the same gap flat near the camera and stretched it far away. No factory jitter, no longer printed on the model's body. Heals, the yellow MISS and the Authentic-style SP / COST popups use this same positioning, except these small labels sit at 0.8× the regular gap, slightly lower, and are sized to match SP / COST (MISS included); heals carry the `+` sign like the classic pipeline.
> - **Quick rise, quick fade**: rise completes in 0.3 s, total life 0.6 s with a 0.18 s fade-out — the official pace.
> - **Factory: no merging, no cap, no dodging**: every hit is its own number, no on-screen limit. These six knobs (merge / dodge / per-target cap with a ∞ top step / jitter / height / rise speed) can be tuned freely and drive the official pipeline too; once any of them deviates, the "Official Number Behavior" switch dims as a marker (the numbers stay on the official pipeline — they are not yanked back to the classic one), and clicking the switch snaps all six back to the official factory values. Dodge behavior: in the official pipeline a new number stacks upward without moving sideways (stays centered); in the classic pipeline it is the author's original five-lane dodging (sideways + upward).
> - **Crits stay big & bold**: a crit-mechanism hit keeps the previous treatment — enlarged, bold, in the damage type's color (the "Crit Bold" toggle applies as usual); only with "Official Numbers Only" on does the red become the official non-bold #E34C25 (and everything except red-mechanism numbers hides entirely).
> - **Crit pop-in (toggleable)**: under Official Number Behavior, **crit** numbers quickly enlarge then shrink back on arrival (~0.17 s, +50% peak) — both tiers, the non-bold red (with "Official Numbers Only" on) and the big-bold one, exactly how official red numbers pop in. A "Crit Pop-in" toggle defaults to on. Normal attacks, skills, heals, MISS — and numbers with the behavior off — are completely unaffected and keep their original pacing.
> - Yellow MISS popups (a would-be-red hit dodged) use the same official behavior.
> - The "Official Number Behavior" switch in Fine-Tuning turns this popup pipeline on / off without switching the style preset.

### 7. 其他变化 / Other changes

- 界面上的数字字体也能跟随切换（Novecento、Bender、Rodin、Skurri、Oxanium、Rajdhani、系统默认）/ The UI number font can be switched too.
- 新增的所有选项会自动跟随游戏语言显示：简体中文、繁体中文、English、日本語、한국어 / All new options auto-translate with the game's language.
- 顺带微调了六角数值徽章和商店等级卡片，让它们在新字体下显示得更居中 / Hex badges and shop level cards were slightly adjusted to sit centered under the new fonts.
- v0.3.1 游戏自带了「官方特效」（官方命中等特效）。它和本补丁互不干扰：特效照常播放，数字仍由本补丁的管线负责 / The v0.3.1 game ships its own official hit effects. They don't conflict with this patch — effects play as usual, numbers still come from this patch's pipeline.

---

## 三、使用前的两个条件 / Two things you need first

1. **电脑上装了 Node.js。** 运行这个游戏本身就需要它。没装的话，去 [nodejs.org](https://nodejs.org) 下载 LTS 版本，一路「下一步」装完即可。
2. **游戏版本是 v0.3.1。** 游戏更新后内部文件会变，补丁可能找不到要改的位置（它会明确提示是哪一步）。用游戏自带的更新功能升级后，被补丁改过的文件会被更新覆盖，重新运行一遍补丁即可。

> 1. **Node.js installed.** You already need it to run the game. If not, download the LTS version from [nodejs.org](https://nodejs.org) and install with defaults.
> 2. **Game version v0.3.1.** After a game update the patch may no longer find what to change — it will tell you clearly. Updating the game through its own updater overwrites the patched files; just run the patch again afterwards.

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

- 补丁只修改游戏自带的 26 个文件，不删除任何东西，也不联网。
- 第一次打补丁时，每个被修改的文件都会自动留一份备份（原文件名后加 `.bak`）。
- 重复运行补丁不会「越打越乱」：每次都是从最初备份的原始文件重新改起。
- 还原命令会把备份写回原文件并删掉备份，干干净净。
- 两款新字体（FOT-Rodin、Skurri）已经放在游戏的 `public/fonts` 文件夹里，**无需另外下载**。换到新的游戏文件夹时，记得把这两个字体文件也一起拷过去，只复制补丁脚本是不够的。
- 补丁会改动服务器一侧的文件，所以打完补丁要**重新启动游戏**（关掉黑色命令行窗口再按平时方式启动）才能看到行商、冲锋手等新弹字；页面再按 `Ctrl + F5` 强制刷新。

> - Only 26 game files are modified; nothing is deleted and nothing goes online.
> - On first run, every modified file gets an automatic backup copy (same name + `.bak`).
> - Running the patch again never stacks up changes — it always starts over from the original backup.
> - The restore command writes the backups back and removes them.
> - The two new fonts (FOT-Rodin, Skurri) already sit in the game's `public/fonts` folder — **nothing to download**. When moving to a fresh game folder, copy the font files over too; the patch script alone is not enough.
> - Some patched files live on the server side, so **restart the game** (close the black command window, launch as usual) after patching to see the new Merchant / Charger popups; then hard-refresh with `Ctrl + F5`.

修改文件清单（仅供留档）/ List of modified files (for the record)：

| 文件 File | 改了什么 What changed |
|---|---|
| `public/fonts/fonts.css` | 注册两款新字体 / Registers the two new fonts |
| `public/css/theme.css` | 切换默认数字字体 / Switches the default number font |
| `public/css/components.css` | 六角徽章微调 / Hex badge tweak |
| `public/css/screens/game-shop.css` | 商店等级卡片微调 / Shop level-card tweak |
| `server/sim/damage.js` | 伤害数字分类与官方红字（暴击）判定；红字期望 = 来源裸攻击力 / Damage typing and official red-number (crit) detection; the expected damage is the source's plain unscaled attack |
| `public/js/render/app.js` | 新设置项的读取 / Reads the new settings |
| `public/js/render/style.js` | 12 类数字与样式的对应 / Maps the 12 number types to styles |
| `public/js/render/fx/fonts.js` | 数字字体的动态生成 / Builds number fonts on the fly |
| `public/js/render/fx/numbers.js` | 数字的大小、头顶等比定位与飘动；COST / SP 弹字的字体与定位 / Number size, head-top proportional positioning and motion; the COST / SP label font & anchor |
| `public/js/ui/settings.js` | 设置界面新增面板；「仅显示官方数字」按钮 / The new settings panel; the "Official Numbers Only" button |
| `server/sim/professions.js` | 行商扣费与冲锋手回费的 COST 弹字事件 / COST popup events for merchant pays and charger kills |
| `server/sim/skills.js` | 明确来源技力回复的 SP 弹字事件 / SP popup events for explicitly granted skill points |
| `public/js/render/fx/simfx.js` | COST / SP 弹字的绘制、头顶挂载与风格开关 / Draws the COST / SP popups (anchored head-top) and the style gating |
| `server/sim/content/kits/ops/chess_char_3_04-swire2.js` | 干员特性 / 复活类扣费的 COST 弹字 / Trait- and revive-style COST pay popups |
| `server/sim/ai.js` | 红字期望 = 来源裸攻击力；技能攻击的「攻击力提升至X%」与一切技能倍率只抬实际值（弹药/持续形态同样）/ Expected = the source's plain unscaled attack; skill ATK scales (ammo & duration forms included) only lift the final damage |
| `server/sim/content/kits/ops/chess_char_1_07-prove.js` | 概率型与条件型当次倍率从期望剔除 / Probability- and conditional-type hit scales excluded from expected |
| `server/sim/content/kits/ops/chess_char_1_09-caper.js` | 条件型与模组类倍率从期望剔除 / Conditional & module-type scales excluded |
| `server/sim/content/kits/ops/chess_char_1_10-sunbr.js` | 天赋概率倍率从期望剔除 / Talent probability scale excluded |
| `server/sim/content/kits/ops/chess_char_1_05-vigna.js` | 模组低血倍率剔除期望（面板型天赋不标记）/ Low-HP module scale excluded (panel-type talent untouched) |
| `server/sim/content/kits/ops/chess_char_4_06-kroos2.js` | 概率型倍率从期望剔除 / Probability-type scale excluded |
| `server/sim/content/kits/ops/chess_char_5_17-f12yin.js` | 主动技能倍率从期望剔除 / Active skill scale excluded |
| `server/sim/content/kits/ops/op-bgsnow.js` | 天赋类倍率从期望剔除 / Talent-type scale excluded |
| `server/sim/content/kits/ops/op-shwaz.js` | 天赋类倍率从期望剔除 / Talent-type scale excluded |
| `server/sim/content/kits/ops/op-haak.js` | 随机倍率面从期望剔除 / Random-face ATK scale excluded |
| `server/sim/content/kits/ops/op-judge.js` | 蓄力类倍率从期望剔除 / Charged-hit scale excluded |
| `server/sim/content/kits/ops/chess_char_6_01-lemuen.js` | 官方点名强制红字的技能 / Officially forced red numbers |

---

## 七、打完补丁后，去哪里调设置？ / Where to tweak after patching

进入游戏 → 打开「设置」→ 开启「显示伤害数字」→ 这里会出现「数字风格」五选一，以及「高级微调」面板（点「展开」）。所有调整即时生效，并自动保存在浏览器里，下次打开游戏还在。

> In game, open Settings → enable "Damage Numbers" → you'll find the five-style picker and the "Fine-Tuning" panel (click "Expand"). Every change takes effect immediately and is saved in your browser automatically.

---

## 八、常见问题 / FAQ

**Q1：运行时提示「未匹配到目标代码」？**
游戏版本和补丁对不上。确认游戏是 v0.3.1；如果是更新的游戏版本，请等补丁更新。

**Q2：改了设置没反应？**
先按 `Ctrl + F5` 强制刷新页面；数字样式的差异开一局新战斗看得最清楚。

**Q3：我调的颜色和字号存在哪？会丢吗？**
存在浏览器本地，正常关闭不会丢。但清空浏览器数据、换浏览器或换电脑后需要重调一遍。还原补丁不会影响这些个人设置。

**Q4：还原之后想再打补丁，还要先备份吗？**
不用，补丁每次都会自己处理备份，直接运行即可。

**Q5：我之前版本里选过的风格叫「官方 / 战术 / 极简」，现在找不到了？**
它们只是改了名字——现在分别叫「官方还原 / 属性风暴 / 街机硬派」。旧存档会自动迁移到对应的新风格，你调整过的颜色、字号等个人设置全部保留，不需要重调。

**Q6：联机一起玩时，别人也需要打补丁吗？**
不需要。大家连的是房主开的服务器，页面和战斗演算都由它提供：房主打好补丁、重启游戏，其他玩家直接加入就能看到同样的弹字，各自浏览器里的个人设置互不影响。

**Q7：用游戏自带的更新功能升级后，补丁还在吗？**
不在了。更新器会把改过的文件恢复成官方版本，更新完重新运行一遍补丁、再重启游戏即可（字体文件不受影响，不用重新拷）。

> **Q1: "Target code not found" warning?** The game version doesn't match the patch. Make sure the game is v0.3.1; for a newer game, wait for an updated patch.
> **Q2: Settings not taking effect?** Hard-refresh with `Ctrl + F5` first; start a new battle to see number-style changes clearly.
> **Q3: Where are my colors and sizes saved?** In your browser. They survive normal restarts, but clearing browser data, switching browsers or computers means setting them again. Restoring the patch does not touch these personal settings.
> **Q4: Do I need to back up before re-patching after a restore?** No — the patch handles backups itself every time. Just run it.
> **Q5: My old build had styles named "Official / Tactical / Minimal" — where did they go?** They were only renamed — to "Authentic / Elemental / Arcade" respectively. Saved choices migrate automatically, and all your personal color / size settings are kept.
> **Q6: In multiplayer, does everyone need the patch?** No. Everyone connects to the host's server, which serves both the page and the battle simulation. With the host patched and the game restarted, joining players see the same popups; each player's own browser settings are unaffected.
> **Q7: Does the patch survive the game's built-in updater?** No. The updater restores changed files to the official versions. After updating, run the patch once more and restart the game (the font files are untouched — no need to copy them again).

---

## 九、声明 / Disclaimer

这是非官方、非商业的同人修改，仅供学习与个人娱乐。《明日方舟》相关名称、美术与数据的版权归鹰角网络 / Yostar 所有，本补丁与官方无任何关联。

> This is an unofficial, non-commercial fan-made modification for study and personal use only. All Arknights-related names, art, and data belong to Hypergryph / Yostar. Not affiliated with or endorsed by them.
