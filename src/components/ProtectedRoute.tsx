import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole, type UserRole } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const userRole = getUserRole();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to dashboard if user doesn't have permission
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
