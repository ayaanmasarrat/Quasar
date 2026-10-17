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
