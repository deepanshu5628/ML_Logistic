import axios from "axios";

export const createEmbedding = async (text) => {
  const res = await axios.post(process.env.EMBEDDING_API_URL || "http://localhost:11434/api/embeddings", {
    model: process.env.EMBEDDING_MODEL || "nomic-embed-text",
    prompt: text
  });

  return res.data.embedding;
};