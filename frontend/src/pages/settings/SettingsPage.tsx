import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Moon, Sun, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../store/auth.store';
import { useThemeStore } from '../../store/theme.store';

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  CITY_ADMIN: 'City Admin',
  DEPT_OFFICER: 'Department Officer',
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.newPassword !== form.confirmNewPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(form);
      setSuccess(res.message || 'Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      // Backend invalidates the refresh token on password change, so the
      // session needs to be re-established.
      setTimeout(() => {
        clearAuth();
        navigate('/login');
      }, 1800);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">Settings</h1>
        <p className="text-blue-400 dark:text-slate-400 mt-1">
          Manage your profile, security, and display preferences.
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-[#1a4a8a] dark:text-white" />
          <h2 className="text-base font-bold text-[#1a4a8a] dark:text-white">Profile</h2>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-[#1a4a8a] rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{user?.fullName?.charAt(0) ?? 'U'}</span>
          </div>
          <div>
            <p className="text-[#1a4a8a] dark:text-white font-semibold">{user?.fullName}</p>
            <p className="text-sm text-blue-400 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <InfoRow label="Role" value={roleLabel[user?.role ?? ''] ?? user?.role ?? '—'} />
          <InfoRow label="City" value={user?.city ?? '—'} />
          <InfoRow label="Department" value={user?.department ?? '—'} />
          <InfoRow label="Job Title" value={user?.jobTitle ?? '—'} />
        </div>
        <p className="text-xs text-blue-300 dark:text-slate-500 mt-4">
          To update your profile details, contact your City Admin or Super Admin.
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          {isDark ? (
            <Moon className="w-4 h-4 text-[#1a4a8a] dark:text-white" />
          ) : (
            <Sun className="w-4 h-4 text-[#1a4a8a] dark:text-white" />
          )}
          <h2 className="text-base font-bold text-[#1a4a8a] dark:text-white">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">Dark mode</p>
            <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
              Switch between light and dark theme across the portal.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors focus:outline-none shrink-0 ${isDark ? 'bg-[#1a4a8a]' : 'bg-blue-200'}`}
          >
            <span
              className={`inline-block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-[#1a4a8a] dark:text-white" />
          <h2 className="text-base font-bold text-[#1a4a8a] dark:text-white">Change Password</h2>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 rounded-lg p-3 text-sm flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success} You'll be signed out shortly.
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Current Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              required
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                New Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Confirm New Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={form.confirmNewPassword}
                onChange={(e) => setForm({ ...form, confirmNewPassword: e.target.value })}
                required
                minLength={8}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-blue-400 dark:text-slate-400">{label}</p>
      <p className="text-[#1a4a8a] dark:text-white font-medium mt-0.5">{value}</p>
    </div>
  );
}
