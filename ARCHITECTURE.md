# System Architecture & Technical Specification

> **Candidate:** Marupuri Venkata Yaswanth (`marupurivenkata@gmail.com`)  
> **Challenge:** YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform  
> **Submission Window:** 72-Hour Code Challenge (Round 3)

---

## 1. Executive Summary & Objective

Workforce management in healthcare clinical wards requires continuous balance between patient acuity demands and strict labor regulations. The **YottaFlex Enterprise AI Workforce Scheduling Platform** is an end-to-end operational engine that harmonizes:
1. **Mandatory Clinical Staffing Ratios:** Required headcounts per shift rotation (Day, Evening, Night) and ward specialty (ICU, Emergency, Surgery).
2. **Specialized Skill Certifications:** Mandatory competency requirements (e.g. ACLS, BLS, Triage, PALS) verified via bridge relationships.
3. **Employee Availability & Absence Windows:** Respecting approved annual, sick, and emergency leave requests without silent scheduling collisions.
4. **Labor Law & Fairness Constraints:** Weekly 40-hour caps, maximum consecutive working days (5 days), minimum 11-hour rest intervals, and equitable weekend rotation balancing measured via the Gini Index.
5. **Exception Traceability & Audit Gating:** Isolating anomalies in a quarantine queue with 1-click remediation, preserving every state change in an immutable `AuditEvent` ledger.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Data_Layer [Relational Master & Event Data]
        M1[Master Entities: Employee, Team, Skill, ShiftTemplate, HolidayCalendar]
        M2[Relational Bridge: EmployeeSkill M:N]
        M3[Operational Demands: CoverageRequirements]
        M4[Transactions: LeaveRequests & AttendanceEvents]
        
        M1 --> M2
        M1 --> M3
        M1 --> M4
    end

    subgraph Core_Engine [Optimization, Validation & Quarantine Engine]
        E1[ScheduleOptimizer: Heuristic Constraint Solver]
        E2[ExceptionDetector: Multi-pass Constraint Scanner]
        E3[SwapManager: State Machine & Policy Gate]
        E4[AttendanceReconciler: Clock Telemetry Matcher]

        M1 & M2 & M3 & M4 --> E1
        E1 --> S1[Feasible Shift Assignments]
        S1 --> E2
        E2 -->|Anomaly Detected| Q1[Exception Quarantine Queue]
        E2 -->|Clean Shifts| R1[Published Ward Rosters]
        
        R1 & M4 --> E4
        R1 --> E3
    end

    subgraph Persistence_Ledger [Immutable Storage & Export]
        P1[(SQLite Enterprise DB)]
        P2[CSV / JSON Relational Files]
        P3[Source Manifest & SHA-256 Checksums]
        P4[Immutable AuditEvent Ledger]
        P5[Isolated ground_truth.csv / json]

        E3 --> P4
        E2 --> P5
        S1 & R1 & Q1 --> P1 & P2 & P3
    end

    subgraph Presentation_Layer [Operations & User Consoles]
        U1[Streamlit Shift Intelligence Console]
        U2[WorkforceOS React 19 Frontend]
        
        P1 & P4 & Q1 --> U1
        P1 --> U2
    end
```

---

## 3. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    TEAM ||--o{ EMPLOYEE : employs
    TEAM ||--o{ COVERAGE_REQUIREMENT : defines
    TEAM ||--o{ SHIFT_ASSIGNMENT : schedules
    
    EMPLOYEE ||--o{ EMPLOYEE_SKILL : possesses
    SKILL ||--o{ EMPLOYEE_SKILL : categorized_in
    
    SKILL ||--o{ COVERAGE_REQUIREMENT : mandates
    SHIFT_TEMPLATE ||--o{ COVERAGE_REQUIREMENT : applies_to
    SHIFT_TEMPLATE ||--o{ SHIFT_ASSIGNMENT : specifies
    
    EMPLOYEE ||--o{ SHIFT_ASSIGNMENT : assigned_to
    SKILL ||--o{ SHIFT_ASSIGNMENT : fulfills
    
    EMPLOYEE ||--o{ LEAVE_REQUEST : submits
    EMPLOYEE ||--o{ LEAVE_REQUEST : approves
    
    EMPLOYEE ||--o{ ATTENDANCE_EVENT : records
    SHIFT_ASSIGNMENT ||--o{ ATTENDANCE_EVENT : reconciles
    
    EMPLOYEE ||--o{ SWAP_REQUEST : requests
    EMPLOYEE ||--o{ SWAP_REQUEST : targets
    EMPLOYEE ||--o{ SWAP_REQUEST : approves_manager
    SHIFT_ASSIGNMENT ||--o{ SWAP_REQUEST : requester_shift
    SHIFT_ASSIGNMENT ||--o{ SWAP_REQUEST : target_shift

    EMPLOYEE {
        string emp_id PK
        string name
        string email
        string team_id FK
        string role
        float weekly_hours_cap
        int max_consecutive_days
        float hourly_rate
        string status
        date hire_date
    }

    TEAM {
        string team_id PK
        string name
        string department
        string manager_emp_id FK
        string timezone
        timestamp created_at
    }

    SKILL {
        string skill_id PK
        string name
        string category
        string description
    }

    EMPLOYEE_SKILL {
        string bridge_id PK
        string emp_id FK
        string skill_id FK
        string proficiency_level
        date certified_date
        date expiry_date
    }

    SHIFT_TEMPLATE {
        string shift_template_id PK
        string name
        string start_time
        string end_time
        float duration_hours
        int break_minutes
        boolean requires_handover
    }

    COVERAGE_REQUIREMENT {
        string requirement_id PK
        string team_id FK
        string shift_template_id FK
        date date
        string skill_id FK
        int min_headcount
        int target_headcount
    }

    SHIFT_ASSIGNMENT {
        string assignment_id PK
        date date
        string shift_template_id FK
        string emp_id FK
        string team_id FK
        string assigned_skill_id FK
        string status
        float scheduled_hours
        boolean is_overtime
        timestamp created_at
    }

    LEAVE_REQUEST {
        string leave_id PK
        string emp_id FK
        string leave_type
        date start_date
        date end_date
        string status
        string reason
        string approver_emp_id FK
        timestamp submitted_at
        timestamp decided_at
    }

    ATTENDANCE_EVENT {
        string event_id PK
        string emp_id FK
        string assignment_id FK
        string event_type
        timestamp timestamp
        boolean location_verified
        string source
    }

    SWAP_REQUEST {
        string swap_id PK
        string requester_emp_id FK
        string requester_assignment_id FK
        string target_emp_id FK
        string target_assignment_id FK
        string reason
        string status
        string approver_manager_id FK
        timestamp requested_at
        timestamp decided_at
    }

    AUDIT_EVENT {
        string audit_id PK
        string entity_name
        string entity_id
        string action
        string from_state
        string to_state
        string actor_id
        string actor_role
        timestamp timestamp
        string details
    }
```

---

## 4. Primary Actors & Responsibilities

| Actor / System | Functional Touchpoints & Responsibilities |
|---|---|
| **Employee / Candidate** | Submits leave requests, browses published personal rosters, initiates peer-to-peer shift swap proposals. |
| **Nurse Manager / Department Lead** | Evaluates and approves leave requests, reviews coverage shortfalls, authorizes shift swaps, resolves quarantined exceptions. |
| **HR Partner** | Configures labor compliance policies (weekly 40h cap, rest periods, overtime authorization gates, holiday pay multipliers). |
| **IT / Operations Partner** | Supervises biometric attendance badge readers, integration pipelines, and cryptographic dataset verification. |
| **System Administrator** | Manages master data (Teams, Skills, ShiftTemplates), reviews immutable audit trails, triggers deterministic data generation. |

---

## 5. Constraint Optimization & Exception Handling

### Hard Constraints (Non-Negotiable)
1. **Feasibility (Zero Double-Booking):** An employee cannot be assigned to more than one shift within any 24-hour cycle.
2. **Absence Protection:** Zero shifts scheduled for an employee during an `APPROVED` leave request window.
3. **Clinical Competency:** Every shift rotation must meet or exceed `min_headcount` with staff certified in the mandatory skill.
4. **Labor Cap:** Cumulative weekly scheduled hours cannot exceed `weekly_hours_cap` (40.0h) without an explicit overtime waiver.

### Soft Objectives (Optimized)
1. **Workload Equity (Gini Index Minimization):** Distributes total monthly hours evenly among team members to prevent nurse burnout.
2. **Weekend Shift Balancing:** Distributes Saturday/Sunday shifts equally across the roster cycle.
3. **Shift Continuity:** Minimizes erratic rotation switching (e.g. Day to Night to Day) to promote circadian rhythm health.

---

## 6. Immutable Audit Event Architecture

Every state mutation in the platform generates an immutable `AuditEvent` containing:
- `audit_id`: Deterministic zero-padded identifier (`AUD-000001`).
- `entity_name`: Target entity class (`ShiftAssignment`, `SwapRequest`, `LeaveRequest`, `Exception`).
- `entity_id`: Primary key of the affected record.
- `action`: Event classification (`CREATE`, `STATE_TRANSITION`, `SWAP_EXECUTE`, `EXCEPTION_QUARANTINE`, `OVERRIDE`).
- `from_state` $\to$ `to_state`: Exact lifecycle transition.
- `actor_id` & `actor_role`: Responsible party (`Manager`, `Employee`, `System Administrator`).
- `timestamp`: UTC ISO timestamp.
- `details`: Tamper-evident trace.
