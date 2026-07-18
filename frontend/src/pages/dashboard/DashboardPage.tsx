import React, { useState, useEffect } from 'react';
import type { DashboardStats } from '../../types/notification.types';
import { notificationsApi } from '../../api/notifications.api';
import { useAuthStore } from '../../store/auth.store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Activity, CheckCircle, Clock, AlertTriangle,
  Mail, Calendar, Bell, FolderKanban,
  Shield, RefreshCw, MapPin, Building2,
  TrendingUp, ChevronRight,
} from 'lucide-react';

// ── Color palette ────────────────────────────────────────────────────────────
const ACCENT = {
  navy:    '#1a4a8a',
  emerald: '#059669',
  amber:   '#d97706',
  red:     '#dc2626',
  violet:  '#7c3aed',
  teal:    '#0891b2',
  fuchsia: '#a21caf',
};

const PIE_COLORS = [ACCENT.navy, ACCENT.emerald, ACCENT.amber, ACCENT.red, ACCENT.violet];

// ── Role label map ────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:  'Super Administrator',
  CITY_ADMIN:   'City Administrator',
  DEPT_OFFICER: 'Department Officer',
};

// ── Live clock hook ───────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

const StatCard = ({ title, value, icon: Icon, color, subtitle }: StatCardProps) => (
  <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
    {/* Accent bar */}
    <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ backgroundColor: color }} />

    {/* Subtle gradient background */}
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      style={{ background: `linear-gradient(135deg, ${color}08 0%, transparent 70%)` }}
    />

    <div className="relative flex items-start gap-4 px-5 py-5">
      {/* Icon */}
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 truncate">
          {title}
        </p>
        <p className="mt-1 text-3xl font-extrabold text-gray-800 dark:text-white leading-none tabular-nums">
          {value ?? 0}
        </p>
        {subtitle && (
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        )}
      </div>

      {/* Trend arrow decoration */}
      <TrendingUp className="h-4 w-4 text-gray-200 shrink-0 mt-1" />
    </div>
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ title, sub, icon: Icon }: { title: string; sub: string; icon: React.ElementType }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a4a8a]/10">
      <Icon className="h-4 w-4 text-[#1a4a8a]" />
    </div>
    <div>
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">{title}</h3>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  </div>
);

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-gray-500">
          <span className="font-bold" style={{ color: p.color }}>{p.value}</span> {p.name}
        </p>
      ))}
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────
function DashboardPage() {
  const { user } = useAuthStore();
  const now = useClock();

  const [stats, setStats]       = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchStats = async (mounted = true) => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getDashboard();
      if (mounted) {
        setStats(data);
        setError(null);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      if (mounted) setError(err);
    } finally {
      if (mounted) setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchStats(mounted);
    return () => { mounted = false; };
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-4 border-[#1a4a8a]/20" />
            <div className="absolute inset-0 h-14 w-14 animate-spin rounded-full border-4 border-transparent border-t-[#1a4a8a]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Loading Dashboard</p>
            <p className="text-xs text-gray-400 mt-1">Fetching secure government data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center p-6">
        <div className="rounded-2xl bg-red-50 border border-red-100 p-8 text-center shadow-sm max-w-md w-full">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-red-800">Dashboard Unavailable</h3>
          <p className="mt-2 text-sm text-red-600 leading-relaxed">
            Unable to load dashboard data. Please check your connection or contact your system administrator.
          </p>
          <button
            onClick={() => fetchStats()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Role flags ─────────────────────────────────────────────────────────────
  const role          = stats?.role || user?.role || '';
  const isSuperAdmin  = role === 'SUPER_ADMIN';
  const isCityAdmin   = role === 'CITY_ADMIN';
  const isDeptOfficer = role === 'DEPT_OFFICER';
  const roleLabel     = ROLE_LABELS[role] ?? role.replace(/_/g, ' ');
  const cityName      = stats?.city    || user?.city    || '';
  const deptName      = stats?.department || user?.department || '';

  // ── Chart data ─────────────────────────────────────────────────────────────
  const projectPieData = isSuperAdmin
    ? [
        { name: 'Active',    value: stats?.activeProjects    ?? 0 },
        { name: 'Completed', value: stats?.completedProjects ?? 0 },
      ]
    : isCityAdmin
    ? [
        { name: 'Active',  value: stats?.activeProjects  ?? 0 },
        { name: 'Pending', value: stats?.pendingProjects ?? 0 },
      ]
    : isDeptOfficer
    ? [
        { name: 'Active',    value: stats?.activeProjects ?? 0 },
        { name: 'My Tasks',  value: stats?.myTasks        ?? 0 },
      ]
    : [];

  const activityBarData = [
    { name: 'Unread Msgs',  count: stats?.unreadMessages      ?? 0, fill: ACCENT.navy    },
    { name: 'Urgent Msgs',  count: stats?.urgentMessages      ?? 0, fill: ACCENT.red     },
    { name: 'Events',       count: stats?.upcomingEvents      ?? 0, fill: ACCENT.teal    },
    { name: 'Alerts',       count: stats?.unreadNotifications ?? 0, fill: ACCENT.violet  },
  ];

  // ── Time/date strings ──────────────────────────────────────────────────────
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const refreshedStr = lastRefreshed
    ? `Last updated ${lastRefreshed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] transition-colors space-y-5 p-4 md:p-6">

      {/* ═══════════════════════════════════════════════════════════════════
          GOVERNMENT BANNER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl shadow-lg">
        {/* Top accent strip */}
        <div className="h-1.5 bg-[#1a4a8a]" />

        {/* Main banner */}
        <div
          className="relative overflow-hidden px-6 py-5"
          style={{
            background: 'linear-gradient(135deg, #071d40 0%, #0d2d5c 40%, #1a4a8a 80%, #1e5fad 100%)',
          }}
        >
          {/* Decorative rings */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute -right-8  -top-8  h-48 w-48 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute right-40  bottom-0 h-32 w-32 rounded-full border border-white/5" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            {/* LEFT — Seal + identity */}
            <div className="flex items-center gap-4">
              {/* Government seal placeholder */}
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-300">
                  Federal Democratic Republic of Ethiopia
                </p>
                <h1 className="mt-0.5 text-xl font-extrabold leading-tight text-white">
                  Sister City Partnership Portal
                </h1>
                <p className="mt-0.5 text-xs text-blue-200 font-medium">
                  Adama–Aurora Municipal Cooperation
                </p>

                {/* Badges row */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
                    <Shield className="h-3 w-3" />
                    {roleLabel}
                  </span>
                  {cityName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
                      <MapPin className="h-3 w-3" />
                      {cityName}
                    </span>
                  )}
                  {deptName && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur-sm">
                      <Building2 className="h-3 w-3" />
                      {deptName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT — Clock */}
            <div className="shrink-0 text-right">
              <p className="font-mono text-4xl font-extrabold tabular-nums text-white tracking-tight">
                {timeStr}
              </p>
              <p className="mt-1 text-xs text-blue-200">{dateStr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          WELCOME BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white dark:bg-slate-800 px-6 py-4 shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div>
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">
            Welcome back,{' '}
            <span style={{ color: ACCENT.navy }}>{user?.fullName ?? 'Officer'}</span>
          </h2>
          <p className="mt-0.5 text-sm text-gray-400">
            {user?.jobTitle && <>{user.jobTitle} · </>}Real-time overview of your workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          {refreshedStr && (
            <p className="text-xs text-gray-400 hidden sm:block">{refreshedStr}</p>
          )}
          <button
            onClick={() => fetchStats()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 active:scale-95 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          KPI STAT CARDS
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* SUPER_ADMIN only */}
        {isSuperAdmin && (
          <StatCard
            title="Total Projects"
            value={stats?.totalProjects}
            icon={FolderKanban}
            color={ACCENT.navy}
            subtitle="All registered projects"
          />
        )}
        {/* All roles */}
        {(isSuperAdmin || isCityAdmin || isDeptOfficer) && (
          <StatCard
            title="Active Projects"
            value={stats?.activeProjects}
            icon={Activity}
            color={ACCENT.emerald}
            subtitle="Currently in progress"
          />
        )}
        {/* SUPER_ADMIN only */}
        {isSuperAdmin && (
          <StatCard
            title="Completed"
            value={stats?.completedProjects}
            icon={CheckCircle}
            color={ACCENT.violet}
            subtitle="Successfully delivered"
          />
        )}
        {/* CITY_ADMIN only */}
        {isCityAdmin && (
          <StatCard
            title="Pending Approval"
            value={stats?.pendingProjects}
            icon={Clock}
            color={ACCENT.amber}
            subtitle="Awaiting review"
          />
        )}
        {/* DEPT_OFFICER only */}
        {isDeptOfficer && (
          <StatCard
            title="My Pending Tasks"
            value={stats?.myTasks}
            icon={CheckCircle}
            color={ACCENT.violet}
            subtitle="Assigned to you"
          />
        )}
        {/* All roles */}
        <StatCard
          title="Upcoming Events"
          value={stats?.upcomingEvents}
          icon={Calendar}
          color={ACCENT.teal}
          subtitle="Scheduled events"
        />
        {/* SUPER_ADMIN + CITY_ADMIN */}
        {(isSuperAdmin || isCityAdmin) && (
          <StatCard
            title="Urgent Messages"
            value={stats?.urgentMessages}
            icon={AlertTriangle}
            color={ACCENT.red}
            subtitle="Requires immediate action"
          />
        )}
        {/* CITY_ADMIN + DEPT_OFFICER */}
        {(isCityAdmin || isDeptOfficer) && (
          <StatCard
            title="Unread Messages"
            value={stats?.unreadMessages}
            icon={Mail}
            color={ACCENT.navy}
            subtitle="In your inbox"
          />
        )}
        {/* All roles */}
        <StatCard
          title="Unread Notifications"
          value={stats?.unreadNotifications}
          icon={Bell}
          color={ACCENT.fuchsia}
          subtitle="New system alerts"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CHARTS ROW
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

        {/* Project breakdown — pie — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
          <SectionHeader
            title="Project Overview"
            sub="Distribution by status"
            icon={FolderKanban}
          />
          <div className="h-[260px]">
            {projectPieData.length > 0 && projectPieData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {projectPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={32}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12, color: '#6b7280' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-300">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                  <FolderKanban className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium text-gray-400">No project data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Activity bar — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-gray-100 dark:border-slate-700 p-6 transition-colors">
          <SectionHeader
            title="Activity Overview"
            sub="Messages, events and alerts"
            icon={Activity}
          />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activityBarData}
                barSize={44}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  {activityBarData.map((d, i) => (
                    <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={d.fill} stopOpacity={0.9} />
                      <stop offset="100%" stopColor={d.fill} stopOpacity={0.45} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {activityBarData.map((_, i) => (
                    <Cell key={i} fill={`url(#grad${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK LINKS PANEL
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'View Projects',      sub: 'Browse all city projects',     href: '/projects',      color: ACCENT.navy,    icon: FolderKanban },
          { label: 'Manage Events',      sub: 'Upcoming city events',         href: '/events',        color: ACCENT.teal,    icon: Calendar     },
          { label: 'Check Messages',     sub: 'Inbox & communications',       href: '/messages',      color: ACCENT.emerald, icon: Mail         },
          { label: 'View Notifications', sub: 'System alerts & updates',      href: '/notifications', color: ACCENT.violet,  icon: Bell         },
        ].map(({ label, sub, href, color, icon: Icon }) => (
          <a
            key={label}
            href={href}
            className="group flex items-center gap-4 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-5 py-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-200 truncate">{label}</p>
              <p className="text-xs text-gray-400 truncate">{sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECURITY FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-2xl">
        {/* Bottom tricolour strip */}
        <div className="rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 shadow-sm transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-medium">All systems operational</span>
            </div>
            <span className="font-medium text-gray-500">
              Adama–Aurora Sister City Portal · Government of Ethiopia · {new Date().getFullYear()}
            </span>
            <span>🔒 Restricted access — All activity is logged and monitored</span>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Error Boundary ─────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 p-8">
          <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-lg text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <h1 className="text-xl font-bold text-red-800">Dashboard Error</h1>
            <pre className="mt-4 whitespace-pre-wrap text-left text-xs text-red-600 bg-red-50 p-4 rounded-lg overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DashboardPageWrapper() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}
