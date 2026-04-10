from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import numpy as np
import xgboost as xgb
import pandas as pd
from datetime import datetime

router = APIRouter()

class PriceInference(BaseModel):
    farmer_price: float
    scraped_price: float
    historical_avg: float
    # If your frontend can pass IDs, add them here. 
    # Otherwise, we use placeholders as shown below.
    mkt_id: int = 1 
    cm_id: int = 1

@router.post("/predict")
async def get_prediction(request: Request, data: PriceInference):
    model = request.app.state.model
    
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # 1. Get current time for time-based features
        now = datetime.now()
        
        # 2. Create a dictionary with the EXACT names the model expects
        # Based on your error: 'mkt_id', 'cm_id', 'mp_month', 'mp_year'
        input_dict = {
            "mkt_id": [data.mkt_id],
            "cm_id": [data.cm_id],
            "mp_month": [now.month],
            "mp_year": [now.year]
        }
        
        # 3. Convert to DataFrame to preserve feature names
        df = pd.DataFrame(input_dict)

        # 4. Convert to DMatrix with explicit feature names
        # This matches the 'mkt_id', 'cm_id', etc. required by your .json model
        data_matrix = xgb.DMatrix(df, feature_names=["mkt_id", "cm_id", "mp_month", "mp_year"])
        
        # 5. Predict
        prediction = model.predict(data_matrix)
        
        return {"predicted_price": round(float(prediction[0]), 2)}
        
    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=400, detail=f"Prediction error: {str(e)}")