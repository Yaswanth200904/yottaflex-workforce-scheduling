"""Unit tests for optimization solver, exception detector, and swap engine."""

import pytest
from src.generator.synthesizer import SyntheticDataGenerator
from src.engine.solver import ScheduleOptimizer
from src.engine.exception_detector import ExceptionDetector
from src.engine.swap_manager import SwapManager
from src.engine.attendance_reconciliation import AttendanceReconciler


def test_schedule_solver():
    """Verify solver execution and fairness constraint satisfaction."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    solver = ScheduleOptimizer(
        employees=data["employees"],
        teams=data["teams"],
        skills=data["skills"],
        employee_skills=data["employee_skills"],
        shift_templates=data["shift_templates"],
        coverage_requirements=data["coverage_requirements"],
        leave_requests=data["leave_requests"],
        holidays=data["holidays"]
    )
    result = solver.solve()

    assert not result["assignments"].empty
    assert "fairness_gini" in result
    assert result["fairness_gini"] >= 0.0


def test_exception_detector():
    """Verify detection of the 5 injected edge cases."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    detector = ExceptionDetector(data)
    result = detector.detect_all()

    assert result["total_detected"] > 0
    by_type = result["by_type"]
    assert "DOUBLE_BOOKED_EMPLOYEE" in by_type
    assert "LEAVE_OVERLAPPING_SHIFT" in by_type
    assert "REQUIRED_SKILL_ABSENT" in by_type
    assert "OVERTIME_CAP_EXCEEDED" in by_type
    assert "UNAPPROVED_SWAP_APPLIED" in by_type


def test_swap_manager():
    """Verify manager approval and state transition in swap workflow."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    swap_mgr = SwapManager(
        swap_requests=data["swap_requests"],
        shift_assignments=data["shift_assignments"],
        employee_skills=data["employee_skills"],
        audit_events=data["audit_events"]
    )

    # Pick first pending/requested swap
    swap_id = data["swap_requests"].iloc[0]["swap_id"]
    res = swap_mgr.approve_and_execute_swap(swap_id, manager_emp_id="EMP-000001", actor_role="Manager")
    assert res["success"] is True

    # Verify status changed to EXECUTED
    updated_swap = swap_mgr.swap_requests[swap_mgr.swap_requests["swap_id"] == swap_id].iloc[0]
    assert updated_swap["status"] == "EXECUTED"
    assert updated_swap["approver_manager_id"] == "EMP-000001"


def test_attendance_reconciler():
    """Verify attendance clock reconciliation against schedules."""
    gen = SyntheticDataGenerator(seed=20261022, scale="starter")
    data = gen.generate_all()

    reconciler = AttendanceReconciler(data["shift_assignments"], data["attendance_events"])
    rec_res = reconciler.reconcile()

    assert rec_res["total_evaluated"] > 0
    assert rec_res["compliance_rate"] >= 0.0
