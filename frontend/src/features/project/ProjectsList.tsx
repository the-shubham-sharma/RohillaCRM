import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { ProjectListItem, Client, UserSummary, ApiResponse, Priority, DateFilterPeriod } from '../../shared/types';
import { apiClient } from '../../services/api/client';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DateFilterBar } from '../../shared/components/DateFilterBar';
import { ClientSelector, ClientDataState } from '../enquiry/components/ClientSelector';
import { ClientRequirementChecklist } from '../enquiry/components/ClientRequirementChecklist';
import { EnquiryLineItemRequest, EnquiryResponseDto } from '../../shared/types';
import { enquiryApi } from '../../services/api';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  FolderKanban,
  History,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ArrowUpRight,
  AlertCircle
} from 'lucide-react';

interface ProjectsListProps {
  initialView?: 'active' | 'history';
  onSelectProject: (projectId: string) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({ initialView = 'active', onSelectProject }) => {
  const { hasRole } = useAuth();
  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);

  // Tab State: 'active' | 'history'
  const [viewTab, setViewTab] = useState<'active' | 'history'>(initialView);

  useEffect(() => {
    if (initialView) {
      setViewTab(initialView);
    }
  }, [initialView]);

  // Active Projects State
  const [activeProjects, setActiveProjects] = useState<ProjectListItem[]>([]);
  // Completed History Projects State
  const [historyProjects, setHistoryProjects] = useState<ProjectListItem[]>([]);

  const [clients, setClients] = useState<Client[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Tab Filters
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [activePathFilter, setActivePathFilter] = useState<string>('ALL');

  // History Tab Filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyPathFilter, setHistoryPathFilter] = useState<string>('ALL');
  const [historyStaffFilter, setHistoryStaffFilter] = useState<string>('ALL');
  const [historySortOrder, setHistorySortOrder] = useState<'NEWEST_FIRST' | 'OLDEST_FIRST'>('NEWEST_FIRST');
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterPeriod>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});



  // Front Office Enquiry Pre-fill Integration
  const [submittedEnquiries, setSubmittedEnquiries] = useState<EnquiryResponseDto[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>('');
  const [lineItems, setLineItems] = useState<EnquiryLineItemRequest[]>([]);
  const [clientData, setClientData] = useState<ClientDataState>({
    mode: 'existing',
    clientName: '',
    companyName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    gstNumber: '',
  });

  const handleSelectEnquiryToConvert = (enquiryId: string) => {
    setSelectedEnquiryId(enquiryId);
    if (!enquiryId) return;

    const enq = submittedEnquiries.find((e) => e.id === enquiryId);
    if (!enq) return;

    setClientData({
      mode: enq.client ? 'existing' : 'new',
      selectedClientId: enq.client?.id,
      clientName: enq.clientName,
      companyName: enq.companyName || enq.clientName,
      phone: enq.phone,
      alternatePhone: enq.alternatePhone || '',
      email: enq.email || '',
      address: enq.address,
      gstNumber: enq.gstNumber || '',
    });

    const mainServiceName = enq.lineItems[0]?.serviceName || 'Advertising Project';
    setTitle(`${mainServiceName} - ${enq.companyName || enq.clientName}`);
    setDescription(`Converted from Front Office Enquiry ${enq.enquiryNumber}. Client: ${enq.clientName} (${enq.phone}). ${enq.customerRemarks ? 'Remarks: ' + enq.customerRemarks : ''}`);

    if (enq.priority === 'EMERGENCY') setPriority('URGENT');
    else if (enq.priority === 'URGENT') setPriority('HIGH');
    else setPriority('MEDIUM');

    setCustomerProvidedDesign(enq.designStatus === 'CLIENT_PROVIDED');
    setInstallationRequired(enq.lineItems.some((i) => i.installationRequired));
    if (enq.expectedCompletionDate) setDueDate(enq.expectedCompletionDate);
    if (enq.estimatedAmount) setBudget(enq.estimatedAmount.toString());

    setLineItems(
      enq.lineItems.map((li) => ({
        serviceName: li.serviceName,
        width: li.width,
        height: li.height,
        dimensionUnit: li.dimensionUnit,
        siteMeasurementRequired: li.siteMeasurementRequired,
        quantity: li.quantity,
        quantityUnit: li.quantityUnit,
        printSides: li.printSides,
        printingType: li.printingType,
        areaPerSideSqFt: li.areaPerSideSqFt,
        totalAreaSqFt: li.totalAreaSqFt,
        areaPerSideSqM: li.areaPerSideSqM,
        totalAreaSqM: li.totalAreaSqM,
        installationRequired: li.installationRequired,
        installationLocation: li.installationLocation,
        siteInspectionRequired: li.siteInspectionRequired,
        deliveryDate: li.deliveryDate,
        designStatus: li.designStatus,
        selectedMaterials: [...li.selectedMaterials],
        materialConfirmedByManager: true,
        finishingRequirements: [...li.finishingRequirements],
        remarks: li.remarks,
      }))
    );
  };

  // Project Details State
  const [projectCode, setProjectCode] = useState(`PRJ-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [customerProvidedDesign, setCustomerProvidedDesign] = useState<boolean>(false);
  const [installationRequired, setInstallationRequired] = useState<boolean>(true);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [assignedDesignerId, setAssignedDesignerId] = useState('');
  const [assignedProductionId, setAssignedProductionId] = useState('');
  const [assignedQcId, setAssignedQcId] = useState('');
  const [assignedDispatchId, setAssignedDispatchId] = useState('');



  const loadData = async () => {
    setIsLoading(true);
    try {
      const [activeRes, historyRes, clientRes, usersRes] = await Promise.all([
        apiClient.get<ApiResponse<ProjectListItem[]>>('/projects'),
        apiClient.get<ApiResponse<ProjectListItem[]>>('/projects/history'),
        apiClient.get<ApiResponse<Client[]>>('/clients'),
        isPrivileged
          ? apiClient.get<ApiResponse<UserSummary[]>>('/users')
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setActiveProjects(activeRes.data.data || []);
      setHistoryProjects(historyRes.data.data || []);
      const loadedClients = clientRes.data.data || [];
      setClients(loadedClients);
      setStaffUsers(usersRes.data.data || []);
    } catch (err) {
      console.error('Failed to load projects and history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = async () => {
    setModalError(null);
    setFieldErrors({});
    setSelectedEnquiryId('');
    setLineItems([]);
    if (clients.length > 0) {
      setClientData({
        mode: 'existing',
        selectedClientId: clients[0].id,
        clientName: clients[0].contactPerson || clients[0].companyName,
        companyName: clients[0].companyName,
        phone: clients[0].phone || '',
        alternatePhone: '',
        email: clients[0].email || '',
        address: clients[0].address || '',
        gstNumber: clients[0].gstNumber || '',
      });
    } else {
      setClientData({
        mode: 'new',
        clientName: '',
        companyName: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        gstNumber: '',
      });
    }
    setProjectCode(`PRJ-2026-${Math.floor(100 + Math.random() * 900)}`);
    setTitle('');
    setDescription('');
    setDueDate('');
    setBudget('');
    setIsModalOpen(true);

    try {
      const enqs = await enquiryApi.getAll({ status: 'SUBMITTED' });
      setSubmittedEnquiries(enqs);
    } catch (err) {
      console.error('Failed to load submitted enquiries for project prefill', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setFieldErrors({});

    const errors: Record<string, string> = {};

    if (!clientData.clientName?.trim()) {
      errors.clientName = 'Client contact name is required';
    }

    if (!clientData.phone?.trim()) {
      errors.clientPhone = 'Mobile number is required';
    } else {
      const cleaned = clientData.phone.trim();
      if (!/^\d{10}$/.test(cleaned)) {
        errors.clientPhone = 'Mobile number must contain exactly 10 digits.';
      }
    }

    if (!clientData.address?.trim()) {
      errors.clientAddress = 'Client address is required';
    }

    if (clientData.email && clientData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email.trim())) {
        errors.clientEmail = 'Please enter a valid email address';
      }
    }

    if (!title.trim()) {
      errors.title = 'Project title / campaign is required';
    }

    if (!projectCode.trim()) {
      errors.projectCode = 'Project code is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setModalError('Please correct the highlighted required client or project fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/projects', {
        projectCode: projectCode.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        clientId: clientData.mode === 'existing' && clientData.selectedClientId ? clientData.selectedClientId : undefined,
        clientName: clientData.clientName.trim(),
        clientPhone: clientData.phone.trim(),
        clientAddress: clientData.address.trim(),
        clientEmail: clientData.email?.trim() || undefined,
        contactPerson: clientData.clientName.trim() || undefined,
        gstNumber: clientData.gstNumber?.trim() || undefined,
        priority,
        customerProvidedDesign,
        installationRequired,
        dueDate: dueDate || null,
        budget: budget ? parseFloat(budget) : null,
        assignedDesignerId: assignedDesignerId || null,
        assignedProductionId: assignedProductionId || null,
        assignedQcId: assignedQcId || null,
        assignedDispatchId: assignedDispatchId || null,
        enquiryId: selectedEnquiryId || undefined,
        lineItems: lineItems.length > 0 ? lineItems : undefined,
      });

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };


  // Date period evaluation helper for completed history
  const isDateInPeriod = (dateStr: string, period: DateFilterPeriod, customStart?: string, customEnd?: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();

    switch (period) {
      case 'TODAY': {
        return date.toDateString() === now.toDateString();
      }
      case 'THIS_WEEK': {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return date >= startOfWeek && date <= now;
      }
      case 'THIS_MONTH': {
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
      }
      case 'LAST_MONTH': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        return date >= lastMonth && date <= endLastMonth;
      }
      case 'THIS_QUARTER': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const endQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
        return date >= startQuarter && date <= endQuarter;
      }
      case 'THIS_YEAR': {
        return date.getFullYear() === now.getFullYear();
      }
      case 'CUSTOM': {
        if (customStart && customEnd) {
          const start = new Date(customStart + 'T00:00:00');
          const end = new Date(customEnd + 'T23:59:59');
          return date >= start && date <= end;
        }
        if (customStart) {
          const start = new Date(customStart + 'T00:00:00');
          return date >= start;
        }
        if (customEnd) {
          const end = new Date(customEnd + 'T23:59:59');
          return date <= end;
        }
        return true;
      }
      default:
        return true;
    }
  };

  // Helper to format duration between created and completed
  const formatDuration = (startStr: string, endStr: string): string => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return '—';

    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${Math.max(1, minutes)}m`;
  };

  // Helper to format completion date
  const formatDateTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered Active Projects
  const filteredActiveProjects = useMemo(() => {
    return activeProjects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
        p.client?.companyName?.toLowerCase().includes(activeSearchQuery.toLowerCase());

      const matchesStatus = activeStatusFilter === 'ALL' || p.status === activeStatusFilter;
      const matchesPath =
        activePathFilter === 'ALL' ||
        (activePathFilter === 'PATH_A' && p.customerProvidedDesign) ||
        (activePathFilter === 'PATH_B' && !p.customerProvidedDesign);

      return matchesSearch && matchesStatus && matchesPath;
    });
  }, [activeProjects, activeSearchQuery, activeStatusFilter, activePathFilter]);

  // Filtered and Sorted History Projects
  const filteredHistoryProjects = useMemo(() => {
    const list = historyProjects.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        p.client?.companyName?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        p.client?.contactPerson?.toLowerCase().includes(historySearchQuery.toLowerCase());

      const matchesPath =
        historyPathFilter === 'ALL' ||
        (historyPathFilter === 'PATH_A' && p.customerProvidedDesign) ||
        (historyPathFilter === 'PATH_B' && !p.customerProvidedDesign);

      const matchesStaff =
        historyStaffFilter === 'ALL' ||
        p.assignedDesigner?.id === historyStaffFilter ||
        p.assignedProduction?.id === historyStaffFilter ||
        p.assignedQc?.id === historyStaffFilter ||
        p.assignedDispatch?.id === historyStaffFilter ||
        p.createdBy?.id === historyStaffFilter;

      const completionTimestamp = p.updatedAt || p.createdAt;
      const matchesDate = isDateInPeriod(completionTimestamp, selectedPeriod, startDate, endDate);

      return matchesSearch && matchesPath && matchesStaff && matchesDate;
    });

    list.sort((a, b) => {
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return historySortOrder === 'NEWEST_FIRST' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [
    historyProjects,
    historySearchQuery,
    historyPathFilter,
    historyStaffFilter,
    selectedPeriod,
    startDate,
    endDate,
    historySortOrder,
  ]);

  return (
    <div className="page-wrapper">
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Projects &amp; Lifecycle Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Enterprise production pipeline orchestration &amp; completed work audit archive
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
            Refresh
          </button>
          {isPrivileged && (
            <button onClick={handleOpenCreateModal} className="btn btn-primary btn-sm">
              <Plus size={16} />
              New Project
            </button>
          )}

        </div>
      </div>

      {/* Top-Level Tab Switcher: Active Pipeline vs Completed History */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setViewTab('active')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: viewTab === 'active' ? '#000000' : 'transparent',
            color: viewTab === 'active' ? '#FFFFFF' : '#4B5563',
            border: viewTab === 'active' ? '1px solid #000000' : '1px solid var(--border-subtle)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <FolderKanban size={17} color={viewTab === 'active' ? '#FFFFFF' : 'var(--text-dim)'} />
          Projects &amp; Pipeline
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
              background: viewTab === 'active' ? '#FFFFFF' : 'var(--bg-subtle)',
              color: viewTab === 'active' ? '#000000' : 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {activeProjects.length} ACTIVE
          </span>
        </button>

        <button
          onClick={() => setViewTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.65rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: viewTab === 'history' ? '#000000' : 'transparent',
            color: viewTab === 'history' ? '#FFFFFF' : '#4B5563',
            border: viewTab === 'history' ? '1px solid #000000' : '1px solid var(--border-subtle)',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <History size={17} color={viewTab === 'history' ? '#FFFFFF' : 'var(--text-dim)'} />
          My History &amp; Records
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: '3px',
              background: viewTab === 'history' ? '#FFFFFF' : 'var(--bg-subtle)',
              color: viewTab === 'history' ? '#000000' : 'var(--text-main)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {historyProjects.length} COMPLETED
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE PROJECTS & PIPELINE (status != COMPLETED)                    */}
      {/* ========================================================================= */}
      {viewTab === 'active' && (
        <div>
          {/* Active Filter Bar */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search active code, title, or client..."
                value={activeSearchQuery}
                onChange={(e) => setActiveSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Path:</span>
              <select
                className="form-select"
                style={{ width: '170px' }}
                value={activePathFilter}
                onChange={(e) => setActivePathFilter(e.target.value)}
              >
                <option value="ALL">All Design Paths</option>
                <option value="PATH_A">Path A: Customer Design</option>
                <option value="PATH_B">Path B: Design Required</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <select
                className="form-select"
                style={{ width: '220px' }}
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
              >
                <option value="ALL">All Active Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="MANAGER_REVIEW">Manager Review</option>
                <option value="DESIGN_TECHNICAL_CHECK">Design Tech Check</option>
                <option value="DESIGN_IN_PROGRESS">Design In Progress</option>
                <option value="DESIGN_SUBMITTED">Design Submitted</option>
                <option value="CUSTOMER_APPROVAL_PENDING">Customer Approval Pending</option>
                <option value="CUSTOMER_APPROVED">Customer Approved</option>
                <option value="CUSTOMER_REWORK_REQUESTED">Rework Requested</option>
                <option value="MANAGER_APPROVED">Manager Approved</option>
                <option value="READY_FOR_PRODUCTION">Ready for Production</option>
                <option value="IN_PRODUCTION">In Production</option>
                <option value="PRODUCTION_COMPLETED">Production Done</option>
                <option value="QC_PENDING">QC Pending</option>
                <option value="QC_PASSED">QC Passed</option>
                <option value="QC_REJECTED">QC Rejected</option>
                <option value="DISPATCH_PENDING">Dispatch Pending</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="INSTALLATION_PENDING">Installation Pending</option>
                <option value="INSTALLATION_COMPLETED">Installation Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Active Projects Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Workflow Path</th>
                  <th>Campaign / Title</th>
                  <th>Client</th>
                  <th>Priority</th>
                  <th>Current Status</th>
                  <th>Assigned Staff</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredActiveProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <FolderKanban size={36} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                      <div>No active matching projects found in pipeline.</div>
                    </td>
                  </tr>
                ) : (
                  filteredActiveProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                            {p.projectCode}
                          </span>
                          {p.leadCode && (
                            <span style={{ fontSize: '0.68rem', color: '#a78bfa', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                              Lead: {p.leadCode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: p.customerProvidedDesign ? '#FFFFFF' : '#E5E5E5',
                            color: '#000000',
                            border: p.customerProvidedDesign ? '1px solid #000000' : '1px solid #CCCCCC',
                          }}
                        >
                          {p.customerProvidedDesign ? 'Path A: Customer Design' : 'Path B: Design Req.'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description || 'No description provided'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{p.client?.companyName}</span>
                      </td>
                      <td>
                        <StatusBadge priority={p.priority} size="sm" />
                      </td>
                      <td>
                        <StatusBadge status={p.status} size="sm" />
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {p.assignedDesigner && <span style={{ color: 'var(--text-main)' }}>Design: {p.assignedDesigner.fullName}</span>}
                          {p.assignedProduction && <span style={{ color: 'var(--text-dim)' }}>Prod: {p.assignedProduction.fullName}</span>}
                          {p.assignedQc && <span style={{ color: 'var(--text-dim)' }}>QC: {p.assignedQc.fullName}</span>}
                          {p.assignedDispatch && <span style={{ color: 'var(--text-dim)' }}>Dispatch: {p.assignedDispatch.fullName}</span>}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          {p.dueDate || '—'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectProject(p.id)}
                          className="btn btn-primary btn-sm"
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMPLETED PROJECT HISTORY (status == COMPLETED)                    */}
      {/* ========================================================================= */}
      {viewTab === 'history' && (
        <div>
          {/* Time Filter Bar */}
          <DateFilterBar
            selectedPeriod={selectedPeriod}
            startDate={startDate}
            endDate={endDate}
            onFilterChange={(period, start, end) => {
              setSelectedPeriod(period);
              setStartDate(start);
              setEndDate(end);
            }}
            accentColor="#34d399"
          />

          {/* Quick Metrics Bar for History */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Completed Projects
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                {filteredHistoryProjects.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                In {selectedPeriod.replace(/_/g, ' ').toLowerCase()}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Customer Design (Path A)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                {filteredHistoryProjects.filter((p) => p.customerProvidedDesign).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                Machine verified &amp; delivered
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Design Studio (Path B)
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                {filteredHistoryProjects.filter((p) => !p.customerProvidedDesign).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                Creative approvals &amp; delivered
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.15rem', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                On-Site Installations
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', marginTop: '0.2rem', fontFamily: 'var(--font-display)' }}>
                {filteredHistoryProjects.filter((p) => p.installationRequired).length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                Mounted &amp; signed off
              </div>
            </div>
          </div>

          {/* History Search & Filters Bar */}
          <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search history by code, title, or client..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Path:</span>
              <select
                className="form-select"
                style={{ width: '170px' }}
                value={historyPathFilter}
                onChange={(e) => setHistoryPathFilter(e.target.value)}
              >
                <option value="ALL">All Paths</option>
                <option value="PATH_A">Path A: Customer Design</option>
                <option value="PATH_B">Path B: Design Required</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 600 }}>Staff:</span>
              <select
                className="form-select"
                style={{ width: '190px' }}
                value={historyStaffFilter}
                onChange={(e) => setHistoryStaffFilter(e.target.value)}
              >
                <option value="ALL">All Staff Members</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.department})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={15} color="var(--text-dim)" />
              <select
                className="form-select"
                style={{ width: '180px' }}
                value={historySortOrder}
                onChange={(e) => setHistorySortOrder(e.target.value as any)}
              >
                <option value="NEWEST_FIRST">Newest Completed</option>
                <option value="OLDEST_FIRST">Oldest Completed</option>
              </select>
            </div>
          </div>

          {/* Completed Projects Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Code</th>
                  <th>Workflow Path</th>
                  <th>Campaign / Title</th>
                  <th>Client</th>
                  <th>Completed Date</th>
                  <th>Turnaround Duration</th>
                  <th>Assigned Team</th>
                  <th>Final Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistoryProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={36} color="#34d399" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                      <div>No completed projects match the selected timeframe and search criteria.</div>
                    </td>
                  </tr>
                ) : (
                  filteredHistoryProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#34d399' }}>
                          {p.projectCode}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: p.customerProvidedDesign ? '#FFFFFF' : '#E5E5E5',
                            color: '#000000',
                            border: p.customerProvidedDesign ? '1px solid #000000' : '1px solid #CCCCCC',
                          }}
                        >
                          {p.customerProvidedDesign ? 'Path A' : 'Path B'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description || 'No description provided'}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{p.client?.companyName}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-main)', fontWeight: 500 }}>
                          {formatDateTime(p.updatedAt || p.createdAt)}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: '#000000',
                            background: '#F5F5F5',
                            border: '1px solid #D9D9D9',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          <Clock size={12} />
                          {formatDuration(p.createdAt, p.updatedAt || p.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {p.assignedDesigner && <span style={{ color: 'var(--text-main)' }}>Design: {p.assignedDesigner.fullName}</span>}
                          {p.assignedProduction && <span style={{ color: 'var(--text-dim)' }}>Prod: {p.assignedProduction.fullName}</span>}
                          {p.assignedQc && <span style={{ color: 'var(--text-dim)' }}>QC: {p.assignedQc.fullName}</span>}
                          {p.assignedDispatch && <span style={{ color: 'var(--text-dim)' }}>Dispatch: {p.assignedDispatch.fullName}</span>}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status="COMPLETED" size="sm" />
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectProject(p.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          View Details <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#000000' }}>Create New Advertising Project</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.35rem 0.5rem', background: '#FFFFFF', border: '1px solid #D9D9D9', color: '#000000' }}
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {modalError && (
              <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={18} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              {/* ============================================================ */}
              {/* OPTIONAL: PRE-FILL FROM SUBMITTED FRONT OFFICE ENQUIRY */}
              {/* ============================================================ */}
              {submittedEnquiries.length > 0 && (
                <div style={{ background: '#F8F9FA', border: '1px solid #D0D0D0', borderRadius: '6px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={15} /> Pre-fill from Submitted Front Office Enquiry
                    </label>
                    <span style={{ fontSize: '11px', color: '#666666' }}>{submittedEnquiries.length} pending enquiries</span>
                  </div>
                  <select
                    value={selectedEnquiryId}
                    onChange={(e) => handleSelectEnquiryToConvert(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      fontSize: '13px',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      background: '#FFFFFF',
                    }}
                  >
                    <option value="">-- Start Clean (Direct Project Creation) --</option>
                    {submittedEnquiries.map((enq) => (
                      <option key={enq.id} value={enq.id}>
                        {enq.enquiryNumber}: {enq.clientName} ({enq.companyName || 'Individual'}) - {enq.lineItems.map((i) => i.serviceName).join(', ')} ({enq.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ============================================================ */}
              {/* 1. REUSABLE CLIENT SELECTOR COMPONENT */}
              {/* ============================================================ */}
              <div style={{ marginBottom: '1.25rem' }}>
                <ClientSelector
                  value={clientData}
                  onChange={setClientData}
                  errors={fieldErrors}
                  disabled={isSubmitting}
                />
              </div>

              {/* ============================================================ */}
              {/* 2. REUSABLE CLIENT REQUIREMENT CHECKLIST COMPONENT */}
              {/* ============================================================ */}
              <div style={{ marginBottom: '1.25rem' }}>
                <ClientRequirementChecklist
                  lineItems={lineItems}
                  onChange={setLineItems}
                  errors={fieldErrors}
                  disabled={isSubmitting}
                />
              </div>

              {/* ============================================================ */}
              {/* 2. PROJECT DETAILS SECTION */}
              {/* ============================================================ */}
              <div className="modal-section" style={{ background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '6px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="modal-section-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #D9D9D9', paddingBottom: '0.5rem' }}>
                  <span className="modal-section-title" style={{ fontSize: '0.875rem', fontWeight: 700, color: '#000000', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Project Details
                  </span>
                </div>

                {/* Workflow Path Selector */}
                <div style={{ padding: '0.85rem', background: '#FFFFFF', border: '1px solid #D9D9D9', borderRadius: '6px', marginBottom: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block', color: '#000000', fontWeight: 600 }}>Design Workflow Path</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <label
                      className={`radio-card ${customerProvidedDesign ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        background: customerProvidedDesign ? '#F5F5F5' : '#FFFFFF',
                        border: customerProvidedDesign ? '1px solid #000000' : '1px solid #D9D9D9',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="workflowPath"
                        checked={customerProvidedDesign}
                        onChange={() => setCustomerProvidedDesign(true)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div className="radio-card-title" style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#000000' }}>
                          Path A: Customer Has Design
                        </div>
                        <div className="radio-card-desc" style={{ fontSize: '0.75rem', color: '#666666', marginTop: '2px' }}>
                          Designer performs machine compatibility check only (no customer design approval loop).
                        </div>
                      </div>
                    </label>

                    <label
                      className={`radio-card ${!customerProvidedDesign ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.6rem',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        background: !customerProvidedDesign ? '#F5F5F5' : '#FFFFFF',
                        border: !customerProvidedDesign ? '1px solid #000000' : '1px solid #D9D9D9',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="workflowPath"
                        checked={!customerProvidedDesign}
                        onChange={() => setCustomerProvidedDesign(false)}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div className="radio-card-title" style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#000000' }}>
                          Path B: Customer Needs Design
                        </div>
                        <div className="radio-card-desc" style={{ fontSize: '0.75rem', color: '#666666', marginTop: '2px' }}>
                          Designer creates artwork → Customer Approval → Manager Approval (Lock) → Production.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>
                      Project Code <span className="form-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input ${fieldErrors.projectCode ? 'has-error' : ''}`}
                      value={projectCode}
                      onChange={(e) => {
                        setProjectCode(e.target.value);
                        if (fieldErrors.projectCode) setFieldErrors((prev) => ({ ...prev, projectCode: '' }));
                      }}
                      style={{
                        background: '#FFFFFF',
                        color: '#000000',
                        borderColor: fieldErrors.projectCode ? '#DC2626' : '#D9D9D9',
                      }}
                      required
                    />
                    {fieldErrors.projectCode && (
                      <div className="form-error">
                        {fieldErrors.projectCode}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>
                      Campaign / Title <span className="form-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-input ${fieldErrors.title ? 'has-error' : ''}`}
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: '' }));
                      }}
                      placeholder="e.g. Metro 40x20ft Glow Sign"
                      style={{
                        background: '#FFFFFF',
                        color: '#000000',
                        borderColor: fieldErrors.title ? '#DC2626' : '#D9D9D9',
                      }}
                      required
                    />
                    {fieldErrors.title && (
                      <div className="form-error">
                        {fieldErrors.title}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Scope &amp; Specifications</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Material, dimensions, finishing requirements..."
                    style={{
                      background: '#FFFFFF',
                      color: '#000000',
                      borderColor: '#D9D9D9',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Priority</label>
                    <select
                      className="form-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Target Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Budget (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="50000"
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#000000' }}>
                    <input
                      type="checkbox"
                      checked={installationRequired}
                      onChange={(e) => setInstallationRequired(e.target.checked)}
                    />
                    <span>On-Site Installation Required (Requires on-site mounting by Dispatch/Install team)</span>
                  </label>
                </div>

                {/* Departmental Staff Assignment */}
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#666666', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>
                  Departmental Staff Assignment
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Designer</label>
                    <select
                      className="form-select"
                      value={assignedDesignerId}
                      onChange={(e) => setAssignedDesignerId(e.target.value)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers
                        .filter((u) => u.status === 'ACTIVE' && (u.department === 'DESIGN' || u.roles.includes('ROLE_DESIGNER')))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Production</label>
                    <select
                      className="form-select"
                      value={assignedProductionId}
                      onChange={(e) => setAssignedProductionId(e.target.value)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers
                        .filter((u) => u.status === 'ACTIVE' && (u.department === 'PRODUCTION' || u.roles.includes('ROLE_PRODUCTION')))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>QC Inspector</label>
                    <select
                      className="form-select"
                      value={assignedQcId}
                      onChange={(e) => setAssignedQcId(e.target.value)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers
                        .filter((u) => u.status === 'ACTIVE' && (u.department === 'QUALITY_CONTROL' || u.roles.includes('ROLE_QC')))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: '#000000', fontWeight: 600 }}>Dispatch Officer</label>
                    <select
                      className="form-select"
                      value={assignedDispatchId}
                      onChange={(e) => setAssignedDispatchId(e.target.value)}
                      style={{ background: '#FFFFFF', color: '#000000', borderColor: '#D9D9D9' }}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers
                        .filter((u) => u.status === 'ACTIVE' && (u.department === 'DISPATCH' || u.roles.includes('ROLE_DISPATCH')))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ background: '#FFFFFF', color: '#000000', border: '1px solid #D9D9D9' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ background: '#000000', color: '#FFFFFF', border: '1px solid #000000' }}
                >
                  {isSubmitting ? 'Creating Project...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


