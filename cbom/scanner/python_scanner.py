import re
import ast
from typing import List, Optional
from cbom.scanner.base import BaseScanner
from cbom.models import CryptoFinding
from cbom.risk_engine.crypto_db import evaluate_crypto_risk


class PythonScanner(BaseScanner):
    """Python AST and Regex scanner for cryptographic library calls."""

    PATTERNS = [
        # Regex patterns for Python crypto libraries (cryptography, PyCryptodome, hashlib, rsa)
        (r'rsa\.generate_private_key\([^)]*key_size\s*=\s*(\d+)', 'RSA', 'Key Generation'),
        (r'RSA\.generate\((\d+)', 'RSA', 'Key Generation'),
        (r'import\s+rsa', 'RSA', 'Import'),
        (r'hashlib\.md5\(', 'MD5', 'Hashing'),
        (r'hashlib\.sha1\(', 'SHA1', 'Hashing'),
        (r'hashlib\.sha256\(', 'SHA256', 'Hashing'),
        (r'hashlib\.sha512\(', 'SHA512', 'Hashing'),
        (r'algorithms\.AES\(', 'AES', 'Symmetric Cipher'),
        (r'algorithms\.AES128\(', 'AES', 'Symmetric Cipher'),
        (r'algorithms\.AES256\(', 'AES', 'Symmetric Cipher'),
        (r'algorithms\.3DES\(', '3DES', 'Symmetric Cipher'),
        (r'ec\.generate_private_key\([^)]*curve\s*=\s*ec\.([A-Za-z0-9_]+)', 'ECDSA', 'EC Key Generation'),
        (r'ec\.SECP256R1\(', 'ECDSA', 'Elliptic Curve P-256'),
        (r'ec\.SECP384R1\(', 'ECDSA', 'Elliptic Curve P-384'),
        (r'ec\.SECP521R1\(', 'ECDSA', 'Elliptic Curve P-521'),
        (r'DHParameterNumbers\(', 'DH', 'Diffie-Hellman'),
        (r'ed25519\.Ed25519PrivateKey\.generate\(', 'Ed25519', 'Edwards Curve Signature'),
    ]

    def scan_file(self, file_path: str, content: str) -> List[CryptoFinding]:
        findings: List[CryptoFinding] = []
        lines = content.splitlines()

        # 1. Regex scanning across lines
        for idx, line in enumerate(lines, start=1):
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue

            for pattern, algo, op in self.PATTERNS:
                match = re.search(pattern, line_str, re.IGNORECASE)
                if match:
                    key_size = None
                    if match.groups() and match.group(1).isdigit():
                        key_size = int(match.group(1))

                    risk, impact, quantum_vuln, rec_pqc, pqc_cat, bits = evaluate_crypto_risk(algo, key_size)

                    findings.append(
                        CryptoFinding(
                            file_path=file_path,
                            line_number=idx,
                            language="Python",
                            algorithm=algo,
                            key_size=key_size,
                            operation=op,
                            code_snippet=line_str[:120],
                            quantum_vulnerable=quantum_vuln,
                            quantum_impact=impact,
                            classical_security_bits=bits,
                            risk_level=risk,
                            recommended_pqc=rec_pqc,
                            pqc_category=pqc_cat
                        )
                    )

        # 2. AST parsing for python imports and function calls
        try:
            tree = ast.parse(content)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name in ["rsa", "Crypto.Cipher.DES", "Crypto.Cipher.PKCS1_v1_5"]:
                            algo = "RSA" if "rsa" in alias.name else "DES"
                            risk, impact, quantum_vuln, rec_pqc, pqc_cat, bits = evaluate_crypto_risk(algo)
                            findings.append(
                                CryptoFinding(
                                    file_path=file_path,
                                    line_number=node.lineno,
                                    language="Python",
                                    algorithm=algo,
                                    operation="Library Import",
                                    code_snippet=f"import {alias.name}",
                                    quantum_vulnerable=quantum_vuln,
                                    quantum_impact=impact,
                                    classical_security_bits=bits,
                                    risk_level=risk,
                                    recommended_pqc=rec_pqc,
                                    pqc_category=pqc_cat
                                )
                            )
        except Exception:
            pass  # Fall back gracefully if AST parse fails on invalid syntax

        return findings
