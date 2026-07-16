import { useState } from 'react';
import { newsApi } from '../../api/news.api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const categories = [
  'ACHIEVEMENT', 'NEW_AGREEMENT', 'PROJECT_UPDATE',
  'EVENT_ANNOUNCEMENT', 'JOINT_STATEMENT', 'CULTURAL_HIGHLIGHT',
];

export default function CreateNewsModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '',
    category: 'ACHIEVEMENT',
    body: '',
    isPublic: true,
    isJoint: false,
  });

  const handleFiles = (fileList: FileList) => {
    const selected = Array.from(fileList).slice(0, 5);
    setFiles(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('body', form.body);
      formData.append('isPublic', String(form.isPublic));
      formData.append('isJoint', String(form.isJoint));
      files.forEach((file) => formData.append('images', file));
      await newsApi.create(formData);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
              New Article
            </h2>
            <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
              Create a news article or announcement
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Article headline..."
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Category */}
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
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Content <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={6}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                required
                placeholder="Write your article content here..."
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Images <span className="text-blue-300">(up to 5)</span>
              </label>
              <div
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition ${
                  dragOver
                    ? 'border-[#1a4a8a] bg-blue-50 dark:bg-slate-800'
                    : 'border-blue-200 dark:border-slate-600 hover:border-blue-400'
                }`}
              >
                {files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-sm text-[#1a4a8a] dark:text-white">
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-600 transition ml-2 shrink-0"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <label className="text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white cursor-pointer">
                      + Add more
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files && handleFiles(e.target.files)}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <svg className="w-8 h-8 text-blue-200 dark:text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-blue-400 dark:text-slate-400">
                      Drop images here or <span className="text-blue-500 underline">browse</span>
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                  className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-[#1a4a8a] dark:text-slate-300">
                  Make public (visible without login)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isJoint}
                  onChange={(e) => setForm({ ...form, isJoint: e.target.checked })}
                  className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-[#1a4a8a] dark:text-slate-300">
                  Joint announcement (requires both cities to approve)
                </span>
              </label>
            </div>

            {/* Joint info */}
            {form.isJoint && (
              <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3 text-sm text-blue-400 dark:text-slate-400">
                ℹ️ Joint articles require approval from both Adama and Aurora city admins before publishing.
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-blue-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </>
              ) : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}