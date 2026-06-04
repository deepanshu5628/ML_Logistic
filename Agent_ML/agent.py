from google import genai
from google.genai import types
import os
import random
import json
from dotenv import load_dotenv
from partners import partners
from search_tool import search_partner_info

load_dotenv()

# create Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def select_top_partners(parcel_info):

    partner_data = {}

    for p in partners:
        info = search_partner_info(p)
        partner_data[p] = info

    prompt = f"""
You are a logistics expert.

Parcel Info:
{parcel_info}

Delivery Partner Data:
{partner_data}

Select the BEST 3 delivery partners based on:
- speed
- reliability
- coverage
- cost

Return JSON only.

Example:
{{
 "top_partners": ["Delhivery","DHL","XpressBees"]
}}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
        response_mime_type="application/json", # Forces JSON output
    )
    )
 
    text = response.text
    try:
        # raise ValueError("Testing the fallback flow!")
        result = json.loads(text)
        return {
            "success": True,
            "message": "fetched the partners",
            "byllm":True,
            "bylangchain":False,
            "data": result
        }
    except:
        result = random.sample(partners, k=3)
        return {
            "success": True,
            "message": "Random partners",
            "byllm":False,
            "bylangchain":False,
            "data": {
                "top_partners": result
            }
        }
