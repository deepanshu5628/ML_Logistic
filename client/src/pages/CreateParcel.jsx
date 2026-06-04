import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Box,
  Backdrop,
  Dialog,
  InputAdornment,
  IconButton,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClearIcon from "@mui/icons-material/Clear";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import InventoryIcon from "@mui/icons-material/Inventory";
import RouteIcon from "@mui/icons-material/Route";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import FlagIcon from "@mui/icons-material/Flag";
import StraightenIcon from "@mui/icons-material/Straighten";
import Select from "react-select";
import { motion } from "framer-motion";

import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Autocomplete
} from "@react-google-maps/api";

const style = document.createElement("style");
style.innerHTML = `.pac-container { z-index: 2000 !important; }`;
document.head.appendChild(style);

const MapModal = ({ open, onClose, onSelect }) => {
  const [marker, setMarker] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) setMarker(null);
    else setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"]
  });

  if (!isLoaded) return <p>Loading map...</p>;

  const handleClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarker({ lat, lng });
    onClose();
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) onSelect(results[0].formatted_address);
    });
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place?.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarker({ lat, lng });
        onSelect(place.formatted_address);
        onClose();
        if (mapRef.current) mapRef.current.panTo({ lat, lng });
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      disableEnforceFocus disableAutoFocus disableRestoreFocus
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <Box sx={{ p: 2, background: "linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)" }}>
        <Typography variant="h6" sx={{ color: "#fff", mb: 1, fontWeight: 700 }}>
          📍 Select Location
        </Typography>
        <Autocomplete onLoad={(auto) => setAutocomplete(auto)} onPlaceChanged={handlePlaceChanged}>
          <input ref={inputRef} type="text" placeholder="Search location..."
            style={{
              width: "100%", height: "44px", padding: "12px 16px",
              fontSize: "15px", border: "none", borderRadius: "10px",
              outline: "none", background: "rgba(255,255,255,0.95)"
            }}
          />
        </Autocomplete>
      </Box>
      <GoogleMap onLoad={(map) => (mapRef.current = map)}
        mapContainerStyle={{ width: "100%", height: "420px" }}
        center={{ lat: 28.6139, lng: 77.2090 }} zoom={10} onClick={handleClick}
      >
        {marker && <Marker position={marker} />}
      </GoogleMap>
    </Dialog>
  );
};

const ParcelSchema = Yup.object().shape({
  category: Yup.string().required('Category is required'),
  product: Yup.string().required('Product name is required'),
  weight: Yup.number().typeError('Weight must be a number').positive('Weight must be greater than zero').required('Weight is required'),
  name: Yup.string().required('Receiver name is required'),
  contact: Yup.string().matches(/^[0-9]+$/, 'Contact must be numeric').length(10, 'Contact must be 10 digits').required('Contact is required'),
  originCity: Yup.string().required('Origin city is required'),
  destinationCity: Yup.string().required('Destination city is required'),
});

const categoryOptions = [
  { value: "electronics", label: "📱 Electronics" },
  { value: "clothing", label: "👕 Clothing & Apparel" },
  { value: "documents", label: "📄 Documents" },
  { value: "food", label: "🍔 Food & Perishables" },
  { value: "furniture", label: "🪑 Furniture" },
  { value: "medical", label: "💊 Medical & Pharma" },
  { value: "automotive", label: "🔧 Automotive Parts" },
  { value: "cosmetics", label: "💄 Cosmetics & Beauty" },
  { value: "sports", label: "⚽ Sports & Fitness" },
  { value: "books", label: "📚 Books & Stationery" },
  { value: "fragile", label: "⚠️ Fragile & Glassware" },
  { value: "industrial", label: "🏭 Industrial & Machinery" },
];

const SectionHeader = ({ icon, title, subtitle }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, mt: 1 }}>
    <Box sx={{
      width: 40, height: 40, borderRadius: "12px",
      background: "linear-gradient(135deg, #1a237e, #1565c0)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: "1.2rem"
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a237e", lineHeight: 1.2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "#78909c" }}>{subtitle}</Typography>
      )}
    </Box>
  </Box>
);

const MotionPaper = motion.create(Paper);

const CreateParcel = () => {
  const navigate = useNavigate();
  const savedData = JSON.parse(localStorage.getItem("parcelForm"));
  const [loading, setLoading] = useState(false);
  const [originMapOpen, setOriginMapOpen] = useState(false);
  const [destMapOpen, setDestMapOpen] = useState(false);
  const [distance, setDistance] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const parcelPayload = { ...values };
      localStorage.setItem("parcelForm", JSON.stringify(values));
      const partnerPayload = {
        weight: Number(values.weight),
        pickup_city: values.originCity.toLowerCase(),
        delivery_city: values.destinationCity.toLowerCase(),
        delivery_speed: "standard",
        total_km: distance || 0
      };
      const response = await axios.post(`${import.meta.env.VITE_PARTNER_API_URL || 'http://127.0.0.1:8000'}/select-partner-langchain`, partnerPayload);
      navigate('/select-delivery-partner', {
        state: { parcelData: parcelPayload, partners: response.data?.data?.top_partners || [] }
      });
    } catch (error) {
      console.error("Partner API error:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "12px",
      border: state.isFocused ? "2px solid #1565c0" : "1px solid #cfd8dc",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(21,101,192,0.12)" : "none",
      padding: "4px 4px",
      fontSize: "15px",
      transition: "all 0.2s",
      "&:hover": { borderColor: "#1565c0" }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#1565c0" : state.isFocused ? "#e3f2fd" : "#fff",
      color: state.isSelected ? "#fff" : "#263238",
      borderRadius: "8px",
      margin: "2px 4px",
      width: "calc(100% - 8px)",
      cursor: "pointer"
    }),
    menu: (base) => ({ ...base, zIndex: 9999, borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      transition: "all 0.2s",
      "&:hover fieldset": { borderColor: "#1565c0" },
      "&.Mui-focused fieldset": { borderColor: "#1565c0", borderWidth: "2px" }
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
      py: 4
    }}>
      <Container maxWidth="sm">
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
              Create Shipment
            </Typography>
            <Typography variant="body2" sx={{ color: "#78909c", mt: 0.5 }}>
              Fill in the details to ship your parcel
            </Typography>
          </Box>
        </motion.div>

        <Formik
          initialValues={savedData || {
            category: '', product: '', weight: '', name: '',
            contact: '', originCity: '', destinationCity: '', distanceKm: '',
          }}
          enableReinitialize
          validationSchema={ParcelSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, handleChange, values, setFieldValue }) => {
            useEffect(() => {
              if (!values.originCity || !values.destinationCity) {
                setDistance(null);
                setDistanceLoading(false);
                return;
              }
              const fetchDistance = async () => {
                try {
                  setDistanceLoading(true);
                  const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/parcel/get-distance`, {
                    params: { origin: values.originCity, destination: values.destinationCity }
                  });
                  const km = res.data.distance_km;
                  setDistance(km);
                  setFieldValue("distanceKm", km.toFixed(2));
                } catch (err) {
                  console.error("Distance API error", err);
                  setDistance(null);
                } finally {
                  setDistanceLoading(false);
                }
              };
              fetchDistance();
            }, [values.originCity, values.destinationCity]);

            const filledFields = [values.category, values.product, values.weight, values.originCity, values.destinationCity, values.name, values.contact]
              .filter(Boolean).length;
            const progress = (filledFields / 7) * 100;

            return (
              <Form>
                {/* Progress */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600 }}>
                        Completion
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#1565c0", fontWeight: 700 }}>
                        {Math.round(progress)}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={progress}
                      sx={{
                        height: 6, borderRadius: 3,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          background: "linear-gradient(90deg, #1a237e, #1565c0, #42a5f5)"
                        }
                      }}
                    />
                  </Box>
                </motion.div>

                {/* Package Details */}
                <MotionPaper elevation={0}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  sx={{
                    p: 3, mb: 3, borderRadius: "20px",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
                  }}
                >
                  <SectionHeader icon={<InventoryIcon fontSize="small" />} title="Package Details" subtitle="What are you shipping?" />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#455a64", mb: 0.5, display: "block" }}>
                      Category
                    </Typography>
                    <Select
                      options={categoryOptions}
                      value={categoryOptions.find((o) => o.value === values.category)}
                      onChange={(opt) => setFieldValue("category", opt?.value)}
                      placeholder="Select category..."
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                      styles={selectStyles}
                    />
                    {touched.category && errors.category && (
                      <Typography color="error" variant="caption" sx={{ mt: 0.5, display: "block" }}>
                        {errors.category}
                      </Typography>
                    )}
                  </Box>

                  <TextField label="Product Name" name="product" fullWidth margin="dense"
                    value={values.product} onChange={handleChange}
                    error={touched.product && Boolean(errors.product)}
                    helperText={touched.product && errors.product}
                    placeholder="e.g. iPhone 15 Pro Max"
                    sx={textFieldSx}
                  />

                  <TextField label="Weight (kg)" name="weight" type="number" fullWidth margin="dense"
                    value={values.weight} onChange={handleChange}
                    error={touched.weight && Boolean(errors.weight)}
                    helperText={touched.weight && errors.weight}
                    placeholder="e.g. 2.5"
                    sx={textFieldSx}
                    slotProps={{
                      input: {
                        endAdornment: values.weight && (
                          <InputAdornment position="end">
                            <Chip label={
                              Number(values.weight) <= 10 ? "🏍️ Bike" :
                              Number(values.weight) <= 200 ? "🚐 Van" : "🚛 Truck"
                            } size="small" sx={{
                              fontWeight: 600, fontSize: "0.7rem",
                              background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                              color: "#1565c0"
                            }} />
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </MotionPaper>

                {/* Route Section */}
                <MotionPaper elevation={0}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  sx={{
                    p: 3, mb: 3, borderRadius: "20px",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
                  }}
                >
                  <SectionHeader icon={<RouteIcon fontSize="small" />} title="Shipping Route" subtitle="Where is it going?" />

                  <TextField label="Pickup Location" name="originCity" fullWidth margin="dense"
                    value={values.originCity}
                    onFocus={() => setOriginMapOpen(true)}
                    error={touched.originCity && Boolean(errors.originCity)}
                    helperText={touched.originCity && errors.originCity}
                    sx={textFieldSx}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <MyLocationIcon sx={{ color: "#43a047" }} />
                          </InputAdornment>
                        ),
                        endAdornment: values.originCity && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              setFieldValue("originCity", "");
                              setDistance(null);
                              setDistanceLoading(false);
                            }}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />

                  {values.originCity && values.destinationCity && (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
                      <Box sx={{
                        display: "flex", alignItems: "center", gap: 1,
                        px: 2, py: 0.5, borderRadius: "20px",
                        background: "linear-gradient(135deg, #e8eaf6, #e3f2fd)"
                      }}>
                        <Typography variant="caption" sx={{ color: "#1a237e", fontWeight: 600 }}>
                          {distanceLoading ? "Calculating..." : distance ? `${distance.toFixed(1)} KM` : ""}
                        </Typography>
                        {distanceLoading && <CircularProgress size={12} />}
                      </Box>
                    </Box>
                  )}

                  <TextField label="Drop-off Location" name="destinationCity" fullWidth margin="dense"
                    value={values.destinationCity}
                    onFocus={() => setDestMapOpen(true)}
                    error={touched.destinationCity && Boolean(errors.destinationCity)}
                    helperText={touched.destinationCity && errors.destinationCity}
                    sx={textFieldSx}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <FlagIcon sx={{ color: "#e53935" }} />
                          </InputAdornment>
                        ),
                        endAdornment: values.destinationCity && (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              setFieldValue("destinationCity", "");
                              setDistance(null);
                              setDistanceLoading(false);
                            }}>
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </MotionPaper>

                {/* Receiver Section */}
                <MotionPaper elevation={0}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  sx={{
                    p: 3, mb: 3, borderRadius: "20px",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
                  }}
                >
                  <SectionHeader icon={<PersonIcon fontSize="small" />} title="Receiver Info" subtitle="Who's receiving the parcel?" />

                  <TextField label="Full Name" name="name" fullWidth margin="dense"
                    value={values.name} onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    placeholder="e.g. John Doe"
                    sx={textFieldSx}
                  />

                  <TextField label="Phone Number" name="contact" fullWidth margin="dense"
                    value={values.contact} onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFieldValue('contact', val);
                    }}
                    error={touched.contact && Boolean(errors.contact)}
                    helperText={touched.contact && errors.contact}
                    placeholder="10-digit mobile number"
                    sx={textFieldSx}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" sx={{ color: "#78909c", fontWeight: 600 }}>+91</Typography>
                          </InputAdornment>
                        )
                      },
                      htmlInput: { maxLength: 10, inputMode: "numeric" }
                    }}
                  />
                </MotionPaper>

                {/* Submit */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <Button variant="contained" fullWidth type="submit" size="large"
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 1.8, borderRadius: "14px", fontWeight: 700, fontSize: "1rem",
                      textTransform: "none", letterSpacing: "0.5px",
                      background: "linear-gradient(135deg, #1a237e, #1565c0)",
                      boxShadow: "0 8px 32px rgba(21,101,192,0.3)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #0d1b6e, #0d47a1)",
                        boxShadow: "0 12px 40px rgba(21,101,192,0.4)",
                        transform: "translateY(-1px)"
                      },
                      transition: "all 0.3s ease"
                    }}
                  >
                    Continue to Delivery Partners
                  </Button>
                </motion.div>

                <MapModal open={originMapOpen} onClose={() => setOriginMapOpen(false)}
                  onSelect={(address) => setFieldValue("originCity", address)} />
                <MapModal open={destMapOpen} onClose={() => setDestMapOpen(false)}
                  onSelect={(address) => setFieldValue("destinationCity", address)} />
              </Form>
            );
          }}
        </Formik>

        <Backdrop open={loading} sx={{ color: "#fff", zIndex: 9999 }}>
          <Box textAlign="center">
            <Box sx={{
              width: 80, height: 80, borderRadius: "24px", mx: "auto", mb: 2,
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <CircularProgress sx={{ color: "#fff" }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Finding Best Partners
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Comparing rates across carriers...
            </Typography>
          </Box>
        </Backdrop>
      </Container>
    </Box>
  );
};

export default CreateParcel;
