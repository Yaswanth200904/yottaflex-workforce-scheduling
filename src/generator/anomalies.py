"""
Anomaly Injection and Ground Truth Tracking Engine.
Fulfills Step 5 & Step 7 of the specification:
Injects 5 labelled edge cases and produces a strict separate ground_truth record.
Never leaks ground truth labels into production input features.

Required Edge Cases / Negative Scenarios:
1. DOUBLE_BOOKED_EMPLOYEE (Employee double-booked across overlapping shifts)
2. LEAVE_OVERLAPPING_SHIFT (Approved leave overlaps assigned shift)
3. REQUIRED_SKILL_ABSENT (Shift staffed without required skill)
4. OVERTIME_CAP_EXCEEDED (Weekly overtime cap exceeded without authorization)
5. UNAPPROVED_SWAP_APPLIED (Shift swap executed without manager approval)
"""

from typing import List, Dict, Any, Tuple
import random
from datetime import datetime


class AnomalyManager:
    """Manages injection of explicit labelled edge cases and ground truth ledger."""

    def __init__(self, rng: random.Random):
        self.rng = rng
        self.ground_truth_records: List[Dict[str, Any]] = []

    def record_ground_truth(
        self,
        entity_type: str,
        entity_id: str,
        anomaly_type: str,
        description: str,
        field_affected: str,
        raw_value: Any,
        expected_clean_value: Any,
        detection_rule: str
    ):
        """Records ground truth in separate ledger (Step 7)."""
        benchmark_timestamp = "2026-10-30T00:00:00"
        self.ground_truth_records.append({
            "ground_truth_id": f"GT-{len(self.ground_truth_records) + 1:06d}",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "anomaly_type": anomaly_type,
            "description": description,
            "field_affected": field_affected,
            "raw_value": str(raw_value),
            "expected_clean_value": str(expected_clean_value),
            "detection_rule": detection_rule,
            "flagged_at": benchmark_timestamp
        })

    def inject_double_booked_employee(
        self,
        assignments: List[Dict[str, Any]],
        employees: List[Dict[str, Any]],
        shift_templates: List[Dict[str, Any]],
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Anomaly 1: DOUBLE_BOOKED_EMPLOYEE
        Injects a second overlapping shift assignment for the same employee on the same date.
        """
        if not assignments:
            return assignments

        # Pick candidate assignments to clone with an overlapping shift
        candidates = self.rng.sample(assignments, min(count, len(assignments)))
        for base in candidates:
            emp_id = base["emp_id"]
            shift_date = base["date"]
            current_template = base["shift_template_id"]
            
            # Select an alternative template (e.g. DAY vs NIGHT) that conflicts
            alt_template = "TEMPL-002" if current_template == "TEMPL-001" else "TEMPL-001"
            
            duplicate_id = f"SHIFT-{shift_date}-B-{len(assignments) + 1:06d}"
            duplicate_assignment = {
                "assignment_id": duplicate_id,
                "date": shift_date,
                "shift_template_id": alt_template,
                "emp_id": emp_id,
                "team_id": base["team_id"],
                "assigned_skill_id": base["assigned_skill_id"],
                "status": "SCHEDULED",
                "scheduled_hours": 8.0,
                "is_overtime": False,
                "created_at": base["created_at"]
            }
            assignments.append(duplicate_assignment)

            self.record_ground_truth(
                entity_type="ShiftAssignment",
                entity_id=duplicate_id,
                anomaly_type="DOUBLE_BOOKED_EMPLOYEE",
                description=f"Employee {emp_id} is double-booked on {shift_date} across multiple shifts ({current_template} and {alt_template}).",
                field_affected="emp_id,date,shift_template_id",
                raw_value=f"{emp_id}@{shift_date}:[{current_template},{alt_template}]",
                expected_clean_value="Single shift per employee per 24h cycle",
                detection_rule="COUNT(assignment_id) WHERE emp_id=X AND date=Y GROUP BY emp_id, date HAVING COUNT(*) > 1"
            )

        return assignments

    def inject_leave_overlapping_shift(
        self,
        assignments: List[Dict[str, Any]],
        leave_requests: List[Dict[str, Any]],
        count: int = 5
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Anomaly 2: LEAVE_OVERLAPPING_SHIFT
        Creates an approved leave request for an employee who is simultaneously scheduled for a shift.
        """
        if not assignments or not leave_requests:
            return assignments, leave_requests

        scheduled_assignments = [a for a in assignments if a["status"] == "SCHEDULED"]
        sample_assignments = self.rng.sample(scheduled_assignments, min(count, len(scheduled_assignments)))

        for assign in sample_assignments:
            emp_id = assign["emp_id"]
            assign_date = assign["date"]

            # Create an APPROVED leave overlapping this date
            leave_id = f"LVE-2026-{900000 + len(self.ground_truth_records):06d}"
            overlapping_leave = {
                "leave_id": leave_id,
                "emp_id": emp_id,
                "leave_type": "ANNUAL",
                "start_date": assign_date,
                "end_date": assign_date,
                "status": "APPROVED",
                "reason": "Family vacation (injected overlap conflict)",
                "approver_emp_id": "EMP-000001",
                "submitted_at": "2026-01-05T08:00:00",
                "decided_at": "2026-01-06T10:00:00"
            }
            leave_requests.append(overlapping_leave)

            self.record_ground_truth(
                entity_type="ShiftAssignment",
                entity_id=assign["assignment_id"],
                anomaly_type="LEAVE_OVERLAPPING_SHIFT",
                description=f"Employee {emp_id} has active scheduled shift on {assign_date} during approved leave {leave_id}.",
                field_affected="status,date",
                raw_value=f"SCHEDULED during APPROVED leave {leave_id}",
                expected_clean_value="Shift cancelled, reassigned, or marked ON_LEAVE",
                detection_rule="EXISTS(LeaveRequest WHERE emp_id=X AND status='APPROVED' AND date BETWEEN start_date AND end_date)"
            )

        return assignments, leave_requests

    def inject_required_skill_absent(
        self,
        assignments: List[Dict[str, Any]],
        coverage_requirements: List[Dict[str, Any]],
        employee_skills: List[Dict[str, Any]],
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Anomaly 3: REQUIRED_SKILL_ABSENT
        Modifies a shift's assigned staff so that none of the assigned employees have the mandatory required skill.
        """
        if not coverage_requirements or not assignments:
            return assignments

        # Build lookup of employee skills
        emp_skill_map = {}
        for es in employee_skills:
            emp_skill_map.setdefault(es["emp_id"], set()).add(es["skill_id"])

        sample_reqs = self.rng.sample(coverage_requirements, min(count, len(coverage_requirements)))

        for req in sample_reqs:
            req_skill = req["skill_id"]
            team_id = req["team_id"]
            req_date = req["date"]
            shift_template = req["shift_template_id"]

            # Find assignments for this team/date/shift
            matching_assignments = [
                a for a in assignments
                if a["team_id"] == team_id and a["date"] == req_date and a["shift_template_id"] == shift_template
            ]

            if matching_assignments:
                target_assign = matching_assignments[0]
                # Change the assigned_skill_id to a different, non-matching generic skill
                alt_skill = "SKILL-006" if req_skill != "SKILL-006" else "SKILL-005"
                target_assign["assigned_skill_id"] = alt_skill

                self.record_ground_truth(
                    entity_type="CoverageRequirement",
                    entity_id=req["requirement_id"],
                    anomaly_type="REQUIRED_SKILL_ABSENT",
                    description=f"Shift on {req_date} ({shift_template}) requires mandatory skill {req_skill}, but no assigned staff holds this certification.",
                    field_affected="assigned_skill_id",
                    raw_value=f"assigned={alt_skill}, required={req_skill}",
                    expected_clean_value=f"At least {req['min_headcount']} staff certified in {req_skill}",
                    detection_rule="COUNT(assigned staff with req_skill) < min_headcount"
                )

        return assignments

    def inject_overtime_cap_exceeded(
        self,
        assignments: List[Dict[str, Any]],
        employees: List[Dict[str, Any]],
        leave_requests: List[Dict[str, Any]] = None,
        count: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Anomaly 4: OVERTIME_CAP_EXCEEDED
        Over-allocates an employee to 7 consecutive 8-hour shifts in a single week (56.0 hours > 40.0h cap)
        without flagging or authorizing the overtime.
        """
        if not employees or not assignments:
            return assignments

        # Pick a target week: 2026-01-12 to 2026-01-18
        dates_in_week = [
            "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15",
            "2026-01-16", "2026-01-17", "2026-01-18"
        ]

        # Extract employees on leave during dates_in_week
        leave_emps = set()
        if leave_requests:
            for lv in leave_requests:
                if lv["status"] == "APPROVED":
                    if any(lv["start_date"] <= d <= lv["end_date"] for d in dates_in_week):
                        leave_emps.add(lv["emp_id"])

        # Filter employees without existing assignments or leaves in this week
        candidate_emps = []
        for emp in employees:
            emp_id = emp["emp_id"]
            if emp_id in leave_emps:
                continue
            assigned_dates = {a["date"] for a in assignments if a["emp_id"] == emp_id}
            if not any(d in assigned_dates for d in dates_in_week):
                candidate_emps.append(emp)

        sample_emps = self.rng.sample(candidate_emps, min(count, len(candidate_emps))) if candidate_emps else self.rng.sample(employees, min(count, len(employees)))

        for emp in sample_emps:
            emp_id = emp["emp_id"]
            # Assign 8 hours every day in the week (total 56 hours)
            for d in dates_in_week:
                new_assign_id = f"SHIFT-{d}-A-{len(assignments) + 1:06d}"
                assignments.append({
                    "assignment_id": new_assign_id,
                    "date": d,
                    "shift_template_id": "TEMPL-001",
                    "emp_id": emp_id,
                    "team_id": emp["team_id"],
                    "assigned_skill_id": "SKILL-001",
                    "status": "SCHEDULED",
                    "scheduled_hours": 8.0,
                    "is_overtime": False,  # Deliberately unflagged violation
                    "created_at": "2026-01-01T00:00:00"
                })

            self.record_ground_truth(
                entity_type="Employee",
                entity_id=emp_id,
                anomaly_type="OVERTIME_CAP_EXCEEDED",
                description=f"Employee {emp_id} scheduled for 56.0 hours in week 2026-W03, exceeding weekly cap of {emp['weekly_hours_cap']} hours without waiver.",
                field_affected="weekly_hours_cap,scheduled_hours",
                raw_value="56.0 hours (7 consecutive days)",
                expected_clean_value=f"<= {emp['weekly_hours_cap']} hours / max 5 consecutive days",
                detection_rule="SUM(scheduled_hours) GROUP BY emp_id, ISO_WEEK > weekly_hours_cap"
            )

        return assignments

    def inject_unapproved_swap_applied(
        self,
        swap_requests: List[Dict[str, Any]],
        assignments: List[Dict[str, Any]],
        count: int = 5
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Anomaly 5: UNAPPROVED_SWAP_APPLIED
        Executes a swap directly from REQUESTED to EXECUTED without obtaining MANAGER_APPROVED status.
        """
        if len(assignments) < 2:
            return swap_requests, assignments

        for i in range(min(count, len(assignments) // 2)):
            a1 = assignments[i * 2]
            a2 = assignments[i * 2 + 1]

            swap_id = f"SWP-2026-{800000 + i + 1:06d}"
            
            # Record an illegal swap that is EXECUTED without manager approval
            illegal_swap = {
                "swap_id": swap_id,
                "requester_emp_id": a1["emp_id"],
                "requester_assignment_id": a1["assignment_id"],
                "target_emp_id": a2["emp_id"],
                "target_assignment_id": a2["assignment_id"],
                "reason": "Personal family commitment",
                "status": "EXECUTED",  # Invalid lifecycle jump!
                "approver_manager_id": None,  # No manager approval!
                "requested_at": "2026-01-10T14:30:00",
                "decided_at": None
            }
            swap_requests.append(illegal_swap)

            # Illegally swap the owners in assignments
            emp1, emp2 = a1["emp_id"], a2["emp_id"]
            a1["emp_id"] = emp2
            a1["status"] = "SWAPPED"
            a2["emp_id"] = emp1
            a2["status"] = "SWAPPED"

            self.record_ground_truth(
                entity_type="SwapRequest",
                entity_id=swap_id,
                anomaly_type="UNAPPROVED_SWAP_APPLIED",
                description=f"Shift swap {swap_id} executed between {emp1} and {emp2} without required MANAGER_APPROVED status or manager signature.",
                field_affected="status,approver_manager_id",
                raw_value="status=EXECUTED, approver_manager_id=None",
                expected_clean_value="status=MANAGER_APPROVED before EXECUTED",
                detection_rule="status='EXECUTED' AND (approver_manager_id IS NULL OR prior_state != 'MANAGER_APPROVED')"
            )

        return swap_requests, assignments
