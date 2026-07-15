# Design — Vaultline · Night Desk

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

Route: custom (tuned) · vibe: "phosphor terminal, Monad-native, late-night austere"
Axes: dark / mono / cool (Monad purple ~284°)
Revision 2 (2026-07-14, user reference image): darker near-black canvas, phosphor
glow on identity elements only, filled purple pill CTAs, floating pill nav,
`> ` prompt-prefix copy voice. Structure unchanged.

## Genre

atmospheric — dark canvas, tool used after dark. One ambient bloom allowed,
elevated panels instead of hairline-on-paper, fade-in-only motion.

## Macrostructure family

- App pages (`/`, `/dashboard`): Workbench — data-first panels, no hero,
  the instrument IS the page. Varies only in panel composition.
- Public page (`/v/[address]`): Statement-led — one huge mono stat (the streak)
  as the hero, the calendar as centerpiece, a single closing statement line.
- No marketing pages exist. App pages MUST NOT use enrichment.

## Theme

All colours OKLCH, everything tinted toward the Monad purple anchor (~284–290°).
Brand sources: monad.xyz/brand-and-media-kit (#0E091C navy, #6E54FF purple).

- `--color-paper`      oklch(13%   0.035 293)  — near-black, purple-tinted (rev 2)
- `--color-paper-2`    oklch(16.5% 0.04  293)  — elevated panel
- `--color-paper-3`    oklch(20%   0.04  293)  — highest elevation (popover/input)
- `--color-ink`        oklch(94%   0.015 290)
- `--color-ink-2`      oklch(86%   0.02  290)
- `--color-muted`      oklch(68%   0.03  290)
- `--color-rule`       oklch(30%   0.05  290)
- `--color-accent`     oklch(55.7% 0.213 284)  — exact brand purple #6E54FF
- `--color-accent-text` oklch(72%  0.15  285)  — small purple text on paper (≥4.5:1)
- `--color-focus`      oklch(62%   0.22  284)
- `--color-compliant`  oklch(65%   0.13  155)  — semantic green, never decorative
- `--color-violated`   oklch(55%   0.19  25)   — semantic red, never decorative

Accent discipline: purple occupies ≤5% of any viewport — focus rings, active
states, the wordmark tick, one bordered CTA, the today-ring. Never a fill on
large surfaces. Compliance green/red appear ONLY on compliance semantics.

## Typography

- Display: Roboto Mono, weight 700, style normal — headings, stats, wordmark.
  The brand's own technical font AS the terminal voice; mono-display is the
  deliberate single-register design choice (terminal exception).
- Body: Geist, weight 400.
- Mono (data, labels, hashes, buttons): Roboto Mono 400/500.
- Two families total. No italics anywhere in headings.
- Display tracking: -0.02em. Label tracking: 0.08–0.14em uppercase.
- Tabular numbers on all data: `font-variant-numeric: tabular-nums`.

## Spacing

4-point scale via Tailwind defaults. Panels use uneven vertical rhythm —
never every section padded the same.

## Motion

- Easing: cubic-bezier(0.16, 1, 0.3, 1) (`--ease-out`) only.
- Reveal: ONE orchestrated fade-in on page load (350ms, opacity only).
  Nothing animates on scroll. Focus rings appear instantly.
- Reduced-motion: entrance collapses to instant.

## Microinteractions stance

- Silent success where the result is visible; status lines for tx lifecycle.
- No celebratory toasts. No hover-scale. One signal per element.

## CTA voice (rev 2)

- Primary CTA: FILLED brand-purple pill (`rounded-full`), mono uppercase
  tracking-wide, subtle phosphor glow. One per view.
- Secondary CTA: outlined pill, accent-text label.
- Semantic actions: compliant (green) / violated (red) filled pills, dark ink text.
- Destructive confirms: dialog with exact cost stated in MON.

## Phosphor glow (rev 2)

Glow lives on IDENTITY elements only: the wordmark, the public streak hero,
the primary CTA, and the calendar today-ring. Defined as tokens
(`--glow-text`, `--glow-box`) — never inline shadows, never on cards or
panels (elevation stays lightness-based).

## Copy voice (rev 2)

Taglines and section descriptions may carry a `> ` terminal-prompt prefix.
Cap: one per view region. Body copy inside panels stays plain.

## What pages MUST share

- The wordmark (`▮ VAULTLINE`, mono 700, accent tick).
- The palette above, the two fonts, the CTA voice, the panel language.
- The edge-aligned minimal nav and single-line colophon footer.

## What pages MAY differ on

- Panel composition within Workbench (form panels vs. data panels).
- The public page's statement-led hero (streak stat) — app pages never
  use a hero.

## Exports

### shadcn/ui CSS variables (the app's live mapping — web/app/globals.css)

```css
.dark {
  --background: oklch(0.155 0.045 290);
  --foreground: oklch(0.94 0.015 290);
  --card: oklch(0.19 0.045 290);
  --card-foreground: oklch(0.94 0.015 290);
  --popover: oklch(0.21 0.045 290);
  --popover-foreground: oklch(0.94 0.015 290);
  --primary: oklch(0.557 0.213 284);
  --primary-foreground: oklch(0.97 0.01 290);
  --secondary: oklch(0.23 0.045 290);
  --secondary-foreground: oklch(0.86 0.02 290);
  --muted: oklch(0.21 0.04 290);
  --muted-foreground: oklch(0.68 0.03 290);
  --accent: oklch(0.23 0.05 288);
  --accent-foreground: oklch(0.86 0.02 290);
  --destructive: oklch(0.55 0.19 25);
  --border: oklch(0.30 0.05 290);
  --input: oklch(0.33 0.05 290);
  --ring: oklch(0.557 0.213 284);
  --compliant: oklch(0.65 0.13 155);
  --violated: oklch(0.55 0.19 25);
  --accent-text: oklch(0.72 0.15 285);
}
```
