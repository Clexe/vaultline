import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "web";

/** The workbench panel voice — text-heavy, data-first (design.md · Workbench). */
export const CommitmentPanel = () => (
  <div className="max-w-md bg-background p-6">
    <Card>
      <CardHeader>
        <CardTitle>Trading rules</CardTitle>
        <CardDescription>
          Serialized to canonical JSON and hashed client-side — only the keccak256
          goes onchain. Keep the plaintext; it is your proof of what you committed to.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">Max daily loss 2% · Max 3 trades per day</p>
        <p className="text-sm">Session hours only · No revenge trading</p>
        <p className="break-all rounded bg-muted/40 p-2 font-mono text-xs text-muted-foreground">
          0x4590bafcde6ec3b9e228710b33e66d23bce5ad83f88d21005e3b321069416a6d
        </p>
      </CardContent>
    </Card>
  </div>
);

/** Blotter cell composition — mono label over tabular value. */
export const BlotterCells = () => (
  <div className="max-w-lg bg-background p-6">
    <div className="grid grid-cols-2 rounded-md bg-card">
      {[
        ["Stake remaining", "8.1 MON"],
        ["Total slashed", "1.9 MON"],
        ["Current streak", "6d"],
        ["Days left", "8"],
      ].map(([label, value], i) => (
        <div key={label} className={`px-4 py-4 ${i % 2 === 1 ? "border-l border-border/60" : ""} ${i > 1 ? "border-t border-border/60" : ""}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-mono text-xl font-bold tabular-nums">{value}</p>
        </div>
      ))}
    </div>
  </div>
);

export const WithAction = () => (
  <div className="max-w-md bg-background p-6">
    <Card>
      <CardHeader>
        <CardTitle>Commitment complete</CardTitle>
        <CardDescription>The period is over. Withdraw whatever stake survived.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full border-primary font-mono text-xs uppercase tracking-[0.1em] text-accent-text hover:bg-primary/10"
        >
          Withdraw 8.1 MON
        </Button>
      </CardContent>
    </Card>
  </div>
);
