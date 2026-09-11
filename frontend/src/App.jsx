import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import Login from "./pages/Login";
import DiagnosisDetails from "./pages/DiagnosisDetails";
import Patients from "./pages/Patients";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route path="/login" element={<Login />} />

        {/* =========================
            PROTECTED APPLICATION
        ========================== */}

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* X-Ray Analysis */}
            <Route path="/analyze" element={<Analyze />} />

            {/* Diagnosis History */}
            <Route path="/history" element={<History />} />

            <Route
              path="/diagnosis/:diagnosisId"
              element={<DiagnosisDetails />}
            />

            {/* Reports */}
            <Route
              path="/reports"
              element={
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Reports</h1>

                  <p className="mt-2 text-slate-500">
                    Reports page coming soon.
                  </p>
                </div>
              }
            />

            {/* Patients */}
            <Route path="/patients" element={<Patients />} />

            {/* Registration */}
            <Route
              path="/register"
              element={
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Registration</h1>

                  <p className="mt-2 text-slate-500">
                    Registration page coming soon.
                  </p>
                </div>
              }
            />
          </Route>
        </Route>

        {/* =========================
            DEFAULT ROUTES
        ========================== */}

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
