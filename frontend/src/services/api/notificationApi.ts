import { apiClient } from './client';
import { ApiResponse, NotificationItem } from '../../shared/types';

export const notificationApi = {
  getAll: async (): Promise<NotificationItem[]> => {
    const res = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications');
    return res.data.data;
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications/unread-count');
    return res.data.data.unreadCount;
  },
  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },
};
