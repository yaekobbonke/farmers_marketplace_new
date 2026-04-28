import os
import xgboost as xgb
import joblib
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
ENCODER_PATH = BASE_DIR / "models" / "label_encoders.pkl"
CHROMA_PATH = BASE_DIR / "chroma_db"
# Path to the JSON output of your ECX Scraper
SCRAPER_DATA_PATH = BASE_DIR / "api" / "v1" / "market_intelligence.json"

# 2. Define Lifespan Logic
@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"DEBUG: Process ID {os.getpid()} is starting up...")
    print("🚀 Startup: Initializing Agri-Intelligence Services...")
    
    # --- A. XGBoost Model & Encoder Loading ---
    if MODEL_PATH.exists() and ENCODER_PATH.exists():
        try:
            # Load Model
            model = xgb.Booster()
            model.load_model(str(MODEL_PATH))
            app.state.price_model = model
            
            # Load Encoders (Translating text like 'COFFEE' to model numbers)
            app.state.encoders = joblib.load(str(ENCODER_PATH))
            
            print(f"✅ XGBoost Model & Encoders loaded successfully.")
        except Exception as e:
            print(f"❌ Error loading forecasting assets: {e}")
            app.state.price_model = None
            app.state.encoders = None
    else:
        print(f"⚠️ Warning: Model or Encoders NOT FOUND at {MODEL_PATH.parent}")
        app.state.price_model = None
        app.state.encoders = None

    # --- B. AI Chat & RAG Initialization ---
    try:
        print("DEBUG: Loading HuggingFace Embeddings...")
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        print(f"DEBUG: Connecting to ChromaDB...")
        vector_db = Chroma(persist_directory=str(CHROMA_PATH), embedding_function=embeddings)
        
        print("DEBUG: Initializing Groq LLM (Llama 3.3)...")
        llm = ChatGroq(
            temperature=0.1,
            model_name="llama-3.3-70b-versatile",
            groq_api_key=settings.GROQ_API_KEY,
        )
        
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
    title="AgriSmart Intelligence API",
    description="Microservice for price prediction, ECX scraping, and Llama 3 RAG chat",
    version="1.1.0",
    lifespan=lifespan
)

# 4. Include Routers
app.include_router(forecast_router, prefix="/api/v1/forecast", tags=["Price Prediction"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["AI Chat"])

# 5. Root Endpoint for Health Checks
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "Agri-Intelligence",
        "price_model_ready": getattr(app.state, "price_model", None) is not None,
        "vector_db_ready": getattr(app.state, "vector_db", None) is not None,
        "llama3_ready": getattr(app.state, "chat_llm", None) is not None,
        # Check if the scraper has successfully generated the data file
        "daily_ecx_data_available": SCRAPER_DATA_PATH.exists()
    }

if __name__ == "__main__":
    import uvicorn
    import multiprocessing
    
    multiprocessing.freeze_support() 
    
    print("🚀 AgriSmart AI Backend booting on http://127.0.0.1:8000")
    uvicorn.run(
        "main:app", 
        host="127.0.0.1", 
        port=8000, 
        reload=False,   # Stable for Python 3.13
        workers=1, 
        loop="asyncio"
    )