import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AIProvider } from './context/AIContext';
import { ThemeProvider } from './context/ThemeContext';
import { PondProvider } from './context/PondContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <PondProvider>
        <AIProvider>
          <App />
        </AIProvider>
      </PondProvider>
    </ThemeProvider>
  </React.StrictMode>
);

