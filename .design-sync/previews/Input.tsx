import { Input, Label } from "web";

/** Stake & terms inputs — the create-commitment form voice. */
export const FormFields = () => (
  <div className="grid max-w-lg grid-cols-3 gap-3 bg-background p-6">
    <div className="space-y-2">
      <Label htmlFor="stake">Stake (MON)</Label>
      <Input id="stake" type="number" defaultValue="1" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="duration">Duration (days)</Label>
      <Input id="duration" type="number" defaultValue="14" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="slash">Slash (%)</Label>
      <Input id="slash" type="number" defaultValue="10" />
    </div>
  </div>
);

/** Address input — mono, full width, the beneficiary field. */
export const AddressField = () => (
  <div className="max-w-lg space-y-2 bg-background p-6">
    <Label htmlFor="beneficiary">Beneficiary of slashed stake</Label>
    <Input
      id="beneficiary"
      className="font-mono text-xs"
      defaultValue="0x000000000000000000000000000000000000dEaD"
    />
    <p className="text-xs text-muted-foreground">
      Default is the burn address — slashed MON is destroyed.
    </p>
  </div>
);

export const States = () => (
  <div className="max-w-sm space-y-3 bg-background p-6">
    <Input placeholder="0.0 MON" />
    <Input defaultValue="2.5" />
    <Input disabled defaultValue="Confirm in wallet…" />
    <Input aria-invalid defaultValue="1e19" />
  </div>
);
