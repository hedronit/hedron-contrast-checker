# Hedron Contrast Checker

A clean, accessible, dependency-free color contrast checker supporting both **WCAG 2.2** and **APCA-W3 0.1.9**.

**[→ Live demo](https://contrastchecker.hedron.it)**

---

## Features

- **Dual standard evaluation** — WCAG 2.2 (AA / AAA) and APCA Lightness Contrast (Lc), side by side
- **Flexible color input** — HEX, RGB fields, and native color picker, all synced in real time
- **Divergence detection** — highlights cases where WCAG and APCA disagree (e.g. saturated colors on dark backgrounds that pass WCAG but fail APCA)
- **Conformant variants** — suggests nearby colors (same hue, adjusted lightness) that meet accessibility thresholds, grouped by compliance level
- **Swap button** — instantly reverses text and background colors to check both polarities
- **Dark mode** — respects `prefers-color-scheme`
- **Fully accessible** — semantic HTML, ARIA landmarks, `aria-live` regions, keyboard navigation, visible focus rings, skip link
- **Zero dependencies** — single HTML + CSS + JS, no build step, no frameworks, no tracking

---

## WCAG vs APCA — why both?

WCAG 2.x measures contrast using a **luminance ratio** only. This can produce misleading results for saturated colors: a vivid red on black may pass WCAG AA with a ratio of 5.25:1, yet remain hard to read due to chromatic aberration and reduced perceived contrast for users with color vision deficiencies.

**APCA** (Advanced Perceptual Contrast Algorithm) is the candidate algorithm for WCAG 3.0. It accounts for perceived lightness, text polarity (dark-on-light vs light-on-dark), and is more accurate for chromatic colors. Lc values map directly to font size and weight thresholds.

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
├── LICENSE      — MIT
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
5. Click **Save** — the site will be live at `https://<your-username>.github.io/hedron-contrast-checker` within a minute

---

## Contributing

Contributions are welcome. Please open an issue before submitting a large PR so we can discuss the approach first.

### Branching workflow

`main` is always production — it is what GitHub Pages serves. **Never push directly to `main`.**

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
- Translations (currently Italian UI, English code comments)

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

APCA is an experimental algorithm. It is not yet a W3C standard. Do not rely on it alone for legal accessibility compliance — use WCAG 2.2 as the normative reference.

---

## License

GPL v3 © [Hedron](https://hedron.it)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. Derivative works must be distributed under the same license.
