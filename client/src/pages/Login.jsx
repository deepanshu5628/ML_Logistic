import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../features/authSlice';
import {
  TextField, Button, Typography, Box, Alert, CircularProgress,
  InputAdornment, IconButton, Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InventoryIcon from '@mui/icons-material/Inventory';
import RouteIcon from '@mui/icons-material/Route';
import SpeedIcon from '@mui/icons-material/Speed';

const MotionBox = motion.create(Box);

const FeatureItem = ({ icon, title, desc }) => (
  <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
    <Box sx={{
      width: 36, height: 36, borderRadius: "10px", flexShrink: 0,
      bgcolor: "rgba(255,255,255,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      {icon}
    </Box>
    <Box>
      <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: "0.9rem" }}>{title}</Typography>
      <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>{desc}</Typography>
    </Box>
  </Box>
);

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = (e) => { e.preventDefault(); dispatch(loginUser(form)); };

  useEffect(() => {
    if (user && token) navigate(user.isAdmin ? '/admin' : '/dashboard');
  }, [user, token, navigate]);

  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px", bgcolor: "#f8f9fc",
      "&:hover fieldset": { borderColor: "#1565c0" },
      "&.Mui-focused fieldset": { borderColor: "#1565c0", borderWidth: "2px" }
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh", display: "flex",
      background: "linear-gradient(160deg, #e8eaf6 0%, #e3f2fd 40%, #f5f5f5 100%)"
    }}>
      {/* Left Branding Panel */}
      <Box sx={{
        display: { xs: "none", md: "flex" },
        width: "45%", flexDirection: "column", justifyContent: "center",
        px: 6, py: 4,
        background: "linear-gradient(160deg, #0d1b6e 0%, #1a237e 40%, #1565c0 100%)",
        position: "relative", overflow: "hidden"
      }}>
        {/* Decorative circles */}
        <Box sx={{
          position: "absolute", top: -80, right: -80, width: 250, height: 250,
          borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)"
        }} />
        <Box sx={{
          position: "absolute", bottom: -60, left: -60, width: 200, height: 200,
          borderRadius: "50%", bgcolor: "rgba(255,255,255,0.03)"
        }} />

        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: "14px",
              bgcolor: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <LocalShippingIcon sx={{ color: "#fff", fontSize: 26 }} />
            </Box>
            <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.5rem" }}>
              Parcel Tracker
            </Typography>
          </Box>

          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "2.2rem", lineHeight: 1.2, mb: 1 }}>
            Ship smarter,{"\n"}track faster.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "1rem", mb: 5, maxWidth: 380 }}>
            Real-time tracking, AI-powered delivery partner selection, and instant invoicing — all in one place.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <FeatureItem
              icon={<InventoryIcon sx={{ color: "#fff", fontSize: 18 }} />}
              title="Smart Tracking"
              desc="Track every parcel with real-time status updates"
            />
            <FeatureItem
              icon={<RouteIcon sx={{ color: "#fff", fontSize: 18 }} />}
              title="AI Route Optimization"
              desc="Best delivery partners selected automatically"
            />
            <FeatureItem
              icon={<SpeedIcon sx={{ color: "#fff", fontSize: 18 }} />}
              title="Instant Invoicing"
              desc="Generate and download invoices in seconds"
            />
          </Box>
        </motion.div>
      </Box>

      {/* Right Form Panel */}
      <Box sx={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", px: 3
      }}>
        <MotionBox
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          sx={{ width: "100%", maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 3, justifyContent: "center" }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "14px",
              background: "linear-gradient(135deg, #1a237e, #1565c0)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <LocalShippingIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.3rem", color: "#1a237e" }}>
              Parcel Tracker
            </Typography>
          </Box>

          <Paper elevation={0} sx={{
            p: 4, borderRadius: "24px",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)"
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: "1.6rem", color: "#1a237e", mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography sx={{ color: "#78909c", fontSize: "0.9rem", mb: 3 }}>
              Sign in to manage your shipments
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Email" name="email" fullWidth margin="dense"
                value={form.email} onChange={handleChange} required
                placeholder="you@example.com"
                sx={textFieldSx}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: "#90a4ae", fontSize: 20 }} />
                      </InputAdornment>
                    )
                  }
                }}
              />

              <TextField
                label="Password" name="password" fullWidth margin="dense"
                type={showPassword ? "text" : "password"}
                value={form.password} onChange={handleChange} required
                placeholder="Enter your password"
                sx={{ ...textFieldSx, mt: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: "#90a4ae", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOffIcon sx={{ fontSize: 20 }} /> : <VisibilityIcon sx={{ fontSize: 20 }} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />

              <Button variant="contained" type="submit" fullWidth size="large"
                disabled={loading}
                endIcon={!loading && <ArrowForwardIcon />}
                sx={{
                  mt: 3, py: 1.6, borderRadius: "14px", fontWeight: 700,
                  fontSize: "1rem", textTransform: "none",
                  background: "linear-gradient(135deg, #1a237e, #1565c0)",
                  boxShadow: "0 8px 32px rgba(21,101,192,0.3)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #0d1b6e, #0d47a1)",
                    boxShadow: "0 12px 40px rgba(21,101,192,0.4)",
                    transform: "translateY(-1px)"
                  },
                  transition: "all 0.3s"
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Sign In"}
              </Button>
            </Box>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Typography variant="body2" sx={{ color: "#78909c" }}>
                Don't have an account?{" "}
                <Typography component="span" onClick={() => navigate('/signup')}
                  sx={{
                    color: "#1565c0", fontWeight: 700, cursor: "pointer",
                    "&:hover": { textDecoration: "underline" }
                  }}
                >
                  Create one
                </Typography>
              </Typography>
            </Box>
          </Paper>
        </MotionBox>
      </Box>
    </Box>
  );
};

export default Login;
