import { useEffect, useState } from 'react';
import { X, Loader2, Download, AlertTriangle } from 'lucide-react';
import { reportsApi } from '../../api/reports.api';
import type {
  ReportDetail,
  PartnershipProgressData,
  ProjectCompletionData,
  CommunicationActivityData,
  BudgetUtilizationData,
  DocumentActivityData,
} from '../../types/report.types';

interface Props {
  reportId: string;
  onClose: () => void;
}

const cityLabel: Record<string, string> = {
  ADAMA: 'Adama',
  AURORA: 'Aurora',
  BOTH: 'Both Cities',
};

const reportTypeLabel: Record<string, string> = {
  PARTNERSHIP_PROGRESS: 'Partnership Progress',
  PROJECT_COMPLETION: 'Project Completion',
  COMMUNICATION_ACTIVITY: 'Communication Activity',
  BUDGET_UTILIZATION: 'Budget Utilization',
  DOCUMENT_ACTIVITY: 'Document Activity',
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-blue-50 dark:bg-slate-800 rounded-lg p-4">
      <p className="text-xs text-blue-400 dark:text-slate-400">{label}</p>
      <p className="text-lg font-bold text-[#1a4a8a] dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function ReportDetailModal({ reportId, onClose }: Props) {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await reportsApi.getById(reportId);
        setReport(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const handleDownload = async (type: 'pdf' | 'excel') => {
    setDownloading(type);
    try {
      const blob = await reportsApi.download(reportId, type);
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      triggerBlobDownload(blob, `report-${reportId}.${ext}`);
    } catch {
      setError('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const renderData = () => {
    if (!report) return null;

    switch (report.reportType) {
      case 'PARTNERSHIP_PROGRESS': {
        const data = report.data as PartnershipProgressData;
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Projects" value={data.totalProjects} />
              <StatCard label="In Progress" value={data.byStatus.inProgress} />
              <StatCard label="Completed" value={data.byStatus.completed} />
              <StatCard label="Delayed" value={data.byStatus.delayed} />
            </div>
            <ProjectTable
              rows={data.projects.map((p) => ({
                title: p.title,
                status: p.status,
                extra: `${p.progressPercent}%`,
                city: p.proposedBy,
              }))}
              extraLabel="Progress"
            />
          </>
        );
      }
      case 'PROJECT_COMPLETION': {
        const data = report.data as ProjectCompletionData;
        return (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Total Projects" value={data.totalProjects} />
              <StatCard label="Completed" value={data.totalCompleted} />
              <StatCard label="Completion Rate" value={`${data.completionRate}%`} />
            </div>
            <ProjectTable
              rows={data.projects.map((p) => ({
                title: p.title,
                status: p.status,
                extra: new Date(p.plannedEnd).toLocaleDateString(),
              }))}
              extraLabel="Planned End"
            />
          </>
        );
      }
      case 'COMMUNICATION_ACTIVITY': {
        const data = report.data as CommunicationActivityData;
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total Messages" value={data.totalMessages} />
              <StatCard label="Sent" value={data.sent} />
              <StatCard label="Received" value={data.received} />
              <StatCard label="Overdue" value={data.overdue} />
            </div>
            <StatCard label="Avg. Response Time" value={`${data.avgResponseDays} days`} />
            <BreakdownList title="By Type" breakdown={data.byType} />
          </>
        );
      }
      case 'BUDGET_UTILIZATION': {
        const data = report.data as BudgetUtilizationData;
        return (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Planned" value={`${data.totalPlanned.toLocaleString()} ETB`} />
              <StatCard label="Spent" value={`${data.totalSpent.toLocaleString()} ETB`} />
              <StatCard label="Remaining" value={`${data.remaining.toLocaleString()} ETB`} />
              <StatCard label="Utilized" value={`${data.percentageUsed}%`} />
            </div>
            {data.isOverBudget && (
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4" />
                Overall spending exceeds the planned budget.
              </div>
            )}
            <div className="border border-blue-100 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blue-100 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 text-left">
                    <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400">Project</th>
                    <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400 text-right">Planned</th>
                    <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400 text-right">Spent</th>
                    <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400 text-right">Used</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProject.map((p) => (
                    <tr key={p.projectId} className="border-b border-blue-50 dark:border-slate-800 last:border-0">
                      <td className="px-4 py-2 text-[#1a4a8a] dark:text-white">{p.projectTitle}</td>
                      <td className="px-4 py-2 text-right text-blue-500 dark:text-slate-300">
                        {p.planned.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-blue-500 dark:text-slate-300">
                        {p.spent.toLocaleString()}
                      </td>
                      <td className={`px-4 py-2 text-right font-medium ${p.isOverBudget ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        {p.percentageUsed}%
                      </td>
                    </tr>
                  ))}
                  {data.byProject.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-blue-400 dark:text-slate-400">
                        No projects with budget in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      }
      case 'DOCUMENT_ACTIVITY': {
        const data = report.data as DocumentActivityData;
        return (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard label="Total Documents" value={data.totalDocuments} />
              <StatCard label="Approved" value={data.byStatus.approved} />
              <StatCard label="Draft / Rejected" value={`${data.byStatus.draft} / ${data.byStatus.rejected}`} />
            </div>
            <BreakdownList title="By Category" breakdown={data.byCategory} />
          </>
        );
      }
      default:
        return (
          <pre className="text-xs bg-blue-50 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto text-blue-500 dark:text-slate-300">
            {JSON.stringify(report.data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
              {report ? reportTypeLabel[report.reportType] ?? report.reportType : 'Report'}
            </h2>
            {report && (
              <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
                {cityLabel[report.city] ?? report.city} · {new Date(report.dateFrom).toLocaleDateString()} –{' '}
                {new Date(report.dateTo).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 text-[#1a4a8a] animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          ) : (
            renderData()
          )}
        </div>

        {/* Footer */}
        {report && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-blue-100 dark:border-slate-700">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading === 'pdf'}
              className="flex items-center gap-2 border border-[#1a4a8a] text-[#1a4a8a] dark:text-white hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {downloading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
            <button
              onClick={() => handleDownload('excel')}
              disabled={downloading === 'excel'}
              className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {downloading === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================
// Small shared renderers
// ================================
function ProjectTable({
  rows,
  extraLabel,
}: {
  rows: Array<{ title: string; status: string; extra: string; city?: string }>;
  extraLabel: string;
}) {
  return (
    <div className="border border-blue-100 dark:border-slate-700 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-blue-100 dark:border-slate-700 bg-blue-50 dark:bg-slate-800 text-left">
            <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400">Project</th>
            <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400">Status</th>
            <th className="px-4 py-2 font-medium text-blue-400 dark:text-slate-400 text-right">{extraLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-blue-50 dark:border-slate-800 last:border-0">
              <td className="px-4 py-2 text-[#1a4a8a] dark:text-white">{row.title}</td>
              <td className="px-4 py-2 text-blue-500 dark:text-slate-300">{row.status.replace(/_/g, ' ')}</td>
              <td className="px-4 py-2 text-right text-blue-500 dark:text-slate-300">{row.extra}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-blue-400 dark:text-slate-400">
                No projects in this period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function BreakdownList({ title, breakdown }: { title: string; breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown);
  return (
    <div>
      <p className="text-sm font-medium text-[#1a4a8a] dark:text-white mb-2">{title}</p>
      {entries.length === 0 ? (
        <p className="text-sm text-blue-400 dark:text-slate-400">No data</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, value]) => (
            <span
              key={key}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-slate-300"
            >
              {key.replace(/_/g, ' ')}: <span className="font-bold">{value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
