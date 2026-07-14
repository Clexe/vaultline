import { Separator } from "web";

/** Horizontal — between form sections inside a panel. */
export const InPanel = () => (
  <div className="max-w-md space-y-4 bg-background p-6">
    <p className="text-sm">Rules serialize to canonical JSON, hashed client-side.</p>
    <Separator />
    <p className="break-all font-mono text-xs text-muted-foreground">
      rules hash: 0x4590bafc…9416a6d
    </p>
  </div>
);

/** Vertical — between blotter cells. */
export const VerticalInRow = () => (
  <div className="flex h-16 items-center gap-4 bg-background p-6">
    <span className="font-mono text-sm font-bold tabular-nums">6d streak</span>
    <Separator orientation="vertical" />
    <span className="font-mono text-sm font-bold tabular-nums">8 days left</span>
    <Separator orientation="vertical" />
    <span className="font-mono text-sm font-bold tabular-nums">8.1 MON</span>
  </div>
);
