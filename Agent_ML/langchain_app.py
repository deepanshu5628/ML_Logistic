# import the required liberaries
import os
import asyncio
import json
from tavily import TavilyClient
from dotenv import load_dotenv
from langchain.messages import SystemMessage,AIMessage,HumanMessage
from langchain.tools import tool
from langchain_groq import ChatGroq
from langchain.agents import create_agent
from langchain.chat_models import init_chat_model
from pydantic import BaseModel
from typing import List,Dict
from partners import partners
import random
from langchain.chat_models import init_chat_model

load_dotenv()
client=TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
os.environ["GROQ_API_KEY"]=os.getenv("GROQ_API_KEY")
os.environ["GOOGLE_API_KEY"]=os.getenv("GEMINI_API_KEY")



# define all the tools 
@tool
def getAllDeliveryPartners()-> List[str]:
    """
    Returns a list of available delivery partners for parcel shipping.

    These partners can be evaluated based on cost, speed, reliability,
    and service coverage to select the best options. 
    """
    return ["DHL","Delhivery","BlueDart","Ecom Express","XpressBees","FedEx","Shadowfax",'amazon logistics','ekart']

@tool
async def getinfo(allPartners:List[str])->List[Dict]:
    """
     Fetch detailed information about a list of delivery partners using web search.

    Args:
        allPartners: List of delivery partner names (strings)

    Returns:
        List of dictionaries containing structured partner information
    """
    partners_info=[]
    for p in allPartners:
        try:
            info= tavily_Websearch_Agent(p)
            partners_info.append({
                "partner":p,
                "information":info,
            })
        except Exception as e:
            partners_info.append({
                "partner":p,
                "information":e,
            })
    return partners_info


def tavily_Websearch_Agent(partnerName:str)->str:
    query=f"{partnerName} courier delivery speed reliability India coverage"
    results= client.search(query=query,max_results=3)
    text = ""

    for r in results["results"]:
        text += r["content"] + "\n"
    return text

system_prompt_2=""" 
You are an intelligent logistics decision-making agent.

Your job is to select the BEST 3 delivery partners for a given parcel information.
Select exactly 3 partners

Rules:
- Only choose from the available partner list
- Do not hallucinate new partners
- use can use tools 
- Be logical and concise

Return your response strictly in the required structured format.
"""

# initilize the model & define the agent
model=ChatGroq(model="qwen/qwen3-32b")
model_google=init_chat_model(model="google_genai:gemini-2.5-flash")
# model.with_structured_output(OutputSchema)

class OutputSchema(BaseModel):
    top_partners:List[str]

agent=create_agent(
    model=model,
    # model=model_google,
    tools=[getAllDeliveryPartners,getinfo],
    system_prompt=system_prompt_2,
    response_format= OutputSchema
)
# agent

async def select_top_partners_langchain(parcel_info):
    try:
        parcel_info_str=json.dumps(parcel_info)
        res=await agent.ainvoke({"messages":[HumanMessage(content=parcel_info_str)]})
        # print("llm responce is ",res["structured_response"])
        structured_obj = res.get("structured_response")
        structured_data =structured_obj.model_dump()
        # print("strucured out is ",structured_data)
        if not structured_data or "top_partners" not in structured_data:
            raise ValueError("Invalid LLM response format")
        return {
            "success": True,
            "message": "fetched the partners",
            "byllm":True,
            "bylangchain":True,
            "data": structured_data
        }
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