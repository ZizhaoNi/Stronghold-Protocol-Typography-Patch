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

在游戏设置里新增，点「展开」即可使用。**无论当前选的是哪个风格预设，展开后的面板完全相同**；只要调整了其中任何一项，顶部的风格就会自动变成「自定义」：

- 整体字号、治疗数字的缩小比例 / Overall number size, heal-number size ratio
- 「官方数字行为」总开关：开 = 数字走官方管线（头顶居中・快速上浮消失，见第 6 节）；关 = 走原版跳字管线 / An "Official Number Behavior" master switch: on = the official popup pipeline (§6), off = the classic one
- 数字出现的高度、左右抖动范围、上浮速度——**两条管线都生效**，高度同时也控制官方风格的 SP / COST 弹字（官方还原的出厂值 = 官方表现：头顶高度 100%、抖动 0、速度 100%）/ Spawn height, horizontal jitter, floating speed — effective in BOTH pipelines, and the height also drives the Authentic-style SP / COST popups (the Authentic preset's factory values equal the official look)
- 同一个目标最多同时显示几个数字，最高档 **∞ 无上限**（官方还原的出厂值）/ Max numbers per target, top step **∞ unlimited** (the Authentic preset's factory value)
- 数字合并相加、互相避让，各自可开关（同样两条管线都生效；官方还原出厂为全关）/ Merge numbers / dodge overlaps, each toggleable (both pipelines; off by default in the Authentic preset)
- 暴击入场动画（快速放大→缩小）开关，作用于官方数字行为下的暴击 / Crit pop-in toggle — crits under Official Number Behavior
- 暴击大字、暴击加粗，各自可开关 / Big crit numbers, bold crit numbers, each toggleable
- 暴击判定方式四选一：官方暴击比例 / 单发伤害≥目标生命的 18% / 满足任意一条 / 仅放大显示 / Four crit trigger options: official crit ratio · single hit ≥ 18% of target HP · either one · enlarge only
- 还能从下拉列表选择或直接手填你电脑上的任意字体名 / Pick a font from the dropdown, or type the name of any font installed on your computer

### 4. 官方风格的 COST / SP 弹字 / Official-style COST / SP popups

**这些弹字只在「官方还原」风格下出现，其他风格一律保持原样**（只加文字，不改任何动画）。

在官方还原风格里有两档显示，由原「官方伤害数字」按钮（现已更名为**「仅显示官方数字」**）切换：

- **按钮关闭（默认）：** 所有费用变动都弹字——回费是金色 `COST 10`（#E0A32C），扣费是红色 `COST −5`（#D4121A，行商特性扣费、琳琅诗怀雅的复活扣费）；技力方面，只有天赋、技能描述、盟约（萨尔贡、迅捷）等**明确写出的回复手段**弹青色 `SP 1`（#6FC6D2），时间流逝、攻击、受击的自然回复不弹字，与官方一致。
- **按钮开启（完全对齐官方本尊）：** 费用只弹冲锋手、情报官等**跟随攻击的回费**和**行商扣费**，技能型回费（如德克萨斯的技能）不再弹字；技力规则不变。

弹字使用专用白色小字体染色，颜色精确，字号与治疗数字相当，并跟随「高级微调」里的整体字号滑块。弹字位置与官方伤害数字一致：挂在单位头顶上方（同样随模型身高取等比、跟随「高度」滑块），不再贴在胸口；非官方风格的 `+N` 回费弹字仍在原位置。

> **These popups appear only in the "Authentic" style; every other style keeps the game's original look.** No animations are changed — text only.
>
> Within the Authentic style there are two levels, switched by the old "Official Damage Numbers" button (renamed to **"Official Numbers Only"**):
>
> - **Button off (default):** every DP change pops text — gains in gold `COST 10` (#E0A32C), spends in red `COST −5` (#D4121A: the Merchant trait's pays and 琳琅诗怀雅's revive cost). For SP, only sources explicitly described in talents / skill texts / bonds (Sargon, Swift) pop a cyan `SP 1` (#6FC6D2); natural recovery (time, attacking, being hit) shows nothing, same as official.
> - **Button on (fully matches the official game):** DP only pops for attack-followed gains (Charger / Agent kills) and Merchant spends — skill-based gains (e.g. Texas's skill) no longer show text; SP rules unchanged.
>
> The popups use a dedicated small white font tinted to exact colors, sized like heal numbers, following the overall size slider in "Fine-Tuning". They sit where the official damage numbers sit — above the unit's head, proportionally to the model's height and following the height slider — instead of at the chest; the non-Authentic `+N` cost label keeps its original spot.

### 5. 官方规则的红字（暴击）判定 / Official-rule red numbers (crits)

修复了红字触发机制，完全对齐官方《明日方舟》的「伤害红字」规则（依据 PRTS 文档与官服实测）。核心是按官方规则计算**期望伤害**：期望 = 该干员「不带任何倍率的一次普通攻击」——攻击力属性照常计入（面板类「攻击力+X%」在内），防御/法抗照常参与但不考虑贯穿；一切攻击倍率——无论「攻击力提升至X%」还是技能文本里的「造成相当于攻击力X%的伤害」——以及其它临时增益只抬高实际伤害、不进期望。最终伤害 ≥ 期望 × 1.5 即出红：

- **概率型「当次攻击力提升至X%」**：提升属于对攻击倍率的临时增加，从期望中剔除，倍率本身去比 1.5 阈值——普罗旺斯「狩猎箭头」（150%）、跃跃精二「戏耍随心」（150%）、寒芒克洛丝「中的」（150%）、古米天赋、黑「破甲箭头」、鸿雪「押韵」、阿的命运骰攻击面、山「巨力重拳」按各自倍率 ≥150% 自然出红（物理 `(atk×1.5−防御)/(atk−防御)≥1.5`，法术恰为 1.5）；不足 1.5 的（如跃跃精一的 130%）保持白字。本可红字的攻击被闪避时显示黄色 MISS。
- **连续型条件倍率同样从期望剔除**：普罗旺斯「狼眼」、红豆模组「低血攻击力提升至115%」、跃跃的回环射手模组近身倍率——期望按未加成的倍率计算，实际越过 1.5 倍才出红字（狼眼最高 1.6 倍会红，1.3 倍不红）。
- **技能倍率一律剔除，与措辞和形态无关**：「攻击力提升至X%」（`attack@atk_scale` 字段族——跃跃 1 技能「强力击·β型」200%/230%、斥罪 S1 蓄力锤击、蕾缪安 S1「重逢问候」弹药攻击 180%）与技能文本「造成相当于攻击力X%的伤害」的内联技能伤害（官服实测：德克萨斯 S2「剑雨」专三 170% 红、7 级 135% 白）一视同仁——涤火杰西卡 S3 炸弹（250%）、W S3 D12（430%）这类 ≥150% 的脱手技能伤害全部出红。技能形态也不影响判定：弹药只是技能持续的一种形式（固定弹药数而非固定时长），instant / charges 的单发与 duration / ammo / toggle 的持续生效一视同仁。
- **强制红字仅限官方点名技能**：蕾缪安 S2「归乡邀约」瞄准射击、S3「礼炮·强制追思」轰炸无视阈值必定红字（名单另一位谜图「疑点追踪」满层未参战）。这类强制红字被护盾/屏障挡下时官方会转蓝字或黄字 BLOCK，该特显本补丁暂未实现。
- **面板型增益不触发红字**：红豆「蛮力穿刺」这类直接改变攻击力面板的「攻击力+X%」，期望与实际同时计入，保持白字——与官方一致。斥罪的蓄力状态（攻击力倍率提升）则从期望侧剔除，蓄力攻击按官方规则出红。
- 同人在 1.0~1.5 倍之间显示白字（官方此时不显示数字）；打开「仅显示官方数字」后，非红字数字隐藏、红字为不加粗的 #E34C25；其余情况（含官方还原未开该选项时）一律用加大 / 加粗表示暴击。

> The red-number (crit) rules now match the official game exactly (per the PRTS doc and in-client testing). The core is an **expected damage** = the operator's plain unscaled attack: the ATK attribute counts as-is (panel 攻击力+X% buffs included), mitigation applies but ignores penetration, and every attack scale — "ATK raised to X%" and the inline skill formulas "deals X% ATK as damage" alike — plus any other temporary raise only lifts the final damage, never the expectation. Red when final ≥ expected × 1.5:
> - Probability "当次攻击力提升至X%" raises are excluded from the expected side, so the multiplier itself faces the 1.5 threshold — 狩猎箭头 (150%), 戏耍随心 at E2 (150%), 中的 (150%), 古米's talent, 破甲箭头, 押韵, 阿's dice ATK face and 巨力重拳 all redden at ≥150% (phys `(atk×1.5−def)/(atk−def)≥1.5`, arts exactly 1.5); below 1.5 (戏耍随心 E1 130%) stays white. A would-be-red hit that gets dodged shows a yellow MISS.
> - Continuous conditional scales (狼眼, 红豆's low-HP module, the loopshooter module's near bonus) are excluded the same way — red only past 1.5×.
> - Skill scales are all excluded, wording and form alike: "ATK raised to X%" (the `attack@atk_scale` family — 强力击·β型, 斥罪 S1's gavel, 蕾缪安 S1's 180% ammo attacks) and the inline skill formulas "deals X% ATK as damage" (in-client verified: 德克萨斯 S2 专三 170% red, lv7 135% white) behave identically — off-field skill damage at ≥150% (涤火杰西卡 S3's 250% bomb, W's S3 D12 at 430%) reddens. Ammo is just a duration variant (a fixed bullet count instead of a fixed duration), so instant / charges one-shots and duration / ammo / toggle uptimes all behave the same — red past 1.5×.
> - Forced red is reserved for the officially listed skills — 蕾缪安's S2 aimed shot and S3 bombardment (the list's other member, 谜图's max-stacked 疑点追踪, is not in this game). When such a hit is blocked by a shield the official client switches to a blue number or yellow BLOCK; that special display is not implemented yet.
> - Panel-ATK buffs (蛮力穿刺-style 攻击力+X%) stay on both sides and never redden, as official; 斥罪's charged 攻击力倍率 state is excluded from the expected side and reddens per the official rule.
> - The fan game shows white numbers between 1.0–1.5× (official shows none); with "Official Numbers Only" on, non-red numbers hide and the red shows as the non-bold #E34C25; otherwise crits (the Authentic style included) keep the bold / enlarged treatment.

### 6. 官方还原风格的数字行为 / Number behavior in the Authentic style

「官方还原」在保留同人「普攻就有数字」这一特点的前提下，弹字行为全面对齐官方本尊；**「原版经典」在出厂设置下原封不动保留作者的全部原有样式**（数字合并、左右抖动、同目标数量上限、头高 80% 处的锚点等照旧——微调滑块同样可以在它身上偏离作者原样）。

- **头顶正中央、更高，且随敌人体型等比**：数字出现在干员 / 敌人头顶正中央的高处，头顶间距按模型身高取等比——每个模型的间距都约为自身身高的 0.85 倍（干员约 1 格不变，1 格即战术地砖一格的边长；矮敌不会被顶到半空、高敌也不会贴着头），出厂不左右抖动，也不再贴在模型身上。治疗数字与官方风格的 SP / COST 弹字用的也是这同一套定位。
- **迅速上浮、迅速消失**：0.3 秒完成上浮，一共存活 0.6 秒、末尾 0.18 秒淡出——官方的快节奏。
- **出厂不合并、无上限、不避让**：每一击都是独立数字，同屏数量不设上限。注意这些现在是「出厂值」而非硬规则——「高级微调」里的合并 / 避让 / 同目标上限（最高档 ∞）/ 抖动 / 高度 / 上浮速度滑块在官方管线上同样生效，想偏离官方表现直接调即可（模式会自动变为「自定义」）。避让的表现：官方管线上新数字向上叠放、不横移（保持居中）；原版管线则是作者原版的五车道让位（横向让开 + 纵向叠放）。
- **暴击仍加大加粗**：官方还原下暴击（红字机制命中）与原路径一致——加大、加粗、伤害类型色（「暴击加粗」开关照常有效）；只有开启「仅显示官方数字」后，红字才变成官方的不加粗 #E34C25 纯色（此时除红字机制外的一切伤害数字也全部隐藏）。
- **暴击入场动画（可开关）**：官方数字行为下的**暴击**数字出现时会快速放大再迅速缩小回落（约 0.17 秒，峰值 +50%）——红字（开「仅显示官方数字」时）和加大加粗两档都有，正是官方红字的登场感。「暴击入场动画」开关默认开启。普攻、技能、治疗、MISS 的数字以及关闭官方数字行为后的跳字完全不受影响，一律保持原有节奏。
- 本可红字的攻击被闪避时的黄色 MISS 也走同一套官方弹字。
- 想在不换风格预设的情况下直接开 / 关这套官方弹字行为，用「高级微调」里的「官方数字行为」开关即可。

> Within the Authentic style — while keeping the fan game's trait that normal attacks also show numbers — popups now fully match the official game's behavior; **the Classic style, at its factory settings, keeps every one of the author's original behaviors** (merging, jitter, per-target caps, the anchor at 80% of head height — all unchanged, and the Fine-Tuning sliders can deviate from the author's look there too).
>
> - **Head-top centered, higher, scaled to the enemy's size**: numbers appear centered high above a unit's head, with the gap proportional to the model's height — roughly 0.85× its own body height for every model (~1 tile for operators, unchanged; a tile is one tactical grid cell — short enemies no longer send numbers into the sky, tall ones no longer keep them glued to the head) — no factory jitter, no longer printed on the model's body. Heals and the Authentic-style SP / COST popups use this same positioning.
> - **Quick rise, quick fade**: rise completes in 0.3 s, total life 0.6 s with a 0.18 s fade-out — the official pace.
> - **Factory: no merging, no cap, no dodging**: every hit is its own number, no on-screen limit. These are factory values, not hard rules — the Fine-Tuning sliders (merge / dodge / per-target cap with a ∞ top step / jitter / height / rise speed) drive the official pipeline too; deviate freely (the style flips to Custom). Dodge behavior: in the official pipeline a new number stacks upward without moving sideways (stays centered); in the classic pipeline it is the author's original five-lane dodging (sideways + upward).
> - **Crits stay big & bold**: a crit-mechanism hit keeps the previous treatment — enlarged, bold, in the damage type's color (the "Crit Bold" toggle applies as usual); only with "Official Numbers Only" on does the red become the official non-bold #E34C25 (and everything except red-mechanism numbers hides entirely).
> - **Crit pop-in (toggleable)**: under Official Number Behavior, **crit** numbers quickly enlarge then shrink back on arrival (~0.17 s, +50% peak) — both tiers, the non-bold red (with "Official Numbers Only" on) and the big-bold one, exactly how official red numbers pop in. A "Crit Pop-in" toggle defaults to on. Normal attacks, skills, heals, MISS — and numbers with the behavior off — are completely unaffected and keep their original pacing.
> - Yellow MISS popups (a would-be-red hit dodged) use the same official behavior.
> - The "Official Number Behavior" switch in Fine-Tuning turns this popup pipeline on / off without switching the style preset.

### 7. 其他变化 / Other changes

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

- 补丁只修改游戏自带的 26 个文件，不删除任何东西，也不联网。
- 第一次打补丁时，每个被修改的文件都会自动留一份备份（原文件名后加 `.bak`）。
- 重复运行补丁不会「越打越乱」：每次都是从最初备份的原始文件重新改起。
- 还原命令会把备份写回原文件并删掉备份，干干净净。
- 两款新字体（FOT-Rodin、Skurri）已经放在游戏的 `public/fonts` 文件夹里，**无需另外下载**。
- 补丁会改动服务器一侧的文件，所以打完补丁要**重新启动游戏**（关掉黑色命令行窗口再按平时方式启动）才能看到行商、冲锋手等新弹字；页面再按 `Ctrl + F5` 强制刷新。

> - Only 26 game files are modified; nothing is deleted and nothing goes online.
> - On first run, every modified file gets an automatic backup copy (same name + `.bak`).
> - Running the patch again never stacks up changes — it always starts over from the original backup.
> - The restore command writes the backups back and removes them.
> - The two new fonts (FOT-Rodin, Skurri) already ship in `public/fonts` — **nothing to download**.
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
| `server/sim/content/kits/ops/chess_char_3_04-swire2.js` | 琳琅诗怀雅：特性扣费与复活扣费弹字 / 琳琅诗怀雅's trait pay and revive cost popups |
| `server/sim/ai.js` | 红字期望 = 来源裸攻击力；技能攻击的「攻击力提升至X%」与一切技能倍率只抬实际值（弹药/持续形态同样）/ Expected = the source's plain unscaled attack; skill ATK scales (ammo & duration forms included) only lift the final damage |
| `server/sim/content/kits/ops/chess_char_1_07-prove.js` | 普罗旺斯：狼眼与狩猎箭头的当次倍率均从期望剔除（×1.5 恰好出红） / 狼眼 & 狩猎箭头 scales excluded from expected |
| `server/sim/content/kits/ops/chess_char_1_09-caper.js` | 跃跃：近身模组与戏耍随心的当次倍率均从期望剔除 / Near-module & 戏耍随心 scales excluded from expected |
| `server/sim/content/kits/ops/chess_char_1_10-sunbr.js` | 古米：天赋概率倍率从期望剔除（≥150% 出红） / Talent prob scale excluded from expected |
| `server/sim/content/kits/ops/chess_char_1_05-vigna.js` | 红豆：模组低血倍率剔除期望（面板型天赋不标记） / Module low-HP scale excluded (panel talent untouched) |
| `server/sim/content/kits/ops/chess_char_4_06-kroos2.js` | 寒芒克洛丝：「中的」×1.5 从期望剔除（恰好出红） / 中的 ×1.5 excluded from expected |
| `server/sim/content/kits/ops/chess_char_5_17-f12yin.js` | 山：巨力重拳倍率从期望剔除 / 巨力重拳 scale excluded from expected |
| `server/sim/content/kits/ops/op-bgsnow.js` | 鸿雪：押韵倍率从期望剔除 / 押韵 scale excluded from expected |
| `server/sim/content/kits/ops/op-shwaz.js` | 黑：破甲箭头倍率从期望剔除 / 破甲箭头 scale excluded from expected |
| `server/sim/content/kits/ops/op-haak.js` | 阿：命运骰攻击面倍率从期望剔除 / Dice ATK face scale excluded from expected |
| `server/sim/content/kits/ops/op-judge.js` | 斥罪：蓄力锤击倍率剔除期望 / Gavel scale excluded from expected |
| `server/sim/content/kits/ops/chess_char_6_01-lemuen.js` | 蕾缪安：S2 瞄准与 S3 礼炮官方强制红字 / S2 aim & S3 bombard: officially forced red |

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

**Q5：我之前版本里选过的风格叫「官方 / 战术 / 极简」，现在找不到了？**
它们只是改了名字——现在分别叫「官方还原 / 属性风暴 / 街机硬派」。旧存档会自动迁移到对应的新风格，你调整过的颜色、字号等个人设置全部保留，不需要重调。

> **Q1: "Target code not found" warning?** The game version doesn't match the patch. Make sure the game is v0.2.6.1; for a newer game, wait for an updated patch.
> **Q2: Settings not taking effect?** Hard-refresh with `Ctrl + F5` first; start a new battle to see number-style changes clearly.
> **Q3: Where are my colors and sizes saved?** In your browser. They survive normal restarts, but clearing browser data, switching browsers or computers means setting them again. Restoring the patch does not touch these personal settings.
> **Q4: Do I need to back up before re-patching after a restore?** No — the patch handles backups itself every time. Just run it.
> **Q5: My old build had styles named "Official / Tactical / Minimal" — where did they go?** They were only renamed — to "Authentic / Elemental / Arcade" respectively. Saved choices migrate automatically, and all your personal color / size settings are kept.

---

## 九、声明 / Disclaimer

这是非官方、非商业的同人修改，仅供学习与个人娱乐。《明日方舟》相关名称、美术与数据的版权归鹰角网络 / Yostar 所有，本补丁与官方无任何关联。

> This is an unofficial, non-commercial fan-made modification for study and personal use only. All Arknights-related names, art, and data belong to Hypergryph / Yostar. Not affiliated with or endorsed by them.
