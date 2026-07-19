import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/Projects.api';
import type { Project, Milestone, Task, Issue, MilestoneStatus, TaskStatus, IssueStatus, IssueSeverity, TaskPriority, Responsible } from '../../types/projects.types';
import { useAuthStore } from '../../store/auth.store';
import { Department } from '../../types/enums';

//  Helpers 

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'MEDIUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'LOW': return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'PROPOSED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'APPROVED': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'PLANNED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'IN_PROGRESS': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'DELAYED': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'COMPLETED': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    // milestone / task / issue statuses
    case 'NOT_STARTED': return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
    case 'DONE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'TODO': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'OPEN': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'RESOLVED': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'MAJOR': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'MINOR': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Tab type 
type Tab = 'overview' | 'milestones' | 'tasks' | 'issues';

// Main Page 
export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // action modal states
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showStatusUpdate, setShowStatus] = useState(false);
  const [showAddMilestone, setShowAddMS] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddIssue, setShowAddIssue] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editIssue, setEditIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getById(id!);
      setProject(data);
    } catch {
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const refresh = (updated: Project) => setProject(updated);

  //Loading / Error 
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4">
        {error || 'Project not found'}
      </div>
    );
  }

  const isAdmin = user?.role === 'CITY_ADMIN';
  const isOfficer = user?.role === 'DEPT_OFFICER';

  // Receiving city (can approve/reject)
  const isReceivingCity = isAdmin && user?.city !== project.proposedBy;
  // Proposing city admin
  const isProposingCity = isAdmin && user?.city === project.proposedBy;
  // Involved city admin
  const isInvolved = isAdmin && (
    project.proposedBy === user?.city ||
    (user?.city === 'ADAMA' && project.adama !== null) ||
    (user?.city === 'AURORA' && project.aurora !== null)
  );

  const canApproveReject = isReceivingCity && project.status === 'PROPOSED';
  const canDelete = isProposingCity && project.status === 'PROPOSED';
  const canAssign = isAdmin && project.status === 'APPROVED' && (
    (user?.city === 'ADAMA' && !project.adama) ||
    (user?.city === 'AURORA' && !project.aurora)
  );
  // canPlan: backend blocks if city already submitted budget (tracked via adamaPlanned/auroraPlanned).
  // Since those flags aren't in the response, we proxy via budgetAdama/budgetAurora > 0.
  const adamaAlreadyPlanned = project.budgetAdama > 0;
  const auroraAlreadyPlanned = project.budgetAurora > 0;
  const canPlan = isAdmin && project.status === 'PLANNED' && (
    (user?.city === 'ADAMA' && !adamaAlreadyPlanned) ||
    (user?.city === 'AURORA' && !auroraAlreadyPlanned)
  );
  const canUpdateStatus = isAdmin && ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'DELAYED'].includes(project.status);
  // addMilestone is @Roles(CITY_ADMIN) on backend — officers not allowed
  const canAddMilestone = isAdmin && isInvolved && ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'DELAYED'].includes(project.status);
  const canAddTask = isInvolved && ['IN_PROGRESS', 'ON_HOLD', 'DELAYED'].includes(project.status);
  const canAddIssue = (isInvolved || isOfficer) && ['IN_PROGRESS', 'ON_HOLD', 'DELAYED'].includes(project.status);
  const canComplete = isAdmin && project.status === 'IN_PROGRESS' && !project.completedBy.includes(user?.city ?? '');

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'milestones', label: 'Milestones', count: project.milestones.length },
    { key: 'tasks', label: 'Tasks', count: project.tasks.length },
    { key: 'issues', label: 'Issues', count: project.issues.length },
  ];

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Back button */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm text-blue-400 hover:text-[#1a4a8a] dark:hover:text-blue-300 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Projects
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-[#1a4a8a] p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPriorityStyle(project.priority)}`}>
                  {project.priority}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                  {project.proposedBy}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{project.title}</h1>
              <p className="text-blue-200 text-sm mt-1 line-clamp-2">{project.description}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 shrink-0">
              {canApproveReject && (
                <>
                  <button
                    onClick={() => setShowApprove(true)}
                    className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Reject
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDelete(true)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition"
                >
                  Delete Proposal
                </button>
              )}
              {canAssign && (
                <button
                  onClick={() => setShowAssign(true)}
                  className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Assign Dept
                </button>
              )}
              {canPlan && (
                <button
                  onClick={() => setShowPlan(true)}
                  className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Set Budget
                </button>
              )}
              {canUpdateStatus && (
                <button
                  onClick={() => setShowStatus(true)}
                  className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition"
                >
                  Update Status
                </button>
              )}
              {canComplete && (
                <button
                  onClick={() => setShowStatus(true)}
                  className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-blue-200">Overall Progress</span>
              <span className="text-xs font-bold text-white">{project.progressPercent}%</span>
            </div>
            <div className="bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${project.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700">
        <div className="flex border-b border-blue-100 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab.key
                  ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-blue-400 dark:text-slate-400 hover:text-[#1a4a8a] dark:hover:text-white'
                }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="bg-blue-100 dark:bg-slate-700 text-[#1a4a8a] dark:text-slate-300 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">

          {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Key details */}
                {[
                  { label: 'Proposed By', value: project.proposedBy },
                  { label: 'Beneficiary', value: project.beneficiary },
                  { label: 'Start Date', value: fmt(project.startDate) },
                  { label: 'End Date', value: fmt(project.endDate) },
                  { label: 'Actual Start', value: fmt(project.actualStartDate) },
                  { label: 'Actual End', value: fmt(project.actualEndDate) },
                  { label: 'Total Budget', value: project.budgetTotal > 0 ? `${project.budgetTotal.toLocaleString()} ETB` : '—' },
                  { label: 'Created', value: fmt(project.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-xs text-blue-400 dark:text-slate-400">{label}</p>
                    <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              {/* Budget breakdown */}
              {(project.budgetAdama > 0 || project.budgetAurora > 0) && (
                <div>
                  <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">Budget Breakdown</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-blue-400 dark:text-slate-400">Adama Budget</p>
                      <p className="text-sm font-bold text-[#1a4a8a] dark:text-white mt-0.5">
                        {project.budgetAdama > 0 ? `${project.budgetAdama.toLocaleString()} ETB` : '—'}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-blue-400 dark:text-slate-400">Aurora Budget</p>
                      <p className="text-sm font-bold text-[#1a4a8a] dark:text-white mt-0.5">
                        {project.budgetAurora > 0 ? `${project.budgetAurora.toLocaleString()} ETB` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* City assignments */}
              {(project.adama || project.aurora) && (
                <div>
                  <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">City Assignments</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {project.adama && (
                      <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-xs font-bold text-[#1a4a8a] dark:text-blue-400 mb-2">ADAMA</p>
                        <p className="text-xs text-blue-400 dark:text-slate-400">Department</p>
                        <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">{project.adama.department}</p>
                      </div>
                    )}
                    {project.aurora && (
                      <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                        <p className="text-xs font-bold text-[#1a4a8a] dark:text-blue-400 mb-2">AURORA</p>
                        <p className="text-xs text-blue-400 dark:text-slate-400">Department</p>
                        <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">{project.aurora.department}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expected outcome */}
              <div>
                <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">Expected Outcome</h3>
                <p className="text-sm text-blue-400 dark:text-slate-400 leading-relaxed bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                  {project.expectedOutcome}
                </p>
              </div>

              {/* Rejection reason */}
              {project.rejectionReason && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{project.rejectionReason}</p>
                </div>
              )}

              {/* Completed by */}
              {project.completedBy.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">Completion Confirmation</h3>
                  <div className="flex gap-2">
                    {project.completedBy.map((city) => (
                      <span key={city} className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full">
                        ✓ {city}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MILESTONES TAB ───────────────────────────────────────── */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-400 dark:text-slate-400">
                  {project.milestones.length} milestone{project.milestones.length !== 1 ? 's' : ''}
                </p>
                {canAddMilestone && (
                  <button
                    onClick={() => setShowAddMS(true)}
                    className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-[#15397a] text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Milestone
                  </button>
                )}
              </div>

              {project.milestones.length === 0 ? (
                <EmptyState icon="flag" message="No milestones added yet" />
              ) : (
                <div className="space-y-3">
                  {project.milestones.map((m) => (
                    <div key={m.id} className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(m.status)}`}>
                              {m.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-slate-700 text-[#1a4a8a] dark:text-blue-300">
                              {m.responsible}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">{m.title}</p>
                          <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">{m.description}</p>
                          <p className="text-xs text-blue-300 dark:text-slate-500 mt-1">
                            Deadline: {fmt(m.deadline)}
                            {m.completedAt && ` · Completed: ${fmt(m.completedAt)}`}
                          </p>
                          {m.delayReason && (
                            <p className="text-xs text-orange-500 mt-1">⚠ {m.delayReason}</p>
                          )}
                        </div>
                        {/* Backend: only CITY_ADMIN can update a COMPLETED milestone; officers blocked on completed */}
                        {project.status !== 'COMPLETED' &&
                          (isAdmin || (isOfficer && m.status !== 'COMPLETED')) && (
                          <button
                            onClick={() => setEditMilestone(m)}
                            className="text-blue-400 hover:text-[#1a4a8a] dark:hover:text-blue-300 transition shrink-0"
                            title="Update milestone"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TASKS TAB ────────────────────────────────────────────── */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-400 dark:text-slate-400">
                  {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
                </p>
                {canAddTask && (
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-[#15397a] text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Task
                  </button>
                )}
              </div>

              {project.tasks.length === 0 ? (
                <EmptyState icon="check" message="No tasks assigned yet" />
              ) : (
                <div className="space-y-3">
                  {project.tasks.map((t) => (
                    <div key={t.id} className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(t.status)}`}>
                              {t.status.replace('_', ' ')}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getPriorityStyle(t.priority)}`}>
                              {t.priority}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-slate-700 text-[#1a4a8a] dark:text-blue-300">
                              {t.assignedCity}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">{t.title}</p>
                          <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">{t.description}</p>
                          <p className="text-xs text-blue-300 dark:text-slate-500 mt-1">
                            Due: {fmt(t.dueDate)}
                            {t.completedAt && ` · Completed: ${fmt(t.completedAt)}`}
                          </p>
                        </div>
                        {project.status !== 'COMPLETED' && (
                          <button
                            onClick={() => setEditTask(t)}
                            className="text-blue-400 hover:text-[#1a4a8a] dark:hover:text-blue-300 transition shrink-0"
                            title="Update task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ISSUES TAB ───────────────────────────────────────────── */}
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-400 dark:text-slate-400">
                  {project.issues.length} issue{project.issues.length !== 1 ? 's' : ''}
                </p>
                {canAddIssue && (
                  <button
                    onClick={() => setShowAddIssue(true)}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Report Issue
                  </button>
                )}
              </div>

              {project.issues.length === 0 ? (
                <EmptyState icon="shield" message="No issues reported" />
              ) : (
                <div className="space-y-3">
                  {project.issues.map((iss) => (
                    <div key={iss.id} className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getSeverityStyle(iss.severity)}`}>
                              {iss.severity}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusStyle(iss.status)}`}>
                              {iss.status.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-slate-700 text-[#1a4a8a] dark:text-blue-300">
                              {iss.affectedCity}
                            </span>
                          </div>
                          <p className="text-sm text-[#1a4a8a] dark:text-white">{iss.description}</p>
                          <p className="text-xs text-blue-300 dark:text-slate-500 mt-1">
                            Raised: {fmt(iss.raisedAt)}
                            {iss.resolvedAt && ` · Resolved: ${fmt(iss.resolvedAt)}`}
                          </p>
                          {iss.resolution && (
                            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded">
                              Resolution: {iss.resolution}
                            </p>
                          )}
                        </div>
                        {iss.status !== 'RESOLVED' && (isAdmin || isOfficer) && (
                          <button
                            onClick={() => setEditIssue(iss)}
                            className="text-blue-400 hover:text-[#1a4a8a] dark:hover:text-blue-300 transition shrink-0"
                            title="Update issue"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── ACTION MODALS ─────────────────────────────────────────────── */}
      {showApprove && (
        <ConfirmModal
          title="Approve Project"
          message={`Are you sure you want to approve "${project.title}"?`}
          confirmLabel="Approve"
          confirmClass="bg-teal-500 hover:bg-teal-600"
          onClose={() => setShowApprove(false)}
          onConfirm={async () => {
            const updated = await projectsApi.update(project.id, { action: 'approve' });
            refresh(updated);
            setShowApprove(false);
          }}
        />
      )}

      {showReject && (
        <RejectModal
          projectId={project.id}
          onClose={() => setShowReject(false)}
          onUpdated={(p) => { refresh(p); setShowReject(false); }}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete Proposal"
          message={`Are you sure you want to delete the project proposal "${project.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-500 hover:bg-red-600"
          onClose={() => setShowDelete(false)}
          onConfirm={async () => {
            await projectsApi.delete(project.id);
            navigate('/projects');
          }}
        />
      )}

      {showAssign && (
        <AssignModal
          projectId={project.id}
          onClose={() => setShowAssign(false)}
          onUpdated={(p) => { refresh(p); setShowAssign(false); }}
        />
      )}

      {showPlan && (
        <PlanModal
          projectId={project.id}
          onClose={() => setShowPlan(false)}
          onUpdated={(p) => { refresh(p); setShowPlan(false); }}
        />
      )}

      {showStatusUpdate && (
        <StatusUpdateModal
          project={project}
          onClose={() => setShowStatus(false)}
          onUpdated={(p) => { refresh(p); setShowStatus(false); }}
        />
      )}

      {showAddMilestone && (
        <AddMilestoneModal
          projectId={project.id}
          onClose={() => setShowAddMS(false)}
          onUpdated={(p) => { refresh(p); setShowAddMS(false); }}
        />
      )}

      {editMilestone && (
        <UpdateMilestoneModal
          projectId={project.id}
          milestone={editMilestone}
          onClose={() => setEditMilestone(null)}
          onUpdated={(p) => { refresh(p); setEditMilestone(null); }}
        />
      )}

      {showAddTask && (
        <AddTaskModal
          projectId={project.id}
          onClose={() => setShowAddTask(false)}
          onUpdated={(p) => { refresh(p); setShowAddTask(false); }}
        />
      )}

      {editTask && (
        <UpdateTaskModal
          projectId={project.id}
          task={editTask}
          userRole={user?.role ?? ''}
          onClose={() => setEditTask(null)}
          onUpdated={(p) => { refresh(p); setEditTask(null); }}
        />
      )}

      {showAddIssue && (
        <AddIssueModal
          projectId={project.id}
          onClose={() => setShowAddIssue(false)}
          onUpdated={(p) => { refresh(p); setShowAddIssue(false); }}
        />
      )}

      {editIssue && (
        <UpdateIssueModal
          projectId={project.id}
          issue={editIssue}
          onClose={() => setEditIssue(null)}
          onUpdated={(p) => { refresh(p); setEditIssue(null); }}
        />
      )}
    </div>
  );
}

// ── Shared empty state ─────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-10 h-10 text-blue-200 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icon === 'flag' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />}
        {icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
        {icon === 'shield' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />}
      </svg>
      <p className="text-[#1a4a8a] dark:text-white font-semibold text-sm">{message}</p>
    </div>
  );
}

// ── Modal wrapper ──────────────────────────────────────────────────────
function ModalWrapper({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">
        <div className="bg-[#1a4a8a] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">{title}</h2>
            {subtitle && <p className="text-blue-200 text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-blue-200 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onClose, onConfirm }: {
  title: string; message: string; confirmLabel: string; confirmClass: string;
  onClose: () => void; onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    try { setLoading(true); await onConfirm(); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Action failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title={title} onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <p className="text-sm text-blue-400 dark:text-slate-400 mb-5">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
        <button onClick={handle} disabled={loading} className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition disabled:opacity-60 ${confirmClass}`}>
          {loading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Reject Modal ───────────────────────────────────────────────────────
function RejectModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!reason.trim()) { setError('Rejection reason is required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.update(projectId, { action: 'reject', rejectionReason: reason });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Reject Project" subtitle="Provide a reason for rejection" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain why this project is being rejected..."
        rows={4}
        className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition resize-none mb-4"
      />
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
        <button onClick={handle} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition disabled:opacity-60">
          {loading ? 'Rejecting...' : 'Reject'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Assign Modal ───────────────────────────────────────────────────────
function AssignModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [department, setDepartment] = useState('');
  const [focalPerson, setFocalPerson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!department.trim() || !focalPerson.trim()) { setError('All fields are required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.update(projectId, { action: 'assign', department, focalPerson });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Assign Department" subtitle="Assign your city's department to this project" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Department Name</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            <option value="">Select department...</option>
            {Object.values(Department).map((dept) => (
              <option key={dept} value={dept}>
                {dept.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Focal Person (User ID)</label>
          <input type="text" value={focalPerson} onChange={(e) => setFocalPerson(e.target.value)} placeholder="MongoDB user ID"
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
        <button onClick={handle} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold transition disabled:opacity-60">
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Plan Modal ─────────────────────────────────────────────────────────
function PlanModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!budget || !startDate || !endDate) { setError('All fields are required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.update(projectId, { action: 'plan', budget: Number(budget), startDate, endDate });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Set Budget & Timeline" subtitle="Submit your city's budget plan for this project" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Budget (ETB)</label>
          <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0"
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition" />
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
        <button onClick={handle} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold transition disabled:opacity-60">
          {loading ? 'Submitting...' : 'Submit Budget'}
        </button>
      </div>
    </ModalWrapper>
  );
}

// ── Status Update Modal ────────────────────────────────────────────────
function StatusUpdateModal({ project, onClose, onUpdated }: { project: Project; onClose: () => void; onUpdated: (p: Project) => void }) {
  const allowed: Record<string, string[]> = {
    PLANNED: ['IN_PROGRESS'],
    IN_PROGRESS: ['ON_HOLD', 'DELAYED'],
    ON_HOLD: ['IN_PROGRESS'],
    DELAYED: ['IN_PROGRESS'],
  };
  const options = allowed[project.status] ?? [];
  const [status, setStatus] = useState(options[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isComplete = project.status === 'IN_PROGRESS';

  const handleComplete = async () => {
    try {
      setLoading(true);
      const p = await projectsApi.update(project.id, { action: 'complete' });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };

  const handleStatus = async () => {
    if (!status) return;
    try {
      setLoading(true);
      const p = await projectsApi.update(project.id, { action: 'update-status', status: status as any });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <ModalWrapper title="Update Project Status" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {options.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">New Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            {options.map((o) => (
              <option key={o} value={o}>{o.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {options.length > 0 && (
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
            <button onClick={handleStatus} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold transition disabled:opacity-60">
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        )}
        {isComplete && (
          <button onClick={handleComplete} disabled={loading} className="w-full px-4 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition disabled:opacity-60">
            ✓ Confirm Project Completion
          </button>
        )}
      </div>
    </ModalWrapper>
  );
}

// ── Add Milestone Modal ────────────────────────────────────────────────
function AddMilestoneModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [form, setForm] = useState({ title: '', description: '', deadline: '', responsible: 'BOTH' as Responsible });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!form.title || !form.description || !form.deadline) { setError('All fields required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.addMilestone(projectId, form);
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Add Milestone" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <FormField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Milestone title" />
        <FormTextarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe this milestone" />
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Deadline</label>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Responsible</label>
          <select value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value as Responsible })}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            <option value="BOTH">Both Cities</option>
            <option value="ADAMA">Adama</option>
            <option value="AURORA">Aurora</option>
          </select>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Add Milestone" />
    </ModalWrapper>
  );
}

// ── Update Milestone Modal ─────────────────────────────────────────────
function UpdateMilestoneModal({ projectId, milestone, onClose, onUpdated }: { projectId: string; milestone: Milestone; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [status, setStatus] = useState<MilestoneStatus>(milestone.status);
  const [delayReason, setDelayReason] = useState(milestone.delayReason ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    try {
      setLoading(true);
      const p = await projectsApi.updateMilestone(projectId, milestone.id, { status, delayReason: status === 'DELAYED' ? delayReason : undefined });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Update Milestone" subtitle={milestone.title} onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
          </select>
        </div>
        {status === 'DELAYED' && (
          <FormTextarea label="Delay Reason *" value={delayReason} onChange={setDelayReason} placeholder="Explain the reason for delay" />
        )}
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Update" />
    </ModalWrapper>
  );
}

// ── Add Task Modal ─────────────────────────────────────────────────────
function AddTaskModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'NORMAL' as TaskPriority, dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!form.title || !form.description || !form.assignedTo || !form.dueDate) { setError('All fields required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.addTask(projectId, form);
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Add Task" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <FormField label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Task title" />
        <FormTextarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe this task" />
        <FormField label="Assigned To (User ID)" value={form.assignedTo} onChange={(v) => setForm({ ...form, assignedTo: v })} placeholder="MongoDB user ID" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Due Date</label>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition" />
          </div>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Add Task" />
    </ModalWrapper>
  );
}

// ── Update Task Modal ──────────────────────────────────────────────────
function UpdateTaskModal({ projectId, task, userRole, onClose, onUpdated }: { projectId: string; task: Task; userRole: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const allowedTransitions: Record<string, TaskStatus[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['DONE', 'TODO'],
    DONE: ['IN_PROGRESS'],
  };
  // BUG FIX: initialize to first valid transition, NOT task.status.
  // The <select> only shows transition targets; submitting the current status
  // would cause backend to throw "Cannot move task from X to X".
  const firstTransition = (allowedTransitions[task.status] ?? [])[0] ?? task.status;
  const [status, setStatus] = useState<TaskStatus>(firstTransition);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate?.split('T')[0] ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isOfficer = userRole === 'DEPT_OFFICER';

  const handle = async () => {
    try {
      setLoading(true);
      const payload: any = { status };
      if (!isOfficer) { payload.priority = priority; payload.dueDate = dueDate; }
      const p = await projectsApi.updateTask(projectId, task.id, payload);
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Update Task" subtitle={task.title} onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            {(allowedTransitions[task.status] ?? []).map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        {!isOfficer && (
          <>
            <div>
              <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
                <option value="URGENT">Urgent</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition" />
            </div>
          </>
        )}
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Update Task" />
    </ModalWrapper>
  );
}

// ── Add Issue Modal ────────────────────────────────────────────────────
function AddIssueModal({ projectId, onClose, onUpdated }: { projectId: string; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [form, setForm] = useState({ description: '', severity: 'MINOR' as IssueSeverity, affectedCity: 'BOTH' as Responsible });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (!form.description.trim()) { setError('Description is required'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.addIssue(projectId, form);
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Report Issue" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <FormTextarea label="Description *" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe the issue..." />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as IssueSeverity })}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
              <option value="CRITICAL">Critical</option>
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Affected City</label>
            <select value={form.affectedCity} onChange={(e) => setForm({ ...form, affectedCity: e.target.value as Responsible })}
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
              <option value="BOTH">Both</option>
              <option value="ADAMA">Adama</option>
              <option value="AURORA">Aurora</option>
            </select>
          </div>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Report Issue" />
    </ModalWrapper>
  );
}

// ── Update Issue Modal ─────────────────────────────────────────────────
function UpdateIssueModal({ projectId, issue, onClose, onUpdated }: { projectId: string; issue: Issue; onClose: () => void; onUpdated: (p: Project) => void }) {
  const [status, setStatus] = useState<IssueStatus>(issue.status);
  const [resolution, setResolution] = useState(issue.resolution ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const handle = async () => {
    if (status === 'RESOLVED' && !resolution.trim()) { setError('Resolution note required when resolving'); return; }
    try {
      setLoading(true);
      const p = await projectsApi.updateIssue(projectId, issue.id, { status, resolution: status === 'RESOLVED' ? resolution : undefined });
      onUpdated(p);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <ModalWrapper title="Update Issue" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)}
            className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition">
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        {status === 'RESOLVED' && (
          <FormTextarea label="Resolution *" value={resolution} onChange={setResolution} placeholder="Describe how the issue was resolved" />
        )}
      </div>
      <ModalActions onCancel={onClose} onSubmit={handle} loading={loading} submitLabel="Update Issue" />
    </ModalWrapper>
  );
}

// ── Shared form components ──────────────────────────────────────────────
function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition" />
    </div>
  );
}

function FormTextarea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1a4a8a] dark:text-slate-300 mb-1.5 uppercase tracking-wide">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
        className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 transition resize-none" />
    </div>
  );
}

function ModalActions({ onCancel, onSubmit, loading, submitLabel }: { onCancel: () => void; onSubmit: () => void; loading: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg border border-blue-100 dark:border-slate-700 text-sm font-medium text-[#1a4a8a] dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition">Cancel</button>
      <button onClick={onSubmit} disabled={loading} className="flex-1 px-4 py-2.5 rounded-lg bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2">
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}
