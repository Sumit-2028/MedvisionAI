// ============================================================
// MEDVISION AI - LOGIN PAGE
// ============================================================
//
// Purpose:
// Authenticate the user using the existing FastAPI
// authentication endpoint.
//
// Flow:
//
// Email + Password
//       ↓
// POST /auth/login
//       ↓
// FastAPI
//       ↓
// JWT access_token
//       ↓
// localStorage
//       ↓
// Dashboard
//
// ============================================================

import {
  Activity,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

// ============================================================
// LOGIN COMPONENT
// ============================================================

function Login() {
  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate = useNavigate();

  // ==========================================================
  // FORM STATES
  // ==========================================================

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  // ==========================================================
  // UI STATES
  // ==========================================================

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // Loading state
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Error message
  const [error, setError] = useState("");

  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  const handleLogin = async (event) => {
    // Prevent browser page reload
    event.preventDefault();

    // Clear previous error
    setError("");

    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!email.trim()) {
      setError("Please enter your email address.");

      return;
    }

    if (!password) {
      setError("Please enter your password.");

      return;
    }

    // ========================================================
    // PREPARE LOGIN DATA
    // ========================================================
    //
    // FastAPI OAuth2PasswordRequestForm normally expects:
    //
    // username
    // password
    //
    // Therefore we use URLSearchParams rather than JSON.
    //
    // ========================================================

    const loginData = new URLSearchParams();

    loginData.append("username", email.trim());

    loginData.append("password", password);

    // ========================================================
    // CALL BACKEND
    // ========================================================

    try {
      setIsLoggingIn(true);

      const response = await api.post("/auth/login", loginData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      // ======================================================
      // GET JWT TOKEN
      // ======================================================

      const accessToken = response.data?.access_token;

      // ======================================================
      // VERIFY TOKEN
      // ======================================================

      if (!accessToken) {
        setError("Login succeeded but no access token was returned.");

        return;
      }

      // ======================================================
      // SAVE JWT
      // ======================================================
      //
      // services/api.js automatically reads this token
      // and attaches it to future API requests.
      //
      // ======================================================

      localStorage.setItem("access_token", accessToken);

      // ======================================================
      // REDIRECT TO DASHBOARD
      // ======================================================

      try {
        const profile = await api.get("/users/me");
        navigate(profile.data?.role === "ADMIN" ? "/admin" : "/dashboard");
      } catch {
        navigate("/dashboard");
      }
    } catch (error) {
      // ======================================================
      // LOG ERROR
      // ======================================================

      console.error("MedVision AI login failed:", error);

      // ======================================================
      // BACKEND ERROR
      // ======================================================

      if (error.response) {
        setError(error.response.data?.detail || "Invalid email or password.");
      }

      // ======================================================
      // SERVER CONNECTION ERROR
      // ======================================================
      else if (error.request) {
        setError("Unable to connect to the MedVision AI backend.");
      }

      // ======================================================
      // UNKNOWN ERROR
      // ======================================================
      else {
        setError("Something went wrong during login.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ============================================================
  // PAGE UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ===================================================
            BRAND SECTION
            =================================================== */}

        <section className="relative hidden overflow-hidden bg-cyan-700 lg:flex">
          {/* Decorative circles */}

          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10" />

          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-cyan-500/30" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            {/* Brand */}

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-cyan-700">
                <HeartPulse size={27} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-white">MedVision AI</h1>

                <p className="text-xs text-cyan-100">
                  Medical Imaging Intelligence
                </p>
              </div>
            </div>

            {/* Main Message */}

            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-cyan-50">
                <Activity size={14} />
                AI Clinical Support System
              </div>

              <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Intelligent chest X-ray analysis for modern clinical workflows.
              </h2>

              <p className="mt-6 text-sm leading-7 text-cyan-50 xl:text-base">
                MedVision AI helps organize medical imaging assessments,
                identify potential abnormalities, and generate structured
                reports for clinical review.
              </p>

              {/* Feature list */}

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-white">
                  <ShieldCheck size={18} />
                  AI-assisted medical assessment
                </div>

                <div className="flex items-center gap-3 text-sm text-white">
                  <Activity size={18} />
                  Deep learning powered analysis
                </div>

                <div className="flex items-center gap-3 text-sm text-white">
                  <LockKeyhole size={18} />
                  Secure authenticated workflow
                </div>
              </div>
            </div>

            {/* Disclaimer */}

            <p className="max-w-md text-xs leading-5 text-cyan-100">
              MedVision AI is a prototype clinical decision support system. AI
              results are intended to assist qualified healthcare professionals
              and are not a definitive medical diagnosis.
            </p>
          </div>
        </section>

        {/* ===================================================
            LOGIN SECTION
            =================================================== */}

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white">
                <HeartPulse size={24} />
              </div>

              <div>
                <h1 className="font-bold text-slate-900">MedVision AI</h1>

                <p className="text-xs text-cyan-600">
                  Medical Imaging Intelligence
                </p>
              </div>
            </div>

            {/* Login Heading */}

            <div>
              <p className="text-sm font-semibold text-cyan-600">
                Welcome back
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Sign in to MedVision AI
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Access your medical imaging workspace and analysis history.
              </p>
            </div>

            {/* =================================================
                ERROR MESSAGE
                ================================================= */}

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            {/* =================================================
                LOGIN FORM
                ================================================= */}

            <form onSubmit={handleLogin} className="mt-8 space-y-5">
              {/* =================================================
                  EMAIL
                  ================================================= */}

              <div>
                <label
                  htmlFor="login-email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* =================================================
                  PASSWORD
                  ================================================= */}

              <div>
                <label
                  htmlFor="login-password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />

                  {/* Show / Hide Password */}

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* =================================================
                  LOGIN BUTTON
                  ================================================= */}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* =================================================
                REGISTER LINK
                ================================================= */}

            <div className="mt-7 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-cyan-600 hover:text-cyan-700"
                >
                  Create account
                </button>
              </p>
            </div>

            {/* =================================================
                SECURITY NOTICE
                ================================================= */}

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} />
              Secure authenticated access
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default Login;
