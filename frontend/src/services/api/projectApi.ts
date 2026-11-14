import { apiClient } from './client';
import { ApiResponse, ProjectListItem, ProjectDetail } from '../../shared/types';

export const projectApi = {
  getAll: async (params?: { page?: number; size?: number; status?: string; search?: string }): Promise<ProjectListItem[]> => {
    const res = await apiClient.get<ApiResponse<ProjectListItem[]>>('/projects', { params });
    return res.data.data;
  },
  getById: async (projectId: string): Promise<ProjectDetail> => {
    const res = await apiClient.get<ApiResponse<ProjectDetail>>(`/projects/${projectId}`);
    return res.data.data;
  },
  create: async (data: Record<string, any>): Promise<ProjectDetail> => {
    const res = await apiClient.post<ApiResponse<ProjectDetail>>('/projects', data);
    return res.data.data;
  },
  transitionStatus: async (projectId: string, targetStatus: string, remarks?: string): Promise<ProjectDetail> => {
    const res = await apiClient.post<ApiResponse<ProjectDetail>>(`/projects/${projectId}/transition`, {
      targetStatus,
      remarks,
    });
    return res.data.data;
  },
  retryWhatsApp: async (projectId: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>(`/projects/${projectId}/whatsapp/retry`);
    return res.data.message || 'WhatsApp notification triggered';
  },
};
