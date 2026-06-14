import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PublicAnalyticsPage from './pages/PublicAnalyticsPage';
import WorkspacesPage from './pages/WorkspacesPage';
import FavoritesPage from './pages/FavoritesPage';
import QRGalleryPage from './pages/QRGalleryPage';
import ActivityFeedPage from './pages/ActivityFeedPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/public/analytics/:shortCode" element={<PublicAnalyticsPage />} />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workspaces" 
            element={
              <ProtectedRoute>
                <WorkspacesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/favorites" 
            element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/qr-gallery" 
            element={
              <ProtectedRoute>
                <QRGalleryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activity-log" 
            element={
              <ProtectedRoute>
                <ActivityFeedPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics/:id" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
