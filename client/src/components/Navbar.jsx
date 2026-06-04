import React, { useState } from 'react';
import {
  AppBar, Toolbar, Button, Typography, Box, IconButton,
  Avatar, Menu, MenuItem, Tooltip, Switch
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/authSlice';
import { toggleInvoice } from '../features/parcelSlice';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleOpenMenu = (e) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const invoiceEnabled = useSelector((state) => state.parcel.invoiceEnabled);

  const handleLogout = () => {
    handleCloseMenu();
    dispatch(logout());
    navigate('/login');
  };

  const goTo = (path, requireAuth = false) => {
    if (requireAuth && !user) { navigate('/login'); return; }
    navigate(path);
  };

  return (
    <AppBar position="fixed" elevation={0}
      sx={{
        background: "linear-gradient(135deg, #1a237e, #1565c0)",
        boxShadow: "0 4px 20px rgba(21,101,192,0.2)",
        width: "100%",
        zIndex: 1100
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, px: { xs: 2, md: 3 } }}>
        {/* Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}
          onClick={() => goTo('/', false)}
        >
          <Box sx={{
            width: 36, height: 36, borderRadius: "10px",
            bgcolor: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <LocalShippingIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "-0.3px", color: "#fff" }}>
            Parcel Tracker
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {user?.isAdmin && (
            <Button color="inherit" onClick={() => goTo('/admin')}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: "10px", px: 2,
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
            >
              Admin Panel
            </Button>
          )}

          {!user?.isAdmin && user && location.pathname === '/dashboard' && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5,
                bgcolor: "rgba(255,255,255,0.1)", borderRadius: "10px", px: 1.5, py: 0.3 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
                  Invoice
                </Typography>
                <Switch size="small" checked={invoiceEnabled}
                  onChange={() => dispatch(toggleInvoice())}
                  sx={{
                    "& .MuiSwitch-thumb": { bgcolor: "#fff" },
                    "& .MuiSwitch-track": { bgcolor: "rgba(255,255,255,0.3)" },
                    "& .Mui-checked + .MuiSwitch-track": { bgcolor: "rgba(255,255,255,0.5) !important" }
                  }}
                />
              </Box>

              {/* <Button color="inherit" onClick={() => goTo('/create', true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: "10px", px: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
              >
                Create
              </Button> */}
              {/* <Button color="inherit" onClick={() => goTo('/track', true)}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: "10px", px: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
              >
                Track
              </Button> */}
            </>
          )}

          {user ? (
            <>
              <Tooltip title="Account">
                <IconButton onClick={handleOpenMenu} sx={{ p: 0, ml: 1 }}>
                  <Avatar sx={{
                    width: 36, height: 36, fontWeight: 700, fontSize: "0.9rem",
                    bgcolor: "rgba(255,255,255,0.2)", color: "#fff",
                    border: "2px solid rgba(255,255,255,0.3)"
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: "12px", mt: 1, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" } }}
              >
                <MenuItem onClick={() => { handleCloseMenu(); navigate('/dashboard'); }}
                  sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout}
                  sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#c62828" }}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: "10px", px: 2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
              >
                Login
              </Button>
              <Button onClick={() => navigate('/signup')}
                sx={{
                  ml: 0.5, textTransform: 'none', fontWeight: 700, borderRadius: "10px", px: 2.5,
                  bgcolor: "rgba(255,255,255,0.15)", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.3)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.25)" }
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
