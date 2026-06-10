from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/heartbeat")
async def heartbeat():
    return {
        "status": "alive",
        "timestamp": datetime.now().isoformat(),
        "service": "agrismart-ai",
        "version": "2.0.0"
    }

@router.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "agrismart-ai"
    }