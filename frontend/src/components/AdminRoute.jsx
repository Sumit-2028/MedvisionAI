import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../services/api";

export default function AdminRoute() {
  const [state, setState] = useState({ loading: true, isAdmin: false });

  useEffect(() => {
    let active = true;
    api.get("/users/me")
      .then(({ data }) => {
        if (active) setState({ loading: false, isAdmin: data?.role === "ADMIN" });
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        if (active) setState({ loading: false, isAdmin: false });
      });
    return () => { active = false; };
  }, []);

  if (state.loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Checking access…</div>;
  }

  if (!localStorage.getItem("access_token")) return <Navigate to="/login" replace />;
  if (!state.isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
