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
// 3. server/sim/damage.js: 区分打条与爆条，判定期望伤害 1.5 倍
// =========================================================================
applyPatchToFile('server/sim/damage.js', [
  [
    "battle._ev(['dmg', target.id, Math.round(amt), el]);",
    "battle._ev(['dmg', target.id, Math.round(amt), `${el}-dmg`]);"
  ],
  [
    `  if (dmg && !dmg.silent && amount >= 0.5) {
    const shown = dmg.type === 'element' ? dmg.element : dmg.type === 'elemental' ? (dmg.element || 'true') : dmg.type;
    battle._ev(['dmg', target.id, Math.round(amount), shown]);
  }`,
    `  if (dmg && !dmg.silent && amount >= 0.5) {
    let shown = dmg.type;
    if (dmg.type === 'elemental' && dmg.element) {
      shown = dmg.element;
    } else if (dmg.type === 'element') {
      shown = \`\${dmg.element}-dmg\`;
    }
    const expectedXa = (dmg.amount * (dmg.mul || 1));
    const isCrit = amount >= expectedXa * 1.5;
    battle._ev(['dmg', target.id, Math.round(amount), shown, isCrit]);
  }`
  ]
]);

// =========================================================================
// 4. public/js/render/app.js: 透传 isCrit 事件并支持运行时设置同步
// =========================================================================
applyPatchToFile('public/js/render/app.js', [
  [
    "fx.damage(v, amt, e[3], src);",
    "fx.damage(v, amt, e[3], src, e[4]);"
  ],
  [
    `    setSettings(s) {
      if (!s || typeof s !== 'object') return;
      const q = settings.quality;
      if (typeof s.damageNumbers === 'boolean') settings.damageNumbers = s.damageNumbers;
      if (s.quality === 'high' || s.quality === 'medium' || s.quality === 'low') settings.quality = s.quality;
      if (q !== settings.quality) { board3d?.setQuality?.(settings.quality); resize(); }
    },`,
    `    setSettings(s) {
      if (!s || typeof s !== 'object') return;
      const q = settings.quality;
      if (typeof s.damageNumbers === 'boolean') settings.damageNumbers = s.damageNumbers;
      if (s.quality === 'high' || s.quality === 'medium' || s.quality === 'low') settings.quality = s.quality;
      if (q !== settings.quality) { board3d?.setQuality?.(settings.quality); resize(); }
      Object.assign(settings, s);
    },`
  ]
]);

// =========================================================================
// 5. public/js/render/style.js: 规范全伤害样式键名映射
// =========================================================================
applyPatchToFile('public/js/render/style.js', [
  [
    `export const DMG_STYLE = Object.freeze({
  phys: { font: 'sp-dmg-phys', fill: ['#fffbe8', '#ffb35c'], stroke: '#3b1400' },
  arts: { font: 'sp-dmg-arts', fill: ['#fbe8ff', '#c77dff'], stroke: '#2a0b45' },
  true: { font: 'sp-dmg-true', fill: ['#ffffff', '#e8e8e8'], stroke: '#2a2a2a' },
  heal: { font: 'sp-dmg-heal', fill: ['#eafff0', '#62f08a'], stroke: '#07361a' },
  elem: { font: 'sp-dmg-elem', fill: ['#fff4e0', '#ff7b3a'], stroke: '#3a1000' },
});

/** Map b.ev dmg types to a style key. */
export function dmgStyleKey(type) {
  if (type === 'phys' || type === 'arts' || type === 'true' || type === 'heal') return type;
  if (type === 'burn' || type === 'neural' || type === 'necrosis' || type === 'apoptosis' || type === 'erosion' || type === 'element') return 'elem';
  return 'phys';
}`,
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
});

export function dmgStyleKey(type) {
  if (DMG_STYLE[type]) return type;
  return 'phys';
}`
  ]
]);

// =========================================================================
// 6. public/js/render/fx/fonts.js: 动态生成 4 大风格（Rodin/Skurri 驱动）
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
      }, { chars: [['0', '9'], '+-×!'], resolution: 2, padding: 6 });
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
  },
  minimal: {
    phys: { fill: ['#FFF1B8', '#FA8C16'], grad: true, strokeOn: true, stroke: '#2b1000' },
    arts: { fill: ['#E6F7FF', '#69C0FF'], grad: true, strokeOn: true, stroke: '#001d66' },
    true: { fill: '#FFF566', strokeOn: true, stroke: '#3f3000' },
    heal: { fill: ['#F6FFED', '#73D13D'], grad: true, strokeOn: true, stroke: '#0b3a00' },
    'burn-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#D4380D' },
    'neural-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#08979C' },
    'apoptosis-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#531DAB' },
    'erosion-dmg': { fill: '#ffffff', strokeOn: true, stroke: '#096DD9' },
    burn: { fill: ['#FFC069', '#D4380D'], grad: true, strokeOn: true, stroke: '#2b0000' },
    neural: { fill: ['#87E8DE', '#08979C'], grad: true, strokeOn: true, stroke: '#001a1c' },
    apoptosis: { fill: ['#B37FEB', '#531DAB'], grad: true, strokeOn: true, stroke: '#0d0024' },
    erosion: { fill: ['#91D5FF', '#096DD9'], grad: true, strokeOn: true, stroke: '#001538' },
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

export function rebuildDamageFonts(fontKey = 'novecento') {
  const P = globalThis.PIXI;
  if (!P) return;
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
  const cfg = getCustomDamageConfig();
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

      P.BitmapFont.from(fontName, {
        fontFamily: fontFam, fontSize: 44, fontWeight: userWeight, fill: fillVal,
        fillGradientStops: gradStops,
        strokeThickness: strokeThick, stroke: item.stroke || '#000000',
        dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: isOrig ? 0.45 : 0.6, dropShadowDistance: 2, dropShadowBlur: 2,
      }, { chars: [['0', '9'], '+-×!'], resolution: 2, padding: 6 });

      P.BitmapFont.from(fontName + '-crit', {
        fontFamily: fontFam, fontSize: 48, fontWeight: '700', fill: fillVal,
        fillGradientStops: gradStops,
        strokeThickness: strokeThick, stroke: item.stroke || '#000000',
        dropShadow: true, dropShadowColor: '#000000', dropShadowAlpha: 0.7, dropShadowDistance: 2, dropShadowBlur: 2,
      }, { chars: [['0', '9'], '+-×!'], resolution: 2, padding: 6 });
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
// 7. public/js/render/fx/numbers.js: 动态读取治疗比例、正上方居中与字号缩放
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
  [
    `  damage(view, amount, type, srcView) {
    if (!view) return;
    const style = dmgStyleKey(type);
    const p = this._chest(view);
    const px = p.x, py = p.y, s = p.s;
    const tint = HIT_TINT[style] || 0xffffff;
    const big = view.maxHp > 0 && amount >= view.maxHp * 0.18;`,
    `  damage(view, amount, type, srcView, isCrit = false) {
    if (!view) return;
    const style = dmgStyleKey(type);
    const p = this._chest(view);
    const px = p.x, py = p.y, s = p.s;
    const tint = HIT_TINT[style] || 0xffffff;
    const cfgMode = this.ctx.settings?.critMode || 'ratio15';
    const hpCrit = view.maxHp > 0 && amount >= view.maxHp * 0.18;
    const isTriggeredCrit = cfgMode === 'ratio15' ? isCrit
      : cfgMode === 'hp18' ? hpCrit
      : cfgMode === 'both' ? (isCrit || hpCrit)
      : cfgMode === 'scaleOnly' ? (isCrit || hpCrit)
      : false;
    const big = isTriggeredCrit;`
  ],
  [
    "if (this.ctx.settings?.damageNumbers !== false) this.number(view, amount, style, big);",
    "if (this.ctx.settings?.damageNumbers !== false) this.number(view, amount, style, big, isCrit);"
  ],
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
    `  number(view, amount, style, big, isCrit = false) {
    const n = Math.round(amount);
    if (!(n > 0) || !view) return;
    const now = this.time;
    const cam = this.ctx.cam();
    const feetZ = (view.z || 0) + (view.hover || 0);
    const base = feetZ + (view._headTiles || 1.2);
    const feet = cam.project(view.x, view.y, feetZ, this._p);
    const head = cam.project(view.x, view.y, base, this._q);
    const ax = feet.x, ay = head.y, s = head.s > 0 ? head.s : 100;
    const pxPerZ = (feet.y - head.y) / (view._headTiles || 1.2);
    const risePx = NUM_RISE * (pxPerZ > 1e-3 ? pxPerZ : s * 0.5);`
  ],
  [
    "const sc = numScale(s, big, style);",
    `    const isOrig = (this.ctx.settings?.presetMode === 'original');
    const sc = numScale(s, big, style) * (isOrig ? 1.0 : (big ? 1.4 : 1.0));`
  ],
  [
    `    const t = this._takeNum(style);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = (style === 'heal' ? '+' : '') + n;
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: life, born: now, lastHit: now, pop: 1, big: !!big, fading: false,
      ox: cx - ax, oy: cy - ay, x0: view.x, y0: view.y, z0: base, risePx, _x: cx, _y: cy, _w: w, _h: h,
    });`,
    `    const critOn = this.ctx.settings?.critOn !== false;
    const byRatio = this.ctx.settings?.critByRatio !== false;
    const byHp = !!this.ctx.settings?.critByHp;
    const doBold = this.ctx.settings?.critDoBold !== false;
    const hpCrit = view.maxHp > 0 && amount >= view.maxHp * 0.18;
    const isTriggered = critOn && ((byRatio && isCrit) || (byHp && hpCrit));
    const isBoldCrit = isTriggered && doBold;

    const t = this._takeNum(style, isBoldCrit);
    t.text.visible = true;
    t.text.alpha = 1;
    t.text.text = (style === 'heal' ? '+' : '') + n;
    Object.assign(t, {
      unit: view, style, value: n, life: 0, end: life, born: now, lastHit: now, pop: 1, big: !!big, isCrit: !!isCrit, fading: false,
      ox: cx - ax, oy: cy - feet.y, x0: view.x, y0: view.y, z0: feetZ, risePx, _x: cx, _y: cy, _w: w, _h: h,
    });`
  ],
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
// 8. public/js/ui/settings.js: 接入 FOT-Rodin/Skurri 选项、多语言与组件隔离
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
  "  '1.5倍期望': { en: '1.5x Ratio', ja: '期待値1.5倍', ko: '기대치 1.5배', 'zh-TW': '1.5倍期望' },",
  "  '18%生命': { en: '18% HP', ja: 'HP 18%', ko: 'HP 18%', 'zh-TW': '18%生命' },",
  "  '字号放大': { en: 'Enlarge', ja: '拡大', ko: '확대', 'zh-TW': '字號放大' },",
  "  '字体加粗': { en: 'Bold', ja: '太字', ko: '굵게', 'zh-TW': '字型加粗' },",
  "  '高级微调': { en: 'Fine-Tuning', ja: '詳細設定', ko: '고급 설정', 'zh-TW': '進階微調' },",
  "  '展开': { en: 'Expand', ja: '展開', ko: '펼치기', 'zh-TW': '展開' },",
  "  '收起': { en: 'Collapse', ja: '折りたたむ', ko: '접기', 'zh-TW': '收起' },",
  "  '基础字重': { en: 'Base Weight', ja: '基本太さ', ko: '기본 굵기', 'zh-TW': '基礎字重' },",
  "  '描边粗细': { en: 'Stroke Width', ja: '縁取り幅', ko: '외곽선 두께', 'zh-TW': '描邊粗細' },",
  "  '渐变停靠点': { en: 'Gradient Stop', ja: 'グラデ位置', ko: '그라데이션 위치', 'zh-TW': '漸層停靠點' },",
  "  '治疗字号比例': { en: 'Heal Ratio', ja: '回復サイズ比', ko: '치료 크기 비율', 'zh-TW': '治療字級比例' },",
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
  '  const [open, setOpen] = useState(false);',
  '  const [cfg, setCfg] = useState(() => {',
  "    try { return JSON.parse(localStorage.getItem('sp.pref.damageStyleCustom')) || {}; } catch(e) { return {}; }",
  '  });',
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
  '  const critOn = s.critOn !== false;',
  '  const byRatio = s.critByRatio !== false;',
  '  const byHp = !!s.critByHp;',
  '  const doScale = s.critDoScale !== false;',
  '  const doBold = s.critDoBold !== false;',
  '  return html`<div style="margin-top:.08rem;">',
  '    <div class="set-row">',
  '      <span class="set-row__label">${tr(\'高级微调\')}<${MicroLabel}>CUSTOMIZE<//></span>',
  '      <button type="button" class="btn btn--secondary btn--sm" onClick=${() => setOpen(!open)}>',
  '        ${open ? tr(\'收起\') : tr(\'展开\')}',
  '      </button>',
  '    </div>',
  '    ${open ? html`<div style="display:flex;flex-direction:column;gap:.1rem;padding:.12rem;background:rgba(0,0,0,.45);border:1px solid var(--line-2);margin-top:.06rem;">',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'界面数字字体\')}<${MicroLabel}>UI FONT<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${FONT_OPTIONS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.uiFont || \'novecento\') === id ? \'true\' : \'false\'}',
  '            class=${(s.uiFont || \'novecento\') === id ? \'is-on\' : \'\'} onClick=${() => updateSettings({ uiFont: id, presetMode: \'custom\' })}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'战斗跳字字体\')}<${MicroLabel}>COMBAT FONT<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${FONT_OPTIONS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.dmgFont || \'novecento\') === id ? \'true\' : \'false\'}',
  '            class=${(s.dmgFont || \'novecento\') === id ? \'is-on\' : \'\'} onClick=${() => { updateSettings({ dmgFont: id, presetMode: \'custom\' }); import(\'../render/fx/fonts.js\').then((m) => m.rebuildDamageFonts(id)); }}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'伤害跳字字号\')}<${MicroLabel}>SCALE<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${DMG_SCALES.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.dmgScale || \'1.0\') === id ? \'true\' : \'false\'}',
  '            class=${(s.dmgScale || \'1.0\') === id ? \'is-on\' : \'\'} onClick=${() => updateSettings({ dmgScale: id, presetMode: \'custom\' })}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'基础字重\')}<${MicroLabel}>WEIGHT<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${WEIGHT_OPTIONS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${(s.customWeight || \'400\') === id ? \'true\' : \'false\'}',
  '            class=${(s.customWeight || \'400\') === id ? \'is-on\' : \'\'} onClick=${() => { updateSettings({ customWeight: id, presetMode: \'custom\' }); import(\'../render/fx/fonts.js\').then(m => m.rebuildDamageFonts(s.dmgFont)); }}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'描边粗细\')}<${MicroLabel}>STROKE<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${STROKE_OPTIONS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${String(s.customStroke ?? \'4\') === id ? \'true\' : \'false\'}',
  '            class=${String(s.customStroke ?? \'4\') === id ? \'is-on\' : \'\'} onClick=${() => { updateSettings({ customStroke: Number(id), presetMode: \'custom\' }); import(\'../render/fx/fonts.js\').then(m => m.rebuildDamageFonts(s.dmgFont)); }}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'渐变停靠点\')}<${MicroLabel}>GRADIENT<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${STOP_OPTIONS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${String(s.customStop ?? \'0.25\') === id ? \'true\' : \'false\'}',
  '            class=${String(s.customStop ?? \'0.25\') === id ? \'is-on\' : \'\'} onClick=${() => { updateSettings({ customStop: Number(id), presetMode: \'custom\' }); import(\'../render/fx/fonts.js\').then(m => m.rebuildDamageFonts(s.dmgFont)); }}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'治疗字号比例\')}<${MicroLabel}>HEAL RATIO<//></span>',
  '        <div class="set-seg" role="radiogroup">',
  '          ${HEAL_RATIOS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${String(s.customHealRatio ?? \'0.65\') === id ? \'true\' : \'false\'}',
  '            class=${String(s.customHealRatio ?? \'0.65\') === id ? \'is-on\' : \'\'} onClick=${() => updateSettings({ customHealRatio: Number(id), presetMode: \'custom\' })}>${label}</button>`)}',
  '        </div>',
  '      </div>',
  '      <div class="set-row">',
  '        <span class="set-row__label">${tr(\'暴击跳字特显\')}<${MicroLabel}>CRIT MASTER<//></span>',
  '        <button type="button" class=${`set-toggle${critOn ? \' is-on\' : \'\'}`} role="switch" aria-checked=${critOn ? \'true\' : \'false\'}',
  '          onClick=${() => updateSettings({ critOn: !critOn, presetMode: \'custom\' })}><i></i><span>${critOn ? tc(\'toggle\', \'开启\') : tc(\'toggle\', \'关闭\')}</span></button>',
  '      </div>',
  '      ${critOn ? html`',
  '        <div class="set-row">',
  '          <span class="set-row__label">${tr(\'暴击触发条件\')}<${MicroLabel}>TRIGGER (多选)<//></span>',
  '          <div class="set-seg" role="group">',
  '            <button type="button" class=${byRatio ? \'is-on\' : \'\'} onClick=${() => { if (byRatio && !byHp) return; updateSettings({ critByRatio: !byRatio, presetMode: \'custom\' }); }}>${tr(\'1.5倍期望\')}</button>',
  '            <button type="button" class=${byHp ? \'is-on\' : \'\'} onClick=${() => { if (byHp && !byRatio) return; updateSettings({ critByHp: !byHp, presetMode: \'custom\' }); }}>${tr(\'18%生命\')}</button>',
  '          </div>',
  '        </div>',
  '        <div class="set-row">',
  '          <span class="set-row__label">${tr(\'暴击视觉表现\')}<${MicroLabel}>VISUAL (多选)<//></span>',
  '          <div class="set-seg" role="group">',
  '            <button type="button" class=${doScale ? \'is-on\' : \'\'} onClick=${() => { if (doScale && !doBold) return; updateSettings({ critDoScale: !doScale, presetMode: \'custom\' }); }}>${tr(\'字号放大\')}</button>',
  '            <button type="button" class=${doBold ? \'is-on\' : \'\'} onClick=${() => { if (doBold && !doScale) return; updateSettings({ critDoBold: !doBold, presetMode: \'custom\' }); }}>${tr(\'字体加粗\')}</button>',
  '          </div>',
  '        </div>',
  '      ` : null}',
  '      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:.04rem;border-bottom:1px solid var(--line-2);padding-bottom:.06rem;">',
  '        <span style="font-size:.13rem;color:var(--text-dim);">${tr(\'各伤害独立外观\')}：</span>',
  '        <button type="button" class="btn btn--secondary btn--sm" onClick=${unifyElements}>${tr(\'统一元素为单色\')}</button>',
  '      </div>',
  '      ${items.map(([k, name]) => {',
  '        const cur = cfg[k] || PALETTE_PRESETS.official[k] || {};',
  "        const fill = Array.isArray(cur.fill) ? cur.fill[0] : (cur.fill || '#ffffff');",
  "        const fill2 = Array.isArray(cur.fill) ? cur.fill[1] : (cur.fill2 || fill);",
  '        const grad = !!cur.grad;',
  '        const strokeOn = cur.strokeOn !== undefined ? !!cur.strokeOn : true;',
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
  critOn: _rawPref.critOn !== false,
  critByRatio: _rawPref.critByRatio !== false,
  critByHp: !!_rawPref.critByHp,
  critDoScale: _rawPref.critDoScale !== false,
  critDoBold: _rawPref.critDoBold !== false,
  customWeight: _rawPref.customWeight || '400',
  customStroke: _rawPref.customStroke != null ? _rawPref.customStroke : 4,
  customStop: _rawPref.customStop != null ? _rawPref.customStop : 0.25,
  customHealRatio: _rawPref.customHealRatio != null ? _rawPref.customHealRatio : 0.65,
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
    original: { uiFont: 'bender', dmgFont: 'bender', dmgScale: '1.0', customWeight: '700', customStroke: 7, customStop: 0.25, customHealRatio: 0.9, critOn: true, critByRatio: false, critByHp: true, critDoScale: true, critDoBold: false },
    official: { uiFont: 'novecento', dmgFont: 'novecento', dmgScale: '1.0', customWeight: '400', customStroke: 0, customStop: 0, customHealRatio: 0.65, critOn: true, critByRatio: true, critByHp: false, critDoScale: true, critDoBold: true },
    tactical: { uiFont: 'rodin', dmgFont: 'rodin', dmgScale: '1.1', customWeight: '700', customStroke: 4, customStop: 0.3, customHealRatio: 0.75, critOn: true, critByRatio: true, critByHp: true, critDoScale: true, critDoBold: true },
    minimal: { uiFont: 'skurri', dmgFont: 'skurri', dmgScale: '1.2', customWeight: '400', customStroke: 5, customStop: 0.15, customHealRatio: 0.85, critOn: true, critByRatio: true, critByHp: false, critDoScale: true, critDoBold: false },
    custom: {}
  };
  const p = presets[id] || {};
  import('../render/fx/fonts.js').then((m) => {
    if (id !== 'custom' && m.PRESET_DAMAGE_STYLES[id]) {
      localStorage.setItem('sp.pref.damageStyleCustom', JSON.stringify(m.PRESET_DAMAGE_STYLES[id]));
    }
    updateFn({ presetMode: id, ...p });
    if (p.uiFont) applyFontFamily(p.uiFont);
    const f = p.dmgFont || settingsStore.get().dmgFont || 'novecento';
    m.rebuildDamageFonts(f);
  });
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
// 9. components.css & game-shop.css: 独立作用域微调
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
  console.log('个性化功能补丁已应用完成！随时可通过 node apply-font-patch.mjs --restore 一键还原。');
}