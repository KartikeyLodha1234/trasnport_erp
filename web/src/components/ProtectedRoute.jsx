// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('userRole');

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If role doesn't match required role, redirect to appropriate dashboard
  if (requiredRole === 'admin' && role !== 'admin') {
    return <Navigate to="/driver-dashboard" />;
  }

  if (requiredRole === 'driver' && role !== 'driver') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

export default ProtectedRoute;