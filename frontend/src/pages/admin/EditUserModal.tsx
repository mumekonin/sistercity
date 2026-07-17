import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { useAuthStore } from '../../store/auth.store';
import { Department } from '../../types/enums';
import type { AdminUser } from '../../types/admin.types';

interface Props {
  targetUser: AdminUser;
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditUserModal({ targetUser, onClose, onUpdated }: Props) {
  const { user } = useAuthStore();
  // Backend rule: only SUPER_ADMIN may change a user's role.
  const canChangeRole = user?.role === 'SUPER_ADMIN';
  // Backend rule: only SUPER_ADMIN may move a user to a different city.
  const canChangeCity = user?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: targetUser.fullName ?? '',
    email: targetUser.email ?? '',
    jobTitle: targetUser.jobTitle ?? '',
    department: targetUser.department ?? '',
    phone: targetUser.phone ?? '',
    city: (targetUser.city ?? 'ADAMA') as string,
    role: (targetUser.role ?? 'DEPT_OFFICER') as string,
    isActive: targetUser.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.role === 'DEPT_OFFICER' && !form.department) {
      setError('Department is required for a Department Officer');
      return;
    }

    setLoading(true);
    try {
      await adminApi.updateUser(targetUser.id!, {
        fullName: form.fullName,
        email: form.email,
        jobTitle: form.jobTitle,
        department: (form.department || undefined) as any,
        phone: form.phone || undefined,
        ...(canChangeCity ? { city: form.city as any } : {}),
        ...(canChangeRole ? { role: form.role as any } : {}),
        isActive: form.isActive,
      });
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">Edit User</h2>
            <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">{targetUser.email}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Role + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Role</label>
                {canChangeRole ? (
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        role: e.target.value,
                        department: e.target.value === 'DEPT_OFFICER' ? form.department : '',
                      })
                    }
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="CITY_ADMIN">City Admin</option>
                    <option value="DEPT_OFFICER">Department Officer</option>
                  </select>
                ) : (
                  <div className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-blue-400 dark:text-slate-400">
                    {form.role.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">City</label>
                {canChangeCity ? (
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  >
                    <option value="ADAMA">Adama</option>
                    <option value="AURORA">Aurora</option>
                  </select>
                ) : (
                  <div className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-blue-400 dark:text-slate-400">
                    {form.city}
                  </div>
                )}
              </div>
            </div>

            {/* Department — only for Dept. Officer */}
            {form.role === 'DEPT_OFFICER' && (
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="">Select department...</option>
                  {Object.values(Department).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Job title + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Job Title</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-blue-300 text-[#1a4a8a] focus:ring-blue-400"
              />
              <span className="text-sm font-medium text-[#1a4a8a] dark:text-slate-300">Account active</span>
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-blue-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
