import { Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../services/api";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState({ users: [], total: 0 });
  const [state, setState] = useState({ loading: true, error: "" });
  const [feedback, setFeedback] = useState("");
  const [deletion, setDeletion] = useState({ target: null, loading: false, error: "" });

  useEffect(() => {
    let active = true;
    setState({ loading: true, error: "" });
    api
      .get("/admin/users", { params: { search: search || undefined, role: role || undefined } })
      .then(({ data: response }) => {
        if (active) {
          setData(response);
          setState({ loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ loading: false, error: error.response?.data?.detail || "Unable to load users." });
        }
      });
    return () => {
      active = false;
    };
  }, [search, role, reloadKey]);

  const confirmDelete = async () => {
    const user = deletion.target;
    if (!user || deletion.loading) return;

    setDeletion((current) => ({ ...current, loading: true, error: "" }));
    try {
      await api.delete(`/admin/users/${user.user_id}`);
      setDeletion({ target: null, loading: false, error: "" });
      setFeedback(`${user.full_name} and associated records were deleted.`);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDeletion((current) => ({
        ...current,
        loading: false,
        error: error.response?.data?.detail || "Physician could not be deleted.",
      }));
    }
  };

  return (
    <main className="p-6 lg:p-10">
      <div className="mx-auto max-w-7xl">
        <PageHeading title="Users and physicians" description="Review registered accounts and their assigned roles." />
        <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-cyan-500" />
          </label>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-cyan-500">
            <option value="">All roles</option>
            <option value="PHYSICIAN">Physicians</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        {feedback && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{feedback}</div>}

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {state.loading ? <div className="p-10 text-center text-slate-500">Loading users…</div> : state.error ? <div className="p-6 text-red-700">{state.error}</div> : !data.users.length ? <EmptyState /> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Registered</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((user) => <tr key={user.user_id} className="hover:bg-slate-50"><td className="px-6 py-4"><p className="font-semibold text-slate-800">{user.full_name}</p><p className="text-xs text-slate-400">ID {user.user_id}</p></td><td className="px-6 py-4 text-slate-600">{user.email}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "ADMIN" ? "bg-violet-100 text-violet-700" : "bg-cyan-100 text-cyan-700"}`}>{user.role}</span></td><td className="px-6 py-4 text-slate-500">{user.registration_date ? new Date(user.registration_date).toLocaleDateString() : "—"}</td><td className="px-6 py-4 text-right">{user.role === "PHYSICIAN" && <button type="button" onClick={() => { setFeedback(""); setDeletion({ target: user, loading: false, error: "" }); }} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:text-red-700"><Trash2 size={15} /> Delete</button>}</td></tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="mt-3 text-xs text-slate-400">{data.total} account{data.total === 1 ? "" : "s"} · Deleting a physician also removes their patients, analyses, reports, and stored files.</p>
      </div>

      <ConfirmModal open={Boolean(deletion.target)} title="Delete Physician?" message={deletion.target ? `This will permanently remove ${deletion.target.full_name} and their associated data. This action cannot be undone.` : ""} confirmLabel="Delete physician" loading={deletion.loading} error={deletion.error} onCancel={() => setDeletion({ target: null, loading: false, error: "" })} onConfirm={confirmDelete} />
    </main>
  );
}

function PageHeading({ title, description }) { return <div><p className="text-sm font-semibold uppercase tracking-widest text-cyan-700">Administration</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-2 text-slate-500">{description}</p></div>; }
function EmptyState() { return <div className="p-12 text-center"><Users className="mx-auto text-slate-300" size={32} /><p className="mt-3 font-semibold text-slate-700">No users found</p><p className="mt-1 text-sm text-slate-500">Try a different search or role filter.</p></div>; }
