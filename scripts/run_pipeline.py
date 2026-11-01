"""
End-to-End Workforce Scheduling Pipeline CLI.
Usage:
    python scripts/run_pipeline.py
"""

import sys
import os
import glob
import pandas as pd
from tabulate import tabulate

# Guard UTF-8 on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.generator.synthesizer import SyntheticDataGenerator
from src.engine.solver import ScheduleOptimizer
from src.engine.exception_detector import ExceptionDetector
from src.engine.attendance_reconciliation import AttendanceReconciler
from src.evaluation.metrics import SchedulingMetricsEvaluator


def load_or_generate_data(data_dir: str = "data") -> dict:
    csv_dir = os.path.join(data_dir, "csv")
    if not os.path.exists(csv_dir) or not os.listdir(csv_dir):
        print("  -> Data directory empty. Running starter generator first...")
        gen = SyntheticDataGenerator(seed=20261022, scale="starter")
        return gen.generate_all()

    data = {}
    for f in glob.glob(os.path.join(csv_dir, "*.csv")):
        name = os.path.splitext(os.path.basename(f))[0]
        data[name] = pd.read_csv(f)
    return data


def main():
    print("\n" + "=" * 75)
    print("⚡ YOTTAFLEX ENTERPRISE WORKFORCE SCHEDULING & SHIFT INTELLIGENCE PIPELINE")
    print("=" * 75)

    # 1. Load Data
    print("\n[Step 1/4] Loading Relational Master & Dependent Records...")
    data = load_or_generate_data()
    print(f"  ✓ Loaded {len(data)} tables into memory.")

    # 2. Run Exception Quarantine & Detection
    print("\n[Step 2/4] Executing Constraint Validation & Exception Quarantine...")
    detector = ExceptionDetector(data)
    detection_res = detector.detect_all()
    print(f"  ✓ Total Injected/Detected Exceptions: {detection_res['total_detected']}")
    for anom_type, count in detection_res["by_type"].items():
        print(f"     • {anom_type}: {count}")

    eval_m = detection_res["evaluation_metrics"]
    print(f"  ✓ Ground Truth Detection: Precision={eval_m['precision']*100:.1f}%, Recall={eval_m['recall']*100:.1f}%, F1={eval_m['f1_score']:.4f}")

    # 3. Attendance Reconciliation
    print("\n[Step 3/4] Reconciling Biometric Attendance Clock Events with Rosters...")
    reconciler = AttendanceReconciler(data.get("shift_assignments", pd.DataFrame()), data.get("attendance_events", pd.DataFrame()))
    rec_res = reconciler.reconcile()
    print(f"  ✓ Reconciled {rec_res['total_evaluated']} scheduled shift slots.")
    print(f"     • On-Time: {rec_res['on_time_count']} | Compliance Rate: {rec_res['compliance_rate']*100:.1f}%")

    # 4. Executive Evaluation Metrics
    print("\n[Step 4/4] Computing System Performance & Labor Equity Metrics...")
    evaluator = SchedulingMetricsEvaluator(data)
    metrics = evaluator.compute_all_metrics()

    # 5. Persist Processed Intelligence Artifacts
    proc_dir = os.path.join("data", "processed")
    os.makedirs(proc_dir, exist_ok=True)
    
    if not detection_res["exceptions"].empty:
        detection_res["exceptions"].to_csv(os.path.join(proc_dir, "quarantined_exceptions.csv"), index=False)
    if not rec_res["reconciled_records"].empty:
        rec_res["reconciled_records"].to_csv(os.path.join(proc_dir, "reconciled_attendance.csv"), index=False)
    if "shift_assignments" in data:
        data["shift_assignments"].to_csv(os.path.join(proc_dir, "active_published_roster.csv"), index=False)
    if "audit_events" in data:
        data["audit_events"].to_csv(os.path.join(proc_dir, "audit_events.csv"), index=False)

    with open(os.path.join(proc_dir, "executive_metrics.json"), "w", encoding="utf-8") as f:
        import json
        json.dump(metrics, f, indent=2)

    kpi_rows = [
        ["Coverage Fulfillment Rate", f"{metrics['coverage']['fulfillment_rate']*100:.1f}%"],
        ["Workload Fairness Gini Index", f"{metrics['fairness']['gini_index']:.4f} (0 = perfectly equal)"],
        ["Mean Scheduled Hours / Employee", f"{metrics['fairness']['mean_hours']:.1f} hrs"],
        ["Overtime Violation Rate", f"{metrics['overtime']['overtime_rate']*100:.2f}%"],
        ["Exception Detection F1 Score", f"{metrics['exceptions']['f1_score']:.4f}"],
        ["Attendance Compliance", f"{metrics['attendance']['reconciliation_rate']*100:.1f}%"],
        ["System Health Score", f"{metrics['system_health_score']} / 100"]
    ]

    print("\n" + tabulate(kpi_rows, headers=["Evaluation Dimension", "Metric Value"], tablefmt="rounded_grid"))
    print(f"\n✓ Processed pipeline artifacts written to '{proc_dir}'")
    print("✓ Pipeline Execution Completed Successfully!\n")


if __name__ == "__main__":
    main()
