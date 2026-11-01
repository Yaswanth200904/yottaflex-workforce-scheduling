"""
Step 9 Data Export and Manifest Engine.
Exports CSV, JSON, and SQLite seed data alongside source manifest,
validation summary, and cryptographic SHA-256 checksums.
"""

import os
import json
import sqlite3
import hashlib
from typing import Dict, Any
import pandas as pd


class DataExporter:
    """Handles multi-format export, SQLite persistence, and manifest generation."""

    def __init__(self, data: Dict[str, pd.DataFrame], output_dir: str = "data"):
        self.data = data
        self.output_dir = output_dir
        self.csv_dir = os.path.join(output_dir, "csv")
        self.json_dir = os.path.join(output_dir, "json")
        self.sqlite_path = os.path.join(output_dir, "database.sqlite")

        os.makedirs(self.csv_dir, exist_ok=True)
        os.makedirs(self.json_dir, exist_ok=True)

    def export_all(
        self,
        seed: int,
        scale: str,
        generator_cmd: str,
        validation_report: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Executes full export to CSV, JSON, SQLite and builds source manifest."""
        manifest = {
            "generator_command": generator_cmd,
            "seed": seed,
            "scale": scale,
            "tables": {},
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
                "csv_sha256": csv_sha,
                "json_sha256": json_sha
            }

        # 2. SQLite Database Persistence
        self._export_sqlite()

        # 3. Write Source Manifest
        manifest_path = os.path.join(self.output_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        return manifest

    def _compute_sha256(self, filepath: str) -> str:
        sha = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha.update(chunk)
        return sha.hexdigest()

    def _export_sqlite(self):
        """Creates SQLite database file and loads all tables."""
        if os.path.exists(self.sqlite_path):
            os.remove(self.sqlite_path)

        conn = sqlite3.connect(self.sqlite_path)
        try:
            for name, df in self.data.items():
                df.to_sql(name, conn, index=False, if_exists="replace")
            conn.commit()
        finally:
            conn.close()
