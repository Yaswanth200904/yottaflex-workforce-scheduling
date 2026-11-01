"""Unit tests for Step 10 Deterministic Reproducibility."""

import pytest
from src.generator.synthesizer import SyntheticDataGenerator
from src.generator.export import DataExporter
from src.generator.validator import IntegrityValidator
import os
import shutil


def test_step_10_cryptographic_reproducibility():
    """
    Step 10: Regenerate twice with the same seed (20261022) and
    compare row counts and SHA-256 checksums to demonstrate reproducibility.
    """
    seed = 20261022
    scale = "starter"

    dir1 = "data/test_verify_1"
    dir2 = "data/test_verify_2"

    for d in [dir1, dir2]:
        if os.path.exists(d):
            shutil.rmtree(d)

    try:
        # Run 1
        gen1 = SyntheticDataGenerator(seed=seed, scale=scale)
        data1 = gen1.generate_all()
        val1 = IntegrityValidator(data1).validate_all()
        exp1 = DataExporter(data1, output_dir=dir1)
        man1 = exp1.export_all(seed, scale, "run_1", val1)

        # Run 2
        gen2 = SyntheticDataGenerator(seed=seed, scale=scale)
        data2 = gen2.generate_all()
        val2 = IntegrityValidator(data2).validate_all()
        exp2 = DataExporter(data2, output_dir=dir2)
        man2 = exp2.export_all(seed, scale, "run_2", val2)

        # Verify all table row counts and SHA-256 hashes match identically
        for tbl in man1["tables"].keys():
            t1 = man1["tables"][tbl]
            t2 = man2["tables"][tbl]

            assert t1["row_count"] == t2["row_count"], f"Row count mismatch in table {tbl}"
            assert t1["csv_sha256"] == t2["csv_sha256"], f"CSV SHA-256 mismatch in table {tbl}"
            assert t1["json_sha256"] == t2["json_sha256"], f"JSON SHA-256 mismatch in table {tbl}"

    finally:
        for d in [dir1, dir2]:
            if os.path.exists(d):
                shutil.rmtree(d)
