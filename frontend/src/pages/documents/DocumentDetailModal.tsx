import { useEffect, useState } from 'react';
import { documentsApi } from '../../api/documents.api';
import type { DocumentFile } from '../../types/document.types';
import { useAuthStore } from '../../store/auth.store';
import StatusBadge from '../../components/shared/StatusBadge';
import AccessBadge from '../../components/shared/AccessBadge';

interface Props {
  documentId: string;
  onClose: () => void;
  onUpdated: (doc: DocumentFile) => void;
}

export default function DocumentDetailModal({ documentId, onClose, onUpdated }: Props) {
  const { user } = useAuthStore();
  const [document, setDocument] = useState<DocumentFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [approvalNote, setApprovalNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState('');

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const data = await documentsApi.getById(documentId);
        setDocument(data);
      } catch {
        setError('Failed to load document');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  const handleAction = async (action: string, extra?: any) => {
    if (!document) return;
    setActionLoading(true);
    try {
      const updated = await documentsApi.update(document.id, {
        action,
        approvalNote: approvalNote || undefined,
        ...extra,
      });
      setDocument(updated);
      onUpdated(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVersionUpload = async () => {
    if (!document || !versionFile) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', versionFile);
      if (versionNote) formData.append('changeNote', versionNote);
      const updated = await documentsApi.uploadVersion(document.id, formData);
      setDocument(updated);
      onUpdated(updated);
      setShowVersionUpload(false);
      setVersionFile(null);
      setVersionNote('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Version upload failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReadMain = async () => {
    if (!document) return;
    try {
      const { fileUrl } = await documentsApi.download(document.id);
      window.open(fileUrl, '_blank', 'noreferrer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Read failed');
    }
  };

  const handleDownloadMain = async () => {
    if (!document) return;
    try {
      const { fileUrl } = await documentsApi.download(document.id);
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Download failed');
    }
  };

  const handleReadVersion = async (versionUrl: string) => {
    if (!document) return;
    try {
      await documentsApi.download(document.id);
      window.open(versionUrl, '_blank', 'noreferrer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Read failed');
    }
  };

  const handleDownloadVersion = async (versionUrl: string, fileName: string) => {
    if (!document) return;
    try {
      await documentsApi.download(document.id);
      const response = await fetch(versionUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Download failed');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canApprove = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';
  const canUploadVersion =
    user?.role === 'CITY_ADMIN' || user?.role === 'DEPT_OFFICER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
            Document Details
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          ) : document ? (
            <>
              {/* Document info */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl shrink-0">
                  📄
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
                    {document.title}
                  </h3>
                  <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
                    {document.fileName} · {formatFileSize(document.fileSize)}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <StatusBadge status={document.approvalStatus} />
                    <AccessBadge access={document.accessLevel} />
                    <span className="text-xs bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-slate-400 px-2.5 py-1 rounded-full">
                      v{document.versionNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                {[
                  { label: 'Category', value: document.category },
                  { label: 'City', value: document.city },
                  { label: 'Department', value: document.department },
                  { label: 'Document Date', value: new Date(document.documentDate).toLocaleDateString() },
                  { label: 'Uploaded', value: new Date(document.createdAt).toLocaleDateString() },
                  { label: 'Expiry', value: document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : 'None' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-blue-400 dark:text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-[#1a4a8a] dark:text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Description
                </p>
                <p className="text-sm text-blue-400 dark:text-slate-400 leading-relaxed">
                  {document.description}
                </p>
              </div>

              {/* Approval note */}
              {document.approvalNote && (
                <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Approval Note
                  </p>
                  <p className="text-sm text-blue-400 dark:text-slate-400">
                    {document.approvalNote}
                  </p>
                </div>
              )}

              {/* Previous versions */}
              {document.previousVersions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
                    Version History
                  </p>
                  <div className="space-y-2">
                    {document.previousVersions.map((v, i) => (
                      <div key={i}
                        className="flex items-center justify-between py-2 border-b border-blue-50 dark:border-slate-800 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">
                            v{v.versionNumber} — {v.fileName}
                          </p>
                          <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                            {new Date(v.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleReadVersion(v.fileUrl)}
                            className="text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-xs font-medium transition">
                            Read
                          </button>
                          <span className="text-blue-200 dark:text-slate-700">•</span>
                          <button onClick={() => handleDownloadVersion(v.fileUrl, v.fileName)}
                            className="text-[#1a4a8a] dark:text-white hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium transition">
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">

                {/* Approve/Reject — CITY_ADMIN only */}
                {canApprove && document.approvalStatus === 'DRAFT' && (
                  <div className="space-y-3">
                    {!showRejectInput ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction('approve')}
                          disabled={actionLoading}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => setShowRejectInput(true)}
                          disabled={actionLoading}
                          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-medium py-2.5 rounded-lg transition"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl">
                        <div>
                          <label className="block text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                            Rejection Reason <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            value={approvalNote}
                            onChange={(e) => setApprovalNote(e.target.value)}
                            placeholder="Please explain why this document is being rejected..."
                            rows={3}
                            className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-red-500 transition resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction('reject')}
                            disabled={actionLoading || !approvalNote.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-2 rounded-lg transition"
                          >
                            {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectInput(false);
                              setApprovalNote('');
                            }}
                            className="px-4 text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Archive */}
                {canApprove && !document.isArchived && (
                  <button
                    onClick={() => handleAction('archive')}
                    disabled={actionLoading}
                    className="w-full border border-blue-200 dark:border-slate-600 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm font-medium py-2.5 rounded-lg transition"
                  >
                    Archive Document
                  </button>
                )}

                {/* Upload new version */}
                {canUploadVersion && (
                  <>
                    {!showVersionUpload ? (
                      <button
                        onClick={() => setShowVersionUpload(true)}
                        className="w-full bg-blue-50 dark:bg-slate-800 text-[#1a4a8a] dark:text-white hover:bg-blue-100 dark:hover:bg-slate-700 text-sm font-medium py-2.5 rounded-lg transition"
                      >
                        Upload New Version
                      </button>
                    ) : (
                      <div className="space-y-3 bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">
                          Upload New Version
                        </p>
                        <input
                          type="file"
                          onChange={(e) => e.target.files?.[0] && setVersionFile(e.target.files[0])}
                          className="w-full text-sm text-blue-400 dark:text-slate-400"
                        />
                        <input
                          type="text"
                          value={versionNote}
                          onChange={(e) => setVersionNote(e.target.value)}
                          placeholder="Change note (optional)"
                          className="w-full bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleVersionUpload}
                            disabled={!versionFile || actionLoading}
                            className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm py-2 rounded-lg transition"
                          >
                            {actionLoading ? 'Uploading...' : 'Upload'}
                          </button>
                          <button
                            onClick={() => setShowVersionUpload(false)}
                            className="px-4 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Download and Read buttons */}
                <div className="flex gap-3">
                  <button onClick={handleReadMain}
                    className="flex-1 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-[#1a4a8a] dark:text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Read
                  </button>

                  <button onClick={handleDownloadMain}
                    className="flex-1 bg-[#1a4a8a] hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>

              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}