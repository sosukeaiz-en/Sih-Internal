from abc import ABC, abstractmethod
from typing import List
from cbom.models import CryptoFinding


class BaseScanner(ABC):
    """Abstract Base Class for language-specific crypto AST/Regex scanners."""

    @abstractmethod
    def scan_file(self, file_path: str, content: str) -> List[CryptoFinding]:
        """Scan a single file content and return list of CryptoFinding objects."""
        pass
