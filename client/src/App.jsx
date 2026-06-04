import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CreateParcel from './pages/CreateParcel';
import TrackParcel from './pages/TrackParcel';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard'; // ✅ import dashboard
import { loginUser } from './features/authSlice';
import SelectDeliveryPartner from './pages/SelectDeliveryPartner';



const App = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !token) {
      // Optionally restore session here
    }
  }, [dispatch, token]);

  return (
    <>
      <Navbar />
      <Box sx={{ pt: '64px' }}>
      <Routes>
        {/* Default route — redirect based on auth */}
        <Route
          path="/"
          element={
            user ? (
              user.isAdmin ? (
                <Navigate to="/admin" />
              ) : (
                <Navigate to="/dashboard" /> // ✅ redirect to dashboard
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />} // ✅ added
        />
        <Route
          path="/create"
          element={user ? <CreateParcel /> : <Navigate to="/login" />}
        />
        <Route path="/select-delivery-partner" element={<SelectDeliveryPartner />} />
        <Route
          path="/track"
          element={user ? <TrackParcel /> : <Navigate to="/login" />}
        />
        <Route
          path="/admin"
          element={user?.isAdmin ? <AdminPanel /> : <Navigate to="/login" />}
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Box>
    </>
  );
};

export default App;
