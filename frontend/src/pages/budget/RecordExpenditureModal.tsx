import { useState } from 'react';
import { budgetApi } from '../../api/budget.api';

interface Props {
  projectId: string;
  onClose: () => void;
  onRecorded: () => void;
}

const categories = [
  'PERSONNEL', 'EQUIPMENT', 'MATERIALS',
  'TRAVEL', 'SERVICES', 'INFRASTRUCTURE', 'OTHER',
];

export default function RecordExpenditureModal({ projectId, onClose, onRecorded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    category: 'SERVICES',
    description: '',
    amount: '',
    date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setError('Please attach a receipt');
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('amount', form.amount);
      formData.append('date', form.date);
      await budgetApi.recordExpenditure(projectId, formData);
      onRecorded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record expenditure');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
            Record Expenditure
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="What was this expense for?"
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Amount (ETB) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="1"
                placeholder="0"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Receipt <span className="text-red-400">*</span>
            </label>
            <div className="border-2 border-dashed border-blue-200 dark:border-slate-600 rounded-xl p-4 text-center">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-[#1a4a8a] dark:text-white">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <p className="text-sm text-blue-400 dark:text-slate-400">
                    Click to attach receipt
                  </p>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-blue-200 dark:border-slate-600 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              {loading ? 'Recording...' : 'Record Expenditure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}