// ============================================================
// MedVision AI - Application Sidebar
// ============================================================
// This is the GLOBAL sidebar for the entire application.
//
// It is NOT part of Dashboard anymore.
//
// The sidebar:
// 1. Stays fixed on the left
// 2. Works across all pages
// 3. Can be collapsed
// 4. Can be opened on mobile
// 5. Highlights the active page
// ============================================================

import {
  FileText,
  HeartPulse,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
// ============================================================
// Navigation Items
// ============================================================

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },

  {
    label: "Analyze X-Ray",
    icon: ScanLine,
    path: "/analyze",
  },

  {
    label: "Reports",
    icon: FileText,
    path: "/reports",
  },

  {
    label: "Patients",
    icon: Users,
    path: "/patients",
  },

  {
    label: "History",
    icon: History,
    path: "/history",
  },
];

// ============================================================
// Sidebar Component
// ============================================================

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();

  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await api.get("/users/me");
        setCurrentUser(response.data);
      } catch (error) {
        console.error("Failed to load current user:", error);
      }
    };

    loadCurrentUser();
  }, []);
  // ==========================================================
  // Navigate to Page
  // ==========================================================

  const handleNavigation = (path) => {
    navigate(path);

    // Close mobile sidebar after navigation
    setMobileOpen(false);
  };

  // ==========================================================
  // Logout
  // ==========================================================

  const handleLogout = () => {
    // Remove authentication token
    localStorage.removeItem("access_token");

    // Return to login page
    navigate("/login");

    // Close mobile sidebar
    setMobileOpen(false);
  };

  // ==========================================================
  // Check Active Route
  // ==========================================================

  const isActive = (path) => {
    if (path === "/dashboard" || path === "/admin") {
      return location.pathname === path;
    }

    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* ======================================================
          Mobile Overlay
      ====================================================== */}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ======================================================
          Sidebar
      ====================================================== */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          flex-col
          border-r
          border-slate-200
          bg-white
          shadow-sm
          transition-all
          duration-300

          ${collapsed ? "w-20" : "w-72"}

          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}

          lg:translate-x-0
        `}
      >
        {/* ====================================================
            Logo Section
        ==================================================== */}

        <div
          className={`
            flex
            h-20
            items-center
            border-b
            border-slate-100

            ${collapsed ? "justify-center px-3" : "justify-between px-6"}
          `}
        >
          <button
            onClick={() => handleNavigation("/dashboard")}
            className="flex items-center gap-3"
            title="MedVision AI"
          >
            {/* Logo */}

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-sm">
              <HeartPulse size={25} strokeWidth={2.2} />
            </div>

            {/* Brand Name */}

            {!collapsed && (
              <div className="text-left">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  MedVision
                </h1>

                <p className="text-xs font-medium text-cyan-600">
                  AI Medical Intelligence
                </p>
              </div>
            )}
          </button>

          {/* Mobile Close Button */}

          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* ====================================================
            Navigation
        ==================================================== */}

        <div className="flex-1 overflow-y-auto px-3 py-6">
          {/* Workspace Label */}

          {currentUser?.role !== "ADMIN" && (
            <>
              {!collapsed && (
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Workspace
                </p>
              )}

              {/* Main Navigation */}

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  const active = isActive(item.path);

                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      title={collapsed ? item.label : undefined}
                      className={`
                    group
                    flex
                    w-full
                    items-center
                    rounded-xl
                    py-3
                    text-sm
                    font-medium
                    transition

                    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}

                    ${
                      active
                        ? "bg-cyan-50 text-cyan-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                      `}
                    >
                      {/* Icon */}

                      <Icon size={19} className="shrink-0" />

                      {/* Label */}

                      {!collapsed && <span>{item.label}</span>}

                      {/* Active Indicator */}

                      {!collapsed && active && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-cyan-600" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </>
          )}

          {currentUser?.role === "ADMIN" && (
            <>
              {!collapsed && (
                <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Administration
                </p>
              )}
              <nav className="space-y-1">
                {[
                  ["Overview", "/admin", LayoutDashboard],
                  ["Users", "/admin/users", Users],
                  ["Patients", "/admin/patients", Users],
                  ["Diagnoses", "/admin/diagnoses", FileText],
                ].map(([label, path, Icon]) => (
                  <button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    title={collapsed ? label : undefined}
                    className={`flex w-full items-center rounded-xl py-3 text-sm font-medium transition ${collapsed ? "justify-center px-2" : "gap-3 px-4"} ${isActive(path) ? "bg-cyan-50 text-cyan-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <Icon size={19} className="shrink-0" />
                    {!collapsed && <span>{label}</span>}
                    {!collapsed && isActive(path) && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-600" />}
                  </button>
                ))}
              </nav>
            </>
          )}

          {/* ==================================================
              System Section
          ================================================== */}

          {!collapsed && (
            <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </p>
          )}

          <nav className="space-y-1">
            {/* Settings */}

            <button
              onClick={() => handleNavigation("/settings")}
              title={collapsed ? "Settings" : undefined}
              className={`
    flex
    w-full
    items-center
    rounded-xl
    py-3
    text-sm
    font-medium
    transition

    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}

    ${
      isActive("/settings")
        ? "bg-cyan-50 text-cyan-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }
  `}
            >
              <Settings size={19} className="shrink-0" />

              {!collapsed && <span>Settings</span>}

              {!collapsed && isActive("/settings") && (
                <span className="ml-auto h-2 w-2 rounded-full bg-cyan-600" />
              )}
            </button>
            {/* Security */}

            <button
              onClick={() => handleNavigation("/security")}
              title={collapsed ? "Security" : undefined}
              className={`
    flex
    w-full
    items-center
    rounded-xl
    py-3
    text-sm
    font-medium
    transition

    ${collapsed ? "justify-center px-2" : "gap-3 px-4"}

    ${
      isActive("/security")
        ? "bg-cyan-50 text-cyan-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    }
  `}
            >
              <ShieldCheck size={19} className="shrink-0" />

              {!collapsed && <span>Security</span>}

              {!collapsed && isActive("/security") && (
                <span className="ml-auto h-2 w-2 rounded-full bg-cyan-600" />
              )}
            </button>
          </nav>
        </div>

        {/* ====================================================
            User Section
        ==================================================== */}

        <div className="border-t border-slate-100 p-3">
          <div
            className={`
              flex
              items-center
              rounded-xl
              bg-slate-50
              p-3

              ${collapsed ? "justify-center" : "gap-3"}
            `}
          >
            {/* Avatar */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-semibold text-cyan-700">
              {currentUser?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>

            {/* User Information */}

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {currentUser?.full_name || "Medical User"}
                </p>

                <p className="truncate text-xs text-slate-500">
                  AI-assisted workspace
                </p>
              </div>
            )}

            {/* Logout */}

            {!collapsed && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
