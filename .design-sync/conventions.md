# Vaultline · Night Desk — build conventions

Vaultline is an onchain trading-accountability app on Monad: dark terminal aesthetic, Monad-brand navy + purple. The locked system is "Night Desk" (dark / mono / cool). Build every screen dark — there is no light mode.

## Setup

No provider is required — components style themselves from CSS custom properties defined at `:root` in `styles.css`. Give every design a page root with `bg-background text-foreground min-h-screen`; without `bg-background` the canvas is transparent.

## Styling idiom — Tailwind utilities over CSS variables

Style with Tailwind classes that resolve the system's tokens. The token vocabulary (all defined in `styles.css`):

| Family | Classes | Use |
|---|---|---|
| Surfaces | `bg-background` `bg-card` `bg-popover` `bg-muted` `bg-secondary` | page canvas → elevated panels (elevation = lighter, never shadows) |
| Text | `text-foreground` `text-muted-foreground` `text-accent-text` | body → secondary → small purple labels |
| Brand accent | `border-primary` `ring-primary` `text-accent-text` `bg-primary` | Monad purple; keep to ≤5% of a view — focus rings, active states, one bordered CTA. Never large fills. |
| Semantics | `bg-compliant` `text-compliant` `bg-violated` `text-violated` `bg-destructive` | green = compliant days ONLY, red = violations/slashing ONLY — never decorative |
| Rules | `border-border` (`border-border/60` for in-panel dividers) | hairlines between data cells |

## Typography

Two families, already loaded via `@font-face` in `fonts/`:
- `font-mono` (Roboto Mono) — ALL headings, stats, numbers, hashes, addresses, buttons, micro-labels. This is the display face; the terminal register is the design.
- Geist (body) — inherited by default from the page root; there is no `font-sans` utility in the shipped CSS, so never write one. Plain text is already Geist; add `font-mono` only where the terminal register applies.

Recurring patterns:
- Micro-label: `font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground`
- Stat value: `font-mono text-xl font-bold tabular-nums`
- Heading: `font-mono font-bold tracking-[-0.02em]`
- Address/hash: `font-mono text-xs break-all text-muted-foreground`

## CTA voice

- Primary action: `<Button variant="outline" className="border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10">Stake 1 MON</Button>` — bordered accent, never a purple slab.
- Semantic pair: compliant green fill / violated red fill, both `font-mono text-xs uppercase tracking-[0.1em] text-background`.

## Where the truth lives

Read `styles.css` (tokens at `:root`) before styling. Per-component API + composed examples: `components/general/<Name>/<Name>.prompt.md`. Numbers always get `tabular-nums`.

## Idiomatic snippet — a blotter panel with a CTA

```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } = window.Vaultline;

<div className="min-h-screen bg-background p-6 text-foreground">
  <Card className="max-w-md">
    <CardHeader>
      <CardTitle>Commitment complete</CardTitle>
      <CardDescription>The period is over. Withdraw whatever stake survived.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Stake remaining</p>
        <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">8.1 MON</p>
      </div>
      <Button variant="outline" className="w-full border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10">
        Withdraw 8.1 MON
      </Button>
    </CardContent>
  </Card>
</div>
```
