import { Label, Textarea } from "web";

/** Free-text rules — placeholder and filled states. */
export const FreeTextRules = () => (
  <div className="max-w-md space-y-2 bg-background p-6">
    <Label htmlFor="custom">Additional rules (free text)</Label>
    <Textarea id="custom" placeholder="e.g. no trades within 15 minutes of red-folder news" />
  </div>
);

export const Filled = () => (
  <div className="max-w-md space-y-2 bg-background p-6">
    <Label htmlFor="custom-f">Additional rules (free text)</Label>
    <Textarea
      id="custom-f"
      defaultValue="No trades within 15 minutes of red-folder news. Flat over the weekend. One re-entry maximum per setup."
    />
  </div>
);
