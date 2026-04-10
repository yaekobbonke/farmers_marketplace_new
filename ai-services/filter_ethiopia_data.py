import pandas as pd

def extract_ethiopia_market_data(input_file):
    # 1. Load the global dataset
    print("Reading global dataset...")
    df = pd.read_csv("./data/historical_prices.csv")

    # 2. Filter by Country Name
    # WFP data usually uses 'Ethiopia'. 
    ethiopia_df = df[df['adm0_name'] == 'Ethiopia'].copy()

    
    columns_to_keep = [
        'mkt_id', 'mkt_name',    # Market
        'cm_id', 'cm_name',      # Commodity (Crop)
        'um_id', 'um_name',      # Unit (KG, Quintal, etc.)
        'mp_month', 'mp_year',   # Date
        'mp_price'               # Target Price
    ]
    
    ethiopia_df = ethiopia_df[columns_to_keep]

    # 4. Save the "Clean" version for training
    ethiopia_df.to_csv('ethiopia_market_prices.csv', index=False)
    
    print(f"✅ Success! Saved {len(ethiopia_df)} rows of Ethiopian market data.")
    print(f"Markets found: {ethiopia_df['mkt_name'].unique()}")

# Run the filter
extract_ethiopia_market_data('historical_prices.csv')