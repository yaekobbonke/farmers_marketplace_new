import requests
from bs4 import BeautifulSoup
import json

def get_live_ecx_intelligence():
    base_url = "https://www.2merkato.com"
    listing_url = f"{base_url}/news/capital-market-and-commodity-exchange"
    
    print("📡 Step 1: Locating latest ECX Daily Report...")
    
    try:
        # 1. Get the latest article link
        resp = requests.get(listing_url)
        soup = BeautifulSoup(resp.text, 'html.parser')
        latest_item = soup.find('div', class_='items-row')
        article_link = base_url + latest_item.find('a')['href']
        report_date = latest_item.find('a').text.split('–')[-1].strip()
        
        print(f"✅ Found Report for: {report_date}")
        
        # 2. Scrape the actual price table inside the article
        print("📡 Step 2: Extracting price data...")
        article_resp = requests.get(article_link)
        article_soup = BeautifulSoup(article_resp.text, 'html.parser')
        
        prices = []
        # ECX data on 2merkato is usually in <table> tags
        tables = article_soup.find_all('table')
        
        for table in tables:
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header row
                cols = row.find_all('td')
                if len(cols) >= 3:
                    item_name = cols[0].text.strip()
                    symbol = cols[1].text.strip()
                    avg_price = cols[2].text.strip().replace(',', '')
                    
                    # Basic normalization
                    try:
                        price_val = float(avg_price)
                        # Identify if it's Coffee (Feresula) or Other (Quintal)
                        unit = "KG"
                        normalized_price = price_val / 17 if symbol in ['LU', 'LW'] else price_val / 100
                        
                        prices.append({
                            "commodity": item_name,
                            "symbol": symbol,
                            "price_per_kg": round(normalized_price, 2),
                            "original_price": price_val,
                            "date": report_date
                        })
                    except ValueError:
                        continue

        # 3. Save as Intelligence JSON for your Next.js frontend
        with open('market_intelligence.json', 'w') as f:
            json.dump(prices, f, indent=2)
            
        print(f"🚀 Success! Extracted {len(prices)} live price points.")
        return prices

    except Exception as e:
        print(f"❌ Intelligence Error: {e}")

if __name__ == "__main__":
    data = get_live_ecx_intelligence()
    for entry in data[:5]: # Show first 5 entries
        print(f"💡 {entry['commodity']} ({entry['symbol']}): {entry['price_per_kg']} ETB/kg")