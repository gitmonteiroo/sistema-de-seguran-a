import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSupervisor?: boolean;
}

const ProtectedRoute = ({ children, requireSupervisor = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requireSupervisor && user?.role !== 'supervisor') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default ProtectedRoute;
