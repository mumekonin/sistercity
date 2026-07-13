import api from './axios';
import type {Project,ProjectListItem,CreateProjectDto,UpdateProjectDto,CreateMilestoneDto,UpdateMilestoneDto,CreateTaskDto,UpdateTaskDto,CreateIssueDto, UpdateIssueDto} from '../types/projects.types';

export const projectsApi = {
  getAll: async (): Promise<ProjectListItem[]> => {
    const response = await api.get('/projects');
    return response.data;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await api.patch(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },

  addMilestone: async (id: string, data: CreateMilestoneDto): Promise<Project> => {
    const response = await api.post(`/projects/${id}/milestones`, data);
    return response.data;
  },

  updateMilestone: async (id: string, mid: string, data: UpdateMilestoneDto): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/milestones/${mid}`, data);
    return response.data;
  },

  addTask: async (id: string, data: CreateTaskDto): Promise<Project> => {
    const response = await api.post(`/projects/${id}/tasks`, data);
    return response.data;
  },

  updateTask: async (id: string, tid: string, data: UpdateTaskDto): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/tasks/${tid}`, data);
    return response.data;
  },

  addIssue: async (id: string, data: CreateIssueDto): Promise<Project> => {
    const response = await api.post(`/projects/${id}/issues`, data);
    return response.data;
  },

  updateIssue: async (id: string, iid: string, data: UpdateIssueDto): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/issues/${iid}`, data);
    return response.data;
  },
};