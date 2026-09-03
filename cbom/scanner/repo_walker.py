import os
from typing import List
from cbom.models import CryptoFinding, CBOMSummary, CBOMReport, RiskLevel
from cbom.scanner.python_scanner import PythonScanner
from cbom.scanner.java_scanner import JavaScanner
from cbom.scanner.js_scanner import JavaScriptScanner
from cbom.scanner.go_scanner import GoScanner


class RepoScanner:
    """Directory walker & multi-language CBOM scanner orchestrator."""

    def __init__(self):
        self.scanners = {
            ".py": PythonScanner(),
            ".java": JavaScanner(),
            ".js": JavaScriptScanner(),
            ".jsx": JavaScriptScanner(),
            ".ts": JavaScriptScanner(),
            ".tsx": JavaScriptScanner(),
            ".go": GoScanner(),
        }

    def scan_directory(self, target_dir: str, project_name: str = "Project") -> CBOMReport:
        from datetime import datetime
        findings: List[CryptoFinding] = []

        ignore_dirs = {".git", "node_modules", "__pycache__", "venv", ".venv", "target", "build", "dist"}

        for root, dirs, files in os.walk(target_dir):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in self.scanners:
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, target_dir)
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        file_findings = self.scanners[ext].scan_file(rel_path, content)
                        findings.extend(file_findings)
                    except Exception as e:
                        print(f"Error scanning {file_path}: {e}")

        # Compute summary metrics
        summary = CBOMSummary(
            total_artifacts=len(findings),
            vulnerable_count=sum(1 for f in findings if f.quantum_vulnerable),
            critical_count=sum(1 for f in findings if f.risk_level == RiskLevel.CRITICAL),
            high_count=sum(1 for f in findings if f.risk_level == RiskLevel.HIGH),
            medium_count=sum(1 for f in findings if f.risk_level == RiskLevel.MEDIUM),
            low_count=sum(1 for f in findings if f.risk_level == RiskLevel.LOW),
            safe_count=sum(1 for f in findings if f.risk_level == RiskLevel.SAFE),
        )

        return CBOMReport(
            project_name=project_name,
            scan_timestamp=datetime.utcnow().isoformat() + "Z",
            summary=summary,
            findings=findings
        )
