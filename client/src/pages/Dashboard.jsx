import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import ChatbotPopup from '../components/ChatbotPopup';
import DownloadIcon from '@mui/icons-material/Download';
import {
  Container, Typography, CardContent, Grid, CircularProgress,
  Box, Divider, Chip, Collapse, IconButton, Button, Tooltip, Paper
} from '@mui/material';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineDot, TimelineContent,
} from '@mui/lab';
import { motion } from 'framer-motion';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ScaleIcon from '@mui/icons-material/Scale';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PlaceIcon from '@mui/icons-material/Place';
import AddIcon from '@mui/icons-material/Add';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion.create(Box);

const formatStatus = (status = '') =>
  status.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const statusConfig = {
  PLACED: { color: '#1565c0', bg: '#e3f2fd', icon: <InventoryIcon sx={{ fontSize: 16 }} /> },
  IN_TRANSIT: { color: '#e65100', bg: '#fff3e0', icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
  DISPATCHED: { color: '#f9a825', bg: '#fffde7', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> },
  OUT_FOR_DELIVERY: { color: '#6a1b9a', bg: '#f3e5f5', icon: <LocalShippingIcon sx={{ fontSize: 16 }} /> },
  DELIVERED: { color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
  CANCELLED: { color: '#c62828', bg: '#ffebee', icon: <CancelIcon sx={{ fontSize: 16 }} /> },
};

const getStatusStyle = (status) => statusConfig[status] || { color: '#78909c', bg: '#eceff1', icon: <PendingActionsIcon sx={{ fontSize: 16 }} /> };

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const invoiceEnabled = useSelector((state) => state.parcel.invoiceEnabled);
  const navigate = useNavigate();

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await axiosInstance.get(`/parcel/myParcels`);
        if (res.data?.status === 'success') setParcels(res.data.data || []);
        else toast.error('Failed to fetch parcels');
      } catch (err) {
        console.error('Error fetching user parcels', err);
        toast.error('Unable to load parcels');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchParcels();
  }, [user]);

  const handleDownloadInvoice = async (parcelId) => {
    try {
      const response = await axiosInstance.get(`/parcel/invoice/${parcelId}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${parcelId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Invoice download failed', error);
      toast.error('Failed to download invoice');
    }
  };

  // Stats
  const totalParcels = parcels.length;
  const deliveredCount = parcels.filter(p => p.currentStatus === 'DELIVERED').length;
  const inTransitCount = parcels.filter(p => p.currentStatus === 'IN_TRANSIT').length;

  const stats = [
    { label: 'Total', value: totalParcels, color: '#1565c0', bg: '#e3f2fd', icon: <InventoryIcon /> },
    { label: 'In Transit', value: inTransitCount, color: '#e65100', bg: '#fff3e0', icon: <LocalShippingIcon /> },
    { label: 'Delivered', value: deliveredCount, color: '#2e7d32', bg: '#e8f5e9', icon: <CheckCircleIcon /> },
  ];

  if (loading) return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Box textAlign="center">
        <CircularProgress sx={{ color: "#1565c0", mb: 2 }} />
        <Typography sx={{ color: "#78909c", fontWeight: 600 }}>Loading your shipments...</Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Box sx={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)",
        py: 4
      }}>
        <Container maxWidth="lg">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: "18px",
                  background: "linear-gradient(135deg, #1a237e, #1565c0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(21,101,192,0.3)"
                }}>
                  <DashboardIcon sx={{ color: "#fff", fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                    Welcome back, {user?.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#78909c" }}>
                    Here's an overview of your shipments
                  </Typography>
                </Box>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />}
                onClick={() => navigate('/create')}
                sx={{
                  borderRadius: "12px", textTransform: "none", fontWeight: 700,
                  px: 3, py: 1.2,
                  background: "linear-gradient(135deg, #1a237e, #1565c0)",
                  boxShadow: "0 6px 24px rgba(21,101,192,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #0d1b6e, #0d47a1)", transform: "translateY(-1px)" },
                  transition: "all 0.3s"
                }}
              >
                New Shipment
              </Button>
            </Box>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {stats.map((s, i) => (
                <Grid item xs={6} sm={3} key={i}>
                  <Paper elevation={0} sx={{
                    p: 2.5, borderRadius: "16px", textAlign: "center",
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                    transition: "all 0.3s",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }
                  }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "14px", mx: "auto", mb: 1,
                      bgcolor: s.bg, color: s.color,
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {s.icon}
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: "#78909c", fontWeight: 600 }}>{s.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </motion.div>

          {/* Parcels */}
          {parcels.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Paper elevation={0} sx={{
                p: 6, borderRadius: "20px", textAlign: "center",
                background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.6)"
              }}>
                <InventoryIcon sx={{ fontSize: 64, color: "#c5cae9", mb: 2 }} />
                <Typography variant="h6" sx={{ color: "#1a237e", fontWeight: 700 }}>No shipments yet</Typography>
                <Typography variant="body2" sx={{ color: "#78909c", mb: 3 }}>Create your first parcel to get started</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/create')}
                  sx={{
                    borderRadius: "12px", textTransform: "none", fontWeight: 700,
                    background: "linear-gradient(135deg, #1a237e, #1565c0)",
                    "&:hover": { background: "linear-gradient(135deg, #0d1b6e, #0d47a1)" }
                  }}
                >
                  Create Shipment
                </Button>
              </Paper>
            </motion.div>
          ) : (
            <Box sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)"
              },
              gap: 2.5
            }}>
              {parcels.map((parcel, index) => {
                const ss = getStatusStyle(parcel.currentStatus);
                const isExpanded = expanded[parcel._id];

                return (
                  <MotionBox key={parcel._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    sx={{ minWidth: 0, overflow: "hidden" }}
                  >
                    <Paper elevation={0} sx={{
                      borderRadius: "20px", overflow: "hidden", width: "100%",
                      display: "flex", flexDirection: "column",
                          background: "rgba(255,255,255,0.85)",
                          backdropFilter: "blur(20px)",
                          border: "1px solid rgba(255,255,255,0.6)",
                          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                          transition: "all 0.3s",
                          "&:hover": { boxShadow: "0 8px 40px rgba(0,0,0,0.1)", transform: "translateY(-2px)" }
                        }}>
                          {/* Card Header */}
                          <Box sx={{
                            px: 2.5, py: 2,
                            background: `linear-gradient(135deg, ${ss.color}08, ${ss.color}15)`,
                            borderBottom: `2px solid ${ss.color}20`,
                            display: "flex", justifyContent: "space-between", alignItems: "flex-start"
                          }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                                <Tooltip title={parcel.parcelId} arrow>
                                  <Typography variant="body2" noWrap sx={{
                                    fontWeight: 700, color: "#455a64", fontFamily: "monospace",
                                    maxWidth: 140, cursor: "pointer"
                                  }}>
                                    {parcel.parcelId}
                                  </Typography>
                                </Tooltip>
                              </Box>
                              <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                <Chip label={(parcel.deliveryPartner || 'N/A').toUpperCase()} size="small"
                                  sx={{
                                    fontSize: '0.65rem', fontWeight: 700, height: 22,
                                    bgcolor: "#e8eaf6", color: "#1a237e"
                                  }}
                                />
                                <Chip
                                  icon={parcel.serviceType === 'express' ? <FlashOnIcon sx={{ fontSize: "12px !important", color: "#e65100 !important" }} /> : undefined}
                                  label={(parcel.serviceType || 'N/A').toUpperCase()} size="small"
                                  sx={{
                                    fontSize: '0.65rem', fontWeight: 700, height: 22,
                                    bgcolor: parcel.serviceType === 'express' ? '#fff3e0' : '#f5f5f5',
                                    color: parcel.serviceType === 'express' ? '#e65100' : '#78909c'
                                  }}
                                />
                              </Box>
                            </Box>
                            <IconButton size="small" onClick={() => toggleExpand(parcel._id)}
                              sx={{
                                bgcolor: "#f5f5f5", ml: 1,
                                "&:hover": { bgcolor: "#e0e0e0" }
                              }}
                            >
                              <ExpandMoreIcon sx={{
                                fontSize: 20,
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: '0.3s'
                              }} />
                            </IconButton>
                          </Box>

                          {/* Card Body */}
                          <CardContent sx={{ flex: 1, px: 2.5, py: 2, overflow: "hidden" }}>
                            {/* Product */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <Box sx={{
                                width: 32, height: 32, borderRadius: "10px",
                                background: "linear-gradient(135deg, #1a237e, #1565c0)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
                                <CategoryIcon sx={{ color: "#fff", fontSize: 16 }} />
                              </Box>
                              <Typography sx={{ fontWeight: 700, color: "#263238", fontSize: "1rem" }}>
                                {parcel.product || 'N/A'}
                              </Typography>
                            </Box>

                            {/* Status + Delayed */}
                            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.5, flexWrap: "wrap" }}>
                              <Chip
                                icon={React.cloneElement(ss.icon, { sx: { fontSize: "14px !important", color: `${ss.color} !important` } })}
                                label={formatStatus(parcel.currentStatus)}
                                size="small"
                                sx={{
                                  fontWeight: 700, fontSize: "0.75rem",
                                  bgcolor: ss.bg, color: ss.color,
                                  border: `1px solid ${ss.color}30`
                                }}
                              />
                              {parcel.isDelayed && (
                                <Chip icon={<WarningAmberIcon sx={{ fontSize: "14px !important", color: "#c62828 !important" }} />}
                                  label="Delayed" size="small"
                                  sx={{
                                    fontWeight: 700, fontSize: "0.75rem",
                                    bgcolor: "#ffebee", color: "#c62828",
                                    border: "1px solid #ef9a9a"
                                  }}
                                />
                              )}
                            </Box>

                            {/* Details */}
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.8, mb: 1.5 }}>
                              <Tooltip title={parcel.destinationAddress || parcel.destinationCity || 'N/A'} arrow>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, minWidth: 0, overflow: "hidden" }}>
                                  <PlaceIcon sx={{ fontSize: 16, color: "#e53935" }} />
                                  <Typography variant="body2" noWrap sx={{
                                    color: "#455a64", cursor: "pointer",
                                    overflow: "hidden", textOverflow: "ellipsis", minWidth: 0
                                  }}>
                                    {parcel.destinationAddress || parcel.destinationCity || 'N/A'}
                                  </Typography>
                                </Box>
                              </Tooltip>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <ScaleIcon sx={{ fontSize: 16, color: "#78909c" }} />
                                <Typography variant="body2" sx={{ color: "#455a64" }}>
                                  {parcel.weight} kg
                                </Typography>
                              </Box>
                              {parcel.cost != null && (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                  <CurrencyRupeeIcon sx={{ fontSize: 16, color: "#1565c0" }} />
                                  <Typography variant="body2" sx={{ color: "#1565c0", fontWeight: 700 }}>
                                    ₹{Number(parcel.cost).toLocaleString("en-IN")}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                <CalendarTodayIcon sx={{ fontSize: 16, color: "#78909c" }} />
                                <Typography variant="body2" sx={{ color: "#455a64" }}>
                                  {new Date(parcel.expectedDeliveryDate).toLocaleString("en-GB", {
                                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                                  })}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Invoice */}
                            <Button variant="outlined" size="small" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                              disabled={!invoiceEnabled}
                              onClick={() => handleDownloadInvoice(parcel.parcelId)}
                              sx={{
                                borderRadius: "10px", textTransform: "none", fontWeight: 600,
                                fontSize: "0.75rem", mb: 1.5,
                                borderColor: "#c5cae9", color: "#1a237e",
                                "&:hover": { borderColor: "#1a237e", bgcolor: "#e8eaf6" },
                                "&:disabled": { borderColor: "#e0e0e0", color: "#bdbdbd" }
                              }}
                            >
                              Download Invoice
                            </Button>

                            <Divider sx={{ mb: 1.5, borderColor: "#f0f0f0" }} />

                            {/* Mini Timeline */}
                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#1a237e", textTransform: "uppercase", letterSpacing: 0.5 }}>
                              Recent Updates
                            </Typography>

                            {parcel.history?.length > 0 ? (
                              <Timeline sx={{ p: 0, mt: 0.5, mb: 0,
                                "& .MuiTimelineItem-root:before": { display: "none" }
                              }}>
                                {parcel.history.slice(-3).reverse().map((h, i) => {
                                  const hs = getStatusStyle(h.status);
                                  return (
                                    <TimelineItem key={i} sx={{ minHeight: 48 }}>
                                      <TimelineSeparator>
                                        <TimelineDot sx={{
                                          bgcolor: hs.bg, boxShadow: "none",
                                          border: `2px solid ${hs.color}`,
                                          p: 0.3
                                        }}>
                                          {React.cloneElement(hs.icon, { sx: { fontSize: 12, color: hs.color } })}
                                        </TimelineDot>
                                        {i < 2 && <TimelineConnector sx={{ bgcolor: "#e0e0e0" }} />}
                                      </TimelineSeparator>
                                      <TimelineContent sx={{ py: 0.5, px: 1.5 }}>
                                        <Tooltip title={h.currentLocation || 'N/A'} arrow>
                                          <Typography variant="body2" noWrap sx={{
                                            fontWeight: 600, color: "#263238", fontSize: "0.8rem",
                                            maxWidth: 160, cursor: "pointer"
                                          }}>
                                            {formatStatus(h.status)}
                                          </Typography>
                                        </Tooltip>
                                        <Typography variant="caption" sx={{ color: "#90a4ae", fontSize: "0.7rem" }}>
                                          {h.currentLocation || 'N/A'} • {new Date(h.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                        </Typography>
                                      </TimelineContent>
                                    </TimelineItem>
                                  );
                                })}
                              </Timeline>
                            ) : (
                              <Typography variant="body2" sx={{ color: "#90a4ae", mt: 1 }}>No updates yet</Typography>
                            )}

                            {/* Expanded Full History */}
                            <Collapse in={isExpanded} timeout="auto">
                              <Box sx={{
                                mt: 2, p: 2, borderRadius: "14px",
                                bgcolor: "#fafafa", border: "1px solid #f0f0f0"
                              }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a237e", mb: 1.5 }}>
                                  Full Tracking History
                                </Typography>
                                {parcel.history.slice().reverse().map((h, i) => {
                                  const hs = getStatusStyle(h.status);
                                  return (
                                    <Box key={i} sx={{
                                      py: 1.5, borderBottom: i < parcel.history.length - 1 ? "1px solid #eee" : "none"
                                    }}>
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                                        <Box sx={{
                                          width: 24, height: 24, borderRadius: "8px", flexShrink: 0,
                                          bgcolor: hs.bg, display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                          {React.cloneElement(hs.icon, { sx: { fontSize: 12, color: hs.color } })}
                                        </Box>
                                        <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: "#263238" }}>
                                          {formatStatus(h.status)}
                                        </Typography>
                                      </Box>
                                      <Typography variant="caption" noWrap sx={{ color: "#90a4ae", ml: 4.5, display: "block" }}>
                                        → {h.currentLocation || 'N/A'}
                                      </Typography>
                                      {h.comment && (
                                        <Typography variant="caption" sx={{ color: "#78909c", ml: 4.5, display: "block", wordBreak: "break-word" }}>
                                          {h.comment}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" sx={{ color: "#bdbdbd", ml: 4.5, display: "block" }}>
                                        {new Date(h.updatedAt).toLocaleDateString('en-GB').replace(/\//g, '-')},{' '}
                                        {new Date(h.updatedAt).toLocaleTimeString()}
                                      </Typography>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Collapse>
                          </CardContent>
                        </Paper>
                      </MotionBox>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>

      <ChatbotPopup user={user} />
    </>
  );
};

export default Dashboard;
