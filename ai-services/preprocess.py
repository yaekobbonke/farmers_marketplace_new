import pandas as pd
import sys
import platform

# 1. SYSTEM PATCH: Prevents Windows 3.13 WMI / OSError 0x80041032
platform.machine = lambda: "AMD64"

def clean_date(df, col_name):
    """Aligns all dates to the 1st of the month for easy matching."""
    df[col_name] = pd.to_datetime(df[col_name])
    return df[col_name].dt.to_period('M').dt.to_timestamp()

def run_full_merge():
    print("🚀 Starting Integrated Agricultural Data Pipeline...")

    # 1. LOAD ALL FILES
    # Ensure these files are in your 'data' folder
    try:
        prices = pd.read_csv('data/prices_45k.csv')
        alps = pd.read_csv('data/wfp_alps_indicators.csv')
        trust = pd.read_csv('data/market_metadata.csv')
        rain = pd.read_csv('data/rainfall_chirps.csv')
        fx = pd.read_csv('data/usd_etb_exchange.csv')
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        return

    # 2. ALIGN DATES
    prices['merge_date'] = clean_date(prices, 'date')
    alps['merge_date'] = clean_date(alps, 'Date')
    rain['merge_date'] = clean_date(rain, 'date')
    
    # 3. STANDARDIZE KEYS
    prices['comm_key'] = prices['commodity'].str.lower().str.strip()
    alps['comm_key'] = alps['MainStapleFood'].str.lower().str.strip()

    # 4. MERGE 1: Prices + National Trends (WFP ALPS)
    df = pd.merge(prices, alps[['merge_date', 'comm_key', 'MonthlyChangeSA', 'YoYChangeMonth', 'PriceTrendMonth']], 
                  on=['merge_date', 'comm_key'], how='left')
    print("✅ Pillar 1: Economic Trends Merged.")

    # 5. MERGE 2: Add Market Trust Scores (Deduplicated to prevent MemoryError)
    trust_unique = trust[['mkt_name', 'index_confidence_score', 'spatially_interpolated']].drop_duplicates(subset=['mkt_name'])
    df = pd.merge(df, trust_unique, left_on='market', right_on='mkt_name', how='left')
    print("✅ Pillar 2: Market Metadata Merged.")

    # 6. MERGE 3: Add Rainfall (PCODE to Region Mapping)
    print("🛰️  Mapping Rainfall PCODEs to Ethiopian Regions...")
    pcode_map = {
        'ET01': 'TIGRAY', 'ET02': 'AFAR', 'ET03': 'AMHARA', 'ET04': 'OROMIA',
        'ET05': 'SOMALI', 'ET06': 'BENISHANGUL-GUMUZ', 'ET07': 'SNNPR',
        'ET12': 'GAMBELA', 'ET13': 'HARARI', 'ET14': 'ADDIS ABABA', 'ET15': 'DIRE DAWA'
    }
    
    rain['admin1_upper'] = rain['PCODE'].map(pcode_map)
    df['admin1_upper'] = df['admin1'].str.upper().str.strip()

    # Convert 10-day rainfall dekads into Monthly Averages
    rain_monthly = rain.groupby(['merge_date', 'admin1_upper'])[['rfq', 'r3q']].mean().reset_index()

    df = pd.merge(df, rain_monthly, on=['merge_date', 'admin1_upper'], how='left')
    print("✅ Pillar 3: Climate Anomalies Merged.")

    # 7. MERGE 4: Add Annual Exchange Rate
    df['year'] = pd.to_datetime(df['date']).dt.year
    df = pd.merge(df, fx[['Year', 'Value']], left_on='year', right_on='Year', how='left')
    df.rename(columns={'Value': 'exchange_rate_usd'}, inplace=True)
    print("✅ Pillar 4: Macro-Exchange Rates Merged.")

    # 8. FINAL CLEANUP & IMPUTATION
    # Fill missing values for old records (pre-2014) or missing regions
    df.fillna({
        'rfq': 0, 
        'r3q': 0, 
        'YoYChangeMonth': 0, 
        'MonthlyChangeSA': 0,
        'PriceTrendMonth': 'Normal',
        'index_confidence_score': 0.7  # Neutral confidence for unknown markets
    }, inplace=True)

    # Drop temporary merge keys and redundant columns
    drop_list = ['admin1_upper', 'mkt_name', 'Year', 'year', 'comm_key', 'merge_date']
    df.drop(columns=[c for c in drop_list if c in df.columns], inplace=True)
    
    # Save the Final Dataset
    df.to_csv('final_merged_data.csv', index=False)
    print(f"\n🎉 SUCCESS! Created 'final_merged_data.csv' with {len(df)} rows and {len(df.columns)} features.")

if __name__ == "__main__":
    run_full_merge()