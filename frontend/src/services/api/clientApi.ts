import { apiClient } from './client';
import { ApiResponse, Client, CreateClientRequest, UpdateClientRequest } from '../../shared/types';

export const clientApi = {
  getAll: async (): Promise<Client[]> => {
    const res = await apiClient.get<ApiResponse<Client[]>>('/clients');
    return res.data.data;
  },
  getById: async (clientId: string): Promise<Client> => {
    const res = await apiClient.get<ApiResponse<Client>>(`/clients/${clientId}`);
    return res.data.data;
  },
  create: async (data: CreateClientRequest): Promise<Client> => {
    const res = await apiClient.post<ApiResponse<Client>>('/clients', data);
    return res.data.data;
  },
  update: async (clientId: string, data: UpdateClientRequest): Promise<Client> => {
    const res = await apiClient.put<ApiResponse<Client>>(`/clients/${clientId}`, data);
    return res.data.data;
  },
};
