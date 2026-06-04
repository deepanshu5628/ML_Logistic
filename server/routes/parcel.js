// backend/routes/parcel.js
import express from 'express';
import { generateParcelId } from '../utils/generateParcelId.js';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import {getParcelByStatus,
    getParcelByName,
    getAllParcels,
    getMyParcels,
    getParcelById,
    updateParcel,
    createParcel,generateParcelInvoice,getParcelByCategory,
    getparcelByServiceType} from "../controllers/parcelController.js";
import axios from "axios";

const router = express.Router();

//create parsel
router.post('/createParcel', authMiddleware,createParcel);

// Update parcel status (admin only)
router.patch('/updateParcelStatus/:parcelId/status', authMiddleware, adminOnly, updateParcel);

//get the parsel by ID
router.get('/track/:parcelId', authMiddleware,getParcelById);

//   Get all parcels created by the logged-in user
router.get('/myParcels', authMiddleware,getMyParcels);
// Download parcel invoice (user)
router.get('/invoice/:parcelId',generateParcelInvoice);

router.get("/getByServiceType",authMiddleware,getparcelByServiceType)

// Get all parcels (admin only)
router.get('/allParcels', authMiddleware, adminOnly,getAllParcels);

// Search parcels by product name  (user api) 
router.get('/search', authMiddleware,getParcelByName);

// Search parcels by its status (user api) 
router.get('/parsel_status', authMiddleware, getParcelByStatus);

// Search parcels by category (user api)
router.get('/category', authMiddleware, getParcelByCategory);

const GOOGLE_API_KEY = "AIzaSyDHDeIMIyyEsDiZh7kbV9SS4uKqpy29NLg";

// ✅ Distance API
router.get("/get-distance", async (req, res) => {
  try {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: "Origin and destination are required"
      });
    }

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          units: "metric", // ✅ force KM
          origins: origin,
          destinations: destination,
          key: GOOGLE_API_KEY
        }
      }
    );

    const data = response.data;

    if (
      data.rows[0].elements[0].status !== "OK"
    ) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate distance"
      });
    }

    const distanceMeters = data.rows[0].elements[0].distance.value;
    const duration = data.rows[0].elements[0].duration.text;

    const distanceKm = distanceMeters / 1000;

    return res.json({
      success: true,
      distance_km: distanceKm,
      duration
    });

  } catch (error) {
    console.error("Distance API Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

export default router;
