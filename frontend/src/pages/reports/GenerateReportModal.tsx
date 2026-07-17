import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { reportsApi } from '../../api/reports.api';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  onClose: () => void;
  onGenerated: (reportId: string) => void;
}

const reportTypeOptions = [
  { value: 'PARTNERSHIP_PROGRESS', label: 'Partnership Progress' },
  { value: 'PROJECT_COMPLETION', label: 'Project Completion' },
  { value: 'COMMUNICATION_ACTIVITY', label: 'Communication Activity' },
  { value: 'BUDGET_UTILIZATION', label: 'Budget Utilization' },
  { value: 'DOCUMENT_ACTIVITY', label: 'Document Activity' },
];

export default function GenerateReportModal({ onClose, onGenerated }: Props) {
  const { user } = useAuthStore();
  // Backend forbids CITY_ADMIN from requesting BOTH or another city's report —
  // they can only ever generate a report scoped to their own city.
  const isCityAdmin = user?.role === 'CITY_ADMIN';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    reportType: 'PARTNERSHIP_PROGRESS',
    city: isCityAdmin ? (user?.city ?? 'ADAMA') : 'BOTH',
    dateFrom: '',
    dateTo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.dateFrom || !form.dateTo) {
      setError('Please select both a start and end date');
      return;
    }
    if (new Date(form.dateFrom) >= new Date(form.dateTo)) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      const report = await reportsApi.generate({
        reportType: form.reportType as any,
        city: form.city as any,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
      });
      onGenerated(report.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
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
            <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">Generate Report</h2>
            <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
              Compute a fresh analytics snapshot for a date range
            </p>
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

            {/* Report type */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Report Type <span className="text-red-400">*</span>
              </label>
              <select
                value={form.reportType}
                onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              >
                {reportTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                City <span className="text-red-400">*</span>
              </label>
              {isCityAdmin ? (
                <div className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-blue-400 dark:text-slate-400">
                  {user?.city} <span className="text-xs">(your city only)</span>
                </div>
              ) : (
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                >
                  <option value="BOTH">Both Cities</option>
                  <option value="ADAMA">Adama</option>
                  <option value="AURORA">Aurora</option>
                </select>
              )}
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  From <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateFrom}
                  onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
                  required
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  To <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.dateTo}
                  onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
                  required
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
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
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
