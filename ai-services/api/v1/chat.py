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

# =========================================================
# CONFIGURATION
# =========================================================

MARKET_API_URL = os.getenv("MARKET_API_URL")

SCRAPER_DATA_PATH = os.path.join(
    os.path.dirname(__file__),
    "market_intelligence.json"
)

# =========================================================
# REQUEST / RESPONSE MODELS
# =========================================================

class ChatRequest(BaseModel):
    message: str
    user: str = "Farmer"
    session_id: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str
    session_id: Optional[str] = None
    timestamp: str = Field(
        default_factory=lambda: datetime.now().isoformat()
    )

# =========================================================
# MEMORY
# =========================================================

conversation_history: Dict[str, List[Dict[str, str]]] = {}

# =========================================================
# MARKET DATA
# =========================================================

async def fetch_market_data():
    """
    Fetch farmer product listings + prices
    from Node.js/PostgreSQL backend.
    """

    try:

        async with httpx.AsyncClient(timeout=10.0) as client:

            response = await client.get(MARKET_API_URL)

            if response.status_code == 200:

                data = response.json()

                if not data:
                    return "No local farmer listings available."

                # Handle both:
                # { data: [...] }
                # OR directly [...]
                items = (
                    data.get("data", data)
                    if isinstance(data, dict)
                    else data
                )

                if isinstance(items, list) and len(items) > 0:

                    formatted_products = []

                    # DEBUG (temporary)
                    print("📦 Marketplace API Sample:")
                    print(items[:2])

                    for item in items[:15]:

                        # =================================================
                        # SAFELY EXTRACT FIELDS
                        # =================================================

                        product = (
                            item.get("product")
                            or item.get("productName")
                            or item.get("commodity")
                            or "Unknown Product"
                        )

                        price = item.get("price", 0)

                        market = (
                            item.get("market")
                            or item.get("marketName")
                            or item.get("location")
                            or "Unknown Market"
                        )

                        unit = item.get("unit", "unit")

                        source = item.get(
                            "source",
                            "Farmer Marketplace"
                        )

                        seller = (
                            item.get("seller")
                            or item.get("farmerName")
                            or item.get("user")
                            or "Farmer"
                        )

                        recorded_at = (
                            item.get("recordedAt")
                            or item.get("createdAt")
                            or ""
                        )

                        # =================================================
                        # STRUCTURED OBJECT FOR LLM
                        # =================================================

                        formatted_products.append({
                            "product": str(product).title(),
                            "price_etb": price,
                            "unit": unit,
                            "market": market,
                            "seller": seller,
                            "source": source,
                            "recorded_at": recorded_at
                        })

                    # =====================================================
                    # RETURN CLEAN JSON STRING
                    # =====================================================

                    return json.dumps(
                        formatted_products,
                        indent=2,
                        ensure_ascii=False
                    )

            return "Local farmer marketplace is currently unavailable."

    except Exception as e:

        print(f"📡 SQL API Connection Error: {e}")

        return "Unable to connect to PostgreSQL farmer marketplace."

def fetch_daily_ecx_intelligence():
    """
    Reads latest ECX intelligence data.
    """

    try:

        if os.path.exists(SCRAPER_DATA_PATH):

            with open(
                SCRAPER_DATA_PATH,
                "r",
                encoding="utf-8"
            ) as f:

                data = json.load(f)

                if not data:
                    return "Daily ECX report is empty."

                return "\n".join([

                    f"- {item.get('commodity', item.get('name', 'Unknown'))}: "
                    f"{item.get('price_per_kg', item.get('price', 0))} ETB/kg"

                    for item in data[:10]

                ])

        return "Official ECX report not found."

    except Exception as e:

        print(f"📈 ECX Data Error: {e}")

        return "Daily ECX intelligence unavailable."

# =========================================================
# PRICE PREDICTION
# =========================================================

async def get_price_prediction(
    commodity: str,
    fastapi_req: Request
) -> Optional[str]:

    price_model = getattr(
        fastapi_req.app.state,
        "price_model",
        None
    )

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

        mapped_commodity = commodity_map.get(
            commodity.lower(),
            commodity.upper()
        )

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

        result = await get_prediction(
            fastapi_req,
            prediction_request
        )

        prediction = (
            result.get("prediction", {})
            .get("predicted_price_etb")
        )

        if prediction:

            return (
                f"Predicted future price for "
                f"{commodity.title()} is "
                f"{prediction} ETB/kg"
            )

        return None

    except Exception as e:

        print(f"Prediction error: {e}")

        return None

# =========================================================
# INTENT DETECTION
# =========================================================

def detect_intent(message: str) -> Dict[str, Any]:

    message_lower = message.lower()

    intents = {

        "price_prediction":
            any(word in message_lower for word in [
                "predict",
                "forecast",
                "future price",
                "next week",
                "next month"
            ]),

        "price_check":
            any(word in message_lower for word in [
                "price",
                "cost",
                "how much",
                "market price"
            ]),

        "farming_tip":
            any(word in message_lower for word in [
                "how to",
                "grow",
                "plant",
                "cultivate",
                "harvest",
                "fertilizer",
                "weed"
            ]),

        "pest_control":
            any(word in message_lower for word in [
                "pest",
                "disease",
                "insect",
                "fungus"
            ])
    }

    commodities = [
        "teff",
        "maize",
        "wheat",
        "coffee",
        "barley",
        "sorghum"
    ]

    detected_commodity = next(
        (c for c in commodities if c in message_lower),
        None
    )

    return {
        "intents": intents,
        "commodity": detected_commodity,
        "needs_prediction":
            intents["price_prediction"]
            and detected_commodity
    }

# =========================================================
# RAG RETRIEVAL
# =========================================================

async def retrieve_rag_context(question: str, db):

    try:

        docs = db.similarity_search(question, k=5)

        if not docs:
            return "No agricultural knowledge found."

        context_parts = []

        for i, doc in enumerate(docs, start=1):

            source = doc.metadata.get(
                "source",
                "Unknown Source"
            )

            page = doc.metadata.get(
                "page",
                "?"
            )

            context_parts.append(
                f"""
DOCUMENT {i}
Source: {source}
Page: {page}

{doc.page_content}
"""
            )

        return "\n\n".join(context_parts)

    except Exception as e:

        print(f"❌ RAG Retrieval Error: {e}")

        return "Knowledge retrieval failed."

# =========================================================
# CHAT ENDPOINT
# =========================================================

@router.post("/")
async def stream_chat(
    request: ChatRequest,
    fastapi_req: Request
):

    db = getattr(
        fastapi_req.app.state,
        "vector_db",
        None
    )

    llm = getattr(
        fastapi_req.app.state,
        "chat_llm",
        None
    )

    intent = detect_intent(request.message)

    # =====================================================
    # LOAD LIVE DATA
    # =====================================================

    market_data, ecx_data = await asyncio.gather(

        fetch_market_data(),

        asyncio.to_thread(
            fetch_daily_ecx_intelligence
        )
    )

    # =====================================================
    # LOAD RAG CONTEXT
    # =====================================================

    rag_context = ""

    if db:

        rag_context = await retrieve_rag_context(
            request.message,
            db
        )

    # =====================================================
    # PRICE PREDICTION
    # =====================================================

    price_prediction = None

    if intent["needs_prediction"]:

        price_prediction = await get_price_prediction(
            intent["commodity"],
            fastapi_req
        )

    # =====================================================
    # FALLBACK
    # =====================================================

    if not llm:

        return ChatResponse(
            response=(
                "AI assistant is temporarily unavailable."
            ),
            session_id=request.session_id
        )

    try:

        # =================================================
        # SYSTEM PROMPT
        # =================================================

        system_prompt = f"""
You are AgriSmart AI,
an advanced Ethiopian agricultural assistant.

You help farmers with:

- Crop production
- Fertilizer recommendations
- Weed control
- Pest management
- Irrigation
- Market prices
- Agricultural business
- Harvesting
- Storage methods
- Ethiopian farming practices

=================================================
LIVE FARMER MARKETPLACE DATA
=================================================

{market_data}

=================================================
ETHIOPIAN ECX MARKET DATA
=================================================

{ecx_data}

=================================================
RETRIEVED AGRICULTURAL KNOWLEDGE
=================================================

{rag_context}
"""

        if price_prediction:

            system_prompt += f"""

=================================================
AI PRICE FORECAST
=================================================

{price_prediction}
"""

        system_prompt += """

=================================================
RESPONSE RULES
=================================================

1. Give detailed, educational, and practical answers.

2. For farming questions:
   - Explain step-by-step.
   - Include land preparation.
   - Include seed selection.
   - Include fertilizer application.
   - Include irrigation.
   - Include weed management.
   - Include pest and disease control.
   - Include harvesting.
   - Include post-harvest handling.

3. Use Ethiopian agricultural context:
   - Mention Meher and Belg seasons.
   - Mention Ethiopian regions when relevant.

4. Use the retrieved knowledge base as the
primary source of truth.

5. If marketplace data contains relevant
products, mention them naturally.

6. For price questions:
   - Use live PostgreSQL marketplace data.
   - Use ECX data if relevant.
   - Mention ETB currency.

7. Never say:
"I can only provide short answers."

8. Provide comprehensive explanations
when the user requests detailed answers.

9. Structure long answers using:
   - headings
   - bullet points
   - numbered steps

10. Be accurate and practical.
"""

        # =================================================
        # BUILD CHAT HISTORY
        # =================================================

        messages = [

            {
                "role": "system",
                "content": system_prompt
            }

        ]

        # Previous history

        if (
            request.session_id
            and request.session_id in conversation_history
        ):

            history = conversation_history[
                request.session_id
            ][-10:]

            for h in history:

                messages.append({
                    "role": h["role"],
                    "content": h["content"]
                })

        # Current user message

        messages.append({

            "role": "user",
            "content": request.message

        })

        # =================================================
        # GENERATE RESPONSE
        # =================================================

        response = await llm.ainvoke(messages)

        # =================================================
        # SAVE HISTORY
        # =================================================

        if request.session_id:

            if request.session_id not in conversation_history:

                conversation_history[
                    request.session_id
                ] = []

            conversation_history[
                request.session_id
            ].append({
                "role": "user",
                "content": request.message
            })

            conversation_history[
                request.session_id
            ].append({
                "role": "assistant",
                "content": response.content
            })

        return ChatResponse(

            response=response.content,

            session_id=request.session_id,

            timestamp=datetime.now().isoformat()

        )

    except Exception as e:

        print(f"❌ Chat Error: {e}")

        return ChatResponse(
            response=(
                "An error occurred while generating "
                "the agricultural response."
            ),
            session_id=request.session_id
        )

# =========================================================
# HEALTH CHECK
# =========================================================

@router.get("/health")
async def chat_health():

    return {

        "status": "healthy",

        "service": "chat",

        "timestamp": datetime.now().isoformat(),

        "vector_db_ready": True,

        "llm_ready": True

    }

# =========================================================
# TEST ENDPOINT
# =========================================================

@router.post("/test")
async def test_chat(request: ChatRequest):

    return {

        "message": "Chat router working",

        "received": request.message,

        "timestamp": datetime.now().isoformat()

    }

# =========================================================
# CLEAR HISTORY
# =========================================================

@router.delete("/history/{session_id}")
async def clear_history(session_id: str):

    if session_id in conversation_history:

        del conversation_history[session_id]

    return {

        "message": "Conversation history cleared",

        "session_id": session_id

    }