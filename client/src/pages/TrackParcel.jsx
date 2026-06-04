import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Container,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Divider,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
  TimelineContent, TimelineDot, TimelineOppositeContent
} from '@mui/lab';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CancelIcon from '@mui/icons-material/Cancel';
import InventoryIcon from '@mui/icons-material/Inventory';

const TrackParcel = () => {
  const [trackingId, setTrackingId] = useState('');
  const [parcel, setParcel] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSearch = async () => {
    try {
      if (!trackingId.trim()) {
        toast.warn('Please enter a tracking ID');
        return;
      }

      const res = await axiosInstance.get(`/parcel/track/${trackingId}`);
      if (res.data?.status === 'success') {
        setParcel(res.data.data);
        toast.success('Parcel found!');
      } else {
        setParcel(null);
        toast.error('Parcel not found');
      }
    } catch (err) {
      console.error('Error tracking parcel:', err);
      toast.error('Invalid tracking ID or parcel not found');
    }
  };

  const handleProductSearch = async () => {
    if (!searchTerm.trim()) {
      toast.warn('Please enter a product name');
      return;
    }

    try {
      const res = await axiosInstance.get(`/parcel/search?query=${searchTerm}`);
      if (res.data.status === 'success' && res.data.data.length > 0) {
        setSearchResults(res.data.data);
        setDrawerOpen(true);
      } else {
        toast.info('No parcels found for this product');
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Error searching parcels');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED': return 'info';
      case 'IN_TRANSIT': return 'primary';
      case 'DISPATCHED': return 'warning';
      case 'OUT_FOR_DELIVERY': return 'secondary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'grey';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLACED': return <InventoryIcon />;
      case 'IN_TRANSIT':
      case 'OUT_FOR_DELIVERY': return <LocalShippingIcon />;
      case 'DISPATCHED': return <PendingActionsIcon />;
      case 'DELIVERED': return <CheckCircleIcon />;
      case 'CANCELLED': return <CancelIcon />;
      default: return <PendingActionsIcon />;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 5 }}>
      <Typography variant="h4" gutterBottom>
        Track Parcel
      </Typography>

      <TextField
        label="Enter Tracking ID"
        fullWidth
        margin="normal"
        value={trackingId}
        onChange={(e) => setTrackingId(e.target.value)}
      />
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSearch}>
        Track
      </Button>

      {/* 🔍 Search by Product */}
      <Typography variant="h6" sx={{ mt: 4 }}>Or Search by Product</Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <TextField
          label="Enter Product Name"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="outlined" onClick={handleProductSearch}>
          Search
        </Button>
      </Box>

      {/* 🧭 Drawer with product search results */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 350, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Matching Parcels</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ my: 1 }} />
          <List>
            {searchResults.map((p) => (
              <ListItem
                button
                key={p.parcelId}
                onClick={() => {
                  setTrackingId(p.parcelId);
                  handleSearch();
                  setDrawerOpen(false);
                }}
              >
                <ListItemText
                  primary={`${p.product} (${p.currentStatus})`}
                  secondary={`Parcel ID: ${p.parcelId}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 🧾 Parcel Details + Timeline */}
      {parcel && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card sx={{ mt: 4, p: 2, boxShadow: 4, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Parcel Details
              </Typography>
              <Typography>Parcel ID: {parcel.parcelId}</Typography>
              <Typography>Status: {parcel.currentStatus}</Typography>
              <Typography>Recipient: {parcel.receiverName}</Typography>
              <Typography>Destination: {parcel.destinationAddress}</Typography>
              <Typography>Weight: {parcel.weight} kg</Typography>
              <Typography>Description: {parcel.description}</Typography>

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Delivery Timeline
              </Typography>

              {parcel.history?.length > 0 ? (
                <Timeline position="alternate">
                  {parcel.history.slice().reverse().map((h, i) => (
                    <TimelineItem key={i}>
                      <TimelineOppositeContent color="text.secondary">
                        {new Date(h.updatedAt).toLocaleString()}
                      </TimelineOppositeContent>

                      <TimelineSeparator>
                        <TimelineDot color={getStatusColor(h.status)}>
                          {getStatusIcon(h.status)}
                        </TimelineDot>

                        {i < parcel.history.length - 1 && (
                          <TimelineConnector sx={{ bgcolor: `${getStatusColor(h.status)}.main` }} />
                        )}
                      </TimelineSeparator>

                      <TimelineContent>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.1 }}
                        >
                          <Box
                            sx={{
                              bgcolor: `${getStatusColor(h.status)}.lighter`,
                              borderRadius: 3,
                              p: 2.5,                     // Bigger padding
                              boxShadow: 2,
                              width: "100%",              // Full width
                              minWidth: "280px",          // Ensures good size
                              maxWidth: "100%",
                              fontSize: "1rem"            // Bigger text
                            }}
                          >
                            {/* Status */}
                            <Typography variant="body1" fontWeight="bold">
                              {h.status}
                            </Typography>

                            {/* ⭐ Current Location */}
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              <strong>Current Location:</strong> {h.currentLocation || 'N/A'}
                            </Typography>

                            {/* ⭐ Comment */}
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              <strong>Comment:</strong> {h.comment || 'No comment'}
                            </Typography>

                            {/* Updated By */}
                            {h.updatedBy && (
                              <Typography variant="caption" color="text.secondary">
                                Updated by: {h.updatedBy.name || 'System'}
                              </Typography>
                            )}
                          </Box>
                        </motion.div>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              ) : (
                <Typography>No history available</Typography>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Container>
  );
};

export default TrackParcel;
