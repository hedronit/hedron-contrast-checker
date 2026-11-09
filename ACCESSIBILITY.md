# Accessibility

Hedron Contrast Checker is a tool for accessibility work, so it has to be usable by the people who do that work, including people who use a keyboard, a screen reader, zoom or high-contrast settings. This page explains what we aim for, what we know does not work well yet, and how to tell us when something gets in your way.

## Priorities

1. Every input and every result can be reached and used with a keyboard alone.
2. Results are available as text, not only as colour: pass and fail are written out (✓ / ✗ plus the level), and every suggested colour has a text label with its hex value, ratio and level.
3. The page works in light and dark mode, on small screens and when zoomed.
4. The tool itself meets WCAG 2.2 level AA. WCAG 2.2 is the normative reference; APCA results are shown for information only.

## What is in place

- Semantic HTML: landmarks, fieldsets and legends for the two colours, a captioned reference table.
- A skip link to the results.
- Three ways to enter each colour: native colour picker, hex field and RGB fields. You never have to use the visual picker.
- Visible focus indicators on interactive elements.
- One live region that announces a short summary of the results once you stop typing.
- An error message when a hex value is not valid.
- Dark mode based on `prefers-color-scheme`.
- No dependencies, no tracking, no account. All calculations run in your browser.

## Supported environments

We aim to support current versions of Chrome, Edge, Firefox and Safari on desktop and mobile.

Assistive technology we have tested with (November 2026): VoiceOver with Chrome on macOS, and NVDA with Chrome on Windows.

The native colour picker looks and behaves differently in each browser and operating system, and some versions are hard to use with assistive technology. The hex and RGB fields are always available as an alternative.

## Known barriers

We are not aware of open barriers at the moment. That does not mean there are none: if something gets in your way, please tell us.

Fixed in November 2026, when we wrote this statement:

- Screen readers could hear long or repeated announcements while typing, because the results area contained several nested live regions. There is now one live region, with a short summary announced once you stop typing.
- Keyboard focus was lost after applying a suggested colour. It now stays on the swatch, or moves to the text colour field.
- The accessible name of the preview area was in Italian on an English page.
- The borders of the hex and RGB fields had a contrast of about 1.2:1. They now reach at least 3:1 in light and dark mode (WCAG 2.2, 1.4.11).
- An invalid hex value gave no feedback. A message now explains the expected format, and #RGB values and values without # are accepted.

## Reporting a barrier

You can report a barrier in either of these ways:

- Open an issue on GitHub and add the `accessibility` label: <https://github.com/hedronit/hedron-contrast-checker/issues/new>
- If you prefer not to use GitHub, write to us through <https://hedron.it/contatti> and mention "Contrast Checker" in your message.

Tell us what you were trying to do and what happened. If you can, include your browser and any assistive technology you use. You do not need to tell us about any disability, and you do not need to send screenshots or recordings.

## What happens next

- We reply to every report within 30 days, with what we found, a workaround if there is one, and whether and when we plan a fix.
- When a fix is released, we let you know and, if you wish, ask you to check that it works for you.

## Contributing

The checks in the [README](README.md#before-submitting-a-pr) apply to every pull request. In particular:

- Keyboard navigation must still work from start to end.
- Changes to inputs, results, live regions or suggestions must be checked with at least one screen reader.
- New colours in the interface must meet WCAG 2.2 AA in both light and dark mode. You can check them with the tool itself.
- Keep pass/fail information available as text, not only as colour.

Code written with AI coding assistants follows the same rules and is reviewed by a person before merging.

## Ownership and maintenance

This statement is maintained by the Hedron accessibility team, the code owners listed in [CODEOWNERS](.github/CODEOWNERS). We review it whenever we change how the tool works, and at least once a year.

Last reviewed: November 2026.
