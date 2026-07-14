// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AccountabilityVault
/// @notice A self-reported trading-discipline commitment vault. A trader stakes
///         native MON alongside a hash of their trading rules. Each UTC day they
///         report compliance: clean days grow a streak, violations slash a fixed
///         percentage of the remaining stake to a beneficiary. Missing a daily
///         report counts as a violation automatically. After the commitment
///         period ends, the trader withdraws whatever stake survived.
/// @dev    Deliberately self-reported — there is no oracle. Lying only cheats
///         the trader out of the accountability they paid for. Day windows are
///         fixed UTC days (block.timestamp / 1 days), not rolling 24h windows.
contract AccountabilityVault is ReentrancyGuard {
    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @notice Fallback recipient when a slash transfer to the beneficiary fails.
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    uint16 public constant MAX_SLASH_BPS = 5000;
    uint16 public constant MAX_DURATION_DAYS = 90;
    uint256 private constant BPS_DENOMINATOR = 10_000;

    /// @dev Gas forwarded to the beneficiary on a slash payout. Enough for any
    ///      reasonable receive hook; prevents a malicious beneficiary from
    ///      gas-griefing settlement (failed transfers fall back to the burn address).
    uint256 private constant BENEFICIARY_GAS_STIPEND = 50_000;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum SlashReason {
        SelfReported,
        MissedDay
    }

    /// @dev Per-day status codes packed 2 bits per day into `dayStatuses`,
    ///      indexed by (day - startDay). 0 = unreported (pending or future).
    uint192 private constant STATUS_COMPLIANT = 1;
    uint192 private constant STATUS_VIOLATED = 2;
    uint192 private constant STATUS_MISSED = 3;

    struct Commitment {
        address owner;
        bytes32 rulesHash;
        uint256 stakeInitial;
        uint256 stakeRemaining;
        // slot: beneficiary (20) + startTimestamp (8) + durationDays (2) + slashBps (2)
        address beneficiary;
        uint64 startTimestamp;
        uint16 durationDays;
        uint16 slashBps;
        // slot: lastReportedDay (4) + streak (2) + violations (2) + active (1)
        uint32 lastReportedDay;
        uint16 streak;
        uint16 violations;
        bool active;
        // Full daily history onchain: 2 bits per day, up to 90 days. Lets the
        // frontend render the streak calendar from a single view call — the
        // public Monad RPC caps eth_getLogs at 100 blocks, so event replay is
        // not a viable data source.
        uint192 dayStatuses;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    mapping(address => Commitment) private _commitments;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event CommitmentCreated(
        address indexed owner,
        uint256 stake,
        bytes32 rulesHash,
        uint16 durationDays,
        uint16 slashBps,
        address beneficiary
    );
    event DayReported(address indexed owner, uint256 day, bool compliant, uint16 streak);
    event Slashed(address indexed owner, uint256 day, uint256 amount, SlashReason reason);
    event CommitmentDepleted(address indexed owner, uint256 day);
    event Withdrawn(address indexed owner, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error StakeRequired();
    error CommitmentAlreadyActive();
    error SlashBpsTooHigh();
    error InvalidDuration();
    error ZeroBeneficiary();
    error NoActiveCommitment();
    error AlreadyReportedToday();
    error PeriodOver();
    error PeriodNotOver();
    error TransferFailed();

    // ---------------------------------------------------------------------
    // Mutating functions
    // ---------------------------------------------------------------------

    /// @notice Stake MON against a hashed rule set for a fixed number of UTC days.
    /// @param rulesHash keccak256 of the canonical rules JSON (kept off-chain by the trader).
    /// @param durationDays Commitment length in UTC days, 1–90. The creation day counts as day one.
    /// @param slashBps Basis points of the *remaining* stake slashed per violation, max 5000.
    /// @param beneficiary Recipient of slashed funds (use the burn address for pure burning).
    function createCommitment(
        bytes32 rulesHash,
        uint16 durationDays,
        uint16 slashBps,
        address beneficiary
    ) external payable {
        if (msg.value == 0) revert StakeRequired();
        if (_commitments[msg.sender].active) revert CommitmentAlreadyActive();
        if (slashBps > MAX_SLASH_BPS) revert SlashBpsTooHigh();
        if (durationDays == 0 || durationDays > MAX_DURATION_DAYS) revert InvalidDuration();
        if (beneficiary == address(0)) revert ZeroBeneficiary();

        uint32 startDay = uint32(block.timestamp / 1 days);
        _commitments[msg.sender] = Commitment({
            owner: msg.sender,
            rulesHash: rulesHash,
            stakeInitial: msg.value,
            stakeRemaining: msg.value,
            beneficiary: beneficiary,
            startTimestamp: uint64(block.timestamp),
            durationDays: durationDays,
            slashBps: slashBps,
            // The creation day itself is reportable, so the "last reported" marker
            // sits one day before it.
            lastReportedDay: startDay - 1,
            streak: 0,
            violations: 0,
            active: true,
            dayStatuses: 0
        });

        emit CommitmentCreated(msg.sender, msg.value, rulesHash, durationDays, slashBps, beneficiary);
    }

    /// @notice Report compliance for the current UTC day. Any fully missed days
    ///         since the last report are settled as violations first, in this
    ///         same transaction.
    function reportDay(bool compliant) external nonReentrant {
        Commitment storage c = _commitments[msg.sender];
        if (!c.active) revert NoActiveCommitment();

        uint32 today = uint32(block.timestamp / 1 days);
        if (today > _endDay(c)) revert PeriodOver();
        if (c.lastReportedDay >= today) revert AlreadyReportedToday();

        uint256 slashed = _settleMissedDays(c, today - 1);

        // Settlement of missed days may have burned through the entire stake.
        // The settlement state (violations, deactivation) must still persist,
        // so we stop here rather than revert.
        if (c.active) {
            c.lastReportedDay = today;
            if (compliant) {
                c.streak += 1;
                _setDayStatus(c, today, STATUS_COMPLIANT);
                emit DayReported(msg.sender, today, true, c.streak);
            } else {
                c.streak = 0;
                c.violations += 1;
                _setDayStatus(c, today, STATUS_VIOLATED);
                emit DayReported(msg.sender, today, false, 0);
                slashed += _applySlash(c, today, SlashReason.SelfReported);
            }
        }

        _payoutSlashes(c, slashed);
    }

    /// @notice Settle any fully missed days for `trader` as violations. Callable
    ///         by anyone, so the vault stays honest even if the owner goes dark.
    function settleMissedDays(address trader) external nonReentrant {
        Commitment storage c = _commitments[trader];
        if (!c.active) revert NoActiveCommitment();

        uint32 today = uint32(block.timestamp / 1 days);
        uint32 endDay = _endDay(c);
        uint32 settleUpTo = today > endDay ? endDay : today - 1;

        uint256 slashed = _settleMissedDays(c, settleUpTo);
        _payoutSlashes(c, slashed);
    }

    /// @notice Withdraw the surviving stake after the commitment period ends.
    ///         Unsettled missed days are applied first.
    function withdraw() external nonReentrant {
        Commitment storage c = _commitments[msg.sender];
        if (!c.active) revert NoActiveCommitment();
        if (block.timestamp < uint256(c.startTimestamp) + uint256(c.durationDays) * 1 days) {
            revert PeriodNotOver();
        }

        uint256 slashed = _settleMissedDays(c, _endDay(c));

        // stakeRemaining is deliberately left intact after withdrawal: every
        // payout path requires `active`, and the surviving value keeps the
        // public history page meaningful once the commitment completes.
        uint256 remaining = c.stakeRemaining;
        if (remaining > 0) {
            c.active = false;
            emit Withdrawn(msg.sender, remaining);
        }

        _payoutSlashes(c, slashed);

        if (remaining > 0) {
            (bool ok,) = msg.sender.call{value: remaining}("");
            if (!ok) revert TransferFailed();
        }
    }

    // ---------------------------------------------------------------------
    // View functions
    // ---------------------------------------------------------------------

    function getCommitment(address trader) external view returns (Commitment memory) {
        return _commitments[trader];
    }

    /// @notice Per-day statuses for a trader's commitment, one entry per
    ///         commitment day: 0 = unreported, 1 = compliant, 2 = violated,
    ///         3 = missed. Decoded from the packed bitmap.
    function getDayStatuses(address trader) external view returns (uint8[] memory statuses) {
        Commitment storage c = _commitments[trader];
        statuses = new uint8[](c.durationDays);
        uint192 packed = c.dayStatuses;
        for (uint256 i = 0; i < c.durationDays; i++) {
            statuses[i] = uint8((packed >> (i * 2)) & 3);
        }
    }

    /// @notice The current UTC day index (block.timestamp / 1 days).
    function currentDay() public view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /// @notice Commitment days that have not yet fully elapsed, including today.
    ///         Zero if the trader has no commitment or the period is over.
    function daysRemaining(address trader) external view returns (uint256) {
        Commitment storage c = _commitments[trader];
        if (c.durationDays == 0) return 0;
        uint256 endDay = _endDay(c);
        uint256 today = currentDay();
        return today > endDay ? 0 : endDay - today + 1;
    }

    // ---------------------------------------------------------------------
    // Internals
    // ---------------------------------------------------------------------

    /// @dev Last day index covered by the commitment (creation day counts as day one).
    function _endDay(Commitment storage c) private view returns (uint32) {
        return uint32(uint256(c.startTimestamp) / 1 days) + c.durationDays - 1;
    }

    /// @dev Marks every unreported day up to and including `settleUpTo` as a
    ///      violation, slashing per day on the then-remaining stake. Returns the
    ///      total slashed; the caller is responsible for paying it out.
    function _settleMissedDays(Commitment storage c, uint32 settleUpTo) private returns (uint256 totalSlashed) {
        for (uint32 day = c.lastReportedDay + 1; day <= settleUpTo; day++) {
            c.streak = 0;
            c.violations += 1;
            c.lastReportedDay = day;
            _setDayStatus(c, day, STATUS_MISSED);
            totalSlashed += _applySlash(c, day, SlashReason.MissedDay);
            if (!c.active) break;
        }
    }

    /// @dev Records a day's outcome in the packed bitmap. Statuses only ever
    ///      transition from 0 (unreported), so OR-ing is sufficient.
    function _setDayStatus(Commitment storage c, uint32 day, uint192 status) private {
        uint256 offset = day - uint256(c.startTimestamp) / 1 days;
        c.dayStatuses |= status << (offset * 2);
    }

    /// @dev Deducts a slash from the remaining stake (state only, no transfer).
    ///      Rounds up so a violation always costs at least 1 wei, which makes
    ///      full depletion reachable; slashBps <= 5000 keeps the result <= stake.
    function _applySlash(Commitment storage c, uint32 day, SlashReason reason) private returns (uint256 amount) {
        amount = (c.stakeRemaining * c.slashBps + BPS_DENOMINATOR - 1) / BPS_DENOMINATOR;
        if (amount == 0) return 0;

        c.stakeRemaining -= amount;
        emit Slashed(c.owner, day, amount, reason);

        if (c.stakeRemaining == 0) {
            c.active = false;
            emit CommitmentDepleted(c.owner, day);
        }
    }

    /// @dev Pays accumulated slashes to the beneficiary with a bounded gas
    ///      stipend; on failure the funds go to the burn address instead so a
    ///      reverting beneficiary can never block settlement.
    function _payoutSlashes(Commitment storage c, uint256 amount) private {
        if (amount == 0) return;

        (bool ok,) = c.beneficiary.call{value: amount, gas: BENEFICIARY_GAS_STIPEND}("");
        if (!ok) {
            (ok,) = BURN_ADDRESS.call{value: amount}("");
            if (!ok) revert TransferFailed();
        }
    }
}
