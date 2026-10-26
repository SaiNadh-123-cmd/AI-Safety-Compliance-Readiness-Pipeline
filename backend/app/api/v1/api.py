from fastapi import APIRouter
from app.api.v1.endpoints import pii, chat, redteam, compliance

api_router = APIRouter()

api_router.include_router(pii.router, prefix="/pii", tags=["PII Guardrails"])
api_router.include_router(chat.router, prefix="/chat", tags=["Sandbox Chat"])
api_router.include_router(redteam.router, prefix="/redteam", tags=["Red Teaming"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance Matrix"])
