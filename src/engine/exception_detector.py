"""
Exception Quarantine and Constraint Detection Engine.
Identifies labor violations, double-bookings, skill absences, and unapproved swaps.
Calculates Precision, Recall, and F1 against ground_truth.
Optimized with O(1) indexed lookups for sub-second execution at scale.
"""

from typing import Dict, Any, List, Set, Tuple
from datetime import datetime, date, timedelta
import pandas as pd


class ExceptionDetector:
    """Scans workforce schedules to detect exceptions and benchmark against ground truth."""

    def __init__(self, data: Dict[str, pd.DataFrame]):
        self.data = data
        self.detected_exceptions: List[Dict[str, Any]] = []

    def detect_all(self) -> Dict[str, Any]:
        """Runs the 5 anomaly detection passes."""
        self.detected_exceptions.clear()

        self._detect_double_bookings()
        self._detect_leave_overlaps()
        self._detect_missing_skills()
        self._detect_overtime_violations()
        self._detect_unapproved_swaps()

        df_exceptions = pd.DataFrame(self.detected_exceptions)

        # Benchmark against ground truth if present
        metrics = self._evaluate_against_ground_truth(df_exceptions)

        return {
            "exceptions": df_exceptions,
            "total_detected": len(df_exceptions),
            "by_type": df_exceptions["anomaly_type"].value_counts().to_dict() if not df_exceptions.empty else {},
            "evaluation_metrics": metrics
        }

    # 1. DOUBLE_BOOKED_EMPLOYEE
    def _detect_double_bookings(self):
        df = self.data.get("shift_assignments", pd.DataFrame())
        if df.empty or "emp_id" not in df.columns or "date" not in df.columns:
            return

        # Flag the overlapping assignment that creates the collision
        dups = df[df.duplicated(subset=["emp_id", "date"], keep="first")]
        for row in dups.itertuples(index=False):
            self.detected_exceptions.append({
                "exception_id": f"EXC-DB-{len(self.detected_exceptions) + 1:05d}",
                "entity_type": "ShiftAssignment",
                "entity_id": row.assignment_id,
                "anomaly_type": "DOUBLE_BOOKED_EMPLOYEE",
                "severity": "CRITICAL",
                "emp_id": row.emp_id,
                "date": row.date,
                "details": f"Employee {row.emp_id} assigned to overlapping shifts on {row.date}.",
                "recommended_action": "Cancel duplicate assignment or reassign to available peer."
            })

    # 2. LEAVE_OVERLAPPING_SHIFT
    def _detect_leave_overlaps(self):
        assign_df = self.data.get("shift_assignments", pd.DataFrame())
        leave_df = self.data.get("leave_requests", pd.DataFrame())

        if assign_df.empty or leave_df.empty:
            return

        approved_leaves = leave_df[leave_df["status"] == "APPROVED"]
        if approved_leaves.empty:
            return

        # Build fast map: (emp_id, date) -> leave_id
        leave_map = {}
        for lv in approved_leaves.itertuples(index=False):
            try:
                cur = date.fromisoformat(lv.start_date)
                end = date.fromisoformat(lv.end_date)
                while cur <= end:
                    leave_map[(lv.emp_id, cur.isoformat())] = lv.leave_id
                    cur += timedelta(days=1)
            except Exception:
                continue

        # Fast scan over assignments
        for row in assign_df[["assignment_id", "emp_id", "date"]].itertuples(index=False):
            key = (row.emp_id, row.date)
            if key in leave_map:
                lve_id = leave_map[key]
                self.detected_exceptions.append({
                    "exception_id": f"EXC-LV-{len(self.detected_exceptions) + 1:05d}",
                    "entity_type": "ShiftAssignment",
                    "entity_id": row.assignment_id,
                    "anomaly_type": "LEAVE_OVERLAPPING_SHIFT",
                    "severity": "HIGH",
                    "emp_id": row.emp_id,
                    "date": row.date,
                    "details": f"Shift on {row.date} conflicts with approved leave {lve_id}.",
                    "recommended_action": "Unassign employee and mark shift OPEN for float pool relief."
                })

    # 3. REQUIRED_SKILL_ABSENT
    def _detect_missing_skills(self):
        req_df = self.data.get("coverage_requirements", pd.DataFrame())
        assign_df = self.data.get("shift_assignments", pd.DataFrame())

        if req_df.empty or assign_df.empty:
            return

        # Precompute fast index: (team_id, date, shift_template_id) -> list of assigned_skill_id
        shift_skills_map: Dict[Tuple[str, str, str], List[str]] = {}
        for row in assign_df[["team_id", "date", "shift_template_id", "assigned_skill_id"]].itertuples(index=False):
            key = (row.team_id, row.date, row.shift_template_id)
            shift_skills_map.setdefault(key, []).append(row.assigned_skill_id)

        # Fast scan requirements
        for req in req_df.itertuples(index=False):
            key = (req.team_id, req.date, req.shift_template_id)
            assigned_skills = shift_skills_map.get(key, [])

            if len(assigned_skills) > 0:
                skill_count = assigned_skills.count(req.skill_id)
                if skill_count < int(req.min_headcount):
                    self.detected_exceptions.append({
                        "exception_id": f"EXC-SK-{len(self.detected_exceptions) + 1:05d}",
                        "entity_type": "CoverageRequirement",
                        "entity_id": req.requirement_id,
                        "anomaly_type": "REQUIRED_SKILL_ABSENT",
                        "severity": "CRITICAL",
                        "emp_id": None,
                        "date": req.date,
                        "details": f"Shift {req.shift_template_id} for team {req.team_id} on {req.date} is staffed but lacks mandatory certified skill {req.skill_id} (assigned={skill_count}, required={req.min_headcount}).",
                        "recommended_action": f"Reallocate staff certified in {req.skill_id} or call on-call specialist."
                    })

    # 4. OVERTIME_CAP_EXCEEDED
    def _detect_overtime_violations(self):
        assign_df = self.data.get("shift_assignments", pd.DataFrame())
        emp_df = self.data.get("employees", pd.DataFrame())

        if assign_df.empty or emp_df.empty:
            return

        emp_caps = emp_df.set_index("emp_id")["weekly_hours_cap"].to_dict()

        # Compute ISO week for each assignment
        df_copy = assign_df[["emp_id", "date", "scheduled_hours"]].copy()
        df_copy["iso_week"] = df_copy["date"].apply(
            lambda d: f"{date.fromisoformat(d).year}-W{date.fromisoformat(d).isocalendar()[1]:02d}"
        )

        weekly_totals = df_copy.groupby(["emp_id", "iso_week"])["scheduled_hours"].sum().reset_index()

        for row in weekly_totals.itertuples(index=False):
            emp_id = row.emp_id
            week = row.iso_week
            total_h = row.scheduled_hours
            cap = emp_caps.get(emp_id, 40.0)

            if total_h > cap:
                self.detected_exceptions.append({
                    "exception_id": f"EXC-OT-{len(self.detected_exceptions) + 1:05d}",
                    "entity_type": "Employee",
                    "entity_id": emp_id,
                    "anomaly_type": "OVERTIME_CAP_EXCEEDED",
                    "severity": "MEDIUM",
                    "emp_id": emp_id,
                    "date": week,
                    "details": f"Employee {emp_id} scheduled for {total_h}h in {week}, exceeding weekly cap of {cap}h.",
                    "recommended_action": "Require HR partner overtime authorization or rebalance shift load."
                })

    # 5. UNAPPROVED_SWAP_APPLIED
    def _detect_unapproved_swaps(self):
        swap_df = self.data.get("swap_requests", pd.DataFrame())
        if swap_df.empty:
            return

        illegal_swaps = swap_df[
            (swap_df["status"] == "EXECUTED") &
            (swap_df["approver_manager_id"].isna() | (swap_df["approver_manager_id"] == ""))
        ]

        for row in illegal_swaps.itertuples(index=False):
            self.detected_exceptions.append({
                "exception_id": f"EXC-SW-{len(self.detected_exceptions) + 1:05d}",
                "entity_type": "SwapRequest",
                "entity_id": row.swap_id,
                "anomaly_type": "UNAPPROVED_SWAP_APPLIED",
                "severity": "HIGH",
                "emp_id": row.requester_emp_id,
                "date": str(row.requested_at)[:10],
                "details": f"Swap {row.swap_id} executed without manager signoff.",
                "recommended_action": "Revert shift assignments to original holders pending manager review."
            })

    def _evaluate_against_ground_truth(self, detected_df: pd.DataFrame) -> Dict[str, Any]:
        """Calculates Precision, Recall, and F1 against ground_truth table."""
        gt_df = self.data.get("ground_truth", pd.DataFrame())
        if gt_df.empty or detected_df.empty:
            return {"precision": 1.0, "recall": 1.0, "f1_score": 1.0, "true_positives": 0}

        gt_entities = set(gt_df["entity_id"].dropna().tolist())
        detected_entities = set(detected_df["entity_id"].dropna().tolist())

        true_positives = len(detected_entities.intersection(gt_entities))
        false_positives = len(detected_entities - gt_entities)
        false_negatives = len(gt_entities - detected_entities)

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 1.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 1.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 1.0

        return {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "true_positives": true_positives,
            "false_positives": false_positives,
            "false_negatives": false_negatives,
            "ground_truth_total": len(gt_df)
        }
