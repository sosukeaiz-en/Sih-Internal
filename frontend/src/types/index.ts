// ─── Core domain types ────────────────────────────────────────────────────────

export type RiskLevel = "Critical" | "High" | "Medium" | "Low" | "Safe";

export type QuantumImpact =
  | "Shor's Algorithm (Broken)"
  | "Grover's Algorithm (Weakened)"
  | "Quantum Safe / PQC"
  | string; // backend may return other strings

export type ScanStatus = "idle" | "scanning" | "success" | "empty" | "error";

export type ScanMode = "repository" | "upload";

export type BackendStatus = "unknown" | "online" | "offline";

// ─── CBOM types ───────────────────────────────────────────────────────────────

export interface Finding {
  file_path: string;
  line_number: number;
  language: string;
  algorithm: string;
  key_size: number | null;
  operation: string | null;
  code_snippet: string;
  quantum_vulnerable: boolean;
  quantum_impact: QuantumImpact;
  classical_security_bits: number | null;
  risk_level: RiskLevel;
  recommended_pqc: string;
  pqc_category: string;
  notes: string | null;
}

export interface CBOMSummary {
  total_artifacts: number;
  vulnerable_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  safe_count: number;
}

export interface CBOMReport {
  project_name: string;
  scan_timestamp: string;
  summary: CBOMSummary;
  findings: Finding[];
}

// ─── MOSCA types ──────────────────────────────────────────────────────────────

export interface MOSCARequest {
  shelf_life_years: number;
  migration_time_years: number;
  qday_years: number;
}

export interface MOSCAResponse {
  is_at_risk_now: boolean;
  urgency_gap_years: number;
  threat_ratio: number;
  risk_level: RiskLevel;
  recommendation: string;
}

// ─── PQC types ────────────────────────────────────────────────────────────────

export interface PQCStandard {
  id: string;
  name: string;
  fips: string;
  former_name?: string;
  purpose: string;
  status: string;
  variants: string[];
  recommended_variant?: string;
  hybrid_mode?: string;
  replaces: string[];
  description: string;
}

export interface MigrationRecommendation {
  algorithm: string;
  risk_level: RiskLevel;
  quantum_impact: QuantumImpact;
  recommended_pqc: string;
  pqc_category: string;
  hybrid_option?: string;
  notes?: string;
}

// ─── Algorithm stats (derived) ────────────────────────────────────────────────

export interface AlgorithmStatistics {
  name: string;
  count: number;
  quantumVulnerable: boolean;
  topRisk: RiskLevel;
  recommendation: string;
}

// ─── Global app state ─────────────────────────────────────────────────────────

export interface AppState {
  scanStatus: ScanStatus;
  report: CBOMReport | null;
  selectedFinding: Finding | null;
  selectedAlgorithm: string | null;
  backendStatus: BackendStatus;
  demoMode: boolean;
  error: string | null;
}

export type AppAction =
  | { type: "SCAN_START" }
  | { type: "SCAN_SUCCESS"; report: CBOMReport }
  | { type: "SCAN_EMPTY" }
  | { type: "SCAN_ERROR"; error: string }
  | { type: "SCAN_RESET" }
  | { type: "SET_SELECTED_FINDING"; finding: Finding | null }
  | { type: "SET_SELECTED_ALGORITHM"; algorithm: string | null }
  | { type: "SET_BACKEND_STATUS"; status: BackendStatus }
  | { type: "ENABLE_DEMO_MODE" }
  | { type: "DISABLE_DEMO_MODE" };
