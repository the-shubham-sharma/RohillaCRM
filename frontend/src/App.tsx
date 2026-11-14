import React, { useState, useEffect } from 'react';
import { useAuth } from './shared/context/AuthContext';
import { useRouter } from './shared/hooks/useRouter';
import { Gateway } from './features/gateway/Gateway';
import { CustomerQuote } from './features/lead/CustomerQuote';
import { EmployeeLogin } from './features/auth/EmployeeLogin';
import { Navbar } from './shared/components/Navbar';
import { Sidebar } from './shared/components/Sidebar';
import { Dashboard } from './features/dashboard/Dashboard';
import { ProjectsList } from './features/project/ProjectsList';
import { ProjectDetailPage } from './features/project/ProjectDetail';
import { AuditLogs } from './features/audit/AuditLogs';
import { UserManagement } from './features/employee/UserManagement';
import { ProfilePage } from './features/employee/ProfilePage';
import { LeadsManagement } from './features/lead/LeadsManagement';
import { FrontOfficeManagement } from './features/enquiry/FrontOfficeManagement';
import { InventoryManagement } from './features/inventory/InventoryManagement';
import { MustChangePasswordModal } from './features/auth/MustChangePasswordModal';
import { getDashboardRouteForRoles, isRoleDashboardPath } from './shared/utils/roles';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const { path, navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);
  const isInventoryAllowed = isPrivileged || hasRole('ROLE_PRODUCTION');

  // Sync route path to internal tab when authenticated
  useEffect(() => {
    const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
    
    if (isRoleDashboardPath(cleanPath)) {
      setActiveTab('dashboard');
      setSelectedProjectId(null);
    } else if (cleanPath === '/history') {
      setActiveTab('history');
      setSelectedProjectId(null);
    } else if (cleanPath === '/projects' && isPrivileged) {
      setActiveTab('projects');
      setSelectedProjectId(null);
    } else if (cleanPath === '/leads' && isPrivileged) {
      setActiveTab('leads');
      setSelectedProjectId(null);
    } else if (cleanPath === '/front-office' && isPrivileged) {
      setActiveTab('front-office');
      setSelectedProjectId(null);
    } else if (cleanPath === '/enquiries' && isPrivileged) {
      setActiveTab('front-office');
      setSelectedProjectId(null);
    } else if (cleanPath === '/inventory' && isInventoryAllowed) {
      setActiveTab('inventory');
      setSelectedProjectId(null);
    } else if (cleanPath === '/users' && isPrivileged) {
      setActiveTab('users');
      setSelectedProjectId(null);
    } else if (cleanPath === '/audit-logs' && hasRole('ROLE_ADMIN')) {
      setActiveTab('audit-logs');
      setSelectedProjectId(null);
    } else if (cleanPath === '/profile') {
      setActiveTab('profile');
      setSelectedProjectId(null);
    }
  }, [path, isPrivileged, isInventoryAllowed, hasRole]);

  // If already authenticated and visiting login or gateway, redirect to role dashboard
  useEffect(() => {
    const cleanPath = path.toLowerCase().replace(/\/+$/, '') || '/';
    if (!isLoading && isAuthenticated && user && (cleanPath === '/employee-login' || cleanPath === '/login')) {
      const targetRoute = getDashboardRouteForRoles(user.roles);
      navigate(targetRoute);
    }
  }, [isLoading, isAuthenticated, user, path, navigate]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <RefreshCw size={36} className="spin" color="var(--primary)" />
        <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Initializing Rohilla Advertising CRM...
        </p>
      </div>
    );
  }

  // Normalize current path
  const normalizedPath = path.toLowerCase().replace(/\/+$/, '') || '/';

  // 1. Dedicated Customer Quote Page (/customer-quote or /quote)
  if (normalizedPath === '/customer-quote' || normalizedPath === '/quote') {
    return <CustomerQuote onNavigate={navigate} />;
  }

  // 2. Dedicated Employee Login Page (/employee-login or /login)
  if (normalizedPath === '/employee-login' || normalizedPath === '/login') {
    if (isAuthenticated && user) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
          <RefreshCw size={36} className="spin" color="var(--primary)" />
          <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Entering CRM Workspace...
          </p>
        </div>
      );
    }
    return <EmployeeLogin onNavigate={navigate} />;
  }

  // 3. Entry Gateway (/)
  if (normalizedPath === '/') {
    return <Gateway onNavigate={navigate} />;
  }

  // 4. Protected Internal CRM Routes
  // If not authenticated and trying to access internal routes, show employee login
  if (!isAuthenticated) {
    return <EmployeeLogin onNavigate={navigate} />;
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const handleNavigateToProjects = () => {
    if (isPrivileged) {
      setActiveTab('projects');
      setSelectedProjectId(null);
      navigate('/projects');
    }
  };

  const handleOpenProfile = () => {
    setActiveTab('profile');
    setSelectedProjectId(null);
    navigate('/profile');
  };

  const handleSidebarTabChange = (tab: string) => {
    // Only allow tab change if authorized
    if ((tab === 'projects' || tab === 'leads' || tab === 'users' || tab === 'front-office') && !isPrivileged) {
      return;
    }
    if (tab === 'inventory' && !isInventoryAllowed) {
      return;
    }
    if (tab === 'audit-logs' && !hasRole('ROLE_ADMIN')) {
      return;
    }
    setActiveTab(tab);
    setSelectedProjectId(null);
    if (tab === 'dashboard' && user) {
      navigate(getDashboardRouteForRoles(user.roles));
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleNotificationNavigate = (targetPath: string) => {
    const cleanPath = targetPath.toLowerCase().replace(/\/+$/, '') || '/';
    if (cleanPath.startsWith('/projects/')) {
      const pId = targetPath.substring('/projects/'.length).trim();
      if (pId) {
        handleSelectProject(pId);
        return;
      }
    }
    
    if (cleanPath === '/leads' && isPrivileged) {
      setActiveTab('leads');
      setSelectedProjectId(null);
      navigate('/leads');
    } else if (cleanPath === '/history') {
      setActiveTab('history');
      setSelectedProjectId(null);
      navigate('/history');
    } else if (cleanPath === '/projects' && isPrivileged) {
      setActiveTab('projects');
      setSelectedProjectId(null);
      navigate('/projects');
    } else if ((cleanPath === '/front-office' || cleanPath === '/enquiries') && isPrivileged) {
      setActiveTab('front-office');
      setSelectedProjectId(null);
      navigate('/front-office');
    } else if (cleanPath === '/inventory' && isInventoryAllowed) {
      setActiveTab('inventory');
      setSelectedProjectId(null);
      navigate('/inventory');
    } else if (cleanPath === '/users' && isPrivileged) {
      setActiveTab('users');
      setSelectedProjectId(null);
      navigate('/users');
    } else if (cleanPath === '/audit-logs' && hasRole('ROLE_ADMIN')) {
      setActiveTab('audit-logs');
      setSelectedProjectId(null);
      navigate('/audit-logs');
    } else if (cleanPath === '/profile') {
      setActiveTab('profile');
      setSelectedProjectId(null);
      navigate('/profile');
    } else {
      setActiveTab('dashboard');
      setSelectedProjectId(null);
      if (user) {
        navigate(getDashboardRouteForRoles(user.roles));
      }
    }
  };

  return (
    <div className="app-container">
      <MustChangePasswordModal />
      <Navbar
        onOpenProfile={handleOpenProfile}
        onSelectProject={handleSelectProject}
        onNavigate={handleNotificationNavigate}
      />
      <div className="app-main-layout">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleSidebarTabChange}
        />
        <main className="main-content">
          {selectedProjectId ? (
            <ProjectDetailPage
              projectId={selectedProjectId}
              onBack={handleBackToProjects}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <Dashboard
                  initialView="workstation"
                  onSelectProject={handleSelectProject}
                  onNavigateToProjects={handleNavigateToProjects}
                />
              )}

              {activeTab === 'history' && (
                isPrivileged ? (
                  <ProjectsList
                    initialView="history"
                    onSelectProject={handleSelectProject}
                  />
                ) : (
                  <Dashboard
                    initialView="history"
                    onSelectProject={handleSelectProject}
                    onNavigateToProjects={handleNavigateToProjects}
                  />
                )
              )}

              {activeTab === 'profile' && <ProfilePage />}

              {activeTab === 'front-office' && isPrivileged && (
                <FrontOfficeManagement onSelectProject={handleSelectProject} />
              )}

              {activeTab === 'leads' && isPrivileged && (
                <LeadsManagement onSelectProject={handleSelectProject} />
              )}

              {activeTab === 'projects' && isPrivileged && (
                <ProjectsList
                  initialView="active"
                  onSelectProject={handleSelectProject}
                />
              )}

              {activeTab === 'inventory' && isInventoryAllowed && (
                <InventoryManagement />
              )}

              {activeTab === 'audit-logs' && hasRole('ROLE_ADMIN') && <AuditLogs />}
              {activeTab === 'users' && isPrivileged && <UserManagement />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
