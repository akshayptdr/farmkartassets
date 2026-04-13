import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '14px' },
          success: { style: { background: '#16a34a' } },
          error: { style: { background: '#dc2626' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
