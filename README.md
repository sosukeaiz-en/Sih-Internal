# 🛡️ CBOM Sentinel — Cryptographic Bill of Materials & PQC Risk Engine

> **10-Hour Hackathon MVP Scope**: High-impact, narrow end-to-end scanner and visual dashboard for discovering quantum-vulnerable cryptography (RSA, ECC, DH, MD5, AES-128), assessing Mosca's Theorem threat risk, and mapping NIST Post-Quantum Cryptography (PQC) standards (ML-KEM, ML-DSA, SLH-DSA).

---

## 📁 Repository Structure & File Mapping (Hours 0–10)

```
sih/
├── requirements.txt                   # Backend API, scanner & Streamlit UI dependencies
├── README.md                          # Architecture, hackathon roadmap & execution instructions
│
├── cbom/                              # Core Python CBOM Scanner & Risk Engine
│   ├── __init__.py                    # Package initialization
│   ├── models.py                      # Pydantic schemas (CryptoFinding, MoscaInput, CBOMReport, RiskLevel)
│   │
│   ├── scanner/                       # [Hours 1–4] Discovery Layer (AST & Regex Scanners)
│   │   ├── __init__.py
│   │   ├── base.py                    # Abstract BaseScanner class
│   │   ├── python_scanner.py          # Python AST + Regex scanner (rsa, cryptography, hashlib)
│   │   ├── java_scanner.py            # Java scanner (java.security, javax.crypto, KeyPairGenerator)
│   │   ├── js_scanner.py              # Node.js / WebCrypto scanner (crypto, node-forge)
│   │   ├── go_scanner.py              # Go scanner (crypto/rsa, crypto/ecdsa, crypto/tls)
│   │   └── repo_walker.py             # Multi-language directory walker & orchestrator
│   │
│   ├── risk_engine/                   # [Hours 4–6] Risk & Mosca Theorem Classification Engine
│   │   ├── __init__.py
│   │   ├── crypto_db.py               # Classical & PQC algorithm vulnerability lookup database
│   │   └── mosca_calculator.py        # Mosca's Theorem score evaluator ((x + y) > z)
│   │
│   ├── recommender/                   # [Hours 6–8] PQC Recommendation Engine
│   │   ├── __init__.py
│   │   └── pqc_mapper.py              # NIST FIPS 203/204/205 standard PQC & Hybrid mappings
│   │
│   └── reporter/                      # CBOM Report Generator
│       ├── __init__.py
│       └── cbom_generator.py          # Export CBOM to standard JSON & CycloneDX v1.6 Crypto BOM
│
├── api/                               # Backend REST API Layer (FastAPI)
│   ├── __init__.py
│   └── app.py                         # REST endpoints (/api/v1/scan, /api/v1/mosca, /api/v1/recommendation)
│
├── dashboard/                         # [Hours 8–10] Web Dashboard & Visualization UI (Streamlit)
│   └── app.py                         # Interactive UI: Artifact table, Risk Heatmap, Mosca Sliders, PQC Cards
│
└── samples/                           # Vulnerable Sample Repositories for Demo & Testing
    ├── python_vulnerable/sample_crypto.py   # RSA-2048, MD5, SHA-1, AES-128
    ├── java_vulnerable/CryptoApp.java       # DES, RSA keypair, MD5 digest
    ├── js_vulnerable/server.js              # crypto.generateKeyPairSync, aes-128-cbc
    └── go_vulnerable/main.go                # rsa.GenerateKey, tls.VersionTLS10
```

---

## ⏰ 10-Hour Hackathon Implementation Plan

| Hour Range | Task | Files Responsible | Key Output |
| :--- | :--- | :--- | :--- |
| **Hours 0–1** | **Scope Decision** | `README.md` | Focus strictly on static source code scanning for Python, Java, JS, Go. |
| **Hours 1–4** | **Build Discovery Scanner** | `cbom/scanner/*`, `cbom/models.py` | Walk repo, parse AST/Regex, output structured JSON CBOM. |
| **Hours 4–6** | **Risk Engine & Mosca Theorem** | `cbom/risk_engine/*` | Hardcoded vulnerability DB + Mosca theorem calculator (`(x+y) > z`). |
| **Hours 6–8** | **PQC Recommendation Engine** | `cbom/recommender/*` | Map legacy crypto to NIST FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA). |
| **Hours 8–10** | **Dashboard / GUI** | `dashboard/app.py`, `api/app.py` | Interactive Streamlit dashboard with heatmap, Mosca sliders, & CycloneDX exporter. |

---

## 🚀 Quickstart & How to Run

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch Streamlit Dashboard
```bash
streamlit run dashboard/app.py
```

### 3. Launch REST API Server (Optional)
```bash
uvicorn api.app:app --reload --port 8000
```
Visit API docs at `http://localhost:8000/docs`.

---

## ⚡ Key Differentiators for Hackathon Demo

1. **CycloneDX v1.6 Compliance**: Exports true Industry Standard Cryptography BOM JSON.
2. **Mosca's Theorem Interactive Calculator**: Live interactive sliders for data shelf-life $x$, migration timeline $y$, and Q-Day $z$.
3. **Multi-Language Detection**: Ready-to-demo scanners for Python, Java, JavaScript/TypeScript, and Go out-of-the-box.
4. **Actionable PQC Roadmap**: Gives developers immediate FIPS 203/204 hybrid replacement code advice.
