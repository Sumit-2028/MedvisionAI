// ============================================================
// MedVision AI - Diagnosis History
// ============================================================
// Displays previous AI X-ray analyses belonging to the
// currently logged-in patient.
//
// Backend endpoint:
// GET /diagnosis/history
//
// Authentication:
// The JWT access token is automatically attached by
// services/api.js.
// ============================================================

import { useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";

import api from "../services/api";

// ============================================================
// Disease Name Formatter
// ============================================================

function formatDiseaseName(name) {
  if (!name) {
    return "Unknown";
  }

  return name.replaceAll("_", " ");
}

// ============================================================
// Date Formatter
// ============================================================

function formatDate(timestamp) {
  if (!timestamp) {
    return "Date unavailable";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================
// Main History Component
// ============================================================

export default function History() {
  // ----------------------------------------------------------
  // History data
  // ----------------------------------------------------------

  const [history, setHistory] = useState([]);

  const [patientId, setPatientId] = useState(null);

  // ----------------------------------------------------------
  // Loading state
  // ----------------------------------------------------------

  const [isLoading, setIsLoading] = useState(true);

  // ----------------------------------------------------------
  // Error state
  // ----------------------------------------------------------

  const [error, setError] = useState("");

  // ==========================================================
  // Fetch Diagnosis History
  // ==========================================================

  const fetchHistory = async () => {
    setIsLoading(true);

    setError("");

    try {
      // ------------------------------------------------------
      // Call FastAPI history endpoint
      // ------------------------------------------------------

      const response = await api.get("/diagnosis/history");

      // ------------------------------------------------------
      // Store patient ID
      // ------------------------------------------------------

      setPatientId(response.data?.patient_id);

      // ------------------------------------------------------
      // Store history
      // ------------------------------------------------------

      setHistory(response.data?.history || []);
    } catch (err) {
      console.error("History loading error:", err);

      if (err.response) {
        setError(
          err.response.data?.detail || "Unable to load diagnosis history.",
        );
      } else if (err.request) {
        setError("Unable to connect to the MedVision AI backend.");
      } else {
        setError("An unexpected error occurred while loading history.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================
  // Load History When Page Opens
  // ==========================================================

  useEffect(() => {
    void Promise.resolve().then(() => fetchHistory());
  }, []);

  // ==========================================================
  // Download Report
  // ==========================================================

  const handleDownloadReport = async (reportId) => {
    if (!reportId) {
      return;
    }

    try {
      // ------------------------------------------------------
      // Request PDF from backend
      // ------------------------------------------------------

      const response = await api.get(`/diagnosis/report/${reportId}`, {
        responseType: "blob",
      });

      // ------------------------------------------------------
      // Create browser download URL
      // ------------------------------------------------------

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);

      // ------------------------------------------------------
      // Create temporary download link
      // ------------------------------------------------------

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download = `MedVisionAI_Report_${reportId}.pdf`;

      document.body.appendChild(link);

      link.click();

      // ------------------------------------------------------
      // Cleanup
      // ------------------------------------------------------

      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Report download error:", err);

      setError("Unable to download the medical report.");
    }
  };

  // ==========================================================
  // Loading Screen
  // ==========================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-cyan-700" />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Loading diagnosis history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================
  // Main Page
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          Header
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-50 p-3">
                  <Activity size={24} className="text-cyan-700" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Diagnosis History
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Previous AI-assisted X-ray assessments
                  </p>
                </div>
              </div>
            </div>

            {/* Refresh */}

            <button
              onClick={fetchHistory}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          Main Content
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ====================================================
            Error
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />

            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* ====================================================
            Summary Cards
        ==================================================== */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {/* Patient */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5">
                <User size={20} className="text-blue-700" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">Patient ID</p>

                <p className="mt-1 font-bold text-slate-900">
                  {patientId || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Total Reports */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-50 p-2.5">
                <FileText size={20} className="text-cyan-700" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Total Assessments
                </p>

                <p className="mt-1 font-bold text-slate-900">
                  {history.length}
                </p>
              </div>
            </div>
          </div>

          {/* System */}

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-2.5">
                <ShieldCheck size={20} className="text-emerald-700" />
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500">AI System</p>

                <p className="mt-1 font-bold text-slate-900">DenseNet121</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            History List
        ==================================================== */}

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Section Header */}

          <div className="border-b border-slate-200 p-6">
            <h2 className="font-bold text-slate-900">Previous Assessments</h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your previous X-ray analysis records.
            </p>
          </div>

          {/* ==================================================
              Empty State
          ================================================== */}

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="rounded-full bg-slate-100 p-5">
                <FileText size={32} className="text-slate-400" />
              </div>

              <h3 className="mt-5 font-bold text-slate-800">
                No diagnosis history
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                You haven't completed any X-ray assessments yet. Your completed
                analyses will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((record) => {
                const isAbnormal = record.result_status === "ABNORMAL";

                return (
                  <div
                    key={record.diagnosis_id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      {/* --------------------------------------
                          Left: Diagnosis information
                      -------------------------------------- */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-bold text-slate-900">
                            {formatDiseaseName(record.predicted_disease)}
                          </h3>

                          {/* Status */}

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              isAbnormal
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isAbnormal ? "Abnormal" : "Normal"}
                          </span>
                        </div>

                        {/* Date */}

                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays size={15} />

                          {formatDate(record.timestamp)}
                        </div>

                        {/* Diagnosis ID */}

                        <p className="mt-2 text-xs text-slate-400">
                          Diagnosis ID:{" "}
                          <span className="font-medium text-slate-500">
                            {record.diagnosis_id}
                          </span>
                        </p>
                      </div>

                      {/* --------------------------------------
                          Middle: Confidence
                      -------------------------------------- */}

                      <div className="w-full lg:w-56">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">
                            AI Confidence
                          </span>

                          <span className="text-sm font-bold text-cyan-700">
                            {Number(record.confidence_score).toFixed(2)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-cyan-600"
                            style={{
                              width: `${Math.min(
                                Number(record.confidence_score),
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* --------------------------------------
                          Right: Report
                      -------------------------------------- */}

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleDownloadReport(record.report_id)}
                          disabled={!record.report_id}
                          className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <FileText size={17} />
                          Report
                        </button>

                        <ChevronRight size={20} className="text-slate-300" />
                      </div>
                    </div>

                    {/* --------------------------------------
                        Findings
                    -------------------------------------- */}

                    {record.findings?.length > 0 && (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Detected Findings
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {record.findings.map((finding) => (
                            <span
                              key={finding.disease}
                              className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700"
                            >
                              {formatDiseaseName(finding.disease)}
                              {" — "}
                              {Number(finding.probability).toFixed(2)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ====================================================
            Disclaimer
        ==================================================== */}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-700" />

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                AI-Assisted Assessment
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Historical results are AI-generated assessments intended for
                research and decision-support purposes. They should not be
                considered a definitive medical diagnosis.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
