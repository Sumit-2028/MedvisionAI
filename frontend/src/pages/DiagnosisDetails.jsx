import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
} from "lucide-react";
import api from "../services/api";

function DiagnosisDetails() {
  const { diagnosisId } = useParams();
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH DIAGNOSIS DETAILS
  // =========================================================
  useEffect(() => {
    const fetchDiagnosis = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/diagnosis/${diagnosisId}`);

        setDiagnosis(response.data);
      } catch (err) {
        console.error("Diagnosis details error:", err);

        if (err.response?.status === 404) {
          setError("Diagnosis record not found.");
        } else if (err.request) {
          setError("Unable to connect to the MedVision AI backend.");
        } else {
          setError("Unable to load diagnosis details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [diagnosisId]);

  // =========================================================
  // DOWNLOAD MEDICAL REPORT
  // =========================================================
  const handleDownloadReport = async () => {
    if (!diagnosis?.report_id) {
      setError("Medical report ID is not available.");
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const response = await api.get(
        `/diagnosis/report/${diagnosis.report_id}`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `MedVisionAI_Report_${diagnosis.report_id}.pdf`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Medical report download error:", err);

      if (err.response?.status === 404) {
        setError("Medical report could not be found.");
      } else if (err.request) {
        setError("Unable to connect to the MedVision AI backend.");
      } else {
        setError("Unable to download the medical report.");
      }
    } finally {
      setDownloading(false);
    }
  };

  // =========================================================
  // LOADING STATE
  // =========================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="h-32 rounded-2xl bg-white shadow-sm" />
            <div className="h-64 rounded-2xl bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR STATE
  // =========================================================
  if (error && !diagnosis) {
    return (
      <div className="min-h-screen bg-slate-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate("/history")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft size={18} />
            Back to History
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="mt-0.5 text-red-600" />

              <div>
                <h2 className="font-semibold text-red-800">
                  Unable to load diagnosis
                </h2>

                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // SAFE DATA VALUES
  // =========================================================
  const isAbnormal = diagnosis?.result_status === "ABNORMAL";

  const statusText = isAbnormal
    ? "Potential Abnormality Detected"
    : "No Abnormality Detected";

  const primaryDisease = diagnosis?.predicted_disease || "No specific finding";

  const confidence =
    typeof diagnosis?.confidence_score === "number"
      ? diagnosis.confidence_score
      : 0;

  const findings = Array.isArray(diagnosis?.findings) ? diagnosis.findings : [];

  // =========================================================
  // HANDLE ALL PREDICTIONS
  // =========================================================
  let allPredictions = [];

  if (Array.isArray(diagnosis?.all_predictions)) {
    allPredictions = diagnosis.all_predictions;
  } else if (
    diagnosis?.all_predictions &&
    typeof diagnosis.all_predictions === "object"
  ) {
    allPredictions = Object.entries(diagnosis.all_predictions).map(
      ([disease, probability]) => ({
        disease,
        probability,
      }),
    );
  }

  // Sort highest probability first
  allPredictions = [...allPredictions].sort((a, b) => {
    const probabilityA =
      typeof a.probability === "number"
        ? a.probability
        : parseFloat(a.probability) || 0;

    const probabilityB =
      typeof b.probability === "number"
        ? b.probability
        : parseFloat(b.probability) || 0;

    return probabilityB - probabilityA;
  });

  // =========================================================
  // FORMAT DATE
  // =========================================================
  const formattedDate = diagnosis?.timestamp
    ? new Date(diagnosis.timestamp).toLocaleString()
    : "Not available";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            TOP HEADER
        ===================================================== */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => navigate("/history")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              <ArrowLeft size={18} />
              Back to History
            </button>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Diagnosis Details
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Review the AI-assisted assessment and generated medical report.
            </p>
          </div>

          {/* Download Button */}
          {diagnosis?.report_id && (
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={18} />

              {downloading ? "Downloading..." : "Download Medical Report"}
            </button>
          )}
        </div>

        {/* =====================================================
            ERROR MESSAGE
        ===================================================== */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertTriangle size={18} />
              {error}
            </div>
          </div>
        )}

        {/* =====================================================
            STATUS CARD
        ===================================================== */}
        <div
          className={`mb-6 overflow-hidden rounded-2xl border shadow-sm ${
            isAbnormal
              ? "border-amber-200 bg-amber-50"
              : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    isAbnormal
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {isAbnormal ? (
                    <AlertTriangle size={26} />
                  ) : (
                    <CheckCircle2 size={26} />
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    AI Assessment
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {statusText}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Primary finding:{" "}
                    <span className="font-semibold text-slate-800">
                      {primaryDisease}
                    </span>
                  </p>
                </div>
              </div>

              {/* Confidence */}
              <div className="rounded-xl bg-white/70 px-5 py-4 md:min-w-[180px]">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Confidence
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {confidence.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            DIAGNOSIS INFORMATION
        ===================================================== */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Diagnosis Info */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <FileText size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Diagnosis Information
                </h2>

                <p className="text-xs text-slate-500">
                  Assessment record details
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Diagnosis ID</span>

                <span className="text-sm font-semibold text-slate-800">
                  {diagnosis?.diagnosis_id || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Report ID</span>

                <span className="text-sm font-semibold text-slate-800">
                  {diagnosis?.report_id || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Assessment Date</span>

                <span className="text-right text-sm font-semibold text-slate-800">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Model Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  AI Model Information
                </h2>

                <p className="text-xs text-slate-500">
                  Model used for this assessment
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Model</span>

                <span className="text-sm font-semibold text-slate-800">
                  DenseNet121
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Task</span>

                <span className="text-sm font-semibold text-slate-800">
                  Chest X-ray Analysis
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Assessment Type</span>

                <span className="text-sm font-semibold text-slate-800">
                  AI-Assisted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            DETECTED FINDINGS
        ===================================================== */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Detected Findings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Conditions identified above the configured assessment threshold.
            </p>
          </div>

          {findings.length === 0 ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={22} className="text-emerald-600" />

                <div>
                  <p className="font-semibold text-emerald-800">
                    No significant findings detected
                  </p>

                  <p className="mt-1 text-sm text-emerald-700">
                    All evaluated disease probabilities were below the current
                    prototype threshold.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {findings.map((finding, index) => {
                const disease =
                  finding?.disease ||
                  finding?.name ||
                  finding?.condition ||
                  "Unknown finding";

                const probability =
                  typeof finding?.probability === "number"
                    ? finding.probability
                    : typeof finding?.confidence === "number"
                      ? finding.confidence
                      : parseFloat(
                          finding?.probability ?? finding?.confidence ?? 0,
                        ) || 0;

                return (
                  <div
                    key={`${disease}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {disease}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          AI probability
                        </p>
                      </div>

                      <span className="rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-slate-800 shadow-sm">
                        {probability.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-700 transition-all"
                        style={{
                          width: `${Math.min(Math.max(probability, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            ALL 14 PREDICTIONS
        ===================================================== */}
        {allPredictions.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900">
                All AI Predictions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Probability scores generated for all evaluated conditions.
              </p>
            </div>

            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {allPredictions.map((prediction, index) => {
                const disease =
                  prediction?.disease ||
                  prediction?.name ||
                  prediction?.condition ||
                  `Prediction ${index + 1}`;

                const probability =
                  typeof prediction?.probability === "number"
                    ? prediction.probability
                    : parseFloat(prediction?.probability) || 0;

                return (
                  <div key={`${disease}-${index}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {disease}
                      </span>

                      <span className="text-sm font-semibold text-slate-900">
                        {probability.toFixed(2)}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-400"
                        style={{
                          width: `${Math.min(Math.max(probability, 0), 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================
            MEDICAL REPORT
        ===================================================== */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <FileText size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">Medical Report</h2>

                <p className="mt-1 text-sm text-slate-500">
                  A generated PDF report is available for this assessment.
                </p>
              </div>
            </div>

            {diagnosis?.report_id && (
              <button
                onClick={handleDownloadReport}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={17} />

                {downloading ? "Downloading..." : "Download PDF"}
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            AI DISCLAIMER
        ===================================================== */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-blue-600" />

            <div>
              <h3 className="font-semibold text-blue-900">
                AI-Assisted Assessment
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                {diagnosis?.ai_disclaimer ||
                  "This AI-generated assessment is intended to assist medical professionals and is not a definitive diagnosis. Clinical interpretation and final decisions should be made by a qualified healthcare professional."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiagnosisDetails;
