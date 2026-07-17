import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  Wallet,
  FileText,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { reportsApi } from '../../api/reports.api';
import type { ReportListItem, ReportType } from '../../types/report.types';
import { useAuthStore } from '../../store/auth.store';
import GenerateReportModal from './GenerateReportModal';
import ReportDetailModal from './ReportDetailModal';

const reportTypeConfig: Record<ReportType, { label: string; Icon: typeof BarChart3; className: string }> = {
  PARTNERSHIP_PROGRESS: {
    label: 'Partnership Progress',
    Icon: TrendingUp,
    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  },
  PROJECT_COMPLETION: {
    label: 'Project Completion',
    Icon: BarChart3,
    className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  },
  COMMUNICATION_ACTIVITY: {
    label: 'Communication Activity',
    Icon: MessageSquare,
    className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  },
  BUDGET_UTILIZATION: {
    label: 'Budget Utilization',
    Icon: Wallet,
    className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  },
  DOCUMENT_ACTIVITY: {
    label: 'Document Activity',
    Icon: FileText,
    className: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
  },
};

const cityLabel: Record<string, string> = {
  ADAMA: 'Adama',
  AURORA: 'Aurora',
  BOTH: 'Both Cities',
};

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

export default function ReportsPage() {
  const { user } = useAuthStore();
  const canAccess = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportsApi.getAll();
      setReports(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchReports();
    else setLoading(false);
  }, [canAccess]);

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDownload = async (report: ReportListItem, type: 'pdf' | 'excel') => {
    setDownloadingId(`${report.id}-${type}`);
    try {
      const blob = await reportsApi.download(report.id, type);
      const ext = type === 'excel' ? 'xlsx' : 'pdf';
      triggerBlobDownload(blob, `report-${report.id}.${ext}`);
    } catch {
      setError('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" />
        <p className="text-[#1a4a8a] dark:text-white font-medium">Access restricted</p>
        <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
          Only City Admins and Super Admins can view and generate reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">Reports</h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            Generate and review partnership analytics for Adama–Aurora.
          </p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-[#1a4a8a] animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center py-16 text-center">
          <BarChart3 className="w-12 h-12 text-blue-200 dark:text-slate-700 mb-4" />
          <p className="text-[#1a4a8a] dark:text-white font-medium">No reports yet</p>
          <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
            Generate your first report to see it here.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-blue-100 dark:border-slate-700 text-left">
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Type</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">City</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Period</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400">Generated</th>
                  <th className="px-5 py-3 font-medium text-blue-400 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const config = reportTypeConfig[report.reportType];
                  const Icon = config?.Icon ?? FileText;
                  return (
                    <tr
                      key={report.id}
                      className="border-b border-blue-50 dark:border-slate-800 last:border-0 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${config?.className ?? 'bg-blue-100 text-blue-600'}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="font-medium text-[#1a4a8a] dark:text-white">
                            {config?.label ?? report.reportType}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-blue-500 dark:text-slate-300">
                        {cityLabel[report.city] ?? report.city}
                      </td>
                      <td className="px-5 py-3.5 text-blue-500 dark:text-slate-300 whitespace-nowrap">
                        {formatDate(report.dateFrom)} – {formatDate(report.dateTo)}
                      </td>
                      <td className="px-5 py-3.5 text-blue-400 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(report.generatedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedId(report.id)}
                            title="View report"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(report, 'pdf')}
                            disabled={downloadingId === `${report.id}-pdf`}
                            title="Download PDF"
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
                          >
                            {downloadingId === `${report.id}-pdf` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownload(report, 'excel')}
                            disabled={downloadingId === `${report.id}-excel`}
                            title="Download Excel"
                            className="px-2 h-8 flex items-center justify-center rounded-lg text-xs font-semibold text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:text-green-400 transition disabled:opacity-40"
                          >
                            {downloadingId === `${report.id}-excel` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'XLS'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerate && (
        <GenerateReportModal
          onClose={() => setShowGenerate(false)}
          onGenerated={(id) => {
            setShowGenerate(false);
            fetchReports();
            setSelectedId(id);
          }}
        />
      )}

      {/* Detail Modal */}
      {selectedId && (
        <ReportDetailModal reportId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
