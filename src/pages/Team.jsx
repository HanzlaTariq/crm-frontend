import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const roleColors = {
  admin: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  jmanager: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  telecom: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  salesperson: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
};

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

  useEffect(() => {
    fetchTeam();
    fetchAssignable();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await api.get("/users");
      setMembers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignable = async () => {
    try {
      const res = await api.get("/users/assignable");
      setAssignable(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/auth/register", form);
      setMembers([res.data.user, ...members]);
      setForm({ name: "", email: "", password: "", role: "salesperson", managerId: "" });
      setShowModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
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
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const roleLabels = {
    manager: '👔 Managers',
    jmanager: '🧑‍💼 Junior Managers',
    telecom: '📞 Telecom',
    salesperson: '💼 Salespersons',
  };

  const filteredMembers = members.filter((member) => {
    const term = search.toLowerCase().trim()
    if (!term) return true
    return (
      member.name.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      member.role.toLowerCase().includes(term)
    )
  })

  const grouped = {
    manager: filteredMembers.filter((m) => m.role === 'manager'),
    jmanager: filteredMembers.filter((m) => m.role === 'jmanager'),
    telecom: filteredMembers.filter((m) => m.role === 'telecom'),
    salesperson: filteredMembers.filter((m) => m.role === 'salesperson'),
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Team</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} shown
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search members, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {['admin', 'manager'].includes(user?.role) && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
            >
              + Add Member
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 h-40 animate-pulse border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-lg">No team members yet</p>
          <p className="text-sm mt-1">Add your first team member to get started</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([role, group]) => {
            if (group.length === 0) return null;
            return (
              <div key={role}>
                {/* Group Header */}
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {roleLabels[role]} ({group.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.map((m) => (
                    <div
                      key={m._id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition"
                    >
                      {/* Avatar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className={`w-2.5 h-2.5 rounded-full ${m.isActive ? "bg-green-400" : "bg-gray-300"}`} />
                      </div>

                      <h3 className="font-semibold text-gray-800 dark:text-white">{m.name}</h3>
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{m.email}</p>

                      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[m.role]}`}>
                        {m.role === 'jmanager' ? 'J. Manager' : m.role}
                      </span>

                      {/* Reports to */}
                      {m.manager && (
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <span>👤</span>
                          <span>Reports to: <span className="text-gray-500 dark:text-gray-300 font-medium">{m.manager.name}</span></span>
                        </p>
                      )}

                      <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">
                        Joined {new Date(m.createdAt).toLocaleDateString()}
                      </p>

                      {user?.role === 'admin' && (
                        <button
                          onClick={() => startEditing(m)}
                          className="mt-4 w-full px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                        >
                          Edit
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Add Team Member</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
              >✕</button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value, managerId: "" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Edit Team Member</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl"
              >✕</button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="john@company.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value, managerId: "" })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >Cancel</button>
              <button
                onClick={handleEditSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50"
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