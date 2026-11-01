"""
Data Dictionary Registry and Specification Generator.
Fulfills Step 1 of the specification:
Defines granular metadata for:
Employee, Team, Skill, ShiftTemplate, ShiftAssignment, LeaveRequest,
HolidayCalendar, AttendanceEvent, CoverageRequirement, SwapRequest,
plus EmployeeSkill (Bridge) and AuditEvent (State Ledger).

For each field: specifies type, required/optional, allowed values, units,
uniqueness, and validation rules.
"""

from typing import List, Dict, Any


DATA_DICTIONARY: Dict[str, Dict[str, Any]] = {
    "Employee": {
        "description": "Master record of hospital/organization workforce personnel.",
        "cardinality": "1:N with ShiftAssignment, LeaveRequest, AttendanceEvent, EmployeeSkill",
        "fields": [
            {
                "name": "emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$ (e.g. EMP-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded identifier. Immutable."
            },
            {
                "name": "name",
                "type": "STRING",
                "required": True,
                "allowed_values": "2-100 characters",
                "units": "Full Name Text",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Valid synthetic person name without PII leakage."
            },
            {
                "name": "email",
                "type": "STRING",
                "required": True,
                "allowed_values": "RFC 5322 synthetic email (@northgate.org or @yottaflex.ai)",
                "units": "Corporate Email Address",
                "uniqueness": "UNIQUE",
                "validation_rule": "Must match regex ^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$."
            },
            {
                "name": "team_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEAM-\\d{4}$ (e.g. TEAM-0001)",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Team record."
            },
            {
                "name": "role",
                "type": "ENUM",
                "required": True,
                "allowed_values": "REGISTERED_NURSE, CHARGE_NURSE, CERTIFIED_NURSING_ASSISTANT, MEDICAL_DOCTOR, RESPIRATORY_THERAPIST, WARD_COORDINATOR",
                "units": "Clinical Designation",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to EmployeeRole enum."
            },
            {
                "name": "weekly_hours_cap",
                "type": "FLOAT",
                "required": True,
                "allowed_values": "10.0 to 80.0 (Standard: 40.0)",
                "units": "Hours / Week",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Standard weekly maximum labor constraint before overtime."
            },
            {
                "name": "max_consecutive_days",
                "type": "INTEGER",
                "required": True,
                "allowed_values": "1 to 14 (Standard: 5)",
                "units": "Days",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Labor law constraint: max consecutive worked days without rest."
            },
            {
                "name": "hourly_rate",
                "type": "FLOAT",
                "required": True,
                "allowed_values": "15.00 to 250.00",
                "units": "USD / Hour",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Positive decimal currency value for payroll calculation."
            },
            {
                "name": "status",
                "type": "ENUM",
                "required": True,
                "allowed_values": "ACTIVE, ON_LEAVE, INACTIVE, TERMINATED",
                "units": "Employment Status",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to EmployeeStatus enum."
            },
            {
                "name": "hire_date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must precede any shift assignment or attendance event date."
            }
        ]
    },
    "Team": {
        "description": "Organizational unit or clinical department (e.g. ICU, Emergency, Oncology).",
        "cardinality": "1:N with Employee, CoverageRequirement, ShiftAssignment",
        "fields": [
            {
                "name": "team_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEAM-\\d{4}$ (e.g. TEAM-0001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded identifier. Immutable."
            },
            {
                "name": "name",
                "type": "STRING",
                "required": True,
                "allowed_values": "2-100 characters",
                "units": "Ward/Team Name",
                "uniqueness": "UNIQUE",
                "validation_rule": "Unique departmental team name."
            },
            {
                "name": "department",
                "type": "STRING",
                "required": True,
                "allowed_values": "Critical Care, Emergency, Surgical, Inpatient, Pediatrics, Outpatient",
                "units": "Division Category",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Standard hospital division taxonomy."
            },
            {
                "name": "manager_emp_id",
                "type": "STRING",
                "required": False,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "References the Team Leader / Manager Employee record."
            },
            {
                "name": "timezone",
                "type": "STRING",
                "required": True,
                "allowed_values": "IANA Timezone string (e.g. Asia/Kolkata, UTC, America/New_York)",
                "units": "Timezone",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Valid IANA timezone format."
            },
            {
                "name": "created_at",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC (YYYY-MM-DDTHH:MM:SS)",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Creation audit timestamp."
            }
        ]
    },
    "Skill": {
        "description": "Clinical and operational competencies required for shift coverage.",
        "cardinality": "1:N with EmployeeSkill, CoverageRequirement",
        "fields": [
            {
                "name": "skill_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SKILL-\\d{3}$ (e.g. SKILL-001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded identifier."
            },
            {
                "name": "name",
                "type": "STRING",
                "required": True,
                "allowed_values": "e.g. Critical Care, ACLS, Triage, Pediatric Care, Medication Admin, Charge Leadership",
                "units": "Skill Name",
                "uniqueness": "UNIQUE",
                "validation_rule": "Canonical competency title."
            },
            {
                "name": "category",
                "type": "ENUM",
                "required": True,
                "allowed_values": "CLINICAL, CERTIFICATION, LEADERSHIP, SPECIALIZATION",
                "units": "Skill Category",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to SkillCategory enum."
            },
            {
                "name": "description",
                "type": "STRING",
                "required": True,
                "allowed_values": "10-255 characters",
                "units": "Competency Scope",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Detailed operational description."
            }
        ]
    },
    "EmployeeSkill": {
        "description": "Bridge table linking Employees to their certified skills (N:M).",
        "cardinality": "N:M between Employee and Skill",
        "fields": [
            {
                "name": "bridge_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMPSKILL-\\d{6}$",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Unique bridge record key."
            },
            {
                "name": "emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Employee."
            },
            {
                "name": "skill_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SKILL-\\d{3}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Skill."
            },
            {
                "name": "proficiency_level",
                "type": "ENUM",
                "required": True,
                "allowed_values": "BASIC, INTERMEDIATE, EXPERT",
                "units": "Proficiency Level",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to SkillProficiency enum."
            },
            {
                "name": "certified_date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Certification date."
            },
            {
                "name": "expiry_date",
                "type": "DATE",
                "required": False,
                "allowed_values": "YYYY-MM-DD or NULL",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must be greater than certified_date if not null."
            }
        ]
    },
    "ShiftTemplate": {
        "description": "Master rotational shift definition (timing, duration, rest intervals).",
        "cardinality": "1:N with ShiftAssignment, CoverageRequirement",
        "fields": [
            {
                "name": "shift_template_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEMPL-\\d{3}$ (e.g. TEMPL-001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded identifier."
            },
            {
                "name": "name",
                "type": "ENUM",
                "required": True,
                "allowed_values": "DAY, EVENING, NIGHT",
                "units": "Shift Name",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to ShiftType enum."
            },
            {
                "name": "start_time",
                "type": "STRING",
                "required": True,
                "allowed_values": "HH:MM:SS (e.g. 07:00:00, 15:00:00, 23:00:00)",
                "units": "24h Time",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Valid 24-hour time format."
            },
            {
                "name": "end_time",
                "type": "STRING",
                "required": True,
                "allowed_values": "HH:MM:SS (e.g. 15:00:00, 23:00:00, 07:00:00)",
                "units": "24h Time",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Valid 24-hour time format. Overnight shifts roll into next day."
            },
            {
                "name": "duration_hours",
                "type": "FLOAT",
                "required": True,
                "allowed_values": "1.0 to 24.0 (Standard: 8.0)",
                "units": "Hours",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Total elapsed working hours for the shift."
            },
            {
                "name": "break_minutes",
                "type": "INTEGER",
                "required": True,
                "allowed_values": "0 to 120 (Standard: 30)",
                "units": "Minutes",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Mandatory paid/unpaid meal break duration."
            },
            {
                "name": "requires_handover",
                "type": "BOOLEAN",
                "required": True,
                "allowed_values": "True, False",
                "units": "Flag",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Indicates clinical bed-side handover requirement."
            }
        ]
    },
    "CoverageRequirement": {
        "description": "Minimum and target staffing quotas per team, date, shift, and required skill.",
        "cardinality": "1:N with ShiftAssignment compliance evaluation",
        "fields": [
            {
                "name": "requirement_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^REQ-\\d{6}$ (e.g. REQ-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded identifier."
            },
            {
                "name": "team_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEAM-\\d{4}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Team."
            },
            {
                "name": "shift_template_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEMPL-\\d{3}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing ShiftTemplate."
            },
            {
                "name": "date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Coverage schedule date."
            },
            {
                "name": "skill_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SKILL-\\d{3}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Mandatory skill requirement for the shift."
            },
            {
                "name": "min_headcount",
                "type": "INTEGER",
                "required": True,
                "allowed_values": ">= 1 (Standard: 1 to 4)",
                "units": "Staff Headcount",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Non-negotiable minimum safety staffing."
            },
            {
                "name": "target_headcount",
                "type": "INTEGER",
                "required": True,
                "allowed_values": ">= min_headcount",
                "units": "Staff Headcount",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Optimal service staffing level."
            }
        ]
    },
    "ShiftAssignment": {
        "description": "Individual scheduled shift allocation for an employee on a specific date.",
        "cardinality": "N:1 with Employee, Team, ShiftTemplate, Skill; 1:N with AttendanceEvent",
        "fields": [
            {
                "name": "assignment_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SHIFT-\\d{4}-\\d{2}-\\d{2}-[A-Z]-\\d{6}$ (e.g. SHIFT-2026-01-01-A-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic date-stamped identifier matching convention."
            },
            {
                "name": "date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Shift execution date."
            },
            {
                "name": "shift_template_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEMPL-\\d{3}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing ShiftTemplate."
            },
            {
                "name": "emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Employee."
            },
            {
                "name": "team_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^TEAM-\\d{4}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Team."
            },
            {
                "name": "assigned_skill_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SKILL-\\d{3}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Role/skill fulfilled on this shift."
            },
            {
                "name": "status",
                "type": "ENUM",
                "required": True,
                "allowed_values": "SCHEDULED, CONFIRMED, SWAPPED, ABSENT, CANCELLED, COMPLETED",
                "units": "Assignment State",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to AssignmentStatus enum."
            },
            {
                "name": "scheduled_hours",
                "type": "FLOAT",
                "required": True,
                "allowed_values": "0.0 to 24.0 (Standard: 8.0)",
                "units": "Hours",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Derived from ShiftTemplate duration_hours."
            },
            {
                "name": "is_overtime",
                "type": "BOOLEAN",
                "required": True,
                "allowed_values": "True, False",
                "units": "Flag",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Derived: True if employee weekly accumulated hours exceed weekly_hours_cap."
            },
            {
                "name": "created_at",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Scheduling timestamp."
            }
        ]
    },
    "LeaveRequest": {
        "description": "Employee absence request and managerial approval outcome.",
        "cardinality": "N:1 with Employee (requester and approver)",
        "fields": [
            {
                "name": "leave_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^LVE-\\d{4}-\\d{6}$ (e.g. LVE-2026-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic year-stamped identifier matching convention."
            },
            {
                "name": "emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Employee."
            },
            {
                "name": "leave_type",
                "type": "ENUM",
                "required": True,
                "allowed_values": "ANNUAL, SICK, EMERGENCY, MATERNITY_PATERNITY, UNPAID",
                "units": "Leave Category",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to LeaveType enum."
            },
            {
                "name": "start_date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Leave start date."
            },
            {
                "name": "end_date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must be greater than or equal to start_date."
            },
            {
                "name": "status",
                "type": "ENUM",
                "required": True,
                "allowed_values": "SUBMITTED, APPROVED, REJECTED, CANCELLED",
                "units": "Approval Lifecycle",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to LeaveStatus enum."
            },
            {
                "name": "reason",
                "type": "STRING",
                "required": True,
                "allowed_values": "5-255 characters",
                "units": "Text",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Valid absence justification."
            },
            {
                "name": "approver_emp_id",
                "type": "STRING",
                "required": False,
                "allowed_values": "Pattern: ^EMP-\\d{6}$ or NULL",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Manager who decided the request."
            },
            {
                "name": "submitted_at",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Submission timestamp, must precede start_date."
            },
            {
                "name": "decided_at",
                "type": "TIMESTAMP",
                "required": False,
                "allowed_values": "ISO 8601 UTC or NULL",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must be greater than submitted_at if decided."
            }
        ]
    },
    "HolidayCalendar": {
        "description": "Public and jurisdiction-mandated holidays affecting labor pay and scheduling.",
        "cardinality": "Evaluated against schedule dates",
        "fields": [
            {
                "name": "holiday_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^HOL-\\d{4}-\\d{3}$ (e.g. HOL-2026-001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic year-stamped identifier."
            },
            {
                "name": "date",
                "type": "DATE",
                "required": True,
                "allowed_values": "YYYY-MM-DD",
                "units": "Calendar Date",
                "uniqueness": "UNIQUE",
                "validation_rule": "Holiday calendar date."
            },
            {
                "name": "name",
                "type": "STRING",
                "required": True,
                "allowed_values": "e.g. Republic Day, Independence Day, Diwali, New Year's Day",
                "units": "Holiday Title",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Official holiday title."
            },
            {
                "name": "jurisdiction",
                "type": "STRING",
                "required": True,
                "allowed_values": "IN-TS, IN-NATIONAL, US-FEDERAL",
                "units": "Jurisdiction Code",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Applicable region."
            },
            {
                "name": "is_mandatory_off",
                "type": "BOOLEAN",
                "required": True,
                "allowed_values": "True, False",
                "units": "Flag",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Whether operations are completely halted."
            },
            {
                "name": "premium_pay_multiplier",
                "type": "FLOAT",
                "required": True,
                "allowed_values": "1.0 to 3.0 (Standard: 1.5 or 2.0)",
                "units": "Pay Multiplier",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Overtime/holiday wage multiplier."
            }
        ]
    },
    "AttendanceEvent": {
        "description": "Biometric or badge clock-in/out timestamped event for roster reconciliation.",
        "cardinality": "N:1 with Employee, N:1 with ShiftAssignment",
        "fields": [
            {
                "name": "event_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^ATT-EMP-\\d{6}-\\d{8}T\\d{6}$ (e.g. ATT-EMP-000001-20260101T070215)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic composite ID matching ATT-<employee-id>-<timestamp>."
            },
            {
                "name": "emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must reference an existing Employee."
            },
            {
                "name": "assignment_id",
                "type": "STRING",
                "required": False,
                "allowed_values": "Pattern: ^SHIFT-.*$ or NULL",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "References the scheduled ShiftAssignment if mapped."
            },
            {
                "name": "event_type",
                "type": "ENUM",
                "required": True,
                "allowed_values": "CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END",
                "units": "Event Type",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to AttendanceEventType enum."
            },
            {
                "name": "timestamp",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Exact clock time."
            },
            {
                "name": "location_verified",
                "type": "BOOLEAN",
                "required": True,
                "allowed_values": "True, False",
                "units": "Flag",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Geo-fencing or badge reader physical verification."
            },
            {
                "name": "source",
                "type": "ENUM",
                "required": True,
                "allowed_values": "BADGE_READER, BIOMETRIC_KIOSK, MOBILE_APP, MANUAL_OVERRIDE",
                "units": "Capture Source",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to AttendanceSource enum."
            }
        ]
    },
    "SwapRequest": {
        "description": "Peer-to-peer shift swap workflow requiring peer agreement and manager approval.",
        "cardinality": "N:1 with requester Employee, target Employee, and ShiftAssignments",
        "fields": [
            {
                "name": "swap_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SWP-\\d{4}-\\d{6}$ (e.g. SWP-2026-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic year-stamped identifier matching convention."
            },
            {
                "name": "requester_emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Employee initiating the swap."
            },
            {
                "name": "requester_assignment_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SHIFT-.*$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Shift owned by requester."
            },
            {
                "name": "target_emp_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^EMP-\\d{6}$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Target employee proposed for the exchange."
            },
            {
                "name": "target_assignment_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^SHIFT-.*$",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Shift owned by target employee."
            },
            {
                "name": "reason",
                "type": "STRING",
                "required": True,
                "allowed_values": "5-255 characters",
                "units": "Text",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Justification for swap."
            },
            {
                "name": "status",
                "type": "ENUM",
                "required": True,
                "allowed_values": "REQUESTED, PEER_ACCEPTED, MANAGER_APPROVED, REJECTED, EXECUTED, CANCELLED",
                "units": "Workflow Status",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to SwapStatus enum. Cannot transition to EXECUTED without MANAGER_APPROVED."
            },
            {
                "name": "approver_manager_id",
                "type": "STRING",
                "required": False,
                "allowed_values": "Pattern: ^EMP-\\d{6}$ or NULL",
                "units": "Foreign Key",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Manager granting the approval."
            },
            {
                "name": "requested_at",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Initiation timestamp."
            },
            {
                "name": "decided_at",
                "type": "TIMESTAMP",
                "required": False,
                "allowed_values": "ISO 8601 UTC or NULL",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Approval/rejection decision timestamp."
            }
        ]
    },
    "AuditEvent": {
        "description": "Immutable ledger tracking state changes across assignments, swaps, leaves, and exceptions.",
        "cardinality": "Audit log covering all state transitions",
        "fields": [
            {
                "name": "audit_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Pattern: ^AUD-\\d{6}$ (e.g. AUD-000001)",
                "units": "Alphanumeric ID",
                "uniqueness": "PRIMARY KEY",
                "validation_rule": "Deterministic zero-padded audit identifier. Immutable."
            },
            {
                "name": "entity_name",
                "type": "STRING",
                "required": True,
                "allowed_values": "ShiftAssignment, SwapRequest, LeaveRequest, CoverageRequirement, Exception",
                "units": "Entity Name",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Identifies target entity class."
            },
            {
                "name": "entity_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "Valid primary key string of target entity",
                "units": "Target ID",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Points to affected entity record."
            },
            {
                "name": "action",
                "type": "ENUM",
                "required": True,
                "allowed_values": "CREATE, UPDATE, STATE_TRANSITION, SWAP_EXECUTE, EXCEPTION_QUARANTINE, OVERRIDE",
                "units": "Action Type",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Must belong to AuditAction enum."
            },
            {
                "name": "from_state",
                "type": "STRING",
                "required": False,
                "allowed_values": "State string or NULL (for initial creation)",
                "units": "Prior State",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Prior lifecycle status."
            },
            {
                "name": "to_state",
                "type": "STRING",
                "required": True,
                "allowed_values": "State string",
                "units": "New State",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Subsequent lifecycle status."
            },
            {
                "name": "actor_id",
                "type": "STRING",
                "required": True,
                "allowed_values": "EMP-000001 or SYSTEM",
                "units": "User/System ID",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Identifier of the user or autonomous engine executing the action."
            },
            {
                "name": "actor_role",
                "type": "STRING",
                "required": True,
                "allowed_values": "Employee, Manager, HR Partner, IT/Operations Partner, System Administrator",
                "units": "Actor Role",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Matches primary actors specification."
            },
            {
                "name": "timestamp",
                "type": "TIMESTAMP",
                "required": True,
                "allowed_values": "ISO 8601 UTC",
                "units": "Datetime",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Immutable audit record timestamp."
            },
            {
                "name": "details",
                "type": "STRING",
                "required": True,
                "allowed_values": "Detailed audit reason, validation diff, or trace",
                "units": "Log Details",
                "uniqueness": "NON-UNIQUE",
                "validation_rule": "Full contextual explanation of the decision."
            }
        ]
    }
}


def generate_markdown_data_dictionary() -> str:
    """Generates comprehensive Markdown documentation from DATA_DICTIONARY."""
    lines = [
        "# Data Dictionary & Relational Schema Specification",
        "",
        "> **Candidate:** Marupuri Venkata Yaswanth (`marupurivenkata@gmail.com`)  ",
        "> **Challenge:** YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform  ",
        "> **Specification Step 1:** Exhaustive field-level metadata for all core entities, bridges, and audit logs.",
        "",
        "---",
        ""
    ]

    for entity_name, meta in DATA_DICTIONARY.items():
        lines.append(f"## Entity: `{entity_name}`")
        lines.append(f"**Description:** {meta['description']}  ")
        lines.append(f"**Cardinality:** {meta['cardinality']}  ")
        lines.append("")
        lines.append("| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |")
        lines.append("|------------|------|----------|--------------------------|-------|------------|-----------------|")
        
        for f in meta["fields"]:
            req_str = "YES" if f["required"] else "NO"
            lines.append(f"| `{f['name']}` | `{f['type']}` | **{req_str}** | `{f['allowed_values']}` | {f['units']} | `{f['uniqueness']}` | {f['validation_rule']} |")
        
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)
