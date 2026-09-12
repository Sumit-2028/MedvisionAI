// ============================================================
// MedVision AI - Global Application Layout
// ============================================================
// This layout wraps every authenticated application page.
//
// Structure:
//
// AppLayout
//    │
//    ├── Sidebar
//    │
//    └── Main Area
//           │
//           ├── Top Navbar
//           │
//           └── Current Page
//
// The sidebar remains visible while navigating between pages.
// ============================================================

import { useEffect, useState } from "react";

import { Bell, Menu } from "lucide-react";
import api from "../services/api";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";


// ============================================================
// Application Layout
// ============================================================

export default function AppLayout() {
  // ----------------------------------------------------------
  // Desktop sidebar state
  // ----------------------------------------------------------
  // false = expanded
  // true  = collapsed
  // ----------------------------------------------------------

  const [collapsed, setCollapsed] = useState(false);

  // ----------------------------------------------------------
  // Mobile sidebar state
  // ----------------------------------------------------------

  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <div className="app-shell min-h-screen text-slate-800">
      {/* ======================================================
          GLOBAL SIDEBAR
      ====================================================== */}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* ======================================================
          MAIN APPLICATION AREA
      ====================================================== */}
      {/* The left padding changes according to sidebar width. */}
      {/* This keeps the content aligned perfectly. */}
      {/* ====================================================== */}

      <div
        className={`app-content
          min-h-screen
          transition-all
          duration-300

          ${collapsed ? "lg:pl-20" : "lg:pl-72"}
        `}
      >
        {/* ====================================================
            TOP NAVBAR
        ==================================================== */}

        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/90 bg-white/90 px-5 backdrop-blur-xl sm:px-8">
          {/* --------------------------------------------------
              Left Side
          -------------------------------------------------- */}

          <div className="flex items-center gap-3">
            {/* Mobile Menu */}

            <button
              className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              title="Open menu"
            >
              <Menu size={23} />
            </button>

            {/* Desktop Collapse Button */}

            <button
              className="hidden rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:block"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu size={22} />
            </button>

            {/* Application Name */}

            <div>
              <p className="text-xs font-medium text-slate-400">
                Medical Imaging Platform
              </p>

              <h2 className="text-lg font-bold text-slate-900">MedVision AI</h2>
            </div>
          </div>

          {/* --------------------------------------------------
              Right Side
          -------------------------------------------------- */}

          <div className="flex items-center gap-3">
            {/* Notification */}

            <button
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />
            </button>

            {/* Divider */}

            <div className="hidden h-9 w-px bg-slate-200 sm:block" />

            {/* User */}

            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-700">
                {currentUser?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <span className="text-sm font-semibold text-slate-700">
                {currentUser?.full_name || "Medical User"}
              </span>
            </div>
          </div>
        </header>

        {/* ====================================================
            PAGE CONTENT
        ==================================================== */}
        {/* React Router renders Dashboard / Analyze / History */}
        {/* here through <Outlet />. */}
        {/* ==================================================== */}

        <div className="page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
