import { apiClient } from './client';
import {
  ApiResponse,
  DepartmentWorkspace,
  DesignerHistoryItem,
  ProductionHistoryItem,
  QcHistoryItem,
  DispatchHistoryItem,
  DesignerPerformance,
  ProductionPerformance,
  QcPerformance,
  DispatchPerformance,
  TeamPerformance,
  CompanyPerformance,
  DateFilterPeriod,
  DesignFile,
  QCEvaluation,
  DispatchRecord,
} from '../../shared/types';

export const workspaceApi = {
  getWorkspace: async (department: string): Promise<DepartmentWorkspace> => {
    const res = await apiClient.get<ApiResponse<DepartmentWorkspace>>(`/workspaces/${department}`);
    return res.data.data;
  },
  getDesignerHistory: async (period: DateFilterPeriod): Promise<DesignerHistoryItem[]> => {
    const res = await apiClient.get<ApiResponse<DesignerHistoryItem[]>>('/workspaces/designer/history', {
      params: { period },
    });
    return res.data.data;
  },
  getProductionHistory: async (period: DateFilterPeriod): Promise<ProductionHistoryItem[]> => {
    const res = await apiClient.get<ApiResponse<ProductionHistoryItem[]>>('/workspaces/production/history', {
      params: { period },
    });
    return res.data.data;
  },
  getQcHistory: async (period: DateFilterPeriod): Promise<QcHistoryItem[]> => {
    const res = await apiClient.get<ApiResponse<QcHistoryItem[]>>('/workspaces/qc/history', {
      params: { period },
    });
    return res.data.data;
  },
  getDispatchHistory: async (period: DateFilterPeriod): Promise<DispatchHistoryItem[]> => {
    const res = await apiClient.get<ApiResponse<DispatchHistoryItem[]>>('/workspaces/dispatch/history', {
      params: { period },
    });
    return res.data.data;
  },
  getDesignerPerformance: async (period: DateFilterPeriod): Promise<DesignerPerformance> => {
    const res = await apiClient.get<ApiResponse<DesignerPerformance>>('/workspaces/designer/performance', {
      params: { period },
    });
    return res.data.data;
  },
  getProductionPerformance: async (period: DateFilterPeriod): Promise<ProductionPerformance> => {
    const res = await apiClient.get<ApiResponse<ProductionPerformance>>('/workspaces/production/performance', {
      params: { period },
    });
    return res.data.data;
  },
  getQcPerformance: async (period: DateFilterPeriod): Promise<QcPerformance> => {
    const res = await apiClient.get<ApiResponse<QcPerformance>>('/workspaces/qc/performance', {
      params: { period },
    });
    return res.data.data;
  },
  getDispatchPerformance: async (period: DateFilterPeriod): Promise<DispatchPerformance> => {
    const res = await apiClient.get<ApiResponse<DispatchPerformance>>('/workspaces/dispatch/performance', {
      params: { period },
    });
    return res.data.data;
  },
  getTeamPerformance: async (department: string, period: DateFilterPeriod): Promise<TeamPerformance> => {
    const res = await apiClient.get<ApiResponse<TeamPerformance>>(`/workspaces/${department}/team-performance`, {
      params: { period },
    });
    return res.data.data;
  },
  getCompanyPerformance: async (period: DateFilterPeriod): Promise<CompanyPerformance> => {
    const res = await apiClient.get<ApiResponse<CompanyPerformance>>('/workspaces/company/performance', {
      params: { period },
    });
    return res.data.data;
  },
  uploadDesignFile: async (projectId: string, file: File, versionNotes?: string): Promise<DesignFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (versionNotes) {
      formData.append('versionNotes', versionNotes);
    }
    const res = await apiClient.post<ApiResponse<DesignFile>>(`/projects/${projectId}/design-files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  getDesignFiles: async (projectId: string): Promise<DesignFile[]> => {
    const res = await apiClient.get<ApiResponse<DesignFile[]>>(`/projects/${projectId}/design-files`);
    return res.data.data;
  },
  recordQcEvaluation: async (
    projectId: string,
    evaluation: { passed: boolean; checklist: Record<string, boolean>; notes?: string; reworkInstructions?: string }
  ): Promise<QCEvaluation> => {
    const res = await apiClient.post<ApiResponse<QCEvaluation>>(`/projects/${projectId}/qc-evaluations`, evaluation);
    return res.data.data;
  },
  recordDispatch: async (
    projectId: string,
    dispatch: {
      trackingNumber?: string;
      courierPartner?: string;
      recipientName: string;
      recipientPhone: string;
      deliveryAddress: string;
      installationRequired: boolean;
      notes?: string;
    }
  ): Promise<DispatchRecord> => {
    const res = await apiClient.post<ApiResponse<DispatchRecord>>(`/projects/${projectId}/dispatch-records`, dispatch);
    return res.data.data;
  },
  recordInstallation: async (
    projectId: string,
    installation: { installerName: string; installerPhone: string; notes?: string }
  ): Promise<DispatchRecord> => {
    const res = await apiClient.post<ApiResponse<DispatchRecord>>(`/projects/${projectId}/installation-records`, installation);
    return res.data.data;
  },
};
