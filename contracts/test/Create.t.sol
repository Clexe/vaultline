// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

contract CreateTest is VaultTestBase {
    function test_CreateStoresCommitment() public {
        _create();

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.owner, trader);
        assertEq(c.rulesHash, RULES_HASH);
        assertEq(c.stakeRemaining, STAKE);
        assertEq(c.beneficiary, beneficiary);
        assertEq(c.startTimestamp, uint64(T0));
        assertEq(c.durationDays, DURATION);
        assertEq(c.slashBps, SLASH_BPS);
        assertEq(c.lastReportedDay, uint32(T0 / 1 days) - 1);
        assertEq(c.streak, 0);
        assertEq(c.violations, 0);
        assertTrue(c.active);
        assertEq(address(vault).balance, STAKE);
    }

    function test_CreateEmitsEvent() public {
        vm.expectEmit(true, false, false, true, address(vault));
        emit AccountabilityVault.CommitmentCreated(trader, STAKE, RULES_HASH, DURATION, SLASH_BPS, beneficiary);
        _create();
    }

    function test_RevertWhen_ZeroStake() public {
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.StakeRequired.selector);
        vault.createCommitment(RULES_HASH, DURATION, SLASH_BPS, beneficiary);
    }

    function test_RevertWhen_AlreadyActive() public {
        _create();
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.CommitmentAlreadyActive.selector);
        vault.createCommitment{value: 1 ether}(RULES_HASH, DURATION, SLASH_BPS, beneficiary);
    }

    function test_RevertWhen_SlashBpsAbove5000() public {
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.SlashBpsTooHigh.selector);
        vault.createCommitment{value: STAKE}(RULES_HASH, DURATION, 5001, beneficiary);
    }

    function test_SlashBpsBoundary5000Allowed() public {
        _create(DURATION, 5000);
        assertTrue(_get().active);
    }

    function test_RevertWhen_DurationZero() public {
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.InvalidDuration.selector);
        vault.createCommitment{value: STAKE}(RULES_HASH, 0, SLASH_BPS, beneficiary);
    }

    function test_RevertWhen_DurationAbove90() public {
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.InvalidDuration.selector);
        vault.createCommitment{value: STAKE}(RULES_HASH, 91, SLASH_BPS, beneficiary);
    }

    function test_DurationBoundaries1And90Allowed() public {
        _create(1, SLASH_BPS);
        assertEq(_get().durationDays, 1);

        address other = makeAddr("other");
        vm.deal(other, STAKE);
        vm.prank(other);
        vault.createCommitment{value: STAKE}(RULES_HASH, 90, SLASH_BPS, beneficiary);
        assertEq(vault.getCommitment(other).durationDays, 90);
    }

    function test_RevertWhen_ZeroBeneficiary() public {
        vm.prank(trader);
        vm.expectRevert(AccountabilityVault.ZeroBeneficiary.selector);
        vault.createCommitment{value: STAKE}(RULES_HASH, DURATION, SLASH_BPS, address(0));
    }

    function test_CurrentDayMatchesTimestamp() public view {
        assertEq(vault.currentDay(), T0 / 1 days);
    }

    function test_DaysRemaining() public {
        _create();
        assertEq(vault.daysRemaining(trader), 14);

        _warpDays(1);
        assertEq(vault.daysRemaining(trader), 13);

        _warpDays(13);
        assertEq(vault.daysRemaining(trader), 0);
    }

    function test_DaysRemainingZeroForUnknownAddress() public {
        assertEq(vault.daysRemaining(makeAddr("nobody")), 0);
    }
}
