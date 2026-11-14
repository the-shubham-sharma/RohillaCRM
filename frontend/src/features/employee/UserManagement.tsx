import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { UserSummary, ApiResponse, DepartmentType, RoleType, UserStatus, UserProfile } from '../../shared/types';
import { apiClient } from '../../services/api/client';
import { profileService } from '../../services/apiService';
import { DepartmentWorkCard } from '../../shared/components/DepartmentWorkCard';
import {
  Users,
  UserPlus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Palette,
  Hammer,
  ShieldCheck,
  Truck,
  Search,
  Filter,
  Lock,
  Eye,
  FileText,
  Check,
  XCircle,
  Download,
  Phone,
  Mail,
  MapPin,
  Shield,
  UserCheck,
  Clock
} from 'lucide-react';

interface OperationalRoleOption {
  role: RoleType;
  department: DepartmentType;
  label: string;
  departmentLabel: string;
  icon: React.ReactNode;
}

const OPERATIONAL_ROLES: OperationalRoleOption[] = [
  {
    role: 'ROLE_DESIGNER',
    department: 'DESIGN',
    label: 'Designer',
    departmentLabel: 'Design Studio',
    icon: <Palette size={16} color="#000000" />,
  },
  {
    role: 'ROLE_PRODUCTION',
    department: 'PRODUCTION',
    label: 'Production',
    departmentLabel: 'Fabrication & Print',
    icon: <Hammer size={16} color="#000000" />,
  },
  {
    role: 'ROLE_QC',
    department: 'QUALITY_CONTROL',
    label: 'QC Inspector',
    departmentLabel: 'Quality Control',
    icon: <ShieldCheck size={16} color="#000000" />,
  },
  {
    role: 'ROLE_DISPATCH',
    department: 'DISPATCH',
    label: 'Dispatch Lead',
    departmentLabel: 'Logistics & Delivery',
    icon: <Truck size={16} color="#000000" />,
  },
];

export const UserManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'ALL' | DepartmentType>('ALL');

  // Modal State for New Employee
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoleType, setSelectedRoleType] = useState<RoleType>('ROLE_DESIGNER');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('ACTIVE');

  // Success / Credentials Modal State
  const [createdEmployee, setCreatedEmployee] = useState<UserSummary | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<UserSummary[]>>('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    const selectedOption = OPERATIONAL_ROLES.find((o) => o.role === selectedRoleType);
    const department: DepartmentType = selectedOption ? selectedOption.department : 'DESIGN';

    try {
      const res = await apiClient.post<ApiResponse<UserSummary>>('/users', {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        department,
        roles: [selectedRoleType],
        status: selectedStatus,
      });

      const newUserData = res.data.data;
      setCreatedEmployee(newUserData);
      setIsCreateModalOpen(false);

      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setSelectedRoleType('ROLE_DESIGNER');
      setSelectedStatus('ACTIVE');

      fetchUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to onboard employee account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await apiClient.patch(`/users/${userId}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  // Profile & KYC Modal State
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const isAdmin = hasRole(['ROLE_ADMIN']);

  const handleOpenProfileModal = async (userId: string) => {
    setSelectedProfileUserId(userId);
    setProfileData(null);
    setProfileError(null);
    setRejectingDocId(null);
    setRejectionReason('');
    setIsProfileLoading(true);

    try {
      const data = await profileService.getEmployeeProfile(userId);
      setProfileData(data);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to load employee profile details');
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleVerifyKyc = async (documentId: string, status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    if (!selectedProfileUserId) return;
    if (status === 'REJECTED' && (!reason || !reason.trim())) {
      alert('Please provide a mandatory reason for document rejection.');
      return;
    }

    setIsVerifying(true);
    try {
      await profileService.verifyDocument(selectedProfileUserId, documentId, {
        status,
        rejectionReason: reason ? reason.trim() : undefined,
      });

      // Reload profile & user list
      const updated = await profileService.getEmployeeProfile(selectedProfileUserId);
      setProfileData(updated);
      setRejectingDocId(null);
      setRejectionReason('');
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to update document status to ${status}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadDocument = async (documentId: string, fileName?: string) => {
    if (!selectedProfileUserId) return;
    try {
      await profileService.downloadDocumentBlob(documentId, selectedProfileUserId, fileName);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download document file');
    }
  };

  const renderKycBadge = (status?: string) => {
    const s = status || 'NOT_UPLOADED';
    let bg = 'rgba(156, 163, 175, 0.15)';
    let color = '#9ca3af';
    let border = 'rgba(156, 163, 175, 0.3)';

    if (s === 'VERIFIED') {
      bg = 'rgba(52, 211, 153, 0.15)';
      color = '#34d399';
      border = 'rgba(52, 211, 153, 0.3)';
    } else if (s === 'UPLOADED' || s === 'UNDER_REVIEW') {
      bg = 'rgba(251, 191, 36, 0.15)';
      color = '#fbbf24';
      border = 'rgba(251, 191, 36, 0.3)';
    } else if (s === 'REJECTED') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = '#f87171';
      border = 'rgba(239, 68, 68, 0.3)';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 7px',
          fontSize: '0.6875rem',
          fontWeight: 700,
          borderRadius: '4px',
          background: bg,
          color: color,
          border: `1px solid ${border}`,
        }}
      >
        {s === 'VERIFIED' && <Check size={10} />}
        {s === 'REJECTED' && <XCircle size={10} />}
        {(s === 'UPLOADED' || s === 'UNDER_REVIEW') && <Clock size={10} />}
        {s.replace('_', ' ')}
      </span>
    );
  };

  const handleCopyCredentials = () => {
    if (createdEmployee?.temporaryPassword) {
      navigator.clipboard.writeText(createdEmployee.temporaryPassword);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2500);
    }
  };

  if (!isPrivileged) {
    return (
      <div className="page-wrapper">
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h3>Authorization Required</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Only Administrators and Managers are authorized to access employee management and task staffing.
          </p>
        </div>
      </div>
    );
  }

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchesDept = departmentFilter === 'ALL' || u.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Grouped active employees by department for fast assignment visibility
  const designers = users.filter(
    (u) => u.status === 'ACTIVE' && (u.department === 'DESIGN' || u.roles.includes('ROLE_DESIGNER'))
  );
  const productionStaff = users.filter(
    (u) => u.status === 'ACTIVE' && (u.department === 'PRODUCTION' || u.roles.includes('ROLE_PRODUCTION'))
  );
  const qcStaff = users.filter(
    (u) => u.status === 'ACTIVE' && (u.department === 'QUALITY_CONTROL' || u.roles.includes('ROLE_QC'))
  );
  const dispatchStaff = users.filter(
    (u) => u.status === 'ACTIVE' && (u.department === 'DISPATCH' || u.roles.includes('ROLE_DISPATCH'))
  );

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>
            Employee Onboarding &amp; Staff Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Create operational staff, generate secure temporary passwords, and monitor active departmental assignees
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchUsers} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-sm">
            <UserPlus size={16} /> Onboard Employee
          </button>
        </div>
      </div>

      {/* SECTION 1: Active Operational Employees Grouped for Manager */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--secondary)" /> ACTIVE OPERATIONAL STAFF BY DEPARTMENT
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Available for project task assignments
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <DepartmentWorkCard
            title="DESIGNERS"
            icon={<Palette size={16} color="#000000" />}
            accentColor="#000000"
            badgeClassName="badge-neutral"
            activeCount={designers.length}
            members={designers}
            emptyText="No active designers onboarded"
          />

          <DepartmentWorkCard
            title="PRODUCTION"
            icon={<Hammer size={16} color="#000000" />}
            accentColor="#000000"
            badgeClassName="badge-neutral"
            activeCount={productionStaff.length}
            members={productionStaff}
            emptyText="No active production staff"
          />

          <DepartmentWorkCard
            title="QC INSPECTION"
            icon={<ShieldCheck size={16} color="#000000" />}
            accentColor="#000000"
            badgeClassName="badge-neutral"
            activeCount={qcStaff.length}
            members={qcStaff}
            emptyText="No active QC inspectors"
          />

          <DepartmentWorkCard
            title="DISPATCH & INSTALL"
            icon={<Truck size={16} color="#000000" />}
            accentColor="#000000"
            badgeClassName="badge-neutral"
            activeCount={dispatchStaff.length}
            members={dispatchStaff}
            emptyText="No active dispatch officers"
          />
        </div>
      </div>

      {/* SECTION 2: Search and Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="var(--text-dim)" />
          <select
            className="form-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value as any)}
            style={{ minWidth: '180px' }}
          >
            <option value="ALL">All Departments</option>
            <option value="DESIGN">Design Studio</option>
            <option value="PRODUCTION">Production Floor</option>
            <option value="QUALITY_CONTROL">Quality Control</option>
            <option value="DISPATCH">Dispatch &amp; Delivery</option>
            <option value="MANAGEMENT">Management</option>
          </select>
        </div>
      </div>

      {/* SECTION 3: All Employees Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>EMP ID</th>
              <th>Full Name</th>
              <th>Login Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>KYC Status</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  No employee records matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isOwner = u.roles?.some((r) => r === 'ROLE_ADMIN' || r === ('ROLE_ADMIN' as RoleType));
                return (
                  <tr key={u.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'var(--primary-glow)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                        }}
                      >
                        {u.employeeId || 'EMP-0000'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{u.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                        {u.email}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--secondary)', fontWeight: 600 }}>
                        {u.department}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-draft">{u.roles[0]?.replace('ROLE_', '')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-dim)', width: '48px' }}>Aadhaar:</span>
                          {renderKycBadge(u.aadhaarStatus)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                          <span style={{ color: 'var(--text-dim)', width: '48px' }}>PAN:</span>
                          {renderKycBadge(u.panStatus)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          padding: '3px 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          borderRadius: '9999px',
                          background:
                            u.status === 'ACTIVE'
                              ? 'rgba(52, 211, 153, 0.15)'
                              : u.status === 'SUSPENDED'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(156, 163, 175, 0.15)',
                          color:
                            u.status === 'ACTIVE'
                              ? '#4ade80'
                              : u.status === 'SUSPENDED'
                              ? '#f87171'
                              : '#9ca3af',
                          border: `1px solid ${
                            u.status === 'ACTIVE'
                              ? 'rgba(52, 211, 153, 0.3)'
                              : u.status === 'SUSPENDED'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'rgba(156, 163, 175, 0.3)'
                          }`,
                        }}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenProfileModal(u.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          title="View Profile & KYC Documents"
                        >
                          <Eye size={13} /> Profile / KYC
                        </button>

                        {isOwner ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: '#818cf8',
                              background: 'rgba(99, 102, 241, 0.15)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            Owner
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            className={`btn btn-sm ${u.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE EMPLOYEE MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Onboard Operational Employee</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Creates account with an auto-generated Argon2id temporary password
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email / Login ID</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul@rohilla.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Department / Operational Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {OPERATIONAL_ROLES.map((opt) => {
                    const isSelected = selectedRoleType === opt.role;
                    return (
                      <div
                        key={opt.role}
                        onClick={() => setSelectedRoleType(opt.role)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card)',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {opt.icon}
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                            {opt.label}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {opt.departmentLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Status</label>
                <select
                  className="form-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as UserStatus)}
                >
                  <option value="ACTIVE">ACTIVE — Can log in &amp; receive task assignments</option>
                  <option value="INACTIVE">INACTIVE — Onboarding in draft</option>
                  <option value="SUSPENDED">SUSPENDED — Locked out</option>
                </select>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-card)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '0.5rem',
                }}
              >
                <Lock size={14} color="var(--primary)" />
                <span>
                  A high-entropy temporary password will be created with mandatory change on first login.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Provisioning...' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS PROVISIONED SUCCESS MODAL */}
      {createdEmployee && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(52, 211, 153, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                }}
              >
                <CheckCircle2 size={28} color="#34d399" />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Employee Account Provisioned!</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Please provide these temporary login credentials to the employee.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Employee Name</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{createdEmployee.fullName}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Login ID / Email</div>
                <div style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>
                  {createdEmployee.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Role &amp; Department</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {createdEmployee.roles[0]?.replace('ROLE_', '')} ({createdEmployee.department})
                </div>
              </div>

              {createdEmployee.temporaryPassword && (
                <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '0.85rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Temporary Password (Argon2 Hashed)
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    <code style={{ fontSize: '1rem', color: 'var(--warning)', fontWeight: 700 }}>
                      {createdEmployee.temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                    >
                      {copiedPassword ? <CheckCircle2 size={13} color="#34d399" /> : <Copy size={13} />}
                      {copiedPassword ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                marginBottom: '1.25rem',
              }}
            >
              <KeyRound size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
              <span>
                Employee will be forced to change this password on their first login before accessing normal work screens.
              </span>
            </div>

            <button
              onClick={() => setCreatedEmployee(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* EMPLOYEE PROFILE & KYC VERIFICATION MODAL */}
      {selectedProfileUserId && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <UserCheck size={22} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    Employee Profile &amp; KYC Verification
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    Review employee records, verified identity credentials, and KYC status
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProfileUserId(null);
                  setProfileData(null);
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
                className="btn btn-outline btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            {isProfileLoading && (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading employee profile &amp; KYC records...</p>
              </div>
            )}

            {profileError && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={18} />
                <span>{profileError}</span>
              </div>
            )}

            {profileData && !isProfileLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Employee Header Card */}
                <div
                  className="glass-card"
                  style={{
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        color: '#fff',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      }}
                    >
                      {profileData.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{profileData.fullName}</h4>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            background: 'var(--primary-glow)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          {profileData.employeeId}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{profileData.department}</span>
                        <span>•</span>
                        <span>{profileData.roles[0]?.replace('ROLE_', '')}</span>
                        <span>•</span>
                        <span>Joined: {profileData.joiningDate || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '4px 12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        borderRadius: '9999px',
                        background: profileData.status === 'ACTIVE' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: profileData.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                        border: `1px solid ${profileData.status === 'ACTIVE' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}
                    >
                      {profileData.status}
                    </span>
                  </div>
                </div>

                {/* Contact & Personal Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Mail size={13} color="var(--primary)" /> Login Email
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', fontWeight: 600 }}>
                      {profileData.email}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone size={13} color="var(--primary)" /> Phone Number
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {profileData.phone || 'Not provided'}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={13} color="var(--primary)" /> Address
                    </div>
                    <div style={{ fontSize: '0.85rem', color: profileData.address ? 'var(--text-main)' : 'var(--text-dim)' }}>
                      {profileData.address || 'No address on file'}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Shield size={13} color="var(--primary)" /> Emergency Contact
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                      {profileData.emergencyContactName ? (
                        <div>
                          <strong>{profileData.emergencyContactName}</strong>{' '}
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({profileData.emergencyContactRelation || 'Contact'})</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{profileData.emergencyContactPhone}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Identity & KYC Verification Section */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="var(--primary)" /> Identity &amp; KYC Documents
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {/* Aadhaar Document Card */}
                    {(() => {
                      const aadhaarDoc = profileData.documents?.find((d) => d.documentType === 'AADHAAR' && d.current);
                      const status = aadhaarDoc ? aadhaarDoc.status : 'NOT_UPLOADED';

                      return (
                        <div
                          className="glass-card"
                          style={{
                            padding: '1.25rem',
                            border: aadhaarDoc && aadhaarDoc.status === 'VERIFIED' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-subtle)',
                            background: 'rgba(255, 255, 255, 0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} color="var(--primary)" />
                              <strong style={{ fontSize: '0.95rem' }}>Aadhaar Card</strong>
                            </div>
                            {renderKycBadge(status)}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-dim)' }}>Document Number: </span>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                                {aadhaarDoc?.documentNumberMasked || 'Not Provided'}
                              </strong>
                            </div>

                            {aadhaarDoc ? (
                              <>
                                <div>
                                  <span style={{ color: 'var(--text-dim)' }}>File: </span>
                                  <span>{aadhaarDoc.originalFileName} ({aadhaarDoc.fileSize ? `${(aadhaarDoc.fileSize / 1024).toFixed(1)} KB` : 'PDF/Img'})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Uploaded: {aadhaarDoc.uploadedAt ? new Date(aadhaarDoc.uploadedAt).toLocaleString() : '—'} (v{aadhaarDoc.version})
                                </div>

                                {aadhaarDoc.verifiedByName && (
                                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                                    Verified by: {aadhaarDoc.verifiedByName}
                                  </div>
                                )}

                                {aadhaarDoc.rejectionReason && (
                                  <div
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      borderRadius: '4px',
                                      color: '#f87171',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <strong>Rejection Reason:</strong> {aadhaarDoc.rejectionReason}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                No Aadhaar document uploaded yet by employee.
                              </div>
                            )}
                          </div>

                          {/* Document Actions */}
                          {aadhaarDoc && (
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(aadhaarDoc.id, aadhaarDoc.originalFileName)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                >
                                  <Download size={13} /> Download File
                                </button>

                                {isAdmin && aadhaarDoc.status !== 'VERIFIED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyKyc(aadhaarDoc.id, 'VERIFIED')}
                                    disabled={isVerifying}
                                    className="btn btn-success btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <Check size={13} /> Verify Aadhaar
                                  </button>
                                )}

                                {isAdmin && aadhaarDoc.status !== 'REJECTED' && rejectingDocId !== aadhaarDoc.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingDocId(aadhaarDoc.id);
                                      setRejectionReason('');
                                    }}
                                    className="btn btn-danger btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                )}
                              </div>

                              {/* Reject Reason Form */}
                              {rejectingDocId === aadhaarDoc.id && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', border: '1px solid #FEB2B2' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626', display: 'block', marginBottom: '0.3rem' }}>
                                    Mandatory Rejection Reason:
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Unclear blurred image, name mismatch"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setRejectingDocId(null)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyKyc(aadhaarDoc.id, 'REJECTED', rejectionReason)}
                                      disabled={isVerifying || !rejectionReason.trim()}
                                      className="btn btn-danger btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      {isVerifying ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* PAN Document Card */}
                    {(() => {
                      const panDoc = profileData.documents?.find((d) => d.documentType === 'PAN' && d.current);
                      const status = panDoc ? panDoc.status : 'NOT_UPLOADED';

                      return (
                        <div
                          className="glass-card"
                          style={{
                            padding: '1.25rem',
                            border: panDoc && panDoc.status === 'VERIFIED' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-subtle)',
                            background: 'rgba(255, 255, 255, 0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <FileText size={18} color="var(--secondary)" />
                              <strong style={{ fontSize: '0.95rem' }}>PAN Card</strong>
                            </div>
                            {renderKycBadge(status)}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                            <div>
                              <span style={{ color: 'var(--text-dim)' }}>Document Number: </span>
                              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                                {panDoc?.documentNumberMasked || 'Not Provided'}
                              </strong>
                            </div>

                            {panDoc ? (
                              <>
                                <div>
                                  <span style={{ color: 'var(--text-dim)' }}>File: </span>
                                  <span>{panDoc.originalFileName} ({panDoc.fileSize ? `${(panDoc.fileSize / 1024).toFixed(1)} KB` : 'PDF/Img'})</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                  Uploaded: {panDoc.uploadedAt ? new Date(panDoc.uploadedAt).toLocaleString() : '—'} (v{panDoc.version})
                                </div>

                                {panDoc.verifiedByName && (
                                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>
                                    Verified by: {panDoc.verifiedByName}
                                  </div>
                                )}

                                {panDoc.rejectionReason && (
                                  <div
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      borderRadius: '4px',
                                      color: '#f87171',
                                      fontSize: '0.75rem',
                                    }}
                                  >
                                    <strong>Rejection Reason:</strong> {panDoc.rejectionReason}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                                No PAN document uploaded yet by employee.
                              </div>
                            )}
                          </div>

                          {/* Document Actions */}
                          {panDoc && (
                            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(panDoc.id, panDoc.originalFileName)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                >
                                  <Download size={13} /> Download File
                                </button>

                                {isAdmin && panDoc.status !== 'VERIFIED' && (
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyKyc(panDoc.id, 'VERIFIED')}
                                    disabled={isVerifying}
                                    className="btn btn-success btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <Check size={13} /> Verify PAN
                                  </button>
                                )}

                                {isAdmin && panDoc.status !== 'REJECTED' && rejectingDocId !== panDoc.id && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRejectingDocId(panDoc.id);
                                      setRejectionReason('');
                                    }}
                                    className="btn btn-danger btn-sm"
                                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                )}
                              </div>

                              {/* Reject Reason Form */}
                              {rejectingDocId === panDoc.id && (
                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFF5F5', borderRadius: 'var(--radius-sm)', border: '1px solid #FEB2B2' }}>
                                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626', display: 'block', marginBottom: '0.3rem' }}>
                                    Mandatory Rejection Reason:
                                  </label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. Incomplete scan, document expired"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', marginBottom: '0.5rem' }}
                                  />
                                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      onClick={() => setRejectingDocId(null)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyKyc(panDoc.id, 'REJECTED', rejectionReason)}
                                      disabled={isVerifying || !rejectionReason.trim()}
                                      className="btn btn-danger btn-sm"
                                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                    >
                                      {isVerifying ? 'Rejecting...' : 'Confirm Reject'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setSelectedProfileUserId(null);
                      setProfileData(null);
                    }}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
