import { apiClient } from './client';
import { ApiResponse, CustomerEnquiryRequest, LeadResponseDto, Lead, UpdateLeadStatusRequest, ProjectListItem } from '../../shared/types';

export const leadApi = {
  // Public Customer Quote Submission
  submitPublicQuote: async (data: CustomerEnquiryRequest): Promise<LeadResponseDto> => {
    const res = await apiClient.post<ApiResponse<LeadResponseDto>>('/public/leads', data);
    return res.data.data;
  },

  // Public Artwork File Upload
  uploadArtwork: async (file: File): Promise<{ storageKey: string; originalFileName: string; fileSize: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<{ storageKey: string; originalFileName: string; fileSize: string }>>(
      '/public/leads/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data.data;
  },

  // Internal Manager/Admin Lead Management
  getAllLeads: async (params?: { status?: string; search?: string }): Promise<Lead[]> => {
    const res = await apiClient.get<ApiResponse<Lead[]>>('/leads', { params });
    return res.data.data;
  },

  getLeadById: async (id: string): Promise<Lead> => {
    const res = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return res.data.data;
  },

  updateLeadStatus: async (id: string, data: UpdateLeadStatusRequest): Promise<Lead> => {
    const res = await apiClient.patch<ApiResponse<Lead>>(`/leads/${id}/status`, data);
    return res.data.data;
  },

  convertLead: async (id: string): Promise<ProjectListItem> => {
    const res = await apiClient.post<ApiResponse<ProjectListItem>>(`/leads/${id}/convert`);
    return res.data.data;
  },
};
