import { useState } from 'react';
import { equipmentApi } from '../../api/budget.api';

interface Props {
  projectId: string;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddEquipmentModal({ projectId, onClose, onAdded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    itemName: '',
    description: '',
    quantity: '',
    estimatedValue: '',
    providedDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await equipmentApi.add(projectId, {
        itemName: form.itemName,
        description: form.description,
        quantity: parseInt(form.quantity),
        estimatedValue: parseFloat(form.estimatedValue),
        providedDate: new Date(form.providedDate),
      });
      onAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add equipment');
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
            Add Equipment
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
              Item Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              required
              placeholder="e.g. Compactor Truck"
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              placeholder="Equipment description..."
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Quantity <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                min="1"
                placeholder="1"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Value (ETB) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.estimatedValue}
                onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
                required
                min="1"
                placeholder="0"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
              Provided Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.providedDate}
              onChange={(e) => setForm({ ...form, providedDate: e.target.value })}
              required
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
            />
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
              disabled={loading}
              className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              {loading ? 'Adding...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}