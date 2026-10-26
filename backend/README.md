# O&G AI Safety & Compliance Pipeline — Backend (FastAPI)

FastAPI microservice powering:
1. **Microsoft Presidio PII Guardrails:** Two-sided input pre-processing & output post-processing.
2. **Red-Teaming Engine:** Automated probes and adversarial testing (Promptfoo & Giskard).
3. **Compliance Matrix:** NIST AI RMF (Govern, Map, Measure, Manage) and EU AI Act readiness evidence tracking.

---

## Getting Started

### 1. Create and Activate Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Download the spaCy Language Model for Presidio
```bash
python -m spacy download en_core_web_sm
```

### 4. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```

- API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Endpoint: [http://localhost:8000/health](http://localhost:8000/health)
