import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ReporterDashboard from './pages/ReporterDashboard';
import AboutPage from './pages/About';
import InvestigatorDashboard from './pages/InvestigatorDashboard';
import UserSettings from './pages/UserSettings';
import AdminDashboard from './pages/AdminDashboard';
import ChangePassword from './pages/ChangePassword';
import ResetPasswordPage from './pages/ResetPasswordPage';
import InvestigatorStats from './pages/InvestigatorStats';
import Help from './pages/Help';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ReporterDashboard />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Investigator */}
        <Route path="/investigator" element={<InvestigatorDashboard />} />
        <Route path="/investigator/pending" element={<InvestigatorDashboard view="pending" />} />
        <Route path="/investigator/reviewed" element={<InvestigatorDashboard view="reviewed" />} />
        <Route path="/investigator/settings" element={<UserSettings />} />
        <Route path="/investigator/stats" element={<InvestigatorStats />} />

        {/* General  */}
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/help/:role" element={<Help />} />

      </Routes>
    </Router>
  );
}

export default App;
