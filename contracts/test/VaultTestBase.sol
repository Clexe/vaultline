// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

/// @dev Shared fixtures and helpers for AccountabilityVault tests.
abstract contract VaultTestBase is Test {
    AccountabilityVault internal vault;

    address internal trader = makeAddr("trader");
    address internal beneficiary = makeAddr("beneficiary");
    address internal keeper = makeAddr("keeper");

    bytes32 internal constant RULES_HASH =
        keccak256("max daily loss 2%; max 3 trades/day; london+ny sessions only; no revenge trading");
    uint256 internal constant STAKE = 10 ether;
    uint16 internal constant DURATION = 14;
    uint16 internal constant SLASH_BPS = 1000; // 10%
    address internal constant BURN = 0x000000000000000000000000000000000000dEaD;

    // Midday UTC on an arbitrary epoch day so both day boundaries sit 12h away.
    uint256 internal constant T0 = 20_000 days + 12 hours;

    function setUp() public virtual {
        vm.warp(T0);
        vault = new AccountabilityVault();
        vm.deal(trader, 1_000 ether);
    }

    function _create() internal {
        _create(DURATION, SLASH_BPS);
    }

    function _create(uint16 durationDays, uint16 slashBps) internal {
        vm.prank(trader);
        vault.createCommitment{value: STAKE}(RULES_HASH, durationDays, slashBps, beneficiary);
    }

    function _report(bool compliant) internal {
        vm.prank(trader);
        vault.reportDay(compliant);
    }

    function _warpDays(uint256 n) internal {
        vm.warp(block.timestamp + n * 1 days);
    }

    /// @dev Mirrors the contract's ceil-division slash math.
    function _ceilSlash(uint256 stake, uint16 bps) internal pure returns (uint256) {
        return (stake * bps + 9_999) / 10_000;
    }

    function _get() internal view returns (AccountabilityVault.Commitment memory) {
        return vault.getCommitment(trader);
    }
}
