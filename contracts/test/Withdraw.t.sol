// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

contract WithdrawTest is VaultTestBase {
    function test_HappyPath_14DayCompliantRunAndWithdraw() public {
        uint256 balanceBefore = trader.balance;
        _create();

        for (uint256 i = 0; i < 14; i++) {
            _report(true);
            _warpDays(1);
        }
        assertEq(_get().streak, 14);
        assertEq(_get().violations, 0);
        assertEq(_get().stakeRemaining, STAKE);

        // Loop warped exactly 14 days past creation: period is over to the second.
        vm.expectEmit(true, false, false, true, address(vault));
        emit AccountabilityVault.Withdrawn(trader, STAKE);
        vm.prank(trader);
        vault.withdraw();

        assertEq(trader.balance, balanceBefore); // full stake returned
        assertEq(beneficiary.balance, 0);
        assertEq(address(vault).balance, 0);
        assertFalse(_get().active);
        assertEq(_get().stakeRemaining, 0);
    }

    function test_RevertWhen_WithdrawEarly() public {
        _create();
        vm.warp(T0 + 14 days - 1);

        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.PeriodNotOver.selector);
        vault.withdraw();
    }

    function test_WithdrawSettlesMissedDaysFirst() public {
        _create();
        // Never report at all; come back after the period.
        vm.warp(T0 + 14 days);

        uint256 stake = STAKE;
        for (uint256 i = 0; i < 14; i++) {
            stake -= _ceilSlash(stake, SLASH_BPS);
        }

        uint256 balanceBefore = trader.balance;
        vm.prank(trader);
        vault.withdraw();

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 14);
        assertFalse(c.active);
        assertEq(trader.balance, balanceBefore + stake);
        assertEq(beneficiary.balance, STAKE - stake);
        assertEq(address(vault).balance, 0);
    }

    function test_RevertWhen_WithdrawTwice() public {
        _create();
        vm.warp(T0 + 14 days);
        vm.prank(trader);
        vault.withdraw();

        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.NoActiveCommitment.selector);
        vault.withdraw();
    }

    function test_RevertWhen_WithdrawWithoutCommitment() public {
        vm.prank(makeAddr("stranger"));
        vm.expectRevert(AccountabilityVault.NoActiveCommitment.selector);
        vault.withdraw();
    }

    function test_CanRecreateAfterWithdraw() public {
        _create();
        vm.warp(T0 + 14 days);
        vm.prank(trader);
        vault.withdraw();

        bytes32 newHash = keccak256("new rules");
        vm.prank(trader);
        vault.createCommitment{value: 5 ether}(newHash, 7, 2000, beneficiary);

        AccountabilityVault.Commitment memory c = _get();
        assertTrue(c.active);
        assertEq(c.rulesHash, newHash);
        assertEq(c.stakeRemaining, 5 ether);
        assertEq(c.streak, 0);
        assertEq(c.violations, 0);
    }

    function test_WithdrawAfterMixedRun() public {
        _create();
        // Day 0 compliant, day 1 violated, days 2-12 compliant, day 13 missed.
        _report(true);
        _warpDays(1);
        _report(false);
        uint256 stake = STAKE - _ceilSlash(STAKE, SLASH_BPS);

        for (uint256 i = 0; i < 11; i++) {
            _warpDays(1);
            _report(true);
        }
        // Skip day 13 entirely, land past the period end.
        _warpDays(2);

        stake -= _ceilSlash(stake, SLASH_BPS); // day 13 missed, settled inside withdraw

        uint256 balanceBefore = trader.balance;
        vm.prank(trader);
        vault.withdraw();

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.violations, 2);
        assertEq(trader.balance, balanceBefore + stake);
        assertEq(address(vault).balance, 0);
    }
}
