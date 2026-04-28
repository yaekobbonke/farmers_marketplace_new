import os
import json
import asyncio
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
# Relative import to avoid ModuleNotFoundError
from .forecast import PriceInference 

router = APIRouter()

# Node.js backend URL for SQL data
MARKET_API_URL = "http://localhost:5000/api/prices/latest"
# Path to your scraper output
SCRAPER_DATA_PATH = os.path.join(os.path.dirname(__file__), "market_intelligence.json")

# 1. Define Schemas
class ChatRequest(BaseModel):
    message: str
    user: str = "Farmer"

# 2. Helper: Fetch SQL Data (Local Markets)
async def fetch_market_data():
    """Fetches real-time price data from the TypeScript/PostgreSQL backend."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(MARKET_API_URL)
            if response.status_code == 200:
                data = response.json()
                if not data: 
                    return "No local market price updates available currently."
                
                return "\n".join([
                    f"- {item['product']} in {item['market']}: {item['price']} ETB (Updated: {item.get('updatedAt', '')[:10]})"
                    for item in data
                ])
            return "Local market feed is currently offline."
    except Exception as e:
        print(f"📡 SQL API Connection Error: {e}")
        return "Unable to reach the local price database."

# 3. Helper: Fetch Scraper Data (Official Daily ECX)
def fetch_daily_ecx_intelligence():
    """Reads the latest daily ECX report from the web scraper JSON."""
    try:
        if os.path.exists(SCRAPER_DATA_PATH):
            with open(SCRAPER_DATA_PATH, 'r') as f:
                data = json.load(f)
                if not data:
                    return "Daily ECX report is empty."
                
                return "\n".join([
                    f"- {item['commodity']} ({item['symbol']}): {item['price_per_kg']} ETB/kg (Official ECX)"
                    for item in data[:8]  # Limit to save context tokens
                ])
        return "Official Daily ECX report not found."
    except Exception as e:
        print(f"📈 Scraper Data Error: {e}")
        return "Daily trade report unavailable."

@router.post("/")
async def stream_chat(request: ChatRequest, fastapi_req: Request):
    """
    Quadplex RAG Chat Endpoint combining:
    1. Vector DB (PDF Manuals)
    2. SQL Database (Local Prices)
    3. JSON Scraper (Official Daily ECX)
    4. XGBoost Model (Future Forecasts)
    """
    
    db = fastapi_req.app.state.vector_db
    llm = fastapi_req.app.state.chat_llm
    price_model = getattr(fastapi_req.app.state, "price_model", None)

    if not db or not llm:
        raise HTTPException(
            status_code=503, 
            detail="AI Assistant services are still initializing."
        )

    try:
        if request.message == "INIT_WELCOME":
            return {
                "reply": f"Hello {request.user}! I am your AgriSmart Assistant. I can help with official ECX prices, local market rates, and farming techniques. How can I help you today?"
            }

        # --- 4. DATA GATHERING (Parallel) ---
        async def get_pdf_docs():
            return await asyncio.to_thread(db.similarity_search, request.message, k=2)

        async def get_ai_forecast():
            if not price_model: return "Forecast engine offline."
            msg = request.message.lower()
            # Trigger forecast if commodity mentioned
            if any(crop in msg for crop in ["maize", "corn", "coffee", "teff"]):
                from .forecast import get_prediction
                # Defaulting to ADDIS ABABA for general queries
                mock_data = PriceInference(
                    admin1="ADDIS ABABA", market_id=14, commodity_id=1,
                    category="CEREALS", commodity="MAIZE (WHITE)",
                    latitude=9.02, longitude=38.75, rfq=0.0
                )
                try:
                    res = await get_prediction(fastapi_req, mock_data)
                    return f"AI Projection: {res['prediction']['price_etb']} ETB"
                except:
                    return "Forecast unavailable for this specific item."
            return "No specific forecast requested."

        # Execute all sources
        docs, market_sql, ai_forecast = await asyncio.gather(
            get_pdf_docs(), 
            fetch_market_data(),
            get_ai_forecast()
        )
        
        # Scraper data (synchronous read is fast enough)
        ecx_daily = fetch_daily_ecx_intelligence()

        # --- 5. CONTEXT PREPARATION ---
        sources = set()
        pdf_texts = []
        for d in docs:
            pdf_texts.append(d.page_content)
            source_name = os.path.basename(d.metadata.get("source", "Manual"))
            page = d.metadata.get("page", "N/A")
            sources.add(f"{source_name} (Pg. {page})")

        # --- 6. HYBRID PROMPT ---
        system_prompt = (
            "You are the AgriSmart AI Expert, an Ethiopian Agricultural Assistant.\n"
            "STRICT DATA SOURCE GUIDELINES:\n"
            "1. For OFFICIAL DAILY ECX PRICES: Use 'DAILY ECX REPORT'. This is the most reliable for exporters.\n"
            "2. For LOCAL MARKET PRICES: Use 'LOCAL MARKET FEED'.\n"
            "3. For TRENDS/FORECASTS: Use 'AI PRICE PROJECTION'.\n"
            "4. For FARMING TECHNIQUES: Use 'FARMING MANUAL CONTEXT'.\n"
            "Currency is always ETB. Keep answers helpful and concise.\n\n"
            f"--- DAILY ECX REPORT (OFFICIAL) ---\n{ecx_daily}\n\n"
            f"--- LOCAL MARKET FEED (SQL) ---\n{market_sql}\n\n"
            f"--- AI PRICE PROJECTION ---\n{ai_forecast}\n\n"
            f"--- FARMING MANUAL CONTEXT ---\n{os.linesep.join(pdf_texts)}"
        )

        # --- 7. STREAMING GENERATOR ---
        async def generate():
            async for chunk in llm.astream([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ]):
                content = getattr(chunk, "content", "")
                if content:
                    yield content

            # Footer with Data Source Transparency
            yield "\n\n---\n**Data Sources & Accuracy:**\n"
            yield "• 📈 Official Daily ECX Report (Web Scraper)\n"
            yield "• 📡 Local Market Database (PostgreSQL)\n"
            yield "• 🤖 XGBoost Intelligence Engine\n"
            for s in sources:
                yield f"• 📄 {s}\n"

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        print(f"❌ Chat Error: {e}")
        raise HTTPException(status_code=500, detail="AI Assistant encountered an error.")