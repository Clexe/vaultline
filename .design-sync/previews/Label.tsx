import { Input, Label } from "web";

/** Labels always compose with a control — shown in their working context. */
export const WithControl = () => (
  <div className="max-w-sm space-y-2 bg-background p-6">
    <Label htmlFor="stake-l">Stake (MON)</Label>
    <Input id="stake-l" type="number" defaultValue="1" />
  </div>
);

/** The blotter label voice — mono uppercase micro-labels over data. */
export const DataLabel = () => (
  <div className="max-w-sm bg-background p-6">
    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
      Stake remaining
    </p>
    <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">8.1 MON</p>
  </div>
);
