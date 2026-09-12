import { Activity, AlertTriangle, CheckCircle2, FileCheck2, Users, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";

const cards = [
  ["total_physicians", "Physicians", UserRound, "text-blue-700 bg-blue-100"],
  ["total_patients", "Patients", Users, "text-cyan-700 bg-cyan-100"],
  ["total_diagnoses", "Analyses", Activity, "text-violet-700 bg-violet-100"],
  ["abnormal_cases", "Abnormal cases", AlertTriangle, "text-amber-700 bg-amber-100"],
  ["normal_cases", "Normal cases", CheckCircle2, "text-emerald-700 bg-emerald-100"],
  ["total_users", "Total users", FileCheck2, "text-slate-700 bg-slate-100"],
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  useEffect(() => {
    api.get("/admin/dashboard").then(({ data: response }) => { setData(response); setState({ loading: false, error: "" }); }).catch((error) => setState({ loading: false, error: error.response?.data?.detail || "Unable to load administrative statistics." }));
  }, []);

  if (state.loading) return <main className="page-enter p-6 lg:p-10"><div className="mx-auto max-w-7xl space-y-6"><div className="skeleton h-8 w-64" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-32" />)}</div></div></main>;
  if (state.error) return <main className="page-enter p-6 lg:p-10"><div className="mx-auto max-w-7xl alert-error rounded-2xl p-5">{state.error}</div></main>;
  const stats = data?.statistics || {};
  return <main className="page-enter p-6 lg:p-10"><div className="mx-auto max-w-7xl"><div className="page-heading flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Administration</p><h1 className="mt-2 text-3xl font-bold">System overview</h1><p className="mt-2 muted-copy">Monitor access, patients, and AI-assisted analysis activity.</p></div><span className="status-badge status-badge--normal">ADMIN WORKSPACE</span></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([key, label, Icon, style]) => <div key={key} className="surface-card rounded-2xl p-5 shadow-sm transition duration-200 hover:-translate-y-0.5"><div className="flex items-center justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${style}`}><Icon size={21} /></div><span className="text-3xl font-bold text-slate-900">{stats[key] ?? 0}</span></div><p className="mt-4 text-sm font-semibold text-slate-500">{label}</p></div>)}</div><section className="surface-card mt-8 rounded-2xl shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="font-semibold text-slate-900">Recent system activity</h2><p className="mt-1 text-sm text-slate-500">Latest analyses across physician workspaces.</p></div>{!data?.recent_activity?.length ? <p className="empty-state px-6 py-10 text-sm">No analysis activity yet.</p> : <div className="divide-y divide-slate-100">{data.recent_activity.map((item) => <div key={item.diagnosis_id} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-800">{item.patient_name} <span className="font-normal text-slate-400">#{item.patient_id}</span></p><p className="text-sm text-slate-500">{item.predicted_disease} · by {item.physician_name}</p></div><div className="text-left sm:text-right"><span className={`status-badge ${item.result_status === "ABNORMAL" ? "status-badge--abnormal" : "status-badge--normal"}`}>{item.result_status}</span><p className="mt-2 text-xs text-slate-400">{new Date(item.diagnosis_timestamp).toLocaleString()}</p></div></div>)}</div>}</section></div></main>;
}
