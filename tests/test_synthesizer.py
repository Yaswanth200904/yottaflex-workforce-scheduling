"""Unit tests for synthetic data generation and nomenclature conventions."""

import pytest
import re
from src.generator.synthesizer import SyntheticDataGenerator


def test_generator_starter_scale():
    """Verify generator execution and table schema on starter scale."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    expected_tables = [
        "employees", "teams", "skills", "employee_skills", "shift_templates",
        "coverage_requirements", "shift_assignments", "leave_requests",
        "holidays", "attendance_events", "swap_requests", "audit_events", "ground_truth"
    ]

    for tbl in expected_tables:
        assert tbl in data, f"Missing table: {tbl}"
        assert not data[tbl].empty, f"Table {tbl} is unexpectedly empty"


def test_nomenclature_conventions():
    """
    Verify Step 3 deterministic ID conventions:
    EMP-000001; SHIFT-2026-01-01-A-000001; LVE-2026-000001; ATT-EMP-000001-...; SWP-2026-000001.
    """
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    # Employee ID: EMP-000001
    for emp_id in data["employees"]["emp_id"].head(20):
        assert re.match(r"^EMP-\d{6}$", emp_id), f"Invalid Employee ID: {emp_id}"

    # Shift Assignment ID: SHIFT-YYYY-MM-DD-A-...
    for a_id in data["shift_assignments"]["assignment_id"].head(20):
        assert re.match(r"^SHIFT-\d{4}-\d{2}-\d{2}-[A-Z]-\d{6}$", a_id), f"Invalid Shift ID: {a_id}"

    # Leave Request ID: LVE-2026-000001
    for l_id in data["leave_requests"]["leave_id"].head(20):
        assert re.match(r"^LVE-\d{4}-\d{6}$", l_id), f"Invalid Leave ID: {l_id}"

    # Attendance Event ID: ATT-EMP-000001-...
    for att_id in data["attendance_events"]["event_id"].head(20):
        assert re.match(r"^ATT-EMP-\d{6}-\d{8}T\d{6}$", att_id), f"Invalid Attendance ID: {att_id}"

    # Swap Request ID: SWP-2026-000001
    for swp_id in data["swap_requests"]["swap_id"].head(20):
        assert re.match(r"^SWP-\d{4}-\d{6}$", swp_id), f"Invalid Swap ID: {swp_id}"
