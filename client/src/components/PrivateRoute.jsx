// client/src/components/PrivateRoute.jsx
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { logoutUser } from '../utils/auth';

const PrivateRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('pri_paid_current_user'));

  // Session timeout: logout after 15 minutes (900,000 ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      alert('Session expired due to inactivity.');
      logoutUser();
    }, 900000); // 15 mins

    return () => clearTimeout(timeout);
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole)
    return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
