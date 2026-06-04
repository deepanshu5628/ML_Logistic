import React, { useEffect, useState, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import {
  Container, Table, TableHead, TableRow, TableCell, TableBody,
  Select, MenuItem, Button, Typography, CircularProgress, Paper,
  Modal, Box, TextField, Chip, IconButton, InputAdornment, Tooltip
} from "@mui/material";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PlaceIcon from "@mui/icons-material/Place";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CommentIcon from "@mui/icons-material/Comment";
import SaveIcon from "@mui/icons-material/Save";
import InventoryIcon from "@mui/icons-material/Inventory";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CancelIcon from "@mui/icons-material/Cancel";
import FilterListIcon from "@mui/icons-material/FilterList";

const MotionBox = motion.create(Box);

const statusConfig = {
  PLACED: { color: "#1565c0", bg: "#e3f2fd", label: "Placed" },
  IN_TRANSIT: { color: "#e65100", bg: "#fff3e0", label: "In Transit" },
  DISPATCHED: { color: "#f9a825", bg: "#fffde7", label: "Dispatched" },
  OUT_FOR_DELIVERY: { color: "#6a1b9a", bg: "#f3e5f5", label: "Out for Delivery" },
  DELIVERED: { color: "#2e7d32", bg: "#e8f5e9", label: "Delivered" },
  CANCELLED: { color: "#c62828", bg: "#ffebee", label: "Cancelled" },
};

const ALL_STATUSES = ["PLACED", "IN_TRANSIT", "DISPATCHED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const StatusChip = ({ status }) => {
  const cfg = statusConfig[status] || { color: "#78909c", bg: "#eceff1", label: status };
  return (
    <Chip label={cfg.label} size="small" sx={{
      fontWeight: 700, fontSize: "0.7rem", bgcolor: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`
    }} />
  );
};

const AdminPanel = () => {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [openModal, setOpenModal] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [modalData, setModalData] = useState({ currentLocation: "", comment: "", statusDate: "" });

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axiosInstance.get("/parcel/allParcels");
        setParcels(res.data.data || []);
      } catch { toast.error("Failed to load parcels"); }
      finally { setLoading(false); }
    };
    fetchParcels();
  }, []);

  const formatLocalDateTime = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const handleChange = (parcel, newStatus) => {
    setSelectedParcel({ id: parcel._id, parcelId: parcel.parcelId, newStatus });
    const lastHistoryEntry = parcel.history?.length
      ? parcel.history[parcel.history.length - 1]
      : null;
    const lastDate = lastHistoryEntry
      ? new Date(lastHistoryEntry.updatedAt)
      : new Date(parcel.createdAt);
    const minDate = new Date(lastDate.getTime() + 60000);
    setModalData({
      currentLocation: "",
      comment: "",
      statusDate: formatLocalDateTime(minDate),
      minDateTime: formatLocalDateTime(minDate),
      minDateDisplay: minDate.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    });
    setOpenModal(true);
  };

  const handleModalSave = async () => {
    if (!modalData.currentLocation) { toast.warning("Current location is required"); return; }
    if (!modalData.statusDate) { toast.warning("Status date is required"); return; }

    if (modalData.minDateTime && modalData.statusDate < modalData.minDateTime) {
      toast.error(`Status date must be after ${modalData.minDateDisplay}`);
      return;
    }

    try {
      const res = await axiosInstance.patch(
        `/parcel/updateParcelStatus/${selectedParcel.parcelId}/status`,
        { status: selectedParcel.newStatus, currentLocation: modalData.currentLocation, comment: modalData.comment || "", statusDate: modalData.statusDate }
      );
      if (res.data.status === "success") {
        setParcels((prev) => prev.map((p) => p._id === res.data.data._id ? res.data.data : p));
        toast.success("Status updated successfully");
      } else { toast.error(res.data?.message || "Failed to update status"); }
      setOpenModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating parcel status");
    }
  };

  // Stats
  const totalParcels = parcels.length;
  const inTransitCount = parcels.filter(p => p.currentStatus === "IN_TRANSIT").length;
  const deliveredCount = parcels.filter(p => p.currentStatus === "DELIVERED").length;

  const stats = [
    { label: "Total", value: totalParcels, color: "#1565c0", bg: "#e3f2fd", icon: <InventoryIcon /> },
    { label: "In Transit", value: inTransitCount, color: "#e65100", bg: "#fff3e0", icon: <LocalShippingIcon /> },
    { label: "Delivered", value: deliveredCount, color: "#2e7d32", bg: "#e8f5e9", icon: <CheckCircleIcon /> },
  ];

  // Filtered parcels
  const filtered = useMemo(() => {
    return parcels.filter(p => {
      const matchSearch = !search ||
        p.parcelId?.toLowerCase().includes(search.toLowerCase()) ||
        p.product?.toLowerCase().includes(search.toLowerCase()) ||
        p.receiverName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || p.currentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [parcels, search, statusFilter]);

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      "&:hover fieldset": { borderColor: "#1565c0" },
      "&.Mui-focused fieldset": { borderColor: "#1565c0", borderWidth: "2px" }
    }
  };

  if (loading) return (
    <Box sx={{
      minHeight: "100vh", background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <Box textAlign="center">
        <CircularProgress sx={{ color: "#1565c0", mb: 2 }} />
        <Typography sx={{ color: "#78909c", fontWeight: 600 }}>Loading admin panel...</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: "18px",
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(21,101,192,0.3)"
            }}>
              <AdminPanelSettingsIcon sx={{ color: "#fff", fontSize: 28 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                Admin Panel
              </Typography>
              <Typography variant="body2" sx={{ color: "#78909c" }}>
                Manage and update all parcel shipments
              </Typography>
            </Box>
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2, mb: 4 }}>
            {stats.map((s, i) => (
              <Paper key={i} elevation={0} sx={{
                p: 2.5, borderRadius: "16px", textAlign: "center",
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                transition: "all 0.3s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }
              }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: "14px", mx: "auto", mb: 1,
                  bgcolor: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center"
                }}>{s.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600 }}>{s.label}</Typography>
              </Paper>
            ))}
          </Box>
        </motion.div>

        {/* Search & Filter */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Paper elevation={0} sx={{
            p: 2, mb: 3, borderRadius: "16px",
            background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center"
          }}>
            <TextField size="small" placeholder="Search by ID, product, or receiver..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              sx={{ ...textFieldSx, flex: 1, minWidth: 200 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: "#90a4ae" }} /></InputAdornment>,
                  endAdornment: search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearch("")}><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FilterListIcon sx={{ color: "#78909c", fontSize: 20 }} />
              <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: "12px", minWidth: 160, "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" } }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                {ALL_STATUSES.map(s => (
                  <MenuItem key={s} value={s}>{statusConfig[s]?.label || s}</MenuItem>
                ))}
              </Select>
            </Box>
            <Typography variant="caption" sx={{ color: "#90a4ae", fontWeight: 600 }}>
              Showing {filtered.length} of {parcels.length}
            </Typography>
          </Paper>
        </motion.div>

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Paper elevation={0} sx={{
            borderRadius: "20px", overflow: "hidden",
            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)"
          }}>
            <Box sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 1000 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8f9fc" }}>
                    {["Parcel ID", "Product", "Receiver", "Destination", "Ordered", "Expected", "Ordered By", "Delay", "Status", "Action"].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, color: "#1a237e", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 0.5, py: 2 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <InventoryIcon sx={{ fontSize: 48, color: "#c5cae9", mb: 1 }} />
                        <Typography sx={{ color: "#78909c", fontWeight: 600 }}>No parcels found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p, index) => (
                      <TableRow key={p._id} sx={{
                        transition: "all 0.2s",
                        "&:hover": { bgcolor: "#f5f7ff" },
                        borderBottom: "1px solid #f0f0f0"
                      }}>
                        <TableCell>
                          <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.8rem", color: "#455a64" }}>
                            {p.parcelId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>{p.product}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#455a64" }}>{p.receiverName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={p.destinationAddress || p.destinationCity || "N/A"} arrow>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150, color: "#455a64" }}>
                              {p.destinationAddress || p.destinationCity || "N/A"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#78909c" }}>
                            {new Date(p.createdAt).toLocaleDateString("en-GB").replace(/\//g, "-")}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#78909c" }}>
                            {p.expectedDeliveryDate ? new Date(p.expectedDeliveryDate).toLocaleDateString("en-GB").replace(/\//g, "-") : "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: "#455a64" }}>
                            {p.createdBy ? p.createdBy.name || "N/A" : "—"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#90a4ae" }}>
                            {p.createdBy?.email || ""}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {p.isDelayed ? (
                            <Chip icon={<WarningAmberIcon sx={{ fontSize: "14px !important", color: "#c62828 !important" }} />}
                              label="Delayed" size="small"
                              sx={{ fontWeight: 700, fontSize: "0.7rem", bgcolor: "#ffebee", color: "#c62828", border: "1px solid #ef9a9a" }}
                            />
                          ) : (
                            <Chip label="On Time" size="small"
                              sx={{ fontWeight: 600, fontSize: "0.7rem", bgcolor: "#e8f5e9", color: "#2e7d32" }}
                            />
                          )}
                        </TableCell>
                        <TableCell><StatusChip status={p.currentStatus} /></TableCell>
                        <TableCell>
                          <Select size="small" value={p.currentStatus}
                            onChange={(e) => handleChange(p, e.target.value)}
                            sx={{
                              borderRadius: "10px", fontSize: "0.75rem", minWidth: 140,
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e0e0e0" },
                              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#1565c0" }
                            }}
                          >
                            {ALL_STATUSES.map((s, idx, arr) => {
                              const currentIdx = arr.indexOf(p.currentStatus);
                              let isDisabled = idx < currentIdx || idx > currentIdx + 1;
                              if (s === "CANCELLED") isDisabled = false;
                              if (s === "CANCELLED" && p.currentStatus === "DELIVERED") isDisabled = true;
                              return (
                                <MenuItem key={s} value={s} disabled={isDisabled} sx={{ fontSize: "0.8rem" }}>
                                  {statusConfig[s]?.label || s}
                                </MenuItem>
                              );
                            })}
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </motion.div>
      </Container>

      {/* Update Status Modal */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <MotionBox
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          sx={{
            width: { xs: "90%", sm: 440 },
            borderRadius: "24px", overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            outline: "none"
          }}
        >
          {/* Modal Header */}
          <Box sx={{
            background: "linear-gradient(135deg, #1a237e, #1565c0)",
            px: 3, py: 2.5,
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "1.1rem" }}>
                Update Status
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                {selectedParcel?.parcelId} → {statusConfig[selectedParcel?.newStatus]?.label}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setOpenModal(false)}
              sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Modal Body */}
          <Box sx={{ bgcolor: "#fff", px: 3, py: 3 }}>
            <TextField fullWidth required label="Current Location"
              value={modalData.currentLocation}
              onChange={(e) => setModalData({ ...modalData, currentLocation: e.target.value })}
              margin="dense" placeholder="e.g. Delhi Hub, Mumbai Warehouse"
              sx={textFieldSx}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><PlaceIcon sx={{ color: "#e53935", fontSize: 20 }} /></InputAdornment>
                }
              }}
            />

            <TextField fullWidth required type="datetime-local" label="Status Date & Time"
              value={modalData.statusDate}
              onChange={(e) => {
                const val = e.target.value;
                if (modalData.minDateTime && val < modalData.minDateTime) {
                  toast.warning(`Cannot select date before ${modalData.minDateDisplay}`);
                  return;
                }
                setModalData({ ...modalData, statusDate: val });
              }}
              margin="dense"
              helperText={modalData.minDateDisplay ? `Must be after: ${modalData.minDateDisplay}` : ""}
              sx={{ ...textFieldSx, mt: 2 }}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  startAdornment: <InputAdornment position="start"><CalendarTodayIcon sx={{ color: "#78909c", fontSize: 20 }} /></InputAdornment>
                },
                htmlInput: {
                  min: modalData.minDateTime || undefined
                }
              }}
            />

            <TextField fullWidth label="Comment (Optional)"
              value={modalData.comment}
              onChange={(e) => setModalData({ ...modalData, comment: e.target.value })}
              margin="dense" placeholder="Any additional notes..."
              multiline rows={2}
              sx={{ ...textFieldSx, mt: 2 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><CommentIcon sx={{ color: "#78909c", fontSize: 20 }} /></InputAdornment>
                }
              }}
            />

            <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
              <Button variant="outlined" fullWidth onClick={() => setOpenModal(false)}
                sx={{
                  borderRadius: "12px", textTransform: "none", fontWeight: 700,
                  borderColor: "#c5cae9", color: "#1a237e", py: 1.3,
                  "&:hover": { borderColor: "#1a237e", bgcolor: "#e8eaf6" }
                }}
              >
                Cancel
              </Button>
              <Button variant="contained" fullWidth onClick={handleModalSave}
                startIcon={<SaveIcon />}
                sx={{
                  borderRadius: "12px", textTransform: "none", fontWeight: 700, py: 1.3,
                  background: "linear-gradient(135deg, #1a237e, #1565c0)",
                  boxShadow: "0 6px 24px rgba(21,101,192,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #0d1b6e, #0d47a1)" }
                }}
              >
                Save Update
              </Button>
            </Box>
          </Box>
        </MotionBox>
      </Modal>
    </Box>
  );
};

export default AdminPanel;
