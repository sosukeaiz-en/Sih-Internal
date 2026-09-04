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
