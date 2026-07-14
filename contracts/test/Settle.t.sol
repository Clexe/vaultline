// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

contract SettleTest is VaultTestBase {
    function test_MissedDaysSettledOnReport() public {
        _create();
        _report(true); // day 0

        // Skip days 1, 2, 3 entirely; report again on day 4.
        _warpDays(4);

        uint256 stake = STAKE;
        uint256 totalSlashed;
        uint256 day = vault.currentDay();
        for (uint256 d = day - 3; d < day; d++) {
            uint256 slash = _ceilSlash(stake, SLASH_BPS);
            vm.expectEmit(true, false, false, true, address(vault));
            emit AccountabilityVault.Slashed(trader, d, slash, AccountabilityVault.SlashReason.MissedDay);
            stake -= slash;
            totalSlashed += slash;
        }

        _report(true);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 3);
        assertEq(c.stakeRemaining, stake);
        assertEq(c.streak, 1); // reset by missed days, then today's compliant report
        assertEq(c.lastReportedDay, uint32(day));
        assertEq(beneficiary.balance, totalSlashed);
    }

    function test_MissedDaySlashesCompoundOnRemainingStake() public {
        _create();
        _report(true);
        _warpDays(3); // miss days 1 and 2

        _report(true);

        // 10 ether -> slash 1 ether -> 9 ether -> slash 0.9 ether -> 8.1 ether
        assertEq(_get().stakeRemaining, 8.1 ether);
        assertEq(beneficiary.balance, 1.9 ether);
    }

    function test_SettleMissedDays_CallableByAnyone() public {
        _create();
        // Trader never reports. 3 full days pass (creation day + 2 more).
        _warpDays(3);

        vm.prank(keeper);
        vault.settleMissedDays(trader);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 3); // days 0,1,2 missed; today (day 3) still reportable
        assertEq(c.streak, 0);
        assertTrue(c.active);

        // Today is not a missed day yet — trader can still report it.
        _report(true);
        assertEq(_get().streak, 1);
    }

    function test_SettleMissedDays_NoOpWhenNothingMissed() public {
        _create();
        _report(true);

        vm.prank(keeper);
        vault.settleMissedDays(trader);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 0);
        assertEq(c.stakeRemaining, STAKE);
        assertEq(beneficiary.balance, 0);
    }

    function test_SettleMissedDays_ClampsToEndDay() public {
        _create(5, SLASH_BPS); // days 0..4
        _warpDays(10); // way past the end

        vm.prank(keeper);
        vault.settleMissedDays(trader);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 5); // only the 5 commitment days count
        assertTrue(c.active); // 10 ether * 0.9^5 still > 0

        // Settlement is idempotent once fully settled.
        vm.prank(keeper);
        vault.settleMissedDays(trader);
        assertEq(_get().violations, 5);
    }

    function test_ReportRequiresSettlementInSameTx() public {
        // The contract never lets a report land while earlier days are open:
        // reportDay() settles them atomically before processing today.
        _create();
        _report(true);
        _warpDays(2); // day 1 missed

        _report(false); // settles day 1 (missed) then day 2 (self-reported)

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 2);
        uint256 firstSlash = _ceilSlash(STAKE, SLASH_BPS);
        uint256 secondSlash = _ceilSlash(STAKE - firstSlash, SLASH_BPS);
        assertEq(c.stakeRemaining, STAKE - firstSlash - secondSlash);
    }

    function test_SettleRevertsWhenNoCommitment() public {
        vm.prank(keeper);
        vm.expectRevert(AccountabilityVault.NoActiveCommitment.selector);
        vault.settleMissedDays(makeAddr("stranger"));
    }
}
