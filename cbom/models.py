from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    SAFE = "Safe"


class QuantumImpact(str, Enum):
    SHOR_BROKEN = "Shor's Algorithm (Broken)"
    GROVER_WEAKENED = "Grover's Algorithm (Weakened)"
    SAFE_OR_PQC = "Quantum Safe / PQC"


class CryptoFinding(BaseModel):
    file_path: str
    line_number: int
    language: str
    algorithm: str
    key_size: Optional[int] = None
    operation: Optional[str] = None  # e.g., Encryption, Hashing, Signature, KeyExchange
    code_snippet: str
    quantum_vulnerable: bool
    quantum_impact: QuantumImpact
    classical_security_bits: Optional[int] = None
    risk_level: RiskLevel
    recommended_pqc: str
    pqc_category: str
    notes: Optional[str] = None


class MoscaInput(BaseModel):
    shelf_life_years: float = Field(..., description="x: How long data must remain secure (years)")
    migration_time_years: float = Field(..., description="y: How long it will take to migrate system to PQC (years)")
    qday_years: float = Field(default=10.0, description="z: Estimated years until Q-Day (quantum computer capable of breaking crypto)")


class MoscaResult(BaseModel):
    is_at_risk_now: bool
    urgency_gap_years: float  # (x + y) - z
    threat_ratio: float      # (x + y) / z
    risk_level: RiskLevel
    recommendation: str


class CBOMSummary(BaseModel):
    total_artifacts: int
    vulnerable_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    safe_count: int


class CBOMReport(BaseModel):
    project_name: str
    scan_timestamp: str
    summary: CBOMSummary
    findings: List[CryptoFinding]
    mosca_assessment: Optional[MoscaResult] = None
