import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Radio,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  CircularProgress,
  Backdrop
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createParcel } from "../features/parcelSlice";
import { toast } from "react-toastify";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import AirportShuttleIcon from "@mui/icons-material/AirportShuttle";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InventoryIcon from "@mui/icons-material/Inventory";

const getDeliveryTime = (vehicleType, service) => {
  if (vehicleType === "bike") {
    return service === "Express"
      ? { min: 2, max: 4, unit: "hours" }
      : { min: 10, max: 12, unit: "hours" };
  }
  if (vehicleType === "van") {
    return service === "Express"
      ? { min: 1, max: 2, unit: "days" }
      : { min: 3, max: 4, unit: "days" };
  }
  if (vehicleType === "truck") {
    return service === "Express"
      ? { min: 5, max: 6, unit: "days" }
      : { min: 8, max: 9, unit: "days" };
  }
  return null;
};

const formatDeliveryTime = (vehicleType, service) => {
  const d = getDeliveryTime(vehicleType, service);
  if (!d) return "";
  return d.unit === "hours" ? `${d.min}–${d.max} Hours` : `${d.min}–${d.max} Days`;
};

const calculateExpectedDelivery = (vehicleType, service) => {
  const d = getDeliveryTime(vehicleType, service);
  if (!d) return null;
  const now = new Date();
  if (d.unit === "hours") now.setHours(now.getHours() + d.max);
  else now.setDate(now.getDate() + d.max);
  return now;
};

const getDeliveryPrice = async ({ distance_km, package_weight_kg, vehicle_type, delivery_mode, delivery_partner }) => {
  try {
    const res = await axios.post(`${import.meta.env.VITE_PRICING_API_URL || 'http://127.0.0.1:9000'}/predict`, {
      distance_km, package_weight_kg, vehicle_type, delivery_mode, delivery_partner
    });
    return res.data?.predicted_delivery_cost || 0;
  } catch (err) {
    console.error("Pricing API error:", err);
    return 0;
  }
};

const vehicleConfig = {
  bike: { icon: <TwoWheelerIcon />, label: "Bike", range: "0 – 10 kg", color: "#43a047" },
  van: { icon: <AirportShuttleIcon />, label: "Van", range: "10 – 200 kg", color: "#1565c0" },
  truck: { icon: <LocalShippingIcon />, label: "Truck", range: "200+ kg", color: "#e65100" },
};

const MotionBox = motion.create(Box);

const SelectDeliveryPartner = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vehicleType, setVehicleType] = useState("bike");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const parcelData = location.state?.parcelData;
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!parcelData?.weight) return;
    const weight = Number(parcelData.weight);
    if (weight <= 10) setVehicleType("bike");
    else if (weight <= 200) setVehicleType("van");
    else setVehicleType("truck");
  }, [parcelData]);

  useEffect(() => { setSelected(null); }, [vehicleType]);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!location.state?.partners || !parcelData) return;
      setLoading(true);
      const apiPartners = location.state.partners;
      const distance = parcelData?.distanceKm || 10;
      try {
        const requests = [];
        apiPartners.forEach((partner) => {
          ["standard", "express"].forEach((mode) => {
            requests.push(getDeliveryPrice({
              distance_km: distance,
              package_weight_kg: Number(parcelData.weight),
              vehicle_type: vehicleType,
              delivery_mode: mode,
              delivery_partner: partner.toLowerCase()
            }));
          });
        });
        const results = await Promise.all(requests);
        let resultIndex = 0;
        const formatted = apiPartners.map((partner, index) => {
          const standardPrice = results[resultIndex++];
          const expressPrice = results[resultIndex++];
          return {
            partner,
            services: [
              {
                id: index * 2 + 1, service: "Express", price: expressPrice,
                deliveryTime: formatDeliveryTime(vehicleType, "Express"),
                expectedDeliveryDate: calculateExpectedDelivery(vehicleType, "Express")
              },
              {
                id: index * 2 + 2, service: "Standard", price: standardPrice,
                deliveryTime: formatDeliveryTime(vehicleType, "Standard"),
                expectedDeliveryDate: calculateExpectedDelivery(vehicleType, "Standard")
              }
            ]
          };
        });
        setPartners(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch pricing");
      }
      setLoading(false);
    };
    fetchPricing();
  }, [location.state, vehicleType, parcelData]);

  const handleCreateParcel = async () => {
    if (!selected) { toast.error("Please select a delivery option"); return; }
    try {
      const payload = {
        ...parcelData, vehicleType,
        deliveryPartner: selected.partner,
        serviceType: selected.service,
        cost: selected.price
      };
      const res = await dispatch(createParcel(payload)).unwrap();
      localStorage.removeItem("parcelForm");
      toast.success(`Parcel ${res.parcelId} created successfully!`);
      navigate("/dashboard");
    } catch {
      toast.error("Failed to create parcel");
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
      py: 4
    }}>
      <Container maxWidth="md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "20px", mx: "auto", mb: 2,
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(21,101,192,0.3)"
            }}>
              <LocalShippingIcon sx={{ color: "#fff", fontSize: 32 }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", letterSpacing: "-0.5px" }}>
              Choose Delivery
            </Typography>
            <Typography variant="body2" sx={{ color: "#78909c", mt: 0.5 }}>
              Compare carriers and pick the best option
            </Typography>
          </Box>
        </motion.div>

        {/* Parcel Summary */}
        {parcelData && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Paper elevation={0} sx={{
              p: 2.5, mb: 3, borderRadius: "16px",
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              color: "#fff",
              display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "center"
            }}>
              <Chip icon={<InventoryIcon sx={{ color: "#fff !important" }} />}
                label={parcelData.product} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", fontWeight: 600 }} />
              <Chip label={`${parcelData.weight} kg`}
                sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", fontWeight: 600 }} />
              {parcelData.distanceKm && (
                <Chip label={`${Number(parcelData.distanceKm).toFixed(1)} KM`}
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", fontWeight: 600 }} />
              )}
            </Paper>
          </motion.div>
        )}

        {/* Vehicle Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Paper elevation={0} sx={{
            p: 2, mb: 3, borderRadius: "16px",
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a237e", mb: 1.5 }}>
              Vehicle Type
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              {Object.entries(vehicleConfig).map(([key, cfg]) => {
                const isActive = vehicleType === key;
                return (
                  <Box key={key} onClick={() => { setVehicleType(key); setLoading(true); }}
                    sx={{
                      flex: 1, p: 2, borderRadius: "14px", cursor: "pointer",
                      textAlign: "center", transition: "all 0.3s",
                      border: "2px solid",
                      borderColor: isActive ? cfg.color : "transparent",
                      bgcolor: isActive ? `${cfg.color}10` : "#f5f5f5",
                      "&:hover": { bgcolor: `${cfg.color}08`, borderColor: `${cfg.color}80` }
                    }}
                  >
                    <Box sx={{ color: isActive ? cfg.color : "#90a4ae", mb: 0.5 }}>{cfg.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: isActive ? cfg.color : "#455a64" }}>
                      {cfg.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#90a4ae" }}>{cfg.range}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </motion.div>

        {/* Partners */}
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ textAlign: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#1565c0", mb: 2 }} />
              <Typography variant="body1" sx={{ color: "#78909c", fontWeight: 600 }}>
                Fetching live pricing from carriers...
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <AnimatePresence>
            {partners.map((partnerObj, index) => (
              <MotionBox key={index}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                sx={{ mb: 2.5 }}
              >
                <Paper elevation={0} sx={{
                  borderRadius: "20px", overflow: "hidden",
                  background: "rgba(255,255,255,0.85)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
                }}>
                  {/* Partner Header */}
                  <Box sx={{
                    px: 3, py: 2,
                    background: "linear-gradient(135deg, #fafafa, #f5f5f5)",
                    borderBottom: "1px solid #eee",
                    display: "flex", alignItems: "center", gap: 1.5
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: "10px",
                      background: "linear-gradient(135deg, #1a237e, #1565c0)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <LocalShippingIcon sx={{ color: "#fff", fontSize: 18 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#1a237e" }}>
                      {partnerObj.partner}
                    </Typography>
                  </Box>

                  {/* Services */}
                  <Box sx={{ p: 2 }}>
                    {partnerObj.services.map((service) => {
                      const isSelected = selected?.id === service.id;
                      const isExpress = service.service === "Express";

                      return (
                        <Box key={service.id}
                          onClick={() => setSelected({ ...service, partner: partnerObj.partner })}
                          sx={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            p: 2, mb: 1, borderRadius: "14px", cursor: "pointer",
                            border: "2px solid",
                            borderColor: isSelected ? "#1565c0" : "transparent",
                            bgcolor: isSelected ? "#e3f2fd" : "#fafafa",
                            transition: "all 0.25s ease",
                            "&:hover": {
                              bgcolor: isSelected ? "#e3f2fd" : "#f0f4ff",
                              borderColor: isSelected ? "#1565c0" : "#90caf9"
                            }
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Radio checked={isSelected}
                              sx={{ p: 0, color: "#bdbdbd", "&.Mui-checked": { color: "#1565c0" } }} />
                            <Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography sx={{ fontWeight: 700, color: "#263238", fontSize: "0.95rem" }}>
                                  {service.service}
                                </Typography>
                                {isExpress && (
                                  <Chip icon={<FlashOnIcon sx={{ fontSize: "14px !important", color: "#e65100 !important" }} />}
                                    label="Fast" size="small"
                                    sx={{
                                      height: 22, fontSize: "0.65rem", fontWeight: 700,
                                      bgcolor: "#fff3e0", color: "#e65100", border: "1px solid #ffe0b2"
                                    }}
                                  />
                                )}
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.3 }}>
                                <ScheduleIcon sx={{ fontSize: 14, color: "#90a4ae" }} />
                                <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 500 }}>
                                  {service.deliveryTime}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontWeight: 800, color: "#1a237e", fontSize: "1.1rem" }}>
                              ₹{Math.round(service.price)}
                            </Typography>
                            {isSelected && (
                              <CheckCircleIcon sx={{ color: "#1565c0", fontSize: 18, mt: 0.3 }} />
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </MotionBox>
            ))}
          </AnimatePresence>
        )}

        {/* Selected Summary & Actions */}
        {selected && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Paper elevation={0} sx={{
              p: 2.5, mb: 3, borderRadius: "16px",
              background: "linear-gradient(135deg, #e8eaf6, #e3f2fd)",
              border: "1px solid #c5cae9"
            }}>
              <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                Selected Plan
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: "#1a237e" }}>
                    {selected.partner} — {selected.service}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#546e7a" }}>
                    {selected.deliveryTime} • {vehicleConfig[vehicleType]?.label}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: "#1a237e" }}>
                  ₹{Math.round(selected.price)}
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 4 }}>
            <Button variant="outlined" startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                flex: 1, py: 1.6, borderRadius: "14px", fontWeight: 700,
                textTransform: "none", fontSize: "0.95rem",
                borderColor: "#c5cae9", color: "#1a237e",
                "&:hover": { borderColor: "#1a237e", bgcolor: "#e8eaf6" }
              }}
            >
              Back
            </Button>
            <Button variant="contained" endIcon={<CheckCircleIcon />}
              onClick={handleCreateParcel}
              disabled={!selected || loading}
              sx={{
                flex: 2, py: 1.6, borderRadius: "14px", fontWeight: 700,
                textTransform: "none", fontSize: "0.95rem",
                background: "linear-gradient(135deg, #1a237e, #1565c0)",
                boxShadow: "0 8px 32px rgba(21,101,192,0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0d1b6e, #0d47a1)",
                  boxShadow: "0 12px 40px rgba(21,101,192,0.4)",
                  transform: "translateY(-1px)"
                },
                "&:disabled": {
                  background: "#bdbdbd",
                  boxShadow: "none"
                },
                transition: "all 0.3s ease"
              }}
            >
              Confirm & Create Parcel
            </Button>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default SelectDeliveryPartner;
