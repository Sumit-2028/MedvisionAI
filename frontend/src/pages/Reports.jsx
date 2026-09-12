import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Download,
  Eye,
  Search,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

import api from "../services/api";

function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      const response = await api.get("/diagnosis/history");

      const responseData = response.data;

      let history = [];

      if (Array.isArray(responseData)) {
        history = responseData;
      } else if (Array.isArray(responseData?.history)) {
        history = responseData.history;
      } else if (Array.isArray(responseData?.data)) {
        history = responseData.data;
      }

      setReports(history);
    } catch (err) {
      console.error("Failed to load reports:", err);

      setError(err.response?.data?.detail || "Unable to load medical reports.");
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD REPORT HISTORY
  // =========================================================

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadReports(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // =========================================================
  // DOWNLOAD REPORT
  // =========================================================

  const handleDownload = async (reportId) => {
    try {
      const response = await api.get(`/diagnosis/report/${reportId}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `medical-report-${reportId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Report download failed:", err);

      alert("Unable to download the medical report.");
    }
  };

  // =========================================================
  // FILTER REPORTS
  // =========================================================

  const filteredReports = reports.filter((report) => {
    const searchText = search.toLowerCase();

    return (
      String(report.patient_id || "")
        .toLowerCase()
        .includes(searchText) ||
      String(report.patient_name || "")
        .toLowerCase()
        .includes(searchText) ||
      String(report.predicted_disease || "")
        .toLowerCase()
        .includes(searchText) ||
      String(report.result_status || "")
        .toLowerCase()
        .includes(searchText)
    );
  });

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="page-enter min-h-screen bg-slate-50 p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading medical reports...</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="page-enter min-h-screen bg-slate-50 p-6 md:p-8">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="page-heading mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <FileText className="h-7 w-7 text-blue-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Medical Reports
            </h1>

            <p className="mt-1 text-slate-500">
              View and download generated patient assessment reports.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-semibold">Unable to load reports</p>

            <p className="mt-1 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            placeholder="Search by patient name, ID, disease or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* =====================================================
          REPORT COUNT
      ====================================================== */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Showing</p>

          <p className="text-xl font-bold text-slate-900">
            {filteredReports.length}{" "}
            {filteredReports.length === 1 ? "Report" : "Reports"}
          </p>
        </div>
      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}

      {filteredReports.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>

          <h2 className="text-lg font-semibold text-slate-900">
            No reports found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {search
              ? "Try changing your search criteria."
              : "Generated medical reports will appear here."}
          </p>
        </div>
      ) : (
        /* =====================================================
           REPORT TABLE
        ====================================================== */

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Patient
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Finding
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Confidence
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => {
                  const isAbnormal =
                    String(report.result_status || "").toUpperCase() ===
                    "ABNORMAL";

                  return (
                    <tr
                      key={report.diagnosis_id}
                      className="transition hover:bg-slate-50"
                    >
                      {/* PATIENT */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {report.patient_name || "Unknown Patient"}
                            </p>

                            <p className="text-xs text-slate-500">
                              ID: {report.patient_id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* FINDING */}

                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-800">
                          {report.predicted_disease || "No finding"}
                        </p>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        {isAbnormal ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Abnormal
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* CONFIDENCE */}

                      <td className="px-6 py-5">
                        <span className="font-semibold text-slate-800">
                          {report.confidence_score != null
                            ? `${report.confidence_score}%`
                            : "—"}
                        </span>
                      </td>

                      {/* DATE */}

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="h-4 w-4 text-slate-400" />

                          {formatDate(report.diagnosis_timestamp)}
                        </div>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/diagnosis/${report.diagnosis_id}`)
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>

                          {/* DOWNLOAD */}

                          {report.report_id && (
                            <button
                              type="button"
                              onClick={() => handleDownload(report.report_id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================
          MEDICAL SAFETY NOTICE
      ====================================================== */}

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-amber-900">
          AI-Assisted Assessment
        </p>

        <p className="mt-1 text-sm leading-6 text-amber-800">
          These reports are generated with AI assistance and are intended to
          support clinical review. They are not a definitive medical diagnosis
          and should be reviewed by a qualified healthcare professional.
        </p>
      </div>
    </div>
  );
}

export default Reports;
