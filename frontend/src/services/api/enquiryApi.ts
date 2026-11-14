import { apiClient } from './client';
import {
  ApiResponse,
  EnquiryCreateRequest,
  EnquiryResponseDto,
  ServiceCatalogDto,
  ProjectListItem,
} from '../../shared/types';

export const enquiryApi = {
  createOrSave: async (data: EnquiryCreateRequest): Promise<EnquiryResponseDto> => {
    const res = await apiClient.post<ApiResponse<EnquiryResponseDto>>('/enquiries', data);
    return res.data.data;
  },

  getAll: async (params?: { status?: string; search?: string }): Promise<EnquiryResponseDto[]> => {
    const res = await apiClient.get<ApiResponse<EnquiryResponseDto[]>>('/enquiries', { params });
    return res.data.data;
  },

  getById: async (id: string): Promise<EnquiryResponseDto> => {
    const res = await apiClient.get<ApiResponse<EnquiryResponseDto>>(`/enquiries/${id}`);
    return res.data.data;
  },

  update: async (id: string, data: EnquiryCreateRequest): Promise<EnquiryResponseDto> => {
    const res = await apiClient.put<ApiResponse<EnquiryResponseDto>>(`/enquiries/${id}`, data);
    return res.data.data;
  },

  convertToProject: async (id: string): Promise<ProjectListItem> => {
    const res = await apiClient.post<ApiResponse<ProjectListItem>>(`/enquiries/${id}/convert`);
    return res.data.data;
  },

  getCatalog: async (): Promise<ServiceCatalogDto[]> => {
    const res = await apiClient.get<ApiResponse<ServiceCatalogDto[]>>('/enquiries/catalog');
    return res.data.data;
  },

  addMaterialOption: async (serviceName: string, materialName: string): Promise<void> => {
    await apiClient.post('/enquiries/catalog/material', { serviceName, materialName });
  },
};
