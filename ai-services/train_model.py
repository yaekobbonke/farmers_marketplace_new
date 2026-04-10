import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import os

df = pd.read_csv('ethiopia_market_prices.csv')

features = ['mkt_id', 'cm_id', 'mp_month', 'mp_year']
X = df[features]
y = df['mp_price']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost on Ethiopian Market Data...")
model = xgb.XGBRegressor(
    n_estimators=1000,
    learning_rate=0.05,
    max_depth=6,
    objective='reg:squarederror'
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=100 # This will show progress every 100 rounds
)

# 5. Save the model
if not os.path.exists('models'): 
    os.makedirs('models')
model.save_model('models/price_model.json')

# 6. Accuracy Check
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)
print(f"\n✅ Model Trained Successfully!")
print(f"📊 Mean Absolute Error: {mae:.2f} ETB")