import Parcel from "../models/Parcel.js";
import User from "../models/User.js";
import { generateParcelId } from "./generateParcelId.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Strip MongoDB internals before sending to LLM
const sanitize = (obj) => {
  if (!obj) return null;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const { _id, __v, createdBy, updatedAt, createdAt, ...rest } = obj;

  // Clean history entries too
  if (rest.history) {
    rest.history = rest.history.map(h => ({
      status: h.status,
      location: h.currentLocation || "N/A",
      comment: h.comment || "",
      date: h.updatedAt ? new Date(h.updatedAt).toLocaleString("en-GB") : ""
    }));
  }

  return rest;
};

export const getLatestParcel = async (userId, mode = null) => {
  const parcel = await Parcel.findOne({ createdBy: userId })
    .sort({ createdAt: -1 })
    .lean();

  if (!parcel) return null;

  parcel.latestHistory = parcel.history?.[parcel.history.length - 1] || null;

  if (mode === "FULL") return sanitize(parcel);

  return sanitize({
    parcelId: parcel.parcelId,
    product: parcel.product,
    status: parcel.currentStatus,
    deliveryPartner: parcel.deliveryPartner,
    serviceType: parcel.serviceType,
    expectedDeliveryDate: parcel.expectedDeliveryDate,
    isDelayed: parcel.isDelayed,
    latestUpdate: parcel.latestHistory
  });
};
export const getLastNParcels = async (count = 2, userId) => {
  const parcels = await Parcel.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .limit(count)
    .lean();

  if (!parcels.length) return [];

  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    category: p.category || "N/A",
    status: p.currentStatus,
    weight: p.weight,
    cost: p.cost,
    deliveryPartner: p.deliveryPartner,
    serviceType: p.serviceType,
    destination: p.destinationCity,
    expectedDeliveryDate: p.expectedDeliveryDate,
    isDelayed: p.isDelayed
  }));
};

export const getParcelByServiceType = async (serviceType, userId) => {
  if (!serviceType || serviceType.trim() === "") return [];

  // ✅ normalize input
  const normalizedType = serviceType.trim().toLowerCase();

  // ✅ allow only these values
  const allowedTypes = ["standard", "express"];

  if (!allowedTypes.includes(normalizedType)) {
    throw new Error("Invalid service type. Allowed values are 'standard' or 'express'.");
  }

  const parcels = await Parcel.find({
    createdBy: userId,
    serviceType: { $regex: `^${normalizedType}$`, $options: "i" } // exact match, case-insensitive
  })
    .lean()
    .sort({ createdAt: -1 });

  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    category: p.category || "N/A",
    status: p.currentStatus,
    weight: p.weight,
    cost: p.cost,
    deliveryPartner: p.deliveryPartner,
    serviceType: p.serviceType,
    destination: p.destinationCity,
    expectedDeliveryDate: p.expectedDeliveryDate,
    isDelayed: p.isDelayed
  }));
};

export const getParcelByStatus = async (status, userId) => {
  if (!status || status.trim() === "") return [];

  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === "DELAYED") {
    const parcels = await Parcel.find({
      createdBy: userId,
      isDelayed: true,
      currentStatus: { $nin: ["DELIVERED", "CANCELLED"] }
    }).lean().sort({ createdAt: -1 });
    return sanitize(parcels);
  }

  const parcels = await Parcel.find({ createdBy: userId, currentStatus: normalizedStatus })
    .lean().sort({ createdAt: -1 });
  return sanitize(parcels);
};

export const getParcelByName = async (query, userId, options = {}) => {
  if (!query || query.trim() === "") return [];

  const keyword = query.toLowerCase().trim();

  // Try regex match first
  let parcels = await Parcel.find({
    createdBy: userId,
    product: { $regex: keyword, $options: "i" }
  }).lean();

  // If no regex match, try individual words
  if (parcels.length === 0 && keyword.includes(" ")) {
    const words = keyword.split(/\s+/);
    for (const word of words) {
      if (word.length < 2) continue;
      parcels = await Parcel.find({
        createdBy: userId,
        product: { $regex: word, $options: "i" }
      }).lean();
      if (parcels.length > 0) break;
    }
  }

  if (parcels.length === 0) return [];

  if (options.latest) {
    return sanitize(
      parcels
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(p => {
          p.latestHistory = p.history?.[p.history.length - 1] || null;
          return p;
        })
    );
  }

  // Rank results
  const ranked = parcels.map(p => {
    const product = p.product.toLowerCase();
    let score = 0;
    if (product === keyword) score = 4;
    else if (product.startsWith(keyword)) score = 3;
    else if (product.split(" ").includes(keyword)) score = 2;
    else if (product.includes(keyword)) score = 1;
    return { ...p, score };
  });

  return sanitize(
    ranked
      .sort((a, b) => b.score !== a.score ? b.score - a.score : new Date(b.createdAt) - new Date(a.createdAt))
      .map(({ score, ...rest }) => {
        rest.latestHistory = rest.history?.[rest.history.length - 1] || null;
        return rest;
      })
  );
};

export const getMyParcels = async (userId) => {
  const parcels = await Parcel.find({ createdBy: userId })
    .lean().sort({ createdAt: -1 });

  // Return summary for list view (don't dump full history for all parcels)
  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    status: p.currentStatus,
    deliveryPartner: p.deliveryPartner,
    serviceType: p.serviceType,
    destination: p.destinationCity || p.destinationAddress,
    weight: p.weight,
    expectedDeliveryDate: p.expectedDeliveryDate,
    isDelayed: p.isDelayed
  }));
};

export const delayedParcels = async (userId) => {
  const parcels = await Parcel.find({
    createdBy: userId,
    isDelayed: true,
    currentStatus: { $nin: ["DELIVERED", "CANCELLED"] }
  }).lean().sort({ createdAt: -1 });

  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    status: p.currentStatus,
    destination: p.destinationCity,
    expectedDeliveryDate: p.expectedDeliveryDate,
    latestLocation: p.history?.[p.history.length - 1]?.currentLocation || "N/A"
  }));
};

export const getParcelById = async (parcelId, userId) => {
  const parcel = await Parcel.findOne({ createdBy: userId, parcelId }).lean();
  if (!parcel) return null;
  parcel.latestHistory = parcel.history?.[parcel.history.length - 1] || null;
  return sanitize(parcel);
};

export const generateInvoice = async (query, userId) => {
  try {
    if (!query || !userId) {
      return { success: false, message: "Query and userId are required." };
    }

    const parcelIdMatch = query.match(/P-[A-Z0-9]+/i);
    let searchBy = parcelIdMatch ? "parcelId" : "product";
    const normalizedQuery = parcelIdMatch ? parcelIdMatch[0].toUpperCase() : query.trim().split(/\s+/)[0];

    let parcel;
    if (searchBy === "product") {
      const regex = new RegExp(`\\b${normalizedQuery}`, "i");
      parcel = await Parcel.findOne({ [searchBy]: { $regex: regex }, createdBy: userId });
    } else {
      parcel = await Parcel.findOne({ parcelId: normalizedQuery, createdBy: userId });
    }

    if (!parcel) return { success: false, message: "Parcel not found." };

    const user = await User.findById(userId).select("name email");
    if (!user) return { success: false, message: "User not found." };

    const invoicesDir = path.join(process.cwd(), "invoices");
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

    const fileName = `Invoice_${parcel.parcelId}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

    doc.fontSize(20).text("Shipment Invoice", { align: "center" }).moveDown();
    doc.fontSize(11)
      .text(`Invoice Date: ${formatDate(new Date())}`)
      .text(`Parcel ID: ${parcel.parcelId}`)
      .text(`Order Date: ${formatDate(parcel.createdAt)}`)
      .moveDown();

    doc.fontSize(14).text("Sender Details", { underline: true });
    doc.fontSize(11)
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .moveDown();

    doc.fontSize(14).text("Receiver Details", { underline: true });
    doc.fontSize(11)
      .text(`Name: ${parcel.receiverName || "N/A"}`)
      .text(`Contact: ${parcel.receiverContact || "N/A"}`)
      .moveDown();

    doc.fontSize(14).text("Shipment Details", { underline: true });
    doc.fontSize(11)
      .text(`Product: ${parcel.product}`)
      .text(`Category: ${parcel.category || "N/A"}`)
      .text(`Weight: ${parcel.weight} kg`)
      .text(`Vehicle Type: ${parcel.vehicleType || "N/A"}`)
      .moveDown();

    doc.fontSize(14).text("Route Details", { underline: true });
    doc.fontSize(11)
      .text(`Origin: ${parcel.originCity || "N/A"}`)
      .text(`Destination: ${parcel.destinationCity || "N/A"}`)
      .text(`Distance: ${parcel.distanceKm ? parcel.distanceKm + " km" : "N/A"}`)
      .moveDown();

    doc.fontSize(14).text("Delivery Details", { underline: true });
    doc.fontSize(11)
      .text(`Delivery Partner: ${parcel.deliveryPartner || "N/A"}`)
      .text(`Service Type: ${parcel.serviceType || "N/A"}`)
      .text(`Expected Delivery: ${formatDate(parcel.expectedDeliveryDate)}`)
      .text(`Current Status: ${parcel.currentStatus}`)
      .moveDown();

    doc.fontSize(14).text("Cost Summary", { underline: true });
    doc.fontSize(11)
      .text(`Total Cost: ${parcel.cost != null ? "Rs. " + Number(parcel.cost).toLocaleString("en-IN") : "N/A"}`)
      .moveDown();

    doc.fontSize(10).text("Thank you for choosing our delivery service.", { align: "center" });
    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    return {
      success: true,
      message: "Invoice generated successfully.",
      parcelId: parcel.parcelId,
      product: parcel.product,
      downloadUrl: `/parcel/invoice/${parcel.parcelId}`
    };
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return { success: false, message: "Error generating invoice." };
  }
};

export const getParcelByCategory = async (category, userId) => {
  if (!category || category.trim() === "") return [];

  const parcels = await Parcel.find({
    createdBy: userId,
    category: { $regex: category.trim(), $options: "i" }
  }).lean().sort({ createdAt: -1 });

  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    category: p.category,
    status: p.currentStatus,
    deliveryPartner: p.deliveryPartner,
    serviceType: p.serviceType,
    destination: p.destinationCity,
    weight: p.weight,
    expectedDeliveryDate: p.expectedDeliveryDate,
    isDelayed: p.isDelayed
  }));
};

export const getParcelByStatusAndDate = async (status, startDate, endDate, userId) => {
  if (!status || !startDate || !endDate) return [];

  const query = {
    createdBy: userId,
    currentStatus: status.trim().toUpperCase(),
    updatedAt: {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    }
  };

  const parcels = await Parcel.find(query).lean().sort({ updatedAt: -1 });

  return parcels.map(p => ({
    parcelId: p.parcelId,
    product: p.product,
    category: p.category || "N/A",
    status: p.currentStatus,
    deliveryPartner: p.deliveryPartner,
    destination: p.destinationCity,
    cost: p.cost,
    expectedDeliveryDate: p.expectedDeliveryDate,
    updatedAt: p.updatedAt
  }));
};

export const NO_CALL = async () => {
  return { success: true, message: "No action taken." };
};
