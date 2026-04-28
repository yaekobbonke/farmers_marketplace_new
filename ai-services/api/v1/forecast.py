import json
import os
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field
import xgboost as xgb
import pandas as pd

router = APIRouter()

# --- 0. Define the Schema FIRST ---
class PriceInference(BaseModel):
    admin1: str = Field(..., example="ADDIS ABABA")
    market_id: int = Field(..., example=14)
    commodity_id: int = Field(..., example=1)
    category: str = Field(..., example="CEREALS")
    commodity: str = Field(..., example="MAIZE (WHITE)")
    latitude: float = Field(..., example=9.02)
    longitude: float = Field(..., example=38.75)
    rfq: float = Field(0.0)
    r3q: float = Field(0.0)

# --- 1. Helper to load the latest scraped data ---
def get_latest_market_context():
    # Path to the file created by your scraper
    # Pro-tip: Use a dynamic path if this is in a subfolder
    file_path = os.path.join(os.path.dirname(__file__), 'market_intelligence.json')
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return []

@router.post("/predict")
async def get_prediction(request: Request, data: PriceInference):
    model = getattr(request.app.state, "price_model", None)
    encoders = getattr(request.app.state, "encoders", None)
    
    if model is None or encoders is None:
        raise HTTPException(status_code=503, detail="AI Services not loaded")

    # Fetch live context from your daily scraper
    live_context = get_latest_market_context()
    current_exchange_rate = 118.5  # Latest market estimation
    
    try:
        expected_order = [
            'admin1', 'market_id', 'latitude', 'longitude', 'category', 
            'commodity', 'commodity_id', 'pricetype', 'MonthlyChangeSA', 
            'YoYChangeMonth', 'PriceTrendMonth', 'index_confidence_score', 
            'rfq', 'r3q', 'exchange_rate_usd'
        ]

        # Check if the requested commodity exists in our live scraped data
        live_price_per_kg = 0.0
        for item in live_context:
            # Matches against name or symbol (e.g., 'Coffee' or 'LW')
            if item['symbol'].upper() in data.commodity.upper() or item['commodity'].upper() in data.commodity.upper():
                live_price_per_kg = item['price_per_kg']
                break

        # Build input for XGBoost
        input_dict = {
            'admin1': [data.admin1.upper()],
            'market_id': [data.market_id],
            'latitude': [data.latitude],
            'longitude': [data.longitude],
            'category': [data.category.upper()],
            'commodity': [data.commodity.upper()],
            'commodity_id': [data.commodity_id],
            'pricetype': ["Retail"],
            'MonthlyChangeSA': [0.05], 
            'YoYChangeMonth': [0.12],
            'PriceTrendMonth': ["Normal"],
            'index_confidence_score': [0.85],
            # If user didn't provide rfq, we use our live scraped price!
            'rfq': [data.rfq if data.rfq != 0 else live_price_per_kg], 
            'r3q': [data.r3q],
            'exchange_rate_usd': [current_exchange_rate]
        }
        
        df = pd.DataFrame(input_dict)
        df = df[expected_order]

        # Handle Label Encoding for categories
        cat_cols = ['admin1', 'category', 'commodity', 'pricetype', 'PriceTrendMonth']
        for col in cat_cols:
            if col in encoders:
                le = encoders[col]
                clean_val = str(df[col].iloc[0]).upper().strip()
                try:
                    df[col] = le.transform([clean_val])
                except:
                    df[col] = 0 # Fallback for unknown regions/items

        # Inference
        data_matrix = xgb.DMatrix(df, feature_names=expected_order)
        prediction_usd = model.predict(data_matrix)
        val_usd = float(prediction_usd[0])
        
        # Convert result back to ETB
        val_etb = val_usd * current_exchange_rate

        return {
            "status": "success",
            "prediction": {
                "item": data.commodity.upper(),
                "region": data.admin1.upper(),
                "predicted_price_etb": round(val_etb, 2),
                "current_market_baseline": round(live_price_per_kg, 2) if live_price_per_kg > 0 else "N/A",
                "currency": "ETB"
            },
            "metadata": {
                "exchange_rate_used": current_exchange_rate,
                "data_source": "Hybrid (XGBoost + Daily Scraper)"
            }
        }
        
    except Exception as e:
        print(f"❌ Prediction Error: {e}")
        raise HTTPException(status_code=422, detail=f"Inference Engine Error: {str(e)}")