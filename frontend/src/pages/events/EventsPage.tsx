import { useEffect, useState } from 'react';
import { eventsApi } from '../../api/events.api';
import type { EventListItem } from '../../types/event.types';
import { useAuthStore } from '../../store/auth.store';
import CreateEventModal from './CreateEventModal';
import EventDetailModal from './EventDetailModal';

const statusConfig: Record<string, { label: string; className: string }> = {
  UPCOMING:  { label: 'Upcoming',  className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  COMPLETED: { label: 'Completed', className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
};

const eventTypeConfig: Record<string, string> = {
  WORKSHOP:          'Workshop',
  OFFICIAL_VISIT:    'Official Visit',
  CULTURAL_EXCHANGE: 'Cultural Exchange',
  INVESTMENT_FORUM:  'Investment Forum',
  COMMITTEE_MEETING: 'Committee',
  TRAINING:          'Training',
  CEREMONY:          'Ceremony',
};

const eventTypeColors: Record<string, string> = {
  WORKSHOP:          'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  OFFICIAL_VISIT:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  CULTURAL_EXCHANGE: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300',
  INVESTMENT_FORUM:  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  COMMITTEE_MEETING: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  TRAINING:          'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300',
  CEREMONY:          'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function EventsPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getAll(currentMonth, currentYear);
      setEvents(data);
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [currentMonth, currentYear]);

  const filtered = events.filter((e) =>
    filterStatus === 'ALL' || e.status === filterStatus
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return {
      day: d.getDate(),
      month: months[d.getMonth()].slice(0, 3),
      year: d.getFullYear(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
            Events & Meetings
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            Joint committee meetings, field exercises, and executive engagements.
          </p>
        </div>
        {user?.role === 'CITY_ADMIN' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Schedule event
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

          {/* Month/Year navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentMonth === 1) {
                  setCurrentMonth(12);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#1a4a8a] dark:text-white min-w-[140px] text-center">
              {months[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={() => {
                if (currentMonth === 12) {
                  setCurrentMonth(1);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setCurrentMonth(new Date().getMonth() + 1);
                setCurrentYear(new Date().getFullYear());
              }}
              className="text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Status filter */}
            <div className="flex gap-1">
              {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterStatus === s
                      ? 'bg-[#1a4a8a] text-white'
                      : 'bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex border border-blue-100 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 flex items-center justify-center transition ${
                  viewMode === 'grid'
                    ? 'bg-[#1a4a8a] text-white'
                    : 'text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 flex items-center justify-center transition ${
                  viewMode === 'list'
                    ? 'bg-[#1a4a8a] text-white'
                    : 'text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-[#1a4a8a] dark:text-white font-medium">No events found</p>
          <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
            No events scheduled for {months[currentMonth - 1]} {currentYear}
          </p>
        </div>
      ) : viewMode === 'grid' ? (

        /* Grid view */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((event) => {
            const start = formatDate(event.startDate);
            return (
              <div
                key={event.id}
                onClick={() => setSelectedId(event.id)}
                className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-slate-500 transition cursor-pointer"
              >
                {/* Date banner */}
                <div className="flex items-center gap-4 p-4 border-b border-blue-50 dark:border-slate-800">
                  <div className="w-14 h-14 bg-[#1a4a8a] rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-blue-200 text-xs font-medium uppercase">
                      {start.month}
                    </span>
                    <span className="text-white text-2xl font-bold leading-none">
                      {start.day}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#1a4a8a] dark:text-white truncate">
                      {event.title}
                    </h3>
                    <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                      {start.time} EAT
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${eventTypeColors[event.eventType]}`}>
                      {eventTypeConfig[event.eventType]}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[event.status].className}`}>
                      {statusConfig[event.status].label}
                    </span>
                  </div>

                  {/* Venue */}
                  <div className="flex items-center gap-2 text-xs text-blue-400 dark:text-slate-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{event.venue}</span>
                  </div>

                  {/* Host */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-400 dark:text-slate-400">
                      Hosted by <span className="font-medium text-[#1a4a8a] dark:text-white">{event.hostCity}</span>
                    </span>
                    {event.isPublic && (
                      <span className="text-green-500 font-medium">Public</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* List view */
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-blue-50 dark:divide-slate-800">
            {filtered.map((event) => {
              const start = formatDate(event.startDate);
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedId(event.id)}
                  className="flex items-center gap-4 p-4 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                >
                  {/* Date */}
                  <div className="w-12 h-12 bg-[#1a4a8a] rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-blue-200 text-xs">{start.month}</span>
                    <span className="text-white text-lg font-bold leading-none">{start.day}</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5 truncate">
                      {event.venue} · {start.time} · Hosted by {event.hostCity}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${eventTypeColors[event.eventType]}`}>
                      {eventTypeConfig[event.eventType]}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[event.status].className}`}>
                      {statusConfig[event.status].label}
                    </span>
                  </div>

                  <svg className="w-4 h-4 text-blue-300 dark:text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={(event) => {
            setEvents((prev) => [event as unknown as EventListItem, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedId && (
        <EventDetailModal
          eventId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={(updated) => {
            setEvents((prev) =>
              prev.map((e) => e.id === updated.id ? { ...e, ...updated } : e)
            );
          }}
        />
      )}
    </div>
  );
}