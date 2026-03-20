import pandas as pd
import pickle

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import BaggingRegressor
from sklearn.tree import DecisionTreeRegressor

# Load data
df = pd.read_csv("Delivery_Logistics.csv")

# Drop unused columns
x = df.drop(columns=[
    "delivery_id",
    "package_type",
    "region",
    "weather_condition",
    "delivery_time_hours",
    "expected_time_hours",
    "delayed",
    "delivery_status",
    "delivery_rating",
    "delivery_cost"
])

y = df["delivery_cost"]

# Feature groups
categorical_features = [
    "delivery_partner",
    "vehicle_type",
    "delivery_mode"
]

numeric_features = [
    "distance_km",
    "package_weight_kg"
]

# Preprocessing
preprocessor = ColumnTransformer(
    transformers=[
        (
            "cat",
            OneHotEncoder(drop="first", handle_unknown="ignore"),
            categorical_features
        ),
        (
            "num",
            "passthrough",
            numeric_features
        )
    ]
)

# Model
estimator = DecisionTreeRegressor(
    max_depth=4,
    min_samples_leaf=23
)

model = BaggingRegressor(
    estimator=estimator,
    n_estimators=100,
    oob_score=True,
    random_state=42
)

# Pipeline
pipeline = Pipeline([
    ("preprocessing", preprocessor),
    ("model", model)
])

# Train
pipeline.fit(x, y)

# Save model
with open("delivery_price_model.pkl", "wb") as f:
    pickle.dump(pipeline, f)

print("✅ Model trained and saved")