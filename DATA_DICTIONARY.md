# Data Dictionary & Relational Schema Specification

> **Candidate:** Marupuri Venkata Yaswanth (`marupurivenkata@gmail.com`)  
> **Challenge:** YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform  
> **Specification Step 1:** Exhaustive field-level metadata for all core entities, bridges, and audit logs.

---

## Entity: `Employee`
**Description:** Master record of hospital/organization workforce personnel.  
**Cardinality:** 1:N with ShiftAssignment, LeaveRequest, AttendanceEvent, EmployeeSkill  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$ (e.g. EMP-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded identifier. Immutable. |
| `name` | `STRING` | **YES** | `2-100 characters` | Full Name Text | `NON-UNIQUE` | Valid synthetic person name without PII leakage. |
| `email` | `STRING` | **YES** | `RFC 5322 synthetic email (@northgate.org or @yottaflex.ai)` | Corporate Email Address | `UNIQUE` | Must match regex ^[\w\.-]+@[\w\.-]+\.\w+$. |
| `team_id` | `STRING` | **YES** | `Pattern: ^TEAM-\d{4}$ (e.g. TEAM-0001)` | Foreign Key | `NON-UNIQUE` | Must reference an existing Team record. |
| `role` | `ENUM` | **YES** | `REGISTERED_NURSE, CHARGE_NURSE, CERTIFIED_NURSING_ASSISTANT, MEDICAL_DOCTOR, RESPIRATORY_THERAPIST, WARD_COORDINATOR` | Clinical Designation | `NON-UNIQUE` | Must belong to EmployeeRole enum. |
| `weekly_hours_cap` | `FLOAT` | **YES** | `10.0 to 80.0 (Standard: 40.0)` | Hours / Week | `NON-UNIQUE` | Standard weekly maximum labor constraint before overtime. |
| `max_consecutive_days` | `INTEGER` | **YES** | `1 to 14 (Standard: 5)` | Days | `NON-UNIQUE` | Labor law constraint: max consecutive worked days without rest. |
| `hourly_rate` | `FLOAT` | **YES** | `15.00 to 250.00` | USD / Hour | `NON-UNIQUE` | Positive decimal currency value for payroll calculation. |
| `status` | `ENUM` | **YES** | `ACTIVE, ON_LEAVE, INACTIVE, TERMINATED` | Employment Status | `NON-UNIQUE` | Must belong to EmployeeStatus enum. |
| `hire_date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Must precede any shift assignment or attendance event date. |

---

## Entity: `Team`
**Description:** Organizational unit or clinical department (e.g. ICU, Emergency, Oncology).  
**Cardinality:** 1:N with Employee, CoverageRequirement, ShiftAssignment  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `team_id` | `STRING` | **YES** | `Pattern: ^TEAM-\d{4}$ (e.g. TEAM-0001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded identifier. Immutable. |
| `name` | `STRING` | **YES** | `2-100 characters` | Ward/Team Name | `UNIQUE` | Unique departmental team name. |
| `department` | `STRING` | **YES** | `Critical Care, Emergency, Surgical, Inpatient, Pediatrics, Outpatient` | Division Category | `NON-UNIQUE` | Standard hospital division taxonomy. |
| `manager_emp_id` | `STRING` | **NO** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | References the Team Leader / Manager Employee record. |
| `timezone` | `STRING` | **YES** | `IANA Timezone string (e.g. Asia/Kolkata, UTC, America/New_York)` | Timezone | `NON-UNIQUE` | Valid IANA timezone format. |
| `created_at` | `TIMESTAMP` | **YES** | `ISO 8601 UTC (YYYY-MM-DDTHH:MM:SS)` | Datetime | `NON-UNIQUE` | Creation audit timestamp. |

---

## Entity: `Skill`
**Description:** Clinical and operational competencies required for shift coverage.  
**Cardinality:** 1:N with EmployeeSkill, CoverageRequirement  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `skill_id` | `STRING` | **YES** | `Pattern: ^SKILL-\d{3}$ (e.g. SKILL-001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded identifier. |
| `name` | `STRING` | **YES** | `e.g. Critical Care, ACLS, Triage, Pediatric Care, Medication Admin, Charge Leadership` | Skill Name | `UNIQUE` | Canonical competency title. |
| `category` | `ENUM` | **YES** | `CLINICAL, CERTIFICATION, LEADERSHIP, SPECIALIZATION` | Skill Category | `NON-UNIQUE` | Must belong to SkillCategory enum. |
| `description` | `STRING` | **YES** | `10-255 characters` | Competency Scope | `NON-UNIQUE` | Detailed operational description. |

---

## Entity: `EmployeeSkill`
**Description:** Bridge table linking Employees to their certified skills (N:M).  
**Cardinality:** N:M between Employee and Skill  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `bridge_id` | `STRING` | **YES** | `Pattern: ^EMPSKILL-\d{6}$` | Alphanumeric ID | `PRIMARY KEY` | Unique bridge record key. |
| `emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Employee. |
| `skill_id` | `STRING` | **YES** | `Pattern: ^SKILL-\d{3}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Skill. |
| `proficiency_level` | `ENUM` | **YES** | `BASIC, INTERMEDIATE, EXPERT` | Proficiency Level | `NON-UNIQUE` | Must belong to SkillProficiency enum. |
| `certified_date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Certification date. |
| `expiry_date` | `DATE` | **NO** | `YYYY-MM-DD or NULL` | Calendar Date | `NON-UNIQUE` | Must be greater than certified_date if not null. |

---

## Entity: `ShiftTemplate`
**Description:** Master rotational shift definition (timing, duration, rest intervals).  
**Cardinality:** 1:N with ShiftAssignment, CoverageRequirement  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `shift_template_id` | `STRING` | **YES** | `Pattern: ^TEMPL-\d{3}$ (e.g. TEMPL-001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded identifier. |
| `name` | `ENUM` | **YES** | `DAY, EVENING, NIGHT` | Shift Name | `NON-UNIQUE` | Must belong to ShiftType enum. |
| `start_time` | `STRING` | **YES** | `HH:MM:SS (e.g. 07:00:00, 15:00:00, 23:00:00)` | 24h Time | `NON-UNIQUE` | Valid 24-hour time format. |
| `end_time` | `STRING` | **YES** | `HH:MM:SS (e.g. 15:00:00, 23:00:00, 07:00:00)` | 24h Time | `NON-UNIQUE` | Valid 24-hour time format. Overnight shifts roll into next day. |
| `duration_hours` | `FLOAT` | **YES** | `1.0 to 24.0 (Standard: 8.0)` | Hours | `NON-UNIQUE` | Total elapsed working hours for the shift. |
| `break_minutes` | `INTEGER` | **YES** | `0 to 120 (Standard: 30)` | Minutes | `NON-UNIQUE` | Mandatory paid/unpaid meal break duration. |
| `requires_handover` | `BOOLEAN` | **YES** | `True, False` | Flag | `NON-UNIQUE` | Indicates clinical bed-side handover requirement. |

---

## Entity: `CoverageRequirement`
**Description:** Minimum and target staffing quotas per team, date, shift, and required skill.  
**Cardinality:** 1:N with ShiftAssignment compliance evaluation  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `requirement_id` | `STRING` | **YES** | `Pattern: ^REQ-\d{6}$ (e.g. REQ-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded identifier. |
| `team_id` | `STRING` | **YES** | `Pattern: ^TEAM-\d{4}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Team. |
| `shift_template_id` | `STRING` | **YES** | `Pattern: ^TEMPL-\d{3}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing ShiftTemplate. |
| `date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Coverage schedule date. |
| `skill_id` | `STRING` | **YES** | `Pattern: ^SKILL-\d{3}$` | Foreign Key | `NON-UNIQUE` | Mandatory skill requirement for the shift. |
| `min_headcount` | `INTEGER` | **YES** | `>= 1 (Standard: 1 to 4)` | Staff Headcount | `NON-UNIQUE` | Non-negotiable minimum safety staffing. |
| `target_headcount` | `INTEGER` | **YES** | `>= min_headcount` | Staff Headcount | `NON-UNIQUE` | Optimal service staffing level. |

---

## Entity: `ShiftAssignment`
**Description:** Individual scheduled shift allocation for an employee on a specific date.  
**Cardinality:** N:1 with Employee, Team, ShiftTemplate, Skill; 1:N with AttendanceEvent  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `assignment_id` | `STRING` | **YES** | `Pattern: ^SHIFT-\d{4}-\d{2}-\d{2}-[A-Z]-\d{6}$ (e.g. SHIFT-2026-01-01-A-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic date-stamped identifier matching convention. |
| `date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Shift execution date. |
| `shift_template_id` | `STRING` | **YES** | `Pattern: ^TEMPL-\d{3}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing ShiftTemplate. |
| `emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Employee. |
| `team_id` | `STRING` | **YES** | `Pattern: ^TEAM-\d{4}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Team. |
| `assigned_skill_id` | `STRING` | **YES** | `Pattern: ^SKILL-\d{3}$` | Foreign Key | `NON-UNIQUE` | Role/skill fulfilled on this shift. |
| `status` | `ENUM` | **YES** | `SCHEDULED, CONFIRMED, SWAPPED, ABSENT, CANCELLED, COMPLETED` | Assignment State | `NON-UNIQUE` | Must belong to AssignmentStatus enum. |
| `scheduled_hours` | `FLOAT` | **YES** | `0.0 to 24.0 (Standard: 8.0)` | Hours | `NON-UNIQUE` | Derived from ShiftTemplate duration_hours. |
| `is_overtime` | `BOOLEAN` | **YES** | `True, False` | Flag | `NON-UNIQUE` | Derived: True if employee weekly accumulated hours exceed weekly_hours_cap. |
| `created_at` | `TIMESTAMP` | **YES** | `ISO 8601 UTC` | Datetime | `NON-UNIQUE` | Scheduling timestamp. |

---

## Entity: `LeaveRequest`
**Description:** Employee absence request and managerial approval outcome.  
**Cardinality:** N:1 with Employee (requester and approver)  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `leave_id` | `STRING` | **YES** | `Pattern: ^LVE-\d{4}-\d{6}$ (e.g. LVE-2026-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic year-stamped identifier matching convention. |
| `emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Employee. |
| `leave_type` | `ENUM` | **YES** | `ANNUAL, SICK, EMERGENCY, MATERNITY_PATERNITY, UNPAID` | Leave Category | `NON-UNIQUE` | Must belong to LeaveType enum. |
| `start_date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Leave start date. |
| `end_date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `NON-UNIQUE` | Must be greater than or equal to start_date. |
| `status` | `ENUM` | **YES** | `SUBMITTED, APPROVED, REJECTED, CANCELLED` | Approval Lifecycle | `NON-UNIQUE` | Must belong to LeaveStatus enum. |
| `reason` | `STRING` | **YES** | `5-255 characters` | Text | `NON-UNIQUE` | Valid absence justification. |
| `approver_emp_id` | `STRING` | **NO** | `Pattern: ^EMP-\d{6}$ or NULL` | Foreign Key | `NON-UNIQUE` | Manager who decided the request. |
| `submitted_at` | `TIMESTAMP` | **YES** | `ISO 8601 UTC` | Datetime | `NON-UNIQUE` | Submission timestamp, must precede start_date. |
| `decided_at` | `TIMESTAMP` | **NO** | `ISO 8601 UTC or NULL` | Datetime | `NON-UNIQUE` | Must be greater than submitted_at if decided. |

---

## Entity: `HolidayCalendar`
**Description:** Public and jurisdiction-mandated holidays affecting labor pay and scheduling.  
**Cardinality:** Evaluated against schedule dates  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `holiday_id` | `STRING` | **YES** | `Pattern: ^HOL-\d{4}-\d{3}$ (e.g. HOL-2026-001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic year-stamped identifier. |
| `date` | `DATE` | **YES** | `YYYY-MM-DD` | Calendar Date | `UNIQUE` | Holiday calendar date. |
| `name` | `STRING` | **YES** | `e.g. Republic Day, Independence Day, Diwali, New Year's Day` | Holiday Title | `NON-UNIQUE` | Official holiday title. |
| `jurisdiction` | `STRING` | **YES** | `IN-TS, IN-NATIONAL, US-FEDERAL` | Jurisdiction Code | `NON-UNIQUE` | Applicable region. |
| `is_mandatory_off` | `BOOLEAN` | **YES** | `True, False` | Flag | `NON-UNIQUE` | Whether operations are completely halted. |
| `premium_pay_multiplier` | `FLOAT` | **YES** | `1.0 to 3.0 (Standard: 1.5 or 2.0)` | Pay Multiplier | `NON-UNIQUE` | Overtime/holiday wage multiplier. |

---

## Entity: `AttendanceEvent`
**Description:** Biometric or badge clock-in/out timestamped event for roster reconciliation.  
**Cardinality:** N:1 with Employee, N:1 with ShiftAssignment  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `event_id` | `STRING` | **YES** | `Pattern: ^ATT-EMP-\d{6}-\d{8}T\d{6}$ (e.g. ATT-EMP-000001-20260101T070215)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic composite ID matching ATT-<employee-id>-<timestamp>. |
| `emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Must reference an existing Employee. |
| `assignment_id` | `STRING` | **NO** | `Pattern: ^SHIFT-.*$ or NULL` | Foreign Key | `NON-UNIQUE` | References the scheduled ShiftAssignment if mapped. |
| `event_type` | `ENUM` | **YES** | `CLOCK_IN, CLOCK_OUT, BREAK_START, BREAK_END` | Event Type | `NON-UNIQUE` | Must belong to AttendanceEventType enum. |
| `timestamp` | `TIMESTAMP` | **YES** | `ISO 8601 UTC` | Datetime | `NON-UNIQUE` | Exact clock time. |
| `location_verified` | `BOOLEAN` | **YES** | `True, False` | Flag | `NON-UNIQUE` | Geo-fencing or badge reader physical verification. |
| `source` | `ENUM` | **YES** | `BADGE_READER, BIOMETRIC_KIOSK, MOBILE_APP, MANUAL_OVERRIDE` | Capture Source | `NON-UNIQUE` | Must belong to AttendanceSource enum. |

---

## Entity: `SwapRequest`
**Description:** Peer-to-peer shift swap workflow requiring peer agreement and manager approval.  
**Cardinality:** N:1 with requester Employee, target Employee, and ShiftAssignments  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `swap_id` | `STRING` | **YES** | `Pattern: ^SWP-\d{4}-\d{6}$ (e.g. SWP-2026-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic year-stamped identifier matching convention. |
| `requester_emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Employee initiating the swap. |
| `requester_assignment_id` | `STRING` | **YES** | `Pattern: ^SHIFT-.*$` | Foreign Key | `NON-UNIQUE` | Shift owned by requester. |
| `target_emp_id` | `STRING` | **YES** | `Pattern: ^EMP-\d{6}$` | Foreign Key | `NON-UNIQUE` | Target employee proposed for the exchange. |
| `target_assignment_id` | `STRING` | **YES** | `Pattern: ^SHIFT-.*$` | Foreign Key | `NON-UNIQUE` | Shift owned by target employee. |
| `reason` | `STRING` | **YES** | `5-255 characters` | Text | `NON-UNIQUE` | Justification for swap. |
| `status` | `ENUM` | **YES** | `REQUESTED, PEER_ACCEPTED, MANAGER_APPROVED, REJECTED, EXECUTED, CANCELLED` | Workflow Status | `NON-UNIQUE` | Must belong to SwapStatus enum. Cannot transition to EXECUTED without MANAGER_APPROVED. |
| `approver_manager_id` | `STRING` | **NO** | `Pattern: ^EMP-\d{6}$ or NULL` | Foreign Key | `NON-UNIQUE` | Manager granting the approval. |
| `requested_at` | `TIMESTAMP` | **YES** | `ISO 8601 UTC` | Datetime | `NON-UNIQUE` | Initiation timestamp. |
| `decided_at` | `TIMESTAMP` | **NO** | `ISO 8601 UTC or NULL` | Datetime | `NON-UNIQUE` | Approval/rejection decision timestamp. |

---

## Entity: `AuditEvent`
**Description:** Immutable ledger tracking state changes across assignments, swaps, leaves, and exceptions.  
**Cardinality:** Audit log covering all state transitions  

| Field Name | Type | Required | Allowed Values / Pattern | Units | Uniqueness | Validation Rule |
|------------|------|----------|--------------------------|-------|------------|-----------------|
| `audit_id` | `STRING` | **YES** | `Pattern: ^AUD-\d{6}$ (e.g. AUD-000001)` | Alphanumeric ID | `PRIMARY KEY` | Deterministic zero-padded audit identifier. Immutable. |
| `entity_name` | `STRING` | **YES** | `ShiftAssignment, SwapRequest, LeaveRequest, CoverageRequirement, Exception` | Entity Name | `NON-UNIQUE` | Identifies target entity class. |
| `entity_id` | `STRING` | **YES** | `Valid primary key string of target entity` | Target ID | `NON-UNIQUE` | Points to affected entity record. |
| `action` | `ENUM` | **YES** | `CREATE, UPDATE, STATE_TRANSITION, SWAP_EXECUTE, EXCEPTION_QUARANTINE, OVERRIDE` | Action Type | `NON-UNIQUE` | Must belong to AuditAction enum. |
| `from_state` | `STRING` | **NO** | `State string or NULL (for initial creation)` | Prior State | `NON-UNIQUE` | Prior lifecycle status. |
| `to_state` | `STRING` | **YES** | `State string` | New State | `NON-UNIQUE` | Subsequent lifecycle status. |
| `actor_id` | `STRING` | **YES** | `EMP-000001 or SYSTEM` | User/System ID | `NON-UNIQUE` | Identifier of the user or autonomous engine executing the action. |
| `actor_role` | `STRING` | **YES** | `Employee, Manager, HR Partner, IT/Operations Partner, System Administrator` | Actor Role | `NON-UNIQUE` | Matches primary actors specification. |
| `timestamp` | `TIMESTAMP` | **YES** | `ISO 8601 UTC` | Datetime | `NON-UNIQUE` | Immutable audit record timestamp. |
| `details` | `STRING` | **YES** | `Detailed audit reason, validation diff, or trace` | Log Details | `NON-UNIQUE` | Full contextual explanation of the decision. |

---
