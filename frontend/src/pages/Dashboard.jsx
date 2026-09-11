// ============================================================
// MedVision AI - Dashboard
// ============================================================
// This page contains ONLY Dashboard content.
//
// The global Sidebar and Top Navbar are provided by:
//     layouts/AppLayout.jsx
//
// Therefore, this file should NOT contain:
//     - Sidebar
//     - Mobile overlay
//     - Top navbar
//     - Application wrapper
// ============================================================

import {
  Activity,
  ChevronRight,
  FileText,
  ScanLine,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// ============================================================
// Dashboard Component
// ============================================================

export default function Dashboard() {
  const navigate = useNavigate();

  // ==========================================================
  // Dashboard Statistics State
  // ==========================================================

  const [stats, setStats] = useState({
    total_analyses: 0,
    abnormal_results: 0,
    normal_results: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);

  // ==========================================================
  // Recent Reports State
  // ==========================================================

  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // ==========================================================
  // Fetch Dashboard Statistics
  // ==========================================================

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await api.get("/diagnosis/dashboard-stats");

        setStats(response.data);
      } catch (error) {
        console.error("Dashboard statistics error:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // ==========================================================
  // Fetch Recent Reports
  // ==========================================================

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        const response = await api.get("/diagnosis/history");

        // Backend returns:
        // {
        //   patient_id: ...,
        //   total_reports: ...,
        //   history: [...]
        // }

        const reports = response.data?.history || [];

        setRecentReports(reports.slice(0, 5));
      } catch (error) {
        console.error("Recent reports error:", error);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchRecentReports();
  }, []);

  // ==========================================================
  // Dashboard Statistics Cards
  // ==========================================================

  const abnormalRate =
    stats.total_analyses > 0
      ? Math.round((stats.abnormal_results / stats.total_analyses) * 100)
      : 0;

  const dashboardStats = [
    {
      title: "Total Analyses",
      value: loadingStats ? "..." : stats.total_analyses,
      icon: ScanLine,
      description: "X-rays analyzed",
    },

    {
      title: "Abnormal Findings",
      value: loadingStats ? "..." : stats.abnormal_results,
      icon: FileText,
      description: "Abnormal assessments",
    },

    {
      title: "Normal Results",
      value: loadingStats ? "..." : stats.normal_results,
      icon: ShieldCheck,
      description: "Normal assessments",
    },

    {
      title: "Abnormal Rate",
      value: loadingStats ? "..." : `${abnormalRate}%`,
      icon: Activity,
      description: "Assessments with findings",
    },
  ];

  // ==========================================================
  // Render Dashboard
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          Dashboard Content
      ====================================================== */}

      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        {/* ====================================================
            Welcome Section
        ==================================================== */}

        <section className="mb-7">
          <div className="rounded-2xl bg-gradient-to-r from-cyan-700 to-cyan-600 p-7 text-white shadow-sm sm:p-8">
            <div className="max-w-2xl">
              {/* Badge */}

              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
                <Activity size={14} />
                AI Clinical Support System
              </div>

              {/* Heading */}

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome to MedVision AI
              </h1>

              {/* Description */}

              <p className="mt-3 max-w-xl text-sm leading-6 text-cyan-50 sm:text-base">
                Analyze chest X-rays with AI-assisted medical imaging
                intelligence and generate structured medical reports.
              </p>

              {/* Analyze Button */}

              <button
                onClick={() => navigate("/analyze")}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50"
              >
                <Upload size={18} />
                Analyze New X-Ray
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            Statistics
        ==================================================== */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {stat.description}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ====================================================
            Main Dashboard Grid
        ==================================================== */}

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* ==================================================
              Start Analysis Card
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Start an AI Analysis
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Upload a chest X-ray to begin the assessment.
                </p>
              </div>

              <div className="hidden rounded-xl bg-cyan-50 p-3 text-cyan-600 sm:block">
                <ScanLine size={22} />
              </div>
            </div>

            {/* Upload Area */}

            <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-cyan-300 hover:bg-cyan-50/30">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-cyan-600 shadow-sm">
                <Upload size={25} />
              </div>

              <h4 className="mt-4 text-sm font-semibold text-slate-800">
                Upload Chest X-Ray
              </h4>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                Upload a chest X-ray image for AI-assisted analysis. Supported
                image formats will be validated automatically.
              </p>

              <button
                onClick={() => navigate("/analyze")}
                className="mt-5 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700"
              >
                Select X-Ray
              </button>
            </div>
          </div>

          {/* ==================================================
              AI Information
          ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">AI Assessment</h3>

                <p className="text-xs text-slate-500">
                  Powered by MedVision AI
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Model */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">MODEL</p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  DenseNet121
                </p>
              </div>

              {/* Analysis */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">ANALYSIS</p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  14 Chest Conditions
                </p>
              </div>

              {/* Output */}

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-400">OUTPUT</p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  AI-assisted assessment
                </p>
              </div>
            </div>

            {/* Safety Notice */}

            <div className="mt-5 flex gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <p className="text-xs leading-5 text-amber-700">
                AI results are intended to support clinical review and should
                not be considered a definitive diagnosis.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================================
            Recent Reports
        ==================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Header */}

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Recent Reports
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Your latest medical imaging assessments.
              </p>
            </div>

            <button
              onClick={() => navigate("/history")}
              className="hidden items-center gap-1 text-sm font-semibold text-cyan-600 hover:text-cyan-700 sm:flex"
            >
              View History
              <ChevronRight size={16} />
            </button>
          </div>

          {/* ==================================================
              Recent Reports List
          ================================================== */}

          <div className="mt-6 space-y-3">
            {/* Loading */}

            {loadingReports && (
              <div className="flex min-h-28 items-center justify-center rounded-xl bg-slate-50">
                <p className="text-sm text-slate-400">
                  Loading recent reports...
                </p>
              </div>
            )}

            {/* No Reports */}

            {!loadingReports && recentReports.length === 0 && (
              <div className="flex min-h-28 items-center justify-center rounded-xl bg-slate-50">
                <div className="text-center">
                  <FileText size={28} className="mx-auto text-slate-300" />

                  <p className="mt-2 text-sm font-medium text-slate-500">
                    No reports yet
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Your generated reports will appear here.
                  </p>
                </div>
              </div>
            )}

            {/* ==================================================
                Reports
            ================================================== */}

            {!loadingReports && recentReports.length > 0 && (
              <>
                {recentReports.map((report) => (
                  <button
                    key={report.diagnosis_id}
                    type="button"
                    onClick={() =>
                      navigate(`/diagnosis/${report.diagnosis_id}`)
                    }
                    className="w-full text-left flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:bg-cyan-50/20 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-500/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    {/* Report Information */}

                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                        <FileText size={20} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {report.predicted_disease ||
                            "No abnormality detected"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Diagnosis ID: {report.diagnosis_id}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {report.timestamp
                            ? new Date(report.timestamp).toLocaleString()
                            : "Date unavailable"}
                        </p>
                      </div>
                    </div>

                    {/* Status + Confidence */}

                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          report.result_status === "ABNORMAL"
                            ? "bg-red-50 text-red-600"
                            : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {report.result_status || "UNKNOWN"}
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-400">Confidence</p>

                        <p className="text-sm font-bold text-slate-700">
                          {report.confidence_score != null
                            ? `${report.confidence_score}%`
                            : "N/A"}
                        </p>
                      </div>

                      {/* Click Indicator */}

                      <ChevronRight
                        size={18}
                        className="text-slate-300 transition group-hover:text-cyan-500"
                      />
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </section>
      </main>

      {/* ======================================================
          Dashboard Footer
      ====================================================== */}

      <footer className="border-t border-slate-200 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 text-xs text-slate-400 sm:flex-row">
          <p>© 2026 MedVision AI</p>

          <p>AI-assisted medical imaging platform</p>
        </div>
      </footer>
    </div>
  );
}
