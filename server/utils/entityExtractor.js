// Extracts product names, parcel IDs, and status keywords from user messages

const STOP_WORDS = new Set([
  "parcel", "product", "item", "details", "detail", "info", "information",
  "of", "the", "give", "me", "show", "full", "please", "let", "know",
  "name", "is", "and", "provide", "get", "want", "need", "tell", "about",
  "for", "my", "all", "can", "you", "what", "where", "how", "track",
  "tracking", "status", "update", "latest", "recent", "last", "new",
  "find", "search", "check", "see", "look", "up", "at", "in", "on",
  "to", "from", "with", "this", "that", "it", "its", "a", "an",
  "order", "delivery", "deliver", "shipped", "shipping", "send",
  "hi", "hello", "hey", "thanks", "thank", "okay", "ok", "yes", "no",
  "how", "are", "doing", "going", "good", "fine", "great", "morning", "evening", "afternoon",
  "complete", "complete", "everything", "invoice", "download", "generate",
  "delayed", "late", "pending", "cancelled", "delivered", "placed",
  "dispatched", "transit", "parcels", "list", "display", "category", "type", "filter",
  "furniture", "medical", "pharma", "automotive", "cosmetics", "beauty",
  "sports", "fitness", "books", "stationery", "fragile", "glassware",
  "industrial", "machinery", "perishable", "perishables"
]);

const ACTION_PHRASES = [
  "show me", "tell me", "give me", "find me", "get me", "i want",
  "i need", "can you", "please show", "please tell", "please find",
  "what is", "where is", "how is", "track my", "show my", "check my",
  "details of", "status of", "info of", "information of", "about my",
  "full details", "complete details", "all details"
];

export const extractEntities = (message) => {
  if (!message) return null;

  // Parcel ID detection
  const parcelIdMatch = message.match(/P-[A-Z0-9]+/i);
  if (parcelIdMatch) {
    return { type: "parcelId", value: parcelIdMatch[0].toUpperCase() };
  }

  // Strip action phrases to isolate the product name
  let cleaned = message.toLowerCase().trim();
  for (const phrase of ACTION_PHRASES) {
    cleaned = cleaned.replace(new RegExp(phrase, "gi"), " ");
  }

  // Remove punctuation
  cleaned = cleaned.replace(/[?!.,;:'"]/g, " ");

  // Split and filter stop words
  const words = cleaned.split(/\s+/).filter(w => w && !STOP_WORDS.has(w));

  if (words.length === 0) return null;

  // Join remaining words as the product name (handles multi-word like "LCD TV", "Moto 60 fusion")
  const productName = words.join(" ").trim();

  if (!productName || productName.length < 2) return null;

  return { type: "parcelName", value: productName };
};
