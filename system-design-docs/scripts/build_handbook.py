"""Compatibility entry point for the shared Markdown-based documentation build."""

from pathlib import Path
import subprocess


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    subprocess.run(["node", "scripts/build-topics.mjs"], cwd=root, check=True)
