# Agent_ML — Python AI/ML Service

FastAPI service with three capabilities: a Gemini-based AI agent for delivery partner selection, a LangChain + Groq agentic pipeline for the same, and a scikit-learn ML model for delivery cost prediction.

---

## Folder Structure

```
Agent_ML/
├── agent.py                    # Gemini AI agent — selects top 3 delivery partners
├── langchain_app.py            # LangChain + Groq agent with Tavily web search tools
├── main.py                     # FastAPI app — exposes all 3 endpoints
├── partners.py                 # Static list of available delivery partners
├── search_tool.py              # Tavily search helper for partner info lookup
├── delivery_price_model.pkl    # Trained scikit-learn model for price prediction
├── langchain_app.ipynb         # Notebook for LangChain agent experimentation
├── langchain_chatbot.ipynb     # Notebook for chatbot experimentation
├── requirement.txt             # Python dependencies
└── .env.example
```

---

## API Endpoints

### `GET /`
Health check — returns `{"message": "Delivery Partner AI Agent Running"}`

---

### `POST /select-partners`
Uses the Gemini AI agent to select the best 3 delivery partners.

**Request:**
```json
{
  "weight": 2.5,
  "pickup_city": "delhi",
  "delivery_city": "mumbai",
  "delivery_speed": "express",
  "total_km": 1400
}
```

**Response:**
```json
{
  "success": true,
  "byllm": true,
  "bylangchain": false,
  "data": { "top_partners": ["DHL", "Delhivery", "BlueDart"] }
}
```

---

### `POST /select-partner-langchain`
Uses a LangChain + Groq (`qwen3-32b`) agentic loop with two tools:
- `getAllDeliveryPartners` — returns the available partner list
- `getinfo` — fetches live web data about each partner via Tavily search

Same request/response shape as above, but `bylangchain: true` when successful.

---

### `POST /predict`
Predicts delivery cost using a trained ML model with ±3% random variation.

**Request:**
```json
{
  "distance_km": 1400,
  "package_weight_kg": 2.5,
  "vehicle_type": "van",
  "delivery_mode": "express",
  "delivery_partner": "Delhivery"
}
```

**Response:**
```json
{
  "predicted_delivery_cost": 842.50
}
```

---

## How the AI Agent Works

**Gemini Agent (`agent.py`)**
1. Fetches info on all partners via Tavily web search
2. Sends parcel info + partner data to Gemini 2.5 Flash
3. Forces JSON output with `response_mime_type="application/json"`
4. Falls back to 3 random partners if LLM fails

**LangChain Agent (`langchain_app.py`)**
1. Creates a ReAct-style agent with Groq LLM
2. Agent calls `getAllDeliveryPartners` tool, then `getinfo` for web data
3. Returns structured output via `OutputSchema` (Pydantic)
4. Falls back to 3 random partners on any exception

---

## Setup

```bash
cd Agent_ML
cp .env.example .env
pip install -r requirement.txt
uvicorn main:app --reload
```

Service runs at `http://127.0.0.1:8000`

**Required `.env` values:**

```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

---

## Available Delivery Partners

DHL, Delhivery, BlueDart, Ecom Express, XpressBees, FedEx, Shadowfax, Amazon Logistics, Ekart
