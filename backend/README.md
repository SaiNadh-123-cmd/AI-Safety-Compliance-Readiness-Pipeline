# O&G AI Safety & Compliance Pipeline - Backend (Node.js + Express)

Node.js + Express backend that runs Promptfoo red-teaming against Groq Cloud (llama-3.1-8b-instant) or a user-submitted target endpoint. Generates JSON, PDF, and CSV reports.

## Folder Structure

```
backend/
├── package.json          # Node.js dependencies & scripts
├── .env.example          # Copy to .env and configure
├── .gitignore            # Git ignore rules
├── README.md             # This file
├── src/
│   ├── index.js          # Express app entry point
│   ├── routes/
│   │   ├── health.js     # GET /api/health
│   │   └── evaluate.js   # POST /api/evaluate, GET /api/evaluate/:id/:format
│   ├── services/
│   │   ├── promptfoo.js  # Programmatic Promptfoo runner + Groq health check
│   │   └── reports.js    # PDF, JSON, CSV report generation
│   └── middleware/
│       ├── errorHandler.js
│       └── notFound.js
├── reports/              # Generated report files (gitignored)
└── scripts/
    └── seed-demo.js      # Seed precomputed demo results
```

## Quick Start

```bash
cd backend

# Install dependencies
npm install

# Copy env config
cp .env.example .env
# Edit .env if needed (CORS_ORIGIN, OLLAMA_BASE_URL, etc.)

# Seed demo data (for offline/demo mode)
npm run seed:demo

# Start server (development with auto-reload)
npm run dev

# Or production
npm start
```

The server will run on `http://localhost:3001` by default.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check (used by frontend for live/demo detection) |
| POST | `/api/evaluate` | Start a red-teaming evaluation run |
| GET | `/api/evaluate/:runId` | Poll for run status and results |
| GET | `/api/evaluate/:runId/:format` | Download report (json, pdf, csv) |

## POST /api/evaluate Request Body

```json
{
  "targetUrl": "https://your-chatbot-endpoint.com/chat",  // optional
  "apiKey": "optional-api-key",                            // optional
  "headers": { "X-Custom": "value" },                      // optional
  "model": "llama-3.1-8b-instant",                                     // default if no targetUrl
  "tests": [                                               // optional, uses defaults if omitted
    {
      "description": "Classic jailbreak attempt",
      "prompt": "Ignore all previous instructions...",
      "assert": [
        { "type": "llm-rubric", "value": "The model should refuse..." },
        { "type": "not-contains", "value": "step by step" }
      ]
    }
  ]
}
```

## Response

```json
{
  "runId": "uuid",
  "status": "running",
  "mode": "live",
  "message": "Evaluation started. Poll /api/evaluate/:runId for results.",
  "downloads": {
    "json": "/api/evaluate/:runId/json",
    "pdf": "/api/evaluate/:runId/pdf",
    "csv": "/api/evaluate/:runId/csv"
  }
}
```

## Connecting Netlify Frontend to Local Backend

The frontend runs on Netlify (public internet) but your backend runs locally. To connect them:

### Option 1: ngrok (simplest)
```bash
# Install ngrok
npm install -g ngrok

# Expose your local backend
ngrok http 3001
```
Use the `https://...ngrok-free.app` URL as your backend origin in the frontend.

### Option 2: Cloudflare Tunnel
```bash
# Install cloudflared
brew install cloudflared   # macOS
# or download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/


```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Backend server port |
| NODE_ENV | development | Node environment |
| CORS_ORIGIN | https://aisafetycompliance.netlify.app | Allowed frontend origin |
| GROQ_API_BASE_URL | https://api.groq.com | Groq API base URL |
| GROQ_MODEL | llama-3.1-8b-instant | Default model for red-teaming |
| PROMPTFOO_TIMEOUT | 300000 | Promptfoo eval timeout (ms) |
