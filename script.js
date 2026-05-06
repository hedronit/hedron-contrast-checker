/**
 * Hedron Contrast Checker — script.js
 *
 * Evaluates color contrast against two standards:
 *   - WCAG 2.2: contrast ratio based on relative luminance (W3C, October 2023)
 *   - APCA-W3 0.1.9: Advanced Perceptual Contrast Algorithm (candidate for WCAG 3.0)
 *
 * Suggests nearby color variants that meet accessibility thresholds.
 *
 * APCA reference implementation: https://github.com/Myndex/SAPC-APCA
 * License: GPL v3 — contributions welcome on GitHub.
 */

'use strict';

/* =============================================================================
   1. Costanti
   ============================================================================= */

/** WCAG 2.2 thresholds */
const WCAG = {
  AA_NORMAL:   4.5,
  AA_LARGE:    3.0,
  AAA_NORMAL:  7.0,
  AAA_LARGE:   4.5,
};

/** APCA thresholds (absolute Lc value) */
const APCA_THRESHOLDS = {
  BODY:   75,  // body text ≥ 16px normal / ≥ 14px bold
  LARGE:  60,  // large text ≥ 24px normal / ≥ 18px bold
  XL:     45,  // very large text ≥ 36px
  UI:     30,  // non-text elements (icons, borders)
};

/** APCA-W3 0.1.9 internal constants */
const APCA_CONSTANTS = {
  blackClamp: 0.022,
  blackExp:   1.414,
  // Normal polarity: dark text on light background
  normBg:   0.56,
  normTxt:  0.57,
  // Reverse polarity: light text on dark background
  revBg:    0.65,
  revTxt:   0.62,
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  loClamp:  0.1,
};


/* =============================================================================
   2. Color utilities
   ============================================================================= */

/**
 * Converte un codice hex (#RRGGBB) in un oggetto { r, g, b }.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number } | null}
 */
function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  const expanded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  if (!/^[0-9A-Fa-f]{6}$/.test(expanded)) return null;
  const n = parseInt(expanded, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * Converte valori RGB (0–255) in stringa hex #RRGGBB uppercase.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {string}
 */
function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(v => Math.round(clampByte(v)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Converte RGB (0–255) in HSL (h: 0–1, s: 0–1, l: 0–1).
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {[number, number, number]}
 */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else                h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

/**
 * Converte HSL (h: 0–1, s: 0–1, l: 0–1) in RGB (0–255).
 * @param {number} h
 * @param {number} s
 * @param {number} l
 * @returns {[number, number, number]}
 */
function hslToRgb(h, s, l) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1/3) * 255),
    Math.round(hue2rgb(p, q, h)       * 255),
    Math.round(hue2rgb(p, q, h - 1/3) * 255),
  ];
}

/** Helper for hslToRgb. */
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

/** Clamp a value to the 0–255 byte range. */
function clampByte(v) { return Math.max(0, Math.min(255, v)); }

/** Clamp a value to the 0–1 range. */
function clamp01(v) { return Math.max(0, Math.min(1, v)); }


/* =============================================================================
   3. Calcolo WCAG 2.2
   ============================================================================= */

/**
 * sRGB gamma expansion for a single channel (0–255 → linear 0–1).
 * Formula: IEC 61966-2-1 (sRGB)
 * @param {number} v  Valore canale 0–255
 * @returns {number}  Valore linearizzato 0–1
 */
function linearizeSRGB(v) {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

/**
 * Relative luminance as defined by WCAG 2.2 (W3C).
 * @param {number} r  0–255
 * @param {number} g  0–255
 * @param {number} b  0–255
 * @returns {number}  Luminanza relativa 0–1
 */
function getRelativeLuminance(r, g, b) {
  return 0.2126 * linearizeSRGB(r)
       + 0.7152 * linearizeSRGB(g)
       + 0.0722 * linearizeSRGB(b);
}

/**
 * WCAG 2.2 contrast ratio.
 * @param {number} l1  Luminanza relativa colore 1
 * @param {number} l2  Luminanza relativa colore 2
 * @returns {number}  Contrast ratio (1–21)
 */
function wcagContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}


/* =============================================================================
   4. Calcolo APCA-W3 0.1.9
   ============================================================================= */

/**
 * Calcola il valore Lc (Lightness Contrast) secondo APCA-W3 0.1.9.
 *
 * Positive values: dark text on light background (normal polarity).
 * Negative values: light text on dark background (reverse polarity).
 * The absolute value indicates contrast strength.
 *
 * Indicative thresholds (absolute value):
 *   ≥ 75 → body text
 *   ≥ 60 → large text
 *   ≥ 45 → very large text
 *   ≥ 30 → non-text elements
 *
 * @param {number} tR  Testo: rosso 0–255
 * @param {number} tG  Testo: verde 0–255
 * @param {number} tB  Testo: blu  0–255
 * @param {number} bR  Sfondo: rosso 0–255
 * @param {number} bG  Sfondo: verde 0–255
 * @param {number} bB  Sfondo: blu  0–255
 * @returns {number}  Valore Lc (tipicamente −108 … +106)
 */
function calcAPCA(tR, tG, tB, bR, bG, bB) {
  const { blackClamp, blackExp, normBg, normTxt, revBg, revTxt, scaleBoW, scaleWoB, loClamp } = APCA_CONSTANTS;

  const Ytxt = getRelativeLuminance(tR, tG, tB);
  const Ybg  = getRelativeLuminance(bR, bG, bB);

  // Soft clamp near black: corrects non-linear perception close to black
  const Ytc = Ytxt > blackClamp ? Ytxt : Ytxt + Math.pow(blackClamp - Ytxt, blackExp);
  const Ybc = Ybg  > blackClamp ? Ybg  : Ybg  + Math.pow(blackClamp - Ybg,  blackExp);

  let Sapc;
  if (Ybc >= Ytc) {
    // Polarità normale: testo scuro su sfondo chiaro
    Sapc = (Math.pow(Ybc, normBg) - Math.pow(Ytc, normTxt)) * scaleBoW;
  } else {
    // Polarità inversa: testo chiaro su sfondo scuro
    Sapc = (Math.pow(Ybc, revBg) - Math.pow(Ytc, revTxt)) * scaleWoB;
  }

  // Low-contrast clamp: values too close to zero are treated as 0
  if (Math.abs(Sapc) < loClamp) return 0;

  return Sapc * 100;
}


/* =============================================================================
   5. Suggestion engine
   ============================================================================= */

/**
 * Finds color variants near `txtColor` that meet accessibility thresholds
 * on `bgColor`.
 *
 * Strategy:
 *   1. Convert the color to HSL
 *   2. Sample lightness from 2% to 98% (step 1%), with original saturation and two reduced variants
 *   3. Compute WCAG and APCA for each candidate
 *   4. Group by compliance level
 *   5. Return the closest to the original, balanced between lighter and darker
 *
 * @param {{ r: number, g: number, b: number }} txtColor
 * @param {{ r: number, g: number, b: number }} bgColor
 * @returns {{ best: Suggestion[], good: Suggestion[], fair: Suggestion[] }}
 */
function suggestVariants(txtColor, bgColor) {
  const [h, s, origL] = rgbToHsl(txtColor.r, txtColor.g, txtColor.b);
  const Lbg = getRelativeLuminance(bgColor.r, bgColor.g, bgColor.b);

  const seen       = new Set();
  const candidates = [];

  for (let lPct = 2; lPct <= 98; lPct++) {
    const newL = lPct / 100;
    // Try original saturation + two slightly desaturated variants
    for (const sMult of [1, 0.85, 0.70]) {
      const sNew = clamp01(s * sMult);
      const [r, g, b] = hslToRgb(h, sNew, newL);
      const hex = rgbToHex(r, g, b);
      if (seen.has(hex)) continue;
      seen.add(hex);

      const wcag  = wcagContrastRatio(getRelativeLuminance(r, g, b), Lbg);
      const lc    = calcAPCA(r, g, b, bgColor.r, bgColor.g, bgColor.b);
      const lcAbs = Math.abs(lc);
      const lDiff = Math.abs(newL - origL);

      candidates.push({
        r, g, b, hex, wcag, lc, lcAbs, lDiff,
        lighter:     newL > origL,
        wcagAAA:     wcag >= WCAG.AAA_NORMAL,
        wcagAA:      wcag >= WCAG.AA_NORMAL,
        wcagAALarge: wcag >= WCAG.AA_LARGE,
        apcaBody:    lcAbs >= APCA_THRESHOLDS.BODY,
        apcaLarge:   lcAbs >= APCA_THRESHOLDS.LARGE,
        apcaXL:      lcAbs >= APCA_THRESHOLDS.XL,
      });
    }
  }

  // Group by compliance level (non-overlapping)
  const best = candidates.filter(c => c.wcagAAA && c.apcaBody);
  const good = candidates.filter(c => c.wcagAA  && c.apcaLarge && !(c.wcagAAA && c.apcaBody));
  const fair = candidates.filter(c => c.wcagAALarge && c.apcaXL  && !(c.wcagAA && c.apcaLarge));

  return {
    best: pickBalanced(best, 6),
    good: pickBalanced(good, 4),
    fair: pickBalanced(fair, 4),
  };
}

/**
 * Selects up to `n` candidates balanced between lighter and darker,
 * sorted by proximity to the original color.
 * @param {Suggestion[]} arr
 * @param {number} n
 * @returns {Suggestion[]}
 */
function pickBalanced(arr, n) {
  const half    = Math.ceil(n / 2);
  const lighter = arr.filter(c =>  c.lighter).sort((a, b) => a.lDiff - b.lDiff).slice(0, half);
  const darker  = arr.filter(c => !c.lighter).sort((a, b) => a.lDiff - b.lDiff).slice(0, half);
  return [...lighter, ...darker].sort((a, b) => a.lDiff - b.lDiff).slice(0, n);
}


/* =============================================================================
   6. Application state
   ============================================================================= */

/** @type {{ r: number, g: number, b: number }} */
let txtColor = { r: 243, g: 106, b: 111 };

/** @type {{ r: number, g: number, b: number }} */
let bgColor  = { r: 0,   g: 0,   b: 0   };


/* =============================================================================
   7. State setters — update state and sync inputs
   ============================================================================= */

/**
 * Sets the text color and syncs all related inputs.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function setTxtColor(r, g, b) {
  r = Math.round(clampByte(r));
  g = Math.round(clampByte(g));
  b = Math.round(clampByte(b));
  txtColor = { r, g, b };
  const hex = rgbToHex(r, g, b);
  document.getElementById('txtPicker').value = hex;
  document.getElementById('txtHex').value    = hex;
  document.getElementById('txtR').value = r;
  document.getElementById('txtG').value = g;
  document.getElementById('txtB').value = b;
}

/**
 * Sets the background color and syncs all related inputs.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 */
function setBgColor(r, g, b) {
  r = Math.round(clampByte(r));
  g = Math.round(clampByte(g));
  b = Math.round(clampByte(b));
  bgColor = { r, g, b };
  const hex = rgbToHex(r, g, b);
  document.getElementById('bgPicker').value = hex;
  document.getElementById('bgHex').value    = hex;
  document.getElementById('bgR').value = r;
  document.getElementById('bgG').value = g;
  document.getElementById('bgB').value = b;
}


/* =============================================================================
   8. Render functions
   ============================================================================= */

/** Re-renders the full UI with the current color state. */
function update() {
  const { r: tr, g: tg, b: tb } = txtColor;
  const { r: br, g: bg, b: bb } = bgColor;
  const txtHex = rgbToHex(tr, tg, tb);
  const bgHex  = rgbToHex(br, bg, bb);

  renderPreview(txtHex, bgHex);
  renderMetrics(tr, tg, tb, br, bg, bb);
  renderSuggestions();
}

/**
 * Updates the text preview.
 * @param {string} txtHex
 * @param {string} bgHex
 */
function renderPreview(txtHex, bgHex) {
  const box = document.getElementById('preview');
  box.style.background = bgHex;
  document.getElementById('previewNormal').style.color = txtHex;
  document.getElementById('previewLarge').style.color  = txtHex;
  box.setAttribute('aria-label',
    `Anteprima: testo ${txtHex} su sfondo ${bgHex}`);
}

/**
 * Updates the WCAG and APCA metric cards.
 */
function renderMetrics(tr, tg, tb, br, bg, bb) {
  const Ltxt = getRelativeLuminance(tr, tg, tb);
  const Lbg  = getRelativeLuminance(br, bg, bb);
  const cr   = wcagContrastRatio(Ltxt, Lbg);
  const lc   = calcAPCA(tr, tg, tb, br, bg, bb);
  const lcAbs = Math.abs(lc);

  // — WCAG —
  document.getElementById('wcagVal').textContent = cr.toFixed(2) + ':1';
  renderBadges('wcagBadges', [
    { label: 'AA normal text', pass: cr >= WCAG.AA_NORMAL   },
    { label: 'AA large text',  pass: cr >= WCAG.AA_LARGE    },
    { label: 'AAA normal',     pass: cr >= WCAG.AAA_NORMAL  },
    { label: 'AAA large',      pass: cr >= WCAG.AAA_LARGE   },
  ]);

  // — APCA —
  const lcSign = lc >= 0 ? '+' : '';
  document.getElementById('apcaVal').textContent = `Lc ${lcSign}${lc.toFixed(1)}`;
  renderBadges('apcaBadges', [
    { label: 'Lc 75 — body text',       pass: lcAbs >= APCA_THRESHOLDS.BODY  },
    { label: 'Lc 60 — large text',      pass: lcAbs >= APCA_THRESHOLDS.LARGE },
    { label: 'Lc 45 — very large text', pass: lcAbs >= APCA_THRESHOLDS.XL   },
    { label: 'Lc 30 — non-text',        pass: lcAbs >= APCA_THRESHOLDS.UI   },
  ]);

  // ── Nota divergenza ──
  renderDivergenceNote(cr, lcAbs);
}

/**
 * Populates a badge container with pass/fail items.
 * @param {string} containerId
 * @param {Array<{ label: string, pass: boolean }>} items
 */
function renderBadges(containerId, items) {
  const el = document.getElementById(containerId);
  el.innerHTML = '';
  items.forEach(({ label, pass }) => {
    const badge = document.createElement('span');
    badge.className = `badge ${pass ? 'badge-pass' : 'badge-fail'}`;
    badge.textContent = (pass ? '✓ ' : '✗ ') + label;
    el.appendChild(badge);
  });
}

/**
 * Shows or hides the WCAG/APCA divergence note.
 * @param {number} cr   Rapporto WCAG
 * @param {number} lcAbs  Valore Lc assoluto
 */
function renderDivergenceNote(cr, lcAbs) {
  const el   = document.getElementById('divergenceNote');
  const wcagAA  = cr >= WCAG.AA_NORMAL;
  const apcaBody = lcAbs >= APCA_THRESHOLDS.BODY;

  if (wcagAA && !apcaBody) {
    el.textContent = '⚠ Algorithm divergence: this combination passes WCAG 2.2 AA '
      + `(${cr.toFixed(2)}:1) but does not reach the APCA body text threshold (Lc ${lcAbs.toFixed(1)}, threshold 75). `
      + 'APCA detects insufficient perceived contrast despite WCAG conformance. '
      + 'Consider the conformant variants below.';
    el.removeAttribute('hidden');
  } else if (!wcagAA && apcaBody) {
    el.textContent = '⚠ Algorithm divergence: does not pass WCAG 2.2 AA '
      + `(${cr.toFixed(2)}:1) but APCA considers the contrast adequate for body text (Lc ${lcAbs.toFixed(1)}). `
      + 'This can occur with high-chroma colors. For current legal compliance, WCAG is the normative reference.';
    el.removeAttribute('hidden');
  } else {
    el.setAttribute('hidden', '');
  }
}

/**
 * Generates and renders the conformant color variants.
 */
function renderSuggestions() {
  const { best, good, fair } = suggestVariants(txtColor, bgColor);
  const container = document.getElementById('suggestionsContent');

  if (!best.length && !good.length && !fair.length) {
    container.innerHTML = '<p class="no-suggestions">No conformant variants found for this hue. Try adjusting the color.</p>';
    return;
  }

  const groups = [
    { variants: best, label: 'WCAG AAA + APCA Lc 75 — body text' },
    { variants: good, label: 'WCAG AA + APCA Lc 60 — large text' },
    { variants: fair, label: 'WCAG AA (large) + APCA Lc 45 — very large text' },
  ].filter(g => g.variants.length > 0);

  container.innerHTML = groups.map(({ variants, label }) => `
    <div class="suggestion-group">
      <div class="group-label">${label}</div>
      <div class="swatches-row">
        ${variants.map(buildSwatchHTML).join('')}
      </div>
    </div>
  `).join('');

  // Collega click handler a ogni swatch
  container.querySelectorAll('.swatch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rgb = hexToRgb(btn.dataset.hex);
      if (rgb) { setTxtColor(rgb.r, rgb.g, rgb.b); update(); }
    });
  });
}

/**
 * Builds the HTML string for a single color swatch button.
 * @param {Suggestion} c
 * @returns {string}
 */
function buildSwatchHTML(c) {
  const wcagLabel = c.wcagAAA ? 'AAA' : c.wcagAA ? 'AA' : 'no AA';
  const wcagClass = c.wcagAAA ? 'badge-pass' : c.wcagAA ? 'badge-warn' : 'badge-fail';
  const apcaLabel = `Lc${Math.round(c.lcAbs)}`;
  const apcaClass = c.apcaBody ? 'badge-pass' : c.apcaLarge ? 'badge-warn' : 'badge-fail';

  const ariaLabel = `Apply ${c.hex} — ${c.wcag.toFixed(1)}:1, ${wcagLabel}, Lc ${Math.round(c.lcAbs)}`;

  return `
    <button
      type="button"
      class="swatch-btn"
      data-hex="${c.hex}"
      aria-label="${ariaLabel}"
    >
      <span class="swatch-preview" style="background:${c.hex};" aria-hidden="true"></span>
      <span class="swatch-hex">${c.hex}</span>
      <span class="swatch-ratio">${c.wcag.toFixed(1)}:1</span>
      <span class="swatch-badges" aria-hidden="true">
        <span class="swatch-badge ${wcagClass}">${wcagLabel}</span>
        <span class="swatch-badge ${apcaClass}">${apcaLabel}</span>
      </span>
    </button>
  `;
}


/* =============================================================================
   9. Event listeners
   ============================================================================= */

/** Wires all event listeners to input elements. */
function bindInputs() {

  // — Text color inputs —

  document.getElementById('txtPicker').addEventListener('input', e => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) { setTxtColor(rgb.r, rgb.g, rgb.b); update(); }
  });

  document.getElementById('txtHex').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      if (rgb) { setTxtColor(rgb.r, rgb.g, rgb.b); update(); }
    }
  });

  ['txtR', 'txtG', 'txtB'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const r = parseInt(document.getElementById('txtR').value, 10) || 0;
      const g = parseInt(document.getElementById('txtG').value, 10) || 0;
      const b = parseInt(document.getElementById('txtB').value, 10) || 0;
      setTxtColor(r, g, b);
      update();
    });
  });

  // — Background color inputs —

  document.getElementById('bgPicker').addEventListener('input', e => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) { setBgColor(rgb.r, rgb.g, rgb.b); update(); }
  });

  document.getElementById('bgHex').addEventListener('input', e => {
    const val = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const rgb = hexToRgb(val);
      if (rgb) { setBgColor(rgb.r, rgb.g, rgb.b); update(); }
    }
  });

  ['bgR', 'bgG', 'bgB'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      const r = parseInt(document.getElementById('bgR').value, 10) || 0;
      const g = parseInt(document.getElementById('bgG').value, 10) || 0;
      const b = parseInt(document.getElementById('bgB').value, 10) || 0;
      setBgColor(r, g, b);
      update();
    });
  });

  // — Swap button —

  document.getElementById('swapBtn').addEventListener('click', () => {
    const prevTxt = { ...txtColor };
    const prevBg  = { ...bgColor  };
    setTxtColor(prevBg.r,  prevBg.g,  prevBg.b);
    setBgColor (prevTxt.r, prevTxt.g, prevTxt.b);
    update();
  });
}


/* =============================================================================
   10. Init
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  bindInputs();
  update();
});
