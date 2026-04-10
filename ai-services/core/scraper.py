import requests
from bs4 import BeautifulSoup
import os
import re
from dotenv import load_dotenv

load_dotenv()

# Internal mapping for Ethiopian units to KG
UNIT_MULTIPLIERS = {
    "quintal": 100.0,
    "kg": 1.0,
    "ton": 1000.0,
    "ኩንታል": 100.0, # Amharic support
    "ኪሎ": 1.0
}

def clean_ethiopian_price(text):
    """Removes 'ETB', commas, and Amharic currency strings."""
    # Regex to extract only numbers and decimals
    numeric_part = re.sub(r'[^\d.]', '', text.replace(',', ''))
    return float(numeric_part) if numeric_part else 0.0

def scrape_ethiopian_commodities():
    # Example: Targeting an Ethiopian Agri-Market page
    TARGET_URL = "https://nbe.gov.et/exchange/price-of-commodities/" 
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        response = requests.get(TARGET_URL, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, 'html.parser')

        # Assuming the site uses a table for Teff, Wheat, Maize, etc.
        rows = soup.select('table#price-table tr')[1:] # Skip header

        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 3:
                raw_name = cols[0].text.strip()
                raw_price = cols[1].text.strip()
                raw_unit = cols[2].text.strip().lower()

                price_val = clean_ethiopian_price(raw_price)
                
                # Normalize units to KG for your database
                multiplier = UNIT_MULTIPLIERS.get(raw_unit, 1.0)
                price_per_kg = price_val / multiplier if multiplier > 0 else price_val

                payload = {
                    "name": raw_name,
                    "price": round(price_per_kg, 2),
                    "market": "Addis Ababa Central Market",
                    "unit": "kg" # Standardizing everything to KG in DB
                }

                sync_to_backend(payload)

    except Exception as e:
        print(f"Scraping Error: {e}")

def sync_to_backend(data):
    # Same sync logic as before using your INTERNAL_SECRET
    endpoint = f"{os.getenv('BACKEND_URL')}/prices/internal/sync"
    headers = {"x-internal-secret": os.getenv("INTERNAL_SECRET")}
    requests.post(endpoint, json=data, headers=headers)

if __name__ == "__main__":
    scrape_ethiopian_commodities()