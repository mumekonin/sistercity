import { useEffect, useState } from 'react';
import { messagesApi } from '../../api/messages.api';
import { documentsApi } from '../../api/documents.api';
import type { Message } from '../../types/message.types';
import { useAuthStore } from '../../store/auth.store';

interface Props {
  messageId: string;
  onBack: () => void;
  onUpdated: (msg: Message) => void;
}

const priorityConfig: Record<string, string> = {
  NORMAL:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  URGENT:   'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
};

export default function MessageDetail({ messageId, onBack, onUpdated }: Props) {
  const { user } = useAuthStore();
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [replying, setReplying] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await messagesApi.getById(messageId);
        setMessage(data);
        // Notify parent so it can refresh the unread badge right away
        onUpdated(data);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [messageId]);

  const handleReply = async () => {
    if (!message || (!replyBody.trim() && files.length === 0)) return;
    setReplying(true);
    try {
      const attachments = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploaded = await messagesApi.uploadAttachment(formData);
        attachments.push({
          fileName: uploaded.fileName,
          fileUrl: uploaded.fileUrl,
        });
      }

      await messagesApi.reply(message.id, { body: replyBody, attachments });
      setReplyBody('');
      setFiles([]);
      setShowReply(false);
      const updated = await messagesApi.getById(messageId);
      setMessage(updated);
    } finally {
      setReplying(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!message) return;
    setActionLoading(true);
    try {
      const updated = await messagesApi.update(message.id, action);
      setMessage(updated);
      onUpdated(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const isOverdue = (deadline: Date) => new Date(deadline) < new Date();
  const canManage = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!message) return null;

  // Find the original message (either the current message, or the one in the thread with id === threadId)
  const isCurrentOriginal = message.parentId === null || message.id === message.threadId;
  const originalMessage = isCurrentOriginal
    ? message 
    : message.thread?.find(t => t.id === message.threadId);

  const displayOriginal = originalMessage || message;

  // Get all replies (if current is reply, it is a reply. plus all thread items that are not the original message)
  const replies: any[] = [];
  if (!isCurrentOriginal) {
    replies.push({
      id: message.id,
      referenceNumber: message.referenceNumber,
      from: message.from,
      to: message.to,
      body: message.body,
      attachments: message.attachments,
      createdAt: message.createdAt
    });
  }
  if (message.thread) {
    message.thread.forEach(t => {
      if (t.id !== displayOriginal.id) {
        replies.push(t);
      }
    });
  }
  // Sort replies chronologically
  replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Determine who can reply (only the recipient of the last message in the thread)
  const lastMessage = replies.length > 0 ? replies[replies.length - 1] : displayOriginal;
  const isRecipient = lastMessage.to.city === user?.city && lastMessage.to.department === user?.department;

  const renderAttachments = (attachments: any[]) => {
    if (!attachments || attachments.length === 0) return null;
    return (
      <div className="mt-5 flex flex-col gap-2">
        <p className="text-[11px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-1">
          Attachments ({attachments.length})
        </p>
        <div className="flex flex-wrap gap-3">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-lg shadow-sm w-full sm:w-auto sm:min-w-[280px] group hover:bg-blue-100 dark:hover:bg-slate-700/80 transition"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded bg-white dark:bg-slate-900 flex items-center justify-center shrink-0 border border-blue-100 dark:border-slate-700 shadow-sm">
                  <svg className="w-4 h-4 text-[#1a4a8a] dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#1a4a8a] dark:text-slate-200 truncate pr-4">
                  {att.fileName}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-blue-500 hover:text-white bg-white hover:bg-[#1a4a8a] dark:bg-slate-800 dark:hover:bg-blue-600 rounded-md shadow-sm border border-blue-100 dark:border-slate-600 transition"
                  title="View File"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </a>
                
                <button
                  onClick={async () => {
                    try {
                      let downloadUrl = att.fileUrl;
                      
                      if (att.documentId) {
                        try {
                          const dl = await documentsApi.download(att.documentId);
                          if (dl && dl.fileUrl) downloadUrl = dl.fileUrl;
                        } catch (e) {
                          console.error('Failed to log document download', e);
                        }
                      }

                      // For Cloudinary URLs, inject fl_attachment to force download
                      if (downloadUrl.includes('cloudinary.com') && downloadUrl.includes('/upload/')) {
                        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
                      }

                      // Create a hidden <a> and programmatically click it
                      const a = document.createElement('a');
                      a.style.display = 'none';
                      a.href = downloadUrl;
                      a.download = att.fileName; // sets the saved filename
                      // Do NOT set target="_blank" — that would open in browser
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    } catch (err) {
                      // Last resort: open in new tab if everything else fails
                      window.open(att.fileUrl, '_blank');
                    }
                  }}
                  className="p-1.5 text-blue-500 hover:text-white bg-white hover:bg-[#1a4a8a] dark:bg-slate-800 dark:hover:bg-blue-600 rounded-md shadow-sm border border-blue-100 dark:border-slate-600 transition flex items-center gap-1"
                  title="Download File"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block ml-1">Download</span>
                  <svg className="w-4 h-4 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="p-4 border-b border-blue-100 dark:border-slate-700 bg-white dark:bg-[#0f172a]">
        <div className="flex items-center gap-3 mb-3">
          {/* Back button  mobile */}
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#1a4a8a] dark:text-white truncate">
              {message.subject}
            </h2>
            <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
              {message.referenceNumber}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityConfig[message.priority]}`}>
            {message.priority}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-slate-400 font-medium">
            {message.messageType}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-400 dark:text-slate-400 font-medium">
            {message.status}
          </span>
          {message.isEscalated && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
              ⚠ Escalated
            </span>
          )}
          {isOverdue(message.responseDeadline) && message.status === 'SENT' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
              Overdue
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-blue-50/30 dark:bg-[#0d1117]">

        {/* Original message */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-5">

          {/* From/To */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#1a4a8a] rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">
                  {displayOriginal.from.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
                  {displayOriginal.from.name}
                </p>
                <p className="text-xs text-blue-400 dark:text-slate-400">
                  {displayOriginal.from.city} · {displayOriginal.from.department}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-400 dark:text-slate-400">
                {new Date(displayOriginal.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-blue-300 dark:text-slate-500 mt-0.5">
                To: {displayOriginal.to.city} · {displayOriginal.to.department}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="text-sm text-[#1a4a8a] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {displayOriginal.body}
          </div>

          {renderAttachments(displayOriginal.attachments || [])}

          {/* Deadline */}
          <div className="mt-4 pt-4 border-t border-blue-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-blue-400 dark:text-slate-400">
              Response deadline:{' '}
              <span className={isOverdue(displayOriginal.responseDeadline || message.responseDeadline) ? 'text-red-500 font-medium' : ''}>
                {new Date(displayOriginal.responseDeadline || message.responseDeadline).toLocaleDateString()}
              </span>
            </p>
            {displayOriginal.readAt && (
              <p className="text-xs text-green-500">
                ✓ Read {new Date(displayOriginal.readAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Thread replies */}
        {replies.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-1">
              Replies ({replies.length})
            </p>
            {replies.map((reply) => (
              <div key={reply.id}
                className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {reply.from.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
                      {reply.from.name}
                    </p>
                    <p className="text-xs text-blue-400 dark:text-slate-400">
                      {reply.from.city} · {reply.from.department}
                    </p>
                  </div>
                  <p className="text-xs text-blue-300 dark:text-slate-500">
                    {new Date(reply.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm text-[#1a4a8a] dark:text-slate-300 leading-relaxed">
                  {reply.body}
                </p>
                {renderAttachments(reply.attachments || [])}
              </div>
            ))}
          </div>
        )}

        {/* Reply box */}
        {showReply && (
          <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-200 dark:border-slate-600 p-4">
            <p className="text-sm font-medium text-[#1a4a8a] dark:text-white mb-3">
              Reply to {message.from.name}
            </p>
            <textarea
              rows={4}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write your reply..."
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 transition resize-none mb-3"
            />
            
            {/* File attachment UI for reply */}
            <div>
              <label className="flex items-center justify-center px-4 py-2 bg-white dark:bg-slate-800 border-2 border-dashed border-blue-200 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-400 dark:hover:border-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition group w-full sm:w-auto inline-flex">
                <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-[#1a4a8a] dark:text-white font-medium">Attach Files</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </label>
              
              {files.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-lg shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-[#1a4a8a] dark:text-slate-300 truncate">{f.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition"
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

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowReply(false)}
                className="px-4 py-2 text-sm text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={replying || (!replyBody.trim() && files.length === 0)}
                className="px-4 py-2 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
              >
                {replying ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="p-4 border-t border-blue-100 dark:border-slate-700 bg-white dark:bg-[#0f172a]">
        <div className="flex flex-wrap gap-2">

          {/* Reply */}
          {message.status !== 'CLOSED' && isRecipient && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1.5 bg-[#1a4a8a] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Reply
            </button>
          )}

          {/* Escalate */}
          {canManage && !message.isEscalated && message.status !== 'CLOSED' && (
            <button
              onClick={() => handleAction('escalate')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Escalate
            </button>
          )}

          {/* Close */}
          {canManage && message.status !== 'CLOSED' && (
            <button
              onClick={() => handleAction('close')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 border border-blue-200 dark:border-slate-600 text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>
              Close
            </button>
          )}

        </div>
      </div>
    </div>
  );
}