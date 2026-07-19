import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Pencil,
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  Copy,
} from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import type { AdminUser } from '../../types/admin.types';
import { useAuthStore } from '../../store/auth.store';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';

const roleConfig: Record<string, { label: string; className: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  CITY_ADMIN: { label: 'City Admin', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  DEPT_OFFICER: { label: 'Dept. Officer', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

export default function AdminPage() {
  const { user } = useAuthStore();
  const canAccess = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchUsers();
    else setLoading(false);
  }, [canAccess]);

  const formatDate = (date?: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!canAccess) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" />
        <p className="text-[#1a4a8a] dark:text-white font-medium">Access restricted</p>
        <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
          Only City Admins and Super Admins can manage user accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">Administration</h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            {user?.role === 'SUPER_ADMIN'
              ? 'Manage all user accounts across both cities.'
              : `Manage user accounts for ${user?.city}.`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-[#1a4a8a] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" />
          <p className="text-[#1a4a8a] dark:text-white font-medium">No users found</p>
          <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">Create the first account to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 dark:border-slate-700 text-left">
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Name</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">User ID</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Role</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">City / Dept.</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Status</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Last Login</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const role = roleConfig[u.role ?? ''] ?? { label: u.role, className: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-blue-50 dark:border-slate-800 last:border-0 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#1a4a8a] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{u.fullName?.charAt(0) ?? '?'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1a4a8a] dark:text-white">{u.fullName}</p>
                            <p className="text-xs text-blue-400 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-blue-500 dark:text-slate-300">{u.id?.slice(0, 8)}...</span>
                          <button
                            onClick={() => {
                              if (u.id) navigator.clipboard.writeText(u.id);
                            }}
                            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition"
                            title="Copy full ID"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${role.className}`}>
                          {role.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-blue-500 dark:text-slate-300">
                        <div>{u.city}</div>
                        {u.department && (
                          <div className="text-xs text-blue-400 dark:text-slate-400">
                            {u.department.replace(/_/g, ' ')}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {u.isLocked ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                              <Lock className="w-3.5 h-3.5" /> Locked
                            </span>
                          ) : u.isActive ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-blue-400 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(u.lastLogin)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => setEditUser(u)}
                            title="Edit user"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit Modal */}
      {editUser && (
        <EditUserModal
          targetUser={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            setEditUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
