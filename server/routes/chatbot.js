// // backend/routes/chatbot.js
// import express from "express";
// import ollama from "ollama";
// import Parcel from "../models/Parcel.js";
// import { authMiddleware } from "../middleware/auth.js";
// import {
//   getParcelByStatus,
//   getParcelByName,
//   getAllParcels,
//   getMyParcels,
//   getParcelById,
//   updateParcel,
//   createParcel
// } from "../controllers/parcelController.js";

// const router = express.Router();
// const memoryStore = {};

// // 🔥 Warmup Ollama model
// (async () => {
//   try {
//     console.log("🔥 Warming up Ollama model...");
//     await ollama.chat({
//       model: "interstellarninja/llama3.1-8b-tools",
//       messages: [{ role: "system", content: "warmup" }],
//     });
//     console.log("✅ Ollama model ready");
//   } catch (err) {
//     console.error("Warmup failed:", err.message);
//   }
// })();

// // Function registry with descriptions for LLM
// const FUNCTION_REGISTRY = {
//   getMyParcels: {
//     description: "Get all parcels belonging to the logged-in user. Use when user asks about 'my parcels', 'my orders', 'show my packages', etc.",
//     function: async (req) => {
//       const parcels = await Parcel.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
//       return { status: 'success', data: parcels };
//     }
//   },
//   getParcelById: {
//     description: "Get detailed information about a specific parcel by its ID (format: P-XXXXXXXXXX). Use when user provides a parcel ID.",
//     function: async (req, parcelId) => {
//       const parcel = await Parcel.findOne({ createdBy: req.user._id, parcelId })
//         .populate('history.updatedBy', 'name email');
//       if (!parcel) return { status: 'fail', message: 'Parcel not found' };
//       return { status: 'success', data: parcel };
//     }
//   },
//   getParcelByName: {
//     description: "Search parcels by product name. Use when user asks about a specific product or item name.",
//     function: async (req, query) => {
//       const regex = new RegExp(`\\b${query}`, 'i');
//       const parcels = await Parcel.find({
//         createdBy: req.user._id,
//         product: { $regex: regex },
//       })
//         .select('parcelId product currentStatus destinationAddress createdAt')
//         .sort({ createdAt: -1 });
//       return { status: 'success', count: parcels.length, data: parcels };
//     }
//   },
//   getParcelByStatus: {
//     description: "Get parcels filtered by status (PLACED, IN_TRANSIT, DISPATCHED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED). Use when user asks about parcels with specific status.",
//     function: async (req, status) => {
//       const parcels = await Parcel.aggregate([
//         {
//           $match: { createdBy: req.user._id }
//         },
//         {
//           $addFields: {
//             latestHistory: { $arrayElemAt: ["$history", -1] }
//           }
//         },
//         {
//           $match: {
//             "latestHistory.status": status.toUpperCase()
//           }
//         }
//       ]);
//       return { status: 'success', count: parcels.length, data: parcels };
//     }
//   }
// };

// // LLM-based intent classification
// async function classifyIntent(userMessage, userId) {
//   const functionsList = Object.keys(FUNCTION_REGISTRY).map(key => ({
//     name: key,
//     description: FUNCTION_REGISTRY[key].description
//   })).map(f => `- ${f.name}: ${f.description}`).join('\n');

//   const classificationPrompt = `You are a parcel tracking assistant. Analyze the user's message and determine which function to call.

// Available functions:
// ${functionsList}

// User message: "${userMessage}"

// Respond with ONLY the function name (e.g., "getMyParcels", "getParcelById", etc.) or "general" if none match.
// If a parcel ID is mentioned (format P-XXXXXXXXXX), use "getParcelById".
// If a product name is mentioned, use "getParcelByName".
// If a status is mentioned (delivered, in transit, etc.), use "getParcelByStatus".
// If asking about "my parcels" or "my orders", use "getMyParcels".`;

//   try {
//     const response = await ollama.chat({
//       model: "interstellarninja/llama3.1-8b-tools",
//       messages: [{ role: "user", content: classificationPrompt }],
//       stream: false,
//     });

//     const intent = response.message?.content?.trim().toLowerCase() || "general";
    
//     // Extract function name
//     for (const funcName of Object.keys(FUNCTION_REGISTRY)) {
//       if (intent.includes(funcName.toLowerCase())) {
//         return { functionName: funcName, extractedData: extractParameters(userMessage, funcName) };
//       }
//     }

//     // Extract parcel ID if present
//     const parcelIdMatch = userMessage.match(/P-[A-Z0-9]+/i);
//     if (parcelIdMatch) {
//       return { functionName: "getParcelById", extractedData: { parcelId: parcelIdMatch[0].toUpperCase() } };
//     }

//     return { functionName: "general", extractedData: {} };
//   } catch (err) {
//     console.error("Intent classification error:", err);
//     return { functionName: "general", extractedData: {} };
//   }
// }

// // Extract parameters from user message
// function extractParameters(userMessage, functionName) {
//   const params = {};

//   if (functionName === "getParcelById") {
//     const match = userMessage.match(/P-[A-Z0-9]+/i);
//     if (match) params.parcelId = match[0].toUpperCase();
//   } else if (functionName === "getParcelByName") {
//     // Extract product name (simple heuristic - could be improved)
//     const words = userMessage.split(/\s+/);
//     const productKeywords = words.filter(w => 
//       !['my', 'parcel', 'parcels', 'package', 'packages', 'order', 'orders', 'show', 'get', 'find', 'search'].includes(w.toLowerCase())
//     );
//     if (productKeywords.length > 0) {
//       params.query = productKeywords.join(' ');
//     }
//   } else if (functionName === "getParcelByStatus") {
//     const statusMap = {
//       'placed': 'PLACED',
//       'in transit': 'IN_TRANSIT',
//       'transit': 'IN_TRANSIT',
//       'dispatched': 'DISPATCHED',
//       'out for delivery': 'OUT_FOR_DELIVERY',
//       'delivered': 'DELIVERED',
//       'cancelled': 'CANCELLED',
//       'canceled': 'CANCELLED'
//     };
//     for (const [key, value] of Object.entries(statusMap)) {
//       if (userMessage.toLowerCase().includes(key)) {
//         params.status = value;
//         break;
//       }
//     }
//   }

//   return params;
// }

// // Format function response into natural language using LLM
// async function formatResponse(functionName, functionResult, userMessage) {
//   const formattingPrompt = `You are a helpful parcel tracking assistant. Convert the following data into a friendly, natural paragraph response.

// Function used: ${functionName}
// User's original question: "${userMessage}"

// Data from function:
// ${JSON.stringify(functionResult, null, 2)}

// Respond in a conversational, human-like paragraph. Be friendly and informative. If there are multiple parcels, summarize them nicely. If it's a single parcel, provide details in a natural way.`;

//   try {
//     const response = await ollama.chat({
//       model: "interstellarninja/llama3.1-8b-tools",
//       messages: [{ role: "user", content: formattingPrompt }],
//       stream: false,
//     });

//     return response.message?.content || "I found some information, but couldn't format it properly.";
//   } catch (err) {
//     console.error("Response formatting error:", err);
//     // Fallback formatting
//     return formatFallback(functionResult);
//   }
// }

// // Fallback formatter if LLM fails
// function formatFallback(result) {
//   if (result.status === 'fail') {
//     return result.message || "Sorry, I couldn't find that information.";
//   }

//   if (result.data && Array.isArray(result.data)) {
//     if (result.data.length === 0) {
//       return "You don't have any parcels matching that criteria.";
//     }
//     return `I found ${result.data.length} parcel(s). ${result.data.map(p => 
//       `${p.parcelId || p.parcelId} (${p.product || 'N/A'}) - ${p.currentStatus || 'Unknown status'}`
//     ).join('. ')}.`;
//   }

//   if (result.data && !Array.isArray(result.data)) {
//     const p = result.data;
//     return `Your parcel ${p.parcelId} (${p.product}) is currently ${p.currentStatus}. Destination: ${p.destinationAddress || 'N/A'}.`;
//   }

//   return "I found some information, but couldn't format it properly.";
// }

// router.post("/", authMiddleware, async (req, res) => {
//   try {
//     const userMessage = req.body.message?.trim();
//     const sessionId = req.headers["x-chat-session"] || "guest-session";
//     const userId = req.user._id;

//     if (!userMessage) return res.json({ reply: "Message is required." });

//     // Maintain conversation context
//     if (!memoryStore[sessionId]) memoryStore[sessionId] = [];
//     memoryStore[sessionId].push({ role: "user", content: userMessage });
//     if (memoryStore[sessionId].length > 10) memoryStore[sessionId].shift();

//     // Step 1: Classify intent and select function
//     const { functionName, extractedData } = await classifyIntent(userMessage, userId);

//     let functionResult = null;

//     // Step 2: Execute the selected function
//     if (functionName !== "general" && FUNCTION_REGISTRY[functionName]) {
//       try {
//         const func = FUNCTION_REGISTRY[functionName].function;
        
//         // Prepare request-like object for functions
//         const mockReq = {
//           user: { _id: userId },
//           query: extractedData.query || {},
//           params: extractedData.parcelId ? { parcelId: extractedData.parcelId } : {},
//           body: extractedData
//         };

//         if (functionName === "getParcelById") {
//           functionResult = await func(mockReq, extractedData.parcelId);
//         } else if (functionName === "getParcelByName") {
//           functionResult = await func(mockReq, extractedData.query);
//         } else if (functionName === "getParcelByStatus") {
//           functionResult = await func(mockReq, extractedData.status);
//         } else {
//           functionResult = await func(mockReq);
//         }
//       } catch (funcErr) {
//         console.error("Function execution error:", funcErr);
//         functionResult = { status: 'error', message: 'Failed to retrieve parcel information.' };
//       }
//     } else {
//       // General conversation - use LLM directly
//       const systemPrompt = {
//         role: "system",
//         content: `You are PARCEL-AI, a helpful assistant for parcel tracking. 
//         You can help users with:
//         - Finding their parcels
//         - Tracking parcel status
//         - Searching parcels by product name
//         - Getting parcel details by ID
        
//         Be friendly and guide users on how to ask about their parcels.`,
//       };

//       const response = await ollama.chat({
//         model: "interstellarninja/llama3.1-8b-tools",
//         messages: [systemPrompt, ...memoryStore[sessionId].slice(-3)],
//         stream: false,
//       });

//       return res.json({ reply: response.message?.content || "I'm here to help with your parcels!" });
//     }

//     // Step 3: Format the function result into natural language
//     const formattedReply = await formatResponse(functionName, functionResult, userMessage);

//     // Update conversation memory
//     memoryStore[sessionId].push({ role: "assistant", content: formattedReply });

//     // Return response (also include raw data for frontend if needed)
//     res.json({
//       reply: formattedReply,
//       functionUsed: functionName,
//       rawData: functionResult.data // Frontend can use this for rich UI if needed
//     });

//   } catch (err) {
//     console.error("🔥 Chatbot Error:", err);
//     res.json({ reply: "I encountered an error. Please try again." });
//   }
// });

// export default router;