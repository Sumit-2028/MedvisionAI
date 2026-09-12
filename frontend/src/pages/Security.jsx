import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Lock,
  KeyRound,
  UserCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";

export default function Security() {
  const [user, setUser] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/users/me");
        setUser(response.data);
      } catch (error) {
        console.error("Failed to load security information:", error);
      }
    };

    loadUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await api.put("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });

      setMessage(response.data?.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Password change failed:", error);

      setError(
        error.response?.data?.detail ||
          "Unable to change password. Please try again.",
      );
    }
  };
  return (
    <div className="space-y-6 px-6 py-6 lg:px-8">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security</h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your account security and authentication settings.
        </p>
      </div>

      {/* ================= SUCCESS ================= */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

          <span>{message}</span>
        </div>
      )}

      {/* ================= ERROR ================= */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />

          <span>{error}</span>
        </div>
      )}

      {/* ================= MAIN GRID ================= */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ================================================= */}
        {/* CHANGE PASSWORD */}
        {/* ================================================= */}

        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <KeyRound size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Change Password
                </h2>

                <p className="text-sm text-slate-500">
                  Keep your account protected with a strong password.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6 p-6">
            {/* Current Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Current Password
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                New Password
              </label>

              <div className="relative">
                <KeyRound
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Enter new password"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Password must contain at least 8 characters.
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Confirm New Password
              </label>

              <div className="relative">
                <ShieldCheck
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Password requirements
              </p>

              <div className="mt-3 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  At least 8 characters
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Use a combination of letters and numbers
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Avoid easily guessable information
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <KeyRound size={17} />
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* ================================================= */}
        {/* SECURITY INFORMATION */}
        {/* ================================================= */}

        <div className="space-y-6">
          {/* Account Security */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Account Security
                  </h2>

                  <p className="text-sm text-slate-500">
                    Authentication status
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <UserCheck size={18} className="text-emerald-600" />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Authenticated
                    </p>

                    <p className="text-xs text-slate-500">
                      Active account session
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Active
                </span>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Account</p>

                <p className="mt-1 truncate text-sm font-medium text-slate-900">
                  {user?.email || "Authenticated user"}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Role</p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {user?.role || "PHYSICIAN"}
                </p>
              </div>
            </div>
          </div>

          {/* Access Control */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50 shadow-sm">
            <div className="border-b border-blue-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Activity size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-blue-900">
                    Access Control
                  </h2>

                  <p className="text-sm text-blue-700">
                    Protected medical workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-xl bg-white/70 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Authenticated access
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Protected application routes require a valid authenticated
                  session.
                </p>
              </div>

              <div className="rounded-xl bg-white/70 p-4">
                <p className="text-sm font-medium text-blue-900">
                  Patient isolation
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Physician accounts can access their authorized patient records
                  through ownership controls.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MEDICAL SECURITY NOTICE ================= */}

      <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4">
        <div className="flex gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-900">
              Medical Data Security
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              MedVision AI uses authenticated access controls to protect patient
              information and diagnostic reports. AI-generated findings are
              advisory and must be reviewed by an authorized medical
              professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
