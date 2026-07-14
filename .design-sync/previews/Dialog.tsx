import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "web";

/** The violation confirm — the one place the app demands friction, with the
 *  exact cost stated in MON (design.md · CTA voice). Rendered open. */
export const ViolationConfirm = () => (
  <Dialog open>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Report a violation</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-2 pt-2">
            <p>
              Reporting today as violated will slash{" "}
              <span className="font-mono text-foreground">0.81 MON</span> (10% of
              remaining stake) and reset your streak to zero.
            </p>
            <p className="text-muted-foreground">
              Honesty is the entire point. Confirm it, take the hit, trade better
              tomorrow.
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost">Cancel</Button>
        <Button className="bg-violated font-mono text-xs uppercase tracking-[0.1em] text-background hover:bg-violated/85">
          Confirm violation — slash 0.81 MON
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
