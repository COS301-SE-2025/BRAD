import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ReporterDashboard from './pages/ReporterDashboard';
import ReportPage from './pages/ReportPage';
import AboutPage from './pages/About';
import InvestigatorDashboard from './pages/InvestigatorDashboard';
import UserSettings from './pages/UserSettings';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';
import ResetPasswordPage from './pages/ResetPasswordPage';
import InvestigatorStats from './pages/InvestigatorStats';
import Help from './pages/Help';
import NotAuthorized from './pages/NotAuthorized';


import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/not-authorized" element={<NotAuthorized />} />
        <Route path="/help/:role" element={<Help />} />

        {/* Reporter-only */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['general']}>
              <ReporterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute allowedRoles={['general']}>
              <ReportPage />
            </ProtectedRoute>
          }
        />

        {/* Investigator-only */}
        <Route
          path="/investigator"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <InvestigatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigator/pending"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <InvestigatorDashboard view="pending" />
            </ProtectedRoute>
          }
        />

         <Route
          path="/investigator/in_progress"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <InvestigatorDashboard view="in_progress" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigator/reviewed"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <InvestigatorDashboard view="reviewed" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigator/settings"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <UserSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigator/stats"
          element={
            <ProtectedRoute allowedRoles={['investigator']}>
              <InvestigatorStats />
            </ProtectedRoute>
          }
        />

        {/* Admin-only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* General logged-in users */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'investigator', 'general']}>
              <UserSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute allowedRoles={['admin', 'investigator', 'general']}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
