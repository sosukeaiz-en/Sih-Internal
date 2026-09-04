import type {
  CBOMReport,
  MOSCARequest,
  MOSCAResponse,
  PQCStandard,
  MigrationRecommendation,
} from "../types";
import { normalizeCBOMReport } from "../utils/normalization";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.PROD ? "" : "http://localhost:8000");

// ─── shared fetch helper ─────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { timeout?: number }
): Promise<T> {
  const { timeout = 60_000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. The backend may be busy or unreachable.");
    }
    throw new Error(
      `Network error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = String(body.detail);
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(`[${res.status}] ${detail}`);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("Backend returned an invalid response (not JSON).");
  }
}

// ─── scan ─────────────────────────────────────────────────────────────────────

export async function scanRepo(
  targetPath: string,
  signal?: AbortSignal
): Promise<CBOMReport> {
  const raw = await apiFetch<unknown>(
    `/api/v1/scan?target_path=${encodeURIComponent(targetPath)}`,
    { signal }
  );
  return normalizeCBOMReport(raw);
}

export async function scanUpload(
  file: File,
  signal?: AbortSignal
): Promise<CBOMReport> {
  const form = new FormData();
  form.append("file", file);
  const raw = await apiFetch<unknown>("/api/v1/scan-upload", {
    method: "POST",
    body: form,
    signal,
  });
  return normalizeCBOMReport(raw);
}

// ─── MOSCA ────────────────────────────────────────────────────────────────────

export async function calculateMosca(
  payload: MOSCARequest,
  signal?: AbortSignal
): Promise<MOSCAResponse> {
  return apiFetch<MOSCAResponse>("/api/v1/mosca", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
}

// ─── PQC standards ────────────────────────────────────────────────────────────

let _standardsCache: PQCStandard[] | null = null;

export async function getPqcStandards(): Promise<PQCStandard[]> {
  if (_standardsCache) return _standardsCache;
  const raw = await apiFetch<Record<string, unknown>>("/api/v1/pqc-standards");
  // Backend returns a dict keyed by standard ID — normalize to array
  const arr = Object.entries(raw).map(([id, val]) => {
    const v = val as Record<string, unknown>;
    const std: PQCStandard = {
      id,
      name: String(v.name ?? id),
      fips: String(v.fips ?? ""),
      former_name: v.former_name ? String(v.former_name) : undefined,
      purpose: String(v.purpose ?? ""),
      status: String(v.status ?? ""),
      variants: Array.isArray(v.variants)
        ? (v.variants as string[])
        : [],
      recommended_variant: v.recommended_variant
        ? String(v.recommended_variant)
        : undefined,
      hybrid_mode: v.hybrid_mode ? String(v.hybrid_mode) : undefined,
      replaces: Array.isArray(v.replaces) ? (v.replaces as string[]) : [],
      description: String(v.description ?? ""),
    };
    return std;
  });
  _standardsCache = arr;
  return arr;
}

// ─── recommendation ───────────────────────────────────────────────────────────

export async function getRecommendation(
  algorithm: string
): Promise<MigrationRecommendation> {
  return apiFetch<MigrationRecommendation>(
    `/api/v1/recommendation?algo=${encodeURIComponent(algorithm)}`
  );
}

// ─── health check ─────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await apiFetch<unknown>("/", { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}
