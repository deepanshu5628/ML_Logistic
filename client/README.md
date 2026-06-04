# Client — React Frontend

React 19 + Vite SPA with Redux state management, MUI components, Google Maps integration, and an AI chatbot popup.

---

## Folder Structure

```
client/
├── src/
│   ├── api/
│   │   ├── api.js              # API function wrappers
│   │   └── axiosInstance.js    # Axios with base URL + JWT header
│   ├── components/
│   │   ├── ChatbotPopup.jsx    # Floating AI chatbot (parcel Q&A + creation)
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   └── ParcelCard.jsx      # Reusable parcel display card
│   ├── features/
│   │   ├── authSlice.js        # Redux: user login/logout state
│   │   └── parcelSlice.js      # Redux: parcel list + invoice flag
│   ├── pages/
│   │   ├── Login.jsx           # Login page
│   │   ├── Signup.jsx          # Registration page
│   │   ├── Dashboard.jsx       # User dashboard with parcel cards + timeline
│   │   ├── CreateParcel.jsx    # Multi-step parcel creation form with Google Maps
│   │   ├── SelectDeliveryPartner.jsx  # AI-suggested partner selection + price prediction
│   │   ├── TrackParcel.jsx     # Parcel tracking by ID
│   │   └── AdminPanel.jsx      # Admin view to update parcel statuses
│   ├── store/
│   │   └── index.js            # Redux store setup
│   ├── App.jsx                 # Routes definition
│   └── main.jsx                # Entry point
└── .env.example
```

---

## Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT-based login |
| Signup | `/signup` | New user registration |
| Dashboard | `/` | All user parcels with status, timeline, invoice download |
| Create Parcel | `/create` | Form with Google Maps picker, auto distance calculation |
| Select Partner | `/select-delivery-partner` | Shows AI-selected top 3 partners, calls ML pricing API |
| Track Parcel | `/track` | Look up any parcel by ID |
| Admin Panel | `/admin` | Admin-only: update parcel status with location & date |

---

## Key Features

- Google Maps autocomplete + click-to-select for origin/destination
- Auto distance calculation via backend Google Distance Matrix API
- AI partner suggestions from LangChain agent (FastAPI)
- ML-based delivery cost prediction per partner
- Chatbot popup — tracks parcels, shows history, downloads invoices, creates parcels via conversation
- Animated UI with Framer Motion + MUI
- Form validation with Formik + Yup
- Toast notifications via react-toastify

---

## Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

**Required `.env` values:**

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_PARTNER_API_URL=http://127.0.0.1:8000
VITE_PRICING_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```
