import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents.api';
import type { DocumentListItem } from '../../types/document.types';
import { useAuthStore } from '../../store/auth.store';
import StatusBadge from '../../components/shared/StatusBadge';
import AccessBadge from '../../components/shared/AccessBadge';
import UploadDocumentModal from './UploadDocumentModal';
import DocumentDetailModal from './DocumentDetailModal';

const categories = ['All', 'AGREEMENT', 'FINANCIAL', 'REPORT', 'MINUTES', 'LOGISTICS', 'LEGAL', 'TECHNICAL', 'OTHER'];

export default function DocumentsPage() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentListItem | null>(null);

  const fetchDocuments = async () => {
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filtered = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'All' || doc.category === activeCategory;
    return matchesSearch && matchesCategory && !doc.isArchived;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  const handleRead = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    try {
      const { fileUrl } = await documentsApi.download(docId);
      window.open(fileUrl, '_blank', 'noreferrer');
    } catch (err) {
      console.error('Read failed', err);
    }
  };

  const handleForceDownload = async (e: React.MouseEvent, docId: string, fileName: string) => {
    e.stopPropagation();
    try {
      const { fileUrl } = await documentsApi.download(docId);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
            Documents
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            Official file repository for the sister city partnership.
          </p>
        </div>
        {(user?.role === 'CITY_ADMIN' || user?.role === 'DEPT_OFFICER') && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload document
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
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-4 space-y-4">

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-blue-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 transition"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat
                  ? 'bg-[#1a4a8a] text-white'
                  : 'bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white'
              }`}
            >
              {cat === 'All' ? 'All' : cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Documents table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">

        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-blue-50 dark:bg-slate-800 border-b border-blue-100 dark:border-slate-700">
          <div className="col-span-4 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Document
          </div>
          <div className="col-span-2 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Category
          </div>
          <div className="col-span-2 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Size
          </div>
          <div className="col-span-2 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Access
          </div>
          <div className="col-span-1 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Status
          </div>
          <div className="col-span-1 text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
            Actions
          </div>
        </div>

        {/* Table rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-[#1a4a8a] dark:text-white font-medium">No documents found</p>
            <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'Upload your first document'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-blue-50 dark:divide-slate-800">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                {/* Document info */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white truncate">
                      {doc.title}
                    </p>
                    <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                      {doc.fileName} · v{doc.versionNumber}
                    </p>
                    <p className="text-xs text-blue-300 dark:text-slate-500 mt-0.5 md:hidden">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2 flex items-center">
                  <span className="text-xs font-medium text-blue-400 dark:text-slate-400 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                    {doc.category.charAt(0) + doc.category.slice(1).toLowerCase()}
                  </span>
                </div>

                {/* Size */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-blue-400 dark:text-slate-400">
                    {formatFileSize(doc.fileSize)}
                  </span>
                </div>

                {/* Access */}
                <div className="col-span-2 flex items-center">
                  <AccessBadge access={doc.accessLevel} />
                </div>

                {/* Status */}
                <div className="col-span-1 flex items-center">
                  <StatusBadge status={doc.approvalStatus} />
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}>
                  
                   <button
                    onClick={(e) => handleRead(e, doc.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition"
                    title="Read"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>

                   <button
                    onClick={(e) => handleForceDownload(e, doc.id, doc.fileName)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 transition"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadDocumentModal
          onClose={() => setShowUpload(false)}
          onUploaded={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            setShowUpload(false);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedDoc && (
        <DocumentDetailModal
          documentId={selectedDoc.id}
          onClose={() => setSelectedDoc(null)}
          onUpdated={(updated) => {
            setDocuments((prev) =>
              prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
            );
          }}
        />
      )}

    </div>
  );
}