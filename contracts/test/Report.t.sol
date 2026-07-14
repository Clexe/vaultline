// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

contract ReportTest is VaultTestBase {
    function test_CompliantReportIncrementsStreak() public {
        _create();
        _report(true);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.streak, 1);
        assertEq(c.violations, 0);
        assertEq(c.lastReportedDay, uint32(vault.currentDay()));
        assertEq(c.stakeRemaining, STAKE);

        _warpDays(1);
        _report(true);
        assertEq(_get().streak, 2);
    }

    function test_ReportEmitsDayReported() public {
        _create();
        vm.expectEmit(true, false, false, true, address(vault));
        emit AccountabilityVault.DayReported(trader, vault.currentDay(), true, 1);
        _report(true);
    }

    function test_RevertWhen_DoubleReportSameDay() public {
        _create();
        _report(true);

        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.AlreadyReportedToday.selector);
        vault.reportDay(true);
    }

    function test_DoubleReportRevertsRegardlessOfCompliance() public {
        _create();
        _report(false);

        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.AlreadyReportedToday.selector);
        vault.reportDay(false);
    }

    function test_ReportWorksAtExactMidnightBoundary() public {
        _create();
        _report(true);

        // Warp to the exact first second of the next UTC day.
        vm.warp((vault.currentDay() + 1) * 1 days);
        _report(true);
        assertEq(_get().streak, 2);
    }

    function test_ViolationSlashesRemainingStake() public {
        _create();
        uint256 expected = _ceilSlash(STAKE, SLASH_BPS); // 1 ether

        vm.expectEmit(true, false, false, true, address(vault));
        emit AccountabilityVault.Slashed(
            trader, vault.currentDay(), expected, AccountabilityVault.SlashReason.SelfReported
        );
        _report(false);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.stakeRemaining, STAKE - expected);
        assertEq(c.violations, 1);
        assertEq(c.streak, 0);
        assertEq(beneficiary.balance, expected);
        assertEq(address(vault).balance, STAKE - expected);
    }

    function test_ViolationResetsStreak() public {
        _create();
        for (uint256 i = 0; i < 3; i++) {
            _report(true);
            _warpDays(1);
        }
        assertEq(_get().streak, 3);

        _report(false);
        assertEq(_get().streak, 0);

        // Streak rebuilds from zero afterwards.
        _warpDays(1);
        _report(true);
        assertEq(_get().streak, 1);
    }

    function test_SecondSlashAppliesToRemainingNotOriginal() public {
        _create();
        _report(false);
        uint256 firstSlash = _ceilSlash(STAKE, SLASH_BPS);

        _warpDays(1);
        _report(false);
        uint256 secondSlash = _ceilSlash(STAKE - firstSlash, SLASH_BPS);

        assertLt(secondSlash, firstSlash);
        assertEq(_get().stakeRemaining, STAKE - firstSlash - secondSlash);
        assertEq(beneficiary.balance, firstSlash + secondSlash);
        assertEq(_get().violations, 2);
    }

    function test_RevertWhen_ReportAfterPeriodOver() public {
        _create(); // 14 days: creation day + 13 more
        _warpDays(14);

        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.PeriodOver.selector);
        vault.reportDay(true);
    }

    function test_LastDayOfPeriodIsReportable() public {
        _create();
        _warpDays(13);
        _report(true);
        assertEq(_get().streak, 1);
    }

    function test_RevertWhen_NoCommitment() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(AccountabilityVault.NoActiveCommitment.selector);
        vault.reportDay(true);
    }
}
