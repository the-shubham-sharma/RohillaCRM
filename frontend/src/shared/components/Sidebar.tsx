import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, ShieldAlert, Users, User, History, Inbox, ClipboardList, Package } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, hasRole } = useAuth();

  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);
  const isDesigner = hasRole('ROLE_DESIGNER');
  const isProduction = hasRole('ROLE_PRODUCTION');
  const isQc = hasRole('ROLE_QC');
  const isDispatch = hasRole('ROLE_DISPATCH');

  const getDashboardLabel = () => {
    if (isDesigner) return 'Designer Studio';
    if (isProduction) return 'Production Floor';
    if (isQc) return 'QC Workstation';
    if (isDispatch) return 'Dispatch & Logistics';
    return 'Company Dashboard';
  };

  const navItems = [
    {
      id: 'dashboard',
      label: getDashboardLabel(),
      icon: <LayoutDashboard size={16} />,
      visible: true,
    },
    {
      id: 'history',
      label: 'My History & Records',
      icon: <History size={16} />,
      visible: true,
    },
    {
      id: 'profile',
      label: 'My Profile & KYC',
      icon: <User size={16} />,
      visible: true,
    },
    {
      id: 'front-office',
      label: 'Front Office Enquiries',
      icon: <ClipboardList size={16} />,
      visible: isPrivileged, // Admin & Manager Front Office Desk
    },
    {
      id: 'leads',
      label: 'Customer Leads',
      icon: <Inbox size={16} />,
      visible: isPrivileged, // Admin & Manager only
    },
    {
      id: 'projects',
      label: 'Projects & Pipeline',
      icon: <FolderKanban size={16} />,
      visible: isPrivileged, // Strictly restricted to Admin & Manager only
    },
    {
      id: 'inventory',
      label: 'Inventory & Materials',
      icon: <Package size={16} />,
      visible: isPrivileged || isProduction, // Admin, Manager, Production
    },
    {
      id: 'users',
      label: 'Employees & Access',
      icon: <Users size={16} />,
      visible: isPrivileged, // Admin and Manager
    },
    {
      id: 'audit-logs',
      label: 'Tamper Audit Logs',
      icon: <ShieldAlert size={16} />,
      visible: hasRole('ROLE_ADMIN'), // Admin only
    },
  ];

  return (
    <aside
      style={{
        width: '240px',
        background: '#FFFFFF',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem',
        height: '100%',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ padding: '0.4rem 0.65rem', fontSize: '11px', fontWeight: 600, color: '#888888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {isPrivileged ? 'Enterprise Management' : 'My Workstation'}
        </div>

        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '3px',
                  background: isActive ? '#F5F5F5' : 'transparent',
                  color: '#000000',
                  borderLeft: isActive ? '3px solid #000000' : '3px solid transparent',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.1s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = '#FAFAFA';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ color: isActive ? '#000000' : '#666666', display: 'flex', alignItems: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
      </div>

      {/* Security Health Indicator Card */}
      <div
        style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000000' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#000000' }}>
            {user?.roles.includes('ROLE_ADMIN') ? 'Owner Security Active' : 'Role Access Enforced'}
          </span>
        </div>
        <p style={{ fontSize: '11px', color: '#666666', lineHeight: 1.35, margin: 0 }}>
          {isPrivileged 
            ? 'Pipeline, audit logging, and role policies enforced.'
            : 'Department isolation and work-scoped access enforced.'}
        </p>
      </div>
    </aside>
  );
};
