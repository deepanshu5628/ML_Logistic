# Server — Node.js Backend

Express + MongoDB REST API with JWT auth, parcel management, PDF invoice generation, and a LangChain-powered RAG chatbot.

---

## Folder Structure

```
server/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── parcelController.js    # All parcel logic (CRUD, search, invoice)
│   └── chatbotController.ts   # Chatbot controller
├── middleware/
│   └── auth.js                # JWT auth + admin guard
├── models/
│   ├── User.js                # User schema (name, email, password, isAdmin)
│   └── Parcel.js              # Parcel schema with full status history
├── routes/
│   ├── auth.js                # /api/auth → signup, signin
│   ├── parcel.js              # /api/parcel → all parcel routes
│   ├── deepanshuchatbot.js    # /api/chatbot → RAG chatbot
│   └── langchainChatbot.js   # /api/langchain_chatbot → LangChain chatbot
├── scripts/
│   └── seedIntents.js         # Seeds chatbot intents into Qdrant on startup
├── utils/
│   ├── embeddings.js          # Ollama embedding helper
│   ├── vectorDB.js            # Qdrant client
│   ├── ragRouter.js           # Intent detection via vector similarity
│   ├── entityExtractor.js     # Extracts parcel IDs, dates from user messages
│   ├── llmfunctinos.js        # Groq LLM calls
│   └── generateParcelId.js    # Unique parcel ID generator (P-IDX...)
├── invoices/                  # Generated PDF invoices (auto-created)
├── index.js                   # App entry point
└── .env.example
```

---

## API Routes

### Auth — `/api/auth`

| Method | Endpoint   | Description       |
|--------|------------|-------------------|
| POST   | `/signup`  | Register new user |
| POST   | `/signin`  | Login, get JWT    |

### Parcel — `/api/parcel`

| Method | Endpoint                              | Auth     | Description                        |
|--------|---------------------------------------|----------|------------------------------------|
| POST   | `/createParcel`                       | User     | Create a new parcel                |
| GET    | `/myParcels`                          | User     | Get all parcels of logged-in user  |
| GET    | `/track/:parcelId`                    | User     | Get parcel by ID with history      |
| GET    | `/invoice/:parcelId`                  | —        | Download PDF invoice               |
| GET    | `/search?query=`                      | User     | Search by product name             |
| GET    | `/parsel_status?query=`               | User     | Filter by status                   |
| GET    | `/category?query=`                    | User     | Filter by category                 |
| GET    | `/getByServiceType`                   | User     | Filter by standard/express         |
| GET    | `/allParcels`                         | Admin    | Get all parcels in the system      |
| PATCH  | `/updateParcelStatus/:parcelId/status`| Admin    | Update parcel status               |
| GET    | `/get-distance?origin=&destination=`  | —        | Google Maps distance calculation   |

### Chatbot — `/api/langchain_chatbot`

| Method | Endpoint | Description                          |
|--------|----------|--------------------------------------|
| POST   | `/`      | LangChain RAG chatbot for parcel Q&A |

---

## Parcel Status Flow

```
PLACED → IN_TRANSIT → DISPATCHED → OUT_FOR_DELIVERY → DELIVERED
                                                     ↘ CANCELLED (any stage except DELIVERED)
```

Status updates are sequential — skipping steps is not allowed.

---

## Setup

```bash
cd server
cp .env.example .env
npm install
npm start        # nodemon index.js
```

**Required `.env` values:**

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GROQ_API_KEY=your_groq_api_key
BASE_URL=http://localhost:5000
EMBEDDING_API_URL=http://localhost:11434/api/embeddings
EMBEDDING_MODEL=nomic-embed-text
QDRANT_URL=http://localhost:6333
```

> Ollama must be running locally for embeddings. Qdrant must be running for the chatbot RAG intent detection.
