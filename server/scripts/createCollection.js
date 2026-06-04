import { qdrant } from "../utils/vectorDB.js";

await qdrant.createCollection("parcel_intents", {
  vectors: {
    size: 768,
    distance: "Cosine"
  }
});

console.log("Collection created");