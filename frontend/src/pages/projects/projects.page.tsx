import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../../api/Projects.api';
import type { ProjectListItem, Priority, ProjectStatus } from '../../types/projects.types';
import { useAuthStore } from '../../store/auth.store';
import CreateProjectModal from './components/CreateProjectModal';

// ── Helpers ───────────────────────────────────────────────────
function getPriorityStyle(priority: Priority) {
  switch (priority) {
    case 'HIGH':   return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'MEDIUM': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'LOW':    return 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300';
  }
}

function getStatusStyle(status: ProjectStatus) {
  switch (status) {
    case 'PROPOSED':    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'APPROVED':    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'REJECTED':    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'PLANNED':     return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'IN_PROGRESS': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'ON_HOLD':     return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'DELAYED':     return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'COMPLETED':   return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  }
}

function formatStatus(status: ProjectStatus) {
  return status.replace('_', ' ');
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.getAll();
      setProjects(data);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (project: any) => {
    setProjects((prev) => [project, ...prev]);
    setShowCreate(false);
  };

  // ── Filters ───────────────────────────────────────────────
  const filtered = projects.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchCity   = cityFilter === 'ALL' || p.proposedBy === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
            Projects
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1">
            All joint initiatives between Adama and Aurora administrations.
          </p>
        </div>
        {user?.role === 'CITY_ADMIN' && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#1a4a8a] hover:bg-[#15397a] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Proposal
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">

          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-[#1a4a8a] dark:text-white placeholder-blue-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition"
          >
            <option value="ALL">All statuses</option>
            <option value="PROPOSED">Proposed</option>
            <option value="APPROVED">Approved</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="DELAYED">Delayed</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* City filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-400 transition"
          >
            <option value="ALL">Both cities</option>
            <option value="ADAMA">Adama</option>
            <option value="AURORA">Aurora</option>
          </select>
        </div>
      </div>

      {/* Projects table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-12 h-12 text-blue-200 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-[#1a4a8a] dark:text-white font-semibold">No projects found</p>
            <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
              {search ? 'Try a different search term' : 'No projects have been created yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-blue-50 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-6 py-3">Project</th>
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Proposed By</th>
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Priority</th>
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Progress</th>
                  <th className="text-left text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 dark:divide-slate-700/50">
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    {/* Project title */}
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white">
                        {project.title}
                      </p>
                      <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {project.description}
                      </p>
                    </td>

                    {/* Proposed by */}
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs font-semibold text-[#1a4a8a] dark:text-blue-300 bg-blue-50 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                        {project.proposedBy}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getPriorityStyle(project.priority)}`}>
                        {project.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusStyle(project.status)}`}>
                        {formatStatus(project.status)}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-blue-100 dark:bg-slate-700 rounded-full h-1.5 w-24">
                          <div
                            className="bg-[#1a4a8a] dark:bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${project.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-400 dark:text-slate-400 min-w-[32px]">
                          {project.progressPercent}%
                        </span>
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-sm text-[#1a4a8a] dark:text-white font-medium">
                        {project.budgetTotal > 0
                          ? `${project.budgetTotal.toLocaleString()} ETB`
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Create modal */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}