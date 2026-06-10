# ai-services/core/config.py
import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()  # This looks for the .env file you just created

class Settings(BaseSettings):
    PROJECT_NAME: str = "Agri-Intelligence API"
    # This will now pull from your .env file
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY") 
    
    class Config:
        case_sensitive = True

settings = Settings()