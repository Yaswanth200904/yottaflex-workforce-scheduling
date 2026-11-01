"""
Master Deterministic Synthetic Data Generator.
Fulfills Steps 2, 3, 4, 5, 6, 7 of the specification:
1. Generates Master entities: Team, Skill, ShiftTemplate, HolidayCalendar, Employee, EmployeeSkill.
2. Generates Coverage Requirements per team and shift.
3. Generates Leave Requests with realistic approval distributions.
4. Generates Shift Assignments honoring availability, skills, and labor constraints.
5. Generates Attendance clock-in/out events and Swap Requests.
6. Injects 5 labelled edge cases and produces separate ground_truth records.
7. Logs all state transitions into the immutable AuditEvent ledger.
8. Parameterized for starter (fast ~1,500 records) and full (2,000 employees, 100 teams, 90 days, 5,000 leaves) with fixed seed.
"""

import random
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Tuple
import pandas as pd

from src.generator.anomalies import AnomalyManager
from src.models.entities import (
    EmployeeRole, EmployeeStatus, SkillCategory, SkillProficiency,
    ShiftType, AssignmentStatus, LeaveType, LeaveStatus, SwapStatus,
    AttendanceEventType, AttendanceSource, AuditAction
)


# =====================================================================
# SEED REFERENCE DATA
# =====================================================================

FIRST_NAMES = [
    "Aarav", "Aditi", "Akhil", "Ananya", "Arjun", "Bhavya", "Chaitanya", "Deepika",
    "Divya", "Gautam", "Harini", "Ishaan", "Kavya", "Madhav", "Manish", "Meera",
    "Naveen", "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul", "Rakesh",
    "Riya", "Rohan", "Sanjay", "Sanjana", "Shreya", "Siddharth", "Sneha", "Srikanth",
    "Suresh", "Swathi", "Tarun", "Varun", "Venkatesh", "Vidya", "Vikram", "Yashwanth"
]

LAST_NAMES = [
    "Reddy", "Sharma", "Verma", "Rao", "Patel", "Nair", "Iyer", "Choudhury",
    "Gupta", "Kulkarni", "Deshmukh", "Bhatt", "Joshi", "Menon", "Pillai", "Das",
    "Chatterjee", "Banerjee", "Kapoor", "Malhotra", "Mehta", "Singh", "Yadav"
]

DEPARTMENTS = [
    ("Intensive Care Unit (ICU)", "Critical Care"),
    ("Emergency Department (ED)", "Emergency"),
    ("Surgical Ward A", "Surgical"),
    ("Surgical Ward B", "Surgical"),
    ("Oncology Inpatient Ward", "Inpatient"),
    ("Cardiology Telemetry Ward", "Inpatient"),
    ("Pediatric Care Unit", "Pediatrics"),
    ("Neonatal ICU (NICU)", "Critical Care"),
    ("Orthopedic & Trauma Ward", "Inpatient"),
    ("Neurology & Stroke Center", "Critical Care")
]

SKILLS_SEED = [
    {"id": "SKILL-001", "name": "Basic Life Support (BLS)", "category": "CERTIFICATION", "desc": "Cardiopulmonary resuscitation and airway relief."},
    {"id": "SKILL-002", "name": "Advanced Cardiac Life Support (ACLS)", "category": "CERTIFICATION", "desc": "Urgent treatment of cardiac arrest, stroke, and life-threatening emergencies."},
    {"id": "SKILL-003", "name": "Critical Care Nursing", "category": "CLINICAL", "desc": "Management of acutely ill patients on mechanical ventilation and vasopressors."},
    {"id": "SKILL-004", "name": "Emergency Triage & Assessment", "category": "CLINICAL", "desc": "Rapid classification of patient acuity using Manchester/ESI triage systems."},
    {"id": "SKILL-005", "name": "Pediatric Advanced Life Support (PALS)", "category": "CERTIFICATION", "desc": "Pediatric emergency resuscitation and airway management."},
    {"id": "SKILL-006", "name": "Medication Administration & IV Infusion", "category": "CLINICAL", "desc": "Safe delivery of high-alert medications and central venous catheter care."},
    {"id": "SKILL-007", "name": "Charge Nurse & Ward Leadership", "category": "LEADERSHIP", "desc": "Floor coordination, emergency delegation, bed allocation, and conflict escalation."},
    {"id": "SKILL-008", "name": "Trauma & Burn Management", "category": "SPECIALIZATION", "desc": "Advanced wound debridement, fluid resuscitation, and trauma team integration."}
]

HOLIDAYS_2026 = [
    {"id": "HOL-2026-001", "date": "2026-01-01", "name": "New Year's Day", "multiplier": 1.5},
    {"id": "HOL-2026-002", "date": "2026-01-14", "name": "Makar Sankranti / Pongal", "multiplier": 1.5},
    {"id": "HOL-2026-003", "date": "2026-01-26", "name": "Republic Day", "multiplier": 2.0},
    {"id": "HOL-2026-004", "date": "2026-03-04", "name": "Holi Festival", "multiplier": 1.5},
    {"id": "HOL-2026-005", "date": "2026-03-20", "name": "Ugadi / Gudi Padwa", "multiplier": 1.5},
    {"id": "HOL-2026-006", "date": "2026-05-01", "name": "International Workers' Day", "multiplier": 2.0}
]


class SyntheticDataGenerator:
    """Master generator for enterprise workforce scheduling datasets."""

    def __init__(self, seed: int = 20261022, scale: str = "starter"):
        self.seed = seed
        self.scale = scale
        self.rng = random.Random(seed)
        self.anomaly_mgr = AnomalyManager(self.rng)

        # Scale Configuration
        if scale == "full":
            self.num_employees = 2000
            self.num_teams = 100
            self.schedule_days = 90
            self.num_leaves = 5000
            self.num_swaps = 400
        else:
            # Starter scale: fast execution (~1.5k records, 14 days)
            self.num_employees = 50
            self.num_teams = 5
            self.schedule_days = 14
            self.num_leaves = 100
            self.num_swaps = 30

        self.start_date = date(2026, 1, 1)

    def generate_all(self) -> Dict[str, pd.DataFrame]:
        """Executes full generation sequence following Steps 2-7."""
        # 1. Master Reference Entities
        teams = self._generate_teams()
        skills = self._generate_skills()
        shift_templates = self._generate_shift_templates()
        holidays = self._generate_holidays()
        
        # 2. Employees & Skills
        employees = self._generate_employees(teams)
        employee_skills = self._generate_employee_skills(employees, skills)

        # 3. Coverage Requirements
        coverage_reqs = self._generate_coverage_requirements(teams, shift_templates, skills)

        # 4. Leave Requests
        leaves = self._generate_leave_requests(employees)

        # 5. Shift Assignments (Solver-guided generation)
        assignments = self._generate_shift_assignments(
            employees, teams, shift_templates, coverage_reqs, employee_skills, leaves
        )

        # 6. Attendance Events
        attendance = self._generate_attendance_events(assignments)

        # 7. Swap Requests
        swaps = self._generate_swap_requests(assignments, employees)

        # 8. Inject Labelled Edge Cases (Step 5)
        anomaly_count = 5 if self.scale == "starter" else 15
        assignments = self.anomaly_mgr.inject_double_booked_employee(assignments, employees, shift_templates, count=anomaly_count)
        assignments, leaves = self.anomaly_mgr.inject_leave_overlapping_shift(assignments, leaves, count=anomaly_count)
        assignments = self.anomaly_mgr.inject_required_skill_absent(assignments, coverage_reqs, employee_skills, count=anomaly_count)
        assignments = self.anomaly_mgr.inject_overtime_cap_exceeded(assignments, employees, leave_requests=leaves, count=anomaly_count)
        swaps, assignments = self.anomaly_mgr.inject_unapproved_swap_applied(swaps, assignments, count=anomaly_count)

        # 9. Audit Event Ledger (State transitions)
        audits = self._generate_audit_events(assignments, leaves, swaps)

        # 10. Convert all to DataFrames
        return {
            "teams": pd.DataFrame(teams),
            "skills": pd.DataFrame(skills),
            "shift_templates": pd.DataFrame(shift_templates),
            "holidays": pd.DataFrame(holidays),
            "employees": pd.DataFrame(employees),
            "employee_skills": pd.DataFrame(employee_skills),
            "coverage_requirements": pd.DataFrame(coverage_reqs),
            "leave_requests": pd.DataFrame(leaves),
            "shift_assignments": pd.DataFrame(assignments),
            "attendance_events": pd.DataFrame(attendance),
            "swap_requests": pd.DataFrame(swaps),
            "audit_events": pd.DataFrame(audits),
            "ground_truth": pd.DataFrame(self.anomaly_mgr.ground_truth_records)
        }

    # -----------------------------------------------------------------
    # STEP 2 GENERATION IMPLEMENTATIONS
    # -----------------------------------------------------------------

    def _generate_teams(self) -> List[Dict[str, Any]]:
        teams = []
        for i in range(1, self.num_teams + 1):
            dept_idx = (i - 1) % len(DEPARTMENTS)
            dept_name, dept_div = DEPARTMENTS[dept_idx]
            suffix = f" {((i - 1) // len(DEPARTMENTS)) + 1}" if self.num_teams > len(DEPARTMENTS) else ""
            team_id = f"TEAM-{i:04d}"
            teams.append({
                "team_id": team_id,
                "name": f"{dept_name}{suffix}",
                "department": dept_div,
                "manager_emp_id": f"EMP-{(i * 7) % self.num_employees + 1:06d}",
                "timezone": "Asia/Kolkata",
                "created_at": "2025-12-01T00:00:00"
            })
        return teams

    def _generate_skills(self) -> List[Dict[str, Any]]:
        return [
            {
                "skill_id": s["id"],
                "name": s["name"],
                "category": s["category"],
                "description": s["desc"]
            }
            for s in SKILLS_SEED
        ]

    def _generate_shift_templates(self) -> List[Dict[str, Any]]:
        return [
            {
                "shift_template_id": "TEMPL-001",
                "name": ShiftType.DAY.value,
                "start_time": "07:00:00",
                "end_time": "15:00:00",
                "duration_hours": 8.0,
                "break_minutes": 30,
                "requires_handover": True
            },
            {
                "shift_template_id": "TEMPL-002",
                "name": ShiftType.EVENING.value,
                "start_time": "15:00:00",
                "end_time": "23:00:00",
                "duration_hours": 8.0,
                "break_minutes": 30,
                "requires_handover": True
            },
            {
                "shift_template_id": "TEMPL-003",
                "name": ShiftType.NIGHT.value,
                "start_time": "23:00:00",
                "end_time": "07:00:00",
                "duration_hours": 8.0,
                "break_minutes": 30,
                "requires_handover": True
            }
        ]

    def _generate_holidays(self) -> List[Dict[str, Any]]:
        return [
            {
                "holiday_id": h["id"],
                "date": h["date"],
                "name": h["name"],
                "jurisdiction": "IN-TS",
                "is_mandatory_off": False,
                "premium_pay_multiplier": h["multiplier"]
            }
            for h in HOLIDAYS_2026
        ]

    def _generate_employees(self, teams: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        employees = []
        roles = [
            (EmployeeRole.REGISTERED_NURSE.value, 0.50, 42.0),
            (EmployeeRole.CERTIFIED_NURSING_ASSISTANT.value, 0.25, 26.0),
            (EmployeeRole.CHARGE_NURSE.value, 0.10, 58.0),
            (EmployeeRole.MEDICAL_DOCTOR.value, 0.08, 120.0),
            (EmployeeRole.RESPIRATORY_THERAPIST.value, 0.05, 48.0),
            (EmployeeRole.WARD_COORDINATOR.value, 0.02, 32.0),
        ]

        for i in range(1, self.num_employees + 1):
            emp_id = f"EMP-{i:06d}"
            fn = self.rng.choice(FIRST_NAMES)
            ln = self.rng.choice(LAST_NAMES)
            email = f"{fn.lower()}.{ln.lower()}{i}@northgate.org"
            
            # Select role probabilistically
            rand_val = self.rng.random()
            cum = 0.0
            sel_role = EmployeeRole.REGISTERED_NURSE.value
            base_rate = 42.0
            for r, prob, rate in roles:
                cum += prob
                if rand_val <= cum:
                    sel_role = r
                    base_rate = rate
                    break

            team = teams[(i - 1) % len(teams)]
            hourly_rate = round(base_rate + self.rng.uniform(-3.0, 7.0), 2)
            
            hire_offset = self.rng.randint(60, 1800)
            hire_date = (self.start_date - timedelta(days=hire_offset)).isoformat()

            employees.append({
                "emp_id": emp_id,
                "name": f"{fn} {ln}",
                "email": email,
                "team_id": team["team_id"],
                "role": sel_role,
                "weekly_hours_cap": 40.0,
                "max_consecutive_days": 5,
                "hourly_rate": hourly_rate,
                "status": EmployeeStatus.ACTIVE.value,
                "hire_date": hire_date
            })

        return employees

    def _generate_employee_skills(
        self,
        employees: List[Dict[str, Any]],
        skills: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        records = []
        counter = 1
        skill_ids = [s["skill_id"] for s in skills]

        for emp in employees:
            # Everyone has Basic Life Support (SKILL-001) and ACLS (SKILL-002)
            records.append({
                "bridge_id": f"EMPSKILL-{counter:06d}",
                "emp_id": emp["emp_id"],
                "skill_id": "SKILL-001",
                "proficiency_level": SkillProficiency.EXPERT.value if "NURSE" in emp["role"] else SkillProficiency.INTERMEDIATE.value,
                "certified_date": "2025-01-15",
                "expiry_date": "2027-01-15"
            })
            counter += 1

            records.append({
                "bridge_id": f"EMPSKILL-{counter:06d}",
                "emp_id": emp["emp_id"],
                "skill_id": "SKILL-002",
                "proficiency_level": SkillProficiency.INTERMEDIATE.value,
                "certified_date": "2025-02-10",
                "expiry_date": "2027-02-10"
            })
            counter += 1

            # Role-specific skills
            if emp["role"] in [EmployeeRole.REGISTERED_NURSE.value, EmployeeRole.CHARGE_NURSE.value, EmployeeRole.MEDICAL_DOCTOR.value]:
                # Medication admin
                records.append({
                    "bridge_id": f"EMPSKILL-{counter:06d}",
                    "emp_id": emp["emp_id"],
                    "skill_id": "SKILL-006",
                    "proficiency_level": SkillProficiency.EXPERT.value,
                    "certified_date": "2025-03-01",
                    "expiry_date": "2027-03-01"
                })
                counter += 1

            if emp["role"] == EmployeeRole.CHARGE_NURSE.value:
                records.append({
                    "bridge_id": f"EMPSKILL-{counter:06d}",
                    "emp_id": emp["emp_id"],
                    "skill_id": "SKILL-007",
                    "proficiency_level": SkillProficiency.EXPERT.value,
                    "certified_date": "2024-11-01",
                    "expiry_date": None
                })
                counter += 1

            # Random auxiliary skill
            aux_skill = self.rng.choice(skill_ids)
            if not any(r["emp_id"] == emp["emp_id"] and r["skill_id"] == aux_skill for r in records):
                records.append({
                    "bridge_id": f"EMPSKILL-{counter:06d}",
                    "emp_id": emp["emp_id"],
                    "skill_id": aux_skill,
                    "proficiency_level": SkillProficiency.INTERMEDIATE.value,
                    "certified_date": "2025-04-01",
                    "expiry_date": "2027-04-01"
                })
                counter += 1

        return records

    def _generate_coverage_requirements(
        self,
        teams: List[Dict[str, Any]],
        shift_templates: List[Dict[str, Any]],
        skills: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        reqs = []
        counter = 1

        for day_offset in range(self.schedule_days):
            current_date = (self.start_date + timedelta(days=day_offset)).isoformat()
            
            for t in teams:
                for st in shift_templates:
                    # Baseline clinical coverage: Requires BLS and ACLS
                    reqs.append({
                        "requirement_id": f"REQ-{counter:06d}",
                        "team_id": t["team_id"],
                        "shift_template_id": st["shift_template_id"],
                        "date": current_date,
                        "skill_id": "SKILL-001",
                        "min_headcount": 1 if self.scale == "starter" else 2,
                        "target_headcount": 2 if self.scale == "starter" else 4
                    })
                    counter += 1

                    # Daytime and evening shifts require ACLS
                    if st["shift_template_id"] in ["TEMPL-001", "TEMPL-002"]:
                        reqs.append({
                            "requirement_id": f"REQ-{counter:06d}",
                            "team_id": t["team_id"],
                            "shift_template_id": st["shift_template_id"],
                            "date": current_date,
                            "skill_id": "SKILL-002",
                            "min_headcount": 1,
                            "target_headcount": 2
                        })
                        counter += 1

        return reqs

    def _generate_leave_requests(self, employees: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        leaves = []
        leave_types = [
            (LeaveType.ANNUAL.value, 0.60),
            (LeaveType.SICK.value, 0.25),
            (LeaveType.EMERGENCY.value, 0.10),
            (LeaveType.UNPAID.value, 0.05)
        ]

        target_count = min(self.num_leaves, len(employees) * 3)

        for i in range(1, target_count + 1):
            emp = self.rng.choice(employees)
            day_offset = self.rng.randint(2, self.schedule_days - 3)
            duration = self.rng.randint(1, 4)
            start_d = self.start_date + timedelta(days=day_offset)
            end_d = start_d + timedelta(days=duration - 1)

            # Probabilistic type
            r_val = self.rng.random()
            c_val = 0.0
            sel_type = LeaveType.ANNUAL.value
            for lt, p in leave_types:
                c_val += p
                if r_val <= c_val:
                    sel_type = lt
                    break

            # 80% approved, 15% rejected, 5% submitted
            status_roll = self.rng.random()
            if status_roll < 0.80:
                status = LeaveStatus.APPROVED.value
                decided = (start_d - timedelta(days=2)).isoformat() + "T14:00:00"
            elif status_roll < 0.95:
                status = LeaveStatus.REJECTED.value
                decided = (start_d - timedelta(days=1)).isoformat() + "T16:30:00"
            else:
                status = LeaveStatus.SUBMITTED.value
                decided = None

            leaves.append({
                "leave_id": f"LVE-2026-{i:06d}",
                "emp_id": emp["emp_id"],
                "leave_type": sel_type,
                "start_date": start_d.isoformat(),
                "end_date": end_d.isoformat(),
                "status": status,
                "reason": f"Standard {sel_type.lower()} leave request",
                "approver_emp_id": "EMP-000001",
                "submitted_at": (start_d - timedelta(days=5)).isoformat() + "T09:00:00",
                "decided_at": decided
            })

        return leaves

    def _generate_shift_assignments(
        self,
        employees: List[Dict[str, Any]],
        teams: List[Dict[str, Any]],
        shift_templates: List[Dict[str, Any]],
        coverage_reqs: List[Dict[str, Any]],
        employee_skills: List[Dict[str, Any]],
        leaves: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Step 3 & 4: Generates clean, feasible baseline shift assignments.
        Uses round-robin heuristic scheduling satisfying:
        - No approved leave collisions
        - Weekly labor cap adherence (<= 40h)
        - Matching required skills directly from coverage_requirements
        """
        assignments = []
        counter = 1

        # Build approved leave map: (emp_id, date) -> bool
        approved_leaves = set()
        for lv in leaves:
            if lv["status"] == LeaveStatus.APPROVED.value:
                cur = date.fromisoformat(lv["start_date"])
                end = date.fromisoformat(lv["end_date"])
                while cur <= end:
                    approved_leaves.add((lv["emp_id"], cur.isoformat()))
                    cur += timedelta(days=1)

        # Employee skill map: emp_id -> set of skill_id
        emp_skill_map: Dict[str, Set[str]] = {}
        for es in employee_skills:
            emp_skill_map.setdefault(es["emp_id"], set()).add(es["skill_id"])

        # Team to employee index
        team_emp_map: Dict[str, List[Dict[str, Any]]] = {}
        for emp in employees:
            team_emp_map.setdefault(emp["team_id"], []).append(emp)

        # Track weekly assigned hours: (emp_id, iso_year_week) -> float
        weekly_hours: Dict[Tuple[str, str], float] = {}

        # Track assigned dates per employee to prevent double booking in baseline
        emp_assigned_dates = set()

        # Fulfill coverage requirements
        for req in coverage_reqs:
            t_id = req["team_id"]
            d_str = req["date"]
            st_id = req["shift_template_id"]
            req_skill = req["skill_id"]
            min_hc = int(req["min_headcount"])

            cur_date = date.fromisoformat(d_str)
            year_week = f"{cur_date.year}-W{cur_date.isocalendar()[1]:02d}"

            team_staff = team_emp_map.get(t_id, [])
            assigned_this_req = 0

            for emp in team_staff:
                e_id = emp["emp_id"]

                # Check double booking
                if (e_id, d_str) in emp_assigned_dates:
                    continue

                # Check approved leave
                if (e_id, d_str) in approved_leaves:
                    continue

                # Check skill certification
                if req_skill not in emp_skill_map.get(e_id, set()):
                    continue

                # Check weekly hours cap
                cur_h = weekly_hours.get((e_id, year_week), 0.0)
                if cur_h + 8.0 > emp["weekly_hours_cap"]:
                    continue

                # Allocate shift assignment
                is_ot = (cur_h + 8.0) > 40.0
                assign_id = f"SHIFT-{d_str}-A-{counter:06d}"

                assignments.append({
                    "assignment_id": assign_id,
                    "date": d_str,
                    "shift_template_id": st_id,
                    "emp_id": e_id,
                    "team_id": t_id,
                    "assigned_skill_id": req_skill,
                    "status": AssignmentStatus.SCHEDULED.value,
                    "scheduled_hours": 8.0,
                    "is_overtime": is_ot,
                    "created_at": (cur_date - timedelta(days=14)).isoformat() + "T00:00:00"
                })

                emp_assigned_dates.add((e_id, d_str))
                weekly_hours[(e_id, year_week)] = cur_h + 8.0
                assigned_this_req += 1
                counter += 1

                if assigned_this_req >= min_hc:
                    break

        return assignments

    def _generate_attendance_events(self, assignments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        events = []
        for assign in assignments[:min(len(assignments), 1000)]:
            emp_id = assign["emp_id"]
            d_str = assign["date"]
            st_id = assign["shift_template_id"]

            start_hour = 7 if st_id == "TEMPL-001" else (15 if st_id == "TEMPL-002" else 23)
            # Add minute jitter (-5 to +10 mins)
            jitter = self.rng.randint(-5, 10)
            in_time = f"{d_str}T{start_hour:02d}:{max(0, jitter):02d}:15"
            out_time = f"{d_str}T{(start_hour + 8) % 24:02d}:02:40"
            clean_ts = d_str.replace("-", "")

            # Clock In Event
            events.append({
                "event_id": f"ATT-{emp_id}-{clean_ts}T{start_hour:02d}0000",
                "emp_id": emp_id,
                "assignment_id": assign["assignment_id"],
                "event_type": AttendanceEventType.CLOCK_IN.value,
                "timestamp": in_time,
                "location_verified": True,
                "source": AttendanceSource.BADGE_READER.value
            })

            # Clock Out Event
            events.append({
                "event_id": f"ATT-{emp_id}-{clean_ts}T{(start_hour+8)%24:02d}0000",
                "emp_id": emp_id,
                "assignment_id": assign["assignment_id"],
                "event_type": AttendanceEventType.CLOCK_OUT.value,
                "timestamp": out_time,
                "location_verified": True,
                "source": AttendanceSource.BADGE_READER.value
            })

        return events

    def _generate_swap_requests(
        self,
        assignments: List[Dict[str, Any]],
        employees: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        swaps = []
        if len(assignments) < 4:
            return swaps

        target_count = min(self.num_swaps, len(assignments) // 4)

        for i in range(1, target_count + 1):
            idx1 = self.rng.randint(0, len(assignments) - 2)
            idx2 = idx1 + 1
            a1 = assignments[idx1]
            a2 = assignments[idx2]

            req_ts = f"{a1['date']}T10:00:00"
            dec_ts = f"{a1['date']}T12:00:00"

            swaps.append({
                "swap_id": f"SWP-2026-{i:06d}",
                "requester_emp_id": a1["emp_id"],
                "requester_assignment_id": a1["assignment_id"],
                "target_emp_id": a2["emp_id"],
                "target_assignment_id": a2["assignment_id"],
                "reason": "Mutual weekend shift coverage exchange",
                "status": SwapStatus.MANAGER_APPROVED.value,
                "approver_manager_id": "EMP-000001",
                "requested_at": req_ts,
                "decided_at": dec_ts
            })

        return swaps

    def _generate_audit_events(
        self,
        assignments: List[Dict[str, Any]],
        leaves: List[Dict[str, Any]],
        swaps: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        audits = []
        counter = 1

        # Audit shift creation
        for a in assignments[:100]:
            audits.append({
                "audit_id": f"AUD-{counter:06d}",
                "entity_name": "ShiftAssignment",
                "entity_id": a["assignment_id"],
                "action": AuditAction.CREATE.value,
                "from_state": None,
                "to_state": a["status"],
                "actor_id": "SYSTEM",
                "actor_role": "System Administrator",
                "timestamp": a["created_at"],
                "details": f"Automated shift schedule published for {a['emp_id']} on {a['date']}."
            })
            counter += 1

        # Audit leave approval
        for lv in leaves[:50]:
            if lv["status"] == "APPROVED":
                audits.append({
                    "audit_id": f"AUD-{counter:06d}",
                    "entity_name": "LeaveRequest",
                    "entity_id": lv["leave_id"],
                    "action": AuditAction.STATE_TRANSITION.value,
                    "from_state": "SUBMITTED",
                    "to_state": "APPROVED",
                    "actor_id": lv["approver_emp_id"] or "EMP-000001",
                    "actor_role": "Manager",
                    "timestamp": lv["decided_at"] or "2026-01-05T12:00:00",
                    "details": f"Leave approved for employee {lv['emp_id']} from {lv['start_date']} to {lv['end_date']}."
                })
                counter += 1

        # Audit swap approval
        for sw in swaps[:30]:
            audits.append({
                "audit_id": f"AUD-{counter:06d}",
                "entity_name": "SwapRequest",
                "entity_id": sw["swap_id"],
                "action": AuditAction.STATE_TRANSITION.value,
                "from_state": "REQUESTED",
                "to_state": sw["status"],
                "actor_id": sw["approver_manager_id"] or "EMP-000001",
                "actor_role": "Manager",
                "timestamp": sw["decided_at"] or "2026-01-05T12:00:00",
                "details": f"Shift swap approved between {sw['requester_emp_id']} and {sw['target_emp_id']}."
            })
            counter += 1

        return audits
