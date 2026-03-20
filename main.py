from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import pickle

app = FastAPI()
# Setting allow_origins to ["*"] allows requests from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)
with open("delivery_price_model.pkl", "rb") as f:
    model = pickle.load(f)



class DeliveryRequest(BaseModel): 
    distance_km: float
    package_weight_kg: float
    vehicle_type: str
    delivery_mode: str
    delivery_partner: str


@app.post("/predict")
def predict(data: DeliveryRequest):

    input_df = pd.DataFrame([data.dict()])

    prediction = model.predict(input_df)[0]

    return {
        "predicted_delivery_cost": round(float(prediction),2)
    }