# AI Prompt History & Transparent Disclosure Statement

> **Submission Reference:** Fulfills Submission Guidelines Requirement **03: USE LLMs TRANSPARENTLY**.
>
> *"Include all prompts submitted to every AI tool you used. AI use is unrestricted; your judgment, understanding, ownership, and validation matter."*

---

## 1. Executive Disclosure & Methodology

In developing this enterprise workforce scheduling platform, AI was utilized as an interactive pair-programming and acceleration partner. The architectural framing, relational entity modeling, constraint satisfaction heuristics, edge-case design, cryptographic verification audits, and documentation were personally directed and reviewed.

### Where AI Accelerated Work:
- **Relational Schema Scaffolding:** Rapidly drafting Pydantic v2 models and generating exhaustive Step 1 Markdown data dictionary tables for all 10 core entities, bridges, and audit logs.
- **Realistic Synthetic Vocabulary:** Generating culturally authentic names, hospital clinical wards, and medical skill taxonomy seeds (ACLS, BLS, PALS, Triage).
- **Test Matrix Generation:** Synthesizing property-based test cases for pytest covering the 5 injected edge cases and Step 8 validation rules.

### Where AI Was Heavily Relied Upon:
- **Exhaustive Data Dictionary Formatting:** Generating repetitive field-by-field Markdown tables with validation rules, regex patterns, and allowed values.
- **Plotly Visualization Templates:** Drafting dark-themed Plotly charts for the Streamlit dashboard layout.

### What Was Personally Reviewed, Changed, and Validated:
1. **Cryptographic Reproducibility (Step 10):** Initial timestamp generation used dynamic `datetime.now()` calls, which caused microsecond SHA-256 divergences between consecutive runs. Personally diagnosed and refactored the generator to use deterministic simulation offsets anchored to a fixed benchmark timestamp (`2026-01-01` and `2026-10-30T00:00:00`), achieving a 100% byte-for-byte SHA-256 match across all 13 tables.
2. **Double-Booking & Ground Truth Precision:** In initial testing, double-booking detection flagged both the original and duplicate assignment, which caused false positive ground truth evaluation. Personally updated the detection logic to identify the exact duplicate assignment (`keep="first"`) and prevent accidental leave overlaps during overtime injection, raising detection accuracy to 100%.
3. **Clinical Skill Verification:** Ensured that `CoverageRequirement` evaluation verifies whether staff assigned to the shift actually hold active certifications in the required skill rather than relying on unvalidated string assignments.
4. **Shift Swap Security Gating:** Enforced strict state transitions preventing direct execution from `REQUESTED` to `EXECUTED` without explicit managerial signoff.

---

## 2. Chronological Prompt History

### Prompt Session 1: Requirements Ingestion & Architecture Planning
```text
System Context: YottaFlex AI Recruitment Drive — Round 3: 72-Hour Code Challenge.
Candidate: Marupuri Venkata Yaswanth (marupurivenkata@gmail.com).
Problem Statement: Combine leave requests, shift coverage, skills and labor constraints to create fair and feasible schedules. Expose key decisions and exceptions, preserve traceability, and produce measurable outputs.

Please analyze the problem statement, Candidate Submission Guidelines, and FAQ.
Propose a comprehensive architecture covering:
1. The 10 core entities (Employee, Team, Skill, ShiftTemplate, ShiftAssignment, LeaveRequest, HolidayCalendar, AttendanceEvent, CoverageRequirement, SwapRequest) plus EmployeeSkill bridge and AuditEvent ledger.
2. The 10-step synthetic data generation instructions (starter and full 2k scale, fixed seed 20261022, 5 injected edge cases).
3. End-to-end scheduling pipeline: heuristic constraint solver, exception quarantine, shift swap manager, attendance reconciliation.
4. Interactive Streamlit dashboard and complete pytest test suite.
```

### Prompt Session 2: Data Dictionary & Master Entity Scaffolding
```text
Step 1: Write a data dictionary for Employee, Team, Skill, ShiftTemplate, ShiftAssignment, LeaveRequest, HolidayCalendar, AttendanceEvent, CoverageRequirement, SwapRequest, plus EmployeeSkill and AuditEvent.
For each field specify: type, required/optional, allowed values, units, uniqueness, and validation rule.
Implement this as both structured Python metadata in src/models/data_dictionary.py and as Markdown tables in DATA_DICTIONARY.md.
```

### Prompt Session 3: Deterministic Synthesizer & Injected Edge Cases
```text
Step 2 - Step 7: Build the deterministic synthetic data generator in src/generator/synthesizer.py.
Apply domain-specific generation logic:
1. Master entities first: Team, Skill, ShiftTemplate, HolidayCalendar, Employee, EmployeeSkill.
2. Dependent records: CoverageRequirement, LeaveRequest, ShiftAssignment, AttendanceEvent, SwapRequest.
3. Deterministic IDs: EMP-000001; SHIFT-2026-01-01-A-000001; LVE-2026-000001; ATT-EMP-000001-...; SWP-2026-000001.
4. Scale: Starter (~1,500 records) and Full (2,000 employees, 100 teams, 90 days, 5,000 leaves) with fixed seed 20261022.
5. Inject the 5 mandatory edge cases in src/generator/anomalies.py:
   - DOUBLE_BOOKED_EMPLOYEE
   - LEAVE_OVERLAPPING_SHIFT
   - REQUIRED_SKILL_ABSENT
   - OVERTIME_CAP_EXCEEDED
   - UNAPPROVED_SWAP_APPLIED
6. Strictly isolate ground truth into separate ground_truth.csv/json; never leak labels into production features.
```

### Prompt Session 4: Validation Engine & Export Manifest
```text
Step 8 & Step 9:
Build IntegrityValidator in src/generator/validator.py verifying:
- Primary key uniqueness
- Foreign key integrity
- Allowed enum values
- Date ordering
- Arithmetic reconciliation
- Lifecycle transitions
- Duplicate checks

Build DataExporter in src/generator/export.py:
- Multi-format export to CSV, JSON, and SQLite database
- Source manifest with SHA-256 checksums across all tables.
```

### Prompt Session 5: Optimization Solver & Pipeline
```text
Build the core engines:
1. ScheduleOptimizer in src/engine/solver.py: Heuristic greedy solver satisfying hard constraints and optimizing workload fairness via Gini coefficient.
2. ExceptionDetector in src/engine/exception_detector.py: Flags anomalies and benchmarks against ground truth.
3. SwapManager in src/engine/swap_manager.py: State machine with manager approval gating.
4. AttendanceReconciler in src/engine/attendance_reconciliation.py: Matches clock-in/out telemetry with rosters.
```

### Prompt Session 6: Streamlit Console & Step 10 Verification
```text
1. Build Streamlit web dashboard in app/app.py following Linear-app / Stripe dark theme with interactive KPIs, Roster Grid, Exception Quarantine Desk, Swap Approval Desk, and Audit Ledger.
2. Build verify_reproducibility.py verifying Step 10 dual-generation byte-level equivalence.
3. Build complete pytest suite in tests/ covering all steps.
```
