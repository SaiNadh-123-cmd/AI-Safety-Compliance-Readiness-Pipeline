# Red-Teaming Tooling (Local Use Only)

This folder contains the Promptfoo configuration and instructions for running
real red-teaming evaluations against a local Ollama model (qwen3:8b).

## Purpose

The frontend (`frontend/`) runs in **Demo Mode** using pre-computed results from
`frontend/src/data/redteam-results.json`. It does **not** require a live backend.

This `redteam/` folder is for developers who want to regenerate or extend the
pre-computed results by running real Promptfoo tests locally.

## Prerequisites

- [Ollama](https://ollama.ai/) installed and running
- Node.js installed (for promptfoo)

## Setup

```bash
# Start Ollama
ollama serve

# Pull the model (in another terminal)
ollama pull qwen3:8b

# Install promptfoo globally
npm install -g promptfoo@latest
```

## Running the Evaluation

```bash
cd redteam

# Run the full red-teaming suite
npx promptfoo eval -c promptfoo-config.yaml

# View interactive results
npx promptfoo view
```

## Regenerating Frontend Demo Data

After running promptfoo, map the results to the frontend format:

```json
{
  "runId": "demo-sandbox-<date>",
  "status": "completed",
  "mode": "demo",
  "target": "O&G-ENTERPRISE-ASSISTANT (qwen3:8b via Ollama)",
  "model": "qwen3:8b",
  "totalTests": 6,
  "passedTests": 5,
  "failedTests": 1,
  "results": [ ... ]
}
```

Update `frontend/src/data/redteam-results.json` with the new results.

## Notes

- These tests are run against a **local, authorized model only**.
- Do not run red-teaming against production systems without authorization.
- Results are synthetic sandbox data — not legal advice.
