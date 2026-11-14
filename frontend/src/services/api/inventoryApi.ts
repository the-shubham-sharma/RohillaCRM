import { apiClient } from './client';
import {
  ApiResponse,
  InventoryItemDto,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  ProjectMaterialRequirementDto,
  StockReserveRequest,
  StockIssueRequest,
  StockTransactionDto,
  StockTransactionRequest,
} from '../../shared/types';

export const inventoryApi = {
  getItems: async (params?: { search?: string; category?: string; lowStock?: boolean }): Promise<InventoryItemDto[]> => {
    const res = await apiClient.get<ApiResponse<InventoryItemDto[]>>('/inventory/items', { params });
    return res.data.data;
  },

  getItemById: async (id: string): Promise<InventoryItemDto> => {
    const res = await apiClient.get<ApiResponse<InventoryItemDto>>(`/inventory/items/${id}`);
    return res.data.data;
  },

  createItem: async (data: CreateInventoryItemRequest): Promise<InventoryItemDto> => {
    const res = await apiClient.post<ApiResponse<InventoryItemDto>>('/inventory/items', data);
    return res.data.data;
  },

  updateItem: async (id: string, data: UpdateInventoryItemRequest): Promise<InventoryItemDto> => {
    const res = await apiClient.put<ApiResponse<InventoryItemDto>>(`/inventory/items/${id}`, data);
    return res.data.data;
  },

  getProjectRequirements: async (projectId: string): Promise<ProjectMaterialRequirementDto[]> => {
    const res = await apiClient.get<ApiResponse<ProjectMaterialRequirementDto[]>>(`/inventory/projects/${projectId}`);
    return res.data.data;
  },

  reserveStock: async (projectId: string, data: StockReserveRequest): Promise<ProjectMaterialRequirementDto> => {
    const res = await apiClient.post<ApiResponse<ProjectMaterialRequirementDto>>(`/inventory/projects/${projectId}/reserve`, data);
    return res.data.data;
  },

  issueStock: async (projectId: string, data: StockIssueRequest): Promise<ProjectMaterialRequirementDto> => {
    const res = await apiClient.post<ApiResponse<ProjectMaterialRequirementDto>>(`/inventory/projects/${projectId}/issue`, data);
    return res.data.data;
  },

  getAllTransactions: async (): Promise<StockTransactionDto[]> => {
    const res = await apiClient.get<ApiResponse<StockTransactionDto[]>>('/inventory/transactions');
    return res.data.data;
  },

  recordTransaction: async (data: StockTransactionRequest): Promise<StockTransactionDto> => {
    const res = await apiClient.post<ApiResponse<StockTransactionDto>>('/inventory/transactions', data);
    return res.data.data;
  },
};
