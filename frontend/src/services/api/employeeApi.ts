import { apiClient } from './client';
import {
  ApiResponse,
  UserSummary,
  CreateUserRequest,
  UpdateUserStatusRequest,
  UserProfile,
  UpdateProfileRequest,
  EmployeeDocument,
  DocumentType,
  VerifyDocumentRequest,
} from '../../shared/types';

export const employeeApi = {
  // User Management
  getAllUsers: async (): Promise<UserSummary[]> => {
    const res = await apiClient.get<ApiResponse<UserSummary[]>>('/users');
    return res.data.data;
  },
  createUser: async (data: CreateUserRequest): Promise<UserSummary> => {
    const res = await apiClient.post<ApiResponse<UserSummary>>('/users', data);
    return res.data.data;
  },
  updateStatus: async (userId: string, data: UpdateUserStatusRequest): Promise<UserSummary> => {
    const res = await apiClient.patch<ApiResponse<UserSummary>>(`/users/${userId}/status`, data);
    return res.data.data;
  },
  resetPassword: async (userId: string): Promise<string> => {
    const res = await apiClient.post<ApiResponse<string>>(`/users/${userId}/reset-password`);
    return res.data.message || 'Password reset successful';
  },

  // Profile & KYC
  getMyProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get<ApiResponse<UserProfile>>('/profile');
    return res.data.data;
  },
  updateMyProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const res = await apiClient.put<ApiResponse<UserProfile>>('/profile', data);
    return res.data.data;
  },
  uploadProfilePhoto: async (file: File): Promise<UserProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<ApiResponse<UserProfile>>('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  uploadKycDocument: async (documentType: DocumentType, file: File, documentNumber?: string): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }
    const res = await apiClient.post<ApiResponse<EmployeeDocument>>('/profile/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  getDocumentHistory: async (documentType: DocumentType): Promise<EmployeeDocument[]> => {
    const res = await apiClient.get<ApiResponse<EmployeeDocument[]>>(`/profile/documents/${documentType}/history`);
    return res.data.data;
  },
  getEmployeeProfile: async (userId: string): Promise<UserProfile> => {
    const res = await apiClient.get<ApiResponse<UserProfile>>(`/users/${userId}/profile`);
    return res.data.data;
  },
  verifyDocument: async (userId: string, documentId: string, data: VerifyDocumentRequest): Promise<EmployeeDocument> => {
    const res = await apiClient.post<ApiResponse<EmployeeDocument>>(`/users/${userId}/documents/${documentId}/verify`, data);
    return res.data.data;
  },
  getDocumentDownloadUrl: (documentId: string, userId?: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api/v1';
    if (userId) {
      return `${baseUrl}/users/${userId}/documents/${documentId}/download`;
    }
    return `${baseUrl}/profile/documents/${documentId}/download`;
  },
  downloadDocumentBlob: async (documentId: string, userId?: string, fileName?: string): Promise<void> => {
    const url = userId
      ? `/users/${userId}/documents/${documentId}/download`
      : `/profile/documents/${documentId}/download`;
    const response = await apiClient.get(url, { responseType: 'blob' });
    const contentType = String(response.headers['content-type'] || 'application/octet-stream');
    const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName || `document-${documentId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
  },
};
