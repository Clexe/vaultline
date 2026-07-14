import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
} from "viem";

/** Human-readable copies of AccountabilityVault's custom errors. */
const CUSTOM_ERROR_MESSAGES: Record<string, string> = {
  StakeRequired: "Stake must be greater than zero.",
  CommitmentAlreadyActive: "This address already has an active commitment.",
  SlashBpsTooHigh: "Slash percentage cannot exceed 50%.",
  InvalidDuration: "Duration must be between 1 and 90 days.",
  ZeroBeneficiary: "The beneficiary cannot be the zero address.",
  NoActiveCommitment: "No active commitment for this address.",
  AlreadyReportedToday: "Already reported today — one report per UTC day.",
  PeriodOver: "The commitment period is already over.",
  PeriodNotOver: "The commitment period isn't over yet.",
  TransferFailed: "The MON transfer failed.",
};

export function friendlyError(err: unknown): string {
  if (err instanceof BaseError) {
    const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError) {
      const name = revert.data?.errorName;
      if (name && CUSTOM_ERROR_MESSAGES[name]) return CUSTOM_ERROR_MESSAGES[name];
    }
    if (err.walk((e) => e instanceof UserRejectedRequestError)) {
      return "Transaction rejected in wallet.";
    }
    if (err.walk((e) => e instanceof InsufficientFundsError)) {
      return "Not enough MON to cover the stake plus gas.";
    }
    return err.shortMessage;
  }
  if (err instanceof Error) return err.message.split("\n")[0];
  return "Something went wrong.";
}
