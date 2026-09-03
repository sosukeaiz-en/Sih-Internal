import re
from typing import List
from cbom.scanner.base import BaseScanner
from cbom.models import CryptoFinding
from cbom.risk_engine.crypto_db import evaluate_crypto_risk


class GoScanner(BaseScanner):
    """Go language scanner for stdlib crypto/rsa, crypto/ecdsa, crypto/tls packages."""

    PATTERNS = [
        (r'rsa\.GenerateKey\s*\(\s*[^,]+,\s*(\d+)\s*\)', 'RSA Key Generation'),
        (r'ecdsa\.GenerateKey\s*\(\s*elliptic\.(P256|P384|P521)\(\)', 'ECDSA Key Generation'),
        (r'import\s+["\']crypto/rsa["\']', 'RSA Import'),
        (r'import\s+["\']crypto/ecdsa["\']', 'ECDSA Import'),
        (r'import\s+["\']crypto/des["\']', 'DES Import'),
        (r'import\s+["\']crypto/md5["\']', 'MD5 Import'),
        (r'import\s+["\']crypto/sha1["\']', 'SHA1 Import'),
        (r'import\s+["\']crypto/sha256["\']', 'SHA256 Import'),
        (r'tls\.VersionTLS10', 'Deprecated Protocol (TLS 1.0)'),
        (r'tls\.VersionTLS11', 'Deprecated Protocol (TLS 1.1)'),
    ]

    def scan_file(self, file_path: str, content: str) -> List[CryptoFinding]:
        findings: List[CryptoFinding] = []
        lines = content.splitlines()

        for idx, line in enumerate(lines, start=1):
            line_str = line.strip()
            if not line_str or line_str.startswith("//"):
                continue

            for pattern, op_desc in self.PATTERNS:
                match = re.search(pattern, line_str, re.IGNORECASE)
                if match:
                    algo = "RSA"
                    key_size = None

                    if "rsa" in pattern.lower():
                        algo = "RSA"
                        if match.groups() and match.group(1).isdigit():
                            key_size = int(match.group(1))
                    elif "ecdsa" in pattern.lower():
                        algo = "ECDSA"
                    elif "des" in pattern.lower():
                        algo = "DES"
                    elif "md5" in pattern.lower():
                        algo = "MD5"
                    elif "sha1" in pattern.lower():
                        algo = "SHA1"
                    elif "sha256" in pattern.lower():
                        algo = "SHA256"
                    elif "tls" in pattern.lower():
                        algo = "RSA"  # TLS 1.0/1.1 uses legacy RSA key exchange

                    risk, impact, quantum_vuln, rec_pqc, pqc_cat, bits = evaluate_crypto_risk(algo, key_size)
                    findings.append(
                        CryptoFinding(
                            file_path=file_path,
                            line_number=idx,
                            language="Go",
                            algorithm=algo,
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
