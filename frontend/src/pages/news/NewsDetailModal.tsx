import { useEffect, useState } from 'react';
import { newsApi } from '../../api/news.api';
import type { News } from '../../types/news.types';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  newsId: string;
  viewMode?: string;
  onClose: () => void;
  onUpdated: () => void;
}

const categoryColors: Record<string, string> = {
  ACHIEVEMENT:        'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  NEW_AGREEMENT:      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  PROJECT_UPDATE:     'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
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

export default function NewsDetailModal({ newsId, viewMode, onClose, onUpdated }: Props) {
  const { user } = useAuthStore();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [editForm, setEditForm] = useState({
    title: '',
    body: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = viewMode === 'manage' 
          ? await newsApi.getManageById(newsId)
          : await newsApi.getById(newsId);
        setArticle(data);
        setEditForm({ title: data.title ?? '', body: data.body ?? '' });
      } catch {
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [newsId, viewMode]);

  const handleAction = async (action: string, extra?: any) => {
    if (!article) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', action);
      if (extra?.rejectionReason) formData.append('rejectionReason', extra.rejectionReason);
      if (extra?.title) formData.append('title', extra.title);
      if (extra?.body) formData.append('body', extra.body);
      editFiles.forEach((f) => formData.append('images', f));

      const updated = await newsApi.update(article.id!, formData);
      setArticle(updated);
      setShowRejectForm(false);
      setShowEditForm(false);
      setRejectionReason('');
      setEditFiles([]);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm('Are you sure you want to delete this article?')) return;
    setActionLoading(true);
    try {
      await newsApi.delete(article.id!);
      onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete article');
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOrganizer = article?.postedByCity === user?.city ||
    article?.postedByCity === 'JOINT' ||
    user?.role === 'SUPER_ADMIN';

  const isDraft = article?.approvalStatus === 'DRAFT' ||
    article?.approvalStatus === 'PENDING_APPROVAL' ||
    article?.approvalStatus === 'REJECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
            Article
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="p-6 text-red-500 text-sm">{error}</div>
          ) : article ? (
            <div className="p-6 space-y-5">

              {/* Images */}
              {article.images && article.images.length > 0 && (
                <div className="space-y-2">
                  <img
                    src={article.images[activeImage]}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  {article.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {article.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          onClick={() => setActiveImage(i)}
                          className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition ${
                            activeImage === i
                              ? 'border-[#1a4a8a]'
                              : 'border-transparent hover:border-blue-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title & badges */}
              <div>
                <h3 className="text-xl font-bold text-[#1a4a8a] dark:text-white mb-3">
                  {article.title}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[article.category ?? ''] ?? ''}`}>
                    {article.category?.replace(/_/g, ' ')}
                  </span>
                  {article.isJoint && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                      Joint
                    </span>
                  )}
                  {article.approvalStatus && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusConfig[article.approvalStatus].className}`}>
                      {statusConfig[article.approvalStatus].label}
                    </span>
                  )}
                  {article.isPublic && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      Public
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-blue-400 dark:text-slate-400">
                <span>{article.postedByCity}</span>
                <span>·</span>
                <span>{article.views} views</span>
                {article.publishedAt && (
                  <>
                    <span>·</span>
                    <span>Published {new Date(article.publishedAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>

              {/* Approval status for joint */}
              {article.isJoint && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Adama', confirmed: article.approvedByAdama },
                    { label: 'Aurora', confirmed: article.approvedByAurora },
                  ].map((city) => (
                    <div key={city.label}
                      className={`flex items-center gap-2 p-3 rounded-xl border ${
                        city.confirmed
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-blue-50 dark:bg-slate-800 border-blue-100 dark:border-slate-700'
                      }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
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
                          {city.confirmed ? 'Approved' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="text-sm text-[#1a4a8a] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {article.body}
              </div>

              {/* Edit form */}
              {showEditForm && (
                <div className="space-y-3 bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">Edit Article</p>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                  <textarea
                    rows={4}
                    value={editForm.body}
                    onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                    className="w-full bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                  <div>
                    <p className="text-xs text-blue-400 dark:text-slate-400 mb-1">New images (optional)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && setEditFiles(Array.from(e.target.files))}
                      className="text-xs text-blue-400 dark:text-slate-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('edit', { title: editForm.title, body: editForm.body })}
                      disabled={actionLoading}
                      className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm py-2 rounded-lg transition"
                    >
                      {actionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="px-4 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="space-y-2 bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejection Reason</p>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why is this article being rejected?"
                    className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-red-400 transition"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('reject', { rejectionReason })}
                      disabled={!rejectionReason.trim() || actionLoading}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm py-2 rounded-lg transition"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => { setShowRejectForm(false); setRejectionReason(''); }}
                      className="px-4 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {canManage && (
                <div className="space-y-2 pt-2 border-t border-blue-50 dark:border-slate-800">

                  {/* Approve */}
                  {(article.approvalStatus === 'DRAFT' ||
                    article.approvalStatus === 'PENDING_APPROVAL') && (
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      ✓ Approve
                    </button>
                  )}

                  {/* Reject */}
                  {(article.approvalStatus === 'DRAFT' ||
                    article.approvalStatus === 'PENDING_APPROVAL') &&
                    !showRejectForm && (
                    <button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      ✗ Reject
                    </button>
                  )}

                  {/* Publish */}
                  {article.approvalStatus === 'APPROVED' && !article.publishedAt && (
                    <button
                      onClick={() => handleAction('publish')}
                      disabled={actionLoading}
                      className="w-full bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      🌐 Publish
                    </button>
                  )}

                  {/* Unpublish */}
                  {article.publishedAt && (
                    <button
                      onClick={() => handleAction('unpublish')}
                      disabled={actionLoading}
                      className="w-full border border-blue-200 dark:border-slate-600 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      Unpublish
                    </button>
                  )}

                  {/* Edit */}
                  {isOrganizer && isDraft && !showEditForm && (
                    <button
                      onClick={() => setShowEditForm(true)}
                      disabled={actionLoading}
                      className="w-full bg-blue-50 dark:bg-slate-800 text-[#1a4a8a] dark:text-white hover:bg-blue-100 dark:hover:bg-slate-700 text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      ✏️ Edit Article
                    </button>
                  )}

                  {/* Delete */}
                  {isOrganizer && !article.publishedAt && (
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="w-full border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium py-2.5 rounded-lg transition"
                    >
                      🗑 Delete Article
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}