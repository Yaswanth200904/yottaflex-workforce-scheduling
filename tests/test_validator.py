"""Unit tests for Step 8 Relational Integrity Validator."""

import pytest
from src.generator.synthesizer import SyntheticDataGenerator
from src.generator.validator import IntegrityValidator


def test_integrity_validator_clean_run():
    """Verify that generated baseline data satisfies all relational integrity checks."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    validator = IntegrityValidator(data)
    report = validator.validate_all()

    # Step 8 rule: 0 hard errors
    assert report["error_count"] == 0, f"Validator found errors: {report['errors']}"
    assert report["passed"] is True
