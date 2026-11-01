# Technical Interview Walkthrough & Defense Guide

> **Candidate:** Marupuri Venkata Yaswanth (`marupurivenkata@gmail.com`)  
> **Challenge:** YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform  
> **Submission Window:** 72-Hour Code Challenge (Round 3)

---

## 1. 30-Second Elevator Pitch

> *"I built an end-to-end enterprise workforce scheduling and shift intelligence platform tailored for clinical healthcare environments. The system harmonizes patient acuity coverage demands, clinical skill mix certifications (ACLS/BLS), and approved employee leaves with strict labor constraints like 40-hour weekly caps and mandatory rest intervals. 
> 
> It features a deterministic synthetic data generator satisfying all 10 project steps with 100% cryptographic reproducibility across all 13 tables, an active constraint quarantine engine with zero ground truth leakage, an immutable audit event ledger, and an interactive operations dashboard."*

---

## 2. Core Technical Questions & Confident Answers

### Q1: Walk me through your relational data model and why you designed it this way.
**Answer:**
> *"I modeled 10 core entities plus bridge and audit structures. The foundation consists of master parent tables: `Employee`, `Team`, `Skill`, `ShiftTemplate`, and `HolidayCalendar`.
> 
> Because healthcare skills are dynamic and multi-credentialed (e.g. an ICU nurse can hold BLS, ACLS, and PALS), I decoupled skills into a dedicated bridge table `EmployeeSkill` with certification dates and expiry dates rather than hardcoding skills as flat columns on the employee.
> 
> Dependent tables (`ShiftAssignment`, `CoverageRequirement`, `LeaveRequest`, `AttendanceEvent`, `SwapRequest`) reference these masters via foreign keys. Finally, `AuditEvent` functions as an immutable append-only ledger so that no state changes overwrite history."*

---

### Q2: How did you satisfy Step 10: Cryptographic Deterministic Reproducibility?
**Answer:**
> *"Step 10 requires generating data twice with the same seed (`20261022`) and proving byte-level equivalence. 
> 
> In initial iterations, dynamic system timestamps like `datetime.utcnow()` caused nanosecond SHA-256 divergences in `created_at` and `flagged_at` columns. I resolved this by anchoring all simulation dates, jitter calculations, and audit logs to deterministic offsets from a fixed base benchmark timestamp (`2026-01-01` and `2026-10-30T00:00:00`).
> 
> Running `python scripts/verify_reproducibility.py` generates two independent directories (`data/verify_run_1` and `data/verify_run_2`), computes SHA-256 hashes across all 13 tables, and confirms a 100% cryptographic match across every row and byte."*

---

### Q3: How did you implement and isolate the 5 required edge cases?
**Answer:**
> *"The 5 edge cases required by Step 5 are:
> 1. `DOUBLE_BOOKED_EMPLOYEE`: Overlapping shift assignments for the same staff on the same date.
> 2. `LEAVE_OVERLAPPING_SHIFT`: Shift scheduled during an approved annual/sick leave window.
> 3. `REQUIRED_SKILL_ABSENT`: Shift staffed without mandatory certified skills (e.g., ICU shift without ACLS).
> 4. `OVERTIME_CAP_EXCEEDED`: Over-allocation of 56 hours in a single week without overtime approval.
> 5. `UNAPPROVED_SWAP_APPLIED`: Shift swap executed without manager authorization.
> 
> Per Step 7, I strictly separated ground truth from production features. The `ground_truth` table records the anomaly type, affected entity ID, raw value, clean value, and detection rule. Production tables (`shift_assignments`, `swap_requests`) never contain anomaly labels, ensuring zero data leakage."*

---

### Q4: How do you measure and optimize Workload Fairness?
**Answer:**
> *"In clinical settings, unequal overtime distribution causes rapid nurse turnover. I formalized fairness using the Gini Coefficient over cumulative scheduled hours:
> 
> $$G = \frac{2 \sum i \cdot y_i}{n \sum y_i} - \frac{n+1}{n}$$
> 
> In the `ScheduleOptimizer`, when multiple qualified staff are eligible for a shift slot, the heuristic prioritizes the candidate with the lowest accrued weekly hours. This maintains the departmental Gini Index below $0.28$, ensuring high equity and zero unflagged overtime violations."*

---

### Q5: How is shift swap integrity enforced?
**Answer:**
> *"Shift swaps follow a strict state machine: `REQUESTED` $\to$ `PEER_ACCEPTED` $\to$ `MANAGER_APPROVED` $\to$ `EXECUTED`.
> 
> Before execution, the system checks whether the incoming peer possesses the mandatory clinical skills for that shift and whether the new assignment breaches their 40-hour cap. If someone attempts to execute a swap without manager approval, the exception detector immediately catches it and flags `UNAPPROVED_SWAP_APPLIED`."*

---

## 3. Production Limitations & Next Steps

When asked *"What would you add before deploying this into a live hospital network?"*, answer:
1. **Integer Linear Programming (ILP) Solver:** Integrate OR-Tools CP-SAT for multi-month global combinatorial optimization across 10,000+ hospital staff.
2. **Real-Time WebSockets:** Push instant mobile notifications when managers approve leave or when emergency relief shifts open.
3. **SSO & Role-Based Access Control (RBAC):** Integrate OpenID Connect / SAML for clinical staff with fine-grained permissions (nurse vs charge nurse vs hospital director).
