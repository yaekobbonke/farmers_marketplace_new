from pydantic import BaseModel, Field

class PricePredictionRequest(BaseModel):
    crop_name: str = Field(..., example="Maize")
    rainfall_mm: float = Field(..., description="Monthly rainfall in millimeters")
    fuel_index: float = Field(default=100.0)
    month: int = Field(..., ge=1, le=12)

class PricePredictionResponse(BaseModel):
    crop_name: str
    predicted_price: float
    confidence_score: float
    currency: str = "USD"