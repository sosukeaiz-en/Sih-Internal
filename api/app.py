import os
import sys
import tempfile
import zipfile
import shutil

# Ensure project root directory is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from cbom.scanner.repo_walker import RepoScanner
from cbom.models import MoscaInput, MoscaResult, CBOMReport
from cbom.risk_engine.mosca_calculator import calculate_mosca_risk
from cbom.recommender.pqc_mapper import get_pqc_migration_path, NIST_PQC_STANDARDS

app = FastAPI(
    title="CBOM Sentinel API",
    description="Automated Cryptographic Bill of Materials Discovery & Post-Quantum Cryptography Risk Assessment API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "CBOM Sentinel API online", "version": "1.0.0"}


@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "CBOM Sentinel API online"}


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
def scan_upload_repository(file: UploadFile = File(...)):
    """Upload a zipped codebase repository and generate structured CBOM report."""
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp()
    try:
        # Save the uploaded file
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Extract the zip file
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        scanner = RepoScanner()
        project_name = os.path.splitext(file.filename)[0] or "UploadedCodebase"
        report = scanner.scan_directory(extract_dir, project_name=project_name)
        return report
    finally:
        # Clean up temporary directory
        shutil.rmtree(temp_dir, ignore_errors=True)



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
