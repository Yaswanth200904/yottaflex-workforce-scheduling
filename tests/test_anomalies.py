"""Unit tests for the 5 injected edge cases and ground truth isolation."""

import pytest
from src.generator.synthesizer import SyntheticDataGenerator


def test_injected_anomalies_and_ground_truth():
    """
    Fulfills Step 5 & Step 7:
    Verify presence of all 5 labelled edge cases in separate ground_truth:
    1. Employee double-booked
    2. Approved leave overlaps assigned shift
    3. Required skill absent
    4. Overtime cap exceeded
    5. Swap applied without approval
    """
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    gt = data["ground_truth"]
    assert not gt.empty
    anomaly_types = set(gt["anomaly_type"].tolist())

    assert "DOUBLE_BOOKED_EMPLOYEE" in anomaly_types
    assert "LEAVE_OVERLAPPING_SHIFT" in anomaly_types
    assert "REQUIRED_SKILL_ABSENT" in anomaly_types
    assert "OVERTIME_CAP_EXCEEDED" in anomaly_types
    assert "UNAPPROVED_SWAP_APPLIED" in anomaly_types

    # Ensure ground truth is separated and not leaking into production input features
    assignments = data["shift_assignments"]
    assert "ground_truth_id" not in assignments.columns
    assert "anomaly_type" not in assignments.columns
    assert "detection_rule" not in assignments.columns

    swaps = data["swap_requests"]
    assert "ground_truth_id" not in swaps.columns
