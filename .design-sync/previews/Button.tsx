import { Button } from "web";

/** Night Desk CTA voice — accent-bordered mono primary (design.md · CTA voice). */
export const PrimaryCTA = () => (
  <div className="flex flex-col gap-3 bg-background p-6">
    <Button
      variant="outline"
      size="lg"
      className="border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10"
    >
      Stake 1 MON for 14 days
    </Button>
    <Button
      variant="outline"
      className="border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10"
    >
      Withdraw 0.5 MON
    </Button>
  </div>
);

/** Semantic actions — compliance reporting, the only filled buttons in the system. */
export const SemanticActions = () => (
  <div className="flex gap-3 bg-background p-6">
    <Button className="flex-1 bg-compliant font-mono text-xs uppercase tracking-[0.1em] text-background hover:bg-compliant/85">
      Compliant — rules held
    </Button>
    <Button className="flex-1 bg-violated font-mono text-xs uppercase tracking-[0.1em] text-background hover:bg-violated/85">
      Violated
    </Button>
  </div>
);

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3 bg-background p-6">
    <Button>Default</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="destructive">Slash stake</Button>
    <Button variant="secondary">Secondary</Button>
  </div>
);

export const SizesAndStates = () => (
  <div className="flex flex-wrap items-center gap-3 bg-background p-6">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button disabled>Confirm in wallet…</Button>
  </div>
);
