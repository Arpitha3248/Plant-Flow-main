import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { UserRole } from '../types/auth';
import { useAuth } from './AuthContext';

// ---- ProtectedRoute --------------------------------------------------------
interface ProtectedRouteProps { children: React.ReactNode }

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

// ---- RoleGuard -------------------------------------------------------------
interface RoleGuardProps {
  requiredRole: UserRole;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRole, children, fallback }) => {
  const { session, isAuthenticated } = useAuth();

  if (!isAuthenticated || !session) return <Navigate to="/login" replace />;

  if (session.role !== requiredRole) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to={session.role === 'ADMIN' ? '/admin' : '/plantflow'} replace />;
  }

  return (
    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

// ---- Unauthorized message --------------------------------------------------
export const UnauthorizedMessage: React.FC<{ message?: string }> = ({
  message = 'You do not have permission to access this area.',
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#94a3b8' }}>
    <p style={{ fontSize: 14, fontWeight: 500 }}>{message}</p>
  </div>
);
