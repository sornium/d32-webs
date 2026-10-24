import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isDbConfigured } = useStore();
  const location = useLocation();

  // If DB is not configured, we shouldn't block, but if we require authentication:
  if (!user) {
    // Redirect them to /auth, keeping track of where they wanted to go
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== "admin") {
    // Redirect standard users who try to access admin panel to their dashboard or home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
