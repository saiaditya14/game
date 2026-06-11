from __future__ import annotations

import argparse
import math
import random
import re
from dataclasses import dataclass
from pathlib import Path


BOARD_FILE = Path("src/games/sugar/monopoly/MonopolyBoard.jsx")
DEFAULT_CANDIDATES = [
    "1d4",
    "1d6",
    "1d8",
    "2d4",
    "2d6",
    "2d8",
    "3d4",
    "3d6",
    "1d10",
    "2d10",
]


@dataclass(frozen=True)
class Dice:
    count: int
    sides: int

    @property
    def label(self) -> str:
        return f"{self.count}d{self.sides}"

    @property
    def expected_roll(self) -> float:
        return self.count * (self.sides + 1) / 2

    def roll(self, rng: random.Random) -> int:
        return sum(rng.randint(1, self.sides) for _ in range(self.count))


def load_board_spaces() -> list[tuple[int, str]]:
    text = BOARD_FILE.read_text(encoding="utf-8")
    spaces: list[tuple[int, str]] = []

    for match in re.finditer(r"\{\s*id:\s*(\d+),\s*name:\s*'([^']+)'", text):
        spaces.append((int(match.group(1)), match.group(2)))

    if not spaces:
        raise RuntimeError(f"No spaces found in {BOARD_FILE}")

    expected_ids = list(range(len(spaces)))
    actual_ids = [space_id for space_id, _ in spaces]
    if actual_ids != expected_ids:
        raise RuntimeError(
            f"Board IDs are not contiguous in movement order: {actual_ids[:5]}..."
        )

    return spaces


def parse_dice(label: str) -> Dice:
    match = re.fullmatch(r"(\d+)d(\d+)", label.strip().lower())
    if not match:
        raise argparse.ArgumentTypeError(f"Use NdS format, such as 2d6: {label}")

    count = int(match.group(1))
    sides = int(match.group(2))
    if count < 1 or sides < 2:
        raise argparse.ArgumentTypeError(f"Dice must have count >= 1 and sides >= 2: {label}")

    return Dice(count, sides)


def simulate(dice: Dice, board_size: int, turns: int, seed: int) -> dict[str, float]:
    rng = random.Random(seed)
    position = 0
    landings = [0] * board_size
    laps = 0
    first_lap_turns: list[int] = []
    turns_since_lap = 0

    for _ in range(turns):
        roll = dice.roll(rng)
        turns_since_lap += 1
        next_position = position + roll

        if next_position >= board_size:
            laps += next_position // board_size
            first_lap_turns.append(turns_since_lap)
            turns_since_lap = 0

        position = next_position % board_size
        landings[position] += 1

    expected = turns / board_size
    freqs = [count / turns for count in landings]
    variance = sum((count - expected) ** 2 for count in landings) / board_size
    stddev_count = math.sqrt(variance)
    stddev_freq = stddev_count / turns
    uniform_freq = 1 / board_size
    cv = stddev_freq / uniform_freq
    chi_square = sum((count - expected) ** 2 / expected for count in landings)
    max_abs_dev = max(abs(freq - uniform_freq) for freq in freqs)

    return {
        "min_freq": min(freqs),
        "max_freq": max(freqs),
        "stddev_freq": stddev_freq,
        "cv": cv,
        "chi_square": chi_square,
        "max_abs_dev": max_abs_dev,
        "sim_turns_per_lap": turns / laps if laps else float("inf"),
        "mean_lap_segment": sum(first_lap_turns) / len(first_lap_turns),
        "expected_turns_per_lap": board_size / dice.expected_roll,
        "expected_roll": dice.expected_roll,
    }


def simulate_short_runs(
    dice: Dice, board_size: int, runs: int, laps: int, seed: int
) -> dict[str, float]:
    rng = random.Random(seed)
    uniform_freq = 1 / board_size
    total_coverage = 0.0
    total_turns = 0.0
    total_cv = 0.0
    total_mean_abs_dev = 0.0
    total_max_abs_dev = 0.0
    worst_coverage = 1.0
    best_coverage = 0.0

    for _ in range(runs):
        position = 0
        crossed_laps = 0
        turns = 0
        landings = [0] * board_size

        while crossed_laps < laps:
            roll = dice.roll(rng)
            next_position = position + roll
            crossed_laps += next_position // board_size
            position = next_position % board_size
            landings[position] += 1
            turns += 1

        hit_count = sum(1 for count in landings if count > 0)
        coverage = hit_count / board_size
        freqs = [count / turns for count in landings]
        stddev_freq = math.sqrt(
            sum((freq - uniform_freq) ** 2 for freq in freqs) / board_size
        )
        cv = stddev_freq / uniform_freq
        mean_abs_dev = sum(abs(freq - uniform_freq) for freq in freqs) / board_size
        max_abs_dev = max(abs(freq - uniform_freq) for freq in freqs)

        total_coverage += coverage
        total_turns += turns
        total_cv += cv
        total_mean_abs_dev += mean_abs_dev
        total_max_abs_dev += max_abs_dev
        worst_coverage = min(worst_coverage, coverage)
        best_coverage = max(best_coverage, coverage)

    return {
        "coverage": total_coverage / runs,
        "worst_coverage": worst_coverage,
        "best_coverage": best_coverage,
        "turns": total_turns / runs,
        "cv": total_cv / runs,
        "mean_abs_dev": total_mean_abs_dev / runs,
        "max_abs_dev": total_max_abs_dev / runs,
    }


def format_pct(value: float) -> str:
    return f"{value * 100:.3f}%"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Compare Monopoly dice setups on a simple circular board."
    )
    parser.add_argument("--turns", type=int, default=1_000_000)
    parser.add_argument("--short-runs", type=int, default=10_000)
    parser.add_argument("--short-laps", type=int, default=20)
    parser.add_argument("--seed", type=int, default=20260611)
    parser.add_argument("--dice", nargs="*", type=parse_dice)
    args = parser.parse_args()

    spaces = load_board_spaces()
    board_size = len(spaces)
    dice_options = args.dice or [parse_dice(candidate) for candidate in DEFAULT_CANDIDATES]

    print(f"Board: {board_size} spaces from {BOARD_FILE}")
    print(f"Order: {spaces[0][1]} -> {spaces[1][1]} -> ... -> {spaces[-1][1]} -> {spaces[0][1]}")
    print(f"Simulation: {args.turns:,} turns per setup, seed {args.seed}")
    print("Rules: circular movement only; no doubles, jail, cards, taxes, or portals.\n")

    rows = []
    for index, dice in enumerate(dice_options):
        metrics = simulate(dice, board_size, args.turns, args.seed + index)
        rows.append((dice, metrics))

    rows.sort(key=lambda row: (row[1]["cv"], abs(row[1]["expected_turns_per_lap"] - 8)))

    print(
        "Dice   E[roll]  E turns/lap  Sim turns/lap  Min freq  Max freq  "
        "Stddev    CV       Chi-ish"
    )
    print("-" * 91)
    for dice, metrics in rows:
        print(
            f"{dice.label:<6}"
            f"{metrics['expected_roll']:>7.2f}"
            f"{metrics['expected_turns_per_lap']:>13.2f}"
            f"{metrics['sim_turns_per_lap']:>15.2f}"
            f"{format_pct(metrics['min_freq']):>10}"
            f"{format_pct(metrics['max_freq']):>10}"
            f"{format_pct(metrics['stddev_freq']):>9}"
            f"{metrics['cv']:>9.4f}"
            f"{metrics['chi_square']:>11.1f}"
        )

    print(
        f"\nShort-run coverage: {args.short_runs:,} games, "
        f"stopping each game after {args.short_laps} laps"
    )
    print(
        "Dice   Avg turns  Avg hit  Worst hit  Best hit  "
        "Avg CV   Mean abs dev  Max abs dev"
    )
    print("-" * 82)
    short_rows = []
    for index, dice in enumerate(dice_options):
        metrics = simulate_short_runs(
            dice, board_size, args.short_runs, args.short_laps, args.seed + 10_000 + index
        )
        short_rows.append((dice, metrics))

    short_rows.sort(key=lambda row: (-row[1]["coverage"], row[1]["cv"]))
    for dice, metrics in short_rows:
        print(
            f"{dice.label:<6}"
            f"{metrics['turns']:>10.1f}"
            f"{format_pct(metrics['coverage']):>9}"
            f"{format_pct(metrics['worst_coverage']):>11}"
            f"{format_pct(metrics['best_coverage']):>10}"
            f"{metrics['cv']:>8.3f}"
            f"{format_pct(metrics['mean_abs_dev']):>15}"
            f"{format_pct(metrics['max_abs_dev']):>13}"
        )

    print("\nNotes:")
    print("- Long-run fairness is mostly excellent when roll support has gcd 1 with 56.")
    print("- Pacing is mainly controlled by E[roll]: expected turns per lap = 56 / E[roll].")
    print("- Short-run coverage is often more useful for real games than long-run fairness.")
    print("- One die gives flatter roll probabilities but swingier movement; multiple dice cluster near the mean.")
    print("- If you later add jail/cards/portals, rerun this with those rules because they can dominate landings.")


if __name__ == "__main__":
    main()
