import os
import json
import asyncio
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from .forecast import PriceInference

router = APIRouter()

# Node.js backend URL for SQL data
MARKET_API_URL = "http://localhost:5000/api/prices/latest"
SCRAPER_DATA_PATH = os.path.join(os.path.dirname(__file__), "market_intelligence.json")

class ChatRequest(BaseModel):
    message: str
    user: str = "Farmer"
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None

class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# Store conversation history (in production, use Redis or database)
conversation_history: Dict[str, List[Dict[str, str]]] = {}

async def fetch_market_data():
    """Fetches real-time price data from the TypeScript/PostgreSQL backend."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(MARKET_API_URL)
            if response.status_code == 200:
                data = response.json()
                if not data:
                    return "No local market price updates available currently."
                
                items = data.get('data', data) if isinstance(data, dict) else data
                if isinstance(items, list) and len(items) > 0:
                    return "\n".join([
                        f"- {item.get('productName', item.get('product', 'Unknown'))}: {item.get('price', 0)} ETB"
                        for item in items[:10]
                    ])
            return "Local market feed is currently offline."
    except Exception as e:
        print(f"📡 SQL API Connection Error: {e}")
        return "Unable to reach the local price database."

def fetch_daily_ecx_intelligence():
    """Reads the latest daily ECX report from the web scraper JSON."""
    try:
        if os.path.exists(SCRAPER_DATA_PATH):
            with open(SCRAPER_DATA_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if not data:
                    return "Daily ECX report is empty."
                
                return "\n".join([
                    f"- {item.get('commodity', item.get('name', 'Unknown'))}: {item.get('price_per_kg', item.get('price', 0))} ETB/kg"
                    for item in data[:10]
                ])
        return "Official Daily ECX report not found."
    except Exception as e:
        print(f"📈 Scraper Data Error: {e}")
        return "Daily trade report unavailable."

async def get_price_prediction(commodity: str, fastapi_req: Request) -> Optional[str]:
    """Get AI price prediction for a commodity"""
    price_model = getattr(fastapi_req.app.state, "price_model", None)
    
    if not price_model:
        return None
    
    try:
        commodity_map = {
            "teff": "TEFF",
            "maize": "MAIZE (WHITE)",
            "wheat": "WHEAT",
            "coffee": "COFFEE",
            "barley": "BARLEY"
        }
        
        mapped_commodity = commodity_map.get(commodity.lower(), commodity.upper())
        
        prediction_request = PriceInference(
            admin1="ADDIS ABABA",
            market_id=14,
            commodity_id=1,
            category="CEREALS",
            commodity=mapped_commodity,
            latitude=9.02,
            longitude=38.75,
            rfq=0.0
        )
        
        from .forecast import get_prediction
        result = await get_prediction(fastapi_req, prediction_request)
        
        prediction = result.get('prediction', {}).get('price_etb')
        if prediction:
            return f"📊 AI Price Forecast for {commodity.title()}: {prediction} ETB"
        return None
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

def detect_intent(message: str) -> Dict[str, Any]:
    """Detect user intent from message"""
    message_lower = message.lower()
    
    intents = {
        "price_prediction": any(word in message_lower for word in ['predict', 'forecast', 'will be', 'future price']),
        "price_check": any(word in message_lower for word in ['price', 'cost', 'how much']),
        "farming_tip": any(word in message_lower for word in ['how to', 'plant', 'grow', 'cultivate', 'harvest']),
        "market_trend": any(word in message_lower for word in ['trend', 'market', 'demand']),
        "pest_control": any(word in message_lower for word in ['pest', 'disease', 'insect', 'control']),
        "weather": any(word in message_lower for word in ['weather', 'rain', 'climate', 'season']),
    }
    
    commodities = ['teff', 'maize', 'wheat', 'coffee', 'barley', 'sorghum', 'millet', 'cereal']
    detected_commodity = next((c for c in commodities if c in message_lower), None)
    
    return {
        "intents": intents,
        "commodity": detected_commodity,
        "needs_prediction": intents["price_prediction"] and detected_commodity
    }

@router.post("/")
async def stream_chat(request: ChatRequest, fastapi_req: Request):
    """
    Enhanced chat endpoint with intent detection and price predictions
    """
    db = getattr(fastapi_req.app.state, "vector_db", None)
    llm = getattr(fastapi_req.app.state, "chat_llm", None)
    
    # Detect user intent
    intent = detect_intent(request.message)
    
    # Get market data in parallel
    market_data, ecx_data = await asyncio.gather(
        fetch_market_data(),
        asyncio.to_thread(fetch_daily_ecx_intelligence)
    )
    
    # Get price prediction if needed
    price_prediction = None
    if intent["needs_prediction"]:
        price_prediction = await get_price_prediction(intent["commodity"], fastapi_req)
    
    if not db or not llm:
        # Fallback response without LLM
        response_text = f"""🌾 **AgriSmart Farming Assistant**

I'm here to help with Ethiopian agriculture!

**📊 Market Updates:**
{market_data}

**📈 ECX Daily Report:**
{ecx_data}
"""
        
        if price_prediction:
            response_text += f"\n\n{price_prediction}"
        
        response_text += """

**💡 You can ask me about:**
• Crop prices (teff, wheat, coffee, maize)
• Best planting seasons
• Pest control methods
• Market trends and forecasts

What would you like to know?"""
        
        return ChatResponse(response=response_text, session_id=request.session_id)

    try:
        # Build context-aware system prompt
        system_prompt = f"""You are AgriSmart AI, an expert Ethiopian farming assistant.

**Current Market Data:**
{market_data}

**Official ECX Prices:**
{ecx_data}
"""
        
        if price_prediction:
            system_prompt += f"\n**AI Price Prediction:**\n{price_prediction}\n"
        
        system_prompt += """

**Instructions:**
- Be helpful, concise, and practical for Ethiopian farmers
- Use ETB for all prices
- Mention specific Ethiopian regions when relevant
- If you don't know something, say so honestly
- Keep responses under 150 words when possible

**Guidelines:**
- For price questions: Reference current market data
- For planting advice: Consider Ethiopian seasons (Meher, Belg)
- For pest control: Suggest integrated pest management first
"""

        # Get conversation history
        history = []
        if request.session_id and request.session_id in conversation_history:
            history = conversation_history[request.session_id][-10:]  # Last 10 messages
        
        # Build messages
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history
        for h in history:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        
        # Add current message
        messages.append({"role": "user", "content": request.message})
        
        # Generate response
        response = await llm.ainvoke(messages)
        
        # Store in conversation history
        if request.session_id:
            if request.session_id not in conversation_history:
                conversation_history[request.session_id] = []
            conversation_history[request.session_id].append({"role": "user", "content": request.message})
            conversation_history[request.session_id].append({"role": "assistant", "content": response.content})
        
        return ChatResponse(
            response=response.content,
            session_id=request.session_id,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return ChatResponse(
            response=f"I'm here to help with farming! You asked: '{request.message[:100]}'. Please try asking about specific crops or market prices.",
            session_id=request.session_id
        )

@router.get("/health")
async def chat_health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "chat",
        "timestamp": datetime.now().isoformat(),
        "has_vector_db": True,
        "has_llm": True
    }

@router.post("/test")
async def test_chat(request: ChatRequest):
    """Simple test endpoint to verify routing works"""
    return {
        "message": "Chat router is working",
        "received": request.message,
        "user": request.user,
        "timestamp": datetime.now().isoformat()
    }

@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear conversation history for a session"""
    if session_id in conversation_history:
        del conversation_history[session_id]
    return {"message": "History cleared", "session_id": session_id}