# Delhi Bus Ticket Data Cleaning & ML Model Training
# Team Crowdless - Hackathon Project
# Description: Takes October Delhi ticket CSV, calculates bus crowd levels, and trains a Random Forest model

import os
import sys
import json
import math
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import joblib

# Paths to folders
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")
ML_DIR = os.path.join(BASE_DIR, "ml-service")
DB_DIR = os.path.join(BASE_DIR, "database")
OCTOBER_CSV = os.path.join(DATASETS_DIR, "October-Delhi.csv")

os.makedirs(DATASETS_DIR, exist_ok=True)
os.makedirs(ML_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)

print("Starting Delhi Transit Ticket Processor...")

# In Delhi buses, women travel free with pink tickets and students/seniors have bus passes
# Delhi transport surveys show ~38% extra riders are pass holders who don't get regular ETM tickets
PASS_HOLDER_FACTOR = 1.38

# Standard bus size in Delhi: 35 seats, safe capacity is around 65 passengers (seats + standing)
BUS_SEAT_CAPACITY = 35.0
BUS_TOTAL_CAPACITY = 65.0

print(f"Reading dataset: {OCTOBER_CSV}")

# Dictionaries to aggregate ticket data by route, hour, and stops
route_hourly = {}   # key: (route, hour, is_weekend, is_ac) -> [ticket_count, passenger_sum, fare_sum]
stop_hourly = {}    # key: (stop, hour, is_weekend) -> [boardings, alightings]
od_pairs = {}       # key: (route, start_stop, end_stop) -> count
top_stops = {}      # count visits per stop

chunk_size = 250000
total_processed = 0

if not os.path.exists(OCTOBER_CSV):
    print(f"Error: {OCTOBER_CSV} not found! Please check file path.")
    sys.exit(1)

# Process in chunks because CSV is large (~290 MB)
for chunk in pd.read_csv(OCTOBER_CSV, chunksize=chunk_size, low_memory=False):
    total_processed += len(chunk)
    print(f"Processing chunk... total rows read: {total_processed}")
    
    # Parse timestamps
    chunk['created_at'] = pd.to_datetime(chunk['created_at'], errors='coerce')
    chunk = chunk.dropna(subset=['created_at', 'route', 'start_stop_name', 'end_stop_name'])
    
    chunk['hour'] = chunk['created_at'].dt.hour
    chunk['day_of_week'] = chunk['created_at'].dt.day_of_week
    chunk['is_weekend'] = (chunk['day_of_week'] >= 5).astype(int)
    chunk['is_ac_clean'] = chunk['is_ac'].fillna(False).astype(int)
    chunk['passenger_count'] = pd.to_numeric(chunk['passenger_count'], errors='coerce').fillna(1.0)
    chunk['amount'] = pd.to_numeric(chunk['amount'], errors='coerce').fillna(10.0)

    # Loop through rows in this chunk
    for _, row in chunk.iterrows():
        r = str(row['route']).strip()
        h = int(row['hour'])
        w = int(row['is_weekend'])
        ac = int(row['is_ac_clean'])
        p = float(row['passenger_count']) * PASS_HOLDER_FACTOR
        amt = float(row['amount'])
        
        start_s = str(row['start_stop_name']).strip()
        end_s = str(row['end_stop_name']).strip()
        
        # Add to route stats
        rk = (r, h, w, ac)
        if rk not in route_hourly:
            route_hourly[rk] = [0, 0.0, 0.0]
        route_hourly[rk][0] += 1
        route_hourly[rk][1] += p
        route_hourly[rk][2] += amt
        
        # Add to stop stats
        sk_start = (start_s, h, w)
        if sk_start not in stop_hourly:
            stop_hourly[sk_start] = [0.0, 0.0]
        stop_hourly[sk_start][0] += p
        
        sk_end = (end_s, h, w)
        if sk_end not in stop_hourly:
            stop_hourly[sk_end] = [0.0, 0.0]
        stop_hourly[sk_end][1] += p
        
        od_k = (r, start_s, end_s)
        od_pairs[od_k] = od_pairs.get(od_k, 0) + 1
        top_stops[start_s] = top_stops.get(start_s, 0) + 1
        top_stops[end_s] = top_stops.get(end_s, 0) + 1

print(f"\nDone aggregation over {total_processed} rows.")
print(f"Total routes found: {len(set(k[0] for k in route_hourly.keys()))}")
print(f"Total stops found: {len(top_stops)}")

# Prepare dataset for ML model
ml_rows = []
for (r, h, w, ac), (cnt, p_sum, amt_sum) in route_hourly.items():
    # In October: 22 weekdays, 9 weekend days
    num_days = 9 if w == 1 else 22
    avg_hourly_passengers = p_sum / num_days
    
    # Peak hours: morning 8-11am, evening 5-9pm
    is_peak = 1 if (8 <= h <= 11) or (17 <= h <= 21) else 0
    estimated_trips_per_hour = 4 if is_peak else 2
    
    # Estimate load per bus
    avg_onboard_load = avg_hourly_passengers / max(1, estimated_trips_per_hour)
    crowd_ratio = min(1.0, avg_onboard_load / BUS_TOTAL_CAPACITY)
    
    # Classify into 3 easy levels for commuters
    if avg_onboard_load < 22:
        crowd_category = "Seats Available"
        crowd_level_code = "LOW"
    elif avg_onboard_load < 44:
        crowd_category = "Standing Room"
        crowd_level_code = "MODERATE"
    else:
        crowd_category = "Crowded"
        crowd_level_code = "HIGH"

    ml_rows.append({
        'route': r,
        'hour': h,
        'is_weekend': w,
        'is_ac': ac,
        'is_peak': is_peak,
        'total_tickets': cnt,
        'total_passengers': round(p_sum, 1),
        'avg_hourly_passengers': round(avg_hourly_passengers, 1),
        'avg_onboard_load': round(avg_onboard_load, 1),
        'crowd_ratio': round(crowd_ratio, 3),
        'crowd_category': crowd_category,
        'crowd_level_code': crowd_level_code
    })

ml_df = pd.DataFrame(ml_rows)
print(f"Created ML table with {len(ml_df)} hourly route rows.")

# Train a Random Forest model
print("\nTraining RandomForestRegressor...")
ml_df['route_hash'] = ml_df['route'].apply(lambda x: abs(hash(x)) % 1000)

features = ['route_hash', 'hour', 'is_weekend', 'is_ac', 'is_peak']
target = 'crowd_ratio'

X = ml_df[features]
y = ml_df[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestRegressor(
    n_estimators=100,
    max_depth=12,
    min_samples_split=5,
    random_state=42,
    n_jobs=-1
)
rf_model.fit(X_train, y_train)

# Check model accuracy
y_pred = rf_model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
rmse = math.sqrt(mean_squared_error(y_test, y_pred))

print(f"Model trained successfully!")
print(f"Mean Absolute Error (MAE): {mae:.4f}")
print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")

# Save the trained model file
model_file = os.path.join(ML_DIR, "crowd_model.joblib")
metrics_file = os.path.join(ML_DIR, "model_metrics.json")
joblib.dump(rf_model, model_file)

metrics = {
    "model_name": "RandomForestRegressor",
    "trained_at": datetime.now().isoformat(),
    "n_estimators": 100,
    "max_depth": 12,
    "training_samples": len(X_train),
    "test_samples": len(X_test),
    "mae": round(mae, 4),
    "rmse": round(rmse, 4),
    "status": "TRAINED",
    "data_source": "Delhi Transport Stack (October 2026 ETM/e-Ticketing)"
}

with open(metrics_file, 'w') as f:
    json.dump(metrics, f, indent=2)

print(f"Saved model to: {model_file}")

# Save route summaries as JSON so backend can read them fast
summary_export = os.path.join(DATASETS_DIR, "route_crowd_summary.json")
route_summary_dict = {}
for r in ml_df['route'].unique():
    r_sub = ml_df[ml_df['route'] == r]
    route_summary_dict[r] = {
        'avg_load': round(float(r_sub['avg_onboard_load'].mean()), 1),
        'peak_load': round(float(r_sub['avg_onboard_load'].max()), 1),
        'total_monthly_tickets': int(r_sub['total_tickets'].sum()),
        'hourly': {
            int(h): {
                'crowd_ratio': round(float(sub_h['crowd_ratio'].mean()), 2),
                'crowd_category': sub_h['crowd_category'].iloc[0],
                'avg_load': round(float(sub_h['avg_onboard_load'].mean()), 1)
            }
            for h, sub_h in r_sub.groupby('hour')
        }
    }

with open(summary_export, 'w') as f:
    json.dump(route_summary_dict, f)

# Top stops footfall summary
stop_footfall_export = os.path.join(DATASETS_DIR, "stop_footfall_summary.json")
stop_summary_dict = {}
for (s, h, w), (b, a) in stop_hourly.items():
    if s not in stop_summary_dict:
        stop_summary_dict[s] = {'hourly': {}, 'total_boardings': 0, 'total_alightings': 0}
    stop_summary_dict[s]['total_boardings'] += int(b)
    stop_summary_dict[s]['total_alightings'] += int(a)
    h_key = f"{h}_{'weekend' if w == 1 else 'weekday'}"
    stop_summary_dict[s]['hourly'][h_key] = {
        'boardings': round(b, 1),
        'alightings': round(a, 1),
        'net_flow': round(b - a, 1)
    }

# Filter top 500 stops
sorted_stops = sorted(top_stops.items(), key=lambda x: x[1], reverse=True)[:500]
top_500_names = set(k[0] for k in sorted_stops)
filtered_stop_summary = {k: v for k, v in stop_summary_dict.items() if k in top_500_names}

with open(stop_footfall_export, 'w') as f:
    json.dump(filtered_stop_summary, f)

print("All data processed and exported successfully!")
