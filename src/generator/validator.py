"""
Step 8 Verification and Integrity Validation Engine.
Runs comprehensive checks:
1. Primary-Key Uniqueness
2. Foreign-Key Integrity
3. Allowed Enum Membership
4. Date Ordering Constraints
5. Arithmetic & Labor Reconciliation
6. Lifecycle Transition State Consistency
7. Duplicate Shift & Double-Booking Detection
"""

from typing import Dict, Any, List
import pandas as pd
from datetime import datetime, timezone


class IntegrityValidator:
    """Validates relational datasets against enterprise data and labor constraints."""

    def __init__(self, data: Dict[str, pd.DataFrame]):
        self.data = data
        self.validation_errors: List[Dict[str, Any]] = []
        self.validation_warnings: List[Dict[str, Any]] = []

    def validate_all(self) -> Dict[str, Any]:
        """Runs the entire suite of 7 validation rules."""
        self.validation_errors.clear()
        self.validation_warnings.clear()

        self._check_primary_key_uniqueness()
        self._check_foreign_key_integrity()
        self._check_allowed_enums()
        self._check_date_ordering()
        self._check_arithmetic_reconciliation()
        self._check_lifecycle_transitions()
        self._check_duplicate_assignments()

        is_passed = len(self.validation_errors) == 0
        return {
            "passed": is_passed,
            "error_count": len(self.validation_errors),
            "warning_count": len(self.validation_warnings),
            "errors": self.validation_errors,
            "warnings": self.validation_warnings,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # 1. Primary Key Uniqueness
    def _check_primary_key_uniqueness(self):
        pk_map = {
            "employees": "emp_id",
            "teams": "team_id",
            "skills": "skill_id",
            "employee_skills": "bridge_id",
            "shift_templates": "shift_template_id",
            "coverage_requirements": "requirement_id",
            "shift_assignments": "assignment_id",
            "leave_requests": "leave_id",
            "holiday_calendar": "holiday_id" if "holiday_calendar" in self.data else ("holidays" if "holidays" in self.data else None),
            "attendance_events": "event_id",
            "swap_requests": "swap_id",
            "audit_events": "audit_id"
        }

        for tbl, pk in pk_map.items():
            if not pk or tbl not in self.data or self.data[tbl].empty:
                continue
            df = self.data[tbl]
            if pk not in df.columns:
                continue
            dups = df[df.duplicated(subset=[pk], keep=False)]
            if not dups.empty:
                self.validation_errors.append({
                    "rule": "PRIMARY_KEY_UNIQUENESS",
                    "table": tbl,
                    "field": pk,
                    "message": f"Found {len(dups)} duplicate primary key records in table '{tbl}' for key '{pk}'.",
                    "sample_keys": dups[pk].head(3).tolist()
                })

    # 2. Foreign Key Integrity
    def _check_foreign_key_integrity(self):
        fk_checks = [
            ("employees", "team_id", "teams", "team_id"),
            ("employee_skills", "emp_id", "employees", "emp_id"),
            ("employee_skills", "skill_id", "skills", "skill_id"),
            ("coverage_requirements", "team_id", "teams", "team_id"),
            ("coverage_requirements", "shift_template_id", "shift_templates", "shift_template_id"),
            ("coverage_requirements", "skill_id", "skills", "skill_id"),
            ("shift_assignments", "emp_id", "employees", "emp_id"),
            ("shift_assignments", "team_id", "teams", "team_id"),
            ("shift_assignments", "shift_template_id", "shift_templates", "shift_template_id"),
            ("shift_assignments", "assigned_skill_id", "skills", "skill_id"),
            ("leave_requests", "emp_id", "employees", "emp_id"),
            ("swap_requests", "requester_emp_id", "employees", "emp_id"),
            ("swap_requests", "target_emp_id", "employees", "emp_id")
        ]

        for child_tbl, child_fk, parent_tbl, parent_pk in fk_checks:
            if child_tbl not in self.data or parent_tbl not in self.data:
                continue
            c_df = self.data[child_tbl]
            p_df = self.data[parent_tbl]
            if child_fk not in c_df.columns or parent_pk not in p_df.columns:
                continue

            valid_parents = set(p_df[parent_pk].dropna())
            child_keys = c_df[child_fk].dropna()
            orphans = child_keys[~child_keys.isin(valid_parents)]

            if not orphans.empty:
                self.validation_errors.append({
                    "rule": "FOREIGN_KEY_INTEGRITY",
                    "table": child_tbl,
                    "field": child_fk,
                    "parent_table": parent_tbl,
                    "message": f"Found {len(orphans)} orphaned records in '{child_tbl}.{child_fk}' referencing missing '{parent_tbl}.{parent_pk}'.",
                    "sample_orphans": orphans.head(3).tolist()
                })

    # 3. Allowed Enum Membership
    def _check_allowed_enums(self):
        enum_map = {
            "employees": {
                "role": ["REGISTERED_NURSE", "CHARGE_NURSE", "CERTIFIED_NURSING_ASSISTANT", "MEDICAL_DOCTOR", "RESPIRATORY_THERAPIST", "WARD_COORDINATOR"],
                "status": ["ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"]
            },
            "skills": {
                "category": ["CLINICAL", "CERTIFICATION", "LEADERSHIP", "SPECIALIZATION"]
            },
            "shift_templates": {
                "name": ["DAY", "EVENING", "NIGHT"]
            },
            "shift_assignments": {
                "status": ["SCHEDULED", "CONFIRMED", "SWAPPED", "ABSENT", "CANCELLED", "COMPLETED"]
            },
            "leave_requests": {
                "leave_type": ["ANNUAL", "SICK", "EMERGENCY", "MATERNITY_PATERNITY", "UNPAID"],
                "status": ["SUBMITTED", "APPROVED", "REJECTED", "CANCELLED"]
            },
            "swap_requests": {
                "status": ["REQUESTED", "PEER_ACCEPTED", "MANAGER_APPROVED", "REJECTED", "EXECUTED", "CANCELLED"]
            }
        }

        for tbl, cols in enum_map.items():
            if tbl not in self.data or self.data[tbl].empty:
                continue
            df = self.data[tbl]
            for col, allowed in cols.items():
                if col not in df.columns:
                    continue
                invalid = df[~df[col].isin(allowed)]
                if not invalid.empty:
                    self.validation_errors.append({
                        "rule": "ENUM_MEMBERSHIP",
                        "table": tbl,
                        "field": col,
                        "message": f"Found {len(invalid)} invalid enum values in '{tbl}.{col}'. Allowed: {allowed}",
                        "sample_invalid": invalid[col].head(3).tolist()
                    })

    # 4. Date Ordering Constraints
    def _check_date_ordering(self):
        # Leave date ordering: start_date <= end_date
        if "leave_requests" in self.data and not self.data["leave_requests"].empty:
            df = self.data["leave_requests"]
            if "start_date" in df.columns and "end_date" in df.columns:
                inverted = df[df["start_date"] > df["end_date"]]
                if not inverted.empty:
                    self.validation_errors.append({
                        "rule": "DATE_ORDERING",
                        "table": "leave_requests",
                        "field": "start_date,end_date",
                        "message": f"Found {len(inverted)} leave requests where start_date > end_date.",
                        "sample_keys": inverted["leave_id"].head(3).tolist()
                    })

    # 5. Arithmetic & Labor Reconciliation
    def _check_arithmetic_reconciliation(self):
        if "coverage_requirements" in self.data and not self.data["coverage_requirements"].empty:
            df = self.data["coverage_requirements"]
            if "min_headcount" in df.columns and "target_headcount" in df.columns:
                invalid = df[df["min_headcount"] > df["target_headcount"]]
                if not invalid.empty:
                    self.validation_errors.append({
                        "rule": "ARITHMETIC_RECONCILIATION",
                        "table": "coverage_requirements",
                        "field": "min_headcount,target_headcount",
                        "message": f"Found {len(invalid)} coverage requirements where min_headcount > target_headcount.",
                        "sample_keys": invalid["requirement_id"].head(3).tolist()
                    })

    # 6. Lifecycle Transition State Consistency
    def _check_lifecycle_transitions(self):
        # Swap Request: Cannot be EXECUTED if approver_manager_id is NULL
        if "swap_requests" in self.data and not self.data["swap_requests"].empty:
            df = self.data["swap_requests"]
            if "status" in df.columns and "approver_manager_id" in df.columns:
                unapproved_executed = df[(df["status"] == "EXECUTED") & (df["approver_manager_id"].isna() | (df["approver_manager_id"] == ""))]
                if not unapproved_executed.empty:
                    # Captured as a warning/quarantine issue (Anomaly 5)
                    self.validation_warnings.append({
                        "rule": "LIFECYCLE_TRANSITION_ANOMALY",
                        "table": "swap_requests",
                        "field": "status,approver_manager_id",
                        "message": f"Detected {len(unapproved_executed)} swap requests marked EXECUTED without manager approval signature.",
                        "sample_keys": unapproved_executed["swap_id"].head(3).tolist()
                    })

    # 7. Duplicate Shift & Double-Booking Detection
    def _check_duplicate_assignments(self):
        if "shift_assignments" in self.data and not self.data["shift_assignments"].empty:
            df = self.data["shift_assignments"]
            if "emp_id" in df.columns and "date" in df.columns:
                double_booked = df[df.duplicated(subset=["emp_id", "date"], keep=False)]
                if not double_booked.empty:
                    # Captured as a warning/quarantine issue (Anomaly 1)
                    self.validation_warnings.append({
                        "rule": "DOUBLE_BOOKING_ANOMALY",
                        "table": "shift_assignments",
                        "field": "emp_id,date",
                        "message": f"Detected {len(double_booked)} shift assignment records with overlapping double-booking on the same day.",
                        "sample_employees": double_booked["emp_id"].unique()[:3].tolist()
                    })
