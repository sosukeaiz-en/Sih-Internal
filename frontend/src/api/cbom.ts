const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.PROD ? "" : "http://localhost:8000");

export interface CryptoFinding {
  file_path: string;
  line_number: number;
  language: string;
  algorithm: string;
  key_size: number | null;
  operation: string | null;
  code_snippet: string;
  quantum_vulnerable: boolean;
  quantum_impact: string;
  classical_security_bits: number | null;
  risk_level: "Critical" | "High" | "Medium" | "Low" | "Safe";
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
  findings: CryptoFinding[];
}

export async function scanRepo(targetPath: string): Promise<CBOMReport> {
  const res = await fetch(`${API_BASE}/api/v1/scan?target_path=${encodeURIComponent(targetPath)}`);
  if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
  return res.json();
}

export async function scanUpload(file: File): Promise<CBOMReport> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/scan-upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}
