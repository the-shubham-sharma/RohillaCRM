import { RoleType } from '../types';

/**
 * Single Source of Truth for Role-Based Dashboard Routes in Rohilla CRM.
 * ADMIN      -> /admin
 * MANAGER    -> /manager
 * DESIGNER   -> /designer
 * PRODUCTION -> /production
 * QC         -> /qc
 * DISPATCH   -> /dispatch
 */
export const ROLE_DASHBOARD_ROUTES: Record<RoleType, string> = {
  ROLE_ADMIN: '/admin',
  ROLE_MANAGER: '/manager',
  ROLE_DESIGNER: '/designer',
  ROLE_PRODUCTION: '/production',
  ROLE_QC: '/qc',
  ROLE_DISPATCH: '/dispatch',
};

/**
 * Resolves the primary dashboard route for a list of user roles.
 */
export const getDashboardRouteForRoles = (roles?: RoleType[] | null): string => {
  if (!roles || roles.length === 0) return '/admin';
  if (roles.includes('ROLE_ADMIN')) return ROLE_DASHBOARD_ROUTES.ROLE_ADMIN;
  if (roles.includes('ROLE_MANAGER')) return ROLE_DASHBOARD_ROUTES.ROLE_MANAGER;
  if (roles.includes('ROLE_DESIGNER')) return ROLE_DASHBOARD_ROUTES.ROLE_DESIGNER;
  if (roles.includes('ROLE_PRODUCTION')) return ROLE_DASHBOARD_ROUTES.ROLE_PRODUCTION;
  if (roles.includes('ROLE_QC')) return ROLE_DASHBOARD_ROUTES.ROLE_QC;
  if (roles.includes('ROLE_DISPATCH')) return ROLE_DASHBOARD_ROUTES.ROLE_DISPATCH;
  return '/admin';
};

/**
 * Checks whether a given path is a valid role dashboard route.
 */
export const isRoleDashboardPath = (path: string): boolean => {
  const clean = path.toLowerCase().replace(/\/+$/, '') || '/';
  return ['/admin', '/manager', '/designer', '/production', '/qc', '/dispatch', '/dashboard'].includes(clean);
};
