"""
Step 9 Data Export and Manifest Engine.
Exports CSV, JSON, and SQL/SQLite seed data alongside source manifest,
validation summary, and cryptographic SHA-256 checksums.
"""

import os
import json
import sqlite3
import hashlib
from typing import Dict, Any
import pandas as pd


SCHEMA_SQL_DDL = """-- YottaFlex Workforce Scheduling Relational Schema (DDL)
-- Candidate: Marupuri Venkata Yaswanth (marupurivenkata@gmail.com)
-- Enterprise Workforce Scheduling Platform

CREATE TABLE IF NOT EXISTS teams (
    team_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    manager_emp_id VARCHAR(12),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
    skill_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shift_templates (
    shift_template_id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours REAL NOT NULL,
    break_minutes INTEGER DEFAULT 30,
    requires_handover BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS holidays (
    holiday_id VARCHAR(12) PRIMARY KEY,
    date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    jurisdiction VARCHAR(20) DEFAULT 'IN-TS',
    is_mandatory_off BOOLEAN DEFAULT 0,
    premium_pay_multiplier REAL DEFAULT 1.5
);

CREATE TABLE IF NOT EXISTS employees (
    emp_id VARCHAR(12) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    team_id VARCHAR(10) NOT NULL,
    role VARCHAR(50) NOT NULL,
    weekly_hours_cap REAL DEFAULT 40.0,
    max_consecutive_days INTEGER DEFAULT 5,
    hourly_rate REAL NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    hire_date DATE NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id)
);

CREATE TABLE IF NOT EXISTS employee_skills (
    bridge_id VARCHAR(16) PRIMARY KEY,
    emp_id VARCHAR(12) NOT NULL,
    skill_id VARCHAR(10) NOT NULL,
    proficiency_level VARCHAR(20) DEFAULT 'INTERMEDIATE',
    certified_date DATE NOT NULL,
    expiry_date DATE,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);

CREATE TABLE IF NOT EXISTS coverage_requirements (
    requirement_id VARCHAR(12) PRIMARY KEY,
    team_id VARCHAR(10) NOT NULL,
    shift_template_id VARCHAR(10) NOT NULL,
    date DATE NOT NULL,
    skill_id VARCHAR(10) NOT NULL,
    min_headcount INTEGER NOT NULL,
    target_headcount INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (shift_template_id) REFERENCES shift_templates(shift_template_id),
    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
);

CREATE TABLE IF NOT EXISTS shift_assignments (
    assignment_id VARCHAR(32) PRIMARY KEY,
    date DATE NOT NULL,
    shift_template_id VARCHAR(10) NOT NULL,
    emp_id VARCHAR(12) NOT NULL,
    team_id VARCHAR(10) NOT NULL,
    assigned_skill_id VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    scheduled_hours REAL DEFAULT 8.0,
    is_overtime BOOLEAN DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (shift_template_id) REFERENCES shift_templates(shift_template_id),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (team_id) REFERENCES teams(team_id),
    FOREIGN KEY (assigned_skill_id) REFERENCES skills(skill_id)
);

CREATE TABLE IF NOT EXISTS leave_requests (
    leave_id VARCHAR(16) PRIMARY KEY,
    emp_id VARCHAR(12) NOT NULL,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'SUBMITTED',
    reason TEXT NOT NULL,
    approver_emp_id VARCHAR(12),
    submitted_at TIMESTAMP NOT NULL,
    decided_at TIMESTAMP,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (approver_emp_id) REFERENCES employees(emp_id)
);

CREATE TABLE IF NOT EXISTS attendance_events (
    event_id VARCHAR(36) PRIMARY KEY,
    emp_id VARCHAR(12) NOT NULL,
    assignment_id VARCHAR(32),
    event_type VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    location_verified BOOLEAN DEFAULT 1,
    source VARCHAR(30) DEFAULT 'BADGE_READER',
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (assignment_id) REFERENCES shift_assignments(assignment_id)
);

CREATE TABLE IF NOT EXISTS swap_requests (
    swap_id VARCHAR(16) PRIMARY KEY,
    requester_emp_id VARCHAR(12) NOT NULL,
    requester_assignment_id VARCHAR(32) NOT NULL,
    target_emp_id VARCHAR(12) NOT NULL,
    target_assignment_id VARCHAR(32) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'REQUESTED',
    approver_manager_id VARCHAR(12),
    requested_at TIMESTAMP NOT NULL,
    decided_at TIMESTAMP,
    FOREIGN KEY (requester_emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (target_emp_id) REFERENCES employees(emp_id),
    FOREIGN KEY (approver_manager_id) REFERENCES employees(emp_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
    audit_id VARCHAR(12) PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    action VARCHAR(30) NOT NULL,
    from_state VARCHAR(30),
    to_state VARCHAR(30) NOT NULL,
    actor_id VARCHAR(20) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    details TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ground_truth (
    ground_truth_id VARCHAR(12) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36) NOT NULL,
    anomaly_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    field_affected VARCHAR(50) NOT NULL,
    raw_value TEXT,
    expected_clean_value TEXT,
    detection_rule TEXT NOT NULL,
    flagged_at TIMESTAMP NOT NULL
);

-- Optimization Performance Indexes
CREATE INDEX IF NOT EXISTS idx_emp_team ON employees(team_id);
CREATE INDEX IF NOT EXISTS idx_assign_emp_date ON shift_assignments(emp_id, date);
CREATE INDEX IF NOT EXISTS idx_assign_team_date ON shift_assignments(team_id, date);
CREATE INDEX IF NOT EXISTS idx_req_team_date ON coverage_requirements(team_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(emp_id, status);
CREATE INDEX IF NOT EXISTS idx_att_emp_assign ON attendance_events(emp_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_swap_status ON swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_name, entity_id);
"""


class DataExporter:
    """Handles multi-format export, SQL scripts, SQLite persistence, and manifest generation."""

    def __init__(self, data: Dict[str, pd.DataFrame], output_dir: str = "data"):
        self.data = data
        self.output_dir = output_dir
        self.csv_dir = os.path.join(output_dir, "csv")
        self.json_dir = os.path.join(output_dir, "json")
        self.sql_dir = os.path.join(output_dir, "sql")
        self.sqlite_path = os.path.join(output_dir, "database.sqlite")

        os.makedirs(self.csv_dir, exist_ok=True)
        os.makedirs(self.json_dir, exist_ok=True)
        os.makedirs(self.sql_dir, exist_ok=True)

    def export_all(
        self,
        seed: int,
        scale: str,
        generator_cmd: str,
        validation_report: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Executes full export to CSV, JSON, SQL DDL/seeds, SQLite and builds source manifest."""
        manifest = {
            "generator_command": generator_cmd,
            "seed": seed,
            "scale": scale,
            "tables": {},
            "database_artifacts": {},
            "validation_summary": {
                "passed": validation_report["passed"],
                "error_count": validation_report["error_count"],
                "warning_count": validation_report["warning_count"]
            }
        }

        # 1. Export CSV & JSON + compute SHA-256
        for name, df in self.data.items():
            csv_file = os.path.join(self.csv_dir, f"{name}.csv")
            json_file = os.path.join(self.json_dir, f"{name}.json")

            # CSV export
            df.to_csv(csv_file, index=False)
            
            # JSON export
            df.to_json(json_file, orient="records", indent=2)

            # Compute SHA-256 checksums
            csv_sha = self._compute_sha256(csv_file)
            json_sha = self._compute_sha256(json_file)

            manifest["tables"][name] = {
                "row_count": len(df),
                "columns": list(df.columns),
                "csv_path": csv_file.replace("\\", "/"),
                "json_path": json_file.replace("\\", "/"),
                "csv_sha256": csv_sha,
                "json_sha256": json_sha
            }

        # 2. SQLite Database Persistence
        self._export_sqlite()
        sqlite_sha = self._compute_sha256(self.sqlite_path)
        manifest["database_artifacts"]["sqlite_database"] = {
            "path": self.sqlite_path.replace("\\", "/"),
            "sha256": sqlite_sha
        }

        # 3. Export SQL Schema (DDL) and SQL Seed Data
        schema_file = os.path.join(self.sql_dir, "schema.sql")
        with open(schema_file, "w", encoding="utf-8") as f:
            f.write(SCHEMA_SQL_DDL)

        seed_sql_file = os.path.join(self.sql_dir, "seed_data.sql")
        self._export_sql_dump(seed_sql_file)

        manifest["database_artifacts"]["sql_schema"] = {
            "path": schema_file.replace("\\", "/"),
            "sha256": self._compute_sha256(schema_file)
        }
        manifest["database_artifacts"]["sql_seed_data"] = {
            "path": seed_sql_file.replace("\\", "/"),
            "sha256": self._compute_sha256(seed_sql_file)
        }

        # 4. Write Source Manifest (both manifest.json and source_manifest.json)
        for m_name in ["manifest.json", "source_manifest.json"]:
            m_path = os.path.join(self.output_dir, m_name)
            with open(m_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2)

        # 5. Write Validation Summary
        val_summary_path = os.path.join(self.output_dir, "validation_summary.json")
        with open(val_summary_path, "w", encoding="utf-8") as f:
            json.dump(validation_report, f, indent=2)

        return manifest

    def _compute_sha256(self, filepath: str) -> str:
        sha = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha.update(chunk)
        return sha.hexdigest()

    def _export_sqlite(self):
        """Creates SQLite database file and loads all tables with performance indexes."""
        if os.path.exists(self.sqlite_path):
            try:
                os.remove(self.sqlite_path)
            except OSError:
                pass

        conn = sqlite3.connect(self.sqlite_path)
        try:
            for name, df in self.data.items():
                df.to_sql(name, conn, index=False, if_exists="replace")

            # Execute schema optimization indexes
            cur = conn.cursor()
            cur.execute("CREATE INDEX IF NOT EXISTS idx_emp_team ON employees(team_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_assign_emp_date ON shift_assignments(emp_id, date);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_assign_team_date ON shift_assignments(team_id, date);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_req_team_date ON coverage_requirements(team_id, date);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_leave_emp ON leave_requests(emp_id, status);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_att_emp_assign ON attendance_events(emp_id, assignment_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_swap_status ON swap_requests(status);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_name, entity_id);")
            conn.commit()
        finally:
            conn.close()

    def _export_sql_dump(self, output_path: str):
        """Generates standard SQL DDL and INSERT statements from SQLite database."""
        conn = sqlite3.connect(self.sqlite_path)
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                f.write("-- =====================================================================\n")
                f.write("-- YottaFlex Enterprise Workforce Scheduling Seed Data Dump (SQL)\n")
                f.write("-- Candidate: Marupuri Venkata Yaswanth (marupurivenkata@gmail.com)\n")
                f.write("-- Generated via Step 9 Specification\n")
                f.write("-- =====================================================================\n\n")
                for line in conn.iterdump():
                    f.write(f"{line}\n")
        finally:
            conn.close()
