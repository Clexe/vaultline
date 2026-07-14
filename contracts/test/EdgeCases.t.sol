// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

/// @dev Beneficiary that rejects all incoming transfers.
contract RevertingBeneficiary {
    receive() external payable {
        revert("no thanks");
    }
}

/// @dev Beneficiary that burns all forwarded gas — griefing attempt.
contract GasGuzzler {
    uint256 private sink;

    receive() external payable {
        while (true) {
            sink += 1;
        }
    }
}

/// @dev Beneficiary that tries to re-enter the vault during a slash payout.
contract ReentrantBeneficiary {
    AccountabilityVault private immutable vault;
    address private immutable target;

    constructor(AccountabilityVault vault_, address target_) {
        vault = vault_;
        target = target_;
    }

    receive() external payable {
        // If the reentrancy guard is missing this is a harmless no-op call and
        // the transfer succeeds; with the guard it reverts, so the payout falls
        // back to the burn address. The burn balance is the proof.
        vault.settleMissedDays(target);
    }
}

/// @dev Vault owner that tries to re-enter withdraw() from the payout transfer.
contract ReentrantOwner {
    AccountabilityVault private immutable vault;

    constructor(AccountabilityVault vault_) {
        vault = vault_;
    }

    function create(bytes32 rulesHash, uint16 durationDays, uint16 slashBps, address beneficiary)
        external
        payable
    {
        vault.createCommitment{value: msg.value}(rulesHash, durationDays, slashBps, beneficiary);
    }

    function withdraw() external {
        vault.withdraw();
    }

    receive() external payable {
        vault.withdraw();
    }
}

contract EdgeCasesTest is VaultTestBase {
    function test_StakeDepletesToZeroAndDeactivates() public {
        address gambler = makeAddr("gambler");
        vm.deal(gambler, 2);
        vm.prank(gambler);
        vault.createCommitment{value: 2}(RULES_HASH, DURATION, 5000, beneficiary);

        vm.prank(gambler);
        vault.reportDay(false); // 2 wei -> slash ceil(1) = 1 -> 1 wei left
        assertEq(vault.getCommitment(gambler).stakeRemaining, 1);

        _warpDays(1);
        vm.expectEmit(true, false, false, true, address(vault));
        emit AccountabilityVault.CommitmentDepleted(gambler, vault.currentDay());
        vm.prank(gambler);
        vault.reportDay(false); // 1 wei -> ceil(0.5) = 1 -> depleted

        AccountabilityVault.Commitment memory c = vault.getCommitment(gambler);
        assertEq(c.stakeRemaining, 0);
        assertFalse(c.active);
        assertEq(beneficiary.balance, 2);

        vm.prank(gambler);
        vm.expectRevert(AccountabilityVault.NoActiveCommitment.selector);
        vault.reportDay(true);
    }

    function test_DepletionDuringSettlementStopsLoop() public {
        address gambler = makeAddr("gambler");
        vm.deal(gambler, 2);
        vm.prank(gambler);
        vault.createCommitment{value: 2}(RULES_HASH, DURATION, 5000, beneficiary);

        _warpDays(6); // five fully missed days, but only two are payable

        vm.prank(keeper);
        vault.settleMissedDays(gambler);

        AccountabilityVault.Commitment memory c = vault.getCommitment(gambler);
        assertEq(c.violations, 2); // loop stops once the stake is gone
        assertFalse(c.active);
        assertEq(c.stakeRemaining, 0);
    }

    function test_DepletionDuringReportSettlementSwallowsReport() public {
        address gambler = makeAddr("gambler");
        vm.deal(gambler, 2);
        vm.prank(gambler);
        vault.createCommitment{value: 2}(RULES_HASH, DURATION, 5000, beneficiary);

        _warpDays(3); // days 0,1,2 missed; depletion hits on day 1

        vm.prank(gambler);
        vault.reportDay(true); // settlement persists even though today can't be recorded

        AccountabilityVault.Commitment memory c = vault.getCommitment(gambler);
        assertFalse(c.active);
        assertEq(c.violations, 2);
        assertEq(c.streak, 0);
    }

    function test_ZeroSlashBpsViolationCostsNothing() public {
        _create(DURATION, 0);
        _report(false);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 1);
        assertEq(c.streak, 0);
        assertEq(c.stakeRemaining, STAKE);
        assertEq(beneficiary.balance, 0);
    }

    function test_RevertingBeneficiary_SlashFallsBackToBurn() public {
        RevertingBeneficiary bad = new RevertingBeneficiary();
        vm.prank(trader);
        vault.createCommitment{value: STAKE}(RULES_HASH, DURATION, SLASH_BPS, address(bad));

        uint256 burnBefore = BURN.balance;
        _report(false);

        uint256 expected = _ceilSlash(STAKE, SLASH_BPS);
        assertEq(BURN.balance, burnBefore + expected);
        assertEq(address(bad).balance, 0);
        assertEq(_get().stakeRemaining, STAKE - expected);
    }

    function test_GasGuzzlingBeneficiary_SlashFallsBackToBurn() public {
        GasGuzzler guzzler = new GasGuzzler();
        vm.prank(trader);
        vault.createCommitment{value: STAKE}(RULES_HASH, DURATION, SLASH_BPS, address(guzzler));

        uint256 burnBefore = BURN.balance;
        _report(false); // bounded stipend burns out, payout falls back to burn

        uint256 expected = _ceilSlash(STAKE, SLASH_BPS);
        assertEq(BURN.balance, burnBefore + expected);
        assertEq(address(guzzler).balance, 0);
    }

    function test_ReentrantBeneficiary_BlockedAndBurned() public {
        ReentrantBeneficiary attacker;
        // Deploy first so the address is known, then commit with it as beneficiary.
        attacker = new ReentrantBeneficiary(vault, trader);

        vm.prank(trader);
        vault.createCommitment{value: STAKE}(RULES_HASH, DURATION, SLASH_BPS, address(attacker));

        uint256 burnBefore = BURN.balance;
        _report(false);

        // The guard rejected the re-entrant call, so the attacker's receive
        // reverted and the slash was burned instead.
        uint256 expected = _ceilSlash(STAKE, SLASH_BPS);
        assertEq(BURN.balance, burnBefore + expected);
        assertEq(address(attacker).balance, 0);
    }

    function test_ReentrantOwner_WithdrawBlocked() public {
        ReentrantOwner attacker = new ReentrantOwner(vault);
        vm.deal(address(attacker), STAKE);

        attacker.create{value: STAKE}(RULES_HASH, 1, SLASH_BPS, beneficiary);
        _warpDays(1); // period over

        // The payout transfer triggers the attacker's receive(), which re-enters
        // withdraw(). The guard reverts the inner call, the receive reverts, and
        // the whole withdrawal fails — funds stay in the vault, nothing doubles.
        vm.expectRevert(AccountabilityVault.TransferFailed.selector);
        attacker.withdraw();

        assertTrue(vault.getCommitment(address(attacker)).active);
        assertGt(address(vault).balance, 0);
    }
}
