import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Incidents from '../pages/Incidents';
import IncidentDetail from '../pages/IncidentDetail';
import Buildings from '../pages/Buildings';
import Profile from '../pages/Profile';
import Layout from '../pages/Layout';
import MapPage from '../pages/MapPage';
import UsersPage from '../pages/UsersPage';
import SensorsPage from '../pages/SensorsPage';

function PrivateRoute({ children }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { token, isLoading, user } = useAuth();
  if (isLoading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="buildings" element={<Buildings />} />
        <Route path="sensors" element={<PrivateRoute><SensorsPage /></PrivateRoute>} />
        <Route path="map" element={<MapPage />} />
        <Route path="profile" element={<Profile />} />
        <Route path="users" element={<AdminRoute><UsersPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}