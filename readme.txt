pip install fastapi uvicorn pandas scikit-learn
uvicorn app:app --reload
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
{
 "distance_km": 10,
 "vehicle_type": "bike",
 "delivery_mode": "express",
 "delivery_partner": "Delhivery"
}


//vehicle types =['bike', 'ev van', 'truck', 'van', 'ev bike', 'scooter']
// devivery_mode=['same day', 'express', 'two day', 'standard']
// delivery_partner=['delhivery', 'xpressbees', 'shadowfax', 'dhl', 'amazon logistics',
       'blue dart', 'fedex', 'ecom express', 'ekart']