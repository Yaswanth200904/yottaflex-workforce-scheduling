"""
Core Domain Models and Relational Entities.
Implements the 10 required business entities, relational bridge tables,
and immutable audit event tracking with strict Pydantic validation.

Candidate: Marupuri Venkata Yaswanth (marupurivenkata@gmail.com)
Repository: YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform
"""

from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


# =====================================================================
# ENUMS & TAXONOMIES
# =====================================================================

class EmployeeRole(str, Enum):
    REGISTERED_NURSE = "REGISTERED_NURSE"
    CHARGE_NURSE = "CHARGE_NURSE"
    CERTIFIED_NURSING_ASSISTANT = "CERTIFIED_NURSING_ASSISTANT"
    MEDICAL_DOCTOR = "MEDICAL_DOCTOR"
    RESPIRATORY_THERAPIST = "RESPIRATORY_THERAPIST"
    WARD_COORDINATOR = "WARD_COORDINATOR"


class EmployeeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    INACTIVE = "INACTIVE"
    TERMINATED = "TERMINATED"


class SkillCategory(str, Enum):
    CLINICAL = "CLINICAL"
    CERTIFICATION = "CERTIFICATION"
    LEADERSHIP = "LEADERSHIP"
    SPECIALIZATION = "SPECIALIZATION"


class SkillProficiency(str, Enum):
    BASIC = "BASIC"
    INTERMEDIATE = "INTERMEDIATE"
    EXPERT = "EXPERT"


class ShiftType(str, Enum):
    DAY = "DAY"          # 07:00 - 15:00 (8h)
    EVENING = "EVENING"  # 15:00 - 23:00 (8h)
    NIGHT = "NIGHT"      # 23:00 - 07:00 (8h)


class AssignmentStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    SWAPPED = "SWAPPED"
    ABSENT = "ABSENT"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class LeaveType(str, Enum):
    ANNUAL = "ANNUAL"
    SICK = "SICK"
    EMERGENCY = "EMERGENCY"
    MATERNITY_PATERNITY = "MATERNITY_PATERNITY"
    UNPAID = "UNPAID"


class LeaveStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class SwapStatus(str, Enum):
    REQUESTED = "REQUESTED"
    PEER_ACCEPTED = "PEER_ACCEPTED"
    MANAGER_APPROVED = "MANAGER_APPROVED"
    REJECTED = "REJECTED"
    EXECUTED = "EXECUTED"
    CANCELLED = "CANCELLED"


class AttendanceEventType(str, Enum):
    CLOCK_IN = "CLOCK_IN"
    CLOCK_OUT = "CLOCK_OUT"
    BREAK_START = "BREAK_START"
    BREAK_END = "BREAK_END"


class AttendanceSource(str, Enum):
    BADGE_READER = "BADGE_READER"
    BIOMETRIC_KIOSK = "BIOMETRIC_KIOSK"
    MOBILE_APP = "MOBILE_APP"
    MANUAL_OVERRIDE = "MANUAL_OVERRIDE"


class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    STATE_TRANSITION = "STATE_TRANSITION"
    SWAP_EXECUTE = "SWAP_EXECUTE"
    EXCEPTION_QUARANTINE = "EXCEPTION_QUARANTINE"
    OVERRIDE = "OVERRIDE"


class AnomalyType(str, Enum):
    DOUBLE_BOOKED_EMPLOYEE = "DOUBLE_BOOKED_EMPLOYEE"
    LEAVE_OVERLAPPING_SHIFT = "LEAVE_OVERLAPPING_SHIFT"
    REQUIRED_SKILL_ABSENT = "REQUIRED_SKILL_ABSENT"
    OVERTIME_CAP_EXCEEDED = "OVERTIME_CAP_EXCEEDED"
    UNAPPROVED_SWAP_APPLIED = "UNAPPROVED_SWAP_APPLIED"


# =====================================================================
# CORE RELATIONAL ENTITIES (PYDANTIC BASEMODELS)
# =====================================================================

class Employee(BaseModel):
    emp_id: str = Field(..., pattern=r"^EMP-\d{6}$", description="Primary key, e.g. EMP-000001")
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r"^[\w\.-]+@[\w\.-]+\.\w+$")
    team_id: str = Field(..., pattern=r"^TEAM-\d{4}$")
    role: EmployeeRole
    weekly_hours_cap: float = Field(default=40.0, ge=10.0, le=80.0)
    max_consecutive_days: int = Field(default=5, ge=1, le=14)
    hourly_rate: float = Field(default=35.0, ge=15.0, le=250.0)
    status: EmployeeStatus = Field(default=EmployeeStatus.ACTIVE)
    hire_date: str


class Team(BaseModel):
    team_id: str = Field(..., pattern=r"^TEAM-\d{4}$", description="Primary key, e.g. TEAM-0001")
    name: str = Field(..., min_length=2, max_length=100)
    department: str
    manager_emp_id: Optional[str] = Field(default=None, pattern=r"^EMP-\d{6}$")
    timezone: str = Field(default="Asia/Kolkata")
    created_at: str


class Skill(BaseModel):
    skill_id: str = Field(..., pattern=r"^SKILL-\d{3}$", description="Primary key, e.g. SKILL-001")
    name: str = Field(..., min_length=2, max_length=100)
    category: SkillCategory
    description: str


class EmployeeSkill(BaseModel):
    bridge_id: str = Field(..., pattern=r"^EMPSKILL-\d{6}$", description="Primary key")
    emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    skill_id: str = Field(..., pattern=r"^SKILL-\d{3}$")
    proficiency_level: SkillProficiency = Field(default=SkillProficiency.INTERMEDIATE)
    certified_date: str
    expiry_date: Optional[str] = None


class ShiftTemplate(BaseModel):
    shift_template_id: str = Field(..., pattern=r"^TEMPL-\d{3}$", description="Primary key, e.g. TEMPL-001")
    name: ShiftType
    start_time: str = Field(..., pattern=r"^\d{2}:\d{2}:\d{2}$")
    end_time: str = Field(..., pattern=r"^\d{2}:\d{2}:\d{2}$")
    duration_hours: float = Field(default=8.0, ge=1.0, le=24.0)
    break_minutes: int = Field(default=30, ge=0, le=120)
    requires_handover: bool = Field(default=True)


class CoverageRequirement(BaseModel):
    requirement_id: str = Field(..., pattern=r"^REQ-\d{6}$", description="Primary key")
    team_id: str = Field(..., pattern=r"^TEAM-\d{4}$")
    shift_template_id: str = Field(..., pattern=r"^TEMPL-\d{3}$")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    skill_id: str = Field(..., pattern=r"^SKILL-\d{3}$")
    min_headcount: int = Field(default=1, ge=1)
    target_headcount: int = Field(default=2, ge=1)


class ShiftAssignment(BaseModel):
    assignment_id: str = Field(..., pattern=r"^SHIFT-\d{4}-\d{2}-\d{2}-[A-Z]-\d{6}$", description="Primary key")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    shift_template_id: str = Field(..., pattern=r"^TEMPL-\d{3}$")
    emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    team_id: str = Field(..., pattern=r"^TEAM-\d{4}$")
    assigned_skill_id: str = Field(..., pattern=r"^SKILL-\d{3}$")
    status: AssignmentStatus = Field(default=AssignmentStatus.SCHEDULED)
    scheduled_hours: float = Field(default=8.0, ge=0.0, le=24.0)
    is_overtime: bool = Field(default=False)
    created_at: str


class LeaveRequest(BaseModel):
    leave_id: str = Field(..., pattern=r"^LVE-\d{4}-\d{6}$", description="Primary key, e.g. LVE-2026-000001")
    emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    leave_type: LeaveType
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    status: LeaveStatus = Field(default=LeaveStatus.SUBMITTED)
    reason: str
    approver_emp_id: Optional[str] = None
    submitted_at: str
    decided_at: Optional[str] = None


class HolidayCalendar(BaseModel):
    holiday_id: str = Field(..., pattern=r"^HOL-\d{4}-\d{3}$", description="Primary key, e.g. HOL-2026-001")
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    name: str = Field(..., min_length=2, max_length=100)
    jurisdiction: str = Field(default="IN-TS")
    is_mandatory_off: bool = Field(default=False)
    premium_pay_multiplier: float = Field(default=1.5, ge=1.0, le=3.0)


class AttendanceEvent(BaseModel):
    event_id: str = Field(..., pattern=r"^ATT-EMP-\d{6}-\d{8}T\d{6}$", description="Primary key")
    emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    assignment_id: Optional[str] = None
    event_type: AttendanceEventType
    timestamp: str
    location_verified: bool = Field(default=True)
    source: AttendanceSource = Field(default=AttendanceSource.BADGE_READER)


class SwapRequest(BaseModel):
    swap_id: str = Field(..., pattern=r"^SWP-\d{4}-\d{6}$", description="Primary key, e.g. SWP-2026-000001")
    requester_emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    requester_assignment_id: str = Field(..., pattern=r"^SHIFT-.*$")
    target_emp_id: str = Field(..., pattern=r"^EMP-\d{6}$")
    target_assignment_id: str = Field(..., pattern=r"^SHIFT-.*$")
    reason: str
    status: SwapStatus = Field(default=SwapStatus.REQUESTED)
    approver_manager_id: Optional[str] = None
    requested_at: str
    decided_at: Optional[str] = None


class AuditEvent(BaseModel):
    audit_id: str = Field(..., pattern=r"^AUD-\d{6}$", description="Primary key, e.g. AUD-000001")
    entity_name: str
    entity_id: str
    action: AuditAction
    from_state: Optional[str] = None
    to_state: str
    actor_id: str
    actor_role: str
    timestamp: str
    details: str
