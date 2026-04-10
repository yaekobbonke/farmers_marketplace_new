import os
import asyncio
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

# Node.js backend URL for SQL data
MARKET_API_URL = "http://localhost:5000/api/prices/latest"

class ChatRequest(BaseModel):
    message: str
    user: str = "Farmer"

async def fetch_market_data():
    """Fetches real-time price data from the TypeScript/PostgreSQL backend."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(MARKET_API_URL)
            if response.status_code == 200:
                data = response.json()
                if not data: 
                    return "No live price updates available currently."
                
                return "\n".join([
                    f"- {item['commodity']} in {item['market']}: {item['price']} ETB (Updated: {item.get('updatedAt', '')[:10]})"
                    for item in data
                ])
            return "Live market feed is currently offline."
    except Exception as e:
        print(f"📡 API Connection Error: {e}")
        return "Unable to reach the price database."

@router.post("/")
async def stream_chat(request: ChatRequest, fastapi_req: Request):
    """
    Main Chat Endpoint.
    Uses 'fastapi_req.app.state' to access the pre-loaded AI models.
    """
    
    # --- 1. ACCESS PRE-LOADED MODELS ---
    # These were initialized in main.py lifespan
    db = fastapi_req.app.state.vector_db
    llm = fastapi_req.app.state.chat_llm

    if not db or not llm:
        raise HTTPException(
            status_code=503, 
            detail="AI Assistant services are still initializing or unavailable."
        )

    try:
        # --- 2. HANDLE INITIAL HANDSHAKE ---
        if request.message == "INIT_WELCOME":
            return {
                "reply": f"Hello {request.user}! I am your AgriSmart Assistant. I can help with market prices and farming techniques. How can I help you today?"
            }

        # --- 3. PARALLEL PROCESSING ---
        async def get_pdf_docs():
            # Uses the pre-loaded global vector_db
            return await asyncio.to_thread(db.similarity_search, request.message, k=3)

        docs, market_context = await asyncio.gather(get_pdf_docs(), fetch_market_data())

        # --- 4. FORMAT CONTEXT & SOURCES ---
        sources = set()
        pdf_texts = []
        for d in docs:
            pdf_texts.append(d.page_content)
            source_name = os.path.basename(d.metadata.get("source", "Manual"))
            page = d.metadata.get("page", "N/A")
            sources.add(f"{source_name} (Pg. {page})")

        # --- 5. HYBRID PROMPT ---
        system_prompt = (
            "You are the AgriSmart AI Expert, an Ethiopian Agricultural Assistant.\n"
            "STRICT GUIDELINES:\n"
            "1. For PRICE queries: Use ONLY the LIVE MARKET DATA below.\n"
            "2. For FARMING techniques: Use ONLY the MANUAL CONTEXT below.\n"
            "3. If data is missing, say you don't have that specific info.\n"
            "4. Always use ETB for currency.\n\n"
            f"--- LIVE MARKET DATA ---\n{market_context}\n\n"
            f"--- FARMING MANUAL CONTEXT ---\n{os.linesep.join(pdf_texts)}"
        )

        # --- 6. STREAMING GENERATOR ---
        async def generate():
            # Use the pre-loaded llm instance
            async for chunk in llm.astream([
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message},
            ]):
                content = getattr(chunk, "content", "")
                if content:
                    yield content

            # Metadata Footer
            yield "\n\n---\n**Data Sources:**\n"
            yield "• 📡 Real-time Market Price Feed (PostgreSQL)\n"
            for s in sources:
                yield f"• 📄 {s}\n"

        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        print(f"❌ Chat Processing Error: {e}")
        raise HTTPException(status_code=500, detail="AI Assistant encountered an internal error.")