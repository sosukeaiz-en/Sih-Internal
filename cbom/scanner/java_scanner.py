import re
from typing import List
from cbom.scanner.base import BaseScanner
from cbom.models import CryptoFinding
from cbom.risk_engine.crypto_db import evaluate_crypto_risk


class JavaScanner(BaseScanner):
    """Java Regex scanner for java.security and javax.crypto calls."""

    PATTERNS = [
        (r'Cipher\.getInstance\s*\(\s*"([^"]+)"\s*\)', 'Cipher Routine'),
        (r'KeyPairGenerator\.getInstance\s*\(\s*"([^"]+)"\s*\)', 'Key Pair Generation'),
        (r'KeyGenerator\.getInstance\s*\(\s*"([^"]+)"\s*\)', 'Symmetric Key Generation'),
        (r'MessageDigest\.getInstance\s*\(\s*"([^"]+)"\s*\)', 'Message Digest Hashing'),
        (r'Signature\.getInstance\s*\(\s*"([^"]+)"\s*\)', 'Digital Signature'),
        (r'initialize\s*\(\s*(\d+)\s*\)', 'Key Size Specifier'),
    ]

    ALGO_EXTRACTOR = [
        ("RSA", "RSA"),
        ("ECDSA", "ECDSA"),
        ("EC", "ECDSA"),
        ("DH", "DH"),
        ("DIFFIEHELLMAN", "DH"),
        ("DSA", "DSA"),
        ("AES", "AES"),
        ("DESEDE", "3DES"),
        ("DES", "DES"),
        ("MD5", "MD5"),
        ("SHA-1", "SHA1"),
        ("SHA1", "SHA1"),
        ("SHA-256", "SHA256"),
        ("SHA-512", "SHA512"),
    ]

    def scan_file(self, file_path: str, content: str) -> List[CryptoFinding]:
        findings: List[CryptoFinding] = []
        lines = content.splitlines()

        for idx, line in enumerate(lines, start=1):
            line_str = line.strip()
            if not line_str or line_str.startswith("//") or line_str.startswith("/*"):
                continue

            for pattern, op_desc in self.PATTERNS:
                match = re.search(pattern, line_str, re.IGNORECASE)
                if match:
                    raw_algo = match.group(1) if match.groups() else match.group(0)
                    key_size = None

                    # Extract key size if present in nearby code
                    if "initialize(" in line_str:
                        ks_match = re.search(r'initialize\s*\(\s*(\d+)\s*\)', line_str)
                        if ks_match:
                            key_size = int(ks_match.group(1))

                    # Standardize algorithm name
                    std_algo = "UNKNOWN"
                    for key, val in self.ALGO_EXTRACTOR:
                        if key.lower() in raw_algo.lower():
                            std_algo = val
                            break

                    if std_algo != "UNKNOWN":
                        risk, impact, quantum_vuln, rec_pqc, pqc_cat, bits = evaluate_crypto_risk(std_algo, key_size)
                        findings.append(
                            CryptoFinding(
                                file_path=file_path,
                                line_number=idx,
                                language="Java",
                                algorithm=std_algo,
                                key_size=key_size,
                                operation=op_desc,
                                code_snippet=line_str[:120],
                                quantum_vulnerable=quantum_vuln,
                                quantum_impact=impact,
                                classical_security_bits=bits,
                                risk_level=risk,
                                recommended_pqc=rec_pqc,
                                pqc_category=pqc_cat
                            )
                        )

        return findings
