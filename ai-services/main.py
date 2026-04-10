import os
import xgboost as xgb
from pathlib import Path
from fastapi import FastAPI
from contextlib import asynccontextmanager

# AI & Vector DB Imports
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

# Project Internal Imports
from core.config import settings
from api.v1.forecast import router as forecast_router
from api.v1.chat import router as chat_router

# 1. Setup Constants & Paths
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "price_model.json"
CHROMA_PATH = BASE_DIR / "chroma_db"

# 2. Define Lifespan Logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Startup: Initializing Agri-Intelligence Services...")
    
    # --- A. XGBoost Model Loading ---
    model = xgb.Booster()
    if MODEL_PATH.exists():
        try:
            model.load_model(str(MODEL_PATH))
            app.state.price_model = model
            print(f"✅ XGBoost Model loaded from: {MODEL_PATH}")
        except Exception as e:
            print(f"❌ Error loading XGBoost model: {e}")
            app.state.price_model = None
    else:
        print(f"⚠️ Model file NOT FOUND at: {MODEL_PATH}")
        app.state.price_model = None

    # --- B. AI Chat & RAG Initialization ---
    try:
        print("DEBUG: Loading HuggingFace Embeddings...")
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        print(f"DEBUG: Connecting to ChromaDB at {CHROMA_PATH}...")
        # We ensure the directory is treated as a string for Chroma
        vector_db = Chroma(persist_directory=str(CHROMA_PATH), embedding_function=embeddings)
        
        print("DEBUG: Initializing Groq LLM...")
        llm = ChatGroq(
            temperature=0.1,
            model_name="llama-3.3-70b-versatile",
            groq_api_key=settings.GROQ_API_KEY,
        )
        
        # Store in app.state for the chat router to consume
        app.state.vector_db = vector_db 
        app.state.chat_llm = llm
        print("✅ AI Chat & Vector DB initialized successfully.")
        
    except Exception as e:
        print(f"❌ CRITICAL AI ERROR during startup: {e}")
        app.state.vector_db = None
        app.state.chat_llm = None

    yield
    
    # Clean up on shutdown
    print("🛑 AI Services shutting down...")

# 3. Initialize the FastAPI instance
app = FastAPI(
    title="Ethiopian Farmers Marketplace AI API",
    description="Microservice for price prediction and Llama 3 RAG chat",
    version="1.0.0",
    lifespan=lifespan
)

# 4. Include Routers
# Note: Use these prefixes in your frontend fetch calls
app.include_router(forecast_router, prefix="/api/v1/forecast", tags=["Price Prediction"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["AI Chat"])

# 5. Root Endpoint for Health Checks
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "Agri-Intelligence",
        "price_model_loaded": getattr(app.state, "price_model", None) is not None,
        "vector_db_loaded": getattr(app.state, "vector_db", None) is not None,
        "llm_ready": getattr(app.state, "chat_llm", None) is not None
    }