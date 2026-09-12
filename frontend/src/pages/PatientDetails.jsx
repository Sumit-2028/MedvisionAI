import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Upload,
  Loader2,
  HeartPulse,
} from "lucide-react";

import api from "../services/api";

// ============================================================
// PATIENT DETAILS PAGE
// ============================================================
//
// This page displays:
//
// 1. Complete patient information
// 2. Patient's diagnosis history
// 3. Latest assessment
// 4. AI confidence
// 5. Normal / Abnormal status
// 6. Links to individual diagnosis details
// 7. Button to analyze a new X-ray for this patient
//
// Route:
// /patients/:patientId
//
// Backend endpoint:
// GET /users/patients/{patient_id}
// ============================================================

export default function PatientDetails() {
  // ----------------------------------------------------------
  // React Router
  // ----------------------------------------------------------

  const { patientId } = useParams();

  const navigate = useNavigate();

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------

  const [patient, setPatient] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // Fetch patient details
  // ----------------------------------------------------------

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        setError("");

        // --------------------------------------------------------
        // Fetch the patient's complete information.
        //
        // The backend normally returns the patient object directly.
        // However, we also support wrapped responses such as:
        // { patient: {...} } or { data: {...} }
        //
        // This keeps the frontend stable if the API response format
        // changes slightly in the future.
        // --------------------------------------------------------

        const response = await api.get(`/users/patients/${patientId}`);

        const responseData = response.data;

        // Extract the actual patient object safely.
        const patientData =
          responseData?.patient || responseData?.data || responseData;

        // Make sure we actually received a valid patient.
        if (!patientData?.patient_id) {
          console.error("Invalid patient response:", responseData);

          setError("Unable to load valid patient information.");

          return;
        }

        // Store the complete patient information.
        //
        // This includes:
        // - patient_id
        // - full_name
        // - age
        // - gender
        // - contact_information
        // - diagnoses
        setPatient(patientData);
      } catch (err) {
        console.error("Failed to fetch patient:", err);

        if (err.response?.status === 404) {
          setError(
            "Patient not found or you do not have access to this patient.",
          );
        } else {
          setError(
            err.response?.data?.detail || "Unable to load patient information.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  // ----------------------------------------------------------
  // Loading screen
  // ----------------------------------------------------------

  if (loading) {
    return (
      <div className="page-enter min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />

          <p className="text-slate-600 text-sm">
            Loading patient information...
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Error screen
  // ----------------------------------------------------------

  if (error || !patient) {
    return (
      <div className="page-enter min-h-screen bg-slate-50">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate("/patients")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </button>

          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Unable to Load Patient
            </h2>

            <p className="text-slate-600 mb-6">
              {error || "Patient information could not be found."}
            </p>

            <button
              onClick={() => navigate("/patients")}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Return to Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Diagnosis history
  // ----------------------------------------------------------

  const diagnoses = patient.diagnoses || [];

  // ----------------------------------------------------------
  // Calculate statistics
  // ----------------------------------------------------------

  const totalAnalyses = diagnoses.length;

  const abnormalCases = diagnoses.filter(
    (diagnosis) => diagnosis.result_status?.toUpperCase() === "ABNORMAL",
  ).length;

  const normalCases = diagnoses.filter(
    (diagnosis) => diagnosis.result_status?.toUpperCase() === "NORMAL",
  ).length;

  // ----------------------------------------------------------
  // Latest diagnosis
  // ----------------------------------------------------------

  const latestDiagnosis =
    diagnoses.length > 0
      ? [...diagnoses].sort(
          (a, b) =>
            new Date(b.diagnosis_timestamp) - new Date(a.diagnosis_timestamp),
        )[0]
      : null;

  // ----------------------------------------------------------
  // Format date
  // ----------------------------------------------------------

  const formatDate = (dateString) => {
    if (!dateString) {
      return "N/A";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ----------------------------------------------------------
  // Get status styling
  // ----------------------------------------------------------

  const getStatusStyles = (status) => {
    if (status?.toUpperCase() === "ABNORMAL") {
      return {
        container: "bg-red-50 border-red-200 text-red-700",
        icon: "text-red-600",
        badge: "bg-red-100 text-red-700",
      };
    }

    return {
      container: "bg-emerald-50 border-emerald-200 text-emerald-700",
      icon: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
    };
  };

  // ----------------------------------------------------------
  // Navigate to diagnosis
  // ----------------------------------------------------------

  const openDiagnosis = (diagnosisId) => {
    navigate(`/diagnosis/${diagnosisId}`);
  };

  // ----------------------------------------------------------
  // Start new analysis
  // ----------------------------------------------------------

  const startAnalysis = () => {
    navigate("/analyze", {
      state: {
        patientId: patient.patient_id,
      },
    });
  };

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <div className="page-enter min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <button
              onClick={() => navigate("/patients")}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Patients
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Patient Details
                </h1>

                <p className="text-sm text-slate-500">
                  Patient ID: {patient.patient_id}
                </p>
              </div>
            </div>
          </div>

          {/* New X-ray button */}

          <button
            onClick={startAnalysis}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <Upload className="w-5 h-5" />
            Analyze New X-Ray
          </button>
        </div>

        {/* ==================================================
            PATIENT INFORMATION CARD
        ================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {patient.full_name}
                </h2>

                <p className="text-sm text-slate-500">Patient Information</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Patient ID */}

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Patient ID
              </p>

              <p className="font-semibold text-slate-900">
                {patient.patient_id}
              </p>
            </div>

            {/* Age */}

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Age
              </p>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />

                <p className="font-semibold text-slate-900">
                  {patient.age ?? "N/A"} years
                </p>
              </div>
            </div>

            {/* Gender */}

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Gender
              </p>

              <p className="font-semibold text-slate-900">
                {patient.gender || "N/A"}
              </p>
            </div>

            {/* Contact */}

            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Contact
              </p>

              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />

                <p className="font-semibold text-slate-900">
                  {patient.contact_information || "Not provided"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total analyses */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>

              <span className="text-xs text-slate-400">TOTAL</span>
            </div>

            <p className="text-2xl font-bold text-slate-900">{totalAnalyses}</p>

            <p className="text-sm text-slate-500">X-ray Analyses</p>
          </div>

          {/* Abnormal */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>

              <span className="text-xs text-red-500">REVIEW</span>
            </div>

            <p className="text-2xl font-bold text-slate-900">{abnormalCases}</p>

            <p className="text-sm text-slate-500">Abnormal Results</p>
          </div>

          {/* Normal */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>

              <span className="text-xs text-emerald-500">NORMAL</span>
            </div>

            <p className="text-2xl font-bold text-slate-900">{normalCases}</p>

            <p className="text-sm text-slate-500">Normal Results</p>
          </div>

          {/* Latest result */}

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-purple-600" />
              </div>

              <span className="text-xs text-slate-400">LATEST</span>
            </div>

            {latestDiagnosis ? (
              <>
                <p className="text-lg font-bold text-slate-900 truncate">
                  {latestDiagnosis.predicted_disease || "No finding"}
                </p>

                <p className="text-sm text-slate-500">
                  {latestDiagnosis.confidence_score != null
                    ? `${Number(latestDiagnosis.confidence_score).toFixed(
                        2,
                      )}% confidence`
                    : "Confidence unavailable"}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-slate-900">No Analysis</p>

                <p className="text-sm text-slate-500">No X-ray analyzed yet</p>
              </>
            )}
          </div>
        </div>

        {/* ==================================================
            DIAGNOSIS HISTORY
        ================================================== */}

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* History header */}

          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Diagnosis History
                </h2>

                <p className="text-sm text-slate-500">
                  Previous X-ray assessments for this patient
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              NO HISTORY
          ================================================== */}

          {diagnoses.length === 0 ? (
            <div className="py-16 px-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText className="w-7 h-7 text-slate-400" />
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Diagnosis History
              </h3>

              <p className="text-sm text-slate-500 mb-6">
                No X-ray analysis has been performed for this patient yet.
              </p>

              <button
                onClick={startAnalysis}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Upload className="w-4 h-4" />
                Analyze X-Ray
              </button>
            </div>
          ) : (
            /* ==================================================
               HISTORY TABLE
            ================================================== */

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Finding
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Confidence
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {diagnoses
                    .slice()
                    .reverse()
                    .map((diagnosis) => {
                      const styles = getStatusStyles(diagnosis.result_status);

                      return (
                        <tr
                          key={diagnosis.diagnosis_id}
                          className="hover:bg-slate-50 transition"
                        >
                          {/* Date */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />

                              <span className="text-sm text-slate-700">
                                {formatDate(diagnosis.diagnosis_timestamp)}
                              </span>
                            </div>
                          </td>

                          {/* Finding */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-slate-400" />

                              <span className="font-medium text-slate-900">
                                {diagnosis.predicted_disease ||
                                  "No abnormality detected"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.badge}`}
                            >
                              {diagnosis.result_status?.toUpperCase() ===
                              "ABNORMAL" ? (
                                <AlertTriangle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}

                              {diagnosis.result_status || "UNKNOWN"}
                            </span>
                          </td>

                          {/* Confidence */}

                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-slate-800">
                              {diagnosis.confidence_score != null
                                ? `${Number(diagnosis.confidence_score).toFixed(
                                    2,
                                  )}%`
                                : "N/A"}
                            </span>
                          </td>

                          {/* Action */}

                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() =>
                                openDiagnosis(diagnosis.diagnosis_id)
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================================================
            MEDICAL SAFETY NOTICE
        ================================================== */}

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">
                AI-Assisted Clinical Assessment
              </p>

              <p className="text-sm text-amber-700 leading-relaxed">
                MedVision AI provides AI-assisted analysis of chest X-ray
                images. Results are intended to support clinical review and
                should not be considered a definitive diagnosis. Final clinical
                decisions must be made by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
