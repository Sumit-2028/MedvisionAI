import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import History from "./pages/History";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DiagnosisDetails from "./pages/DiagnosisDetails";
import Patients from "./pages/Patients";
import PatientDetails from "./pages/PatientDetails";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import Landing from "./pages/Landing";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminPatients from "./pages/AdminPatients";
import AdminDiagnoses from "./pages/AdminDiagnoses";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* =========================
            PUBLIC ROUTES
        ========================== */}

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Landing />} />

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

            <Route path="/patients/:patientId" element={<PatientDetails />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Patients */}
            <Route path="/patients" element={<Patients />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/security" element={<Security />} />

          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/patients" element={<AdminPatients />} />
              <Route path="/admin/diagnoses" element={<AdminDiagnoses />} />
            </Route>
          </Route>
        </Route>

        {/* =========================
            DEFAULT ROUTES
        ========================== */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
