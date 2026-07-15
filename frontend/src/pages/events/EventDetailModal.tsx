import { useEffect, useState } from 'react';
import { eventsApi } from '../../api/events.api';
import type { Event } from '../../types/event.types';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  eventId: string;
  onClose: () => void;
  onUpdated: (event: Event) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  UPCOMING:  { label: 'Upcoming',  className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
};

export default function EventDetailModal({ eventId, onClose, onUpdated }: Props) {
  const { user } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'agenda' | 'minutes'>('details');
  const [showMinutesForm, setShowMinutesForm] = useState(false);
  const [minutes, setMinutes] = useState({ summary: '', decisions: [''] });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await eventsApi.getById(eventId);
        setEvent(data);
        if (data.minutes?.summary) {
          setMinutes({
            summary: data.minutes.summary,
            decisions: data.minutes.decisions?.length ? data.minutes.decisions : [''],
          });
        }
      } catch {
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [eventId]);

  const handleCancel = async () => {
    if (!event) return;
    if (!confirm('Are you sure you want to cancel this event?')) return;
    setActionLoading(true);
    try {
      const updated = await eventsApi.cancel(event.id);
      setEvent(updated);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel event');
    } finally {
      setActionLoading(false);
    }
  };

  // For UPCOMING events: PUT /events/:id  { action:'upload-minutes' } → sets status=COMPLETED + saves minutes
  const handleCompleteAndUpload = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const updated = await eventsApi.update(event.id, {
        action: 'upload-minutes',
        minutes: {
          summary: minutes.summary,
          decisions: minutes.decisions.filter((d) => d.trim()),
        },
      });
      setEvent(updated);
      onUpdated(updated);
      setShowMinutesForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete event');
    } finally {
      setActionLoading(false);
    }
  };

  // For already-COMPLETED events: PATCH /events/:id/minutes  { action:'upload' } → replaces minutes only
  const handleUploadMinutes = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const updated = await eventsApi.updateMinutes(event.id, {
        action: 'upload',
        minutes: {
          summary: minutes.summary,
          decisions: minutes.decisions.filter((d) => d.trim()),
        },
      });
      setEvent(updated);
      onUpdated(updated);
      setShowMinutesForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update minutes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmMinutes = async () => {
    if (!event) return;
    setActionLoading(true);
    try {
      const updated = await eventsApi.updateMinutes(event.id, { action: 'confirm' });
      setEvent(updated);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm minutes');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOrganizer = event?.organizerCity === user?.city || user?.role === 'SUPER_ADMIN';

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'agenda', label: `Agenda (${event?.agenda?.length ?? 0})` },
    { id: 'minutes', label: 'Minutes' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
            Event Details
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-500 text-sm">{error}</div>
        ) : event ? (
          <>
            {/* Event title + status */}
            <div className="px-6 pt-4 pb-2">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-[#1a4a8a] dark:text-white">
                  {event.title}
                </h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusConfig[event.status].className}`}>
                  {statusConfig[event.status].label}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-blue-100 dark:border-slate-700 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-white dark:border-blue-400'
                      : 'border-transparent text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Details tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                    {[
                      { label: 'Event Type', value: event.eventType.replace(/_/g, ' ') },
                      { label: 'Host City', value: event.hostCity },
                      { label: 'Organizer City', value: event.organizerCity },
                      { label: 'Visibility', value: event.isPublic ? 'Public' : 'Private' },
                      { label: 'Start', value: new Date(event.startDate).toLocaleString() },
                      { label: 'End', value: new Date(event.endDate).toLocaleString() },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className="text-xs text-blue-400 dark:text-slate-400">{item.label}</p>
                        <p className="text-sm font-medium text-[#1a4a8a] dark:text-white mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 text-sm text-blue-400 dark:text-slate-400">
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Description
                    </p>
                    <p className="text-sm text-blue-400 dark:text-slate-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Actions */}
                  {canManage && isOrganizer && event.status === 'UPCOMING' && (
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="w-full border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      Cancel Event
                    </button>
                  )}
                </div>
              )}

              {/* Agenda tab */}
              {activeTab === 'agenda' && (
                <div className="space-y-3">
                  {event.agenda.length === 0 ? (
                    <p className="text-sm text-blue-400 dark:text-slate-400 text-center py-8">
                      No agenda items added
                    </p>
                  ) : (
                    event.agenda.map((item, index) => (
                      <div key={index}
                        className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-slate-800 rounded-xl">
                        <div className="w-7 h-7 bg-[#1a4a8a] rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">
                            {item.title}
                          </p>
                        </div>
                        {item.duration && (
                          <span className="text-xs text-blue-400 dark:text-slate-400 shrink-0">
                            {item.duration} min
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Minutes tab */}
              {activeTab === 'minutes' && (
                <div className="space-y-4">

                  {/* Status info banner */}
                  {event.status === 'UPCOMING' && canManage && isOrganizer && (
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
                      <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        This event is still <strong>Upcoming</strong>. Uploading minutes will automatically mark it as <strong>Completed</strong>.
                      </p>
                    </div>
                  )}

                  {event.status === 'CANCELLED' && (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <p className="text-xs text-red-500">This event was cancelled. Minutes cannot be uploaded.</p>
                    </div>
                  )}

                  {/* Confirmation status badges — only meaningful once COMPLETED */}
                  {event.status === 'COMPLETED' && (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Adama',  confirmed: event.minutes?.confirmedByAdama },
                        { label: 'Aurora', confirmed: event.minutes?.confirmedByAurora },
                      ].map((city) => (
                        <div key={city.label}
                          className={`flex items-center gap-2 p-3 rounded-xl border ${
                            city.confirmed
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700'
                          }`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            city.confirmed ? 'bg-green-500' : 'bg-blue-200 dark:bg-slate-600'
                          }`}>
                            {city.confirmed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">{city.label}</p>
                            <p className="text-xs text-blue-400 dark:text-slate-400">
                              {city.confirmed ? 'Confirmed' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Existing minutes content */}
                  {event.minutes?.summary ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-2">
                          Summary
                        </p>
                        <p className="text-sm text-blue-400 dark:text-slate-400 leading-relaxed">
                          {event.minutes.summary}
                        </p>
                      </div>
                      {event.minutes.decisions && event.minutes.decisions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-2">
                            Decisions
                          </p>
                          <ul className="space-y-2">
                            {event.minutes.decisions.map((d, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-blue-400 dark:text-slate-400">
                                <span className="text-[#1a4a8a] dark:text-blue-300 font-bold shrink-0">{i + 1}.</span>
                                {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Confirm button — only for COMPLETED, only if current city hasn't confirmed yet */}
                      {canManage && event.status === 'COMPLETED' && (
                        (() => {
                          const alreadyConfirmed =
                            (user?.city === 'ADAMA'  && event.minutes?.confirmedByAdama) ||
                            (user?.city === 'AURORA' && event.minutes?.confirmedByAurora);
                          if (alreadyConfirmed) return (
                            <p className="text-xs text-green-600 dark:text-green-400 text-center py-1">
                              ✓ Your city has already confirmed these minutes.
                            </p>
                          );
                          return (
                            <button
                              onClick={handleConfirmMinutes}
                              disabled={actionLoading}
                              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                            >
                              {actionLoading ? 'Confirming...' : `✓ Confirm Minutes as ${user?.city}`}
                            </button>
                          );
                        })()
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-400 dark:text-slate-400 text-center py-4">
                      No minutes uploaded yet.
                    </p>
                  )}

                  {/* ── Open form button ────────────────────────────────────────
                      UPCOMING  → uses PUT upload-minutes (also marks COMPLETED)
                      COMPLETED → uses PATCH minutes upload (replaces minutes only) */}
                  {canManage && isOrganizer && event.status !== 'CANCELLED' && !showMinutesForm && (
                    <button
                      onClick={() => setShowMinutesForm(true)}
                      className="w-full border border-blue-200 dark:border-slate-600 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      {event.status === 'UPCOMING'
                        ? '📋 Upload Minutes & Complete Event'
                        : event.minutes?.summary
                          ? 'Update Minutes'
                          : 'Upload Minutes'}
                    </button>
                  )}

                  {/* Minutes form — shared for both UPCOMING and COMPLETED */}
                  {showMinutesForm && (
                    <div className="space-y-3 bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      {event.status === 'UPCOMING' && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          ⚡ Saving will mark this event as Completed.
                        </p>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                          Summary <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={minutes.summary}
                          onChange={(e) => setMinutes({ ...minutes, summary: e.target.value })}
                          placeholder="What was discussed and decided..."
                          className="w-full bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300">
                            Decisions
                          </label>
                          <button
                            type="button"
                            onClick={() => setMinutes({ ...minutes, decisions: [...minutes.decisions, ''] })}
                            className="text-xs text-blue-500 hover:text-[#1a4a8a] dark:hover:text-white transition"
                          >
                            + Add
                          </button>
                        </div>
                        {minutes.decisions.map((d, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={d}
                              onChange={(e) => {
                                const updated = [...minutes.decisions];
                                updated[i] = e.target.value;
                                setMinutes({ ...minutes, decisions: updated });
                              }}
                              placeholder={`Decision ${i + 1}`}
                              className="flex-1 bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                            />
                            {minutes.decisions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setMinutes({
                                  ...minutes,
                                  decisions: minutes.decisions.filter((_, idx) => idx !== i)
                                })}
                                className="text-red-400 hover:text-red-600 transition"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={event.status === 'UPCOMING' ? handleCompleteAndUpload : handleUploadMinutes}
                          disabled={!minutes.summary.trim() || actionLoading}
                          className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm py-2 rounded-lg transition"
                        >
                          {actionLoading
                            ? 'Saving...'
                            : event.status === 'UPCOMING'
                              ? '✓ Complete & Save'
                              : 'Save Minutes'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowMinutesForm(false)}
                          className="px-4 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}