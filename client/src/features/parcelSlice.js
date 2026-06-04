import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../api/axiosInstance';

/* ===============================
   ASYNC THUNKS
================================ */

// ✅ Create new parcel
export const createParcel = createAsyncThunk(
  'parcel/create',
  async (parcelData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/parcel/createParcel', parcelData);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to create parcel'
      );
    }
  }
);

// ✅ Track parcel by tracking ID
export const getParcelByTrackingId = createAsyncThunk(
  'parcel/getById',
  async (trackingId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/parcel/track/${trackingId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Parcel not found'
      );
    }
  }
);

/* ===============================
   SLICE
================================ */

const parcelSlice = createSlice({
  name: 'parcel',
  initialState: {
    parcels: [],
    currentParcel: null,
    loading: false,
    error: null,

    // 🔴 Invoice toggle (persisted)
    invoiceEnabled:
      JSON.parse(localStorage.getItem('invoiceEnabled')) ?? false,
  },

  reducers: {
    toggleInvoice(state) {
      state.invoiceEnabled = !state.invoiceEnabled;
      localStorage.setItem(
        'invoiceEnabled',
        JSON.stringify(state.invoiceEnabled)
      );
    },

    enableInvoice(state) {
      state.invoiceEnabled = true;
      localStorage.setItem('invoiceEnabled', 'true');
    },

    disableInvoice(state) {
      state.invoiceEnabled = false;
      localStorage.setItem('invoiceEnabled', 'false');
    },
  },

  extraReducers: (builder) => {
    builder
      /* ===============================
         CREATE PARCEL
      ================================ */
      .addCase(createParcel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createParcel.fulfilled, (state, action) => {
        state.loading = false;
        state.parcels.push(action.payload);
      })
      .addCase(createParcel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ===============================
         TRACK PARCEL
      ================================ */
      .addCase(getParcelByTrackingId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getParcelByTrackingId.fulfilled, (state, action) => {
        state.loading = false;
        state.currentParcel = action.payload;
      })
      .addCase(getParcelByTrackingId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* ===============================
   EXPORT ACTIONS & REDUCER
================================ */

export const {
  toggleInvoice,
  enableInvoice,
  disableInvoice,
} = parcelSlice.actions;

export default parcelSlice.reducer;