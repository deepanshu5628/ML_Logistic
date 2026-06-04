import mongoose from 'mongoose';

const statusEnum = [
  'PLACED',
  'IN_TRANSIT',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED'
];

const parcelSchema = new mongoose.Schema(
  {
    parcelId: { type: String, unique: true, required: true },
    category: {
      type: String,
      required: true,
      index: true
    },

    // 📦 Parcel Info
    product: { type: String, required: true },

    weight: {
      type: Number,
      required: true,
      min: 0
    },

    // 👤 Receiver Info
    receiverName: { type: String, required: true },

    receiverContact: {
      type: String,
      required: true,
      match: /^[0-9]{10}$/
    },

    // 📍 Location Info
    originCity: {
      type: String,
      required: true
    },

    destinationCity: {
      type: String,
      required: true
    },

    distanceKm: {
      type: Number,
      required: true,
      min: 0
    },

    // 🚚 Delivery Selection
    deliveryPartner: {
      type: String
    },

    serviceType: {
      type: String
    },

    cost: {
      type: Number
    },

    // 📦 Status
    currentStatus: {
      type: String,
      enum: statusEnum,
      default: 'PLACED'
    },

    /* ================================
       🚚 DELIVERY TRACKING
    ================================= */

    expectedDeliveryDate: {
      type: Date
    },

    deliveryDescription: {
      type: String,
      default: ''
    },

    isDelayed: {
      type: Boolean,
      default: false
    },

    // 📜 History
    history: [
      {
        status: { type: String, required: true },
        currentLocation: { type: String },
        comment: { type: String, default: "" },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        updatedAt: { type: Date, default: Date.now }
      }
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    expectedDeliveryDate: {
      type: Date
    },
    vehicleType: {
      type: String
    }

  },
  { timestamps: true }
);

export default mongoose.model('Parcel', parcelSchema);