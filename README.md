# O&G — AI Safety & Compliance Readiness Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Promptfoo](https://img.shields.io/badge/Promptfoo-7-000000)](https://promptfoo.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-qwen3:8b-000000)](https://ollama.ai/)

> **Next-Gen AI Safety & Compliance Pipeline for Enterprise Model Deployment.**
> Experience automated red-teaming, two-sided PII guardrails, and a living compliance audit arena mapped to NIST AI RMF and EU AI Act readiness.

---

## 🏛️ Pipeline Architecture

```
                               ┌─────────────────────────────┐
                               │     USER TEST INGESTION     │
                               │  (Synthetic Payloads/Prompts)│
                               └──────────────┬──────────────┘
                                              │
                       ┌───────────────────────▼───────────────────────┐
                       │  WORKSTREAM A: VIRTUAL DEFENSE DOME           │
                       │  ─────────────────────────────────────────   │
                       │ • Spatial 3D rotating core with 3s pulse     │
                       │ • 6 Adversarial Portals:                     │
                       │   01 Jailbreaks & Instruction Override       │
                       │   02 Roleplay Jailbreak                      │
                       │   03 System-Prompt & Context Leakage         │
                       │   04 Sensitive-Data Disclosure               │
                       │   05 Toxic & Abusive Output                  │
                       │   06 Dangerous / High-Impact Advice          │
                       └──────────────────────────────────────────────┘
                                              │
                       ┌───────────────────────▼───────────────────────┐
                       │  WORKSTREAM B: TWO-SIDED PII LASER TUNNEL     │
                       │  • Microsoft Presidio Analyzer + spaCy NLP    │
                       │  • Sensitive Entity Masking                   │
                       └──────────────────────────────────────────────┘
                                              │
                       ┌───────────────────────▼───────────────────────┐
                       │  WORKSTREAM C: COMPLIANCE ARENA               │
                       │  • NIST AI RMF: GOVERN · MAP · MEASURE · MANAGE│
                       │  • EU AI Act Human Legal Review Queue         │
                       │  • Executive Dossier (Export JSON/MD/PDF)     │
                       └──────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
AI_Safety_Pipeline/
├── frontend/                     # Vite + React + Tailwind Frontend (Demo Mode)
│   ├── public/assets/branding/   # O&G logo branding assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemoModeBanner.tsx   # "Demo Mode — Using Sandbox Results" badge
│   │   │   ├── EvaluationPanel.tsx  # Red-teaming results viewer + downloads
│   │   │   └── StarfieldGalaxyBackground.tsx
│   │   ├── data/
│   │   │   ├── demo-tests.ts        # Pre-defined Promptfoo test suite
│   │   │   └── redteam-results.json # Pre-computed sandbox results (6 tests)
│   │   ├── services/
│   │   │   └── api.ts               # Demo-only API client (no live backend)
│   │   ├── App.tsx                  # Pipeline layout & orchestration
│   │   ├── index.css                # Styling, 3D keyframes, demo component styles
│   │   └── main.tsx                 # React DOM mounting
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                       # Local dev tooling ONLY (not required for live site)
│   ├── src/                       # Node.js + Express (local development)
│   ├── package.json
│   └── README.md
│
├── redteam/                       # Promptfoo + Ollama local red-teaming tooling
│   ├── promptfoo-config.yaml      # Promptfoo test config for local regeneration
│   └── README.md                  # Instructions for regenerating demo results
│
├── .gitignore                     # Monorepo ignores
├── package.json                   # Root proxy scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Frontend Development (Vite + React)

The frontend runs entirely in **Demo Mode** — no backend, no tunnel, no ngrok required.

```bash
# From the workspace root
npm install
npm run dev

# Or from the frontend directory
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** in your browser.

The live site (https://aisafetycompliance.netlify.app/) also runs in Demo Mode using pre-computed results.

#### Frontend Scripts:
* `npm run dev` — Start Vite local dev server with HMR.
* `npm run build` — Compile production-ready bundle.
* `npm run typecheck` — Run TypeScript type checking.
* `npm run lint` — Run ESLint code quality checks.

---

## 🔄 Demo Mode

The live site always runs in **Demo Mode** with pre-computed red-teaming results:

* **Badge:** "Demo Mode — Using Sandbox Results" (shown at top of page)
* **Source:** `frontend/src/data/redteam-results.json` — 6 pre-computed test results
* **Downloads:** JSON, PDF, and CSV reports generated client-side (no server needed)
* **Tests covered:** Jailbreak, roleplay jailbreak, system-prompt leakage, sensitive-data disclosure, toxic output, dangerous medical advice

The demo results were generated by running Promptfoo against qwen3:8b via Ollama. All 6 tests show realistic refusal responses from the model.

---

## 🧪 Local Red-Teaming (Optional)

To regenerate or extend the pre-computed results locally, use the `redteam/` folder:

```bash
cd redteam

# Prerequisites: Ollama running with qwen3:8b pulled
ollama serve          # Terminal 1
ollama pull qwen3:8b  # Terminal 2

# Install promptfoo
npm install -g promptfoo@latest

# Run the full red-teaming suite
npx promptfoo eval -c promptfoo-config.yaml

# View interactive results
npx promptfoo view
```

See [`redteam/README.md`](redteam/README.md) for full instructions on regenerating `frontend/src/data/redteam-results.json`.

The `backend/` folder contains a Node.js + Express server for local development only — it is **not required** for the public live site.

---

## 🛡️ Key Features

* **3D Virtual Defense Dome:** Spatial visualization with dual animation (12s continuous rotation + 3s brightness pulse) and radial attack portals.
* **Red-Teaming Evaluation Panel:** Pre-computed Promptfoo results with pass/fail status, severity scores, and model outputs.
* **Client-Side Downloads:** JSON, PDF, and CSV reports generated in-browser.
* **Two-Sided PII Laser Tunnel:** Synthetic payloads routed through input masking and output verification chambers.
* **Compliance Matrix Bento Grid:** Interactive cards for NIST AI RMF pillars and EU AI Act obligations.
* **Executive Dossier:** Readiness metrics with JSON/Markdown/PDF export capabilities.

---

## ⚖️ Important Boundary Notice

Automated tests, red-teaming probes, and compliance readiness matrices generated by this pipeline support technical risk assessment. They do **not** constitute legal advice or establish that an AI model is legally compliant or "safe to launch." Formal deployment decisions require qualified legal, privacy, security, and product governance sign-offs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
