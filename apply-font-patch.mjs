// apply-font-patch.mjs — 自动注册外部字体、多语言支持、全自由调色、官方风格 COST/SP 弹字与一键还原
import fs from 'fs';
import path from 'path';

const isRestore = process.argv.includes('--restore') || process.argv.includes('-r');

function applyPatchToFile(file, transforms) {
  const p = path.resolve(process.cwd(), file);
  if (!fs.existsSync(p)) return console.warn(`[跳过] 文件不存在: ${file}`);
  const bak = `${p}.bak`;

  if (isRestore) {
    if (fs.existsSync(bak)) {
      fs.copyFileSync(bak, p);
      fs.unlinkSync(bak);
      console.log(`[已还原] ${file}`);
    } else {
      console.log(`[无需还原] 未找到备份: ${file}`);
    }
    return;
  }

  if (!fs.existsSync(bak)) {
    fs.copyFileSync(p, bak);
    console.log(`[已备份] ${file} -> ${file}.bak`);
  }

  let content = fs.readFileSync(bak, 'utf-8');
  for (const [search, replace] of transforms) {
    if (typeof search === 'string') {
      if (!content.includes(search)) {
        console.warn(`[警告] 在 ${file} 中未匹配到目标代码，请核对版本`);
      } else {
        content = content.replace(search, replace);
      }
    } else if (search instanceof RegExp) {
      content = content.replace(search, replace);
    }
  }
  fs.writeFileSync(p, content, 'utf-8');
  console.log(`[成功] 已更新: ${file}`);
}

if (isRestore) {
  console.log('正在执行一键还原，恢复所有原始文件...');
} else {
  console.log('正在应用个人定制补丁 (支持 node apply-font-patch.mjs --restore 一键还原)...');
}

// =========================================================================
// 1. public/fonts/fonts.css: 自动注册 FOT-Rodin 和 Skurri 字体
// =========================================================================
applyPatchToFile('public/fonts/fonts.css', [
  [
    `@font-face {
  font-family: 'Novecento Wide';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/novecento-wide-normal.woff2') format('woff2'),
       url('/fonts/novecento-wide-normal.otf') format('opentype');
}`,
    `@font-face {
  font-family: 'Novecento Wide';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/novecento-wide-normal.woff2') format('woff2'),
       url('/fonts/novecento-wide-normal.otf') format('opentype');
}

@font-face {
  font-family: 'FOT-Rodin';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('/fonts/fot-rodin-m.otf') format('opentype');
}

@font-face {
  font-family: 'Skurri';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/skurri.otf') format('opentype');
}`
  ]
]);

// =========================================================================
// 2. public/css/theme.css: 全局字体栈切换
// =========================================================================
applyPatchToFile('public/css/theme.css', [
  [
    "--font-num: 'Bender', 'Rajdhani', 'Oxanium', var(--cjk-faces), sans-serif;",
    "--font-num: 'Novecento Wide', 'Novecento', 'Bender', 'Rajdhani', 'Oxanium', var(--cjk-faces), sans-serif;"
  ]
]);

// =========================================================================
// 3. server/sim/damage.js: 严格规范官方元组，准确分流打条与爆条
// =========================================================================
applyPatchToFile('server/sim/damage.js', [
  [
    "battle._ev(['dmg', target.id, Math.round(amt), el]);",
    "battle._ev(['dmg', target.id, Math.round(amt), `${el}-dmg`]);"
  ],
  [
    `  if (dmg && !dmg.silent && amount >= 0.5) {
    const shown = dmg.type === 'element' ? dmg.element : dmg.type === 'elemental' ? (dmg.element || 'true') : dmg.type;
    // 'r' is display-only (official red number). Absent on every other hit, so the tuple stays four elements.
    const ev = ['dmg', target.id, Math.round(amount), shown];
    if (mark === 'r') ev.push('r');
    battle._ev(ev);
  }`,
    `  if (dmg && !dmg.silent && amount >= 0.5) {
    let shown = dmg.type;
    if (dmg.type === 'elemental' && dmg.element) {
      shown = dmg.element;
    } else if (dmg.type === 'element') {
      shown = \`\${dmg.element}-dmg\`;
    }
    const expectedXa = officialExpectedAmount(dmg, dmg.type, target.s, target, source);
    const ratioCrit = officialDamageMark(amount, expectedXa) === 'r';
    const hpCrit = target.maxHp > 0 && amount >= target.maxHp * 0.18;

    const ev = ['dmg', target.id, Math.round(amount), shown];
    if (mark === 'r' || ratioCrit) ev.push('r');
    else ev.push('');
    ev.push(hpCrit ? 'hp' : '');
    battle._ev(ev);
  }`
  ],
  // ---- 官方红字（暴击）判定修正，PRTS「伤害红字」规则 -----------------------------------------------
  // ① DamageInfo 新增辅助字段: postScaleMul / postMul（回退路径期望侧剔除的临时攻击倍率）/ crit（强制红）
  [
    `    mul: d.mul ?? 1,
    canDodge: d.canDodge ?? (type === 'phys' || type === 'arts'),`,
    `    mul: d.mul ?? 1,
    // 官方红字（暴击）判定的辅助字段（PRTS 伤害红字）。期望主路径 = 来源「不带任何倍率的普通攻击」
    // （damage.js officialExpectedAmount），一切攻击倍率与临时增加都不进期望、自身去比 1.5 阈值，
    // 这些标记只服务无有效来源 / 非攻击实例的回退路径: postScaleMul / postMul = 从 amount / mul 一侧
    // 剔除的临时攻击倍率（附加伤害、浮游炮弹这类实例）。crit = 强制红字，仅官方点名的特定技能
    // （谜图「疑点追踪」满层、蕾缪安「归乡邀约」瞄准、「礼炮·强制追思」），无视阈值必定红。
    postScaleMul: d.postScaleMul ?? 1,
    postMul: d.postMul ?? 1,
    crit: d.crit === true,
    canDodge: d.canDodge ?? (type === 'phys' || type === 'arts'),`
  ],
  // ② 期望伤害 = 来源「不带任何倍率的普通攻击」（官服实测定案）。「攻击力提升至X%」与
  //    「造成相当于攻击力X%的伤害」同样是攻击倍率——只抬实际值、不进期望，倍率自身去比
  //    1.5 阈值（德克萨斯 S2 剑雨 专三 170% 红 / 7 级 135% 白；老鲤 S2 驱凶辟邪的标记
  //    爆炸同理必红，其普攻倍率 1 恒白）。我方攻击/技能实例走主路径；敌方攻击、无有效
  //    来源或非攻击实例回退 amount 剔除法（恒白）。
  [
    ` * [ASSUMED] \`dmg.amount\` is already the attack's stated ATK × 攻击倍率 — callers bake \`atkScaleMul\` in, and this
 * does not divide it back out. \`dmg.mul\` stays on both sides (the instance's own scale, including a skill-hit
 * fraction). Cached-ATK expected damage (raw ATK only), forced red, blue numbers and yellow BLOCK have no
 * DamageInfo flag here and are not applied.
 */
function officialExpectedAmount(dmg, type, ts, target) {
  const base = mitigate(dmg.amount, type, ts, {
    defIgnorePct: 0, defIgnoreFlat: 0, resIgnorePct: 0, resIgnoreFlat: 0,
    elementalRes: type === 'elemental' ? (target.def?.epDamageResistance ?? 0) : 0,
  });
  const mul = Number.isFinite(dmg.mul) ? dmg.mul : 1;
  const exp = base * mul;
  return Number.isFinite(exp) && exp > 0 ? exp : 0;
}`,
    ` * Expected damage = the attacker's unscaled plain attack: the source's current ATK attribute (panel
 * 攻击力+X% included; off-field / sourceless skill instances read the credited source — PRTS 缓存攻击力:
 * 期望直接用攻击力属性), mitigated like the hit but without penetration. Every 攻击倍率 — attack@atk_scale
 * 「攻击力提升至X%」 and the inline skill formulas 「造成相当于攻击力X%的伤害」 alike (官服实测: 德克萨斯
 * S2 剑雨 专三 170% 红 / 7 级 135% 白; 老鲤 S2 驱凶辟邪的标记爆炸同理，其普攻倍率 1 恒白) — and every
 * temporary raise only lifts the final damage, never this expectation, so any ≥1.5 multiple passes the
 * threshold by itself. Forced red, blue numbers and yellow BLOCK have no DamageInfo flag here.
 */
function officialExpectedAmount(dmg, type, ts, target, source) {
  const ps = source && source.side === 'ally' ? peekStats(source) : null;
  if ((dmg.isAttack || dmg.isSkill) && ps && Number.isFinite(ps.atk) && ps.atk > 0) {
    const base = mitigate(ps.atk, type, ts, {
      defIgnorePct: 0, defIgnoreFlat: 0, resIgnorePct: 0, resIgnoreFlat: 0,
      elementalRes: type === 'elemental' ? (target.def?.epDamageResistance ?? 0) : 0,
    });
    return Number.isFinite(base) && base > 0 ? base : 0;
  }
  // Fallback — enemy hits, no usable source, or a plain instance that is neither attack nor skill: strip the
  // tagged temporary scale (postScaleMul / postMul) off dmg.amount instead. Ally attack/skill damage never
  // lands here, so this path stays ratio ≈ 1 (white).
  const tagged = Number.isFinite(dmg.postScaleMul) && dmg.postScaleMul > 0 ? dmg.postScaleMul : 1;
  const base = mitigate(tagged > 1 ? dmg.amount / tagged : dmg.amount, type, ts, {
    defIgnorePct: 0, defIgnoreFlat: 0, resIgnorePct: 0, resIgnoreFlat: 0,
    elementalRes: type === 'elemental' ? (target.def?.epDamageResistance ?? 0) : 0,
  });
  const postMul = Number.isFinite(dmg.postMul) && dmg.postMul > 0 ? dmg.postMul : 1;
  const mul = (Number.isFinite(dmg.mul) ? dmg.mul : 1) / postMul;
  const exp = base * mul;
  return Number.isFinite(exp) && exp > 0 ? exp : 0;
}`
  ],
  // ④ 闪避判定: crit 的当次攻击「本可红字」，被闪避 → 黄字 MISS
  [
    `      const peeked = !dmg.sourceless ? peekStats(source) : null;
      const red = officialDamageMark(landedPreShield(dmg, type, ts, peeked, target), officialExpectedAmount(dmg, type, ts, target)) === 'r';`,
    `      const peeked = !dmg.sourceless ? peekStats(source) : null;
      const red = dmg.crit || officialDamageMark(landedPreShield(dmg, type, ts, peeked, target), officialExpectedAmount(dmg, type, ts, target, source)) === 'r';`
  ],
  // ⑤ 频次单位的红字标记也走同一套期望
  [
    `    const mark = officialDamageMark(instance, officialExpectedAmount(dmg, type, ts, target));`,
    `    const mark = dmg.crit ? 'r' : officialDamageMark(instance, officialExpectedAmount(dmg, type, ts, target, source));`
  ],
  // ⑥ 主标记点: crit 强制红；期望侧剔除来源的攻击力倍率增益
  [
    `  const mark = officialDamageMark(final, officialExpectedAmount(dmg, type, ts, target));`,
    `  const mark = dmg.crit ? 'r' : officialDamageMark(final, officialExpectedAmount(dmg, type, ts, target, source));`
  ]
]);

// =========================================================================
// 4. public/js/render/app.js: 适配 dmg 事件分发（透传 ratioCrit 与 hpCrit），含 v0.2.6 新增的 ammoCount 设置
// =========================================================================
applyPatchToFile('public/js/render/app.js', [
  // 默认开启官方还原数字行为（默认预设即「官方还原」；设置推送会覆盖）
  [
    `  const settings = { damageNumbers: true, officialDamageNumbers: false, ammoCount: false, quality: 'high', ...(opts.settings || {}) };`,
    `  const settings = { damageNumbers: true, officialDamageNumbers: false, authenticNums: true, ammoCount: false, quality: 'high', ...(opts.settings || {}) };`
  ],
  [
    `      case 'dmg': {
        const v = views.get(e[1]);
        if (!v) break;
        const amt = Number(e[2]) || 0;
        const m = meleePending.get(v.id);
        let src = null;
        if (m && now - m.t < 0.35) { src = m.src; meleePending.delete(v.id); fx._slashAt = src.id; }
        fx.damage(v, amt, e[3], src, e[4]);
        break;
      }`,
    `      case 'dmg': {
        const v = views.get(e[1]);
        if (!v) break;
        const amt = Number(e[2]) || 0;
        const m = meleePending.get(v.id);
        let src = null;
        if (m && now - m.t < 0.35) { src = m.src; meleePending.delete(v.id); fx._slashAt = src.id; }
        fx.damage(v, amt, e[3], src, e[4], e[5], e[6]);
        break;
      }`
  ],
  [
    `    setSettings(s) {
      if (!s || typeof s !== 'object') return;
      const q = settings.quality;
      if (typeof s.damageNumbers === 'boolean') settings.damageNumbers = s.damageNumbers;
      if (typeof s.officialDamageNumbers === 'boolean') settings.officialDamageNumbers = s.officialDamageNumbers;
      if (typeof s.ammoCount === 'boolean') settings.ammoCount = s.ammoCount;   // the units read it every frame (ctx.settings)
      if (s.quality === 'high' || s.quality === 'medium' || s.quality === 'low') settings.quality = s.quality;
      if (q !== settings.quality) { board3d?.setQuality?.(settings.quality); resize(); }
    },`,
    `    setSettings(s) {
      if (!s || typeof s !== 'object') return;
      const q = settings.quality;
      if (typeof s.damageNumbers === 'boolean') settings.damageNumbers = s.damageNumbers;
      if (typeof s.officialDamageNumbers === 'boolean') settings.officialDamageNumbers = s.officialDamageNumbers;
      if (typeof s.authenticNums === 'boolean') settings.authenticNums = s.authenticNums;   // 官方还原数字行为（头顶居中/不合并/无上限）
      if (typeof s.ammoCount === 'boolean') settings.ammoCount = s.ammoCount;   // the units read it every frame (ctx.settings)
      if (s.quality === 'high' || s.quality === 'medium' || s.quality === 'low') settings.quality = s.quality;
      if (q !== settings.quality) { board3d?.setQuality?.(settings.quality); resize(); }
      Object.assign(settings, s);
    },`
  ]
]);

// =========================================================================
// 5. public/js/render/style.js: 兼容 v0.2.5 原生 crit/miss 并扩展 12 项独立外观映射
// =========================================================================
applyPatchToFile('public/js/render/style.js', [
  [
    `export const DMG_STYLE = Object.freeze({
  phys: { font: 'sp-dmg-phys', fill: ['#fffbe8', '#ffb35c'], stroke: '#3b1400' },
  arts: { font: 'sp-dmg-arts', fill: ['#fbe8ff', '#c77dff'], stroke: '#2a0b45' },
  true: { font: 'sp-dmg-true', fill: ['#ffffff', '#e8e8e8'], stroke: '#2a2a2a' },
  heal: { font: 'sp-dmg-heal', fill: ['#eafff0', '#62f08a'], stroke: '#07361a' },
  elem: { font: 'sp-dmg-elem', fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000' },
  // Official red integer and yellow MISS (PRTS 作战机制 「伤害红字（暴击）」, MISS #ff9000). Default numbers never use these.
  crit: { font: 'sp-dmg-crit', fill: ['#ffd0d0', '#ff2a2a'], stroke: '#4a0000' },
  miss: { font: 'sp-dmg-miss', fill: ['#ffe0a8', '#ff9000'], stroke: '#4a2400' },
});`,
    `export const DMG_STYLE = Object.freeze({
  phys: { font: 'sp-dmg-phys' },
  arts: { font: 'sp-dmg-arts' },
  true: { font: 'sp-dmg-true' },
  heal: { font: 'sp-dmg-heal' },
  'burn-dmg': { font: 'sp-burn-dmg' },
  'neural-dmg': { font: 'sp-neural-dmg' },
  'apoptosis-dmg': { font: 'sp-apoptosis-dmg' },
  'erosion-dmg': { font: 'sp-erosion-dmg' },
  burn: { font: 'sp-dmg-burn' },
  neural: { font: 'sp-dmg-neural' },
  apoptosis: { font: 'sp-dmg-apoptosis' },
  erosion: { font: 'sp-dmg-erosion' },
  crit: { font: 'sp-dmg-crit' },
  miss: { font: 'sp-dmg-miss' },
});`
  ],
  [
    `/** Map b.ev dmg types to a style key. */
export function dmgStyleKey(type) {
  if (type === 'phys' || type === 'arts' || type === 'true' || type === 'heal') return type;
  if (type === 'burn' || type === 'neural' || type === 'necrosis' || type === 'apoptosis' || type === 'erosion' || type === 'element') return 'elem';
  return 'phys';
}`,
    `/** Map b.ev dmg types to a style key. */
export function dmgStyleKey(type) {
  if (DMG_STYLE[type]) return type;
  return 'phys';
}`
  ]
]);
// =========================================================================
// 6. public/js/render/fx/fonts.js: 动态生成 4 大风格
// =========================================================================
applyPatchToFile('public/js/render/fx/fonts.js', [
  [
    `let fontsReady = false;

/** Generate the damage-number bitmap fonts (after web fonts loaded, if possible). */
export function ensureDamageFonts() {
  if (fontsReady) return;
  const P = globalThis.PIXI;
  for (const st of Object.values(DMG_STYLE)) {
    try {
      P.BitmapFont.from(st.font, {
        fontFamily: ['Bender', 'Oxanium', 'Rajdhani', 'Arial Black', 'sans-serif'], fontSize: 44, fontWeight: '700',
        fill: st.fill, fillGradientStops: [0.25, 1], stroke: st.stroke, strokeThickness: 7,
        dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: 0.45, dropShadowDistance: 2, dropShadowBlur: 2,
      }, { chars: st.font === 'sp-dmg-miss' ? [['0', '9'], '+-×!', 'MISS'] : [['0', '9'], '+-×!'], resolution: 2, padding: 6 });
    } catch (err) { console.warn('[fx] bitmap font', st.font, err?.message || err); }
  }
  fontsReady = true;
}`,
    `let fontsReady = false;

export const PRESET_DAMAGE_STYLES = Object.freeze({
  original: {
    phys: { fill: ['#fffbe8', '#ffb35c'], stroke: '#3b1400', grad: true, strokeOn: true },
    arts: { fill: ['#fbe8ff', '#c77dff'], stroke: '#2a0b45', grad: true, strokeOn: true },
    true: { fill: ['#ffffff', '#e8e8e8'], stroke: '#2a2a2a', grad: true, strokeOn: true },
    heal: { fill: ['#eafff0', '#62f08a'], stroke: '#07361a', grad: true, strokeOn: true },
    'burn-dmg': { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    'neural-dmg': { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    'apoptosis-dmg': { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    'erosion-dmg': { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    burn: { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    neural: { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    apoptosis: { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    erosion: { fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000', grad: true, strokeOn: true },
    crit: { fill: ['#ffd0d0', '#ff2a2a'], stroke: '#4a0000', grad: true, strokeOn: true },
    miss: { fill: ['#ffe0a8', '#ff9000'], stroke: '#4a2400', grad: true, strokeOn: true },
  },
  authentic: {
    phys: { fill: '#ffffff', strokeOn: false },
    arts: { fill: '#F6C144', strokeOn: false },
    true: { fill: '#B5B5B6', strokeOn: false },
    heal: { fill: '#50B98E', strokeOn: false },
    'burn-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#7B3A2C' },
    'neural-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#267A6D' },
    'apoptosis-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#393B3B' },
    'erosion-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#33597A' },
    burn: { fill: '#7B3A2C', strokeOn: false },
    neural: { fill: '#267A6D', strokeOn: false },
    apoptosis: { fill: '#393B3B', strokeOn: false },
    erosion: { fill: '#33597A', strokeOn: false },
    crit: { fill: '#E34C25', strokeOn: false },
    miss: { fill: '#ff9000', strokeOn: false },
  },
  elemental: {
    phys: { fill: '#FFFFFF', strokeOn: true, stroke: '#1f1f1f' },
    arts: { fill: '#B37FEB', strokeOn: true, stroke: '#22075e' },
    true: { fill: '#FFD666', strokeOn: true, stroke: '#613400' },
    heal: { fill: '#52C41A', strokeOn: true, stroke: '#092b00' },
    'burn-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#FF4D4F' },
    'neural-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#13C2C2' },
    'apoptosis-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#722ED1' },
    'erosion-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#1890FF' },
    burn: { fill: '#FF4D4F', strokeOn: true, stroke: '#5c0011' },
    neural: { fill: '#13C2C2', strokeOn: true, stroke: '#002329' },
    apoptosis: { fill: '#722ED1', strokeOn: true, stroke: '#120338' },
    erosion: { fill: '#1890FF', strokeOn: true, stroke: '#002766' },
    crit: { fill: '#FF4D4F', strokeOn: true, stroke: '#000000' },
    miss: { fill: '#FAAD14', strokeOn: true, stroke: '#000000' },
  },
  arcade: {
    phys: { fill: ['#FFF1B8', '#FA8C16'], grad: true, strokeOn: true, stroke: '#2b1000' },
    arts: { fill: ['#E6F7FF', '#69C0FF'], grad: true, strokeOn: true, stroke: '#001d66' },
    true: { fill: '#FFF566', strokeOn: true, stroke: '#3f3000' },
    heal: { fill: ['#F6FFED', '#73D13D'], grad: true, strokeOn: true, stroke: '#0b3a00' },
    'burn-dmg': { fill: '#e6edf3', strokeOn: true, stroke: '#8c4333' },
    'neural-dmg': { fill: '#e6edf3', strokeOn: true, stroke: '#3b7067' },
    'apoptosis-dmg': { fill: '#e6edf3', strokeOn: true, stroke: '#484b4b' },
    'erosion-dmg': { fill: '#e6edf3', strokeOn: true, stroke: '#3a5973' },
    burn: { fill: ['#FFC069', '#D4380D'], grad: true, strokeOn: true, stroke: '#2b0000' },
    neural: { fill: ['#87E8DE', '#08979C'], grad: true, strokeOn: true, stroke: '#001a1c' },
    apoptosis: { fill: ['#B37FEB', '#531DAB'], grad: true, strokeOn: true, stroke: '#0d0024' },
    erosion: { fill: ['#91D5FF', '#096DD9'], grad: true, strokeOn: true, stroke: '#001538' },
    crit: { fill: '#ff4d4f', strokeOn: false },
    miss: { fill: '#faad14', strokeOn: false },
  }
});

// 旧版本存档里的预设 id 迁移（official→authentic 官方还原 / tactical→elemental 属性风暴 / minimal→arcade 街机硬派）
const PRESET_ALIASES = { official: 'authentic', tactical: 'elemental', minimal: 'arcade' };
const normalizePresetMode = (m) => PRESET_ALIASES[m] || m;

export function getCustomDamageConfig() {
  let mode = 'authentic';
  try { mode = normalizePresetMode(JSON.parse(localStorage.getItem('sp.pref.settings'))?.presetMode || 'authentic'); } catch (e) {}
  if (mode !== 'custom' && PRESET_DAMAGE_STYLES[mode]) return PRESET_DAMAGE_STYLES[mode];
  try {
    const raw = localStorage.getItem('sp.pref.damageStyleCustom');
    if (raw) return { ...PRESET_DAMAGE_STYLES.authentic, ...JSON.parse(raw) };
  } catch (e) {}
  return PRESET_DAMAGE_STYLES.authentic;
}

export async function rebuildDamageFonts(fontKey = 'novecento') {
  const P = globalThis.PIXI;
  if (!P) return;

  if (document.fonts?.load) {
    try {
      if (fontKey === 'rodin') await document.fonts.load('700 40px FOT-Rodin');
      else if (fontKey === 'skurri') await document.fonts.load('400 40px Skurri');
      else if (fontKey === 'novecento') await document.fonts.load('400 40px "Novecento Wide"');
    } catch (e) {}
  }

  const cfg = getCustomDamageConfig();
  let mode = 'authentic';
  let userWeight = '400', userStroke = null, userStop = null;
  try {
    const s = JSON.parse(localStorage.getItem('sp.pref.settings'));
    mode = normalizePresetMode(s?.presetMode || 'authentic');
    userWeight = s?.customWeight || (mode === 'original' || mode === 'arcade' ? '700' : mode === 'elemental' ? '700' : '400');
    userStroke = s?.customStroke != null ? Number(s.customStroke) : null;
    userStop = s?.customStop != null ? Number(s.customStop) : null;
  } catch (e) {}

  const isOrig = (mode === 'original');
  const fontFam = (fontKey === 'bender') ? 'Bender, Rajdhani, sans-serif'
    : (fontKey === 'rodin') ? 'FOT-Rodin, sans-serif'
    : (fontKey === 'skurri') ? 'Skurri, sans-serif'
    : (fontKey === 'oxanium') ? 'Oxanium, Rajdhani, sans-serif'
    : (fontKey === 'rajdhani') ? 'Rajdhani, Oxanium, sans-serif'
    : (fontKey === 'system') ? 'sans-serif'
    : 'Novecento Wide, Novecento, Bender, sans-serif';

  for (const [key, item] of Object.entries(cfg)) {
    const fontName = 'sp-dmg-' + key;
    try {
      if (P.BitmapFont.available[fontName]) delete P.BitmapFont.available[fontName];
      if (P.BitmapFont.available[fontName + '-crit']) delete P.BitmapFont.available[fontName + '-crit'];

      const fillVal = Array.isArray(item.fill) ? item.fill : (item.grad ? [item.fill, item.fill2 || item.fill] : item.fill);
      const defStroke = isOrig ? 7 : (item.strokeOn ? (item.strokeThickness || 4) : 0);
      const strokeThick = userStroke != null ? (item.strokeOn !== false ? userStroke : 0) : defStroke;
      const stopVal = userStop != null ? userStop : (isOrig ? 0.25 : 0.2);
      const gradStops = Array.isArray(fillVal) ? [stopVal, 1] : undefined;
      const charsConfig = (key === 'miss') ? [['0', '9'], '+-×!', 'MISS'] : [['0', '9'], '+-×!'];

      P.BitmapFont.from(fontName, {
        fontFamily: fontFam, fontSize: 44, fontWeight: userWeight, fill: fillVal,
        fillGradientStops: gradStops,
        strokeThickness: strokeThick, stroke: item.stroke || '#000000',
        dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: isOrig ? 0.45 : 0.6, dropShadowDistance: 2, dropShadowBlur: 2,
      }, { chars: charsConfig, resolution: 2, padding: 6 });

      P.BitmapFont.from(fontName + '-crit', {
        fontFamily: fontFam, fontSize: 48, fontWeight: '700', fill: fillVal,
        fillGradientStops: gradStops,
        strokeThickness: strokeThick, stroke: item.stroke || '#000000',
        dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: 0.7, dropShadowDistance: 2, dropShadowBlur: 2,
      }, { chars: charsConfig, resolution: 2, padding: 6 });
    } catch (e) { /* ignore */ }
  }

  // COST / SP 弹字专用字体：白色基底，染什么色就是什么色（E0A32C 金 / D4121A 红 / 6FC6D2 青）
  try {
    if (P.BitmapFont.available['sp-dmg-label']) delete P.BitmapFont.available['sp-dmg-label'];
    P.BitmapFont.from('sp-dmg-label', {
      fontFamily: fontFam, fontSize: 44, fontWeight: userWeight, fill: '#ffffff',
      dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: 0.6, dropShadowDistance: 2, dropShadowBlur: 2,
    }, { chars: 'COSTSP!0123456789-+− ', resolution: 2, padding: 4 });
  } catch (e) { /* ignore */ }
}

export function ensureDamageFonts() {
  if (fontsReady) return;
  let savedFont = 'novecento';
  try { savedFont = JSON.parse(localStorage.getItem('sp.pref.settings'))?.dmgFont || 'novecento'; } catch(e){}
  rebuildDamageFonts(savedFont);
  fontsReady = true;
}`
  ]
]);

// =========================================================================
// 7. public/js/render/fx/numbers.js: 高度/抖动/重叠/避让/速度/合并/上限滑块两条管线全面支持 + 官方数字行为
//    头顶间距/经典锚点均随模型头高等比（UNIT.headroom=1.18 归一: 官方间距 ×hT/1.18，矮敌不悬空、高敌不贴头，
//    干员=基准故已调好的 1 格不变；经典锚点恢复作者 0.8×头高原样，高度滑块在其上缩放）
//    （authenticNums 出厂值 = 官方本尊: 头顶正中央、无抖动、不合并、无上限、迅速上浮后迅速消失，滑块可自由偏离；
//     暴击加大加粗，仅「仅显示官方数字」开启时红字才是不加粗 #E34C25）
//    暴击入场动画 critPopAnim（默认开、仅官方还原模式的暴击、独立开关不随预设变 custom）:
//    暴击数字快速放大→迅速缩小（正弦包络）；普攻/技能/治疗/MISS 与其他风格一律不受影响。
// =========================================================================
applyPatchToFile('public/js/render/fx/numbers.js', [
  // 0. 引入 UNIT：等比头高基准 UNIT.headroom（干员标准身量 1.18；头顶间距随模型高矮用它归一）
  [
    "import { DMG_STYLE, HIT_TINT, dmgStyleKey } from '../style.js';",
    "import { DMG_STYLE, HIT_TINT, dmgStyleKey, UNIT } from '../style.js';"
  ],
  [
    "const numScale = (s, big, style) => clamp(s / 115, 0.42, 1.05) * (big ? 1.35 : 1) * (style === 'heal' ? 0.9 : 1);",
    `const numScale = (s, big, style) => {
  // 治疗基准 0.75: 24×0.75=18px，与 SP/COST 小字同大（2026-10-15 应用户要求自 0.65 上调）；原版经典预设仍走作者的 0.9
  let baseMult = 1.0, healRatio = 0.75;
  try {
    const pref = JSON.parse(localStorage.getItem('sp.pref.settings'));
    baseMult = Number(pref?.dmgScale) || 1.0;
    healRatio = pref?.customHealRatio != null ? Number(pref.customHealRatio) : (pref?.presetMode === 'original' ? 0.9 : 0.75);
  } catch (e) {}
  return clamp(s / 115, 0.42, 1.05) * baseMult * (big ? 1.35 : 1) * (style === 'heal' ? healRatio : 1);
};`
  ],
  // 1. 拦截 dmg 签名与触发条件
  [
    `  damage(view, amount, type, srcView, mark) {
    if (!view) return;
    const style = dmgStyleKey(type);
    const p = this._chest(view);
    const px = p.x, py = p.y, s = p.s;
    const tint = HIT_TINT[style] || 0xffffff;
    const big = view.maxHp > 0 && amount >= view.maxHp * 0.18;`,
    `  damage(view, amount, type, srcView, mark, hpMark) {
    if (!view) return;
    const style = dmgStyleKey(type);
    const p = this._chest(view);
    const px = p.x, py = p.y, s = p.s;
    const tint = HIT_TINT[style] || 0xffffff;

    const ratioCrit = (mark === 'r');
    const hpCrit = (hpMark === 'hp') || (view.maxHp > 0 && amount >= view.maxHp * 0.18);
    const cfgMode = this.ctx.settings?.critMode || 'ratio15';
    const isCritOn = this.ctx.settings?.critOn !== false;
    const byRatio = this.ctx.settings?.critByRatio !== false;
    const byHp = this.ctx.settings?.critByHp !== false;

    const isTriggeredCrit = isCritOn && (
      (cfgMode === 'ratio15' && ratioCrit) || (cfgMode === 'hp18' && hpCrit) || (cfgMode === 'both' && (ratioCrit || hpCrit)) || (cfgMode === 'scaleOnly' && (ratioCrit || hpCrit))
    );
    const big = isTriggeredCrit;`
  ],
  // 2. 官方红字调用
  [
    `    // Official mode (设置「官方伤害数字」): only a sim-marked red integer. Sparks and the slash stay.
    if (this.ctx.settings?.officialDamageNumbers) {
      if (mark === 'r') this.officialNumber(view, amount, 'crit');
      return;
    }
    this.number(view, amount, style, big);`,
    `    if (this.ctx.settings?.officialDamageNumbers) {
      if (mark === 'r') this.officialNumber(view, amount, 'crit');
      return;
    }
    // 官方数字行为（authenticNums，「官方还原」预设打开，也可在「高级微调」里用「官方数字行为」开关直接切换）:
    // 普攻/技能伤害也保留数字（同人特点），但走官方弹字管线——头顶居中、快速上浮消失；
    // 合并/抖动/上限/高度/上浮速度随「高级微调」滑块（出厂值即官方表现）。暴击与普攻路径一致
    // （加大加粗、类型色，带入场动画）；仅「仅显示官方数字」开启时（上面分支）红字才是不加粗的官方 #E34C25。
    if (this.ctx.settings?.authenticNums) { this.officialNumber(view, amount, style, big); return; }
    this.number(view, amount, style, big, isTriggeredCrit, ratioCrit, hpCrit);`
  ],
  // 3. 彻底修复 officialNumber (解决正上方脚底透视与粗体)
  [
    `  officialNumber(view, amount, style) {
    if (!view) return;
    const miss = style === 'miss';
    const n = miss ? 0 : Math.round(amount);
    if (!miss && (!Number.isFinite(n) || n < 0)) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const base = (view.z || 0) + (view.hover || 0) + (view._headTiles || 1.2) * 0.8;
    const a = cam.project(view.x, view.y, base, this._p);
    const ax = a.x, ay = a.y, s = a.s > 0 ? a.s : 100;
    const pxPerZ = ay - cam.project(view.x, view.y, base + 1, this._q).y;
    const tile = pxPerZ > 1e-3 ? pxPerZ : s;
    const cx = ax + (Math.random() - 0.5) * OFFICIAL_JITTER_X * tile;
    const cy = ay - (OFFICIAL_LIFT_MIN + Math.random() * OFFICIAL_LIFT_SPAN) * tile;
    const sc = numScale(s, false, style);
    const w = numChars(n, style) * NUM_DIGIT_EM * 24 * sc * NUM_POP + NUM_GAP_PX;
    const h = 24 * NUM_LINE_EM * sc * NUM_POP;
    const maxNums = this.load >= 2 ? MAX_NUMBERS >> 1 : MAX_NUMBERS;
    while (this.nums.length >= maxNums) this._releaseNum(this.nums.shift());
    const t = this._takeNum(style);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = miss ? 'MISS' : String(n);
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: NUM_LIFE, born: now, lastHit: now, pop: 1, big: false, fading: false,
      official: true, ox: cx - ax, oy: cy - ay, x0: view.x, y0: view.y, z0: base,
      risePx: NUM_RISE * tile * 0.5, _x: cx, _y: cy, _w: w, _h: h,
    });`,
    `  officialNumber(view, amount, style, bigCrit = false) {
    if (!view) return;
    const miss = style === 'miss';
    const n = miss ? 0 : Math.round(amount);
    if (!miss && (!Number.isFinite(n) || n < 0)) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const feetZ = (view.z || 0) + (view.hover || 0);
    const hT = view._headTiles || 1.2;   // 模型头高: 敌人按各自 spine bounds（0.55~2.2，Boss 至 3.2），干员统一 1.18
    const base = feetZ + hT;
    const feet = cam.project(view.x, view.y, feetZ, this._p);
    const head = cam.project(view.x, view.y, base, this._q);
    const s = head.s > 0 ? head.s : 100;
    const pxPerZ = (feet.y - head.y) / hT;
    const tile = pxPerZ > 1e-3 ? pxPerZ : s;
    // 与普攻路径读同一套「高级微调」滑块（this.ctx.settings）。「官方数字行为」的出厂值 = 官方本尊表现:
    // 不合并、0 抖动、无上限(9)、高度/上浮速度 1.0——偏离出厂值后这里同样生效，两条管线不再各说各话。
    const _hO = Number(this.ctx.settings?.customHeight), _jO = Number(this.ctx.settings?.customJitter), _rO = Number(this.ctx.settings?.numRiseSpeed);
    const heightFactor = Number.isFinite(_hO) ? _hO : 1.0;
    const jitterRange = Number.isFinite(_jO) ? _jO : 0;
    const riseSpeed = Number.isFinite(_rO) ? _rO : 1.0;
    const cx = feet.x + (Math.random() - 0.5) * jitterRange * 2 * tile;   // 抖动以「格」计（作者原版同单位），0 = 头顶正中央
    const sc = numScale(s, bigCrit, style);
    const w = numChars(n, style) * NUM_DIGIT_EM * 24 * sc * NUM_POP + NUM_GAP_PX;
    const h = 24 * NUM_LINE_EM * sc * NUM_POP;
    this._layoutNumsOnce(cam);
    // 头顶间距随模型头高等比（×hT/UNIT.headroom）: 矮敌不悬空、高敌不贴头；干员 hT=1.18 恰为基准 → 已调好的 1 格分毫不动
    // 治疗属小字: 间距再乘 SMALL_LIFT(0.9) 稍低于常规数字（SP/COST 小字同规则）
    let cy = head.y - OFFICIAL_LIFT * heightFactor * (hT / UNIT.headroom) * (style === 'heal' ? SMALL_LIFT : 1) * tile;
    // 「跳字避让」开启: 与普攻路径同一套垂直找位（_numSlotPx 只向上叠、不横移，保持官方居中），
    // 新数字盖不到在场的旧数字头上；关闭时官方默认叠放（后来者盖上，官方本尊如此）。
    if (this.ctx.settings?.numAvoid === true) cy = this._numSlotPx(cx, cy, w, h, OFFICIAL_RISE * riseSpeed * tile);
    // 「跳字合并」开启时同样并入同目标的同类型官方数字（相加后再弹一下，暴击入场动画也会重触发）。
    if (this.ctx.settings?.numMerge !== false && !miss) {
      let youngest = null;
      for (const t of this.nums) {
        if (!t.official || t.unit !== view || t.fading || t.style !== style) continue;
        if (!youngest || t.born > youngest.born) youngest = t;
      }
      if (youngest && now - youngest.lastHit < NUM_MERGE_GAP && youngest.life < OFFICIAL_RISE_T * 0.55) {
        youngest.value += n;
        youngest.text.text = String(youngest.value);
        youngest.pop = 1;
        youngest.big = youngest.big || bigCrit;
        youngest.lastHit = now;
        this._sizeNum(youngest);
        return;
      }
    }
    // 「同目标跳字上限」: 9 = 无上限（官方本尊不设限的出厂值）；设了具体数值就让最老的官方数字先淡出。
    const capRaw = Number(this.ctx.settings?.numMaxPerTarget);
    const maxPer = Number.isFinite(capRaw) && capRaw >= 1 ? (capRaw >= 9 ? Infinity : capRaw) : Infinity;
    if (maxPer !== Infinity) {
      let mine = 0, oldest = null;
      for (const t of this.nums) {
        if (!t.official || t.unit !== view || t.fading) continue;
        mine++;
        if (!oldest || t.born < oldest.born) oldest = t;
      }
      if (mine >= maxPer && oldest) this._fadeNum(oldest, 0.1);
    }
    // 常规字重；未开「仅显示官方数字」时的暴击（bigCrit）走加大加粗，与普攻路径一样尊重「暴击加粗」开关。
    const t = this._takeNum(style, bigCrit && this.ctx.settings?.critDoBold !== false);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = miss ? 'MISS' : String(n);
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: OFFICIAL_LIFE, born: now, lastHit: now, pop: 1, big: bigCrit, fading: false,
      official: true, critPop: bigCrit || style === 'crit',   // 官方数字行为下的暴击（加大加粗 / 红字）才有入场动画
      ox: cx - feet.x, oy: cy - feet.y, x0: view.x, y0: view.y, z0: feetZ,
      risePx: OFFICIAL_RISE * riseSpeed * tile, riseT: OFFICIAL_RISE_T, fadeT: OFFICIAL_FADE, _x: cx, _y: cy, _w: w, _h: h,
    });`
  ],
  // 4. 普通跳字的签名与动态高度/抖动/上浮速度
  [
    `  number(view, amount, style, big) {
    const n = Math.round(amount);
    if (!(n > 0) || !view) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const base = (view.z || 0) + (view.hover || 0) + (view._headTiles || 1.2) * 0.8;
    const a = cam.project(view.x, view.y, base, this._p);
    const ax = a.x, ay = a.y, s = a.s > 0 ? a.s : 100;
    const pxPerZ = ay - cam.project(view.x, view.y, base + 1, this._q).y;
    const risePx = NUM_RISE * (pxPerZ > 1e-3 ? pxPerZ : s * 0.5);`,
    `  number(view, amount, style, big, isCrit = false, ratioCrit = false, hpCrit = false) {
    const n = Math.round(amount);
    if (!(n > 0) || !view) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const feetZ = (view.z || 0) + (view.hover || 0);
    // 「高级微调」滑块（官方/普攻两条管线读同一处；无值时用作者原版默认: 高度 1.0 / 无抖动 / 速度 1.0）
    const _hK = Number(this.ctx.settings?.customHeight), _jK = Number(this.ctx.settings?.customJitter), _rK = Number(this.ctx.settings?.numRiseSpeed);
    const heightFactor = Number.isFinite(_hK) ? _hK : 1.0;
    const jitterRange = Number.isFinite(_jK) ? _jK : 0;
    const riseSpeed = Number.isFinite(_rK) ? _rK : 1.0;
    const hT = view._headTiles || 1.2;
    // 作者锚点 = 头高 80% 处（等比，矮敌高敌各按身量；高度滑块在此之上缩放，1.0 = 原版经典原样）
    const span = hT * 0.8 * heightFactor;
    const base = feetZ + span;
    const feet = cam.project(view.x, view.y, feetZ, this._p);
    const head = cam.project(view.x, view.y, base, this._q);

    const ay = head.y;
    const s = head.s > 0 ? head.s : 100;
    const pxPerZ = (feet.y - head.y) / (span > 1e-3 ? span : 1);
    const tile = pxPerZ > 1e-3 ? pxPerZ : s * 0.5;
    const ax = feet.x + (Math.random() - 0.5) * jitterRange * 2 * tile;   // 抖动以「格」计，0 = 无抖动（原版经典原样）
    const risePx = (NUM_RISE * riseSpeed) * tile;`
  ],
  // 5. 控制跳字相加与同屏上限
  [
    `    const merge = youngest && now - youngest.lastHit < NUM_MERGE_GAP && youngest.life < NUM_RISE_T * 0.55 ? youngest
      : (mine >= NUM_PER_TARGET && youngest ? youngest : null);
    if (merge && this._growFits(merge, n, big)) {
      merge.value += n;
      merge.text.text = (style === 'heal' ? '+' : '') + merge.value;
      merge.pop = 1;
      merge.big = merge.big || big;
      merge.lastHit = now;
      merge.end = Math.min(merge.life + NUM_LIFE * 0.75, Math.max(merge.end, merge.life + NUM_LIFE * 0.6), NUM_MAX_LIFE);
      this._sizeNum(merge);
      return;
    }
    if (mine >= NUM_PER_TARGET && oldest) this._fadeNum(oldest, 0.1);`,
    `    const capRaw = Number(this.ctx.settings?.numMaxPerTarget ?? NUM_PER_TARGET);
    const maxPerTarget = capRaw >= 9 ? Infinity : capRaw;   // 9 = ∞ 无上限（「官方数字行为」的出厂值）
    const allowMerge = this.ctx.settings?.numMerge !== false;
    let merge = youngest && now - youngest.lastHit < NUM_MERGE_GAP && youngest.life < NUM_RISE_T * 0.55 ? youngest
      : (mine >= maxPerTarget && youngest ? youngest : null);
    if (!allowMerge) merge = null;
    
    if (merge && this._growFits(merge, n, big)) {
      merge.value += n;
      merge.text.text = (style === 'heal' ? '+' : '') + merge.value;
      merge.pop = 1;
      merge.big = merge.big || big;
      merge.lastHit = now;
      merge.end = Math.min(merge.life + NUM_LIFE * 0.75, Math.max(merge.end, merge.life + NUM_LIFE * 0.6), NUM_MAX_LIFE);
      this._sizeNum(merge);
      return;
    }
    if (mine >= maxPerTarget && oldest) this._fadeNum(oldest, 0.1);`
  ],
  // 6. 控制跳字左右车道避让
  [
    `    let best = null;
    for (const k of NUM_LANES) {
      const cx = ax + k * lane;
      const cy = this._numSlotPx(cx, ay, w, h, risePx);
      const lift = ay - cy;
      if (!best || lift < best.lift - 0.5) best = { cx, cy, lift, k };
      if (lift <= h * 1.2) break;              // low enough: keep the nearest lane
    }`,
    `    const allowAvoid = this.ctx.settings?.numAvoid !== false;
    let best = null;
    if (!allowAvoid) {
      best = { cx: ax, cy: ay, lift: 0, k: 0 };
    } else {
      for (const k of NUM_LANES) {
        const cx = ax + k * lane;
        const cy = this._numSlotPx(cx, ay, w, h, risePx);
        const lift = ay - cy;
        if (!best || lift < best.lift - 0.5) best = { cx, cy, lift, k };
        if (lift <= h * 1.2) break;              // low enough: keep the nearest lane
      }
    }`
  ],
  // 7. 取消原生放大（防止与用户设定叠加）
  [
    "const sc = numScale(s, big, style);",
    `    const isOrig = (this.ctx.settings?.presetMode === 'original');
    const sc = numScale(s, big, style) * (isOrig ? 1.0 : (big ? 1.4 : 1.0));`
  ],
  // 8. 创建文字时正确赋值
  [
    `    const t = this._takeNum(style);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = (style === 'heal' ? '+' : '') + n;
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: life, born: now, lastHit: now, pop: 1, big: !!big, fading: false,
      ox: cx - ax, oy: cy - ay, x0: view.x, y0: view.y, z0: base, risePx, _x: cx, _y: cy, _w: w, _h: h,
    });`,
    `    const doBold = this.ctx.settings?.critDoBold !== false;
    const isBoldCrit = isCrit && doBold;
    const t = this._takeNum(style, isBoldCrit);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = (style === 'heal' ? '+' : '') + n;
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: life, born: now, lastHit: now, pop: 1, big: !!big, isCrit: !!isCrit, fading: false,
      official: false, critPop: false, riseT: undefined, fadeT: undefined,   // 复用池里的官方数字条目时要还原为普攻节奏
      ox: cx - ax, oy: cy - feet.y, x0: view.x, y0: view.y, z0: feetZ, risePx, _x: cx, _y: cy, _w: w, _h: h,
    });`
  ],
  // 9. _takeNum 增加粗体支持
  [
    `  _takeNum(style) {
    const P = this.P;
    const font = DMG_STYLE[style]?.font || DMG_STYLE.phys.font;`,
    `  _takeNum(style, isCrit = false) {
    const P = this.P;
    const baseFont = DMG_STYLE[style]?.font || DMG_STYLE.phys.font;
    const font = isCrit ? baseFont + '-crit' : baseFont;`
  ],
  // 10. COST / SP 弹字：专用白色标签字体（染色即精确色）+ 医疗级小字号（跟随字号滑块）
  [
    `  numberAt(x, y, label, tint, life = 0.8) {
    const P = this.P;
    if (this.labels.length >= 24) { const o = this.labels.shift(); o.t.destroy(); }
    const t = new P.BitmapText(String(label), { fontName: DMG_STYLE.true.font, fontSize: 26, align: 'center' });`,
    `  numberAt(x, y, label, tint, life = 0.8, view = null) {
    const P = this.P;
    if (view) {
      // 传入单位视图: 标签挂到与官方跳字相同的头顶定位（等比间距 + 「高度」滑块）——SP/COST 不再贴在胸口
      const cam = this.ctx.cam();
      const hT = view._headTiles || 1.2;
      const _hf = Number(this.ctx.settings?.customHeight);
      const lift = OFFICIAL_LIFT * (Number.isFinite(_hf) ? _hf : 1.0) * (hT / UNIT.headroom) * SMALL_LIFT;   // 小字比常规数字稍低
      y = cam.project(view.x, view.y, (view.z || 0) + (view.hover || 0) + hT + lift, this._q).y;
    }
    if (this.labels.length >= 24) { const o = this.labels.shift(); o.t.destroy(); }
    let labelScale = 1.0;
    try { labelScale = Number(JSON.parse(localStorage.getItem('sp.pref.settings'))?.dmgScale) || 1.0; } catch (e) {}
    const labelFont = P.BitmapFont.available['sp-dmg-label'] ? 'sp-dmg-label' : DMG_STYLE.true.font;
    const t = new P.BitmapText(String(label), { fontName: labelFont, fontSize: Math.round(18 * labelScale), align: 'center' });`
  ],
  // 11. 官方还原数字常量：头顶正中央、迅速上浮、迅速消失（替换作者时代的随机抖动常量）
  [
    `// [ASSUMED] PRTS says a red number sits at a random spot in a range above the model and gives no pixels.
const OFFICIAL_JITTER_X = 0.7;   // tiles, full width (±0.35)
const OFFICIAL_LIFT_MIN = 0.15;  // tiles above the head
const OFFICIAL_LIFT_SPAN = 0.4;`,
    `// 官方数字行为（authenticNums）: 官方数字在头上正中央呈现、迅速上浮后迅速消失。
// 出厂值 = 官方本尊：不合并、0 抖动、上限 ∞（滑块 9）、高度/上浮速度 1.0——「高级微调」里偏离后同样生效。
const OFFICIAL_LIFT = 1.0;       // tiles: 头顶再抬高（0.45→0.9→1.5→1.0，应用户逐次调整）；实际间距随模型头高等比 ×hT/UNIT.headroom
const SMALL_LIFT = 0.9;          // SP/COST/治疗等小字的头顶间距系数: 比常规数字稍低（2026-10-15 应用户要求）
const OFFICIAL_RISE = 0.34;      // tiles of the quick rise
const OFFICIAL_RISE_T = 0.3;     // seconds of the rise
const OFFICIAL_LIFE = 0.6;       // seconds a number lives
const OFFICIAL_FADE = 0.18;      // fade-out at the end
// 暴击入场动画（仅官方还原模式的暴击——红字或加大加粗两档；设置「暴击入场动画」可关）:
// 很快地先放大、再迅速缩小回落。正弦包络跟随 pop 的 1/6s 衰减窗口，峰 +50% 在 0.083s。
// 其余数字（普攻/技能/治疗/MISS）与其他风格一律不受影响。
const OFFICIAL_CRIT_POP = 0.5;   // peak scale bonus (+50%)`
  ],
  // 12. 治疗跳字：官方还原模式下同样走官方弹字（头顶居中、快速消失）
  [
    `    if (this.ctx.settings?.damageNumbers !== false && !this.ctx.settings?.officialDamageNumbers) this.number(view, amount, 'heal', false);`,
    `    if (this.ctx.settings?.damageNumbers === false) return;
    if (this.ctx.settings?.officialDamageNumbers) return;
    if (this.ctx.settings?.authenticNums) { this.officialNumber(view, amount, 'heal'); return; }
    this.number(view, amount, 'heal', false);`
  ],
  // 13. 上浮缓动 / 竖直位移改为按条目自身的 riseT（官方数字用快节奏，普攻数字用原节奏）
  [
    `      const k = Math.min(1, t.life / NUM_RISE_T);`,
    `      const k = Math.min(1, t.life / (t.riseT ?? NUM_RISE_T));`
  ],
  [
    `        const risen = t.risePx * easeOut(Math.min(1, t.life / NUM_RISE_T));`,
    `        const risen = t.risePx * easeOut(Math.min(1, t.life / (t.riseT ?? NUM_RISE_T)));`
  ],
  // 14. 淡出改为按条目自身的 fadeT
  [
    `      else if (left < NUM_FADE_T) alpha = left / NUM_FADE_T;`,
    `      else if (left < (t.fadeT ?? NUM_FADE_T)) alpha = left / (t.fadeT ?? NUM_FADE_T);`
  ],
  // 15. 官方数字默认叠放（后来者盖上）；「跳字避让」打开后同样参与避让
  [
    `        const b = L[j];
        if (b.fading) continue;`,
    `        const b = L[j];
        if (b.fading) continue;
        if ((a.official || b.official) && this.ctx.settings?.numAvoid !== true) continue;   // 官方默认叠放；避让开启才淡出旧的`
  ],
  // 16. 暴击入场动画（仅官方还原模式的暴击，默认开、可关）: 很快地先放大、再迅速缩小回落——
  //     正弦包络套在 pop 衰减窗口上。其余数字与其他风格不受影响：普攻数字保持作者原版
  //     「出生略大再缩回」，官方普通数字平直出现（官方本尊没有弹跳）。
  [
    `      tx.scale.set(t._sc * (1 + t.pop * (NUM_POP - 1)));`,
    `      const critAnimOn = this.ctx.settings?.critPopAnim !== false;
      const popMul = t.critPop && critAnimOn ? OFFICIAL_CRIT_POP * Math.sin(Math.PI * t.pop) : (t.official ? 0 : t.pop * (NUM_POP - 1));
      tx.scale.set(t._sc * (1 + popMul));`
  ]
]);

// =========================================================================
// 8. public/js/ui/settings.js
// =========================================================================
const damageCustomSectionCode = [
  'const I18N_CUSTOM = {',
  "  '数字风格': { en: 'Number Style', ja: '数字スタイル', ko: '숫자 스타일', 'zh-TW': '數字風格' },",
  "  '原版经典': { en: 'Classic (Original)', ja: 'クラシック', ko: '오리지널 클래식', 'zh-TW': '原版經典' },",
  "  '官方还原': { en: 'Authentic (Arknights)', ja: '公式再現', ko: '공식 재현', 'zh-TW': '官方還原' },",
  "  '属性风暴': { en: 'Elemental (Rodin)', ja: 'エレメンタル', ko: '엘리멘탈', 'zh-TW': '屬性風暴' },",
  "  '街机硬派': { en: 'Arcade (Skurri)', ja: 'アーケード', ko: '아케이드', 'zh-TW': '街機硬派' },",
  "  '自定义': { en: 'Custom', ja: 'カスタム', ko: '커스텀', 'zh-TW': '自訂' },",
  "  '系统默认': { en: 'System Default', ja: 'システム標準', ko: '시스템 기본', 'zh-TW': '系統預設' },",
  "  '高级微调': { en: 'Fine-Tuning', ja: '詳細設定', ko: '고급 설정', 'zh-TW': '進階微調' },",
  "  '展开': { en: 'Expand', ja: '展開', ko: '펼치기', 'zh-TW': '展開' },",
  "  '收起': { en: 'Collapse', ja: '折りたたむ', ko: '접기', 'zh-TW': '收起' },",
  "  '本地字体名称': { en: 'Local Font', ja: 'ローカルフォント', ko: '로컬 폰트', 'zh-TW': '本地字體名稱' },",
  "  '应用字体': { en: 'Apply', ja: '適用', ko: '적용', 'zh-TW': '應用字體' },",
  "  '伤害跳字字号': { en: 'Damage Scale', ja: '文字サイズ', ko: '폰트 크기', 'zh-TW': '傷害跳字字級' },",
  "  '治疗字号比例': { en: 'Heal Ratio', ja: '回復サイズ比', ko: '치료 크기 비율', 'zh-TW': '治療字級比例' },",
  "  '跳字垂直高度': { en: 'Damage Height', ja: '跳字の高さ', ko: '데미지 높이', 'zh-TW': '跳字垂直高度' },",
  "  '跳字左右抖动': { en: 'Damage Jitter', ja: '左右ゆらぎ', ko: '좌우 흔들림', 'zh-TW': '跳字左右抖動' },",
  "  '统一元素为单色': { en: 'Unify Elements', ja: '元素色を統一', ko: '원소 단색 통일', 'zh-TW': '統一元素為單色' },",
  "  '物理伤害': { en: 'Physical', ja: '物理', ko: '물리', 'zh-TW': '物理傷害' },",
  "  '法术伤害': { en: 'Arts', ja: '術ダメージ', ko: '아츠', 'zh-TW': '法術傷害' },",
  "  '真实伤害': { en: 'True', ja: '確定ダメージ', ko: '고정 피해', 'zh-TW': '真實傷害' },",
  "  '治疗回复': { en: 'Heal', ja: '回復', ko: '치료', 'zh-TW': '治療回復' },",
  "  '灼燃损伤(打条)': { en: 'Burn (EP)', ja: '灼熱(損傷)', ko: '작열(손상)', 'zh-TW': '灼燃損傷(打條)' },",
  "  '神经损伤(打条)': { en: 'Neural (EP)', ja: '神経(損傷)', ko: '신경(손상)', 'zh-TW': '神經損傷(打條)' },",
  "  '凋亡损伤(打条)': { en: 'Apoptosis (EP)', ja: '壊死(損傷)', ko: '괴사(손상)', 'zh-TW': '凋亡損傷(打條)' },",
  "  '侵蚀损伤(打条)': { en: 'Erosion (EP)', ja: '侵食(損傷)', ko: '침식(손상)', 'zh-TW': '侵蝕損傷(打條)' },",
  "  '灼燃伤害(爆条)': { en: 'Burn (HP)', ja: '灼熱(爆発)', ko: '작열(폭발)', 'zh-TW': '灼燃傷害(爆條)' },",
  "  '神经伤害(爆条)': { en: 'Neural (HP)', ja: '神経(爆発)', ko: '신경(폭발)', 'zh-TW': '神經傷害(爆條)' },",
  "  '凋亡伤害(爆条)': { en: 'Apoptosis (HP)', ja: '壊死(爆発)', ko: '괴사(폭발)', 'zh-TW': '凋亡傷害(爆條)' },",
  "  '侵蚀伤害(爆条)': { en: 'Erosion (HP)', ja: '侵食(爆発)', ko: '침식(폭발)', 'zh-TW': '侵蝕傷害(爆條)' },",
  "  '渐变': { en: 'Grad', ja: 'グラデ', ko: '그라데이션', 'zh-TW': '漸層' },",
  "  '描边': { en: 'Stroke', ja: '縁取り', ko: '외곽선', 'zh-TW': '描邊' },",
  "  '主色': { en: 'Main', ja: '主色', ko: '메인', 'zh-TW': '主色' },",
  "  '跳字上浮速度': { en: 'Rise Speed', ja: '上昇速度', ko: '상승 속도', 'zh-TW': '跳字上浮速度' },",
  "  '同目标跳字上限': { en: 'Max per Target', ja: '同目標上限', ko: '대상별 상한', 'zh-TW': '同目標跳字上限' },",
  "  '跳字合并': { en: 'Merge Numbers', ja: '数値統合', ko: '숫자 병합', 'zh-TW': '跳字合併' },",
  "  '暴击入场动画': { en: 'Crit Pop-in', ja: 'クリティカル・ポップイン', ko: '크리티컬 팝인', 'zh-TW': '暴擊入場動畫' },",
  "  '官方数字行为': { en: 'Official Number Behavior', ja: '公式数字挙動', ko: '공식 숫자 동작', 'zh-TW': '官方數字行為' },",
  "  '跳字避让': { en: 'Dodge Overlap', ja: '重なり回避', ko: '겹침 회피', 'zh-TW': '跳字避讓' },",
  "  '暴击大字': { en: 'Crit Pop', ja: 'クリティカル強調', ko: '치명타 강조', 'zh-TW': '暴擊大字' },",
  "  '暴击触发模式': { en: 'Crit Trigger', ja: 'クリティカル条件', ko: '치명타 조건', 'zh-TW': '暴擊觸發模式' },",
  "  '官方比例(15%)': { en: 'Ratio 15%', ja: '比率15%', ko: '비율 15%', 'zh-TW': '官方比例(15%)' },",
  "  '高伤阈值(18%)': { en: 'HP 18%', ja: 'HP18%以上', ko: 'HP 18%', 'zh-TW': '高傷閾值(18%)' },",
  "  '两者其一': { en: 'Either', ja: 'どちらか', ko: '둘 중 하나', 'zh-TW': '兩者其一' },",
  "  '仅放大': { en: 'Scale Only', ja: '拡大のみ', ko: '확대만', 'zh-TW': '僅放大' },",
  "  '暴击加粗': { en: 'Crit Bold', ja: 'クリティカル太字', ko: '치명타 굵게', 'zh-TW': '暴擊加粗' },",
  "  '仅显示官方数字': { en: 'Official Numbers Only', ja: '公式数字のみ', ko: '공식 숫자만', 'zh-TW': '僅顯示官方數字' },",
  "  '官方数字行为：头顶居中・快速上浮消失・出厂不合并无上限；调整行为滑块只会熄灭本开关、数字仍走官方管线，再点开关即恢复官方出厂值（点亮时点关闭＝回到原版管线）；暴击加大加粗，开「仅显示官方数字」后为不加粗红字': { en: 'Official number behavior: head-top centered, quick rise & fade, no merging / no cap at factory; adjusting the behavior sliders only dims this switch (numbers stay on the official pipeline) — click the switch to snap back to the official factory values (clicking it while lit turns it off = the classic pipeline); crits big & bold (non-bold red under \"Official Numbers Only\")', ja: '公式数字挙動：頭上中央・高速上昇/消滅・初期設定は統合なし上限なし；スライダー調整ではスイッチが消灯するだけで数字は公式パイプラインのまま、スイッチを押せば公式の初期値に戻ります（点灯中にオフにすれば旧パイプライン）；クリティカルは太字拡大（「公式数字のみ」で太字なし赤字）', ko: '공식 숫자 동작: 머리 위 중앙, 빠른 상승/소멸, 기본값은 병합 없음/상한 없음; 슬라이더를 조정해도 스위치가 꺼질 뿐 숫자는 공식 파이프라인을 유지하며, 스위치를 다시 누르면 공식 기본값으로 돌아갑니다(켜진 상태에서 끄면 원본 파이프라인); 치명타는 굵게 확대(「공식 숫자만」에서 굵지 않은 빨간 숫자)', 'zh-TW': '官方數字行為：頭上居中・快速上浮消失・出廠不合併無上限；調整行為滑桿只會熄滅本開關、數字仍走官方管線，再點開關即恢復官方出廠值（點亮時點關閉＝回到原版管線）；暴擊加大加粗，開「僅顯示官方數字」後為不加粗紅字' },",
  '};',
  'function tr(text) {',
  "  const lang = document.documentElement.lang || 'zh';",
  "  if (lang.startsWith('zh-TW') || lang.startsWith('zh-Hant')) return I18N_CUSTOM[text]?.['zh-TW'] || text;",
  "  if (lang.startsWith('en')) return I18N_CUSTOM[text]?.en || text;",
  "  if (lang.startsWith('ja')) return I18N_CUSTOM[text]?.ja || text;",
  "  if (lang.startsWith('ko')) return I18N_CUSTOM[text]?.ko || text;",
  '  return text;',
  '}',
  'function DamageCustomSection({ s, updateSettings }) {',
  '  const tr = (text) => {',
  "    const lang = document.documentElement.lang || 'zh';",
  "    if (lang.startsWith('zh-TW') || lang.startsWith('zh-Hant')) return I18N_CUSTOM[text]?.['zh-TW'] || text;",
  "    if (lang.startsWith('en')) return I18N_CUSTOM[text]?.en || text;",
  "    if (lang.startsWith('ja')) return I18N_CUSTOM[text]?.ja || text;",
  "    if (lang.startsWith('ko')) return I18N_CUSTOM[text]?.ko || text;",
  '    return text;',
  '  };',
  '  const [open, setOpen] = useState(false);',
  '  const [cfg, setCfg] = useState(() => {',
  "    try { return JSON.parse(localStorage.getItem('sp.pref.damageStyleCustom')) || {}; } catch(e) { return {}; }",
  '  });',
  '  const [localFontInput, setLocalFontInput] = useState(s.dmgFont || "novecento");',
  '  useLayoutEffect(() => {',
  "    if (s.presetMode && s.presetMode !== 'custom') {",
  '      import("../render/fx/fonts.js").then((m) => {',
  '        if (m.PRESET_DAMAGE_STYLES[s.presetMode]) {',
  '          setCfg(m.PRESET_DAMAGE_STYLES[s.presetMode]);',
  "          localStorage.setItem('sp.pref.damageStyleCustom', JSON.stringify(m.PRESET_DAMAGE_STYLES[s.presetMode]));",
  '        }',
  '      });',
  '    }',
  '  }, [s.presetMode]);',
  '  const updateItem = (key, patch) => {',
  '    const next = { ...cfg, [key]: { ...(cfg[key] || {}), ...patch } };',
  '    setCfg(next);',
  "    localStorage.setItem('sp.pref.damageStyleCustom', JSON.stringify(next));",
  "    updateSettings({ presetMode: 'custom' });",
  "    import('../render/fx/fonts.js').then((m) => m.rebuildDamageFonts(s.dmgFont || 'novecento'));",
  '  };',
  '  const unifyElements = () => {',
  "    const unifiedColor = '#ff7b3a';",
  '    const patch = {};',
  "    ['burn-dmg', 'neural-dmg', 'apoptosis-dmg', 'erosion-dmg'].forEach(k => {",
  "      patch[k] = { fill: '#ffffff', strokeOn: true, stroke: unifiedColor, grad: false };",
  '    });',
  "    ['burn', 'neural', 'apoptosis', 'erosion'].forEach(k => {",
  "      patch[k] = { fill: unifiedColor, strokeOn: false, grad: false };",
  '    });',
  '    const next = { ...cfg, ...patch };',
  '    setCfg(next);',
  "    localStorage.setItem('sp.pref.damageStyleCustom', JSON.stringify(next));",
  "    updateSettings({ presetMode: 'custom' });",
  "    import('../render/fx/fonts.js').then((m) => m.rebuildDamageFonts(s.dmgFont || 'novecento'));",
  '  };',
  '  const items = [',
  "    ['phys', '物理伤害'], ['arts', '法术伤害'], ['true', '真实伤害'], ['heal', '治疗回复'],",
  "    ['burn-dmg', '灼燃损伤(打条)'], ['neural-dmg', '神经损伤(打条)'],",
  "    ['apoptosis-dmg', '凋亡损伤(打条)'], ['erosion-dmg', '侵蚀损伤(打条)'],",
  "    ['burn', '灼燃伤害(爆条)'], ['neural', '神经伤害(爆条)'],",
  "    ['apoptosis', '凋亡伤害(爆条)'], ['erosion', '侵蚀伤害(爆条)']",
  '  ];',
  '  const currentScale = Number(s.dmgScale || 1.0);',
  '  const currentHealRatio = Number(s.customHealRatio ?? 0.75);',
  '  const currentHeight = Number(s.customHeight ?? 1.0);',
  '  const currentJitter = Number(s.customJitter ?? 0);',
  '  const currentRise = Number(s.numRiseSpeed ?? 1.0);',
  '  const currentMaxPer = Math.round(Number(s.numMaxPerTarget ?? 4));',
  '  const CRIT_MODES = [',
  "    ['ratio15', '官方比例(15%)'], ['hp18', '高伤阈值(18%)'], ['both', '两者其一'], ['scaleOnly', '仅放大'],",
  '  ];',
  '  return html`<div style="margin-top:.08rem;">',
  '    <div class="set-row">',
  '      <span class="set-row__label">${tr(\'高级微调\')}<${MicroLabel}>CUSTOMIZE<//></span>',
  '      <button type="button" class="btn btn--secondary btn--sm" onClick=${() => setOpen(!open)}>',
  '        ${open ? tr(\'收起\') : tr(\'展开\')}',
  '      </button>',
  '    </div>',
  '    ${open ? html`<div style="display:flex;flex-direction:column;gap:.1rem;padding:.12rem;background:rgba(0,0,0,.45);border:1px solid var(--line-2);margin-top:.06rem;">',
  '      ${s.authenticNums ? html`<div style="font-size:.12rem;color:var(--text-dim);line-height:1.5;padding:.02rem .04rem;border-bottom:1px dashed var(--line);">${tr(\'官方数字行为：头顶居中・快速上浮消失・出厂不合并无上限；调整行为滑块只会熄灭本开关、数字仍走官方管线，再点开关即恢复官方出厂值（点亮时点关闭＝回到原版管线）；暴击加大加粗，开「仅显示官方数字」后为不加粗红字\')}</div>` : null}',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'本地字体名称\')}<${MicroLabel}>LOCAL FONT<//></span>',
  '        <div style="display:flex;gap:.06rem;align-items:center;flex:1;justify-content:flex-end;">',
  '          <select style="background:#050706;border:1px solid var(--line-2);color:#fff;font-size:.13rem;padding:2px 4px;" onChange=${(e) => {',
  '             const val = e.currentTarget.value;',
  '             if (!val) return;',
  '             setLocalFontInput(val);',
  '             updateSettings({ dmgFont: val, uiFont: val, presetMode: \'custom\' });',
  '             import(\'../render/fx/fonts.js\').then((m) => m.rebuildDamageFonts(val));',
  '          }}>',
  '            <option value="">-- 选择常见本地字体 --</option>',
  '            <option value="Impact">Impact (美式粗窄)</option>',
  '            <option value="Arial Black">Arial Black (极粗黑体)</option>',
  '            <option value="Segoe UI">Segoe UI (现代系统)</option>',
  '            <option value="Verdana">Verdana (宽松无衬线)</option>',
  '            <option value="Tahoma">Tahoma (精干无衬线)</option>',
  '            <option value="Consolas">Consolas (等宽终端)</option>',
  '          </select>',
  '          <input type="text" value=${localFontInput} onInput=${(e) => setLocalFontInput(e.currentTarget.value)} placeholder="或手输字体名" style="padding:2px 6px;background:#050706;border:1px solid var(--line-2);color:#fff;font-size:.13rem;width:1.3rem;" />',
  '          <button type="button" class="btn btn--primary btn--sm" onClick=${() => {',
  '             updateSettings({ dmgFont: localFontInput, uiFont: localFontInput, presetMode: \'custom\' });',
  '             import(\'../render/fx/fonts.js\').then((m) => m.rebuildDamageFonts(localFontInput));',
  '          }}>${tr(\'应用\')}</button>',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'伤害跳字字号\')}<${MicroLabel}>SCALE (${Math.round(currentScale * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.5" max="2.0" step="0.05" value=${currentScale}',
  '          onInput=${(e) => updateSettings({ dmgScale: String(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'治疗字号比例\')}<${MicroLabel}>HEAL RATIO (${Math.round(currentHealRatio * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.3" max="1.5" step="0.05" value=${currentHealRatio}',
  '          onInput=${(e) => updateSettings({ customHealRatio: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  // 开关点亮 = 官方管线且六项行为滑块全在官方出厂值（动滑块只熄灭开关、数字仍走官方管线；点开关即恢复出厂；点亮时点关闭＝原版管线）。
  // 滑块行本身不再写 authenticNums——那会把整条管线连锚点一起拽回原版，数字高度会突降（2026-10-15 用户报告）。
  '      <${Toggle} label=${tr(\'官方数字行为\')} micro="AUTHENTIC" value=${s.authenticNums !== false && s.numMerge === false && s.numAvoid === false && Number(s.numMaxPerTarget) === 9 && Number(s.customHeight) === 1 && Number(s.customJitter) === 0 && Number(s.numRiseSpeed) === 1} onChange=${(v) => updateSettings(v ? {',
  '        // 开 = 官方管线，六项行为滑块重置为官方出厂值（合并/避让关、上限 ∞、高度/抖动/速度 1/0/1）',
  '        authenticNums: true, numMerge: false, numAvoid: false, numMaxPerTarget: 9,',
  '        customHeight: 1.0, customJitter: 0, numRiseSpeed: 1.0, presetMode: \'custom\',',
  '      } : {',
  '        // 关 = 原版管线，滑块恢复原版默认（合并/避让开、上限 4）',
  '        authenticNums: false, numMerge: true, numAvoid: true, numMaxPerTarget: 4,',
  '        customHeight: 1.0, customJitter: 0, numRiseSpeed: 1.0, presetMode: \'custom\',',
  '      })} />',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字垂直高度\')}<${MicroLabel}>HEIGHT (${Math.round(currentHeight * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.0" max="1.5" step="0.05" value=${currentHeight}',
  '          onInput=${(e) => updateSettings({ customHeight: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字左右抖动\')}<${MicroLabel}>JITTER (±${currentJitter}格)<//></span>',
  '        <input class="set-range" type="range" min="0" max="1.5" step="0.05" value=${currentJitter}',
  '          onInput=${(e) => updateSettings({ customJitter: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字上浮速度\')}<${MicroLabel}>RISE (${Math.round(currentRise * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.2" max="2.5" step="0.1" value=${currentRise}',
  '          onInput=${(e) => updateSettings({ numRiseSpeed: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'同目标跳字上限\')}<${MicroLabel}>MAX/TARGET (${currentMaxPer >= 9 ? \'∞\' : currentMaxPer})<//></span>',
  '        <input class="set-range" type="range" min="1" max="9" step="1" value=${currentMaxPer}',
  '          onInput=${(e) => updateSettings({ numMaxPerTarget: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <${Toggle} label=${tr(\'跳字合并\')} micro="MERGE" value=${s.numMerge !== false} onChange=${(v) => updateSettings({ numMerge: v, presetMode: \'custom\' })} />',
  '      <${Toggle} label=${tr(\'跳字避让\')} micro="DODGE" value=${s.numAvoid !== false} onChange=${(v) => updateSettings({ numAvoid: v, presetMode: \'custom\' })} />',
  '      <${Toggle} label=${tr(\'暴击入场动画\')} micro="CRIT POP-IN" value=${s.critPopAnim !== false} onChange=${(v) => updateSettings({ critPopAnim: v, presetMode: \'custom\' })} />',
  '      <${Toggle} label=${tr(\'暴击大字\')} micro="CRIT POP" value=${s.critOn !== false} onChange=${(v) => updateSettings({ critOn: v, presetMode: \'custom\' })} />',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'暴击触发模式\')}<${MicroLabel}>CRIT TRIGGER<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${CRIT_MODES.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.critMode || \'ratio15\') === id ? \'true\' : \'false\'}',
  '            class=${(s.critMode || \'ratio15\') === id ? \'is-on\' : \'\'} onClick=${() => updateSettings({ critMode: id, presetMode: \'custom\' })}>${tr(label)}</button>`)}',
  '        </div>',
  '      </div>',
  '      <${Toggle} label=${tr(\'暴击加粗\')} micro="CRIT BOLD" value=${s.critDoBold !== false} onChange=${(v) => updateSettings({ critDoBold: v, presetMode: \'custom\' })} />',
  '      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.04rem;border-bottom:1px solid var(--line-2);padding-bottom:.06rem;">',
  '        <span style="font-size:.13rem;color:var(--text-dim);">${tr(\'各伤害独立外观\')}：</span>',
  '        <button type="button" class="btn btn--secondary btn--sm" onClick=${unifyElements}>${tr(\'统一元素为单色\')}</button>',
  '      </div>',
  '      ${items.map(([k, name]) => {',
  '        const cur = cfg[k] || {};',
  "        const fill = Array.isArray(cur.fill) ? cur.fill[0] : (cur.fill || '#ffffff');",
  "        const fill2 = Array.isArray(cur.fill) ? cur.fill[1] : (cur.fill2 || fill);",
  '        const grad = !!cur.grad;',
  '        const strokeOn = !!cur.strokeOn;',
  "        const stroke = cur.stroke || '#000000';",
  '        return html`<div key=${k} style="display:flex;align-items:center;justify-content:space-between;font-size:.13rem;border-bottom:1px dashed var(--line);padding-bottom:.04rem;">',
  '          <span style="width:1.25rem;font-weight:700;">${tr(name)}</span>',
  '          <div style="display:flex;align-items:center;gap:.08rem;">',
  '            <label title="${tr(\'主色\')}" style="display:flex;align-items:center;gap:.02rem;">',
  '              <span>${tr(\'主色\')}:</span>',
  '              <input type="color" value=${fill} onInput=${(e) => updateItem(k, { fill: e.currentTarget.value })} style="width:.24rem;height:.2rem;border:0;padding:0;background:none;cursor:pointer;" />',
  '            </label>',
  '            <label style="display:flex;align-items:center;gap:.02rem;cursor:pointer;">',
  '              <input type="checkbox" checked=${grad} onChange=${(e) => updateItem(k, { grad: e.currentTarget.checked })} />',
  '              <span>${tr(\'渐变\')}</span>',
  '            </label>',
  '            ${grad ? html`<input type="color" title="${tr(\'渐变\')}" value=${fill2} onInput=${(e) => updateItem(k, { fill2: e.currentTarget.value })} style="width:.24rem;height:.2rem;border:0;padding:0;background:none;cursor:pointer;" />` : null}',
  '            <label style="display:flex;align-items:center;gap:.02rem;cursor:pointer;">',
  '              <input type="checkbox" checked=${strokeOn} onChange=${(e) => updateItem(k, { strokeOn: e.currentTarget.checked })} />',
  '              <span>${tr(\'描边\')}</span>',
  '            </label>',
  '            ${strokeOn ? html`<input type="color" title="${tr(\'描边\')}" value=${stroke} onInput=${(e) => updateItem(k, { stroke: e.currentTarget.value })} style="width:.24rem;height:.2rem;border:0;padding:0;background:none;cursor:pointer;" />` : null}',
  '          </div>',
  '        </div>`;',
  '      })}',
  '    </div>` : null}',
  '  </div>`;',
  '}',
  '',
  'export function SettingsModal({ open, onClose }) {'
].join('\n');

const settingsControlsCode = [
  '      <${Toggle} label=${t(\'显示伤害数字\')} micro="DAMAGE NUMBERS" value=${s.damageNumbers} onChange=${(v) => updateSettings({ damageNumbers: v })} />',
  '      ${s.damageNumbers ? html`',
  '        <div class="set-row">',
  '          <span class="set-row__label">${tr(\'数字风格\')}<${MicroLabel}>PRESET MODE<//></span>',
  '          <div class="set-seg" role="radiogroup">',
  '            ${PRESET_MODES.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.presetMode || \'authentic\') === id ? \'true\' : \'false\'}',
  '              class=${(s.presetMode || \'authentic\') === id ? \'is-on\' : \'\'} onClick=${() => applyPresetMode(id, updateSettings)}>${tr(label)}</button>`)}',
  '          </div>',
  '        </div>',
  '        <${DamageCustomSection} s=${s} updateSettings=${updateSettings} />',
  '      ` : null}'
].join('\n');

applyPatchToFile('public/js/ui/settings.js', [
  [
    "export const settingsStore = createStore(sanitizeSettings(loadPref('settings', null)));",
    `const _rawPref = loadPref('settings', null) || {};
// 旧版本存档里的预设 id 迁移: official→authentic（官方还原）/ tactical→elemental（属性风暴）/ minimal→arcade（街机硬派）
const _PRESET_ALIASES = { official: 'authentic', tactical: 'elemental', minimal: 'arcade' };
if (_PRESET_ALIASES[_rawPref.presetMode]) _rawPref.presetMode = _PRESET_ALIASES[_rawPref.presetMode];
// 补丁新增的设置键不在作者 sanitizeSettings 白名单里，读档时会被剥掉——这里原样放行。
const _PATCH_KEYS = ['numMerge', 'numAvoid', 'numMaxPerTarget', 'customHeight', 'customJitter', 'numRiseSpeed', 'critPopAnim',
  'critOn', 'critMode', 'critByRatio', 'critByHp', 'critDoBold', 'customWeight', 'customStroke', 'customStop', 'customHealRatio'];
const _patchExtra = {};
for (const k of _PATCH_KEYS) if (_rawPref[k] !== undefined) _patchExtra[k] = _rawPref[k];
// 滑块键没有存档值时按当前预设补出厂值（官方数字行为出厂即官方本尊：不合并/不避让/上限 ∞/0 抖动），
// 保证面板显示的数值就是管线实际生效的数值——不会出现「没存过档的滑块显示 A 实际跑 B」。
{
  const _off = (_rawPref.presetMode || 'authentic') === 'authentic';
  const _seed = (k, v) => { if (_patchExtra[k] === undefined) _patchExtra[k] = v; };
  _seed('numMerge', !_off);
  _seed('numAvoid', !_off);
  _seed('numMaxPerTarget', _off ? 9 : 4);
  _seed('customHeight', 1.0);
  _seed('customJitter', 0);
  _seed('numRiseSpeed', 1.0);
}
export const settingsStore = createStore({
  ...sanitizeSettings(_rawPref),
  presetMode: _rawPref.presetMode || 'authentic',
  uiFont: _rawPref.uiFont || _rawPref.fontFamily || 'novecento',
  dmgFont: _rawPref.dmgFont || _rawPref.fontFamily || 'novecento',
  dmgScale: _rawPref.dmgScale || '1.0',
  ..._patchExtra,
  // 「官方还原」预设的数字行为（注意与作者的 officialDamageNumbers＝「仅显示官方数字」是两回事）:
  // 未保存过时跟随 presetMode（默认预设即官方还原 → true）
  authenticNums: typeof _rawPref.authenticNums === 'boolean' ? _rawPref.authenticNums
    : (_rawPref.presetMode ? _rawPref.presetMode === 'authentic' : true),
});`
  ],
  [
    `export function updateSettings(patch) {
  settingsStore.set(sanitizeSettings({ ...settingsStore.get(), ...patch }));
}`,
    `export function updateSettings(patch) {
  const cur = settingsStore.get();
  const next = { ...sanitizeSettings({ ...cur, ...patch }), ...cur, ...patch };
  settingsStore.set(next);
}`
  ],
  [
    `settingsStore.subscribe((s) => {
  savePref('settings', sanitizeSettings(s));
  audio.setVolumes(s);
  audio.setVoiceLang(s.voiceLang, s.voiceOverrides);
  applyTextSize(s.textSize);
});`,
    `settingsStore.subscribe((s) => {
  savePref('settings', s);
  audio.setVolumes(s);
  audio.setVoiceLang(s.voiceLang, s.voiceOverrides);
  applyTextSize(s.textSize);
  applyFontFamily(s.uiFont || s.fontFamily);
});`
  ],
  [
    "applyTextSize(settingsStore.get().textSize);",
    `applyTextSize(settingsStore.get().textSize);
export function applyFontFamily(f) {
  const el = globalThis.document?.documentElement;
  if (!el) return;
  el.dataset.font = f || 'novecento';
  const stacks = {
    novecento: "'Novecento Wide', 'Novecento', 'Bender', var(--cjk-faces), sans-serif",
    bender: "'Bender', 'Rajdhani', 'Oxanium', var(--cjk-faces), sans-serif",
    rodin: "'FOT-Rodin', var(--cjk-faces), sans-serif",
    skurri: "'Skurri', var(--cjk-faces), sans-serif",
    oxanium: "'Oxanium', 'Rajdhani', 'Bender', var(--cjk-faces), sans-serif",
    rajdhani: "'Rajdhani', 'Oxanium', 'Bender', var(--cjk-faces), sans-serif",
    system: "var(--cjk-faces), sans-serif"
  };
  const val = stacks[f] || stacks.novecento;
  el.style.setProperty('--font-num', val);
  el.style.setProperty('--font-display', val);
  el.style.setProperty('--font-mono', val);
}
applyFontFamily(settingsStore.get().uiFont || settingsStore.get().fontFamily);`
  ],
  [
    "const QUALITY = [['high', N_('高')], ['medium', N_('中')], ['low', N_('低')]];",
    `const QUALITY = [['high', N_('高')], ['medium', N_('中')], ['low', N_('低')]];
const PRESET_MODES = [
  ['original', '原版经典'],
  ['authentic', '官方还原'],
  ['elemental', '属性风暴'],
  ['arcade', '街机硬派'],
  ['custom', '自定义'],
];
const FONT_OPTIONS = [
  ['novecento', 'Novecento Wide'],
  ['bender', 'Bender'],
  ['rodin', 'FOT-Rodin Pro'],
  ['skurri', 'Skurri'],
  ['oxanium', 'Oxanium'],
  ['rajdhani', 'Rajdhani'],
  ['system', '系统默认'],
];
const DMG_SCALES = [
  ['0.75', '75%'],
  ['0.85', '85%'],
  ['1.0', '100%'],
  ['1.2', '120%'],
  ['1.4', '140%'],
];
const WEIGHT_OPTIONS = [
  ['400', '400 (常规)'],
  ['600', '600 (中等)'],
  ['700', '700 (粗体)'],
];
const STROKE_OPTIONS = [
  ['0', '0px'],
  ['2', '2px'],
  ['4', '4px'],
  ['7', '7px'],
];
const STOP_OPTIONS = [
  ['0', '0% (顶部)'],
  ['0.25', '25% (高光)'],
  ['0.5', '50% (居中)'],
];
const HEAL_RATIOS = [
  ['0.65', '65% (小巧)'],
  ['0.8', '80% (标准)'],
  ['1.0', '100% (等大)'],
];

function applyPresetMode(id, updateFn) {
  const presets = {
    original: { uiFont: 'bender', dmgFont: 'bender', dmgScale: '1.0', customWeight: '700', customStroke: 7, customStop: 0.25, customHealRatio: 0.9,
      authenticNums: false, numMerge: true, numAvoid: true, numMaxPerTarget: 4, customHeight: 0.8, customJitter: 0, numRiseSpeed: 1.0 },
    authentic: { uiFont: 'novecento', dmgFont: 'novecento', dmgScale: '1.0', customWeight: '400', customStroke: 0, customStop: 0, customHealRatio: 0.65,
      authenticNums: true, numMerge: false, numAvoid: false, numMaxPerTarget: 9, customHeight: 1.0, customJitter: 0, numRiseSpeed: 1.0 },
    elemental: { uiFont: 'rodin', dmgFont: 'rodin', dmgScale: '1.1', customWeight: '700', customStroke: 4, customStop: 0.3, customHealRatio: 0.75,
      authenticNums: false, numMerge: true, numAvoid: true, numMaxPerTarget: 4, customHeight: 1.0, customJitter: 0, numRiseSpeed: 1.0 },
    arcade: { uiFont: 'skurri', dmgFont: 'skurri', dmgScale: '1.2', customWeight: '400', customStroke: 5, customStop: 0.15, customHealRatio: 0.85,
      authenticNums: false, numMerge: true, numAvoid: true, numMaxPerTarget: 4, customHeight: 1.0, customJitter: 0, numRiseSpeed: 1.0 },
    custom: {}
  };
  const p = presets[id] || {};
  if (id !== 'custom') {
    import('../render/fx/fonts.js').then((m) => {
      if (m.PRESET_DAMAGE_STYLES?.[id]) {
        localStorage.setItem('sp.pref.damageStyleCustom', JSON.stringify(m.PRESET_DAMAGE_STYLES[id]));
      }
    }).catch(() => {});
  }
  updateFn({ presetMode: id, ...p });
  if (p.uiFont) applyFontFamily(p.uiFont);
  const f = p.dmgFont || settingsStore.get().dmgFont || 'novecento';
  import('../render/fx/fonts.js').then((m) => m?.rebuildDamageFonts?.(f)).catch(() => {});
}`
  ],
  [
    "export function SettingsModal({ open, onClose }) {",
    damageCustomSectionCode
  ],
  [
    "<${Toggle} label=${t('显示伤害数字')} micro=\"DAMAGE NUMBERS\" value=${s.damageNumbers} onChange=${(v) => updateSettings({ damageNumbers: v })} />",
    settingsControlsCode
  ],
  [
    // 「官方伤害数字」→「仅显示官方数字」：语义更准 —— 开启后只保留官方本尊会显示的数字
    // （伤害只剩红字整数，费用只剩冲锋手/情报官跟随攻击的回费与行商扣费，技力不变）
    "<${Toggle} label=${t('官方伤害数字')} micro=\"OFFICIAL NUMBERS\" value=${s.officialDamageNumbers} onChange=${(v) => updateSettings({ officialDamageNumbers: v })} />",
    "<${Toggle} label=${tr('仅显示官方数字')} micro=\"OFFICIAL NUMBERS\" value=${s.officialDamageNumbers} onChange=${(v) => updateSettings({ officialDamageNumbers: v })} />"
  ]
]);
// =========================================================================
// 9. public/css/components.css & game-shop.css: 独立作用域微调
// =========================================================================
applyPatchToFile('public/css/components.css', [
  [
    `/* ---- hex badge ------------------------------------------------------------------------------------ */
.hex {
  --hex-c: var(--gold);
  --hex-bg: #15130b;
  --hex-fg: var(--gold);
  --hex-h: .34rem;
  --hex-slope: .1rem;
  display: inline-grid;
  height: var(--hex-h);
  padding: 1.5px;
  background: var(--hex-c);
  clip-path: polygon(var(--hex-slope) 0, calc(100% - var(--hex-slope)) 0, 100% 50%, calc(100% - var(--hex-slope)) 100%, var(--hex-slope) 100%, 0 50%);
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, .6));
  vertical-align: middle;
}
.hex__fill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .05rem;
  min-width: calc(var(--hex-h) * .95);
  padding: 0 calc(var(--hex-slope) + .04rem);
  background: radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, .08), transparent 60%), var(--hex-bg);
  color: var(--hex-fg);
  clip-path: polygon(var(--hex-slope) 0, calc(100% - var(--hex-slope)) 0, 100% 50%, calc(100% - var(--hex-slope)) 100%, var(--hex-slope) 100%, 0 50%);
}
.hex__value { font-family: var(--font-num); font-weight: 700; font-size: calc(var(--hex-h) * .62); line-height: 1; font-variant-numeric: tabular-nums; }`,
    `/* ---- hex badge ------------------------------------------------------------------------------------ */
.hex {
  --hex-c: var(--gold);
  --hex-bg: #15130b;
  --hex-fg: var(--gold);
  --hex-h: .30rem; 
  display: inline-grid;
  height: var(--hex-h);
  min-width: .42rem; 
  padding: 1.5px;
  background: var(--hex-c);
  clip-path: polygon(14% 0%, 86% 0%, 100% 32%, 100% 68%, 86% 100%, 14% 100%, 0% 68%, 0% 32%);
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, .6));
  vertical-align: middle;
}
.hex__fill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 .04rem;
  background: radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, .12), transparent 60%), var(--hex-bg);
  color: var(--hex-fg);
  clip-path: polygon(14% 0%, 86% 0%, 100% 32%, 100% 68%, 86% 100%, 14% 100%, 0% 68%, 0% 32%);
}
.hex__value {
  font-family: var(--font-num);
  font-weight: 700; 
  font-size: calc(var(--hex-h) * 0.72); 
  line-height: 1;
  font-variant-numeric: tabular-nums;
  transform: none;
}
:root[data-font="novecento"] .hex__value {
  transform: translateY(-0.5px);
}`
  ]
]);

applyPatchToFile('public/css/screens/game-shop.css', [
  [
    ".lvcard__frame { position: relative; display: flex; flex-direction: column; align-items: center; padding: .04rem .16rem .02rem; border: 2px solid rgba(6, 17, 13, .75); }",
    `/* 默认保持原版 padding，Bender/Oxanium/Rodin/Skurri 稳居中央 */
.lvcard__frame { position: relative; display: flex; flex-direction: column; align-items: center; padding: .04rem .16rem .03rem; border: 2px solid rgba(6, 17, 13, .75); }
:root[data-font="novecento"] .lvcard__frame { padding-bottom: .08rem; }`
  ],
  [
    ".lvcard__num { font-size: .66rem; line-height: .9; font-weight: 700; }",
    `.lvcard__num { font-size: .66rem; line-height: .9; font-weight: 700; transform: none; }
:root[data-font="novecento"] .lvcard__num { transform: translateY(-.02rem); font-size: .62rem; }`
  ]
]);

// =========================================================================
// 10. server/sim/professions.js: 官方风格事件 —— 冲锋手击杀回费 (金色 COST N)、行商周期扣费 (红色 COST −N)
// =========================================================================
applyPatchToFile('server/sim/professions.js', [
  [
    `    if (pl.dp >= c) battle.addDp(unit.ownerId, -c);
    else battle.retreat(unit, { reason: 'merchant' });`,
    `    if (pl.dp >= c) { battle.addDp(unit.ownerId, -c); battle.fx('dp', { x: unit.x, y: unit.y, n: -c, id: unit.id, quiet: 1 }); }
    else battle.retreat(unit, { reason: 'merchant' });`
  ],
  [
    `  battle.on('kill', (ctx) => {
    if (ctx.killer === unit && ctx.victim.side === 'enemy') battle.addDp(unit.ownerId, unit.profile.dpOnKill ?? 1);
  }, { owner: unit });`,
    `  battle.on('kill', (ctx) => {
    if (ctx.killer === unit && ctx.victim.side === 'enemy') {
      const dpGain = unit.profile.dpOnKill ?? 1;
      battle.addDp(unit.ownerId, dpGain);
      battle.fx('dp', { x: unit.x, y: unit.y, n: dpGain, id: unit.id, kill: 1, quiet: 1 });
    }
  }, { owner: unit });`
  ]
]);

// =========================================================================
// 11. server/sim/skills.js: 技力回复的官方风格 SP N 弹字
//     仅天赋/技能描述/盟约等明确写出的回复手段才提示；时间/攻击/受击等自然回复与部署初始不提示
// =========================================================================
applyPatchToFile('server/sim/skills.js', [
  [
    `    if (this.charges >= this.maxCharges) this.sp = cost;
    return amt;
  }`,
    `    if (this.charges >= this.maxCharges) this.sp = cost;
    // 官方风格 SP 弹字：仅天赋/技能描述/盟约等明确写出的回复手段才提示；
    // 时间/攻击/受击等自然回复与部署初始不提示（quiet: 只出文字，不带动画）
    if (amt > 0 && reason !== 'init' && reason !== 'time' && reason !== 'attack' && reason !== 'hurt'
      && this.unit && this.unit.x != null && this.unit.side !== 'enemy') {
      this._spPopAcc = (this._spPopAcc || 0) + amt;
      if (this._spPopAcc >= 1 - 1e-9) {
        const whole = Math.floor(this._spPopAcc + 1e-9);
        this._spPopAcc -= whole;
        if (this.battle && whole > 0) this.battle.fx('sp', { x: this.unit.x, y: this.unit.y, id: this.unit.id, n: whole, quiet: 1 });
      }
    }
    return amt;
  }`
  ]
]);

// =========================================================================
// 12. public/js/render/fx/simfx.js: COST / SP 弹字（仅文字，不改任何动画），只在「官方还原」风格生效
//     官方还原（默认）: 所有回费 → 金色 COST N (E0A32C)；所有扣费 → 红色 COST −N (D4121A，数学减号)
//     位置与官方跳字一致: 传 at.v 给 numberAt → 头顶 + 等比间距（不再贴胸口）；原版风格的 +n 仍在胸口
//     「仅显示官方数字」开启后: 回费只弹冲锋手/情报官等跟随攻击(kill)的，扣费照弹
//     SP → 青色 SP N (6FC6D2)，两种模式下行为一致；自然回复不弹字
//     其他风格（原版/属性风暴/街机/自定义）: 一律保持游戏原版显示
// =========================================================================
applyPatchToFile('public/js/render/fx/simfx.js', [
  [
    `      case 'dp': {
        const n = Math.round(num(ex.n, 0));
        this.particle('shard', p.x, p.y, { tint: col, vy: -s * 0.6, life: 0.9, s0: s / 32 * 0.28, s1: s / 32 * 0.22, a0: 1, a1: 0 });
        if (n > 0) this.numberAt(p.x + s * 0.2, p.y, \`+\${n}\`, col, 0.7);
        break;
      }`,
    `      case 'dp': {
        const n = Math.round(num(ex.n, 0));
        if (!ex.quiet) this.particle('shard', p.x, p.y, { tint: col, vy: -s * 0.6, life: 0.9, s0: s / 32 * 0.28, s1: s / 32 * 0.22, a0: 1, a1: 0 });
        // 官方还原风格：所有费用都弹 COST 字（金色获得、红色扣除）；「仅显示官方数字」开启后技能回费不弹，
        // 只剩冲锋手/情报官等跟随攻击的回费与行商扣费；其他风格一律保持原版显示（仅文字，不改动画）
        const authenticMode = (this.ctx.settings?.presetMode || 'authentic') === 'authentic';
        const officialOnly = !!this.ctx.settings?.officialDamageNumbers;
        if (authenticMode) {
          // 头顶正中央（去掉作者给小字的 +0.2 格右偏，只留原版风格分支使用）
          if (n < 0) this.numberAt(p.x, p.y, \`COST −\${-n}\`, 0xd4121a, 0.7, at.v);
          else if (n > 0 && (ex.kill || !officialOnly)) this.numberAt(p.x, p.y, \`COST \${n}\`, 0xe0a32c, 0.7, at.v);
        } else if (n > 0 && !ex.quiet) {
          this.numberAt(p.x + s * 0.2, p.y, \`+\${n}\`, col, 0.7);
        }
        break;
      }`
  ],
  [
    `      case 'sp': {
        for (let i = 0; i < (this.quality === 'low' ? 3 : 7); i++) {
          this.particle('dot', p.x + (Math.random() - 0.5) * s * 0.6, p.y + (Math.random() - 0.2) * s * 0.4, { tint: col, vy: -s * (0.6 + Math.random() * 0.6), life: 0.7, s0: s / 32 * 0.2, s1: 0, a0: 1, a1: 0, fadeIn: 0.05 });
        }
        this.particle('glow', p.x, p.y, { tint: col, life: 0.3, s0: s / 128 * 0.6, s1: s / 128 * 1.1, a0: 0.7, a1: 0 });
        break;
      }`,
    `      case 'sp': {
        if (!ex.quiet) {
          for (let i = 0; i < (this.quality === 'low' ? 3 : 7); i++) {
            this.particle('dot', p.x + (Math.random() - 0.5) * s * 0.6, p.y + (Math.random() - 0.2) * s * 0.4, { tint: col, vy: -s * (0.6 + Math.random() * 0.6), life: 0.7, s0: s / 32 * 0.2, s1: 0, a0: 1, a1: 0, fadeIn: 0.05 });
          }
          this.particle('glow', p.x, p.y, { tint: col, life: 0.3, s0: s / 128 * 0.6, s1: s / 128 * 1.1, a0: 0.7, a1: 0 });
        }
        if (ex.n > 0 && (this.ctx.settings?.presetMode || 'authentic') === 'authentic') this.numberAt(p.x, p.y, \`SP \${Math.round(ex.n)}\`, 0x6fc6d2, 0.7, at.v);
        break;
      }`
  ],
  [
    `        if (ex.num === 'm' && at.v && this.ctx.settings?.damageNumbers !== false && this.ctx.settings?.officialDamageNumbers) {`,
    `        if (ex.num === 'm' && at.v && this.ctx.settings?.damageNumbers !== false && (this.ctx.settings?.officialDamageNumbers || this.ctx.settings?.authenticNums)) {`
  ]
]);

// =========================================================================
// 13. 琳琅诗怀雅 (chess_char_3_04-swire2.js): 她不走 professions.js 的通用行商逻辑，
//     而是在自己的 kit 里实现了一份扣费，之前没有发弹字事件。
//     特性「大买家」周期扣费 + 天赋「破财消灾」复活扣费，全部 quiet: 1（只出文字，不带动画），
//     客户端按官方风格规则显示红色 COST −N（数学减号 U+2212）。
//     （浊心斯卡蒂的海嗣重生属于普通部署，不弹字。）
// =========================================================================
applyPatchToFile('server/sim/content/kits/ops/chess_char_3_04-swire2.js', [
  [
    // 大买家：周期扣费（与 professions.js 通用行商同规则，但此文件自带一份实现）
    `      if (pl.dp >= cost) {
        battle.addDp(unit.ownerId, -cost);
        onPay(battle, unit, cost);
        battle.emit('merchantPay', { unit, cost });
      } else battle.retreat(unit, { reason: 'merchant' });`,
    `      if (pl.dp >= cost) {
        battle.addDp(unit.ownerId, -cost);
        battle.fx('dp', { x: unit.x, y: unit.y, n: -cost, id: unit.id, quiet: 1 });
        onPay(battle, unit, cost);
        battle.emit('merchantPay', { unit, cost });
      } else battle.retreat(unit, { reason: 'merchant' });`
  ],
  [
    // 破财消灾：复活时的 DP 扣费也要弹字
    `            battle.addDp(unit.ownerId, -cost);
            unit.mem.saveCount = n + 1;`,
    `            battle.addDp(unit.ownerId, -cost);
            battle.fx('dp', { x: unit.x, y: unit.y, n: -cost, id: unit.id, quiet: 1 });
            unit.mem.saveCount = n + 1;`
  ]
]);

// =========================================================================
// 14. server/sim/ai.js: 技能攻击覆盖 attack.atkScale（官方数据字段 attack@atk_scale，
//     即「攻击力提升至X%」这一族）属于攻击倍率，红字判定期望 = 来源裸攻击力（damage.js
//     主路径），倍率自身去比 1.5 阈值。技能形态不影响判定——弹药只是技能持续的一种
//     形式：instant / charges 的 pending 单发（跃跃 强力击·β型 200%）与 duration /
//     ammo / toggle 的技能期间持续生效（蕾缪安 S1「重逢问候」弹药攻击 180%）一视同仁。
// =========================================================================
applyPatchToFile('server/sim/ai.js', [
  [
    `    if (ov.dmgType === 'heal' && !p.heal) p.heal = { mode: 'single' };
    if (ov.dmgType && ov.dmgType !== 'heal' && !ov.heal) p.heal = null;
  }`,
    `    if (ov.dmgType === 'heal' && !p.heal) p.heal = { mode: 'single' };
    if (ov.dmgType && ov.dmgType !== 'heal' && !ov.heal) p.heal = null;
    // 技能攻击的 atkScale（「攻击力提升至X%」）= 攻击倍率，只抬实际伤害；红字期望 = 来源裸
    // 攻击力（damage.js 主路径），倍率自身去比 1.5 阈值。instant / charges 的 pending 单发与
    // duration / ammo / toggle 的技能期间持续生效都算——弹药只是技能持续的一种形式。
    if (ov.atkScale != null && sk.kind !== 'passive') p.scaleUp = ov.atkScale;
  }`
  ],
  [
    `  const atk = u.s.atk;
  const scale = (prof.atkScale ?? 1) * u.s.atkScaleMul;`,
    `  const atk = u.s.atk;
  const scale = (prof.atkScale ?? 1) * u.s.atkScaleMul;
  // 技能攻击的「攻击力提升至X%」倍率: 攻击/技能实例走 damage.js 裸攻击力主路径自然剔除；
  // postScaleMul 供浮游炮附加（isAttack: false）等回退路径实例使用。
  const scaleUp = Number.isFinite(prof.scaleUp) && prof.scaleUp !== 1 ? prof.scaleUp : 1;`
  ],
  [
    `        dealtMain += b.dealDamage(u, target, { amount: atk * scale * mulT, type: baseType,
          isAttack: true, isSkill: info.isSkill, tags: prof.tags || [], attackId });`,
    `        dealtMain += b.dealDamage(u, target, { amount: atk * scale * mulT, type: baseType,
          isAttack: true, isSkill: info.isSkill, tags: prof.tags || [], attackId, postScaleMul: scaleUp });`
  ],
  [
    `      const d = { amount: atk * scale * mulT * (attachedFunnel ? funnelMul : 1), type: baseType,
        isAttack: !attachedFunnel, isSkill: info.isSkill, tags: attachedFunnel ? [...(prof.tags || []), 'addition', 'funnel'] : (prof.tags || []), attackId };`,
    `      const d = { amount: atk * scale * mulT * (attachedFunnel ? funnelMul : 1), type: baseType,
        isAttack: !attachedFunnel, isSkill: info.isSkill, tags: attachedFunnel ? [...(prof.tags || []), 'addition', 'funnel'] : (prof.tags || []), attackId, postScaleMul: scaleUp };`
  ],
  [
    `      const d = b.dealDamage(u, e, { amount: atk * scale * sc * skillMul, type: baseType, isAttack: true, isSplash: true, isSkill: info.isSkill, attackId });`,
    `      const d = b.dealDamage(u, e, { amount: atk * scale * sc * skillMul, type: baseType, isAttack: true, isSplash: true, isSkill: info.isSkill, attackId, postScaleMul: scaleUp });`
  ]
]);

// =========================================================================
// 15-25. 干员 kit 的红字标记。官方规则（PRTS 伤害红字 + 官服实测）:
//   · 「当次攻击力提升至X%」的概率暴击 = 对攻击倍率的临时增加 → 期望侧剔除（postScaleMul / postMul），
//     倍率本身去比 1.5 阈值: ≥150% 出红（物理 (atk×1.5−def)/(atk−def)≥1.5、法术恰为 1.5），
//     130% 这类不足 1.5 的保持白字（跃跃精一）
//   · 连续型条件倍率（狼眼 / 红豆模组低血 / 跃跃 LPS-X 近身）→ 同样期望侧剔除，越过 1.5 才红
//   · 一次性技能倍率（强力击·β型 / 斥罪蓄力锤击 150% 起）→ 同样期望侧剔除，越过 1.5 才红
//   · 面板型「攻击力+X%」（红豆蛮力穿刺）→ 两侧同时计入，白字（不标记）
//   · 强制红字（crit）仅官方点名技能: 谜图「疑点追踪」满层（未参战）、蕾缪安 S2 瞄准 / S3 礼炮
// =========================================================================

// 15. 普罗旺斯 (prove): 狼眼（连续型，期望剔除）+ 狩猎箭头（概率型 ×1.5，期望剔除后恰好越过阈值）
applyPatchToFile('server/sim/content/kits/ops/chess_char_1_07-prove.js', [
  [
    `          if (drop > 0 && upPer > 0) {
            const lost = Math.max(0, Math.min(1, 1 - target.hpRatio));
            if (lost > 0) dmg.amount *= 1 + (lost / drop) * upPer;
          }`,
    `          if (drop > 0 && upPer > 0) {
            const lost = Math.max(0, Math.min(1, 1 - target.hpRatio));
            // 狼眼是「按目标已损生命提升攻击倍率」（非攻击力提升），官方期望伤害不计入 → 低血时倍率越过 1.5 出红字
            if (lost > 0) { const k = 1 + (lost / drop) * upPer; dmg.amount *= k; dmg.postScaleMul = (dmg.postScaleMul || 1) * k; }
          }`
  ],
  [
    `          if (p > 0 && battle.rng.chance(p)) {
            dmg.amount *= num(t.atk_scale, 1);
            battle.fx('crit', { x: target.x, y: target.y, id: unit.id });
          }`,
    `          if (p > 0 && battle.rng.chance(p)) {
            const kk = num(t.atk_scale, 1);
            dmg.amount *= kk;
            dmg.postScaleMul = (dmg.postScaleMul || 1) * kk; // 狩猎箭头: 当次倍率提升属期望侧不计入的临时增加，×1.5 恰好越过阈值出红
            battle.fx('crit', { x: target.x, y: target.y, id: unit.id });
          }`
  ]
]);

// 16. 跃跃 (caper): 回环射手 LPS-X 近身倍率（连续型，期望剔除）+ 戏耍随心（概率型，期望剔除——精二 150% 红 / 精一 130% 白）;
//     她的 1技能强力击·β型由第 14 节 ai.js 的 oneShotScale 通用处理
applyPatchToFile('server/sim/content/kits/ops/chess_char_1_09-caper.js', [
  [
    `          if (near !== 1 && cheb(unit, target) <= 1) dmg.amount *= near;`,
    `          // 回环射手模组 LPS-X 近身倍率: 连续型条件倍率，期望侧不计入
          if (near !== 1 && cheb(unit, target) <= 1) { dmg.amount *= near; dmg.postScaleMul = (dmg.postScaleMul || 1) * near; }`
  ],
  [
    `          if (!dmg.isSplash && num(t.prob) > 0 && battle.rng.chance(num(t.prob))) {
            dmg.amount *= num(t.atk_scale, 1);
            battle.fx('crit', { x: target.x, y: target.y, id: unit.id });
          }`,
    `          if (!dmg.isSplash && num(t.prob) > 0 && battle.rng.chance(num(t.prob))) {
            const kk = num(t.atk_scale, 1);
            dmg.amount *= kk;
            dmg.postScaleMul = (dmg.postScaleMul || 1) * kk; // 戏耍随心: 当次倍率提升不计入期望——精二 150% 出红，精一 130% 白字
            battle.fx('crit', { x: target.x, y: target.y, id: unit.id });
          }`
  ]
]);

// 17. 古米 (sunbr): 天赋概率倍率 → 期望剔除（≥150% 出红）
applyPatchToFile('server/sim/content/kits/ops/chess_char_1_10-sunbr.js', [
  [
    `          dmg.amount *= num(t.atk_scale, 1);
          procs.add(dmg);`,
    `          const kk = num(t.atk_scale, 1);
          dmg.amount *= kk;
          dmg.postScaleMul = (dmg.postScaleMul || 1) * kk; // 当次攻击倍率提升不计入期望，≥150% 出红
          procs.add(dmg);`
  ]
]);

// 18. 红豆 (vigna): 天赋蛮力穿刺是「攻击力+X%」面板型（官方实测不出红字，不标记）;
//     模组「40%血以下攻击力提升至115%」是连续型条件倍率，期望侧不计入（115% 不足以越 1.5，保持白字）
applyPatchToFile('server/sim/content/kits/ops/chess_char_1_05-vigna.js', [
  [
    `          onHitBy(battle, unit, ({ target, dmg }) => { if (dmg.isAttack && target.hpRatio < num(tb.hp_ratio)) dmg.amount *= num(tb.atk_scale, 1); });`,
    `          onHitBy(battle, unit, ({ target, dmg }) => { if (dmg.isAttack && target.hpRatio < num(tb.hp_ratio)) { dmg.amount *= num(tb.atk_scale, 1); dmg.postScaleMul = (dmg.postScaleMul || 1) * num(tb.atk_scale, 1); } });`
  ]
]);

// 19. 寒芒克洛丝 (kroos2): 天赋「中的」概率 ×1.5（落在 dmg.mul 一侧）→ 期望侧同除，恰好出红
applyPatchToFile('server/sim/content/kits/ops/chess_char_4_06-kroos2.js', [
  [
    `          if (battle.rng.chance(num(t0.prob, 0.2))) { c.dmg.mul *= num(t0.atk_scale, 1.5); crits.add(c.dmg); }`,
    `          if (battle.rng.chance(num(t0.prob, 0.2))) { c.dmg.mul *= num(t0.atk_scale, 1.5); c.dmg.postMul = (c.dmg.postMul || 1) * num(t0.atk_scale, 1.5); crits.add(c.dmg); } // 中的: 当次倍率提升落在伤害倍率一侧，期望侧同除，×1.5 恰好出红`
  ]
]);

// 20. 山 (f12yin): 天赋巨力重拳（trait.dmgMul 概率暴击）→ 当次倍率不计入期望，倍率 ≥150% 出红
applyPatchToFile('server/sim/content/kits/ops/chess_char_5_17-f12yin.js', [
  [
    `            if (unit.mem.crit) battle.fx('crit', { x: unit.x, y: unit.y, id: unit.id });
          }, { owner: unit });`,
    `            if (unit.mem.crit) battle.fx('crit', { x: unit.x, y: unit.y, id: unit.id });
          }, { owner: unit });
          // 巨力重拳是概率型当次攻击倍率（trait.dmgMul 的乘区）: 当次倍率不计入期望，倍率 ≥150% 出红
          battle.on('hit', (c) => { if (c.source === unit && c.dmg && c.dmg.isAttack && unit.mem.crit) c.dmg.postScaleMul = (c.dmg.postScaleMul || 1) * critScale; }, { owner: unit });`
  ]
]);

// 21. 鸿雪 (bgsnow): 押韵（每次攻击概率 ×scale）→ 期望剔除（≥150% 出红）
applyPatchToFile('server/sim/content/kits/ops/op-bgsnow.js', [
  [
    `    if (m.iambProc) d.amount *= scale;`,
    `    if (m.iambProc) { d.amount *= scale; d.postScaleMul = (d.postScaleMul || 1) * scale; } // 押韵: 当次攻击倍率提升不计入期望，≥150% 出红`
  ]
]);

// 22. 黑 (shwaz): 破甲箭头（每次攻击概率 ×scale）→ 期望剔除（≥150% 出红）
applyPatchToFile('server/sim/content/kits/ops/op-shwaz.js', [
  [
    `            d.amount *= scale;
            d.shwazPierce = true;`,
    `            d.amount *= scale;
            d.postScaleMul = (d.postScaleMul || 1) * scale; // 破甲箭头: 当次攻击倍率提升不计入期望，≥150% 出红
            d.shwazPierce = true;`
  ]
]);

// 23. 阿 (haak): 天赋命运骰的攻击面（概率 ×scale）→ 期望剔除（≥150% 出红）
applyPatchToFile('server/sim/content/kits/ops/op-haak.js', [
  [
    `    if (m.haakDice.includes('atk')) d.amount *= scale;`,
    `    if (m.haakDice.includes('atk')) { d.amount *= scale; d.postScaleMul = (d.postScaleMul || 1) * scale; } // 命运骰攻击面: 当次攻击倍率提升不计入期望，≥150% 出红`
  ]
]);

// 24. 斥罪 (judge): S1 蓄力锤击的额外伤害是「攻击力×倍率」的技能倍率 → 期望侧不计入
//     （1.5 倍起，越过阈值即红；蓄力后的 atkScaleMul 增益由 damage.js 的通用剔除处理）
applyPatchToFile('server/sim/content/kits/ops/op-judge.js', [
  [
    `              battle.dealDamage(unit, target, { amount: unit.s.atk * num(b1.atk_scale_2) * unit.s.atkScaleMul, type: 'arts', isSkill: true, tags: ['skill', 'judge:gavel'] });`,
    `              battle.dealDamage(unit, target, { amount: unit.s.atk * num(b1.atk_scale_2) * unit.s.atkScaleMul, type: 'arts', isSkill: true, tags: ['skill', 'judge:gavel'], postScaleMul: num(b1.atk_scale_2) }); // 蓄力锤击的攻击倍率: 期望侧不计入`
  ]
]);

// 25. 蕾缪安 (lemuen): S2 瞄准狙击与 S3 礼炮轰炸——官方「强制红字」名单（另一名成员谜图「疑点追踪」满层未参战）
applyPatchToFile('server/sim/content/kits/ops/chess_char_6_01-lemuen.js', [
  [
    `      battle.dealDamage(unit, e, { amount: atk * (d <= d1 + 1e-9 ? s1 : s2), type: 'phys', isSkill: true, isSplash: true, tags: ['skill', 'bombard'] });`,
    `      battle.dealDamage(unit, e, { amount: atk * (d <= d1 + 1e-9 ? s1 : s2), type: 'phys', isSkill: true, isSplash: true, tags: ['skill', 'bombard'], crit: true }); // S3 礼炮: 官方强制红字`
  ],
  [
    `      battle.dealDamage(unit, a, { amount: atk * s2, type: 'phys', isSkill: true, isSplash: true, tags: ['skill', 'bombard'] });`,
    `      battle.dealDamage(unit, a, { amount: atk * s2, type: 'phys', isSkill: true, isSplash: true, tags: ['skill', 'bombard'], crit: true }); // S3 礼炮: 官方强制红字`
  ],
  [
    `        battle.dealDamage(unit, e, { amount: unit.s.atk * scale, type: 'phys', canDodge: false, isSkill: true, tags: ['skill', 'snipe'] });`,
    `        battle.dealDamage(unit, e, { amount: unit.s.atk * scale, type: 'phys', canDodge: false, isSkill: true, tags: ['skill', 'snipe'], crit: true }); // S2 瞄准: 官方强制红字`
  ]
]);

if (isRestore) {
  console.log('所有文件已彻底还原回原版！');
} else {
  console.log('v0.2.6 个性化功能补丁已应用完成！随时可通过 node apply-font-patch.mjs --restore 一键还原。');
}