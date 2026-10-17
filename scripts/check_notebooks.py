"""Check clean notebook sources; optionally execute each in a fresh Python kernel.

Default/--clear need only standard-library Python. --execute needs .[notebooks].
Execution stays in memory, never overwrites the committed notebook, and uses the
invoking interpreter in a temporary kernel spec instead of a user's global kernel.
"""

import argparse
import json
import os
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def check(path: Path, *, clear=False):
    data = json.loads(path.read_text())
    if data.get("nbformat") != 4 or not isinstance(data.get("cells"), list):
        raise ValueError(f"{path.name}: expected a version-4 notebook")
    dirty = []
    for index, cell in enumerate(data["cells"]):
        if cell.get("cell_type") == "code":
            if cell.get("outputs") or cell.get("execution_count") is not None or "execution" in cell.get("metadata", {}):
                dirty.append(index + 1)
            if clear:
                cell["outputs"] = []
                cell["execution_count"] = None
                cell.get("metadata", {}).pop("execution", None)
    if "widgets" in data.get("metadata", {}):
        dirty.append("widget metadata")
    if clear:
        data.get("metadata", {}).pop("widgets", None)
        path.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")
    elif dirty:
        raise ValueError(f"{path.name}: clear outputs/execution state before committing (cells: {dirty})")
    return data


def execute(path: Path):
    try:
        import nbformat
        from nbclient import NotebookClient
        from jupyter_client import AsyncKernelManager
        from jupyter_client.kernelspec import KernelSpecManager
    except ImportError as exc:
        raise ValueError("Install notebook tooling first: python -m pip install -e '.[notebooks]'") from exc
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    with tempfile.TemporaryDirectory(prefix="quasar-notebook-") as directory:
        spec = Path(directory) / "quasar-check"
        spec.mkdir()
        (spec / "kernel.json").write_text(json.dumps({
            "argv": [sys.executable, "-m", "ipykernel_launcher", "-f", "{connection_file}"],
            "display_name": "Quasar fresh-session check", "language": "python"}))
        specs = KernelSpecManager(kernel_dirs=[directory], ensure_native_kernel=False)
        manager = AsyncKernelManager(kernel_name="quasar-check", kernel_spec_manager=specs,
                                     connection_file=str(Path(directory) / "connection.json"))
        # Fresh independent kernel per notebook. No saved local forecast influences CI.
        env = {**os.environ, "QUASAR_WEATHERNEXT_FILE": "", "IPYTHONDIR": str(Path(directory) / "ipython")}
        client = NotebookClient(notebook, km=manager, timeout=60, startup_timeout=60,
                                allow_errors=False, store_widget_state=False)
        try:
            client.execute(cwd=str(path.parent), env=env)
        finally:
            # A caller-supplied manager is owned here; always terminate its kernel.
            import asyncio

            async def cleanup():
                if await manager.is_alive():
                    await manager.shutdown_kernel(now=True)
                await manager.cleanup_resources()

            asyncio.run(cleanup())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--clear", action="store_true", help="Clear stored results in source notebooks")
    group.add_argument("--execute", action="store_true", help="Validate schema and run from a fresh kernel")
    args = parser.parse_args()
    paths = sorted((ROOT / "notebooks").glob("*.ipynb"))
    if not paths:
        parser.error("No notebooks found")
    for path in paths:
        try:
            check(path, clear=args.clear)
            if args.execute:
                execute(path)
        except Exception as exc:
            parser.exit(1, f"Notebook check failed: {path.name}: {exc}\n")
        print(f"{'Executed' if args.execute else 'Cleared' if args.clear else 'Checked'} {path.name}")


if __name__ == "__main__":
    main()
