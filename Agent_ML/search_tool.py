from tavily import TavilyClient
import os
from dotenv import load_dotenv

load_dotenv()

client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


def search_partner_info(partner):

    query = f"{partner} courier delivery speed reliability India coverage"

    results = client.search(query=query, max_results=3)

    text = ""

    for r in results["results"]:
        text += r["content"] + "\n"

    return text