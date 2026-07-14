import { useEffect, useState } from 'react';
import { messagesApi } from '../../api/messages.api';
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
    if (!message || !replyBody.trim()) return;
    setReplying(true);
    try {
      await messagesApi.reply(message.id, { body: replyBody });
      setReplyBody('');
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
                  {message.from.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
                  {message.from.name}
                </p>
                <p className="text-xs text-blue-400 dark:text-slate-400">
                  {message.from.city} · {message.from.department}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-400 dark:text-slate-400">
                {new Date(message.createdAt).toLocaleDateString()}
              </p>
              <p className="text-xs text-blue-300 dark:text-slate-500 mt-0.5">
                To: {message.to.city} · {message.to.department}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="text-sm text-[#1a4a8a] dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {message.body}
          </div>

          {/* Deadline */}
          <div className="mt-4 pt-4 border-t border-blue-50 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-blue-400 dark:text-slate-400">
              Response deadline:{' '}
              <span className={isOverdue(message.responseDeadline) ? 'text-red-500 font-medium' : ''}>
                {new Date(message.responseDeadline).toLocaleDateString()}
              </span>
            </p>
            {message.readAt && (
              <p className="text-xs text-green-500">
                ✓ Read {new Date(message.readAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Thread replies */}
        {message.thread && message.thread.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-1">
              Replies ({message.thread.length})
            </p>
            {message.thread.map((reply) => (
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
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 transition resize-none"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowReply(false)}
                className="px-4 py-2 text-sm text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={replying || !replyBody.trim()}
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
          {message.status !== 'CLOSED' && (
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