"""
Step 10 Verification Script: Demonstrates Deterministic Reproducibility.
Regenerates data twice with identical seed (20261022) into independent directories,
computes SHA-256 checksums, and asserts byte-level equivalence across all tables.
"""

import sys
import os
import shutil

# UTF-8 encoding guard for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.generator.synthesizer import SyntheticDataGenerator
from src.generator.validator import IntegrityValidator
from src.generator.export import DataExporter
from tabulate import tabulate


def run_reproducibility_audit(seed: int = 20261022, scale: str = "starter"):
    print("\n" + "=" * 75)
    print("🔬 STEP 10: Cryptographic Reproducibility Verification")
    print(f"Executing two independent generations with Seed={seed}, Scale={scale}")
    print("=" * 75)

    dir1 = "data/verify_run_1"
    dir2 = "data/verify_run_2"

    for d in [dir1, dir2]:
        if os.path.exists(d):
            shutil.rmtree(d)

    # Run 1
    print("\n  -> Generating Run 1...")
    gen1 = SyntheticDataGenerator(seed=seed, scale=scale)
    data1 = gen1.generate_all()
    val1 = IntegrityValidator(data1).validate_all()
    exp1 = DataExporter(data1, output_dir=dir1)
    man1 = exp1.export_all(seed, scale, "run_1", val1)

    # Run 2
    print("  -> Generating Run 2...")
    gen2 = SyntheticDataGenerator(seed=seed, scale=scale)
    data2 = gen2.generate_all()
    val2 = IntegrityValidator(data2).validate_all()
    exp2 = DataExporter(data2, output_dir=dir2)
    man2 = exp2.export_all(seed, scale, "run_2", val2)

    # Comparison
    print("\n  -> Comparing table row counts and SHA-256 checksums across runs...\n")
    all_match = True
    comparison_rows = []

    for tbl in man1["tables"].keys():
        t1 = man1["tables"][tbl]
        t2 = man2["tables"].get(tbl, {})

        count1 = t1["row_count"]
        count2 = t2.get("row_count", -1)
        sha1 = t1["csv_sha256"]
        sha2 = t2.get("csv_sha256", "")

        count_match = (count1 == count2)
        sha_match = (sha1 == sha2)
        status = "✓ 100% MATCH" if (count_match and sha_match) else "❌ MISMATCH"

        if not (count_match and sha_match):
            all_match = False

        comparison_rows.append([
            tbl,
            f"{count1} rows",
            f"{count2} rows",
            sha1[:10] + "...",
            sha2[:10] + "...",
            status
        ])

    print(tabulate(
        comparison_rows,
        headers=["Entity Table", "Run 1 Rows", "Run 2 Rows", "Run 1 SHA-256", "Run 2 SHA-256", "Verdict"],
        tablefmt="rounded_grid"
    ))

    # Cleanup verification dirs
    for d in [dir1, dir2]:
        if os.path.exists(d):
            shutil.rmtree(d)

    if all_match:
        print("\n🎉 STEP 10 AUDIT PASSED: 100% Deterministic Reproducibility Verified across all 13 tables!")
        return 0
    else:
        print("\n❌ STEP 10 AUDIT FAILED: Non-deterministic divergence detected.")
        return 1


if __name__ == "__main__":
    exit_code = run_reproducibility_audit()
    sys.exit(exit_code)
