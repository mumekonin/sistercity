import { useEffect, useState } from 'react';
import { LayoutList,Wallet,PiggyBank,FolderOpen,TrendingUp,Plus,AlertTriangle,Wrench,Receipt,Link2,CheckCircle2,XCircle, Clock, Loader2} from 'lucide-react';
import { budgetApi, equipmentApi } from '../../api/budget.api';
import type { BudgetSummary, Budget, Equipment } from '../../types/budget.types';
import { EquipmentStatus } from '../../types/budget.types';
import { useAuthStore } from '../../store/auth.store';
import RecordExpenditureModal from './RecordExpenditureModal';
import AddEquipmentModal from './AddEquipmentModal';

export default function BudgetPage() {
  const { user } = useAuthStore();
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'budget' | 'equipment'>('budget');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showRecordExpenditure, setShowRecordExpenditure] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);

  const fetchSummary = async () => {
    try {
      const data = await budgetApi.getSummary();
      setSummaries(data);
    } catch {
      setError('Failed to load budget summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    if (!selectedProjectId) return;
    setEquipmentLoading(true);
    try {
      const data = await equipmentApi.getByProject(selectedProjectId);
      setEquipment(data);
    } catch {
      setEquipment([]);
    } finally {
      setEquipmentLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (activeTab === 'equipment' && selectedProjectId) {
      fetchEquipment();
    }
  }, [activeTab, selectedProjectId]);

  const formatCurrency = (amount: number) =>
    `${amount.toLocaleString()} ETB`;

  const totalPlanned = summaries.reduce((sum, s) => sum + s.plannedTotal, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spentTotal, 0);
  const totalRemaining = summaries.reduce((sum, s) => sum + s.remainingTotal, 0);
  const overallPercentage = totalPlanned > 0
    ? Math.max(0, Math.round((totalSpent / totalPlanned) * 100))
    : totalSpent > 0 ? 100 : 0;

  const equipmentStatusConfig: Record<string, { label: string; className: string }> = {
    AVAILABLE: { label: 'Available', className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
    IN_USE:    { label: 'In Use',    className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
    DAMAGED:   { label: 'Damaged',   className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    RETURNED:  { label: 'Returned',  className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#1a4a8a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
            Budget &amp; Equipment
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            Joint financial commitments and physical asset inventory.
          </p>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'CITY_ADMIN' || user?.role === 'DEPT_OFFICER') && selectedProjectId && (
            <button
              onClick={() => setShowRecordExpenditure(true)}
              className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Record Expenditure
            </button>
          )}
          {user?.role === 'CITY_ADMIN' && selectedProjectId && activeTab === 'equipment' && (
            <button
              onClick={() => setShowAddEquipment(true)}
              className="flex items-center gap-2 border border-[#1a4a8a] text-[#1a4a8a] dark:text-white hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Planned',
            value: formatCurrency(totalPlanned),
            Icon: LayoutList,
            sub: 'FY 2025–2026',
          },
          {
            label: 'Total Spent',
            value: formatCurrency(totalSpent),
            Icon: Wallet,
            sub: `${overallPercentage}% utilized`,
          },
          {
            label: 'Remaining',
            value: formatCurrency(totalRemaining),
            Icon: PiggyBank,
            sub: `${100 - overallPercentage}% available`,
          },
          {
            label: 'Projects',
            value: summaries.length.toString(),
            Icon: FolderOpen,
            sub: `${summaries.filter(s => s.isOverBudget).length} over budget`,
          },
        ].map((kpi) => (
          <div key={kpi.label}
            className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-400 dark:text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </span>
              <kpi.Icon className="w-5 h-5 text-[#1a4a8a] dark:text-blue-400" />
            </div>
            <p className="text-lg font-bold text-[#1a4a8a] dark:text-white leading-tight">
              {kpi.value}
            </p>
            <p className="text-xs text-blue-400 dark:text-slate-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1a4a8a] dark:text-blue-400" />
            <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
              Overall Budget Utilization
            </p>
          </div>
          <p className="text-sm font-bold text-[#1a4a8a] dark:text-white">
            {overallPercentage}%
          </p>
        </div>
        <div className="w-full bg-blue-100 dark:bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              overallPercentage > 90 ? 'bg-red-500' :
              overallPercentage > 70 ? 'bg-orange-400' : 'bg-[#1a4a8a]'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-blue-400 dark:text-slate-400">
          <span>Spent: {formatCurrency(totalSpent)}</span>
          <span>Planned: {formatCurrency(totalPlanned)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Budget by project list */}
        <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-blue-100 dark:border-slate-700">
            <h2 className="text-sm font-bold text-[#1a4a8a] dark:text-white">
              Budget by Project
            </h2>
          </div>
          <div className="divide-y divide-blue-50 dark:divide-slate-800">
            {summaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <FolderOpen className="w-8 h-8 text-blue-200 dark:text-slate-600" />
                <p className="text-sm text-blue-400 dark:text-slate-400">
                  No projects found
                </p>
              </div>
            ) : (
              summaries.map((summary) => (
                <div
                  key={summary.projectId}
                  onClick={() => setSelectedProjectId(summary.projectId)}
                  className={`p-4 cursor-pointer transition ${
                    selectedProjectId === summary.projectId
                      ? 'bg-blue-50 dark:bg-slate-800'
                      : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-[#1a4a8a] dark:text-white truncate flex-1">
                      {summary.projectTitle}
                    </p>
                    {summary.isOverBudget && (
                      <div className="flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs text-red-500 font-medium">
                          Over budget
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                    <div
                      className={`h-1.5 rounded-full ${
                        summary.isOverBudget ? 'bg-red-500' :
                        summary.percentageUsed > 70 ? 'bg-orange-400' : 'bg-[#1a4a8a]'
                      }`}
                      style={{ width: `${Math.min(summary.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-blue-400 dark:text-slate-400">
                    <span>{summary.percentageUsed}% used</span>
                    <span>{formatCurrency(summary.plannedTotal)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="lg:col-span-2">
          {!selectedProjectId ? (
            <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 flex flex-col items-center justify-center h-full min-h-64 text-center p-8">
              <Wallet className="w-10 h-10 text-blue-200 dark:text-slate-600 mb-4" />
              <p className="text-[#1a4a8a] dark:text-white font-semibold">
                Select a project
              </p>
              <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
                Choose a project to view budget details and equipment
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">

              {/* Tabs */}
              <div className="flex border-b border-blue-100 dark:border-slate-700">
                {[
                  { id: 'budget', label: 'Budget & Expenditures', Icon: Wallet },
                  { id: 'equipment', label: 'Equipment', Icon: Wrench },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-white dark:border-blue-400'
                        : 'border-transparent text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
                    }`}
                  >
                    <tab.Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Budget tab */}
              {activeTab === 'budget' && (
                <BudgetDetail
                  projectId={selectedProjectId}
                  onExpenditureUpdated={fetchSummary}
                />
              )}

              {/* Equipment tab */}
              {activeTab === 'equipment' && (
                <div className="p-4">
                  {equipmentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#1a4a8a] animate-spin" />
                    </div>
                  ) : equipment.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
                      <Wrench className="w-8 h-8 text-blue-200 dark:text-slate-600" />
                      <p className="text-sm text-blue-400 dark:text-slate-400">
                        No equipment recorded
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {equipment.map((item) => (
                        <EquipmentCard
                          key={item.id}
                          item={item}
                          statusConfig={equipmentStatusConfig}
                          formatCurrency={formatCurrency}
                          onUpdated={fetchEquipment}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRecordExpenditure && selectedProjectId && (
        <RecordExpenditureModal
          projectId={selectedProjectId}
          onClose={() => setShowRecordExpenditure(false)}
          onRecorded={() => {
            setShowRecordExpenditure(false);
            fetchSummary();
          }}
        />
      )}

      {showAddEquipment && selectedProjectId && (
        <AddEquipmentModal
          projectId={selectedProjectId}
          onClose={() => setShowAddEquipment(false)}
          onAdded={() => {
            setShowAddEquipment(false);
            fetchEquipment();
          }}
        />
      )}
    </div>
  );
}

// ================================
// Budget Detail Component
// ================================
function BudgetDetail({
  projectId,
  onExpenditureUpdated,
}: {
  projectId: string;
  onExpenditureUpdated: () => void;
}) {
  const { user } = useAuthStore();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await budgetApi.getByProject(projectId);
        setBudget(data);
      } catch {
        setBudget(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

  const handleAction = async (
    eid: string,
    action: 'approve' | 'reject',
    reason?: string,
  ) => {
    if (!budget) return;
    setActionLoading(eid);
    try {
      const updated = await budgetApi.updateExpenditure(projectId, eid, {
        action,
        rejectionReason: reason,
      });
      setBudget(updated);
      onExpenditureUpdated();
      setRejectId(null);
      setRejectionReason('');
    } finally {
      setActionLoading(null);
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString()} ETB`;

  const statusConfig: Record<string, { label: string; className: string; Icon: any }> = {
    PENDING:  { label: 'Pending',  className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-300', Icon: Clock },
    APPROVED: { label: 'Approved', className: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',   Icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400',           Icon: XCircle },
  };

  const canApprove = user?.role === 'CITY_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#1a4a8a] animate-spin" />
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <Wallet className="w-8 h-8 text-blue-200 dark:text-slate-600" />
        <p className="text-sm text-blue-400 dark:text-slate-400">
          No budget data found for this project
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">

      {/* Budget breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: 'Planned (Adama)', value: budget.plannedAdama, city: 'ADAMA' },
          { label: 'Planned (Aurora)', value: budget.plannedAurora, city: 'AURORA' },
          { label: 'Spent (Adama)', value: budget.spentAdama, city: 'ADAMA' },
          { label: 'Spent (Aurora)', value: budget.spentAurora, city: 'AURORA' },
          { label: 'Remaining (Adama)', value: budget.remainingAdama, city: 'ADAMA' },
          { label: 'Remaining (Aurora)', value: budget.remainingAurora, city: 'AURORA' },
        ].map((item) => (
          <div key={item.label}
            className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-blue-400 dark:text-slate-400">{item.label}</p>
            <p className="text-sm font-bold text-[#1a4a8a] dark:text-white mt-0.5">
              {formatCurrency(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Total progress */}
      <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
        <div className="flex justify-between text-sm font-medium text-[#1a4a8a] dark:text-white mb-2">
          <span>Total Progress</span>
          <span>
            {budget.plannedTotal > 0
              ? Math.round((budget.spentTotal / budget.plannedTotal) * 100)
              : 0}%
          </span>
        </div>
        <div className="w-full bg-blue-200 dark:bg-slate-600 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-[#1a4a8a] transition-all duration-500"
            style={{
              width: `${budget.plannedTotal > 0
                ? Math.min((budget.spentTotal / budget.plannedTotal) * 100, 100)
                : 0}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-blue-400 dark:text-slate-400 mt-1">
          <span>Spent: {formatCurrency(budget.spentTotal)}</span>
          <span>Planned: {formatCurrency(budget.plannedTotal)}</span>
        </div>
      </div>

      {/* Expenditures */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-[#1a4a8a] dark:text-blue-400" />
          <h3 className="text-sm font-bold text-[#1a4a8a] dark:text-white">
            Expenditures ({budget.expenditures.length})
          </h3>
        </div>
        {budget.expenditures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Receipt className="w-7 h-7 text-blue-200 dark:text-slate-600" />
            <p className="text-sm text-blue-400 dark:text-slate-400 text-center">
              No expenditures recorded
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {budget.expenditures.map((exp) => {
              const sc = statusConfig[exp.status] ?? statusConfig.PENDING;
              return (
                <div key={exp.id}
                  className="border border-blue-100 dark:border-slate-700 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a4a8a] dark:text-white truncate">
                        {exp.description}
                      </p>
                      <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                        {exp.category} · {exp.city} · {new Date(exp.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#1a4a8a] dark:text-white">
                        {formatCurrency(exp.amount)}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.className}`}>
                        <sc.Icon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>
                  </div>

                  {/* Receipt link */}
                  {exp.receiptUrl && (
                    <a href={exp.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition mb-2"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      View Receipt
                    </a>
                  )}

                  {/* Rejection reason */}
                  {exp.rejectionReason && (
                    <div className="flex items-start gap-1.5 mb-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-red-400">
                        {exp.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Approve/Reject actions */}
                  {canApprove && exp.status === 'PENDING' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(exp.id, 'approve')}
                          disabled={actionLoading === exp.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs font-medium py-1.5 rounded-lg transition"
                        >
                          {actionLoading === exp.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />
                          }
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(exp.id)}
                          disabled={actionLoading === exp.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs font-medium py-1.5 rounded-lg transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>

                      {/* Rejection form */}
                      {rejectId === exp.id && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full bg-blue-50 dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 text-xs text-[#1a4a8a] dark:text-white focus:outline-none focus:border-red-400 transition"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(exp.id, 'reject', rejectionReason)}
                              disabled={!rejectionReason.trim() || actionLoading === exp.id}
                              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs py-1.5 rounded-lg transition"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => { setRejectId(null); setRejectionReason(''); }}
                              className="px-3 text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================
// Equipment Card Component
// ================================
function EquipmentCard({
  item,
  statusConfig,
  formatCurrency,
  onUpdated,
}: {
  item: Equipment;
  statusConfig: Record<string, { label: string; className: string }>;
  formatCurrency: (n: number) => string;
  onUpdated: () => void;
}) {
  const { user } = useAuthStore();
  const [showUpdate, setShowUpdate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    status: item.status,
    damagedNote: item.damagedNote ?? '',
    returnedDate: '',
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await equipmentApi.update(item.id, {
        status: form.status,
        damagedNote: form.damagedNote || undefined,
        returnedDate: form.returnedDate ? new Date(form.returnedDate) : undefined,
      });
      onUpdated();
      setShowUpdate(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-blue-100 dark:border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <Wrench className="w-4 h-4 text-[#1a4a8a] dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
              {item.itemName}
            </p>
            <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
              {item.description}
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusConfig[item.status]?.className}`}>
          {statusConfig[item.status]?.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Provided by', value: item.providedBy },
          { label: 'Quantity',    value: item.quantity.toString() },
          { label: 'Value',       value: formatCurrency(item.estimatedValue) },
          { label: 'Date',        value: new Date(item.providedDate).toLocaleDateString() },
        ].map((stat) => (
          <div key={stat.label} className="bg-blue-50 dark:bg-slate-800 rounded-lg p-2">
            <p className="text-xs text-blue-400 dark:text-slate-400">{stat.label}</p>
            <p className="text-xs font-medium text-[#1a4a8a] dark:text-white mt-0.5 truncate">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {item.damagedNote && (
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{item.damagedNote}</p>
        </div>
      )}

      {user?.role === 'CITY_ADMIN' && (
        <>
          {!showUpdate ? (
            <button
              onClick={() => setShowUpdate(true)}
              className="text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition font-medium"
            >
              Update Status →
            </button>
          ) : (
            <div className="space-y-2 mt-2 pt-2 border-t border-blue-50 dark:border-slate-800">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
              >
                {Object.values(EquipmentStatus).map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>

              {form.status === 'DAMAGED' && (
                <input
                  type="text"
                  value={form.damagedNote}
                  onChange={(e) => setForm({ ...form, damagedNote: e.target.value })}
                  placeholder="Damage description..."
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              )}

              {form.status === 'RETURNED' && (
                <input
                  type="date"
                  value={form.returnedDate}
                  onChange={(e) => setForm({ ...form, returnedDate: e.target.value })}
                  className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleUpdate}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs py-1.5 rounded-lg transition"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setShowUpdate(false)}
                  className="px-3 text-xs text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}