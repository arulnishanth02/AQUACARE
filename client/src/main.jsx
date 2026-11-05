import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AIProvider } from './context/AIContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AIProvider>
      <App />
    </AIProvider>
  </React.StrictMode>
);

