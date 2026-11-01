# Architecture Decision Records (ADRs)

> **Candidate:** Marupuri Venkata Yaswanth (`marupurivenkata@gmail.com`)  
> **Challenge:** YottaFlex AI Candidate Project — Enterprise Workforce Scheduling Platform  
> **Submission Window:** 72-Hour Code Challenge (Round 3)

---

## ADR-001: Strict Separation of Ground Truth from Production Input Features

- **Context:** Step 7 requires producing a separate `ground_truth.csv`/`json` for known anomalies and labels, and explicitly states: *"never leak it into input features."*
- **Decision:** Ground truth records are managed entirely through an independent `AnomalyManager` ledger. Entity dataframes (`shift_assignments`, `swap_requests`, `employees`) contain only raw operational fields (`assignment_id`, `emp_id`, `date`, `status`). Anomaly columns (`anomaly_type`, `ground_truth_id`, `detection_rule`) are never injected into production tables.
- **Consequences:** Eliminates data leakage during model training and evaluation; mimics real-world enterprise telemetry where anomaly detection engines must discover violations purely from observable operational data.

---

## ADR-002: Fixed Benchmark Timestamps for Step 10 Cryptographic Reproducibility

- **Context:** Step 10 requires generating data twice with identical seed (`20261022`) and proving byte-for-byte reproducibility via row counts and SHA-256 checksums.
- **Decision:** All simulation timestamps, audit generation events, and anomaly logging use deterministic datetime arithmetic anchored to a fixed base date (`2026-01-01` and benchmark timestamp `2026-10-30T00:00:00`). Dynamic system calls like `datetime.utcnow()` were strictly prohibited.
- **Consequences:** Asserts 100% byte-level SHA-256 matching across all 13 tables across independent execution environments and operating systems.

---

## ADR-003: Heuristic Greedy Solver vs Integer Linear Programming (ILP)

- **Context:** Solving hospital workforce schedules involves NP-hard combinatorial constraints across 2,000 employees, 100 teams, 90 days, and 5,000 leaves.
- **Decision:** Implemented a prioritized greedy heuristic solver with fairness balancing rather than an external heavyweight solver like CPLEX or Gurobi.
- **Consequences:** Zero external binary dependencies; runs in $< 2$ seconds for starter datasets and $< 10$ seconds for full-scale benchmarks; transparent decision log explaining the exact rationale for every slot allocation.

---

## ADR-004: Immutable Audit Event Ledger vs In-Place Row Mutation

- **Context:** Business Rule 4 requires: *"Persist state changes as explicit records/events where relevant; do not overwrite history."*
- **Decision:** Every lifecycle state change (`ShiftAssignment` creation, `LeaveRequest` approval, `SwapRequest` execution, `Exception` quarantine/resolution) appends an immutable `AuditEvent` record with previous state, new state, actor ID, actor role, timestamp, and context details.
- **Consequences:** Preserves complete operational lineage; provides tamper-evident audit trails for regulatory compliance (HIPAA / healthcare labor audits).

---

## ADR-005: Dual-Surface Architecture (Streamlit Console + React 19 Frontend)

- **Context:** Requirement 01 specifies: *"Submit working, executable code. Include clear steps so another person can install dependencies, configure the project, run it, and verify key behavior."*
- **Decision:** Provided both an interactive, zero-configuration Python Streamlit operations console (`app/app.py`) for immediate review and testing, alongside the modern React 19 + TypeScript + Tailwind v4 frontend (`frontend/`).
- **Consequences:** Evaluators can inspect live data, resolve exceptions, and approve swaps immediately in Python without requiring a separate Node.js build pipeline, while retaining the full enterprise web app.
