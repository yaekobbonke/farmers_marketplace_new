import pandas as pd
import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import gc
import os
import platform

# 1. SYSTEM PATCH: Prevents Windows 3.13 WMI error
platform.machine = lambda: "AMD64"

def reduce_mem_usage(df):
    """ Standard numeric reduction to save RAM. """
    for col in df.columns:
        col_type = df[col].dtype
        if col_type != object and not isinstance(df[col].dtype, pd.CategoricalDtype):
            if str(col_type)[:3] == 'int':
                df[col] = pd.to_numeric(df[col], downcast='integer')
            else:
                df[col] = pd.to_numeric(df[col], downcast='float')
    return df

def train_price_predictor():
    print("📈 Loading merged dataset...")
    
    features = [
        'latitude', 'longitude', 'market_id', 'commodity_id', 
        'rfq', 'r3q', 'exchange_rate_usd', 'index_confidence_score',
        'YoYChangeMonth', 'MonthlyChangeSA'
    ]
    cat_features = ['admin1', 'category', 'commodity', 'pricetype', 'PriceTrendMonth']
    target = 'usdprice'
    
    # Load data
    full_df = pd.read_csv('final_merged_data.csv', usecols=features + cat_features + [target])

    # --- STRATEGIC SAMPLING: The Fix for 'bad allocation' ---
    # We sample 50% of the data (approx 700k rows). 
    # This is more than enough for a high-quality MSc/BSc model.
    print(f"⚠️  Sampling 50% of 1.4M rows to prevent memory crash...")
    df = full_df.sample(frac=0.5, random_state=42).reset_index(drop=True)
    del full_df # Immediately free the massive original dataframe
    gc.collect()
    
    # 1. ENCODE CATEGORIES
    print("🏷️  Encoding categories...")
    encoders = {}
    for col in cat_features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    
    if not os.path.exists('models'):
        os.makedirs('models')
    joblib.dump(encoders, 'models/label_encoders.pkl')

    # 2. OPTIMIZE MEMORY
    df = reduce_mem_usage(df)
    print(f"✅ Memory optimized. Training on {len(df)} rows.")

    # 3. SPLIT DATA
    X = df.drop(columns=[target])
    y = df[target]
    
    print("✂️  Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    del df
    gc.collect()

    # 4. CONVERT TO DMATRIX
    print("📦 Converting to DMatrix...")
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)
    
    del X_train, y_train, X_test, y_test
    gc.collect()

    # 5. TRAIN MODEL
    print("🧠 Training XGBoost Model...")
    params = {
        'objective': 'reg:squarederror',
        'learning_rate': 0.1,
        'max_depth': 4,
        'subsample': 0.6,
        'colsample_bytree': 0.6,
        'tree_method': 'hist',
        'nthread': 2
    }

    model = xgb.train(
        params,
        dtrain,
        num_boost_round=200,
        evals=[(dtest, 'test')],
        early_stopping_rounds=15,
        verbose_eval=10
    )

    # 6. SAVE
    model.save_model('models/price_model.json')
    print("\n🚀 SUCCESS! Model saved to 'models/price_model.json'.")

# ... (all your functions like reduce_mem_usage and train_price_predictor)

if __name__ == "__main__":
    # This is the magic line for Windows
    import multiprocessing
    multiprocessing.freeze_support()
    
    # Now call your training function
    train_price_predictor()