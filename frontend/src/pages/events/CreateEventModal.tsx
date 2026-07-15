import { useState } from 'react';
import { eventsApi } from '../../api/events.api';
import type { Event } from '../../types/event.types';

interface Props {
  onClose: () => void;
  onCreated: (event: Event) => void;
}

const eventTypes = [
  'WORKSHOP', 'OFFICIAL_VISIT', 'CULTURAL_EXCHANGE',
  'INVESTMENT_FORUM', 'COMMITTEE_MEETING', 'TRAINING', 'CEREMONY',
];
const cities = ['ADAMA', 'AURORA'];

export default function CreateEventModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agenda, setAgenda] = useState<{ title: string; duration: string }[]>([]);

  const [form, setForm] = useState({
    title: '',
    eventType: 'WORKSHOP',
    hostCity: 'ADAMA',
    venue: '',
    startDate: '',
    endDate: '',
    isPublic: true,
    description: '',
    relatedProject: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const event = await eventsApi.create({
        ...form,
        isPublic: Boolean(form.isPublic),
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        relatedProject: form.relatedProject || undefined,
        agenda: agenda
          .filter((a) => a.title.trim())
          .map((a) => ({
            title: a.title,
            duration: a.duration ? parseInt(a.duration) : undefined,
          })),
      });
      onCreated(event);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
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
              Schedule Event
            </h2>
            <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
              Create a new event on the shared calendar
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
                Event Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g. Quarterly Sister City Committee"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Type + Host City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  Event Type <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                >
                  {eventTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  Host City <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.hostCity}
                  onChange={(e) => setForm({ ...form, hostCity: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                >
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Venue <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                required
                placeholder="e.g. Adama City Hall — Room A"
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Start + End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  Start Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                  End Date & Time <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
                placeholder="Purpose and overview of the event..."
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>

            {/* Is Public */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                className="w-4 h-4 rounded border-blue-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm text-[#1a4a8a] dark:text-slate-300 cursor-pointer">
                Make this event visible to the public
              </label>
            </div>

            {/* Agenda */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300">
                  Agenda Items <span className="text-blue-300">(optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAgenda([...agenda, { title: '', duration: '' }])}
                  className="text-xs text-blue-500 hover:text-[#1a4a8a] dark:hover:text-white transition font-medium"
                >
                  + Add item
                </button>
              </div>
              {agenda.length > 0 && (
                <div className="space-y-2">
                  {agenda.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...agenda];
                          updated[index] = { ...updated[index], title: e.target.value };
                          setAgenda(updated);
                        }}
                        placeholder="Agenda item title"
                        className="flex-1 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                      <input
                        type="number"
                        value={item.duration}
                        onChange={(e) => {
                          const updated = [...agenda];
                          updated[index] = { ...updated[index], duration: e.target.value };
                          setAgenda(updated);
                        }}
                        placeholder="Min"
                        className="w-20 bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setAgenda(agenda.filter((_, i) => i !== index))}
                        className="w-8 h-9 flex items-center justify-center text-red-400 hover:text-red-600 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
              ) : 'Schedule Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}