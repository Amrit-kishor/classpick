import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SoundProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SoundProvider>
    </ThemeProvider>
  </StrictMode>
);
