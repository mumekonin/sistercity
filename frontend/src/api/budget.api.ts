import api from './axios';
import type { Budget, BudgetSummary, Equipment } from '../types/budget.types';

export const budgetApi = {
  /**
   * GET /budgets/summary
   * Returns budget summary for all in-progress projects.
   * Accessible to CITY_ADMIN and SUPER_ADMIN.
   */
  getSummary: async (): Promise<BudgetSummary[]> => {
    const response = await api.get('/budgets/summary');
    return response.data;
  },

  /**
   * GET /budgets/:projectId
   * Returns the full budget (with expenditures) for a single project.
   */
  getByProject: async (projectId: string): Promise<Budget> => {
    const response = await api.get(`/budgets/${projectId}`);
    return response.data;
  },

  /**
   * POST /budgets/:projectId
   * Records a new expenditure. Sends multipart/form-data (includes receipt file).
   */
  recordExpenditure: async (projectId: string, formData: FormData): Promise<Budget> => {
    const response = await api.post(`/budgets/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * PATCH /budgets/:projectId/expenditures/:eid
   * Approve or reject a specific expenditure.
   */
  updateExpenditure: async (
    projectId: string,
    eid: string,
    data: { action: 'approve' | 'reject'; rejectionReason?: string },
  ): Promise<Budget> => {
    const response = await api.patch(
      `/budgets/${projectId}/expenditures/${eid}`,
      data,
    );
    return response.data;
  },
};

export const equipmentApi = {
  /**
   * GET /equipment/:projectId
   * Returns all equipment items for a project.
   */
  getByProject: async (projectId: string): Promise<Equipment[]> => {
    const response = await api.get(`/equipment/${projectId}`);
    return response.data;
  },

  /**
   * POST /equipment/:projectId
   * Adds a new equipment item to a project.
   */
  add: async (projectId: string, data: {
    itemName: string;
    description: string;
    quantity: number;
    estimatedValue: number;
    providedDate: Date | string;
  }): Promise<Equipment> => {
    const response = await api.post(`/equipment/${projectId}`, data);
    return response.data;
  },

  /**
   * PATCH /equipment/:id
   * Updates equipment status (AVAILABLE → IN_USE → RETURNED / DAMAGED).
   */
  update: async (id: string, data: {
    status: string;
    damagedNote?: string;
    returnedDate?: Date;
  }): Promise<Equipment> => {
    const response = await api.patch(`/equipment/${id}`, data);
    return response.data;
  },
};