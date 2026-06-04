import Parcel from '../models/Parcel.js';
import User from '../models/User.js';
import { generateParcelId } from '../utils/generateParcelId.js';
import PDFDocument from 'pdfkit';

const getDeliveryTime = (vehicleType, service) => {
  if (vehicleType === "bike") {
    return service === "express"
      ? { min: 2, max: 4, unit: "hours" }
      : { min: 10, max: 12, unit: "hours" };
  }

  if (vehicleType === "van") {
    return service === "express"
      ? { min: 1, max: 2, unit: "days" }
      : { min: 3, max: 4, unit: "days" };
  }

  if (vehicleType === "truck") {
    return service === "express"
      ? { min: 5, max: 6, unit: "days" }
      : { min: 8, max: 9, unit: "days" };
  }

  return null;
};

const calculateExpectedDelivery = (vehicleType, service) => {
  const d = getDeliveryTime(vehicleType, service?.toLowerCase());

  if (!d) return null;

  const now = new Date();

  if (d.unit === "hours") {
    now.setHours(now.getHours() + d.max);
  } else {
    now.setDate(now.getDate() + d.max);
  }

  return now;
};

// Search parcels by its status (user api) 
export const getParcelByStatus = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Search query is required',
      });
    }

    // Allowed parcel statuses
    const allowedStatuses = [
      'PLACED',
      'IN_TRANSIT',
      'DISPATCHED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'CANCELLED'
    ];

    const status = query.toUpperCase().trim();
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}`,
      });
    }

    const parcels = await Parcel.aggregate([
      {
        $addFields: {
          latestHistory: { $arrayElemAt: ["$history", -1] }
        }
      },
      {
        $match: {
          createdBy: req.user._id,
          "latestHistory.status": status
        }
      }
    ]);

    if (!parcels.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'No matching parcels found',
      });
    }

    return res.status(200).json({
      status: 'success',
      count: parcels.length,
      data: parcels,
    });

  } catch (err) {
    console.error('Parcel search error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while searching parcels',
    });
  }
}
// Search parcels by product name  (user api) 
export const getParcelByName = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({
        status: 'fail',
        message: 'Search query is required',
      });
    }

    // ✅ Case-insensitive partial match on product only
    const regex = new RegExp(`\\b${query}`, 'i'); // match at word boundary

    const parcels = await Parcel.find({
      createdBy: req.user._id,
      product: { $regex: regex },
    })
      .select('parcelId product currentStatus destinationAddress createdAt')
      .sort({ createdAt: -1 });

    if (!parcels.length) {
      return res.status(404).json({
        status: 'fail',
        message: 'No matching parcels found',
      });
    }

    return res.status(200).json({
      status: 'success',
      count: parcels.length,
      data: parcels,
    });
  } catch (err) {
    console.error('Parcel search error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Server error while searching parcels',
    });
  }
}

// Search parcels by category (user api)
export const getparcelByServiceType = async (req, res) => {
  try {
    const { query } = req.body;
    console.log(query);

    // if (!query || query.trim() === '') {
    //   return res.status(400).json({ status: 'fail', message: 'Category query is required' });
    // }
    let serviceType = query;

    if (!serviceType || serviceType.trim() === "") return [];

    // ✅ normalize input
    const normalizedType = serviceType.trim().toLowerCase();

    // ✅ allow only these values
    const allowedTypes = ["standard", "express"];

    if (!allowedTypes.includes(normalizedType)) {
      throw new Error("Invalid service type. Allowed values are 'standard' or 'express'.");
    }

    const parcels = await Parcel.find({
      createdBy: req.user._id,
      serviceType: { $regex: `^${normalizedType}$`, $options: "i" } // exact match, case-insensitive
    })
      .lean()
      .sort({ createdAt: -1 });

    let respoce = parcels.map(p => ({
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

    return res.status(200).json({ status: 'success', count: parcels.length, data: respoce });
  } catch (err) {
    console.error('Category search error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error while searching parcels' });
  }
};
// Search parcels by category (user api)
export const getParcelByCategory = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === '') {
      return res.status(400).json({ status: 'fail', message: 'Category query is required' });
    }

    const parcels = await Parcel.find({
      createdBy: req.user._id,
      category: { $regex: query.trim(), $options: 'i' },
    })
      .select('parcelId product category currentStatus destinationCity createdAt')
      .sort({ createdAt: -1 });

    if (!parcels.length) {
      return res.status(404).json({ status: 'fail', message: 'No parcels found for this category' });
    }

    return res.status(200).json({ status: 'success', count: parcels.length, data: parcels });
  } catch (err) {
    console.error('Category search error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error while searching parcels' });
  }
};

//   Get all parcels created by the logged-in user
export const getMyParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ status: 'success', data: parcels });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}

export const generateParcelInvoice = async (req, res) => {
  try {
    const { parcelId } = req.params;
    // ✅ Correct ownership check
    const parcel = await Parcel.findOne({
      parcelId: parcelId,
    });
    const userId = parcel.createdBy;
    const user = await User.findById(userId);
    if (!parcel) {
      return res.status(404).json({
        status: 'error',
        message: 'Parcel not found or access denied'
      });
    }

    // 🧾 Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const today = new Date();
    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Invoice_${parcel.parcelId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text('Shipment Invoice', { align: 'center' }).moveDown();
    doc.fontSize(11)
      .text(`Invoice Date: ${formatDate(today)}`)
      .text(`Parcel ID: ${parcel.parcelId}`)
      .text(`Order Date: ${formatDate(parcel.createdAt)}`)
      .moveDown();

    doc.fontSize(14).text('Sender Details', { underline: true });
    doc.fontSize(11)
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`)
      .moveDown();

    doc.fontSize(14).text('Receiver Details', { underline: true });
    doc.fontSize(11)
      .text(`Name: ${parcel.receiverName || 'N/A'}`)
      .text(`Contact: ${parcel.receiverContact || 'N/A'}`)
      .moveDown();

    doc.fontSize(14).text('Shipment Details', { underline: true });
    doc.fontSize(11)
      .text(`Product: ${parcel.product}`)
      .text(`Category: ${parcel.category || 'N/A'}`)
      .text(`Weight: ${parcel.weight} kg`)
      .text(`Vehicle Type: ${parcel.vehicleType || 'N/A'}`)
      .moveDown();

    doc.fontSize(14).text('Route Details', { underline: true });
    doc.fontSize(11)
      .text(`Origin: ${parcel.originCity || 'N/A'}`)
      .text(`Destination: ${parcel.destinationCity || 'N/A'}`)
      .text(`Distance: ${parcel.distanceKm ? parcel.distanceKm + ' km' : 'N/A'}`)
      .moveDown();

    doc.fontSize(14).text('Delivery Details', { underline: true });
    doc.fontSize(11)
      .text(`Delivery Partner: ${parcel.deliveryPartner || 'N/A'}`)
      .text(`Service Type: ${parcel.serviceType || 'N/A'}`)
      .text(`Expected Delivery: ${formatDate(parcel.expectedDeliveryDate)}`)
      .text(`Current Status: ${parcel.currentStatus}`)
      .moveDown();

    doc.fontSize(14).text('Cost Summary', { underline: true });
    doc.fontSize(11)
      .text(`Total Cost: ${parcel.cost != null ? 'Rs. ' + Number(parcel.cost).toLocaleString('en-IN') : 'N/A'}`)
      .moveDown();

    doc.fontSize(10).text('Thank you for choosing our delivery service.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate invoice'
    });
  }
}


//get the parsel by ID
export const getParcelById = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const parcel = await Parcel.findOne({ createdBy: req.user._id, parcelId }).populate('history.updatedBy', 'name email');

    if (!parcel)
      return res.status(404).json({ status: 'fail', message: 'Parcel not found' });

    res.json({ status: 'success', data: parcel });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}


//Cud
// CUD - Update Parcel Status
export const updateParcel = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { status, currentLocation, comment, statusDate } = req.body;

    console.log("req.body", req.body);

    // ----------------------------
    // Validation
    // ----------------------------
    if (!currentLocation) {
      return res.status(400).json({
        status: "fail",
        message: "Current location is required",
      });
    }

    if (!statusDate) {
      return res.status(400).json({
        status: "fail",
        message: "Status date is required",
      });
    }

    const statusDateObj = new Date(statusDate);

    const validFlow = [
      "PLACED",
      "IN_TRANSIT",
      "DISPATCHED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ];

    const parcel = await Parcel.findOne({ parcelId });

    if (!parcel) {
      return res
        .status(404)
        .json({ status: "fail", message: "Parcel not found" });
    }

    // Status date cannot be before order creation
    if (statusDateObj < parcel.createdAt) {
      return res.status(400).json({
        status: "fail",
        message: "Status date cannot be before order date",
      });
    }

    // Status date cannot be before or equal to last history entry
    const lastHistory = parcel.history?.length
      ? parcel.history[parcel.history.length - 1]
      : null;
    if (lastHistory && statusDateObj <= new Date(lastHistory.updatedAt)) {
      return res.status(400).json({
        status: "fail",
        message: "Status date must be after the previous status update date",
      });
    }

    // Invalid status
    if (!validFlow.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status value",
      });
    }

    // ----------------------------
    // Special Case: CANCELLED
    // ----------------------------
    if (status === "CANCELLED") {
      if (parcel.currentStatus === "DELIVERED") {
        return res.status(400).json({
          status: "fail",
          message: "Delivered parcel cannot be cancelled",
        });
      }

      parcel.currentStatus = status;
      parcel.deliveryDescription = `Parcel was cancelled at ${currentLocation}. ${comment || ""
        }`;
      parcel.isDelayed = false;

      parcel.history.push({
        status,
        currentLocation,
        comment: comment || "",
        updatedBy: req.user._id,
        updatedAt: statusDateObj,
      });

      await parcel.save();

      return res.json({
        status: "success",
        message: "Parcel cancelled successfully",
        data: parcel,
      });
    }

    // ----------------------------
    // Sequential Status Validation
    // ----------------------------
    const currentIndex = validFlow.indexOf(parcel.currentStatus);
    const nextIndex = validFlow.indexOf(status);

    if (nextIndex < currentIndex) {
      return res.status(400).json({
        status: "fail",
        message: `Cannot move from ${parcel.currentStatus} backwards to ${status}`,
      });
    }

    if (nextIndex > currentIndex + 1) {
      return res.status(400).json({
        status: "fail",
        message: `You can only move to the next step: ${validFlow[currentIndex + 1]}`,
      });
    }

    // ----------------------------
    // Update Parcel
    // ----------------------------
    parcel.currentStatus = status;
    parcel.deliveryDescription = `Status updated to ${status} at ${currentLocation}. ${comment || ""
      }`;

    // Delay calculation for all statuses, including DELIVERED
    parcel.isDelayed = statusDateObj > parcel.expectedDeliveryDate;

    // Special message for DELIVERED
    if (status === "DELIVERED") {
      parcel.deliveryDescription = `Parcel delivered successfully at ${currentLocation}. ${comment || ""
        }`;
    }

    parcel.history.push({
      status,
      currentLocation,
      comment: comment || "",
      updatedBy: req.user._id,
      updatedAt: statusDateObj,
    });

    await parcel.save();

    return res.json({
      status: "success",
      message: `Status updated to ${status}`,
      data: parcel,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};


//create a parcel
export const createParcel = async (req, res) => {
  try {
    const {
      product,
      category,
      weight,
      name,
      contact,
      originCity,
      destinationCity,
      distanceKm, // ✅ NEW
      deliveryPartner,
      serviceType,
      vehicleType,
      cost
    } = req.body;

    // ✅ Validate required fields
    if (
      !category || !product ||
      weight === undefined ||
      !name ||
      !contact ||
      !originCity ||
      !destinationCity ||
      distanceKm === undefined ||
      !deliveryPartner ||
      !serviceType ||
      cost === undefined
    ) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required parcel details',
      });
    }

    // ✅ Validate weight
    if (Number(weight) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Weight must be greater than zero',
      });
    }

    // ✅ Validate distance
    if (Number(distanceKm) <= 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Distance must be greater than zero',
      });
    }

    // ✅ Validate contact
    if (!/^[0-9]{10}$/.test(contact)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid contact number',
      });
    }

    const parcelId = generateParcelId();
    const expectedDeliveryDate = calculateExpectedDelivery(vehicleType, serviceType);

    const parcel = await Parcel.create({
      parcelId,
      category,
      product,
      weight: Number(weight),

      receiverName: name,
      receiverContact: contact,

      originCity,
      destinationCity,
      distanceKm: Number(distanceKm), // ✅ STORED

      deliveryPartner,
      serviceType,
      vehicleType,
      cost,
      expectedDeliveryDate,
      createdBy: req.user._id,
      currentStatus: 'PLACED',

      deliveryDescription: 'Order placed successfully',

      history: [
        {
          status: 'PLACED',
          currentLocation: originCity,
          comment: `Parcel created via ${deliveryPartner} (${serviceType})`,
          updatedBy: req.user._id,
        },
      ],
    });

    return res.status(201).json({
      status: 'success',
      message: 'Parcel created successfully',
      parcelId: parcel.parcelId,
      data: parcel,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
    });
  }
};
export const getAllParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find().populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ status: 'success', data: parcels });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
}