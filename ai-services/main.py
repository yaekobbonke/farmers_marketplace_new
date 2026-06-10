import os
import logging
import multiprocessing
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

import joblib
import xgboost as xgb
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# AI & Vector DB Imports
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

# Project Internal Imports
from core.config import settings
from api.v1.forecast import router as forecast_router
from api.v1.chat import router as chat_router
from api.v2 import heartbeat as heartbeat_v2

# =========================================================
# LOGGING CONFIGURATION
# =========================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# =========================================================
# PATH CONFIGURATION
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "models" / "price_model.json"
ENCODER_PATH = BASE_DIR / "models" / "label_encoders.pkl"
FEATURE_ORDER_PATH = BASE_DIR / "models" / "feature_order.pkl"

CHROMA_PATH = BASE_DIR / "chroma_db"

SCRAPER_DATA_PATH = (
    BASE_DIR / "api" / "v1" / "market_intelligence.json"
)

# =========================================================
# APPLICATION LIFESPAN
# =========================================================

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info(f"🚀 Starting AgriSmart AI Backend | PID: {os.getpid()}")

    # =====================================================
    # GROQ API KEY VALIDATION
    # =====================================================
    
    logger.info(f"🔑 GROQ KEY LOADED: {bool(settings.GROQ_API_KEY)}")
    logger.info(f"🔑 GROQ KEY PREFIX: {settings.GROQ_API_KEY[:8] if settings.GROQ_API_KEY else None}")
    
    # =====================================================
    # A. LOAD FORECASTING MODEL
    # =====================================================

    app.state.price_model = None
    app.state.encoders = None
    app.state.feature_order = None

    try:
        if MODEL_PATH.exists() and ENCODER_PATH.exists():
            logger.info("📦 Loading XGBoost model...")
            model = xgb.Booster()
            model.load_model(str(MODEL_PATH))
            app.state.price_model = model
            logger.info("✅ XGBoost model loaded successfully")

            logger.info("📦 Loading label encoders...")
            app.state.encoders = joblib.load(str(ENCODER_PATH))
            logger.info(
                f"Encoders loaded: "
                f"{list(app.state.encoders.keys())}"
            )

            if FEATURE_ORDER_PATH.exists():
                app.state.feature_order = joblib.load(
                    str(FEATURE_ORDER_PATH)
                )
                logger.info(
                    f"✅ Feature order loaded "
                    f"({len(app.state.feature_order)} features)"
                )
            else:
                logger.warning("⚠️ Feature order file not found")
        else:
            logger.warning(
                f"⚠️ Model files not found in: {MODEL_PATH.parent}"
            )
    except Exception as e:
        logger.exception(
            f"❌ Failed to load forecasting assets: {e}"
        )

    # =====================================================
    # B. INITIALIZE AI CHAT + VECTOR DB
    # =====================================================

    app.state.vector_db = None
    app.state.chat_llm = None

    try:
        logger.info("🧠 Loading embedding model...")
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={
                "device": "cpu"
            },
            encode_kwargs={
                "normalize_embeddings": True
            }
        )
        logger.info("Embedding model loaded")

        logger.info("Initializing ChromaDB...")
        CHROMA_PATH.mkdir(parents=True, exist_ok=True)
        vector_db = Chroma(
            persist_directory=str(CHROMA_PATH),
            embedding_function=embeddings
        )
        logger.info("ChromaDB initialized")

        logger.info("Initializing Groq LLM...")
        llm = ChatGroq(
            temperature=0.1,
            model="llama-3.3-70b-versatile",
            groq_api_key=settings.GROQ_API_KEY,
            timeout=60,
            max_retries=2
        )
        logger.info("Groq LLM initialized")

        app.state.vector_db = vector_db
        app.state.chat_llm = llm

        logger.info("AI services initialized successfully")

    except Exception as e:
        logger.exception(
            f"Failed to initialize AI services: {e}"
        )

    # =====================================================
    # APPLICATION RUNNING
    # =====================================================

    yield

    # =====================================================
    # CLEANUP
    # =====================================================

    logger.info("🛑 Shutting down AgriSmart AI services...")

    try:
        if hasattr(app.state, "vector_db"):
            del app.state.vector_db
        logger.info("Cleanup completed")
    except Exception as e:
        logger.warning(f"Cleanup warning: {e}")

# =========================================================
# FASTAPI APP INITIALIZATION
# =========================================================

app = FastAPI(
    title="AgriSmart Intelligence API",
    description=(
        "AI-powered microservice for agricultural forecasting, "
        "ECX intelligence, and RAG chat"
    ),
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# =========================================================
# CORS CONFIGURATION
# =========================================================

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://farmers-marketplace.vercel.app",
    "https://agrismart.onrender.com",
]

# Optional Railway/Vercel frontend URL
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# GLOBAL EXCEPTION HANDLER
# =========================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception
):
    logger.exception(f"❌ Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal server error"
        }
    )

# =========================================================
# ROUTERS
# =========================================================

app.include_router(
    heartbeat_v2.router,
    prefix="/api/v2",
    tags=["Health"]
)

app.include_router(
    forecast_router,
    prefix="/api/v1/forecast",
    tags=["Price Prediction"]
)

app.include_router(
    chat_router,
    prefix="/api/v1/chat",
    tags=["AI Chat"]
)

# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "AgriSmart Intelligence API",
        "version": "2.1.0",
        "services": {
            "price_model_ready":
                getattr(app.state, "price_model", None) is not None,
            "encoders_ready":
                getattr(app.state, "encoders", None) is not None,
            "vector_db_ready":
                getattr(app.state, "vector_db", None) is not None,
            "llm_ready":
                getattr(app.state, "chat_llm", None) is not None,
            "daily_ecx_data_available":
                SCRAPER_DATA_PATH.exists()
        },
        "timestamp": datetime.now().isoformat()
    }

# =========================================================
# HEALTH CHECK ENDPOINT
# =========================================================

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# =========================================================
# ENTRYPOINT
# =========================================================

if __name__ == "__main__":
    import uvicorn

    multiprocessing.freeze_support()

    port = int(os.getenv("PORT", 8000))
    # Railway/Render require 0.0.0.0
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(
        f"AgriSmart AI Backend running on http://{host}:{port}"
    )
    logger.info(
        f"Swagger Docs: http://{host}:{port}/docs"
    )

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        workers=1,
        loop="asyncio",
        log_level="info"
    )