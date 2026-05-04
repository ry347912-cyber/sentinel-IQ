import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Logs from './pages/Logs';
import Devices from './pages/Devices';
import DeviceActivity from './pages/DeviceActivity';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard"        element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/logs"             element={<ProtectedRoute><Logs /></ProtectedRoute>} />
          <Route path="/devices"          element={<ProtectedRoute><Devices /></ProtectedRoute>} />
          <Route path="/device-activity"  element={<ProtectedRoute><DeviceActivity /></ProtectedRoute>} />
          <Route path="/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin"            element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
