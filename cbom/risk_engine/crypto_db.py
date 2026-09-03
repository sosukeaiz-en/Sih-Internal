from typing import Dict, Any, Tuple
from cbom.models import RiskLevel, QuantumImpact


ALGORITHM_DATABASE: Dict[str, Dict[str, Any]] = {
    # Asymmetric Encryption & Key Exchange (Broken by Shor's Algorithm)
    "RSA": {
        "operation": "Asymmetric Encryption / Signature",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "key_size_rules": {
            1024: {"classical_bits": 80, "risk": RiskLevel.CRITICAL},
            2048: {"classical_bits": 112, "risk": RiskLevel.HIGH},
            3072: {"classical_bits": 128, "risk": RiskLevel.HIGH},
            4096: {"classical_bits": 128, "risk": RiskLevel.HIGH},
        },
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "ML-KEM (Kyber-768) for Encap / ML-DSA (Dilithium3) for Signatures",
        "pqc_category": "Post-Quantum Lattice-Based Cryptography",
    },
    "ECDSA": {
        "operation": "Digital Signature",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "key_size_rules": {
            256: {"classical_bits": 128, "risk": RiskLevel.HIGH},
            384: {"classical_bits": 192, "risk": RiskLevel.HIGH},
            521: {"classical_bits": 256, "risk": RiskLevel.HIGH},
        },
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "ML-DSA (Dilithium) or Falcon-512",
        "pqc_category": "Lattice-Based Digital Signatures (NIST FIPS 204)",
    },
    "ECDH": {
        "operation": "Key Exchange",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "ML-KEM-768 (Kyber) or Hybrid ECDH+ML-KEM",
        "pqc_category": "Lattice-Based Key Encapsulation (NIST FIPS 203)",
    },
    "DH": {
        "operation": "Diffie-Hellman Key Exchange",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "ML-KEM (Kyber)",
        "pqc_category": "Lattice-Based Key Encapsulation",
    },
    "DSA": {
        "operation": "Digital Signature",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "default_risk": RiskLevel.CRITICAL,
        "recommended_pqc": "ML-DSA (Dilithium)",
        "pqc_category": "Lattice-Based Signatures",
    },
    "Ed25519": {
        "operation": "Digital Signature",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.SHOR_BROKEN,
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "ML-DSA (Dilithium2) or SLH-DSA (SPHINCS+)",
        "pqc_category": "Lattice / Stateless Hash-Based Signatures",
    },

    # Symmetric Ciphers (Weakened by Grover's Algorithm)
    "AES": {
        "operation": "Symmetric Encryption",
        "quantum_vulnerable": False,  # Not broken, but AES-128 is weakened to 64 bits security under Grover's
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "key_size_rules": {
            128: {"classical_bits": 128, "risk": RiskLevel.MEDIUM, "notes": "Effective security reduced to ~64 bits against Grover's algorithm. Upgrade to AES-256."},
            192: {"classical_bits": 192, "risk": RiskLevel.LOW, "notes": "Effective security ~96 bits against Grover's algorithm."},
            256: {"classical_bits": 256, "risk": RiskLevel.SAFE, "notes": "Quantum-safe (128-bit quantum security level under Grover's)."},
        },
        "default_risk": RiskLevel.MEDIUM,
        "recommended_pqc": "Upgrade to AES-256-GCM / ChaCha20-Poly1305",
        "pqc_category": "Symmetric Quantum Security",
    },
    "DES": {
        "operation": "Symmetric Encryption (Deprecated)",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "default_risk": RiskLevel.CRITICAL,
        "recommended_pqc": "AES-256-GCM",
        "pqc_category": "Symmetric Encryption",
    },
    "3DES": {
        "operation": "Triple-DES Symmetric Encryption",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "default_risk": RiskLevel.CRITICAL,
        "recommended_pqc": "AES-256-GCM",
        "pqc_category": "Symmetric Encryption",
    },

    # Hash Functions
    "MD5": {
        "operation": "Cryptographic Hash",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "default_risk": RiskLevel.CRITICAL,
        "recommended_pqc": "SHA-3 (SHA3-256 / SHA3-512) or SHA-256",
        "pqc_category": "Collision-Resistant Hash Functions",
    },
    "SHA1": {
        "operation": "Cryptographic Hash",
        "quantum_vulnerable": True,
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "default_risk": RiskLevel.HIGH,
        "recommended_pqc": "SHA-384 or SHA-512 or SHA3-256",
        "pqc_category": "Collision-Resistant Hash Functions",
    },
    "SHA256": {
        "operation": "Cryptographic Hash",
        "quantum_vulnerable": False,
        "quantum_impact": QuantumImpact.GROVER_WEAKENED,
        "default_risk": RiskLevel.SAFE,
        "recommended_pqc": "SHA-384 or SHA-512 / SHA3-256 for 128-bit quantum collision resistance",
        "pqc_category": "Quantum-Resistant Hashing",
    },
    "SHA512": {
        "operation": "Cryptographic Hash",
        "quantum_vulnerable": False,
        "quantum_impact": QuantumImpact.SAFE_OR_PQC,
        "default_risk": RiskLevel.SAFE,
        "recommended_pqc": "SHA-512 / SHA3-512 (Already Quantum Resistant)",
        "pqc_category": "Quantum-Resistant Hashing",
    },
}


def evaluate_crypto_risk(algo_name: str, key_size: Optional[int] = None) -> Tuple[RiskLevel, QuantumImpact, bool, str, str, Optional[int]]:
    """Look up algorithm parameters and return risk classification."""
    clean_algo = algo_name.upper().strip()
    
    # Matching logic
    matched_key = None
    for k in ALGORITHM_DATABASE:
        if k in clean_algo or clean_algo in k:
            matched_key = k
            break
            
    if not matched_key:
        # Default fallback for unknown crypto
        return (
            RiskLevel.MEDIUM,
            QuantumImpact.GROVER_WEAKENED,
            False,
            "Verify algorithm & consider ML-KEM / ML-DSA",
            "Unknown Cryptography",
            None
        )
        
    entry = ALGORITHM_DATABASE[matched_key]
    quantum_vuln = entry["quantum_vulnerable"]
    quantum_impact = entry["quantum_impact"]
    rec_pqc = entry["recommended_pqc"]
    pqc_cat = entry["pqc_category"]
    
    risk = entry["default_risk"]
    classical_bits = None
    
    if key_size and "key_size_rules" in entry and key_size in entry["key_size_rules"]:
        rule = entry["key_size_rules"][key_size]
        risk = rule.get("risk", risk)
        classical_bits = rule.get("classical_bits")
        
    return (risk, quantum_impact, quantum_vuln, rec_pqc, pqc_cat, classical_bits)
