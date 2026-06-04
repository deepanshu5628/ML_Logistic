import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/index';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import toastify styles

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Provider store={store}>
          <App />
          {/* ✅ Global Toast container (one place only) */}
          <ToastContainer position="top-right" autoClose={3000} />
        </Provider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
