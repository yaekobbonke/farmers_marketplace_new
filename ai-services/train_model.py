import pandas as pd
import xgboost as xgb
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib
import gc
import os
import platform

platform.machine = lambda: "AMD64"

def train_price_predictor():
    print("Loading merged dataset...")
    
    # Define features
    numeric_features = [
        'latitude', 'longitude', 'market_id', 'commodity_id', 
        'rfq', 'r3q', 'exchange_rate_usd', 'index_confidence_score',
        'YoYChangeMonth', 'MonthlyChangeSA'
    ]
    
    categorical_features = ['admin1', 'category', 'commodity', 'pricetype', 'PriceTrendMonth']
    
    # Load data
    full_df = pd.read_csv('final_merged_data.csv')
    
    # ✅ Calculate realistic ETB price (using actual price column if available)
    if 'price' in full_df.columns:
        # Use the actual ETB price from CSV
        target = 'price'
        print("Using 'price' column (ETB) as target")
    else:
        # Calculate ETB from USD
        full_df['price_etb'] = full_df['usdprice'] * full_df['exchange_rate_usd']
        target = 'price_etb'
        print("Calculated ETB price from USD * exchange_rate")
    
    print(f"Loaded {len(full_df)} total rows")
    print(f"Price range: {full_df[target].min():.2f} - {full_df[target].max():.2f} ETB")
    print(f"Mean price: {full_df[target].mean():.2f} ETB")
    
    # Filter realistic prices (remove outliers)
    full_df = full_df[full_df[target] < 5000]  # Cap at 5000 ETB
    full_df = full_df[full_df[target] > 5]      # Min 5 ETB
    
    print(f"After filtering: {len(full_df)} rows")
    
    # Filter recent data (last 5 years)
    if 'date' in full_df.columns:
        full_df['date'] = pd.to_datetime(full_df['date'])
        cutoff_date = pd.Timestamp.now() - pd.DateOffset(years=5)
        full_df = full_df[full_df['date'] >= cutoff_date]
        print(f"Using {len(full_df)} rows from last 5 years")
    
    # Sample for memory
    sample_size = min(300000, len(full_df))
    df = full_df.sample(n=sample_size, random_state=42).reset_index(drop=True)
    print(f"Using {sample_size} rows for training")
    
    # Fill missing values
    for col in numeric_features:
        df[col] = df[col].fillna(df[col].median())
    
    # Encode categorical features
    print("🏷️ Encoding categories...")
    encoders = {}
    for col in categorical_features:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        print(f"  - {col}: {len(le.classes_)} unique values")
    
    # Save encoders
    os.makedirs('models', exist_ok=True)
    joblib.dump(encoders, 'models/label_encoders.pkl')
    
    # Prepare features
    feature_order = numeric_features + categorical_features
    X = df[feature_order]
    y = df[target]
    
    # Save feature order
    joblib.dump(feature_order, 'models/feature_order.pkl')
    print(f"Feature order saved: {len(feature_order)} features")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Create DMatrix
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dtest = xgb.DMatrix(X_test, label=y_test)
    
    # Train model
    print("🧠 Training XGBoost Model on ETB prices...")
    params = {
        'objective': 'reg:squarederror',
        'learning_rate': 0.05,
        'max_depth': 6,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'tree_method': 'hist',
        'nthread': 4,
        'seed': 42,
        'eval_metric': 'rmse'
    }
    
    evals = [(dtrain, 'train'), (dtest, 'eval')]
    
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=500,
        evals=evals,
        early_stopping_rounds=50,
        verbose_eval=50
    )
    
    # Save model
    model.save_model('models/price_model.json')
    
    # Evaluate
    y_pred = model.predict(dtest)
    rmse = np.sqrt(np.mean((y_pred - y_test) ** 2))
    print(f"\nModel Evaluation:")
    print(f"  - RMSE: {rmse:.2f} ETB")
    print(f"  - R²: {1 - np.sum((y_test - y_pred)**2) / np.sum((y_test - y_test.mean())**2):.4f}")
    
    # Feature importance
    importance = model.get_score(importance_type='weight')
    print(f"\nFeature Importance (top 10):")
    sorted_importance = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:10]
    for feat, score in sorted_importance:
        print(f"  - {feat}: {score}")
    
    print("\n SUCCESS! Model saved to 'models/price_model.json'")

if __name__ == "__main__":
    import multiprocessing
    multiprocessing.freeze_support()
    train_price_predictor()