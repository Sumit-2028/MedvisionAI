// ============================================================
// MedVision AI - Chest X-Ray Analysis
// ============================================================
//
// Physician workflow:
//
// 1. Choose patient
// 2. Create new patient OR select existing patient
// 3. Confirm patient
// 4. Upload X-ray
// 5. Send patient_id + X-ray to FastAPI
// 6. Display AI-assisted assessment
// 7. Download generated medical report
//
// Special workflow:
//
// Patients -> Patient Details -> Analyze New X-Ray
//
// In that case, the patient ID is received through React Router
// location.state and the patient is automatically selected.
//
// ============================================================

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  FileImage,
  FileText,
  Loader2,
  Plus,
  ScanLine,
  ShieldCheck,
  User,
  Users,
  Upload,
  X,
  Activity,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import api from "../services/api";

// ============================================================
// Disease Name Formatter
// ============================================================

function formatDiseaseName(name = "") {
  return name.replaceAll("_", " ");
}

// ============================================================
// Patient Response Helpers
// ============================================================
//
// The backend may return patient data in different valid shapes,
// for example:
//
//   1. [patient1, patient2, ...]
//   2. { patients: [patient1, patient2, ...] }
//   3. { data: [patient1, patient2, ...] }
//
// Likewise, a single patient may be returned as:
//
//   1. patient object directly
//   2. { patient: patient }
//   3. { data: patient }
//
// These helpers keep the UI safe regardless of which response
// wrapper the API uses.
// ============================================================

function normalizePatientList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.patients)) {
    return data.patients;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizePatient(data) {
  if (data?.patient && typeof data.patient === "object") {
    return data.patient;
  }

  if (
    data?.data &&
    typeof data.data === "object" &&
    !Array.isArray(data.data)
  ) {
    return data.data;
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data;
  }

  return null;
}

// ============================================================
// Probability Bar
// ============================================================

function ProbabilityBar({ probability = 0 }) {
  const numericProbability = Number(probability) || 0;

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Probability</span>

        <span className="text-xs font-semibold text-slate-700">
          {numericProbability.toFixed(2)}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-cyan-600 transition-all duration-700"
          style={{
            width: `${Math.min(numericProbability, 100)}%`,
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
  const navigate = useNavigate();

  const location = useLocation();

  const fileInputRef = useRef(null);

  // ==========================================================
  // Workflow
  // ==========================================================
  //
  // choose  -> choose create/select
  // create  -> create patient
  // select  -> select existing patient
  // upload  -> upload X-ray
  //
  // ==========================================================

  const [workflowStep, setWorkflowStep] = useState("choose");

  // ==========================================================
  // Patient State
  // ==========================================================

  const [selectedPatient, setSelectedPatient] = useState(null);

  const [patients, setPatients] = useState([]);

  const [patientSearch, setPatientSearch] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(false);

  // ==========================================================
  // New Patient Form
  // ==========================================================

  const [patientName, setPatientName] = useState("");

  const [patientAge, setPatientAge] = useState("");

  const [patientGender, setPatientGender] = useState("");

  const [patientContact, setPatientContact] = useState("");

  // ==========================================================
  // X-Ray State
  // ==========================================================

  const [file, setFile] = useState(null);

  const [preview, setPreview] = useState(null);

  // ==========================================================
  // Analysis State
  // ==========================================================

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [result, setResult] = useState(null);

  // ==========================================================
  // Error State
  // ==========================================================

  const [error, setError] = useState("");

  // ==========================================================
  // Predictions
  // ==========================================================

  const [showAllPredictions, setShowAllPredictions] = useState(false);

  // ==========================================================
  // Load patients
  // ==========================================================

  const loadPatients = async () => {
    try {
      setLoadingPatients(true);

      setError("");

      // --------------------------------------------------------
      // Request the patients owned by the logged-in physician.
      // --------------------------------------------------------

      const response = await api.get("/users/patients");

      console.log("GET /users/patients response:", response.data);

      // --------------------------------------------------------
      // IMPORTANT:
      // The API response can be either an array or an object
      // containing the array. Always normalize it before storing
      // it in state so patients.filter() never crashes.
      // --------------------------------------------------------

      const patientList = normalizePatientList(response.data);

      setPatients(patientList);
    } catch (err) {
      console.error("Patient loading error:", err);

      // Always keep patients as an array after an error.
      setPatients([]);

      setError(err.response?.data?.detail || "Unable to load your patients.");
    } finally {
      setLoadingPatients(false);
    }
  };

  // ==========================================================
  // Handle Patient Details -> Analyze New X-Ray
  // ==========================================================
  //
  // PatientDetails.jsx sends:
  //
  // navigate("/analyze", {
  //   state: {
  //     patientId: patient.patient_id
  //   }
  // })
  //
  // We detect that patientId here and automatically load
  // that patient's complete information.
  //
  // ==========================================================

  useEffect(() => {
    const incomingPatientId = location.state?.patientId;

    // --------------------------------------------------------
    // No patient passed from another page
    // --------------------------------------------------------

    if (!incomingPatientId) {
      return;
    }

    const loadSelectedPatient = async () => {
      try {
        setLoadingPatients(true);

        setError("");

        // ----------------------------------------------------
        // Fetch complete patient information
        // ----------------------------------------------------

        const response = await api.get(`/users/patients/${incomingPatientId}`);

        // ----------------------------------------------------
        // Normalize the response.
        //
        // This supports both:
        //   { patient: {...} }
        // and:
        //   {...patient fields...}
        // ----------------------------------------------------

        const patient = normalizePatient(response.data);

        if (!patient?.patient_id) {
          console.error(
            "Invalid patient response from /users/patients/{id}:",
            response.data,
          );

          setError("Unable to load the selected patient's information.");

          setWorkflowStep("choose");

          return;
        }

        // ----------------------------------------------------
        // Store the complete patient object.
        // ----------------------------------------------------

        setSelectedPatient(patient);

        // ----------------------------------------------------
        // Skip the patient selection screens because the
        // patient was already selected from Patient Details.
        // ----------------------------------------------------

        setWorkflowStep("upload");
      } catch (err) {
        console.error("Selected patient loading error:", err);

        setError(
          err.response?.data?.detail || "Unable to load the selected patient.",
        );

        setWorkflowStep("choose");
      } finally {
        setLoadingPatients(false);
      }
    };

    loadSelectedPatient();

    // --------------------------------------------------------
    // Clear router state after reading it
    //
    // This prevents the patient from being automatically
    // selected again if the page is refreshed/revisited.
    // --------------------------------------------------------

    navigate(location.pathname, {
      replace: true,
      state: {},
    });
  }, [location, navigate]);

  // ==========================================================
  // Select Existing Patient Screen
  // ==========================================================
  //
  // Load patients only when the physician enters the
  // existing-patient selection screen.
  //
  // ==========================================================

  useEffect(() => {
    if (workflowStep !== "select") {
      return;
    }

    void Promise.resolve().then(() => loadPatients());
  }, [workflowStep]);

  // ==========================================================
  // Create New Patient
  // ==========================================================

  const handleCreatePatient = async () => {
    setError("");

    // --------------------------------------------------------
    // Validate name
    // --------------------------------------------------------

    if (!patientName.trim()) {
      setError("Please enter the patient's full name.");

      return;
    }

    if (patientName.trim().length < 2) {
      setError("Patient name must contain at least 2 characters.");

      return;
    }

    // --------------------------------------------------------
    // Validate age
    // --------------------------------------------------------

    const numericAge = Number(patientAge);

    if (!patientAge || Number.isNaN(numericAge)) {
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

    if (!patientGender) {
      setError("Please select the patient's gender.");

      return;
    }

    try {
      setLoadingPatients(true);

      // ------------------------------------------------------
      // Create patient
      // ------------------------------------------------------

      const response = await api.post("/users/patients", {
        full_name: patientName.trim(),
        age: numericAge,
        gender: patientGender,
        contact_information: patientContact.trim() || null,
      });

      // ------------------------------------------------------
      // Normalize the create-patient response.
      //
      // The backend may return:
      //   { patient: {...} }
      // or the patient object directly.
      //
      // This is important because the upload step requires
      // selectedPatient.patient_id.
      // ------------------------------------------------------

      const createdPatient = normalizePatient(response.data);

      console.log("POST /users/patients response:", response.data);

      if (!createdPatient?.patient_id) {
        console.error("Invalid create-patient response:", response.data);

        setError(
          "Patient was created, but the patient information could not be loaded.",
        );

        return;
      }

      // ------------------------------------------------------
      // Store the newly created patient.
      // ------------------------------------------------------

      setSelectedPatient(createdPatient);

      // ------------------------------------------------------
      // Keep the new patient in local state as well.
      // This means it will immediately appear if the physician
      // goes back to the existing-patient selection screen.
      // ------------------------------------------------------

      setPatients((currentPatients) => {
        const safePatients = Array.isArray(currentPatients)
          ? currentPatients
          : [];

        const alreadyExists = safePatients.some(
          (item) => item.patient_id === createdPatient.patient_id,
        );

        if (alreadyExists) {
          return safePatients;
        }

        return [createdPatient, ...safePatients];
      });

      // ------------------------------------------------------
      // Move directly to X-ray upload.
      // ------------------------------------------------------

      setWorkflowStep("upload");

      // ------------------------------------------------------
      // Clear form
      // ------------------------------------------------------

      setPatientName("");

      setPatientAge("");

      setPatientGender("");

      setPatientContact("");
    } catch (err) {
      console.error("Patient creation error:", err);

      setError(err.response?.data?.detail || "Unable to create the patient.");
    } finally {
      setLoadingPatients(false);
    }
  };

  // ==========================================================
  // Select Existing Patient
  // ==========================================================

  const handleSelectPatient = async (patient) => {
    try {
      setError("");

      setLoadingPatients(true);

      // ------------------------------------------------------
      // Fetch complete patient details
      // ------------------------------------------------------

      const response = await api.get(`/users/patients/${patient.patient_id}`);

      // ------------------------------------------------------
      // Normalize the selected patient's response so the upload
      // step always receives the actual patient object.
      // ------------------------------------------------------

      const completePatient = normalizePatient(response.data);

      if (!completePatient?.patient_id) {
        console.error("Invalid selected-patient response:", response.data);

        setError("Unable to load the selected patient's information.");

        return;
      }

      setSelectedPatient(completePatient);

      // ------------------------------------------------------
      // Move to upload after the patient has been confirmed.
      // ------------------------------------------------------

      setWorkflowStep("upload");
    } catch (err) {
      console.error("Patient selection error:", err);

      setError(err.response?.data?.detail || "Unable to select this patient.");
    } finally {
      setLoadingPatients(false);
    }
  };

  // ==========================================================
  // Filter Patients
  // ==========================================================

  // ----------------------------------------------------------
  // Always filter an array.
  //
  // This is a defensive safeguard in addition to
  // normalizePatientList(). If the API ever returns an
  // unexpected response, the Select Existing Patient screen
  // will show an empty state instead of crashing the page.
  // ----------------------------------------------------------

  const safePatients = Array.isArray(patients) ? patients : [];

  const filteredPatients = safePatients.filter((patient) => {
    const search = patientSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    const patientId = String(patient?.patient_id ?? "").toLowerCase();
    const patientName = String(patient?.full_name ?? "").toLowerCase();
    const patientGender = String(patient?.gender ?? "").toLowerCase();

    return (
      patientId.includes(search) ||
      patientName.includes(search) ||
      patientGender.includes(search)
    );
  });

  // ==========================================================
  // File Selection
  // ==========================================================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setError("");

    // --------------------------------------------------------
    // Validate image type
    // --------------------------------------------------------

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid X-ray image.");

      return;
    }

    // --------------------------------------------------------
    // Validate file size
    // Backend also has a 10 MB limit.
    // --------------------------------------------------------

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("Image size must be 10 MB or smaller.");

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
    // Clear previous result
    // --------------------------------------------------------

    setResult(null);
  };

  // ==========================================================
  // Remove X-Ray
  // ==========================================================

  const removeFile = () => {
    setFile(null);

    setPreview(null);

    setResult(null);

    setError("");

    setShowAllPredictions(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================================
  // Analyze X-Ray
  // ==========================================================
  //
  // IMPORTANT:
  //
  // We no longer send age/gender from the frontend.
  //
  // Patient information is already stored in PostgreSQL.
  //
  // The upload request contains:
  //
  // file
  // patient_id
  //
  // ==========================================================

  const handleAnalyze = async () => {
    setError("");

    // --------------------------------------------------------
    // Validate selected patient
    // --------------------------------------------------------

    if (!selectedPatient?.patient_id) {
      console.error(
        "Analyze blocked because no valid patient is selected:",
        selectedPatient,
      );

      setError("Please select a patient before uploading the X-ray.");

      return;
    }

    // --------------------------------------------------------
    // Validate file
    // --------------------------------------------------------

    if (!file) {
      setError("Please upload a chest X-ray image.");

      return;
    }

    setIsAnalyzing(true);

    try {
      // ------------------------------------------------------
      // Create multipart request
      // ------------------------------------------------------

      const formData = new FormData();

      formData.append("file", file);

      formData.append("patient_id", String(selectedPatient.patient_id));

      // ------------------------------------------------------
      // Send request
      // ------------------------------------------------------

      const response = await api.post("/diagnosis/upload", formData);

      // ------------------------------------------------------
      // Store AI result
      // ------------------------------------------------------

      setResult(response.data);
    } catch (err) {
      console.error("X-ray analysis error:", err);

      if (err.response) {
        setError(
          err.response.data?.detail ||
            "The backend could not process the X-ray.",
        );
      } else if (err.request) {
        setError("Unable to connect to the MedVision AI backend.");
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ==========================================================
  // Download Medical Report
  // ==========================================================

  const handleDownloadReport = async () => {
    if (!result?.report_id) {
      setError("Medical report ID is not available.");

      return;
    }

    try {
      setError("");

      const response = await api.get(`/diagnosis/report/${result.report_id}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download = `MedVisionAI_Report_${result.report_id}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Medical report download error:", err);

      setError("Unable to download the medical report.");
    }
  };

  // ==========================================================
  // Start New Analysis
  // ==========================================================

  const handleNewAnalysis = () => {
    setWorkflowStep("choose");

    setSelectedPatient(null);

    setFile(null);

    setPreview(null);

    setResult(null);

    setError("");

    setPatientSearch("");

    setShowAllPredictions(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================================
  // Change Patient
  // ==========================================================

  const handleChangePatient = () => {
    setSelectedPatient(null);

    setFile(null);

    setPreview(null);

    setResult(null);

    setError("");

    setPatientSearch("");

    setWorkflowStep("choose");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

              <div className="flex flex-wrap gap-3">
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
              Error
          ================================================== */}

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

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
                    Patient associated with this assessment
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Patient Name
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.patient_name || selectedPatient?.full_name || "N/A"}
                  </p>
                </div>

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
                    {result.age ?? selectedPatient?.age ?? "N/A"} years
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">Gender</p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.gender || selectedPatient?.gender || "N/A"}
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

                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Diagnosis ID
                  </p>

                  <p className="mt-1 font-bold text-slate-900">
                    {result.diagnosis_id}
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
                  {formatDiseaseName(
                    result.predicted_disease || "No abnormality detected",
                  )}
                </h3>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">
                      Confidence
                    </span>

                    <span className="text-lg font-bold text-cyan-700">
                      {Number(result.confidence_score || 0).toFixed(2)}%
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-600 transition-all duration-700"
                      style={{
                        width: `${Math.min(
                          Number(result.confidence_score || 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              X-ray + Findings
          ================================================== */}

          <div className="mb-6 grid gap-6 lg:grid-cols-5">
            {/* ------------------------------------------------
                X-ray
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
                Findings
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

              {result.findings?.length > 0 ? (
                <div className="space-y-4">
                  {result.findings.map((finding) => (
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
              ) : (
                <div className="rounded-xl bg-emerald-50 p-6 text-center">
                  <CheckCircle2
                    className="mx-auto text-emerald-600"
                    size={30}
                  />

                  <p className="mt-2 text-sm font-semibold text-emerald-800">
                    No findings above the current threshold.
                  </p>
                </div>
              )}
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
                      {Number(prediction.probability || 0).toFixed(2)}%
                    </span>
                  </div>

                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    {formatDiseaseName(prediction.disease)}
                  </p>

                  <ProbabilityBar probability={prediction.probability} />
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
                            {Number(probability).toFixed(2)}%
                          </span>
                        </div>

                        <ProbabilityBar probability={probability} />
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
              Disclaimer
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
  // MAIN WORKFLOW
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          Header
      ====================================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-3">
              <ScanLine size={24} className="text-cyan-700" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-cyan-600">
                MedVision AI
              </p>

              <h1 className="text-2xl font-bold text-slate-900">
                Chest X-Ray Analysis
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                AI-assisted clinical imaging workflow
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          Main Content
      ====================================================== */}

      <main className="mx-auto max-w-6xl px-6 py-8">
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
            STEP 1 — CHOOSE PATIENT
        ==================================================== */}

        {workflowStep === "choose" && (
          <section className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-50">
                <Users size={32} className="text-cyan-700" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Select Patient
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose a patient before starting the chest X-ray analysis.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* ------------------------------------------------
                  Create New Patient
              ------------------------------------------------ */}

              <button
                onClick={() => {
                  setError("");

                  setWorkflowStep("create");
                }}
                className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Plus size={24} className="text-blue-700" />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Create New Patient
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Register a new patient and automatically generate a unique
                  patient ID.
                </p>

                <div className="mt-5 text-sm font-semibold text-cyan-700">
                  Add Patient →
                </div>
              </button>

              {/* ------------------------------------------------
                  Existing Patient
              ------------------------------------------------ */}

              <button
                onClick={() => {
                  setError("");

                  setWorkflowStep("select");
                }}
                className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                  <Users size={24} className="text-emerald-700" />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  Select Existing Patient
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Search your existing patient records and continue with their
                  X-ray analysis.
                </p>

                <div className="mt-5 text-sm font-semibold text-cyan-700">
                  Select Patient →
                </div>
              </button>
            </div>

            {/* Safety */}

            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-5 text-amber-800">
                  Patient information is securely associated with each X-ray
                  analysis and generated medical report.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 2 — CREATE PATIENT
        ==================================================== */}

        {workflowStep === "create" && (
          <section className="mx-auto max-w-3xl">
            <button
              onClick={() => {
                setError("");

                setWorkflowStep("choose");
              }}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-7">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <User size={23} className="text-blue-700" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Create New Patient
                    </h2>

                    <p className="text-sm text-slate-500">
                      Enter the patient's basic information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {/* Name */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient's full name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>

                {/* Age */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Age
                    <span className="text-red-500"> *</span>
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Enter age"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Age must be between 1 and 120.
                  </p>
                </div>

                {/* Gender */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Gender
                    <span className="text-red-500"> *</span>
                  </label>

                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  >
                    <option value="">Select gender</option>

                    <option value="Male">Male</option>

                    <option value="Female">Female</option>

                    <option value="Other">Other</option>

                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Contact */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Contact Information
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    placeholder="Phone number or other contact information"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              {/* Information */}

              <div className="mt-7 rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-cyan-600"
                  />

                  <p className="text-xs leading-5 text-cyan-800">
                    After creating the patient, a unique Patient ID will be
                    automatically assigned. You can then upload the patient's
                    chest X-ray.
                  </p>
                </div>
              </div>

              {/* Button */}

              <button
                onClick={handleCreatePatient}
                disabled={loadingPatients}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingPatients ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Patient...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Patient
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* ====================================================
            STEP 2 — SELECT EXISTING PATIENT
        ==================================================== */}

        {workflowStep === "select" && (
          <section className="mx-auto max-w-4xl">
            <button
              onClick={() => {
                setError("");

                setWorkflowStep("choose");
              }}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Select Existing Patient
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Search and select one of your patients.
              </p>
            </div>

            {/* Search */}

            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="relative">
                <Users
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by patient ID, name or gender..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            {/* Loading */}

            {loadingPatients ? (
              <div className="flex min-h-60 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center">
                  <Loader2
                    size={30}
                    className="mx-auto animate-spin text-cyan-600"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    Loading patients...
                  </p>
                </div>
              </div>
            ) : filteredPatients.length === 0 ? (
              /* Empty state */

              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                  <Users size={26} className="text-slate-400" />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No Patients Found
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {patientSearch
                    ? "Try a different search."
                    : "Create your first patient to begin."}
                </p>

                {!patientSearch && (
                  <button
                    onClick={() => setWorkflowStep("create")}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
                  >
                    <Plus size={17} />
                    Create Patient
                  </button>
                )}
              </div>
            ) : (
              /* Patient cards */

              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.patient_id}
                    onClick={() => handleSelectPatient(patient)}
                    disabled={loadingPatients}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md disabled:opacity-60"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                          <User size={22} className="text-blue-700" />
                        </div>

                        <div>
                          <h3 className="font-bold text-slate-900">
                            {patient.full_name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Patient ID: {patient.patient_id}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">Age</p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {patient.age ?? "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">Gender</p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {patient.gender || "N/A"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">Status</p>

                          <p className="mt-1 font-semibold text-cyan-700">
                            Select →
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ====================================================
            STEP 3 — UPLOAD X-RAY
        ==================================================== */}

        {workflowStep === "upload" && (
          <section className="mx-auto max-w-5xl">
            {/* Back / change patient */}

            <button
              onClick={handleChangePatient}
              className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={17} />
              Change Patient
            </button>

            {/* =================================================
                Selected Patient
            ================================================= */}

            <section className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white">
                    <User size={23} className="text-blue-700" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                      Selected Patient
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                      {selectedPatient?.full_name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-600">
                      Patient ID: {selectedPatient?.patient_id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Age</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedPatient?.age}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Gender</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedPatient?.gender}
                    </p>
                  </div>

                  <div className="hidden sm:block">
                    <p className="text-xs text-slate-500">Previous Analyses</p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {selectedPatient?.diagnoses?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                X-Ray Upload
            ================================================= */}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-cyan-50 p-2">
                    <FileImage size={21} className="text-cyan-700" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">Chest X-Ray</h2>

                    <p className="text-xs text-slate-500">
                      Upload the selected patient's chest X-ray.
                    </p>
                  </div>
                </div>
              </div>

              {!file ? (
                <label className="flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-cyan-500 hover:bg-cyan-50/30">
                  <div className="mb-5 rounded-2xl bg-white p-5 shadow-sm">
                    <Upload size={32} className="text-cyan-700" />
                  </div>

                  <p className="text-base font-bold text-slate-800">
                    Upload Chest X-Ray
                  </p>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Select a chest X-ray image from your computer. The image
                    will be previewed before AI analysis.
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white">
                    <Upload size={17} />
                    Choose Image
                  </span>

                  <p className="mt-3 text-xs text-slate-400">
                    JPG, JPEG or PNG • Maximum 10 MB
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-5">
                  {/* File header */}

                  <div className="mb-5 flex items-center justify-between">
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
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Remove image"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Preview */}

                  {preview && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-black">
                      <img
                        src={preview}
                        alt="Chest X-ray preview"
                        className="max-h-[550px] w-full object-contain"
                      />
                    </div>
                  )}

                  {/* File status */}

                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3">
                    <CheckCircle2 size={18} className="text-emerald-600" />

                    <div>
                      <p className="text-xs font-semibold text-emerald-800">
                        Image ready for analysis
                      </p>

                      <p className="text-xs text-emerald-600">
                        Patient: {selectedPatient?.full_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  Analyze Button
              ================================================= */}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !file || !selectedPatient}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-700 px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={21} className="animate-spin" />
                    AI is analyzing the X-ray...
                  </>
                ) : (
                  <>
                    <Brain size={21} />
                    Analyze X-Ray
                  </>
                )}
              </button>
            </section>

            {/* =================================================
                Information
            ================================================= */}

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-cyan-700"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Patient-Linked Analysis
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      This X-ray will be permanently associated with the
                      selected patient and included in their diagnosis history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <AlertTriangle
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <h3 className="text-sm font-bold text-amber-900">
                      AI-Assisted Assessment
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Results are intended to support clinical review and should
                      not be considered a definitive medical diagnosis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
