from fastapi import FastAPI
from pydantic import BaseModel,Field
from fastapi.middleware.cors import CORSMiddleware
from agent import select_top_partners
from typing import Literal
from langchain_app import select_top_partners_langchain
import pandas as pd
import pickle
from fastapi import Request
from fastapi.responses import JSONResponse
import random
from  partners import partners

app = FastAPI(title="Delivery Partner Selector API")

# Setting allow_origins to ["*"] allows requests from any domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # print("GLOBAL ERROR:", str(exc))

    return JSONResponse(
        status_code=200,  # avoid frontend crash
        content={
            "success": False,
            "message": "Something went wrong",
            "error": str(exc)
        }
    )

# Request schema
class Parcel(BaseModel):
    weight: float=Field(...,min=0.05 ,max=1000)
    pickup_city: str
    delivery_city: str
    delivery_speed: Literal["standard","express"]
    total_km:float=Field(...,min=0,max=1000)


# Health check
@app.get("/")
def home():
    return {"message": "Delivery Partner AI Agent Running"}


##################################################################################
# Main endpoint
@app.post("/select-partners")
def select_partners(parcel: Parcel):
    # convert request object to dictionary
    parcel_info = parcel.dict()
    # call AI agent
    result = select_top_partners(parcel_info)
    # print("the result in main.py is ",result)
    return result


##################################################################################
#                       LangChain Route
##################################################################################
@app.post("/select-partner-langchain")
async def select_partner(parcel:Parcel):
    try:
        parcel_info=parcel.dict()
        result=await select_top_partners_langchain(parcel_info)
        return result
    except Exception as e:
        result = random .sample(partners, k=3)
        return {
                "success": True,
                "message": "Random partners",
                "byllm":False,
                "bylangchain":False,
                "error":str(e),
                "data": {
                    "top_partners": result
                }
        }
    

##################################################################################
#                       Machine Learning Route
##################################################################################
class DeliveryRequest(BaseModel): 
    distance_km: float
    package_weight_kg: float
    vehicle_type: str
    delivery_mode: str
    delivery_partner: str

with open("delivery_price_model.pkl", "rb") as f:
    model = pickle.load(f)


@app.post("/predict")
def predict(data: DeliveryRequest):

    input_df = pd.DataFrame([data.dict()])

    prediction = model.predict(input_df)[0]
    
    variation = random.uniform(-0.03, 0.03)
    adjusted_prediction = max(0, prediction * (1 + variation))

    return {
        "predicted_delivery_cost": round(float(adjusted_prediction),2)
    }



