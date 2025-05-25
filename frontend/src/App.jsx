import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ReporterDashboard from './pages/ReporterDashboard';
import AboutPage from './pages/About';
import InvestigatorDashboard from './pages/InvestigatorDashboard';
import UserSettings from './pages/UserSettings';
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
        <Route path="/investigator" element={<InvestigatorDashboard />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/investigator/settings" element={<UserSettings />} />
        {/* Add more routes here */}
      </Routes>
    </Router>
  );
}

export default App;
