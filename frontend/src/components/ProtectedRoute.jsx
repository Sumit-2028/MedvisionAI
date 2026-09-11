import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("access_token");

  // No login token → send user to Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Token exists → allow access
  return <Outlet />;
}

export default ProtectedRoute;
