import { Checkbox, Label } from "web";

/** Rule checkboxes — the trading-rules form rows. */
export const RuleRows = () => (
  <div className="max-w-md space-y-4 bg-background p-6">
    <div className="flex items-center gap-3">
      <Checkbox id="r1" defaultChecked />
      <Label htmlFor="r1">Max daily loss 2%</Label>
    </div>
    <div className="flex items-center gap-3">
      <Checkbox id="r2" defaultChecked />
      <Label htmlFor="r2">Max 3 trades per day</Label>
    </div>
    <div className="flex items-center gap-3">
      <Checkbox id="r3" />
      <Label htmlFor="r3">Session hours only</Label>
    </div>
    <div className="flex items-center gap-3">
      <Checkbox id="r4" disabled />
      <Label htmlFor="r4" className="text-muted-foreground">
        No revenge trading (locked during period)
      </Label>
    </div>
  </div>
);
