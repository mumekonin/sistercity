import { useEffect, useState, useCallback } from 'react';
import { messagesApi } from '../../api/messages.api';
import type { Message, MessageListItem } from '../../types/message.types';
import { useMessageStore } from '../../store/messages.store';
import MessageDetail from './MessageDetail';
import NewMessageModal from './NewMessageModal';

const tabs = [
  { id: 'received', label: 'Inbox',   icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
  { id: 'sent',     label: 'Sent',    icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { id: 'unread',   label: 'Unread',  icon: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z' },
  { id: 'urgent',   label: 'Urgent',  icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
];

const priorityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  NORMAL:   { bg: 'bg-sky-100 dark:bg-sky-900/30',    text: 'text-sky-600 dark:text-sky-300',    dot: 'bg-sky-400' },
  URGENT:   { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-300', dot: 'bg-amber-400' },
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-600 dark:text-red-300',    dot: 'bg-red-500' },
};

const statusConfig: Record<string, string> = {
  SENT:      'text-sky-400',
  READ:      'text-emerald-500',
  REPLIED:   'text-violet-500',
  ESCALATED: 'text-red-500',
  CLOSED:    'text-slate-400',
};

const statusLabel: Record<string, string> = {
  SENT:      '● New',
  READ:      '✓ Read',
  REPLIED:   '↩ Replied',
  ESCALATED: '⚠ Escalated',
  CLOSED:    '✗ Closed',
};

function isOverdue(deadline: Date) {
  return new Date(deadline) < new Date();
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function MessagesPage() {
  const { unreadCount, refresh: refreshStore } = useMessageStore();
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [search, setSearch] = useState('');
  const [prevUnread, setPrevUnread] = useState(0);
  const [badgePop, setBadgePop] = useState(false);

  const fetchMessages = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const data = await messagesApi.getAll(type);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(activeTab);
    setSelectedId(null);
  }, [activeTab, fetchMessages]);

  // Animate badge when unread count increases
  useEffect(() => {
    if (unreadCount > prevUnread && prevUnread !== 0) {
      setBadgePop(true);
      setTimeout(() => setBadgePop(false), 600);
    }
    setPrevUnread(unreadCount);
  }, [unreadCount, prevUnread]);

  // When a message is opened and read, refresh the store count
  const handleMessageRead = useCallback(() => {
    refreshStore();
    // Also refresh the current tab list to reflect status change
    fetchMessages(activeTab);
  }, [refreshStore, fetchMessages, activeTab]);

  const filtered = messages.filter((m) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from.name.toLowerCase().includes(search.toLowerCase()) ||
    m.referenceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const getTabBadge = (tabId: string) => {
    if (tabId === 'unread') return unreadCount;
    return 0;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 bg-white dark:bg-[#0f172a] rounded-2xl border border-blue-100 dark:border-slate-700 overflow-hidden shadow-sm">
      {/* LEFT PANEL — message list                              */}
      <div className={`flex flex-col border-r border-blue-100 dark:border-slate-700 transition-all duration-200 ${selectedId ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'}`}>

        {/*  Header  */}
        <div className="px-5 pt-5 pb-3 border-b border-blue-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-[#1a4a8a] dark:text-white leading-tight">
                Official Communication
              </h1>
              <p className="text-xs text-blue-300 dark:text-slate-500 mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`
                  : 'All messages read'}
              </p>
            </div>
            <button
              id="new-message-btn"
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-1.5 bg-[#1a4a8a] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Compose
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-blue-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="message-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by subject, name or ref…"
              className="w-full bg-blue-50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-xl pl-8 pr-4 py-2 text-xs text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-[#1a4a8a] dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 transition"
            />
          </div>
        </div>

        {/*  Tabs  */}
        <div className="flex border-b border-blue-50 dark:border-slate-800 px-1 pt-1">
          {tabs.map((tab) => {
            const badge = getTabBadge(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 flex-1 justify-center py-2.5 text-xs font-medium border-b-2 transition-all duration-150 whitespace-nowrap rounded-t-lg ${
                  isActive
                    ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-white dark:border-blue-400 bg-blue-50/60 dark:bg-slate-800/40'
                    : 'border-transparent text-blue-300 dark:text-slate-500 hover:text-[#1a4a8a] dark:hover:text-slate-300 hover:bg-blue-50/40 dark:hover:bg-slate-800/20'
                }`}
              >
                {tab.label}
                {badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white
                      ${tab.id === 'urgent' ? 'bg-red-500' : 'bg-[#1a4a8a] dark:bg-blue-500'}
                      ${badgePop && tab.id === 'unread' ? 'animate-bounce' : ''}
                    `}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/*  Message list  */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-[#1a4a8a] border-t-transparent animate-spin" />
              </div>
              <p className="text-xs text-blue-300 dark:text-slate-500">Loading messages…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
                <svg className="w-7 h-7 text-blue-200 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
                {search ? 'No results' : 'No messages'}
              </p>
              <p className="text-xs text-blue-300 dark:text-slate-500 mt-1">
                {search ? `Nothing matches "${search}"` : `Your ${activeTab} folder is empty`}
              </p>
              {!search && (
                <button
                  onClick={() => setShowNewMessage(true)}
                  className="mt-4 text-xs text-[#1a4a8a] dark:text-blue-400 font-medium hover:underline"
                >
                  + Compose a message
                </button>
              )}
            </div>
          ) : (
            <ul>
              {filtered.map((message) => {
                const isUnread = message.status === 'SENT';
                const over    = isOverdue(message.responseDeadline);
                const pCfg    = priorityConfig[message.priority] ?? priorityConfig.NORMAL;
                const isSelected = selectedId === message.id;

                return (
                  <li
                    key={message.id}
                    id={`msg-${message.id}`}
                    onClick={() => setSelectedId(message.id)}
                    className={`px-4 py-3.5 border-b border-blue-50 dark:border-slate-800/70 cursor-pointer transition-all duration-100 ${
                      isSelected
                        ? 'bg-[#1a4a8a]/5 dark:bg-blue-900/20 border-l-2 border-l-[#1a4a8a]'
                        : 'hover:bg-blue-50/60 dark:hover:bg-slate-800/40 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Row 1 — sender + time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Unread indicator dot */}
                        <span className={`w-2 h-2 rounded-full shrink-0 transition-all duration-200 ${isUnread ? 'bg-[#1a4a8a] dark:bg-blue-400 shadow-sm' : 'bg-transparent'}`} />
                        <span className={`text-sm truncate ${isUnread ? 'font-bold text-[#1a4a8a] dark:text-white' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                          {message.from.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-300 dark:text-slate-500 shrink-0 tabular-nums">
                        {timeAgo(message.createdAt)}
                      </span>
                    </div>

                    {/* Row 2 — subject */}
                    <p className={`text-xs truncate ml-4 mb-2 ${isUnread ? 'text-[#1a4a8a] dark:text-slate-200 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {message.subject}
                    </p>

                    {/* Row 3 — chips */}
                    <div className="flex items-center gap-1.5 ml-4 flex-wrap">
                      {/* Priority chip */}
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${pCfg.bg} ${pCfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                        {message.priority}
                      </span>

                      {/* Status chip */}
                      <span className={`text-[10px] font-medium ${statusConfig[message.status]}`}>
                        {statusLabel[message.status]}
                      </span>

                      {/* Escalated */}
                      {message.isEscalated && (
                        <span className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full">
                          ⚠ Escalated
                        </span>
                      )}

                      {/* Overdue */}
                      {over && isUnread && (
                        <span className="text-[10px] font-semibold text-red-400 dark:text-red-300">
                          Overdue
                        </span>
                      )}

                      {/* Ref number  pushed right */}
                      <span className="ml-auto text-[10px] text-blue-200 dark:text-slate-600 font-mono truncate max-w-[90px]">
                        {message.referenceNumber}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/*  Footer count  */}
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 border-t border-blue-50 dark:border-slate-800 bg-blue-50/40 dark:bg-slate-900/30">
            <p className="text-[10px] text-blue-300 dark:text-slate-500 text-center">
              {filtered.length} message{filtered.length !== 1 ? 's' : ''}
              {search && ` matching "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL  */}
      <div className={`flex-1 ${selectedId ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
        {selectedId ? (
          <MessageDetail
            messageId={selectedId}
            onBack={() => setSelectedId(null)}
            onUpdated={(updated: Message) => {
              // Sync list status without refetching
              setMessages((prev) =>
                prev.map((m) => m.id === updated.id ? { ...m, status: updated.status } : m)
              );
              // Refresh the global unread badge
              handleMessageRead();
            }}
          />
        ) : (
          /*  Placeholder  */
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center select-none">
            {/* Decorative envelope illustration */}
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-inner">
                <svg className="w-10 h-10 text-blue-200 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                    d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-[#1a4a8a] text-white text-xs font-bold rounded-full flex items-center justify-center shadow animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>

            <p className="text-base font-bold text-[#1a4a8a] dark:text-white mb-1">
              {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'Select a message'}
            </p>
            <p className="text-sm text-blue-300 dark:text-slate-500 max-w-xs">
              {unreadCount > 0
                ? 'Click on a message from the list to read it'
                : 'Choose a conversation from the left panel'}
            </p>

            <button
              id="compose-btn"
              onClick={() => setShowNewMessage(true)}
              className="mt-6 flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-150 shadow hover:shadow-md active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Compose Message
            </button>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onSent={(msg) => {
            const listItem: MessageListItem = {
              id:               msg.id,
              referenceNumber:  msg.referenceNumber,
              threadId:         msg.threadId,
              subject:          msg.subject,
              messageType:      msg.messageType,
              priority:         msg.priority,
              from:             msg.from,
              to:               msg.to,
              status:           msg.status,
              isEscalated:      msg.isEscalated,
              responseDeadline: msg.responseDeadline,
              createdAt:        msg.createdAt,
            };
            setMessages((prev) => [listItem, ...prev]);
            setShowNewMessage(false);
          }}
        />
      )}
    </div>
  );
}