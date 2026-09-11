// ============================================================
// MedVision AI - X-ray Analysis Page
// ============================================================
// This page handles:
// 1. Patient information
// 2. X-ray image upload
// 3. AI analysis
// 4. Professional result presentation
// 5. Disease probability visualization
// 6. Medical safety disclaimer
// ============================================================

import { useState } from "react";
import {
  Upload,
  FileImage,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  User,
  Activity,
  ShieldCheck,
  Brain,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import api from "../services/api";

// ============================================================
// Disease Name Formatter
// ============================================================
// Converts:
// Pleural_Thickening
//
// Into:
// Pleural Thickening
// ============================================================

function formatDiseaseName(name) {
  return name.replaceAll("_", " ");
}

// ============================================================
// Probability Bar
// ============================================================

function ProbabilityBar({ probability }) {
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Probability</span>

        <span className="text-xs font-semibold text-slate-700">
          {probability.toFixed(2)}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-600 transition-all duration-700"
          style={{
            width: `${Math.min(probability, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function Analyze() {
  // ----------------------------------------------------------
  // Patient Information
  // ----------------------------------------------------------

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // ----------------------------------------------------------
  // X-ray File
  // ----------------------------------------------------------

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // ----------------------------------------------------------
  // Analysis State
  // ----------------------------------------------------------

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ----------------------------------------------------------
  // Result
  // ----------------------------------------------------------

  const [result, setResult] = useState(null);

  // ----------------------------------------------------------
  // Error
  // ----------------------------------------------------------

  const [error, setError] = useState("");

  // ----------------------------------------------------------
  // Show All Predictions
  // ----------------------------------------------------------

  const [showAllPredictions, setShowAllPredictions] = useState(false);

  // ==========================================================
  // Handle File Selection
  // ==========================================================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // --------------------------------------------------------
    // Validate file type
    // --------------------------------------------------------

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid X-ray image.");

      return;
    }

    // --------------------------------------------------------
    // Store file
    // --------------------------------------------------------

    setFile(selectedFile);

    // --------------------------------------------------------
    // Create preview
    // --------------------------------------------------------

    const imageUrl = URL.createObjectURL(selectedFile);

    setPreview(imageUrl);

    // --------------------------------------------------------
    // Clear previous state
    // --------------------------------------------------------

    setError("");
    setResult(null);
  };

  // ==========================================================
  // Remove Selected File
  // ==========================================================

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  // ==========================================================
  // Analyze X-ray
  // ==========================================================

  const handleAnalyze = async () => {
    // --------------------------------------------------------
    // Clear previous error
    // --------------------------------------------------------

    setError("");

    // --------------------------------------------------------
    // Validate age
    // --------------------------------------------------------

    const numericAge = Number(age);

    if (!age || Number.isNaN(numericAge)) {
      setError("Please enter the patient's age.");

      return;
    }

    if (numericAge < 1 || numericAge > 120) {
      setError("Age must be between 1 and 120.");

      return;
    }

    // --------------------------------------------------------
    // Validate gender
    // --------------------------------------------------------

    if (!gender) {
      setError("Please select the patient's gender.");

      return;
    }

    // --------------------------------------------------------
    // Validate file
    // --------------------------------------------------------

    if (!file) {
      setError("Please upload a chest X-ray image.");

      return;
    }

    // --------------------------------------------------------
    // Start loading
    // --------------------------------------------------------

    setIsAnalyzing(true);

    try {
      // ------------------------------------------------------
      // Create multipart form data
      // ------------------------------------------------------

      const formData = new FormData();

      formData.append("file", file);
      formData.append("age", numericAge);
      formData.append("gender", gender);

      // ------------------------------------------------------
      // Send X-ray to FastAPI
      // ------------------------------------------------------

      const response = await api.post("/diagnosis/upload", formData);

      // ------------------------------------------------------
      // Store backend result
      // ------------------------------------------------------

      setResult(response.data);
    } catch (err) {
      console.error("X-ray analysis error:", err);

      // ------------------------------------------------------
      // Backend returned an error
      // ------------------------------------------------------

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "The backend could not process the X-ray.",
        );
      }

      // ------------------------------------------------------
      // Request reached no server
      // ------------------------------------------------------
      else if (err.request) {
        setError("Unable to connect to the MedVision AI backend.");
      }

      // ------------------------------------------------------
      // Unknown error
      // ------------------------------------------------------
      else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==========================================================
  // Download Medical Report
  // ==========================================================
  // Downloads the PDF generated by the FastAPI backend.
  //
  // Endpoint:
  // GET /diagnosis/report/{report_id}
  //
  // The Axios instance automatically attaches the JWT token
  // through the request interceptor in services/api.js.
  // ==========================================================

  const handleDownloadReport = async () => {
    if (!result?.report_id) {
      setError("Medical report ID is not available.");
      return;
    }

    try {
      // ------------------------------------------------------
      // Request the PDF from the backend
      // ------------------------------------------------------

      const response = await api.get(`/diagnosis/report/${result.report_id}`, {
        responseType: "blob",
      });

      // ------------------------------------------------------
      // Convert the backend response into a browser URL
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

      link.download = `MedVisionAI_Report_${result.report_id}.pdf`;

      document.body.appendChild(link);

      // ------------------------------------------------------
      // Start download
      // ------------------------------------------------------

      link.click();

      // ------------------------------------------------------
      // Clean up temporary elements
      // ------------------------------------------------------

      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Medical report download error:", err);

      // ------------------------------------------------------
      // Handle backend error
      // ------------------------------------------------------

      if (err.response) {
        setError("Unable to download the medical report.");
      } else if (err.request) {
        setError("Unable to connect to the MedVision AI backend.");
      } else {
        setError("An unexpected error occurred while downloading the report.");
      }
    }
  };
  // ==========================================================
  // New Analysis
  // ==========================================================

  const handleNewAnalysis = () => {
    setAge("");
    setGender("");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError("");
    setShowAllPredictions(false);
  };

  // ==========================================================
  // RESULT VIEW
  // ==========================================================

  if (result) {
    const isAbnormal = result.result?.status === "ABNORMAL";

    return (
      <div className="min-h-screen bg-slate-50">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="rounded-lg bg-cyan-50 p-2">
                    <Brain className="text-cyan-700" size={22} />
                  </div>

                  <h1 className="text-2xl font-bold text-slate-900">
                    AI Analysis Report
                  </h1>
                </div>

                <p className="text-sm text-slate-500">
                  Chest X-ray AI-assisted assessment
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleNewAnalysis}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  New Analysis
                </button>

                <button
                  onClick={handleDownloadReport}
                  className="flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
                >
                  <Download size={17} />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            Main Content
        ================================================== */}

        <main className="mx-auto max-w-7xl px-6 py-8">
          {/* ==================================================
              Status Banner
          ================================================== */}

          <div
            className={`mb-6 rounded-xl border p-5 ${
              isAbnormal
                ? "border-amber-200 bg-amber-50"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`rounded-full p-2 ${
                  isAbnormal ? "bg-amber-100" : "bg-emerald-100"
                }`}
              >
                {isAbnormal ? (
                  <AlertTriangle size={24} className="text-amber-600" />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-600" />
                )}
              </div>

              <div>
                <h2
                  className={`text-lg font-bold ${
                    isAbnormal ? "text-amber-900" : "text-emerald-900"
                  }`}
                >
                  {isAbnormal
                    ? "Potential Abnormality Detected"
                    : "No Abnormality Detected"}
                </h2>

                <p
                  className={`mt-1 text-sm ${
                    isAbnormal ? "text-amber-800" : "text-emerald-800"
                  }`}
                >
                  {result.result?.summary}
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              Patient + AI Summary
          ================================================== */}

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            {/* ------------------------------------------------
                Patient Information
            ------------------------------------------------ */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <User size={20} className="text-blue-700" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Patient Information
                  </h2>

                  <p className="text-xs text-slate-500">
                    Patient details submitted for analysis
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Patient ID
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.patient_id}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Age</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.age} years
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Gender</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.gender}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Report ID
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.report_id}
                  </p>
                </div>
              </div>
            </section>

            {/* ------------------------------------------------
                AI Assessment
            ------------------------------------------------ */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-2">
                  <Activity size={20} className="text-cyan-700" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">AI Assessment</h2>

                  <p className="text-xs text-slate-500">
                    Primary model prediction
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Predicted Finding
                </p>

                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {formatDiseaseName(result.predicted_disease)}
                </h3>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Confidence
                    </span>

                    <span className="text-lg font-bold text-cyan-700">
                      {result.confidence_score.toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(result.confidence_score, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              X-ray Image + Findings
          ================================================== */}

          <div className="mb-6 grid gap-6 lg:grid-cols-5">
            {/* ------------------------------------------------
                X-ray Image
            ------------------------------------------------ */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <FileImage size={20} className="text-slate-700" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">X-ray Image</h2>

                  <p className="text-xs text-slate-500">
                    Uploaded chest radiograph
                  </p>
                </div>
              </div>

              {preview && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                  <img
                    src={preview}
                    alt="Uploaded chest X-ray"
                    className="max-h-[500px] w-full object-contain"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <FileText size={14} />

                <span className="truncate">{result.filename}</span>
              </div>
            </section>

            {/* ------------------------------------------------
                Detected Findings
            ------------------------------------------------ */}

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-50 p-2">
                    <AlertTriangle size={20} className="text-amber-600" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Detected Findings
                    </h2>

                    <p className="text-xs text-slate-500">
                      Findings above the current AI threshold
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                  {result.findings?.length || 0} detected
                </span>
              </div>

              <div className="space-y-4">
                {result.findings?.map((finding) => (
                  <div
                    key={finding.disease}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />

                        <span className="font-semibold text-slate-800">
                          {formatDiseaseName(finding.disease)}
                        </span>
                      </div>

                      <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                        Positive
                      </span>
                    </div>

                    <ProbabilityBar probability={finding.probability} />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ==================================================
              Top Predictions
          ================================================== */}

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-50 p-2">
                  <Brain size={20} className="text-violet-700" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Top Model Predictions
                  </h2>

                  <p className="text-xs text-slate-500">
                    Highest probability disease predictions
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {result.top_predictions?.map((prediction, index) => (
                <div
                  key={prediction.disease}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      #{index + 1}
                    </span>

                    <span className="text-sm font-bold text-cyan-700">
                      {prediction.probability.toFixed(2)}%
                    </span>
                  </div>

                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    {formatDiseaseName(prediction.disease)}
                  </p>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${Math.min(prediction.probability, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================================================
              All Predictions
          ================================================== */}

          <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <button
              onClick={() => setShowAllPredictions(!showAllPredictions)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2">
                  <Activity size={20} className="text-slate-700" />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Complete Model Predictions
                  </h2>

                  <p className="text-xs text-slate-500">
                    All 14 disease probabilities
                  </p>
                </div>
              </div>

              {showAllPredictions ? (
                <ChevronUp size={20} className="text-slate-500" />
              ) : (
                <ChevronDown size={20} className="text-slate-500" />
              )}
            </button>

            {showAllPredictions && (
              <div className="border-t border-slate-200 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(result.all_predictions || {})
                    .sort(([, a], [, b]) => b - a)
                    .map(([disease, probability]) => (
                      <div
                        key={disease}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {formatDiseaseName(disease)}
                          </span>

                          <span className="text-sm font-bold text-slate-900">
                            {probability.toFixed(2)}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-cyan-500"
                            style={{
                              width: `${Math.min(probability, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* ==================================================
              AI Model Information
          ================================================== */}

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-50 p-2">
                <ShieldCheck size={20} className="text-cyan-700" />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  AI Model Information
                </h2>

                <p className="text-xs text-slate-500">
                  Technical information about this assessment
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Model Architecture</p>

                <p className="mt-1 font-bold text-slate-900">DenseNet121</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Classification Type</p>

                <p className="mt-1 font-bold text-slate-900">Multi-Label</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Disease Classes</p>

                <p className="mt-1 font-bold text-slate-900">14</p>
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Diagnosis ID</p>

                <p className="mt-1 font-bold text-slate-900">
                  {result.diagnosis_id}
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================
              Medical Disclaimer
          ================================================== */}

          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <h3 className="font-bold text-red-900">
                  Important Medical Disclaimer
                </h3>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  MedVision AI provides an AI-assisted assessment of chest X-ray
                  images and is intended for research and decision-support
                  purposes only. The results are not a definitive medical
                  diagnosis and should not replace evaluation by a qualified
                  healthcare professional.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================================
  // UPLOAD / ANALYSIS VIEW
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          Page Header
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3">
              <Brain size={24} className="text-cyan-700" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Analyze Chest X-ray
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Upload an X-ray image for AI-assisted assessment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          Main Upload Area
      ====================================================== */}

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* ====================================================
            Error Message
        ==================================================== */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-600" />

            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* ====================================================
            Patient Information
        ==================================================== */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2">
              <User size={20} className="text-blue-700" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Patient Information</h2>

              <p className="text-xs text-slate-500">
                Required for the analysis record
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Age */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Age
              </label>

              <input
                type="number"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter patient age"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            {/* Gender */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Gender
              </label>

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
              >
                <option value="">Select gender</option>

                <option value="Male">Male</option>

                <option value="Female">Female</option>

                <option value="Other">Other</option>

                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </section>

        {/* ====================================================
            X-ray Upload
        ==================================================== */}

        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-50 p-2">
              <FileImage size={20} className="text-cyan-700" />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Chest X-ray</h2>

              <p className="text-xs text-slate-500">
                Upload a chest radiograph image
              </p>
            </div>
          </div>

          {!file ? (
            <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 transition hover:border-cyan-500 hover:bg-cyan-50/30">
              <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                <Upload size={30} className="text-cyan-700" />
              </div>

              <p className="text-base font-semibold text-slate-800">
                Click to upload X-ray
              </p>

              <p className="mt-1 text-sm text-slate-500">JPG, JPEG or PNG</p>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-lg bg-cyan-50 p-2">
                    <FileImage size={20} className="text-cyan-700" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  onClick={removeFile}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  title="Remove image"
                >
                  <X size={20} />
                </button>
              </div>

              {preview && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                  <img
                    src={preview}
                    alt="X-ray preview"
                    className="max-h-[550px] w-full object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* ====================================================
            Analyze Button
        ==================================================== */}

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-700 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={21} className="animate-spin" />
              AI is analyzing the X-ray...
            </>
          ) : (
            <>
              <Brain size={21} />
              Analyze X-ray
            </>
          )}
        </button>

        {/* ====================================================
            Safety Notice
        ==================================================== */}

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-700" />

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                AI-Assisted Assessment
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                This system provides AI-assisted analysis of chest X-ray images
                for research and decision-support purposes. Results should be
                reviewed by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
