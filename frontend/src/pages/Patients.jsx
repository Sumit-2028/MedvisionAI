import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Activity,
  Search,
  Users,
  UserRound,
  ChevronRight,
} from "lucide-react";

import api from "../services/api";

function Patients() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // FETCH PATIENTS
  // =========================================================

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        setError("");

        // --------------------------------------------------------
        // Fetch patients belonging to the logged-in physician.
        //
        // The backend may return the patient list directly or
        // inside a wrapper such as:
        //
        // { patients: [...] }
        // { data: [...] }
        //
        // Normalize the response before storing it in state so
        // patients always remains an array.
        // --------------------------------------------------------

        const response = await api.get("/users/patients");

        const responseData = response.data;

        let patientList = [];

        if (Array.isArray(responseData)) {
          // Backend returned the array directly.
          patientList = responseData;
        } else if (Array.isArray(responseData?.patients)) {
          // Backend returned { patients: [...] }.
          patientList = responseData.patients;
        } else if (Array.isArray(responseData?.data)) {
          // Backend returned { data: [...] }.
          patientList = responseData.data;
        }

        // Always keep patients as an array.
        // This prevents .filter(), .length, and .map()
        // from failing if the API response format changes.
        setPatients(patientList);
      } catch (err) {
        console.error("Patients fetch error:", err);

        if (err.response?.status === 401) {
          setError("Your session has expired. Please login again.");
        } else if (err.request) {
          setError("Unable to connect to the MedVision AI backend.");
        } else {
          setError("Unable to load patients.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // =========================================================
  // FILTER PATIENTS
  // =========================================================

  const filteredPatients = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return patients;
    }

    return patients.filter((patient) => {
      const patientId = String(patient.patient_id ?? "").toLowerCase();

      const name = String(patient.full_name ?? "").toLowerCase();

      const disease = String(patient.predicted_disease ?? "").toLowerCase();

      return (
        patientId.includes(search) ||
        name.includes(search) ||
        disease.includes(search)
      );
    });
  }, [patients, searchTerm]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalPatients = patients.length;

  const patientsWithDiagnosis = patients.filter(
    (patient) => patient.latest_diagnosis_id !== null,
  ).length;

  const abnormalPatients = patients.filter(
    (patient) => patient.result_status === "ABNORMAL",
  ).length;

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "No assessment";
    }

    return new Date(timestamp).toLocaleString();
  };

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const StatusBadge = ({ status }) => {
    if (status === "ABNORMAL") {
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          Abnormal
        </span>
      );
    }

    if (status === "NORMAL") {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          Normal
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        Not Assessed
      </span>
    );
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div>
              <div className="h-8 w-48 rounded-lg bg-slate-200" />
              <div className="mt-2 h-4 w-72 rounded bg-slate-200" />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
              <div className="h-28 rounded-2xl bg-white" />
            </div>

            <div className="h-96 rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage patient records and review their latest AI-assisted
            assessments.
          </p>
        </div>

        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={18} />

              <span>{error}</span>
            </div>
          </div>
        )}

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {/* Total Patients */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Patients
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalPatients}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Users size={22} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Registered patient profiles
            </p>
          </div>

          {/* Patients With Diagnosis */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Assessed Patients
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {patientsWithDiagnosis}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Activity size={22} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Patients with an AI assessment
            </p>
          </div>

          {/* Abnormal Cases */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Abnormal Cases
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {abnormalPatients}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertCircle size={22} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Based on latest assessment
            </p>
          </div>
        </div>

        {/* =====================================================
            SEARCH + TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Search Header */}

          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Patient Records
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredPatients.length} patient
                  {filteredPatients.length !== 1 ? "s" : ""} shown
                </p>
              </div>

              {/* Search */}

              <div className="relative w-full lg:max-w-md">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by name, patient ID or disease..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </div>
          </div>

          {/* ===================================================
              EMPTY SEARCH RESULT
          =================================================== */}

          {filteredPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <UserRound size={26} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No patients found
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Try searching with a different patient name, patient ID, or
                disease.
              </p>
            </div>
          ) : (
            /* =================================================
               PATIENT TABLE
            ================================================= */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Patient
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Age / Gender
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Latest Finding
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Confidence
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last Assessment
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.patient_id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      {/* Patient */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                            <UserRound size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {patient.full_name || "Unnamed Patient"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              ID: {patient.patient_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender */}

                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-800">
                          {patient.age ?? "—"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {patient.gender || "Not specified"}
                        </p>
                      </td>

                      {/* Latest Finding */}

                      <td className="px-5 py-4">
                        {patient.predicted_disease ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {patient.predicted_disease.replace(/_/g, " ")}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Diagnosis ID: {patient.latest_diagnosis_id}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No assessment
                          </span>
                        )}
                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">
                        <StatusBadge status={patient.result_status} />
                      </td>

                      {/* Confidence */}

                      <td className="px-5 py-4">
                        {patient.confidence_score !== null ? (
                          <span className="text-sm font-semibold text-slate-800">
                            {Number(patient.confidence_score).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>

                      {/* Last Assessment */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {formatDate(patient.diagnosis_timestamp)}
                        </span>
                      </td>

                      {/* Action */}

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/patients/${patient.patient_id}`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          View
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Patients;
