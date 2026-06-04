import { qdrant } from "./vectorDB.js";
import { createEmbedding } from "./embeddings.js";

export const detectIntent = async (message) => {
  try {
    const embedding = await createEmbedding(message);

    const searchResults = await qdrant.search("parcel_intents", {
      vector: embedding,
      limit: 5
    });

    if (!searchResults || searchResults.length === 0) {
      return { tool: "NO_CALL" };
    }

    const best = searchResults[0];

    // Lowered threshold — embeddings are good enough at 0.45+
    if (best.score < 0.45) {
      return { tool: "NO_CALL" };
    }

    const payload = best.payload || {};
    if (!payload.tool) return { tool: "NO_CALL" };

    // Consensus: if top 3 results agree on the same tool, boost confidence
    const topTools = searchResults.slice(0, 3).map(r => r.payload?.tool).filter(Boolean);
    const toolCounts = {};
    topTools.forEach(t => { toolCounts[t] = (toolCounts[t] || 0) + 1; });

    // If majority of top 3 agree, use that tool even if best score is borderline
    const consensusTool = Object.entries(toolCounts).sort((a, b) => b[1] - a[1])[0];
    if (consensusTool && consensusTool[1] >= 2) {
      // Find the payload from the best match of the consensus tool
      const consensusResult = searchResults.find(r => r.payload?.tool === consensusTool[0]);
      return consensusResult?.payload || payload;
    }

    return payload;
  } catch (error) {
    console.error("Error in detectIntent:", error.message);
    return { tool: "NO_CALL" };
  }
};
