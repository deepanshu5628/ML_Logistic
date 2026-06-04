import { qdrant } from "../utils/vectorDB.js";
import { createEmbedding } from "../utils/embeddings.js";
import { v4 as uuid } from "uuid";

const intents = [
  // ----------------------------
  // LATEST / RECENT PARCEL
  // ----------------------------
  { text: "show my latest parcel", tool: "getLatestParcel" },
  { text: "show recent parcel", tool: "getLatestParcel" },
  { text: "my last parcel", tool: "getLatestParcel" },
  { text: "last delivery", tool: "getLatestParcel" },
  { text: "most recent parcel", tool: "getLatestParcel" },
  { text: "latest order", tool: "getLatestParcel" },
  { text: "recent delivery status", tool: "getLatestParcel" },
  { text: "what was my last order", tool: "getLatestParcel" },
  { text: "newest parcel", tool: "getLatestParcel" },
  { text: "my recent order", tool: "getLatestParcel" },

  // LATEST FULL DETAILS
  { text: "latest parcel details", tool: "getLatestParcel", mode: "FULL" },
  { text: "details of latest parcel", tool: "getLatestParcel", mode: "FULL" },
  { text: "full details of recent parcel", tool: "getLatestParcel", mode: "FULL" },
  { text: "show complete details of latest parcel", tool: "getLatestParcel", mode: "FULL" },
  { text: "everything about my last parcel", tool: "getLatestParcel", mode: "FULL" },
  { text: "tell me all about my recent order", tool: "getLatestParcel", mode: "FULL" },

  // ----------------------------
  // PARCEL BY PRODUCT NAME
  // ----------------------------
  { text: "where is my parcel", tool: "getParcelByName" },
  { text: "track my parcel", tool: "getParcelByName" },
  { text: "show parcel for product", tool: "getParcelByName" },
  { text: "parcel details for product", tool: "getParcelByName" },
  { text: "find parcel by product name", tool: "getParcelByName" },
  { text: "show parcel for item", tool: "getParcelByName" },
  { text: "track parcel for product", tool: "getParcelByName" },
  { text: "where is my product parcel", tool: "getParcelByName" },
  { text: "show details of my parcel", tool: "getParcelByName" },
  { text: "give me parcel information", tool: "getParcelByName" },
  { text: "status of my iphone parcel", tool: "getParcelByName" },
  { text: "where is my laptop delivery", tool: "getParcelByName" },
  { text: "check my tv parcel", tool: "getParcelByName" },
  { text: "what happened to my order", tool: "getParcelByName" },
  { text: "any update on my parcel", tool: "getParcelByName" },

  // FULL DETAILS BY NAME
  { text: "full parcel details", tool: "getParcelByName", mode: "FULL" },
  { text: "complete parcel information", tool: "getParcelByName", mode: "FULL" },
  { text: "show full details of parcel", tool: "getParcelByName", mode: "FULL" },
  { text: "give complete parcel info", tool: "getParcelByName", mode: "FULL" },
  { text: "detailed parcel information", tool: "getParcelByName", mode: "FULL" },
  { text: "tell me everything about this parcel", tool: "getParcelByName", mode: "FULL" },

  // ----------------------------
  // PARCEL BY ID
  // ----------------------------
  { text: "track parcel by id", tool: "getParcelById" },
  { text: "where is parcel id", tool: "getParcelById" },
  { text: "track parcel number", tool: "getParcelById" },
  { text: "parcel status by id", tool: "getParcelById" },
  { text: "show parcel using id", tool: "getParcelById" },
  { text: "check parcel id", tool: "getParcelById" },
  { text: "track P-", tool: "getParcelById" },
  { text: "find parcel by tracking number", tool: "getParcelById" },
  { text: "status of parcel id", tool: "getParcelById" },

  // ----------------------------
  // LIST ALL PARCELS
  // ----------------------------
  { text: "show my parcels", tool: "getMyParcels" },
  { text: "list my parcels", tool: "getMyParcels" },
  { text: "display my parcels", tool: "getMyParcels" },
  { text: "what parcels do i have", tool: "getMyParcels" },
  { text: "all my orders", tool: "getMyParcels" },
  { text: "show all parcels", tool: "getMyParcels" },
  { text: "my shipments", tool: "getMyParcels" },
  { text: "list all my deliveries", tool: "getMyParcels" },
  { text: "how many parcels do i have", tool: "getMyParcels" },
  { text: "show everything i ordered", tool: "getMyParcels" },

  // ----------------------------
  // STATUS FILTER
  // ----------------------------
  { text: "show delivered parcels", tool: "getParcelByStatus", status: "DELIVERED" },
  { text: "which parcels are delivered", tool: "getParcelByStatus", status: "DELIVERED" },
  { text: "completed deliveries", tool: "getParcelByStatus", status: "DELIVERED" },
  { text: "show cancelled parcels", tool: "getParcelByStatus", status: "CANCELLED" },
  { text: "cancelled orders", tool: "getParcelByStatus", status: "CANCELLED" },
  { text: "show pending parcels", tool: "getParcelByStatus", status: "PLACED" },
  { text: "parcels that are placed", tool: "getParcelByStatus", status: "PLACED" },
  { text: "show in transit parcels", tool: "getParcelByStatus", status: "IN_TRANSIT" },
  { text: "parcels in transit", tool: "getParcelByStatus", status: "IN_TRANSIT" },
  { text: "parcels being shipped", tool: "getParcelByStatus", status: "IN_TRANSIT" },
  { text: "out for delivery parcels", tool: "getParcelByStatus", status: "OUT_FOR_DELIVERY" },
  { text: "dispatched parcels", tool: "getParcelByStatus", status: "DISPATCHED" },

  // ----------------------------
  // INVOICE
  // ----------------------------
  { text: "generate invoice", tool: "generateInvoice" },
  { text: "download invoice", tool: "generateInvoice" },
  { text: "get parcel invoice", tool: "generateInvoice" },
  { text: "create invoice for parcel", tool: "generateInvoice" },
  { text: "i need an invoice", tool: "generateInvoice" },
  { text: "invoice for my order", tool: "generateInvoice" },
  { text: "billing for parcel", tool: "generateInvoice" },
  { text: "receipt for my delivery", tool: "generateInvoice" },

  // ----------------------------
  // DELAYED
  // ----------------------------
  { text: "show delayed parcels", tool: "delayedParcels" },
  { text: "which parcels are late", tool: "delayedParcels" },
  { text: "late delivery parcels", tool: "delayedParcels" },
  { text: "any delayed deliveries", tool: "delayedParcels" },
  { text: "parcels running late", tool: "delayedParcels" },
  { text: "overdue parcels", tool: "delayedParcels" },
  { text: "missed delivery date", tool: "delayedParcels" },
  { text: "parcels not delivered on time", tool: "delayedParcels" },

  // ----------------------------
  // CATEGORY FILTER
  // ----------------------------
  { text: "show electronics parcels", tool: "getParcelByCategory" },
  { text: "my electronics deliveries", tool: "getParcelByCategory" },
  { text: "show clothing parcels", tool: "getParcelByCategory" },
  { text: "my clothing orders", tool: "getParcelByCategory" },
  { text: "show food parcels", tool: "getParcelByCategory" },
  { text: "my food deliveries", tool: "getParcelByCategory" },
  { text: "show document parcels", tool: "getParcelByCategory" },
  { text: "my documents shipments", tool: "getParcelByCategory" },
  { text: "parcels in electronics category", tool: "getParcelByCategory" },
  { text: "parcels in clothing category", tool: "getParcelByCategory" },
  { text: "parcels in food category", tool: "getParcelByCategory" },
  { text: "parcels in documents category", tool: "getParcelByCategory" },
  { text: "filter parcels by category", tool: "getParcelByCategory" },
  { text: "show parcels by category", tool: "getParcelByCategory" },
  { text: "list parcels in category", tool: "getParcelByCategory" },
  { text: "what parcels do i have in electronics", tool: "getParcelByCategory" },
  { text: "show me all food orders", tool: "getParcelByCategory" },
  { text: "show furniture parcels", tool: "getParcelByCategory" },
  { text: "my furniture deliveries", tool: "getParcelByCategory" },
  { text: "show medical parcels", tool: "getParcelByCategory" },
  { text: "my pharma shipments", tool: "getParcelByCategory" },
  { text: "medicine deliveries", tool: "getParcelByCategory" },
  { text: "show automotive parcels", tool: "getParcelByCategory" },
  { text: "my car parts deliveries", tool: "getParcelByCategory" },
  { text: "show cosmetics parcels", tool: "getParcelByCategory" },
  { text: "my beauty product orders", tool: "getParcelByCategory" },
  { text: "show sports parcels", tool: "getParcelByCategory" },
  { text: "my fitness equipment deliveries", tool: "getParcelByCategory" },
  { text: "show books parcels", tool: "getParcelByCategory" },
  { text: "my stationery orders", tool: "getParcelByCategory" },
  { text: "show fragile parcels", tool: "getParcelByCategory" },
  { text: "my glassware shipments", tool: "getParcelByCategory" },
  { text: "show industrial parcels", tool: "getParcelByCategory" },
  { text: "my machinery deliveries", tool: "getParcelByCategory" },

  // ----------------------------
  // STATUS + DATE RANGE
  // ----------------------------
  { text: "delivered parcels between dates", tool: "getParcelByStatusAndDate" },
  { text: "parcels delivered between 1 april to 4 april", tool: "getParcelByStatusAndDate" },
  { text: "show delivered parcels from date to date", tool: "getParcelByStatusAndDate" },
  { text: "parcels placed between dates", tool: "getParcelByStatusAndDate" },
  { text: "cancelled parcels between dates", tool: "getParcelByStatusAndDate" },
  { text: "in transit parcels from date to date", tool: "getParcelByStatusAndDate" },
  { text: "find parcels by status and date", tool: "getParcelByStatusAndDate" },
  { text: "parcels dispatched between two dates", tool: "getParcelByStatusAndDate" },
  { text: "show orders delivered this week", tool: "getParcelByStatusAndDate" },
  { text: "parcels delivered in april", tool: "getParcelByStatusAndDate" }
];

export const seedIntents = async () => {
  try {
    console.log("🔄 Seeding intents...");

    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(c => c.name === "parcel_intents");
    if (!exists) {
      await qdrant.createCollection("parcel_intents", {
        vectors: { size: 768, distance: "Cosine" }
      });
      console.log("✅ Collection 'parcel_intents' created");
    } else {
      await qdrant.delete("parcel_intents", { filter: {} });
    }

    // Batch upsert for speed
    const points = [];
    for (const intent of intents) {
      const embedding = await createEmbedding(intent.text);
      points.push({ id: uuid(), vector: embedding, payload: intent });
    }

    // Upsert in batches of 20
    for (let i = 0; i < points.length; i += 20) {
      const batch = points.slice(i, i + 20);
      await qdrant.upsert("parcel_intents", { points: batch });
    }

    console.log(`✅ ${intents.length} intents seeded successfully`);
  } catch (err) {
    console.error("❌ Error seeding intents:", err.message);
  }
};
