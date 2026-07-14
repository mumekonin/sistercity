import { useEffect, useState } from 'react';
import { messagesApi } from '../../api/messages.api';
import type { MessageListItem } from '../../types/message.types';
import { useAuthStore } from '../../store/auth.store';
import MessageDetail from './MessageDetail';
import NewMessageModal from './NewMessageModal';

const tabs = [
  { id: 'received', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'unread', label: 'Unread' },
  { id: 'urgent', label: 'Urgent' },
];

const priorityConfig: Record<string, string> = {
  NORMAL:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  URGENT:   'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
};

const statusConfig: Record<string, string> = {
  SENT:      'text-blue-400',
  READ:      'text-green-500',
  REPLIED:   'text-purple-500',
  ESCALATED: 'text-red-500',
  CLOSED:    'text-gray-400',
};

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [search, setSearch] = useState('');

  const fetchMessages = async (type: string) => {
    setLoading(true);
    try {
      const data = await messagesApi.getAll(type);
      setMessages(data);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(activeTab);
  }, [activeTab]);

  const filtered = messages.filter((m) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from.name.toLowerCase().includes(search.toLowerCase()) ||
    m.referenceNumber.toLowerCase().includes(search.toLowerCase())
  );

  const isOverdue = (deadline: Date) => new Date(deadline) < new Date();

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 bg-white dark:bg-[#0f172a] rounded-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">

      {/* ================================ */}
      {/* Left panel — message list */}
      {/* ================================ */}
      <div className={`flex flex-col border-r border-blue-100 dark:border-slate-700 ${selectedId ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'}`}>

        {/* Header */}
        <div className="p-4 border-b border-blue-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
              Official Communication
            </h1>
            <button
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-1.5 bg-[#1a4a8a] hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New message
            </button>
          </div>

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
              placeholder="Search inbox..."
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 dark:placeholder-slate-500 focus:outline-none focus:border-blue-400 transition"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-100 dark:border-slate-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-white dark:border-blue-400'
                  : 'border-transparent text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
              }`}
            >
              {tab.label}
              {tab.id === 'unread' && messages.filter(m => m.status === 'SENT').length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {messages.filter(m => m.status === 'SENT').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <svg className="w-10 h-10 text-blue-200 dark:text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">No messages</p>
              <p className="text-xs text-blue-400 dark:text-slate-400 mt-1">
                {search ? 'Try different search' : `Your ${activeTab} is empty`}
              </p>
            </div>
          ) : (
            filtered.map((message) => (
              <div
                key={message.id}
                onClick={() => setSelectedId(message.id)}
                className={`p-4 border-b border-blue-50 dark:border-slate-800 cursor-pointer transition ${
                  selectedId === message.id
                    ? 'bg-blue-50 dark:bg-slate-800'
                    : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Unread dot */}
                    {message.status === 'SENT' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                    )}
                    <p className={`text-sm truncate ${
                      message.status === 'SENT'
                        ? 'font-bold text-[#1a4a8a] dark:text-white'
                        : 'font-medium text-[#1a4a8a] dark:text-slate-300'
                    }`}>
                      {message.from.name}
                    </p>
                  </div>
                  <p className="text-xs text-blue-300 dark:text-slate-500 shrink-0">
                    {new Date(message.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Subject */}
                <p className="text-sm text-[#1a4a8a] dark:text-slate-300 truncate mb-1">
                  {message.subject}
                </p>

                {/* Bottom row */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityConfig[message.priority]}`}>
                    {message.priority}
                  </span>
                  {message.isEscalated && (
                    <span className="text-xs text-red-500 font-medium">⚠ Escalated</span>
                  )}
                  {isOverdue(message.responseDeadline) && message.status === 'SENT' && (
                    <span className="text-xs text-red-400">Overdue</span>
                  )}
                  <span className={`text-xs ml-auto ${statusConfig[message.status]}`}>
                    {message.status}
                  </span>
                </div>

                {/* Ref number */}
                <p className="text-xs text-blue-300 dark:text-slate-600 mt-1">
                  {message.referenceNumber}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================================ */}
      {/* Right panel — message detail */}
      {/* ================================ */}
      <div className={`flex-1 ${selectedId ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
        {selectedId ? (
          <MessageDetail
            messageId={selectedId}
            onBack={() => setSelectedId(null)}
            onUpdated={(updated) => {
              setMessages((prev) =>
                prev.map((m) => m.id === updated.id ? { ...m, status: updated.status } : m)
              );
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-200 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-[#1a4a8a] dark:text-white font-semibold">
              Select a message
            </p>
            <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
              Choose a message from the list to read it
            </p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="mt-4 flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send new message
            </button>
          </div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessage && (
        <NewMessageModal
          onClose={() => setShowNewMessage(false)}
          onSent={(msg) => {
            setMessages((prev) => [msg as any, ...prev]);
            setShowNewMessage(false);
          }}
        />
      )}
    </div>
  );
}