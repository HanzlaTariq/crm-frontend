import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/errors";
import useDebounce from "../hooks/useDebounce";
import EmptyState from "../components/EmptyState";
import { Plus, X, Pencil, Search, Users } from "lucide-react";

const roleColors = {
  admin: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  manager: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  jmanager: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-400",
  telecom: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  salesperson: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
};

const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-slate-50 dark:bg-ink-800 text-ink-950 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition"
const labelCls = "block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5"

// A single flat team page rarely runs past a few hundred people; a high
// limit plus server-side search keeps this simple while still fixing the
// bug where GET /users now defaults to 20 results per page (Phase 1).
const LIST_LIMIT = 100

function Team() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [assignable, setAssignable] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "salesperson",
    managerId: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "salesperson",
    managerId: "",
  });

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/users", {
        params: { limit: LIST_LIMIT, ...(debouncedSearch ? { search: debouncedSearch } : {}) },
      });
      setMembers(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load team"));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  const fetchAssignable = useCallback(async () => {
    try {
      const res = await api.get("/users/assignable");
      setAssignable(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not load assignable managers"));
    }
  }, []);

  useEffect(() => { fetchTeam() }, [fetchTeam]);
  useEffect(() => { fetchAssignable() }, [fetchAssignable]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      setForm({ name: "", email: "", password: "", role: "salesperson", managerId: "" });
      setShowModal(false);
      toast.success(`${res.data.user.name} added to the team`);
      fetchTeam();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      email: member.email,
      role: member.role,
      managerId: member.manager?._id || "",
    });
    setError("");
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    if (!editForm.name || !editForm.email) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.put(`/auth/user/${editingMember._id}`, editForm);
      setMembers(members.map(m => m._id === editingMember._id ? res.data : m));
      setShowEditModal(false);
      setEditingMember(null);
      toast.success('Team member updated');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels = {
    manager: 'Managers',
    jmanager: 'Junior Managers',
    telecom: 'Telecom',
    salesperson: 'Salespersons',
  };

  const grouped = {
    manager: members.filter((m) => m.role === 'manager'),
    jmanager: members.filter((m) => m.role === 'jmanager'),
    telecom: members.filter((m) => m.role === 'telecom'),
    salesperson: members.filter((m) => m.role === 'salesperson'),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white">Team</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {members.length} member{members.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search members, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 bg-white dark:bg-ink-800 text-ink-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => { setError(''); setShowModal(true) }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-ink-950 hover:bg-ink-800 dark:bg-brand-500 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium rounded-xl transition shrink-0"
            >
              <Plus className="w-4 h-4" strokeWidth={2.25} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-ink-800 rounded-xl p-5 h-40 animate-pulse border border-slate-100 dark:border-white/5" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members found"
          message={search ? 'Try a different search term.' : 'Add your first team member to get started'}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([role, group]) => {
            if (group.length === 0) return null;
            return (
              <div key={role}>
                {/* Group Header */}
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 font-mono">
                  {roleLabels[role]} · {group.length}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.map((m) => (
                    <div
                      key={m._id}
                      className="bg-white dark:bg-ink-800 rounded-xl p-5 border border-slate-100 dark:border-white/5 shadow-panel"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-ink-950 text-lg font-display font-bold">
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${m.isActive ? "bg-emerald-400" : "bg-slate-300 dark:bg-slate-600"}`} />
                      </div>

                      <h3 className="font-semibold text-ink-950 dark:text-white">{m.name}</h3>
                      <p className="text-sm text-slate-400 mt-0.5 truncate">{m.email}</p>

                      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[m.role]}`}>
                        {m.role === 'jmanager' ? 'J. Manager' : m.role}
                      </span>

                      {/* Reports to */}
                      {m.manager && (
                        <p className="text-xs text-slate-400 mt-2.5">
                          Reports to <span className="text-slate-600 dark:text-slate-300 font-medium">{m.manager.name}</span>
                        </p>
                      )}

                      <p className="text-[11px] text-slate-300 dark:text-slate-600 mt-2 font-mono">
                        Joined {new Date(m.createdAt).toLocaleDateString()}
                      </p>

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => startEditing(m)}
                          className="mt-4 w-full px-3 py-2 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition inline-flex items-center justify-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Add Team Member</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              ><X className="w-5 h-5" /></button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              {[
                { key: "name", label: "Full Name *", placeholder: "John Doe" },
                { key: "email", label: "Email *", placeholder: "john@company.com" },
                { key: "password", label: "Password *", placeholder: "••••••••", type: "password" },
              ].map((field) => (
                <div key={field.key}>
                  <label className={labelCls}>
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className={labelCls}>Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, managerId: "" })}
                  className={inputCls}
                >
                  {user?.role === 'admin' && <option value="manager">Manager</option>}
                  <option value="jmanager">Junior Manager</option>
                  <option value="telecom">Telecom</option>
                  <option value="salesperson">Salesperson</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name || !form.email || !form.password}
                className="flex-1 py-2.5 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium transition disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-ink-800 rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink-950 dark:text-white">Edit Team Member</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              ><X className="w-5 h-5" /></button>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-xl mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className={inputCls}
                />
              </div>

              {/* Role */}
              <div>
                <label className={labelCls}>Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value, managerId: "" })}
                  className={inputCls}
                >
                  <option value="manager">Manager</option>
                  <option value="jmanager">Junior Manager</option>
                  <option value="telecom">Telecom</option>
                  <option value="salesperson">Salesperson</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-ink-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-ink-700 transition"
              >Cancel</button>
              <button
                onClick={handleEditSubmit}
                disabled={submitting || !editForm.name || !editForm.email}
                className="flex-1 py-2.5 rounded-xl bg-ink-950 dark:bg-brand-500 hover:bg-ink-800 dark:hover:bg-brand-600 text-white dark:text-ink-950 font-medium transition disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Team;
