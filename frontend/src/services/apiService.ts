import { authApi } from './api/authApi';
import { projectApi } from './api/projectApi';
import { clientApi } from './api/clientApi';
import { workspaceApi } from './api/workspaceApi';
import { auditApi } from './api/auditApi';
import { employeeApi } from './api/employeeApi';
import { leadApi } from './api/leadApi';
import { notificationApi } from './api/notificationApi';

export * from './api';

export const authService = authApi;
export const projectService = projectApi;
export const clientService = clientApi;
export const workspaceService = workspaceApi;
export const auditService = auditApi;
export const userService = {
  getAllUsers: employeeApi.getAllUsers,
  createUser: employeeApi.createUser,
  updateStatus: employeeApi.updateStatus,
  resetPassword: employeeApi.resetPassword,
};
export const profileService = employeeApi;
export const leadService = leadApi;
export const notificationService = notificationApi;
