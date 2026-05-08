# Hedron Contrast Checker

> WCAG 2.2 AA/AAA · APCA · Divergence detection · Conformant color suggestions · Zero dependencies · No build step

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2-green)](https://www.w3.org/TR/WCAG22/)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#)
[![Live demo](https://img.shields.io/badge/demo-online-orange)](https://contrastchecker.hedron.it)

A clean, accessible, dependency-free color contrast checker supporting both **WCAG 2.2** and **APCA-W3 0.1.9**.

**[→ Live demo](https://contrastchecker.hedron.it)**

---

## Why this tool?

Testing color contrast for web accessibility compliance typically requires juggling multiple tools: one for WCAG ratios, another for APCA values, and yet another to find a fix when colors fail. Hedron Contrast Checker combines all of this in a single, self-contained file: no installation, no account, no tracking.

It also addresses a blind spot in WCAG-only workflows: saturated colors that pass the WCAG luminance ratio but are still difficult to read in practice. By showing both WCAG and APCA results side by side and flagging divergences, it helps designers make more informed, accessible color decisions.

---

## Features

- **Dual standard evaluation**: WCAG 2.2 (AA / AAA) and APCA Lightness Contrast (Lc), side by side
- **Flexible color input**: HEX, RGB fields, and native color picker, all synced in real time
- **Divergence detection**: highlights cases where WCAG and APCA disagree (e.g. saturated colors on dark backgrounds that pass WCAG but fail APCA)
- **Conformant variants**: suggests nearby colors (same hue, adjusted lightness) that meet accessibility thresholds, grouped by compliance level
- **Swap button**: instantly reverses text and background colors to check both polarities
- **Dark mode**: respects `prefers-color-scheme`
- **Fully accessible**: semantic HTML, ARIA landmarks, `aria-live` regions, keyboard navigation, visible focus rings, skip link
- **Zero dependencies**: single HTML + CSS + JS, no build step, no frameworks, no tracking

---

## WCAG vs APCA. Why both?

WCAG 2.x measures contrast using a **luminance ratio** only. This can produce misleading results for saturated colors: a vivid red on black may pass WCAG AA with a ratio of 5.25:1, yet remain hard to read due to chromatic aberration and reduced perceived contrast for users with color vision deficiencies.

**APCA** (Advanced Perceptual Contrast Algorithm) accounts for perceived lightness, text polarity (dark-on-light vs light-on-dark), and is more accurate for chromatic colors. Lc values map directly to font size and weight thresholds.

| Lc value | Use case |
|---|---|
| ≥ 75 | Body text (≥ 16px / ≥ 14px bold) |
| ≥ 60 | Large text (≥ 24px / ≥ 18px bold) |
| ≥ 45 | Very large text (≥ 36px) |
| ≥ 30 | Non-text elements (icons, borders) |

---

## Project structure

```
hedron-contrast-checker/
├── index.html   — semantic HTML with ARIA attributes
├── style.css    — CSS custom properties, dark mode, print styles
├── script.js    — color math, WCAG & APCA algorithms, suggestion engine
├── LICENSE      — GPL v3
└── README.md
```

---

## Running locally

No build step required. Just open `index.html` in a browser:

```bash
git clone https://github.com/hedronit/hedron-contrast-checker.git
cd hedron-contrast-checker
open index.html   # macOS
# or: xdg-open index.html (Linux) / start index.html (Windows)
```

For a local dev server (avoids font CORS on some browsers):

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## Deploying to GitHub Pages

1. Push the repo to GitHub (ensure `index.html` is at the root of the branch)
2. Go to **Settings → Pages**
3. Under *Source*, select **Deploy from a branch**
4. Choose branch `main` (or `master`), folder `/root`
5. Click **Save**, the site will be live at `https://<your-username>.github.io/hedron-contrast-checker` within a minute

---

## Contributing

Contributions are welcome. Please open an issue before submitting a large PR so we can discuss the approach first.

### Branching workflow

`main` is always production: it is what GitHub Pages serves. **Never push directly to `main`.**

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or for fixes:
   git checkout -b fix/your-fix-name
   ```
3. Make your changes and commit with a clear message
4. Push your branch and open a **Pull Request** against `main`
5. The PR will be reviewed before merging

### Good first contributions

- Add URL params so contrast pairs can be shared via link (`?txt=F36A6F&bg=000000`)
- Add a copy-to-clipboard button on each suggested swatch
- Add a "check foreground" / "check background" toggle for the suggestion engine
- Improve the APCA suggestion engine with font-size-aware thresholds
- Add OKLCH color input support
- Translations

### Before submitting a PR

- Keep the zero-dependency constraint (no npm, no bundler)
- Ensure keyboard navigation still works end-to-end
- Test in both light and dark mode
- Run the HTML through the [W3C validator](https://validator.w3.org/)

---

## Algorithms

| Algorithm | Version | Reference |
|---|---|---|
| WCAG 2.2 contrast ratio | W3C Recommendation, Dec 2024 | [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/) |
| APCA-W3 | 0.1.9 (Bronze) | [github.com/Myndex/SAPC-APCA](https://github.com/Myndex/SAPC-APCA) |

APCA is an experimental algorithm. It is not yet a W3C standard. Do not rely on it alone for legal accessibility compliance. Use WCAG 2.2 as the normative reference.

### Note on APCA implementation
 
The APCA contrast calculation in this project is an independent implementation based on the publicly available APCA-W3 0.1.9 specification. No code from the [SAPC-APCA](https://github.com/Myndex/SAPC-APCA) or [apca-w3](https://github.com/Myndex/apca-w3) repositories was copied or incorporated.
 
"APCA" and "Advanced Perceptual Contrast Algorithm" are trademarks of Myndex Research and Andrew Somers. Use of these terms here refers strictly to a compliant implementation of the algorithm as defined for web content accessibility purposes.

---

## License

GPL v3 © [Hedron](https://hedron.it)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. Derivative works must be distributed under the same license.
