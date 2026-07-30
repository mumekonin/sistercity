import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { newsApi } from '../../api/news.api';
import type { NewsListItem } from '../../types/news.types';
import { useAuthStore } from '../../store/auth.store';
import CreateNewsModal from './CreateNewsModal';
import NewsDetailModal from './NewsDetailModal';

const categories = [
  { value: '', label: 'All' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'NEW_AGREEMENT', label: 'New Agreement' },
  { value: 'PROJECT_UPDATE', label: 'Project Update' },
  { value: 'EVENT_ANNOUNCEMENT', label: 'Event' },
  { value: 'JOINT_STATEMENT', label: 'Joint Statement' },
  { value: 'CULTURAL_HIGHLIGHT', label: 'Cultural' },
];

const categoryColors: Record<string, string> = {
  ACHIEVEMENT:'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  NEW_AGREEMENT:'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  PROJECT_UPDATE:'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  EVENT_ANNOUNCEMENT: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  JOINT_STATEMENT:    'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  CULTURAL_HIGHLIGHT: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:            { label: 'Draft',            className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  PENDING_APPROVAL: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300' },
  APPROVED:         { label: 'Approved',         className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
  REJECTED:         { label: 'Rejected',         className: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400' },
};

export default function NewsPage() {
  const { user } = useAuthStore();
  const [news, setNews] = useState<NewsListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'public' | 'manage'>('public');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openId) {
      setSelectedId(location.state.openId);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const limit = 9;

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = viewMode === 'manage'
        ? await newsApi.getManageAll(category || undefined, undefined, page, limit)
        : await newsApi.getAll(category || undefined, undefined, page, limit);
      setNews(data.data);
      setTotal(data.total);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category, page, viewMode]);

  const totalPages = Math.ceil(total / limit);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const isStaff = user?.role === 'CITY_ADMIN' ||
    user?.role === 'DEPT_OFFICER' ||
    user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
            News & Announcements
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            Public updates about partnership activities and milestones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle for staff */}
          {isStaff && (
            <div className="flex border border-blue-100 dark:border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('public')}
                className={`px-3 py-2 text-xs font-medium transition ${
                  viewMode === 'public'
                    ? 'bg-[#1a4a8a] text-white'
                    : 'text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setViewMode('manage')}
                className={`px-3 py-2 text-xs font-medium transition ${
                  viewMode === 'manage'
                    ? 'bg-[#1a4a8a] text-white'
                    : 'text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                Manage
              </button>
            </div>
          )}
          {user?.role === 'CITY_ADMIN' && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New article
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => { setCategory(cat.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              category === cat.value
                ? 'bg-[#1a4a8a] text-white'
                : 'bg-white dark:bg-[#0f172a] border border-blue-100 dark:border-slate-700 text-blue-400 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
        </div>
      ) : news.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-[#1a4a8a] dark:text-white font-medium">No articles found</p>
          <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
            {category ? 'Try a different category' : 'No news published yet'}
          </p>
        </div>
      ) : (
        <>
          {/* News grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {news.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                viewMode={viewMode}
                isStaff={isStaff}
                statusConfig={statusConfig}
                categoryColors={categoryColors}
                formatDate={formatDate}
                onClick={() => setSelectedId(article.id!)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-100 dark:border-slate-700 text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition ${
                    page === p
                      ? 'bg-[#1a4a8a] text-white'
                      : 'border border-blue-100 dark:border-slate-700 text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-lg border border-blue-100 dark:border-slate-700 text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateNewsModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchNews();
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedId && (
        <NewsDetailModal
          newsId={selectedId}
          viewMode={viewMode}
          onClose={() => setSelectedId(null)}
          onUpdated={() => {
            setSelectedId(null);
            fetchNews();
          }}
        />
      )}
    </div>
  );
}

// ================================
// News Card Component
// ================================
function NewsCard({
  article,
  viewMode,
  isStaff,
  statusConfig,
  categoryColors,
  formatDate,
  onClick,
}: {
  article: NewsListItem;
  viewMode: string;
  isStaff: boolean;
  statusConfig: Record<string, { label: string; className: string }>;
  categoryColors: Record<string, string>;
  formatDate: (d?: Date) => string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-blue-300 dark:hover:border-slate-500 transition cursor-pointer group"
    >
      {/* Category banner */}
      <div className="bg-gradient-to-r from-[#1a4a8a] to-blue-500 h-2" />

      <div className="p-5">
        {/* Top badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[article.category ?? ''] ?? 'bg-blue-100 text-blue-600'}`}>
            {article.category?.replace(/_/g, ' ')}
          </span>
          {article.isJoint && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              Joint
            </span>
          )}
          {isStaff && viewMode === 'manage' && article.approvalStatus && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[article.approvalStatus].className}`}>
              {statusConfig[article.approvalStatus].label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#1a4a8a] dark:text-white leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition line-clamp-2">
          {article.title}
        </h3>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-50 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#1a4a8a] rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {article.postedByCity?.charAt(0)}
              </span>
            </div>
            <span className="text-xs text-blue-400 dark:text-slate-400">
              {article.postedByCity}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-blue-400 dark:text-slate-400">
            {article.views !== undefined && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {article.views}
              </span>
            )}
            <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}