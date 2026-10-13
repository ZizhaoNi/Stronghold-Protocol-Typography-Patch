// apply-font-patch.mjs — 自动注册外部字体、多语言支持、全自由调色与一键还原
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
    const expectedXa = officialExpectedAmount(dmg, dmg.type, target.s, target);
    const ratioCrit = officialDamageMark(amount, expectedXa) === 'r';
    const hpCrit = target.maxHp > 0 && amount >= target.maxHp * 0.18;

    const ev = ['dmg', target.id, Math.round(amount), shown];
    if (mark === 'r' || ratioCrit) ev.push('r');
    else ev.push('');
    ev.push(hpCrit ? 'hp' : '');
    battle._ev(ev);
  }`
  ]
]);

// =========================================================================
// 4. public/js/render/app.js: 适配 dmg 事件分发（透传 ratioCrit 与 hpCrit），含 v0.2.6 新增的 ammoCount 设置
// =========================================================================
applyPatchToFile('public/js/render/app.js', [
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
  official: {
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
    crit: { fill: '#ff2a2a', strokeOn: false },
    miss: { fill: '#ff9000', strokeOn: false },
  },
  tactical: {
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
  minimal: {
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

export function getCustomDamageConfig() {
  let mode = 'official';
  try { mode = JSON.parse(localStorage.getItem('sp.pref.settings'))?.presetMode || 'official'; } catch (e) {}
  if (mode !== 'custom' && PRESET_DAMAGE_STYLES[mode]) return PRESET_DAMAGE_STYLES[mode];
  try {
    const raw = localStorage.getItem('sp.pref.damageStyleCustom');
    if (raw) return { ...PRESET_DAMAGE_STYLES.official, ...JSON.parse(raw) };
  } catch (e) {}
  return PRESET_DAMAGE_STYLES.official;
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
  let mode = 'official';
  let userWeight = '400', userStroke = null, userStop = null;
  try {
    const s = JSON.parse(localStorage.getItem('sp.pref.settings'));
    mode = s?.presetMode || 'official';
    userWeight = s?.customWeight || (mode === 'original' || mode === 'minimal' ? '700' : mode === 'tactical' ? '700' : '400');
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
// 7. public/js/render/fx/numbers.js: 高度/抖动/重叠/避让/速度滑块全面支持
// =========================================================================
applyPatchToFile('public/js/render/fx/numbers.js', [
  [
    "const NUM_LANES = Object.freeze([0, -1, 1, -2, 2]);",
    "const NUM_LANES = Object.freeze([0]);"
  ],
  [
    "const numScale = (s, big, style) => clamp(s / 115, 0.42, 1.05) * (big ? 1.35 : 1) * (style === 'heal' ? 0.9 : 1);",
    `const numScale = (s, big, style) => {
  let baseMult = 1.0, healRatio = 0.65;
  try {
    const pref = JSON.parse(localStorage.getItem('sp.pref.settings'));
    baseMult = Number(pref?.dmgScale) || 1.0;
    healRatio = pref?.customHealRatio != null ? Number(pref.customHealRatio) : (pref?.presetMode === 'original' ? 0.9 : 0.65);
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
    `  officialNumber(view, amount, style) {
    if (!view) return;
    const miss = style === 'miss';
    const n = miss ? 0 : Math.round(amount);
    if (!miss && (!Number.isFinite(n) || n < 0)) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const feetZ = (view.z || 0) + (view.hover || 0);
    const base = feetZ + (view._headTiles || 1.2);
    const feet = cam.project(view.x, view.y, feetZ, this._p);
    const head = cam.project(view.x, view.y, base, this._q);
    const ax = feet.x, ay = head.y, s = head.s > 0 ? head.s : 100;
    const pxPerZ = (feet.y - head.y) / (view._headTiles || 1.2);
    const tile = pxPerZ > 1e-3 ? pxPerZ : s;
    const cx = feet.x + (Math.random() - 0.5) * OFFICIAL_JITTER_X * tile;
    const cy = ay - (OFFICIAL_LIFT_MIN + Math.random() * OFFICIAL_LIFT_SPAN) * tile;
    const sc = numScale(s, false, style);
    const w = numChars(n, style) * NUM_DIGIT_EM * 24 * sc * NUM_POP + NUM_GAP_PX;
    const h = 24 * NUM_LINE_EM * sc * NUM_POP;
    const maxNums = this.load >= 2 ? MAX_NUMBERS >> 1 : MAX_NUMBERS;
    while (this.nums.length >= maxNums) this._releaseNum(this.nums.shift());
    const t = this._takeNum(style, true); // 官方红字使用粗体库
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = miss ? 'MISS' : String(n);
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: NUM_LIFE, born: now, lastHit: now, pop: 1, big: false, fading: false,
      official: true, ox: cx - ax, oy: cy - feet.y, x0: view.x, y0: view.y, z0: feetZ,
      risePx: NUM_RISE * tile * 0.5, _x: cx, _y: cy, _w: w, _h: h,
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
    const base = feetZ + (view._headTiles || 1.2);
    const feet = cam.project(view.x, view.y, feetZ, this._p);
    const head = cam.project(view.x, view.y, base, this._q);
    
    let heightFactor = 1.0, jitterRange = 0.0, riseSpeed = 1.0;
    try {
      const pref = JSON.parse(localStorage.getItem('sp.pref.settings'));
      if (pref?.customHeight != null) heightFactor = Number(pref.customHeight);
      if (pref?.customJitter != null) jitterRange = Number(pref.customJitter);
      if (pref?.numRiseSpeed != null) riseSpeed = Number(pref.numRiseSpeed);
    } catch (e) {}

    const targetY = feet.y + (head.y - feet.y) * heightFactor;
    const ax = feet.x + (Math.random() - 0.5) * jitterRange * 2;
    const ay = targetY;
    const s = head.s > 0 ? head.s : 100;
    const pxPerZ = (feet.y - head.y) / (view._headTiles || 1.2);
    const risePx = (NUM_RISE * riseSpeed) * (pxPerZ > 1e-3 ? pxPerZ : s * 0.5);`
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
    `    const maxPerTarget = Number(this.ctx.settings?.numMaxPerTarget ?? NUM_PER_TARGET);
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
  ]
]);

// =========================================================================
// 8. public/js/ui/settings.js
// =========================================================================
const damageCustomSectionCode = [
  'const I18N_CUSTOM = {',
  "  '数字风格': { en: 'Numeral Style', ja: '数字スタイル', ko: '숫자 스타일', 'zh-TW': '數字風格' },",
  "  '原版经典': { en: 'Classic (Original)', ja: 'クラシック', ko: '오리지널 클래식', 'zh-TW': '原版經典' },",
  "  '官方还原': { en: 'Authentic (AK)', ja: '公式再現', ko: '공식 재현', 'zh-TW': '官方還原' },",
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
  "  '法术伤害': { en: 'Arts', ja: '術師', ko: '마법', 'zh-TW': '法術傷害' },",
  "  '真实伤害': { en: 'True', ja: '確定', ko: '트루', 'zh-TW': '真實傷害' },",
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
  "  '跳字避让': { en: 'Dodge Overlap', ja: '重なり回避', ko: '겹침 회피', 'zh-TW': '跳字避讓' },",
  "  '暴击大字': { en: 'Crit Pop', ja: 'クリティカル強調', ko: '치명타 강조', 'zh-TW': '暴擊大字' },",
  "  '暴击触发模式': { en: 'Crit Trigger', ja: 'クリティカル条件', ko: '치명타 조건', 'zh-TW': '暴擊觸發模式' },",
  "  '官方比例(15%)': { en: 'Ratio 15%', ja: '比率15%', ko: '비율 15%', 'zh-TW': '官方比例(15%)' },",
  "  '高伤阈值(18%)': { en: 'HP 18%', ja: 'HP18%以上', ko: 'HP 18%', 'zh-TW': '高傷閾值(18%)' },",
  "  '两者其一': { en: 'Either', ja: 'どちらか', ko: '둘 중 하나', 'zh-TW': '兩者其一' },",
  "  '仅放大': { en: 'Scale Only', ja: '拡大のみ', ko: '확대만', 'zh-TW': '僅放大' },",
  "  '暴击加粗': { en: 'Crit Bold', ja: 'クリティカル太字', ko: '치명타 굵게', 'zh-TW': '暴擊加粗' },",
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
  '  const currentHealRatio = Number(s.customHealRatio ?? 0.65);',
  '  const currentHeight = Number(s.customHeight ?? 1.0);',
  '  const currentJitter = Number(s.customJitter ?? 2.0);',
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
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字垂直高度\')}<${MicroLabel}>HEIGHT (${Math.round(currentHeight * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.0" max="1.5" step="0.05" value=${currentHeight}',
  '          onInput=${(e) => updateSettings({ customHeight: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字左右抖动\')}<${MicroLabel}>JITTER (${currentJitter}px)<//></span>',
  '        <input class="set-range" type="range" min="0" max="5" step="0.5" value=${currentJitter}',
  '          onInput=${(e) => updateSettings({ customJitter: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'跳字上浮速度\')}<${MicroLabel}>RISE (${Math.round(currentRise * 100)}%)<//></span>',
  '        <input class="set-range" type="range" min="0.2" max="2.5" step="0.1" value=${currentRise}',
  '          onInput=${(e) => updateSettings({ numRiseSpeed: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'同目标跳字上限\')}<${MicroLabel}>MAX/TARGET (${currentMaxPer})<//></span>',
  '        <input class="set-range" type="range" min="1" max="8" step="1" value=${currentMaxPer}',
  '          onInput=${(e) => updateSettings({ numMaxPerTarget: Number(e.currentTarget.value), presetMode: \'custom\' })} style="flex:1;margin-left:.1rem;" />',
  '      </div>',
  '      <${Toggle} label=${tr(\'跳字合并\')} micro="MERGE" value=${s.numMerge !== false} onChange=${(v) => updateSettings({ numMerge: v, presetMode: \'custom\' })} />',
  '      <${Toggle} label=${tr(\'跳字避让\')} micro="DODGE" value=${s.numAvoid !== false} onChange=${(v) => updateSettings({ numAvoid: v, presetMode: \'custom\' })} />',
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
  '            ${PRESET_MODES.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.presetMode || \'official\') === id ? \'true\' : \'false\'}',
  '              class=${(s.presetMode || \'official\') === id ? \'is-on\' : \'\'} onClick=${() => applyPresetMode(id, updateSettings)}>${tr(label)}</button>`)}',
  '          </div>',
  '        </div>',
  '        <${DamageCustomSection} s=${s} updateSettings=${updateSettings} />',
  '      ` : null}'
].join('\n');

applyPatchToFile('public/js/ui/settings.js', [
  [
    "export const settingsStore = createStore(sanitizeSettings(loadPref('settings', null)));",
    `const _rawPref = loadPref('settings', null) || {};
export const settingsStore = createStore({
  ...sanitizeSettings(_rawPref),
  presetMode: _rawPref.presetMode || 'official',
  uiFont: _rawPref.uiFont || _rawPref.fontFamily || 'novecento',
  dmgFont: _rawPref.dmgFont || _rawPref.fontFamily || 'novecento',
  dmgScale: _rawPref.dmgScale || '1.0',
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
  ['official', '官方还原'],
  ['tactical', '属性风暴'],
  ['minimal', '街机硬派'],
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
    original: { uiFont: 'bender', dmgFont: 'bender', dmgScale: '1.0', customWeight: '700', customStroke: 7, customStop: 0.25, customHealRatio: 0.9 },
    official: { uiFont: 'novecento', dmgFont: 'novecento', dmgScale: '1.0', customWeight: '400', customStroke: 0, customStop: 0, customHealRatio: 0.65 },
    tactical: { uiFont: 'rodin', dmgFont: 'rodin', dmgScale: '1.1', customWeight: '700', customStroke: 4, customStop: 0.3, customHealRatio: 0.75 },
    minimal: { uiFont: 'skurri', dmgFont: 'skurri', dmgScale: '1.2', customWeight: '400', customStroke: 5, customStop: 0.15, customHealRatio: 0.85 },
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

if (isRestore) {
  console.log('所有文件已彻底还原回原版！');
} else {
  console.log('v0.2.6 个性化功能补丁已应用完成！随时可通过 node apply-font-patch.mjs --restore 一键还原。');
}