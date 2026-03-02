import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary.jsx';
import { Layout } from './components/Layout.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { TrackPage } from './pages/TrackPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage.jsx';
import { ZohoCrmPage } from './pages/ZohoCrmPage.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/track/:shipmentNumber" element={<TrackPage />} />
            <Route path="/admin" element={<AdminPage />} />
          <Route path="/zoho" element={<ZohoCrmPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
