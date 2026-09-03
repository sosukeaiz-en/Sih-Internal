import re
from typing import List
from cbom.scanner.base import BaseScanner
from cbom.models import CryptoFinding
from cbom.risk_engine.crypto_db import evaluate_crypto_risk


class JavaScriptScanner(BaseScanner):
    """JS/TS scanner for Node.js crypto, WebCrypto API, and node-forge."""

    PATTERNS = [
        (r'crypto\.createHash\s*\(\s*["\']([^"\']+)["\']\s*\)', 'Hash Generation'),
        (r'crypto\.createCipher\s*\(\s*["\']([^"\']+)["\']\s*,', 'Cipher Creation'),
        (r'crypto\.createCipheriv\s*\(\s*["\']([^"\']+)["\']\s*,', 'Cipher Creation IV'),
        (r'crypto\.generateKeyPairSync\s*\(\s*["\']([^"\']+)["\']\s*,', 'Key Pair Generation'),
        (r'forge\.pki\.rsa\.generateKeyPair\s*\(\s*\{?\s*bits:\s*(\d+)', 'RSA Key Pair'),
        (r'subtle\.generateKey\s*\(\s*\{?\s*name:\s*["\']([^"\']+)["\']\s*,', 'WebCrypto KeyGen'),
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
                    raw_val = match.group(1) if match.groups() else ""
                    key_size = None

                    if raw_val.isdigit():
                        key_size = int(raw_val)
                        algo = "RSA"
                    else:
                        # Normalize algo string
                        val_upper = raw_val.upper()
                        if "RSA" in val_upper:
                            algo = "RSA"
                        elif "AES" in val_upper:
                            algo = "AES"
                            if "128" in val_upper:
                                key_size = 128
                            elif "192" in val_upper:
                                key_size = 192
                            elif "256" in val_upper:
                                key_size = 256
                        elif "ECDSA" in val_upper or "EC" in val_upper:
                            algo = "ECDSA"
                        elif "MD5" in val_upper:
                            algo = "MD5"
                        elif "SHA1" in val_upper or "SHA-1" in val_upper:
                            algo = "SHA1"
                        elif "SHA256" in val_upper or "SHA-256" in val_upper:
                            algo = "SHA256"
                        else:
                            algo = raw_val.upper()

                    risk, impact, quantum_vuln, rec_pqc, pqc_cat, bits = evaluate_crypto_risk(algo, key_size)
                    findings.append(
                        CryptoFinding(
                            file_path=file_path,
                            line_number=idx,
                            language="JavaScript/TypeScript",
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
