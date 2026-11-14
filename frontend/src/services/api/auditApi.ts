import { apiClient } from './client';
import { ApiResponse, AuditLogItem } from '../../shared/types';

export const auditApi = {
  getAuditLogs: async (params?: { action?: string; userId?: string; limit?: number }): Promise<AuditLogItem[]> => {
    const res = await apiClient.get<ApiResponse<AuditLogItem[]>>('/audit-logs', { params });
    return res.data.data;
  },
};
