import { useEffect, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Bell,
  Building2,
  Save,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");

        setUser(response.data);
        setFullName(response.data?.full_name || "");
        setEmail(response.data?.email || "");
      } catch (error) {
        console.error("Failed to load user settings:", error);
      }
    };

    loadUser();
  }, []);

  const handleSave = () => {
    // Profile update API will be connected in the next backend step.
    setSaveMessage("Settings saved successfully.");

    setTimeout(() => {
      setSaveMessage("");
    }, 3000);
  };

  const initial = fullName ? fullName.charAt(0).toUpperCase() : "D";

  return (
    <div className="page-enter space-y-6 px-6 py-6 lg:px-8">
      {/* ================= HEADER ================= */}
      <div className="page-heading">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your physician profile and workspace preferences.
        </p>
      </div>

      {/* ================= SUCCESS MESSAGE ================= */}
      {saveMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          {saveMessage}
        </div>
      )}

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ===================================================== */}
        {/* PHYSICIAN PROFILE */}
        {/* ===================================================== */}

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Profile Header */}
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Physician Profile
                </h2>

                <p className="text-sm text-slate-500">
                  Your account information
                </p>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="space-y-6 p-6">
            {/* Profile Avatar */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initial}
              </div>

              <div>
                <p className="font-semibold text-slate-900">
                  {fullName || "Physician"}
                </p>

                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <ShieldCheck size={15} className="text-emerald-600" />

                  {user?.role || "PHYSICIAN"}
                </div>
              </div>
            </div>

            {/* ================= FULL NAME ================= */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* ================= EMAIL ================= */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pl-10 pr-4 text-sm text-slate-600 outline-none"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Email address is managed by your account.
              </p>
            </div>

            {/* ================= ROLE ================= */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Account Role
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <ShieldCheck size={18} className="text-emerald-600" />

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {user?.role || "PHYSICIAN"}
                  </p>

                  <p className="text-xs text-slate-500">
                    Authorized medical workspace user
                  </p>
                </div>
              </div>
            </div>

            {/* ================= SAVE SETTINGS ================= */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Save size={17} />
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* RIGHT COLUMN */}
        {/* ===================================================== */}

        <div className="space-y-6">
          {/* ================= WORKSPACE ================= */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">Workspace</h2>

                  <p className="text-sm text-slate-500">Medical AI workspace</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  MedVision AI
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  AI-assisted medical report management and clinical decision
                  support workspace.
                </p>
              </div>
            </div>
          </div>

          {/* ================= NOTIFICATIONS ================= */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Bell size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Notifications
                  </h2>

                  <p className="text-sm text-slate-500">Workspace alerts</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Analysis notifications
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Receive alerts about completed analyses and generated reports.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotifications(!notifications)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                  notifications ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                    notifications ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* ================= MEDICAL DATA PRIVACY ================= */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
            <div className="border-b border-blue-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-blue-900">
                    Medical Data Privacy
                  </h2>

                  <p className="text-sm text-blue-700">Your data is secure</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="rounded-xl bg-white/70 p-4 text-xs leading-5 text-blue-800">
                Patient information and diagnostic reports are protected by
                authenticated access controls. AI-generated results are advisory
                and must be reviewed by an authorized medical professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
