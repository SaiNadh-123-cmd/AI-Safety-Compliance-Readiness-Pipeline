# O&G — AI Safety & Compliance Readiness Pipeline

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Presidio](https://img.shields.io/badge/Microsoft_Presidio-PII_Guardrails-blue)](https://microsoft.github.io/presidio/)

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
                      │  WORKSTREAM B: TWO-SIDED PII LASER TUNNEL     │
                      │  ──────────────────────────────────────────   │
                      │  Chamber 01: Input Pre-Processor              │
                      │  • Microsoft Presidio Analyzer + spaCy NLP    │
                      │  • Sensitive Entity Masking ([PHONE], [CARD]) │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  Chamber 02: Model Core Execution             │
                      │  • Target: O&G-ENTERPRISE-ASSISTANT v2.4      │
                      │  • Live Interactive Sandbox + Raw Peek Toggle │
                      └───────────────────────┬───────────────────────┘
                                              │
                      ┌───────────────────────▼───────────────────────┐
                      │  Chamber 03: Output Post-Processor            │
                      │  • Response scrubbing & Leakage Verification  │
                      │  • False Positive (1.3%) / Negative (0.8%)    │
                      └───────────────────────┬───────────────────────┘
                                              │
     ┌────────────────────────────────────────┴────────────────────────────────────────┐
     │                                                                                 │
┌────▼─────────────────────────────────────┐      ┌────────────────────────────────────▼────┐
│ WORKSTREAM A: VIRTUAL DEFENSE DOME       │      │ WORKSTREAM C: COMPLIANCE ARENA          │
│ ──────────────────────────────────       │      │ ──────────────────────────────          │
│ • Spatial 3D rotating core with 3s pulse │      │ • NIST AI RMF Bento: GOVERN · MAP       │
│ • 5 Adversarial Portals:                 │      │   MEASURE · MANAGE                      │
│   01 Jailbreaks & Instruction Override   │      │ • EU AI Act Human Legal Review Queue    │
│   02 System-Prompt & Context Leakage     │      │ • Live Evidence Console (Controls Mapped)│
│   03 Sensitive-Data Disclosure           │      │ • Executive Dossier (Export JSON/MD/PDF)│
│   04 Toxic & Abusive Output              │      └─────────────────────────────────────────┘
│   05 Dangerous / High-Impact Advice      │
│ • Reproducible test cases & remediation  │
└──────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
AI_Safety_Pipeline/
├── frontend/                     # Vite + React + Tailwind Frontend
│   ├── public/assets/branding/   # O&G logo branding assets
│   ├── src/
│   │   ├── types/
│   │   │   └── pipeline.ts       # Domain interfaces (AttackFinding, PIIEntity, etc.)
│   │   ├── services/
│   │   │   └── api.ts            # FastAPI integration client with offline fallbacks
│   │   ├── App.tsx               # Pipeline layout & orchestration
│   │   ├── index.css             # Cybernetic styling, 3D keyframes & glowing meshes
│   │   └── main.tsx              # React DOM mounting
│   ├── package.json
│   └── vite.config.ts            # Configured proxy to FastAPI backend
│
├── backend/                      # Python FastAPI Microservice
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── pii.py        # Presidio Analyzer & Anonymizer endpoints
│   │   │   │   ├── chat.py       # Two-sided guardrail chat route
│   │   │   │   ├── redteam.py    # Adversarial probes & threat signal telemetry
│   │   │   │   └── compliance.py # NIST AI RMF & EU AI Act evidence state
│   │   │   └── api.py
│   │   ├── core/
│   │   │   └── config.py         # CORS, settings & target models
│   │   └── main.py               # FastAPI application entrypoint
│   ├── requirements.txt          # Backend dependencies
│   └── README.md
│
├── .gitignore                    # Monorepo ignores (node_modules, venv, caches)
├── package.json                  # Root proxy scripts
└── README.md
```

---

## ⚡ Quick Start

### 1. Frontend Development (Vite + React)

You can launch the frontend directly from the workspace root or from the `frontend/` directory:

```bash
# Option A: From root directory
npm install
npm run dev

# Option B: From frontend directory
cd frontend
npm install
npm run dev
```

Visit [LIVE]((https://ai-complence.netlify.app/)) in your browser.
“The live site is an interactive demonstration of the AI Safety & Compliance pipeline using pre-computed sandbox results.

The complete, reproducible red-teaming suite (Promptfoo + Ollama) is included in the repository so any team member can run real adversarial tests locally against an authorized model.”
#### Frontend Scripts:
* `npm run dev` — Start Vite local dev server with HMR.
* `npm run build` — Compile production-ready bundle.
* `npm run typecheck` — Run TypeScript type checking.
* `npm run lint` — Run ESLint code quality checks.

---

### 2. Backend Development (FastAPI + Microsoft Presidio)

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy model for Microsoft Presidio
python -m spacy download en_core_web_sm

# Launch API server
uvicorn app.main:app --reload --port 8000
```

* Interactive OpenAPI Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
* Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛡️ Key Features

* **3D Virtual Defense Dome:** Spatial visualization with dual animation (12s continuous rotation + 3s brightness pulse) and radial attack portals.
* **Interactive Attack Inspector:** Side-by-side before/after remediation slider comparing model outputs and risk containment.
* **Two-Sided PII Laser Tunnel:** Synthetic payloads routed through real-time input masking and output verification chambers with animated laser beams.
* **Compliance Matrix Bento Grid:** Interactive cards for NIST AI RMF pillars (`GOVERN`, `MAP`, `MEASURE`, `MANAGE`) and EU AI Act obligations.
* **Executive Dossier:** Side drawer with readiness metrics (Readiness Index: 82.4/100, 47/56 controls mapped) with JSON, Markdown, and PDF export capabilities.

---

## ⚖️ Important Boundary Notice

Automated tests, red-teaming probes, and compliance readiness matrices generated by this pipeline support technical risk assessment. They do **not** constitute legal advice or establish that an AI model is legally compliant or "safe to launch." Formal deployment decisions require qualified legal, privacy, security, and product governance sign-offs.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
