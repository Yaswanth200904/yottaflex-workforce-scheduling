"""
Step 4 & Step 9 CLI Entrypoint: Master Data Generator.
Usage:
    python scripts/run_generator.py --scale starter --seed 20261022
    python scripts/run_generator.py --scale full --seed 20261022
"""

import argparse
import sys
import os

# Guard UTF-8 on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.generator.synthesizer import SyntheticDataGenerator
from src.generator.validator import IntegrityValidator
from src.generator.export import DataExporter
from tabulate import tabulate


def main():
    parser = argparse.ArgumentParser(description="Deterministic Workforce Scheduling Data Generator")
    parser.add_argument("--scale", type=str, choices=["starter", "full"], default="starter",
                        help="Data scale: 'starter' (~1.5k records, 14 days) or 'full' (2k employees, 100 teams, 90 days, 5k leaves)")
    parser.add_argument("--seed", type=int, default=20261022, help="Fixed random seed (default: 20261022)")
    parser.add_argument("--output", type=str, default="data", help="Output directory")

    args = parser.parse_args()

    print("\n" + "=" * 70)
    print("⚡ YottaFlex Enterprise Workforce Scheduling — Data Generation Engine")
    print(f"Scale: {args.scale.upper()} | Seed: {args.seed} | Target: {args.output}")
    print("=" * 70)

    # 1. Synthesize Data
    print("\n[1/3] Synthesizing relational entities and injecting edge cases...")
    generator = SyntheticDataGenerator(seed=args.seed, scale=args.scale)
    data = generator.generate_all()

    # 2. Validate Relational Integrity (Step 8)
    print("[2/3] Running Step 8 Integrity Validation...")
    validator = IntegrityValidator(data)
    validation_report = validator.validate_all()

    if validation_report["passed"]:
        print("  ✓ Step 8 Validation Passed: All primary keys, foreign keys, and constraints verified!")
    else:
        print(f"  ⚠ Validation Warnings/Errors: {validation_report['error_count']} errors, {validation_report['warning_count']} warnings")

    # 3. Export Data (Step 9)
    print(f"[3/3] Exporting CSV, JSON, and SQLite database to '{args.output}'...")
    exporter = DataExporter(data, output_dir=args.output)
    cmd_str = f"python scripts/run_generator.py --scale {args.scale} --seed {args.seed}"
    manifest = exporter.export_all(args.seed, args.scale, cmd_str, validation_report)

    # Summary Display
    table_rows = []
    for tbl_name, meta in manifest["tables"].items():
        table_rows.append([tbl_name, meta["row_count"], meta["csv_sha256"][:12] + "..."])

    print("\n" + tabulate(table_rows, headers=["Entity Table", "Row Count", "CSV SHA-256 (Prefix)"], tablefmt="rounded_grid"))
    print(f"\n✓ Generation Complete! Output persisted to: {os.path.abspath(args.output)}")
    print(f"✓ SQLite Database: {os.path.abspath(os.path.join(args.output, 'database.sqlite'))}")
    print(f"✓ Source Manifest: {os.path.abspath(os.path.join(args.output, 'manifest.json'))}\n")


if __name__ == "__main__":
    main()
