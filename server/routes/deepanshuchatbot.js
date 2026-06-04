import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { detectIntent } from "../utils/ragRouter.js";
import { extractEntities } from "../utils/entityExtractor.js";
import Groq from "groq-sdk";

import {
  getMyParcels, getParcelByName, getParcelById,
  getParcelByStatus, generateInvoice, delayedParcels, getLatestParcel, getParcelByCategory, getParcelByStatusAndDate
} from "../utils/llmfunctinos.js";

const router = express.Router();

// In-memory conversation store (per session)
const conversations = new Map();
const MAX_HISTORY = 10;

const getHistory = (sessionId) => conversations.get(sessionId) || [];
const addToHistory = (sessionId, role, content) => {
  if (!conversations.has(sessionId)) conversations.set(sessionId, []);
  const history = conversations.get(sessionId);
  history.push({ role, content });
  if (history.length > MAX_HISTORY * 2) history.splice(0, 2);
};

// Status keywords
const STATUS_MAP = {
  "delivered": "DELIVERED", "cancelled": "CANCELLED", "canceled": "CANCELLED",
  "placed": "PLACED", "in transit": "IN_TRANSIT", "transit": "IN_TRANSIT",
  "dispatched": "DISPATCHED", "out for delivery": "OUT_FOR_DELIVERY",
  "delayed": "DELAYED", "late": "DELAYED", "overdue": "DELAYED"
};

// Category keywords
const CATEGORY_MAP = {
  "electronics": "electronics", "electronic": "electronics",
  "clothing": "clothing", "clothes": "clothing", "apparel": "clothing",
  "documents": "documents", "document": "documents", "docs": "documents",
  "food": "food", "foods": "food", "perishable": "food", "perishables": "food",
  "furniture": "furniture",
  "medical": "medical", "pharma": "medical", "medicine": "medical", "medicines": "medical",
  "automotive": "automotive", "auto parts": "automotive", "car parts": "automotive",
  "cosmetics": "cosmetics", "beauty": "cosmetics", "makeup": "cosmetics",
  "sports": "sports", "fitness": "sports",
  "books": "books", "stationery": "books",
  "fragile": "fragile", "glassware": "fragile", "glass": "fragile",
  "industrial": "industrial", "machinery": "industrial"
};

// Date extraction from natural language
const MONTH_MAP = {
  "jan": 0, "january": 0, "feb": 1, "february": 1, "mar": 2, "march": 2,
  "apr": 3, "april": 3, "may": 4, "jun": 5, "june": 5,
  "jul": 6, "july": 6, "aug": 7, "august": 7, "sep": 8, "september": 8,
  "oct": 9, "october": 9, "nov": 10, "november": 10, "dec": 11, "december": 11
};

const extractDateRange = (message) => {
  const msg = message.toLowerCase();

  // Pattern: "between 1 april 2026 to 4 april 2026" or "from 1 april to 4 april 2026"
  const rangeRegex = /(?:between|from)\s+(\d{1,2})\s*(\w+)\s*(\d{4})?\s*(?:to|and|-|till|until)\s*(\d{1,2})\s*(\w+)\s*(\d{4})?/i;
  const match = msg.match(rangeRegex);
  if (match) {
    const startDay = parseInt(match[1]);
    const startMonth = MONTH_MAP[match[2]];
    const startYear = match[3] ? parseInt(match[3]) : (match[6] ? parseInt(match[6]) : new Date().getFullYear());
    const endDay = parseInt(match[4]);
    const endMonth = MONTH_MAP[match[5]];
    const endYear = match[6] ? parseInt(match[6]) : startYear;

    if (startMonth !== undefined && endMonth !== undefined) {
      return {
        startDate: new Date(startYear, startMonth, startDay).toISOString(),
        endDate: new Date(endYear, endMonth, endDay).toISOString()
      };
    }
  }

  // Pattern: "1/4/2026 to 4/4/2026" or "01-04-2026 to 04-04-2026"
  const numericRegex = /(?:between|from)?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\s*(?:to|and|-|till|until)\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i;
  const numMatch = msg.match(numericRegex);
  if (numMatch) {
    return {
      startDate: new Date(parseInt(numMatch[3]), parseInt(numMatch[2]) - 1, parseInt(numMatch[1])).toISOString(),
      endDate: new Date(parseInt(numMatch[6]), parseInt(numMatch[5]) - 1, parseInt(numMatch[4])).toISOString()
    };
  }

  return null;
};

// Greeting / casual detection
const GREETINGS = /^(hi|hello|hey|howdy|good morning|good evening|good afternoon|sup|yo)(\s.*)?[\s!?.]*$/i;
const THANKS = /^(thanks|thank you|thx|ty|great|awesome|cool|okay|ok|got it|nice)[\s!?.]*$/i;
const HELP = /^(help|what can you do|how can you help|commands|options)[\s!?.]*$/i;

const GREETING_RESPONSES = [
  "Hey there! 👋 How can I help with your parcels today?",
  "Hi! 📦 Need help tracking, checking status, or anything else?",
  "Hello! I'm your parcel assistant. What would you like to know?"
];

const THANKS_RESPONSES = [
  "You're welcome! Let me know if you need anything else 😊",
  "Happy to help! Anything else about your parcels?",
  "Anytime! 📦 Just ask if you need more help."
];

const HELP_RESPONSE = `Here's what I can do for you:

📦 **Track parcels** — "Where is my iPhone parcel?" or "Track P-XXXX"
📋 **List parcels** — "Show my parcels"
🕐 **Latest parcel** — "Show my latest parcel"
📊 **Filter by status** — "Show delivered parcels"
🏷️ **Filter by category** — "Show electronics parcels" or "My food deliveries"
⏰ **Delayed parcels** — "Which parcels are late?"
🧾 **Invoice** — "Generate invoice for P-XXXX"
📝 **Full details** — "Full details of my latest parcel"

Just type naturally — I'll understand! 😊`;

// Tool handlers
const toolHandlers = {
  getParcelByStatus: ({ status }, userId) => getParcelByStatus(status, userId),
  getParcelByName: ({ query, latest }, userId) => getParcelByName(query, userId, { latest }),
  getMyParcels: (_, userId) => getMyParcels(userId),
  getParcelById: ({ parcelId }, userId) => getParcelById(parcelId, userId),
  generateInvoice: ({ query }, userId) => generateInvoice(query, userId),
  delayedParcels: (_, userId) => delayedParcels(userId),
  getLatestParcel: (args, userId) => getLatestParcel(userId, args?.mode),
  getParcelByCategory: ({ category }, userId) => getParcelByCategory(category, userId),
  getParcelByStatusAndDate: ({ status, startDate, endDate }, userId) => getParcelByStatusAndDate(status, startDate, endDate, userId)
};

const STATUS_LABELS = {
  "PLACED": "Order Placed", "IN_TRANSIT": "In Transit", "DISPATCHED": "Dispatched",
  "OUT_FOR_DELIVERY": "Out for Delivery", "DELIVERED": "Delivered", "CANCELLED": "Cancelled"
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

const formatParcelList = (data) => {
  if (data.length === 1) {
    const p = data[0];
    let lines = [`📦 **${p.product || p.parcelId}**`];
    if (p.parcelId) lines.push(`• Parcel ID: ${p.parcelId}`);
    if (p.status) lines.push(`• Status: ${STATUS_LABELS[p.status] || p.status}`);
    if (p.category) lines.push(`• Category: ${p.category}`);
    if (p.weight) lines.push(`• Weight: ${p.weight} kg`);
    if (p.cost != null) lines.push(`• Cost: Rs. ${Number(p.cost).toLocaleString("en-IN")}`);
    if (p.deliveryPartner) lines.push(`• Partner: ${p.deliveryPartner}`);
    if (p.serviceType) lines.push(`• Service: ${p.serviceType}`);
    if (p.destination) lines.push(`• Destination: ${p.destination}`);
    if (p.expectedDeliveryDate) lines.push(`• Expected Delivery: ${fmtDate(p.expectedDeliveryDate)}`);
    if (p.isDelayed) lines.push(`• ⚠️ Delayed`);
    return lines.join("\n");
  }

  let reply = `Found ${data.length} parcel(s):\n\n`;
  data.forEach((p, i) => {
    reply += `${i + 1}. **${p.product || "N/A"}** (${p.parcelId})\n`;
    reply += `   Status: ${STATUS_LABELS[p.status] || p.status || "N/A"}`;
    if (p.weight) reply += ` • ${p.weight} kg`;
    if (p.cost != null) reply += ` • Rs. ${Number(p.cost).toLocaleString("en-IN")}`;
    reply += `\n`;
    if (p.expectedDeliveryDate) reply += `   Expected: ${fmtDate(p.expectedDeliveryDate)}\n`;
    if (p.isDelayed) reply += `   ⚠️ Delayed\n`;
    reply += `\n`;
  });
  return reply.trim();
};

// LLM formatter
const SYSTEM_PROMPT = `You are a parcel data formatter. Your ONLY job is to convert the provided JSON data into a clean, readable message.

STRICT RULES:
- ONLY display parcels that exist in the provided Data array. Do NOT add, invent, or fabricate any parcels
- Do NOT use information from conversation history to add parcels. ONLY use the Data provided below
- If Data has 2 parcels, show exactly 2. If it has 5, show exactly 5. Never more, never less
- Never show raw JSON, MongoDB IDs, or internal fields
- Use emojis sparingly: 📦 🚚 📍 ✅ ⚠️ 🧾
- For single parcel: short paragraph with key details
- For multiple parcels: clean numbered list with parcel ID, product, status
- Convert status codes: PLACED→Order Placed, IN_TRANSIT→In Transit, DISPATCHED→Dispatched, OUT_FOR_DELIVERY→Out for Delivery, DELIVERED→Delivered, CANCELLED→Cancelled
- Weight is always in kg. Always show as "X kg"
- Format dates in human readable format like "9 Apr 2026" not raw ISO dates
- If parcel is delayed, mention it with ⚠️
- For invoices: confirm generation with parcel ID
- Keep it short and conversational`;

const formatWithLLM = async (userMessage, data, toolName) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const contextHint = toolName === "generateInvoice" ? "\nThis is an invoice response. Confirm the invoice was generated." :
    toolName === "delayedParcels" ? `\nThese are delayed parcels. There are exactly ${data.length} delayed parcel(s). Display all of them.` :
    toolName === "getParcelByCategory" ? `\nThese are parcels filtered by category. Show exactly ${data.length} parcel(s).` :
    toolName === "getMyParcels" ? "\nThis is a list of all user's parcels. Give a summary overview." : "";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT + contextHint },
    {
      role: "user",
      content: `User asked: "${userMessage}"\n\nTotal parcels in data: ${data.length}\n\nData (show ONLY these, nothing else):\n${JSON.stringify(data, null, 2)}`
    }
  ];

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0,
    max_tokens: 500
  });

  return response.choices[0]?.message?.content || "Here's what I found.";
};

// Main route
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const userMessage = req.body.message?.trim();
    const sessionId = req.headers["x-chat-session"] || "default";

    if (!userMessage) {
      return res.json({ reply: "Please type a message." });
    }

    console.log(`\n💬 [${sessionId}] User: ${userMessage}`);

    // Save user message to history
    addToHistory(sessionId, "user", userMessage);

    // --- Greeting / Thanks / Help ---
    if (GREETINGS.test(userMessage)) {
      const reply = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
      addToHistory(sessionId, "assistant", reply);
      return res.json({ reply });
    }
    if (THANKS.test(userMessage)) {
      const reply = THANKS_RESPONSES[Math.floor(Math.random() * THANKS_RESPONSES.length)];
      addToHistory(sessionId, "assistant", reply);
      return res.json({ reply });
    }
    if (HELP.test(userMessage)) {
      addToHistory(sessionId, "assistant", HELP_RESPONSE);
      return res.json({ reply: HELP_RESPONSE });
    }

    // --- Detect parcel ID directly ---
    const parcelIdMatch = userMessage.match(/P-[A-Z0-9]+/i);

    // --- Detect status keywords (word boundary to avoid "late" matching in "latest") ---
    const lowerMsg = userMessage.toLowerCase();
    let detectedStatus = null;
    for (const [keyword, status] of Object.entries(STATUS_MAP)) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(lowerMsg)) {
        detectedStatus = status;
        break;
      }
    }

    // --- Detect category keywords ---
    let detectedCategory = null;
    for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      if (regex.test(lowerMsg)) {
        detectedCategory = category;
        break;
      }
    }

    // --- Detect date range ---
    const dateRange = extractDateRange(userMessage);

    // --- RAG intent detection ---
    const intent = await detectIntent(userMessage);
    let toolName = intent?.tool;
    console.log("🎯 RAG intent:", intent);

    // --- Entity extraction ---
    const entity = extractEntities(userMessage);
    console.log("🔍 Entity:", entity);

    // --- Smart routing (priority-based, no conflicting overrides) ---

    // Priority 1: Explicit parcel ID (but respect invoice intent)
    if (parcelIdMatch && toolName !== "generateInvoice") {
      toolName = "getParcelById";
    }
    // Priority 1.5: Status + Date range
    else if (detectedStatus && dateRange && detectedStatus !== "DELAYED") {
      toolName = "getParcelByStatusAndDate";
    }
    // Priority 2: Latest/recent — check BEFORE status to avoid "late" in "latest" conflict
    else if (/\b(latest|last|recent|newest)\b/i.test(userMessage)) {
      if (entity?.type === "parcelName" && entity.value) {
        // "latest status of LCD TV" → search by name with latest flag
        toolName = "getParcelByName";
      } else {
        toolName = "getLatestParcel";
      }
    }
    // Priority 3: Category filter
    else if (detectedCategory && toolName !== "getParcelByName") {
      toolName = "getParcelByCategory";
    }
    // Priority 4: Status filter (but not if asking about a specific product)
    else if (detectedStatus && !entity?.value) {
      if (detectedStatus === "DELAYED") {
        toolName = "delayedParcels";
      } else {
        toolName = "getParcelByStatus";
      }
    }
    // Priority 4: RAG detected tool stays as-is

    // --- Fallback for unrecognized intent ---
    if (!toolName || toolName === "NO_CALL") {
      // If entity was extracted, try searching by name
      if (entity?.type === "parcelName" && entity.value) {
        toolName = "getParcelByName";
      } else {
        // Try a general LLM response using conversation history
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const history = getHistory(sessionId);

        const fallbackResponse = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `You are a parcel tracking assistant. You can help users track parcels, check status, list parcels, generate invoices, and check delayed deliveries. If the user's message is unclear, ask them to clarify what they need help with. Be friendly and suggest what you can do. Keep responses short.`
            },
            ...history.slice(-6),
          ],
          temperature: 0.5,
          max_tokens: 200
        });

        const reply = fallbackResponse.choices[0]?.message?.content || "I can help you track parcels, check status, or generate invoices. What would you like to do?";
        addToHistory(sessionId, "assistant", reply);
        return res.json({ reply });
      }
    }

    // --- Build args ---
    const args = {};

    if (toolName === "getLatestParcel") {
      const wantsFull = /\b(full|detail|complete|everything|all info)\b/i.test(userMessage);
      args.mode = wantsFull || intent?.mode === "FULL" ? "FULL" : null;
    }

    if (toolName === "getParcelByStatus") {
      args.status = detectedStatus || intent?.status;
    }

    if (toolName === "getParcelByName") {
      if (!entity?.value) {
        const reply = "Which parcel are you looking for? Please provide a product name or parcel ID.";
        addToHistory(sessionId, "assistant", reply);
        return res.json({ reply });
      } else {
        args.query = entity.value;
        args.latest = /\b(latest|last|recent)\b/i.test(userMessage);
      }
    }

    if (toolName === "generateInvoice") {
      const invoiceParcelId = parcelIdMatch?.[0]?.toUpperCase();
      if (!invoiceParcelId) {
        const reply = "I can generate invoices only using a Parcel ID. Please provide it like: \"Generate invoice for P-XXXX\"";
        addToHistory(sessionId, "assistant", reply);
        return res.json({ reply });
      }
      args.query = invoiceParcelId;
    }

    if (toolName === "getParcelByStatusAndDate") {
      args.status = detectedStatus;
      args.startDate = dateRange.startDate;
      args.endDate = dateRange.endDate;
    }

    if (toolName === "getParcelByCategory") {
      args.category = detectedCategory || entity?.value || userMessage;
    } else if (toolName === "getParcelById") {
      args.parcelId = parcelIdMatch?.[0]?.toUpperCase() || entity?.value;
      if (!args.parcelId) {
        const reply = "Please provide a valid parcel ID (e.g., P-XXXX).";
        addToHistory(sessionId, "assistant", reply);
        return res.json({ reply });
      }
    }

    console.log(`🔧 Tool: ${toolName}, Args:`, args);

    // --- Execute tool ---
    const handler = toolHandlers[toolName];
    if (!handler) {
      const reply = "I'm not sure how to handle that. Try asking about your parcels!";
      addToHistory(sessionId, "assistant", reply);
      return res.json({ reply });
    }

    const result = await handler(args, userId);

    let data = Array.isArray(result) ? result : result ? [result] : [];
    console.log(`📊 Data returned: ${data.length} item(s)`);
    // console.log(`📋 Data:`, JSON.stringify(data, null, 2));

    if (!data.length) {
      const reply = "I couldn't find any matching parcels. Try using a product name or parcel ID.";
      addToHistory(sessionId, "assistant", reply);
      return res.json({ reply });
    }

    // --- Format response ---
    let reply;
    if (toolName === "generateInvoice") {
      reply = `🧾 Invoice generated successfully for parcel ${data[0]?.parcelId || ""}.`;
    } else {
      reply = await formatWithLLM(userMessage, data, toolName);
    }
    console.log(`💬 Reply:`, reply);

    addToHistory(sessionId, "assistant", reply);

    // Build response
    const response = { reply };

    // Attach download URL for invoices
    if (toolName === "generateInvoice" && data[0]?.downloadUrl) {
      response.success = true;
      response.downloadUrl = data[0].downloadUrl;
    }

    console.log(`✅ Reply sent`);
    return res.json(response);

  } catch (error) {
    console.error("CHATBOT ERROR:", error);
    return res.status(500).json({ reply: "Something went wrong. Please try again." });
  }
});

export default router;
