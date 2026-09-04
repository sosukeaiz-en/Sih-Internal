import json
from cbom.models import CBOMReport


def export_to_json(report: CBOMReport, file_path: str):
    """Exports CBOM report to a formatted JSON artifact."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(report.model_dump(), f, indent=2)


def export_to_cyclonedx_cbom(report: CBOMReport) -> dict:
    """Exports CBOM findings into CycloneDX v1.6 Cryptography BOM format."""
    components = []
    for idx, finding in enumerate(report.findings, start=1):
        components.append({
            "type": "cryptographic",
            "bom-ref": f"crypto-asset-{idx}",
            "name": f"{finding.algorithm} ({finding.language})",
            "cryptoProperties": {
                "assetType": "algorithm",
                "algorithmProperties": {
                    "primitive": finding.operation or "Unknown",
                    "classicalSecurityLevel": finding.classical_security_bits or 0,
                    "cryptoFunctions": [finding.operation] if finding.operation else []
                },
                "oid": "",
            },
            "evidence": {
                "occurrences": [{
                    "location": finding.file_path,
                    "line": finding.line_number,
                    "snippet": finding.code_snippet
                }]
            },
            "properties": [
                {"name": "cbom:quantum_vulnerable", "value": str(finding.quantum_vulnerable)},
                {"name": "cbom:risk_level", "value": finding.risk_level.value},
                {"name": "cbom:recommended_pqc", "value": finding.recommended_pqc}
            ]
        })

    return {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "serialNumber": f"urn:uuid:cbom-{report.project_name.lower().replace(' ', '-')}",
        "version": 1,
        "metadata": {
            "timestamp": report.scan_timestamp,
            "tools": [{"vendor": "CBOM-Sentinel", "name": "Hackathon-PQC-Scanner", "version": "1.0.0"}]
        },
        "components": components
    }


def export_to_html_report(report: CBOMReport) -> str:
    """Generates an executive HTML security brief for the CBOM report."""
    rows = ""
    for f in report.findings:
        badge_color = "#ef553b" if f.risk_level.value in ["Critical", "High"] else "#ffa15a" if f.risk_level.value == "Medium" else "#00cc96"
        vuln_badge = '<span style="color:#ef553b;font-weight:bold;">⚠️ Vulnerable</span>' if f.quantum_vulnerable else '<span style="color:#00cc96;font-weight:bold;">✅ Safe</span>'
        rows += f"""
        <tr>
            <td><code>{f.file_path}:{f.line_number}</code></td>
            <td><b>{f.language}</b></td>
            <td>{f.algorithm}</td>
            <td><span style="background:{badge_color};color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;">{f.risk_level.value}</span></td>
            <td>{vuln_badge}</td>
            <td><b>{f.recommended_pqc}</b></td>
        </tr>
        """

    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CBOM Executive Brief — {report.project_name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 30px; background: #0f172a; color: #f8fafc; }}
        .header {{ border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 20px; }}
        h1 {{ margin: 0; color: #38bdf8; }}
        .metrics {{ display: flex; gap: 15px; margin-bottom: 25px; }}
        .card {{ background: #1e293b; padding: 15px 20px; border-radius: 8px; flex: 1; border: 1px solid #334155; }}
        .card .value {{ font-size: 28px; font-weight: bold; margin-top: 5px; color: #f8fafc; }}
        .card.crit .value {{ color: #f87171; }}
        table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; }}
        th, td {{ padding: 12px 15px; text-align: left; border-bottom: 1px solid #334155; }}
        th {{ background: #334155; color: #94a3b8; font-size: 13px; text-transform: uppercase; }}
        code {{ font-family: monospace; color: #38bdf8; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ CBOM Sentinel — Executive Security Brief</h1>
        <p>Project: <b>{report.project_name}</b> | Timestamp: {report.scan_timestamp}</p>
    </div>
    <div class="metrics">
        <div class="card"><div class="label">Total Cryptographic Assets</div><div class="value">{report.summary.total_artifacts}</div></div>
        <div class="card crit"><div class="label">Quantum Vulnerable</div><div class="value">{report.summary.vulnerable_count}</div></div>
        <div class="card crit"><div class="label">Critical / High Risk</div><div class="value">{report.summary.critical_count + report.summary.high_count}</div></div>
        <div class="card"><div class="label">Safe / PQC Ready</div><div class="value">{report.summary.safe_count}</div></div>
    </div>
    <h2>Discovered Cryptographic Assets & PQC Roadmap</h2>
    <table>
        <thead>
            <tr>
                <th>Location</th>
                <th>Language</th>
                <th>Algorithm</th>
                <th>Risk Level</th>
                <th>Quantum Status</th>
                <th>Recommended PQC Target</th>
            </tr>
        </thead>
        <tbody>
            {rows if rows else '<tr><td colspan="6">No cryptographic assets detected.</td></tr>'}
        </tbody>
    </table>
</body>
</html>"""
    return html

