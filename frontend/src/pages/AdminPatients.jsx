import { Search, Trash2, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminPatients() {
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState({ patients: [], total: 0 });
  const [selected, setSelected] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });
  const [feedback, setFeedback] = useState("");
  const [deletion, setDeletion] = useState({ target: null, loading: false, error: "" });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: "" });
    api
      .get("/admin/patients", { params: { search: search || undefined } })
      .then(({ data: response }) => {
        if (active) {
          setData(response);
          setState({ loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (active) setState({ loading: false, error: error.response?.data?.detail || "Unable to load patients." });
      });
    return () => {
      active = false;
    };
  }, [search, reloadKey]);

  const openPatient = async (id) => {
    try {
      const { data: detail } = await api.get(`/admin/patients/${id}`);
      setSelected(detail);
    } catch (error) {
      setState((current) => ({ ...current, error: error.response?.data?.detail || "Unable to load patient details." }));
    }
  };

  const confirmDelete = async () => {
    const patient = deletion.target;
    if (!patient || deletion.loading) return;

    setDeletion((current) => ({ ...current, loading: true, error: "" }));
    try {
      await api.delete(`/admin/patients/${patient.patient_id}`);
      setDeletion({ target: null, loading: false, error: "" });
      setSelected(null);
      setFeedback(`${patient.full_name} and associated records were deleted.`);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDeletion((current) => ({ ...current, loading: false, error: error.response?.data?.detail || "Patient could not be deleted." }));
    }
  };

  const requestDelete = (patient) => {
    setFeedback("");
    setDeletion({ target: patient, loading: false, error: "" });
  };

  return (
    <main className="page-enter p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading />
        <div className="surface-card mt-7 rounded-2xl p-4 shadow-sm"><label className="relative block max-w-xl"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient or physician" className="field-input py-2.5 pl-10 pr-3" /></label></div>
        {feedback && <div className="alert-success mt-4 rounded-xl px-4 py-3 text-sm font-medium">{feedback}</div>}
        <section className="table-shell mt-5">
          {state.loading ? <div className="p-10 text-center text-slate-500">Loading patients…</div> : state.error ? <div className="p-6 text-red-700">{state.error}</div> : !data.patients.length ? <EmptyState /> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">Patient</th><th className="px-6 py-4">Demographics</th><th className="px-6 py-4">Physician</th><th className="px-6 py-4">Latest analysis</th><th className="px-6 py-4">Activity</th><th className="px-6 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{data.patients.map((patient) => <tr key={patient.patient_id} onClick={() => openPatient(patient.patient_id)} className="cursor-pointer hover:bg-cyan-50/40"><td className="px-6 py-4"><p className="font-semibold text-slate-800">{patient.full_name}</p><p className="text-xs text-slate-400">ID {patient.patient_id}</p></td><td className="px-6 py-4 text-slate-600">{patient.age ?? "—"} · {patient.gender || "—"}</td><td className="px-6 py-4"><p className="font-medium text-slate-700">{patient.physician_name}</p><p className="text-xs text-slate-400">{patient.physician_email}</p></td><td className="px-6 py-4"><p className="text-slate-700">{patient.latest_diagnosis || "No analysis"}</p>{patient.latest_result_status && <span className={`text-xs font-bold ${patient.latest_result_status === "ABNORMAL" ? "text-amber-700" : "text-emerald-700"}`}>{patient.latest_result_status}</span>}</td><td className="px-6 py-4 text-slate-500">{patient.diagnosis_count} diagnosis{patient.diagnosis_count === 1 ? "" : "es"}<br /><span className="text-xs">{patient.latest_analysis_date ? new Date(patient.latest_analysis_date).toLocaleDateString() : "—"}</span></td><td className="px-6 py-4 text-right"><button type="button" onClick={(event) => { event.stopPropagation(); requestDelete(patient); }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /> Delete</button></td></tr>)}</tbody></table></div>
          )}
        </section>
        <p className="mt-3 text-xs text-slate-400">{data.total} patient record{data.total === 1 ? "" : "s"} · Deleting a patient removes their diagnoses, reports, and stored files.</p>
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={() => setSelected(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Patient detail</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{selected.full_name}</h2><p className="mt-1 text-sm text-slate-500">ID {selected.patient_id} · {selected.age ?? "—"} · {selected.gender || "—"}</p></div><button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={20} /></button></div><div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-sm"><div><p className="font-semibold text-slate-700">Created by</p><p className="mt-1 text-slate-600">{selected.physician?.full_name} · {selected.physician?.email}</p></div><button type="button" onClick={() => requestDelete(selected)} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"><Trash2 size={15} /> Delete</button></div><h3 className="mt-6 font-semibold text-slate-900">Diagnosis history</h3>{!selected.diagnoses?.length ? <p className="mt-3 text-sm text-slate-500">No analyses recorded.</p> : <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">{selected.diagnoses.map((diagnosis) => <div key={diagnosis.diagnosis_id} className="flex items-center justify-between gap-4 p-4"><div><p className="font-medium text-slate-700">{diagnosis.predicted_disease}</p><p className="text-xs text-slate-400">#{diagnosis.diagnosis_id} · {new Date(diagnosis.diagnosis_timestamp).toLocaleString()}</p></div><div className="text-right"><span className="text-sm font-bold text-slate-700">{diagnosis.confidence_score}%</span><p className="text-xs text-slate-500">{diagnosis.result_status}</p></div></div>)}</div>}</div></div>}
      <ConfirmModal open={Boolean(deletion.target)} title="Delete Patient?" message={deletion.target ? `This will permanently remove ${deletion.target.full_name} and associated diagnosis/report records. This action cannot be undone.` : ""} confirmLabel="Delete patient" loading={deletion.loading} error={deletion.error} onCancel={() => setDeletion({ target: null, loading: false, error: "" })} onConfirm={confirmDelete} />
    </main>
  );
}

function PageHeading() { return <div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">System patients</h1><p className="mt-2 text-slate-500">Review patient ownership and analysis summaries across the system.</p></div>; }
function EmptyState() { return <div className="p-12 text-center"><UserRound className="mx-auto text-slate-300" size={32} /><p className="mt-3 font-semibold text-slate-700">No patients found</p><p className="mt-1 text-sm text-slate-500">Try a different search.</p></div>; }
