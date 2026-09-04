import os
import sys

# Ensure project root directory is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from cbom.scanner.repo_walker import RepoScanner
from cbom.models import MoscaInput, MoscaResult, CBOMReport
from cbom.risk_engine.mosca_calculator import calculate_mosca_risk
from cbom.recommender.pqc_mapper import get_pqc_migration_path, NIST_PQC_STANDARDS

app = FastAPI(
    title="CBOM Sentinel API",
    description="Automated Cryptographic Bill of Materials Discovery & Post-Quantum Cryptography Risk Assessment API",
    version="1.0.0"
)


@app.get("/")
def read_root():
    return {"message": "CBOM Sentinel API online", "version": "1.0.0"}


@app.get("/api/v1/scan", response_model=CBOMReport)
def scan_repository(target_path: str = Query(..., description="Absolute or relative path to target repo directory")):
    """Scan a target codebase repository and generate structured CBOM report."""
    if not os.path.exists(target_path):
        raise HTTPException(status_code=400, detail=f"Directory path '{target_path}' does not exist.")

    scanner = RepoScanner()
    project_name = os.path.basename(os.path.abspath(target_path)) or "Codebase"
    report = scanner.scan_directory(target_path, project_name=project_name)
    return report


@app.post("/api/v1/scan-upload", response_model=CBOMReport)
async def scan_upload_archive(file: UploadFile = File(...)):
    """Upload a repository zip archive and receive structured CBOM analysis."""
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are supported.")

    contents = await file.read()
    scanner = RepoScanner()
    project_name = os.path.splitext(file.filename)[0]
    try:
        report = scanner.scan_zip_archive(contents, project_name=project_name)
        return report
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to scan uploaded zip archive: {str(e)}")



@app.post("/api/v1/mosca", response_model=MoscaResult)
def assess_mosca_risk(input_data: MoscaInput):
    """Calculate quantum threat timeline risk using Mosca's Theorem (x + y > z)."""
    return calculate_mosca_risk(input_data)


@app.get("/api/v1/pqc-standards")
def get_pqc_standards():
    """Retrieve NIST Post-Quantum Cryptography FIPS 203/204/205 standards database."""
    return NIST_PQC_STANDARDS


@app.get("/api/v1/recommendation")
def get_recommendation(algo: str):
    """Get PQC migration path for a specific classical algorithm."""
    return get_pqc_migration_path(algo)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.app:app", host="0.0.0.0", port=8000, reload=True)
