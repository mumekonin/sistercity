import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchApi } from '../../api/notifications.api';
import type { SearchResults, SearchItem } from '../../types/notification.types';

// Google Material Icon helper
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-icons-round ${className}`}>{name}</span>;
}

const sectionConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  projects: { label: 'Projects', icon: 'folder',        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  messages: { label: 'Messages', icon: 'chat',          color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-100 dark:bg-blue-900/30' },
  events:   { label: 'Events',   icon: 'event',         color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  news:     { label: 'News',     icon: 'newspaper',     color: 'text-green-600 dark:text-green-400',   bg: 'bg-green-100 dark:bg-green-900/30' },
};

const statusColors: Record<string, string> = {
  PROPOSED:    'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300',
  APPROVED:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  COMPLETED:   'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  SENT:        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  READ:        'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  UPCOMING:    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  DRAFT:       'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
  PUBLISHED:   'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

const suggestions = ['Transport', 'Budget', 'Meeting', 'Agreement', 'Aurora', 'Adama'];

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setActiveSection('all');
    try {
      const data = await searchApi.search(q);
      setResults(data);
    } catch {
      setResults(null);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      setInputValue(q);
      search(q);
    }
    inputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setQuery(trimmed);
    setSearchParams({ q: trimmed });
    search(trimmed);
  };

  const handleSuggestion = (s: string) => {
    setInputValue(s);
    setQuery(s);
    setSearchParams({ q: s });
    search(s);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setResults(null);
    setError('');
    setSearchParams({});
    inputRef.current?.focus();
  };

  const handleItemClick = (link: string) => {
    const parts = link.split('/');
    if (parts.length === 3 && ['messages', 'events', 'news'].includes(parts[1])) {
      navigate(`/${parts[1]}`, { state: { openId: parts[2] } });
    } else {
      navigate(link);
    }
  };

  const getSections = () => {
    if (!results) return [];
    return Object.entries(results).filter(([, items]) => Array.isArray(items) && items.length > 0);
  };

  const getFilteredSections = () => {
    if (activeSection === 'all') return getSections();
    return getSections().filter(([key]) => key === activeSection);
  };

  const getItemTitle = (key: string, item: SearchItem) => {
    if (key === 'messages') return item.subject ?? item.title ?? '(No subject)';
    return item.title ?? '(Untitled)';
  };

  const getItemSubtitle = (key: string, item: SearchItem) => {
    if (key === 'projects') return item.description ?? '';
    if (key === 'messages') return item.referenceNumber ? `Ref: ${item.referenceNumber}` : '';
    if (key === 'events') return item.hostCity ? `Hosted by ${item.hostCity}` : '';
    if (key === 'news') return item.postedByCity ? `Posted by ${item.postedByCity}` : '';
    return '';
  };

  const activeSections = getSections();

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white flex items-center gap-2">
          <Icon name="search" className="text-[#1a4a8a] dark:text-blue-400 text-3xl" />
          Search
        </h1>
        <p className="text-blue-400 dark:text-slate-400 mt-1 text-sm">
          Search across projects, messages, events, and news.
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon name="search" className="text-xl text-blue-400 dark:text-slate-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search projects, messages, events, news..."
            className="w-full bg-white dark:bg-[#0f172a] border border-blue-200 dark:border-slate-600 rounded-xl pl-12 pr-28 py-4 text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-base shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-300 hover:text-[#1a4a8a] dark:hover:text-white hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                title="Clear"
              >
                <Icon name="close" className="text-lg" />
              </button>
            )}
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="bg-[#1a4a8a] hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              {loading
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <Icon name="search" className="text-base" />
              }
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <Icon name="error_outline" className="text-lg shrink-0" />
          {error}
        </div>
      )}

      {/* Results area */}
      {loading ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
          <p className="text-blue-400 dark:text-slate-400 text-sm">Searching for "{query}"...</p>
        </div>
      ) : results !== null ? (
        totalResults === 0 ? (
          <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Icon name="search_off" className="text-4xl text-blue-300 dark:text-slate-600" />
            </div>
            <p className="text-[#1a4a8a] dark:text-white font-semibold">
              No results for "{query}"
            </p>
            <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
              Try different keywords or check your spelling.
            </p>
            <div className="flex flex-wrap gap-2 mt-5 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-blue-500 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white rounded-lg text-sm transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Summary + section filter tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-blue-400 dark:text-slate-400">
                Found{' '}
                <span className="font-semibold text-[#1a4a8a] dark:text-white">{totalResults}</span>{' '}
                result{totalResults !== 1 ? 's' : ''} for{' '}
                <span className="font-semibold text-[#1a4a8a] dark:text-white">"{query}"</span>
              </p>

              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setActiveSection('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    activeSection === 'all'
                      ? 'bg-[#1a4a8a] text-white shadow-sm'
                      : 'bg-white dark:bg-[#0f172a] border border-blue-100 dark:border-slate-700 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
                  }`}
                >
                  All ({totalResults})
                </button>
                {activeSections.map(([key, items]) => {
                  const cfg = sectionConfig[key];
                  if (!cfg) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        activeSection === key
                          ? 'bg-[#1a4a8a] text-white shadow-sm'
                          : 'bg-white dark:bg-[#0f172a] border border-blue-100 dark:border-slate-700 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
                      }`}
                    >
                      <Icon name={cfg.icon} className="text-sm" />
                      {cfg.label} ({Array.isArray(items) ? items.length : 0})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results sections */}
            <div className="space-y-4">
              {getFilteredSections().map(([key, items]) => {
                const cfg = sectionConfig[key];
                if (!cfg || !Array.isArray(items)) return null;
                return (
                  <div
                    key={key}
                    className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Section header */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-blue-50 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-800/50">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                        <Icon name={cfg.icon} className={`text-base ${cfg.color}`} />
                      </div>
                      <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                      <span className="text-xs text-blue-400 dark:text-slate-500 ml-auto">
                        {items.length} result{items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-blue-50 dark:divide-slate-800">
                      {items.map((item: SearchItem) => (
                        <div
                          key={item.id}
                          onClick={() => handleItemClick(item.link)}
                          className="flex items-center gap-4 px-5 py-4 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition group"
                        >
                          {/* Icon */}
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <Icon name={cfg.icon} className={`text-lg ${cfg.color}`} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition">
                              {getItemTitle(key, item)}
                            </p>
                            {getItemSubtitle(key, item) && (
                              <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5 truncate">
                                {getItemSubtitle(key, item)}
                              </p>
                            )}
                          </div>

                          {/* Status badge */}
                          {item.status && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                              statusColors[item.status] ?? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          )}

                          {/* Arrow */}
                          <Icon name="chevron_right" className="text-xl text-blue-300 dark:text-slate-600 shrink-0 group-hover:text-[#1a4a8a] dark:group-hover:text-blue-400 transition" />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* Initial empty state */
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            <Icon name="travel_explore" className="text-4xl text-blue-400 dark:text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-[#1a4a8a] dark:text-white mb-2">
            Search the portal
          </p>
          <p className="text-blue-400 dark:text-slate-400 text-sm max-w-xs">
            Search across projects, messages, events, and news all in one place.
          </p>

          {/* Quick suggestions */}
          <div className="mt-6">
            <p className="text-xs text-blue-300 dark:text-slate-500 font-medium uppercase tracking-wider mb-3">
              Try searching for
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-blue-500 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white hover:border-blue-300 dark:hover:border-slate-500 rounded-lg text-sm transition"
                >
                  <Icon name="trending_up" className="text-sm" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Category quick-links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-md">
            {Object.entries(sectionConfig).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => navigate(`/${key}`)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50/50 dark:bg-slate-800/50 hover:bg-blue-100 dark:hover:bg-slate-800 border border-blue-100 dark:border-slate-700 transition group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                  <Icon name={cfg.icon} className={`text-xl ${cfg.color}`} />
                </div>
                <span className="text-xs font-medium text-blue-500 dark:text-slate-400 group-hover:text-[#1a4a8a] dark:group-hover:text-white transition">
                  {cfg.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}