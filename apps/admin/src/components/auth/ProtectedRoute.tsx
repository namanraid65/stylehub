import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useIsLoggedIn, useUser } from '../../stores/auth.store';

interface ProtectedRouteProps {
  children:    React.ReactNode;
  allowedRoles?: ('admin' | 'vendor')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isLoggedIn = useIsLoggedIn();
  const user       = useUser();
  const location   = useLocation();

  // Not authenticated → go to login, preserve intended destination
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && user && !allowedRoles.includes(user.role as 'admin' | 'vendor')) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
