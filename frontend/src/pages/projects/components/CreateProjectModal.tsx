import { useState } from 'react';
import { projectsApi } from '../../../api/Projects.api';
import type { CreateProjectDto, Priority, Responsible } from '../../../types/projects.types';

interface Props {
  onClose: () => void;
  onCreated: (project: any) => void;
}

export default function CreateProjectModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateProjectDto>({
    title: '',
    description: '',
    expectedOutcome: '',
    priority: 'MEDIUM',
    beneficiary: 'BOTH',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim() || !form.expectedOutcome.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      const project = await projectsApi.create(form);
      onCreated(project);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">

        {/* Header */}
        <div className="bg-[#1a4a8a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">New Project Proposal</h2>
            <p className="text-blue-200 text-sm mt-0.5">Submit a joint initiative proposal</p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white transition rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Adama-Aurora Water Infrastructure"
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the project scope and objectives..."
              rows={3}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition resize-none"
            />
          </div>

          {/* Expected Outcome */}
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
              Expected Outcome <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.expectedOutcome}
              onChange={(e) => setForm({ ...form, expectedOutcome: e.target.value })}
              placeholder="What results do you expect from this project?"
              rows={2}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition resize-none"
            />
          </div>

          {/* Priority & Beneficiary */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                Beneficiary
              </label>
              <select
                value={form.beneficiary}
                onChange={(e) => setForm({ ...form, beneficiary: e.target.value as Responsible })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition"
              >
                <option value="BOTH">Both Cities</option>
                <option value="ADAMA">Adama</option>
                <option value="AURORA">Aurora</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
