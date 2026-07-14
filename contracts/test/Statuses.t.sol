// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {VaultTestBase} from "./VaultTestBase.sol";
import {AccountabilityVault} from "../src/AccountabilityVault.sol";

/// @dev The packed per-day status bitmap that feeds the frontend calendar.
///      Codes: 0 = unreported, 1 = compliant, 2 = violated, 3 = missed.
contract StatusesTest is VaultTestBase {
    function test_FreshCommitmentAllUnreported() public {
        _create();
        uint8[] memory s = vault.getDayStatuses(trader);
        assertEq(s.length, 14);
        for (uint256 i = 0; i < s.length; i++) {
            assertEq(s[i], 0);
        }
        assertEq(_get().stakeInitial, STAKE);
    }

    function test_StatusesTrackMixedRun() public {
        _create();
        _report(true); // day 0 compliant
        _warpDays(1);
        _report(false); // day 1 violated
        _warpDays(3); // days 2, 3 missed
        _report(true); // day 4 compliant

        uint8[] memory s = vault.getDayStatuses(trader);
        assertEq(s[0], 1);
        assertEq(s[1], 2);
        assertEq(s[2], 3);
        assertEq(s[3], 3);
        assertEq(s[4], 1);
        for (uint256 i = 5; i < 14; i++) {
            assertEq(s[i], 0); // future days untouched
        }
    }

    function test_KeeperSettlementWritesMissedStatuses() public {
        _create();
        _warpDays(3);
        vm.prank(keeper);
        vault.settleMissedDays(trader);

        uint8[] memory s = vault.getDayStatuses(trader);
        assertEq(s[0], 3);
        assertEq(s[1], 3);
        assertEq(s[2], 3);
        assertEq(s[3], 0); // today is still reportable
    }

    function test_StatusesSurviveWithdrawal() public {
        _create();
        for (uint256 i = 0; i < 14; i++) {
            _report(true);
            _warpDays(1);
        }
        vm.prank(trader);
        vault.withdraw();

        uint8[] memory s = vault.getDayStatuses(trader);
        for (uint256 i = 0; i < 14; i++) {
            assertEq(s[i], 1);
        }
        // History for the completed run stays readable.
        assertEq(_get().stakeRemaining, STAKE);
        assertEq(_get().stakeInitial, STAKE);
        assertFalse(_get().active);
    }

    function test_TotalSlashedDerivableFromInitialMinusRemaining() public {
        _create();
        _report(false);
        _warpDays(1);
        _report(false);

        AccountabilityVault.Commitment memory c = _get();
        assertEq(c.stakeInitial - c.stakeRemaining, beneficiary.balance);
    }

    function test_FullNinetyDayBitmapNoOverflow() public {
        _create(90, SLASH_BPS);
        // Miss all 90 days, then settle: highest bit offset = 89 * 2 = 178 < 192.
        _warpDays(91);
        vm.prank(keeper);
        vault.settleMissedDays(trader);

        uint8[] memory s = vault.getDayStatuses(trader);
        assertEq(s.length, 90);
        assertEq(s[0], 3);
        assertEq(s[89], 3);
        assertEq(_get().violations, 90);
    }

    function test_GetDayStatusesEmptyForUnknownAddress() public {
        uint8[] memory s = vault.getDayStatuses(makeAddr("nobody"));
        assertEq(s.length, 0);
    }
}
