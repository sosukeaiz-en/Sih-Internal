import hashlib
import rsa
from cryptography.hazmat.primitives.asymmetric import rsa as crypto_rsa
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


def generate_legacy_rsa_key():
    # Vulnerable RSA-2048 key generation (Shor's Algorithm vulnerable)
    (pubkey, privkey) = rsa.newkeys(2048)
    return privkey


def legacy_hashing_example(data: bytes):
    # Broken MD5 and SHA-1 hashing
    md5_hash = hashlib.md5(data).hexdigest()
    sha1_hash = hashlib.sha1(data).hexdigest()
    return md5_hash, sha1_hash


def symmetric_aes_encryption(key: bytes, iv: bytes, data: bytes):
    # AES-128 (Weakened under Grover's algorithm)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    encryptor = cipher.encryptor()
    return encryptor.update(data) + encryptor.finalize()
