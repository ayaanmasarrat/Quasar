# Team workflow

Clone the repository, check out `preview`, and create a branch for one task:

```sh
git clone https://github.com/iamisaacberg/Quasar.git
cd Quasar
git checkout preview
git checkout -b feature/your-task
```

Before starting, agree in your team chat or GitHub issue who owns the data, model, frontend and integration work. Put interface changes in a pull request early so other teammates can adapt.

1. Give your assistant `AGENTS.md`, your assigned task and any relevant source documentation.
2. Keep changes focused. Ask before changing another teammate's contract.
3. Run the README checks; commit and push your feature branch.
4. Open a pull request into `preview`. Describe behavior, synthetic/live data status, tests and remaining work.
5. Have a teammate review it before merging. Pull the updated `preview` before starting the next task.

The GitHub repository is the shared source of truth. Shared ChatGPT discussions can hold plans, but decisions affecting code should also be reflected in issues, pull requests or these docs. No collaborator access has been configured by this starter.

## Notebook and application teammates

Jupyter is optional. Notebook users follow [notebooks/README.md](notebooks/README.md); app/editor users keep using the README commands and can run the shared analysis with `python3 -m quasar.analysis --compare`.

Assign one notebook owner per experiment. Notebook code should import reusable functions from `quasar/`; source/model logic and tests belong in regular Python files. Before handing off a notebook, restart its kernel and run every cell, document findings and limitations, clear saved results with `python scripts/check_notebooks.py --clear`, and verify with `python scripts/check_notebooks.py --execute` in the optional notebook environment. CI repeats that execution from a fresh kernel. The application does not depend on Jupyter or on a notebook being open.
