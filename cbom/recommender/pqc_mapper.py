from typing import Dict, Any


NIST_PQC_STANDARDS = {
    "ML-KEM": {
        "standard": "NIST FIPS 203",
        "former_name": "CRYSTALS-Kyber",
        "purpose": "General Encryption & Key Encapsulation (KEM)",
        "variants": ["ML-KEM-512 (Category 1)", "ML-KEM-768 (Category 3 - Recommended)", "ML-KEM-1024 (Category 5)"],
        "hybrid_recommendation": "X25519 + ML-KEM-768 (Hybrid TLS 1.3 / OpenSSH)"
    },
    "ML-DSA": {
        "standard": "NIST FIPS 204",
        "former_name": "CRYSTALS-Dilithium",
        "purpose": "General Digital Signatures",
        "variants": ["ML-DSA-44 (Category 2)", "ML-DSA-65 (Category 3 - Recommended)", "ML-DSA-87 (Category 5)"],
        "hybrid_recommendation": "ECDSA-P256 + ML-DSA-65 (Dual-Signed Certificate / Auth)"
    },
    "SLH-DSA": {
        "standard": "NIST FIPS 205",
        "former_name": "SPHINCS+",
        "purpose": "Stateless Hash-Based Digital Signatures (Conservative Backup)",
        "variants": ["SLH-DSA-SHA2-128f", "SLH-DSA-SHAKE-256s"],
        "hybrid_recommendation": "Use for high-assurance firmware signing where lattice assumptions are risky"
    },
    "Falcon": {
        "standard": "NIST Selection (Standardization pending)",
        "former_name": "Falcon",
        "purpose": "Compact Digital Signatures",
        "variants": ["Falcon-512", "Falcon-1024"],
        "hybrid_recommendation": "Ideal for constrained bandwidth applications needing short signatures"
    }
}


def get_pqc_migration_path(legacy_algo: str) -> Dict[str, Any]:
    """Returns detailed migration advice for a given legacy algorithm."""
    algo = legacy_algo.upper()
    if "RSA" in algo or "DH" in algo or "ECDH" in algo:
        return {
            "legacy": legacy_algo,
            "target_standard": "ML-KEM (NIST FIPS 203)",
            "primary_replacement": "ML-KEM-768",
            "hybrid_mode": "Hybrid X25519 + ML-KEM-768",
            "migration_complexity": "Medium",
            "action_plan": "Replace static public key encryption and key agreement calls with KEM encapsulation/decapsulation routines."
        }
    elif "ECDSA" in algo or "DSA" in algo or "ED25519" in algo:
        return {
            "legacy": legacy_algo,
            "target_standard": "ML-DSA (NIST FIPS 204)",
            "primary_replacement": "ML-DSA-65",
            "hybrid_mode": "Hybrid ECDSA + ML-DSA-65",
            "migration_complexity": "Medium-High",
            "action_plan": "Update PKI certificate infrastructure and signature validation pipelines to accept dual-signature chains."
        }
    elif "MD5" in algo or "SHA1" in algo or "DES" in algo:
        return {
            "legacy": legacy_algo,
            "target_standard": "Symmetric Modernization",
            "primary_replacement": "AES-256-GCM / SHA3-256",
            "hybrid_mode": "N/A (Symmetric)",
            "migration_complexity": "Low",
            "action_plan": "Replace broken classical hashes and legacy block ciphers with authenticated 256-bit symmetric primitives."
        }
    else:
        return {
            "legacy": legacy_algo,
            "target_standard": "NIST PQC Standards",
            "primary_replacement": "ML-KEM / ML-DSA",
            "hybrid_mode": "Hybrid Dual-Algorithm Scheme",
            "migration_complexity": "Medium",
            "action_plan": "Review crypto usage and migrate to NIST FIPS 203/204 compliant algorithms."
        }
