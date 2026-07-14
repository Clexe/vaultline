// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

contract FuzzTest is VaultTestBase {
    /// @dev A single self-reported violation, over the full stake/bps space.
    function testFuzz_SlashMath(uint128 stakeRaw, uint16 bpsRaw) public {
        uint256 stake = bound(uint256(stakeRaw), 1, type(uint128).max);
        uint16 bps = uint16(bound(uint256(bpsRaw), 0, 5000));

        vm.deal(trader, stake);
        vm.prank(trader);
        vault.createCommitment{value: stake}(RULES_HASH, DURATION, bps, beneficiary);

        vm.prank(trader);
        vault.reportDay(false);

        uint256 expected = _ceilSlash(stake, bps);
        AccountabilityVault.Commitment memory c = _get();

        // Value conservation: nothing minted, nothing lost.
        assertEq(c.stakeRemaining + expected, stake);
        assertEq(beneficiary.balance, expected);
        assertEq(address(vault).balance, c.stakeRemaining);

        // A violation always costs at least 1 wei when bps > 0 (ceil division).
        if (bps > 0) assertGe(expected, 1);
        // And can never take more than the remaining stake (bps <= 5000).
        assertLe(expected, stake);

        // Depletion and deactivation are exactly coupled.
        assertEq(c.active, c.stakeRemaining > 0);
    }

    /// @dev A run of consecutive missed days settled in one transaction.
    function testFuzz_MissedDaySettlement(uint8 missedRaw, uint16 bpsRaw, uint128 stakeRaw) public {
        uint256 missed = bound(uint256(missedRaw), 1, 60);
        uint16 bps = uint16(bound(uint256(bpsRaw), 1, 5000));
        uint256 stake = bound(uint256(stakeRaw), 1, type(uint128).max);

        vm.deal(trader, stake);
        vm.prank(trader);
        vault.createCommitment{value: stake}(RULES_HASH, 90, bps, beneficiary);

        _warpDays(missed); // days 0 .. missed-1 are now fully missed

        // Replay the contract's compounding math independently.
        uint256 remaining = stake;
        uint256 expectedViolations;
        for (uint256 i = 0; i < missed; i++) {
            remaining -= _ceilSlash(remaining, bps);
            expectedViolations++;
            if (remaining == 0) break;
        }

        vm.prank(keeper);
        vault.settleMissedDays(trader);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.stakeRemaining, remaining);
        assertEq(c.violations, expectedViolations);
        assertEq(c.streak, 0);
        assertEq(c.active, remaining > 0);
        // Every slashed wei reached the beneficiary; conservation holds.
        assertEq(beneficiary.balance, stake - remaining);
        assertEq(address(vault).balance, remaining);
    }
}
