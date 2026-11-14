import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { ProjectDetail, ApiResponse, ProjectStatus, AuditLogItem, UserSummary, DepartmentType, ProjectMaterialRequirementDto } from '../../shared/types';
import { apiClient } from '../../services/api/client';
import { inventoryApi } from '../../services/api';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { WorkflowStepper } from './WorkflowStepper';
import {
  ArrowLeft,
  UploadCloud,
  Download,
  Plus,
  CheckCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Hammer,
  FileText,
  Clock,
  User as UserIcon,
  RefreshCw,
  Lock,
  Wrench,
  ThumbsUp,
  CheckSquare,
  X,
  Edit3,
  MessageSquare,
  Trash2,
  Sparkles,
  Package,
  Layers,
} from 'lucide-react';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailProps> = ({ projectId, onBack }) => {
  const { hasRole } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'materials' | 'designs' | 'production' | 'qc' | 'dispatch' | 'audit'>(() => {
    if (hasRole(['ROLE_DESIGNER'])) return 'designs';
    if (hasRole(['ROLE_PRODUCTION'])) return 'requirements';
    if (hasRole(['ROLE_QC'])) return 'qc';
    if (hasRole(['ROLE_DISPATCH'])) return 'dispatch';
    return 'overview';
  });

  // Project Material Requirements & Stock Operations State
  const [materialRequirements, setMaterialRequirements] = useState<ProjectMaterialRequirementDto[]>([]);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<ProjectMaterialRequirementDto | null>(null);
  const [reserveQty, setReserveQty] = useState('');
  const [reserveBatch, setReserveBatch] = useState('');
  const [reserveLocation, setReserveLocation] = useState('Main Warehouse - Bay A');
  const [reserveNotes, setReserveNotes] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueQty, setIssueQty] = useState('');
  const [issuedTo, setIssuedTo] = useState('Production Floor');
  const [issueNotes, setIssueNotes] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  // Edit Client Details Modal State
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientContactPerson, setEditClientContactPerson] = useState('');
  const [editClientGstNumber, setEditClientGstNumber] = useState('');
  const [editCustomFields, setEditCustomFields] = useState<Array<{ id: string; key: string; value: string }>>([]);
  const [editPhoneError, setEditPhoneError] = useState<string | null>(null);
  const [editClientErrors, setEditClientErrors] = useState<Record<string, string>>({});
  const [isSavingClient, setIsSavingClient] = useState(false);

  // WhatsApp Retry State
  const [isRetryingWhatsApp, setIsRetryingWhatsApp] = useState(false);

  // Assign modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignDepartment, setAssignDepartment] = useState<DepartmentType>('DESIGN');
  const [assignDepartmentLabel, setAssignDepartmentLabel] = useState('Design');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [allStaff, setAllStaff] = useState<UserSummary[]>([]);

  // Action / Transition states
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);


  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Path A: Technical Check Modal
  const [isTechCheckModalOpen, setIsTechCheckModalOpen] = useState(false);
  const [techCheckPassed, setTechCheckPassed] = useState(true);
  const [techCheckNotes, setTechCheckNotes] = useState('Resolution 300 DPI verified, CMYK gamut within tolerance, 2-inch bleed included.');

  // Path B: Customer Approval Modal
  const [isCustomerApprovalModalOpen, setIsCustomerApprovalModalOpen] = useState(false);
  const [customerApproved, setCustomerApproved] = useState(true);
  const [customerFeedback, setCustomerFeedback] = useState('Customer confirmed final PDF proof via email.');

  // Path B: Manager Production Approval Modal
  const [isManagerApprovalModalOpen, setIsManagerApprovalModalOpen] = useState(false);
  const [selectedApprovedFileId, setSelectedApprovedFileId] = useState<string>('');
  const [managerApprovalNotes, setManagerApprovalNotes] = useState('Pre-press check verified. Locked and authorized for print floor.');

  // Installation Modal
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [installDate, setInstallDate] = useState(new Date().toISOString().split('T')[0]);
  const [installNotes, setInstallNotes] = useState('Glow signs mounted securely on storefront facade with 3-phase wiring test passed.');

  // Production & QC Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [materialSpec, setMaterialSpec] = useState('');
  const [machineType, setMachineType] = useState('Flatbed UV Printer');
  const [quantity, setQuantity] = useState('1');

  const [isQcModalOpen, setIsQcModalOpen] = useState(false);
  const [qcPassed, setQcPassed] = useState(true);
  const [colorScore, setColorScore] = useState(9);
  const [dimensionScore, setDimensionScore] = useState(9);
  const [finishScore, setFinishScore] = useState(9);
  const [qcRemarks, setQcRemarks] = useState('Vibrant color density, no banding or pixelation.');
  const [defectsNotes, setDefectsNotes] = useState('');

  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [courierPartner, setCourierPartner] = useState('Rohilla In-House Delivery Fleet');
  const [trackingNumber, setTrackingNumber] = useState(`ROH-${Math.floor(100000 + Math.random() * 900000)}`);
  const [recipientName, setRecipientName] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const loadProject = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [projRes, auditRes, staffRes, matReqRes] = await Promise.all([
        apiClient.get<ApiResponse<ProjectDetail>>(`/projects/${projectId}`),
        hasRole(['ROLE_ADMIN', 'ROLE_MANAGER'])
          ? apiClient.get<ApiResponse<AuditLogItem[]>>(`/audit-logs/resource/PROJECT/${projectId}`)
          : Promise.resolve({ data: { data: [] } }),
        hasRole(['ROLE_ADMIN', 'ROLE_MANAGER'])
          ? apiClient.get<ApiResponse<UserSummary[]>>('/users')
          : Promise.resolve({ data: { data: [] } }),
        inventoryApi.getProjectRequirements(projectId).catch(() => [] as ProjectMaterialRequirementDto[]),
      ]);

      const pData = projRes.data.data;
      setProject(pData);
      setAuditLogs(auditRes.data.data || []);
      setAllStaff(staffRes.data.data || []);
      setMaterialRequirements(matReqRes || pData.materialRequirements || []);

      if (pData.client) {
        setRecipientName(pData.client.contactPerson || '');
        setDestinationAddress(pData.client.address || '');
      }

      if (pData.designFiles && pData.designFiles.length > 0) {
        setSelectedApprovedFileId(pData.designFiles[pData.designFiles.length - 1].id);
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Access Denied / Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReserve = (req: ProjectMaterialRequirementDto) => {
    setSelectedRequirement(req);
    const needed = Math.max(0, req.requiredQuantity - req.reservedQuantity);
    setReserveQty(needed > 0 ? needed.toString() : '1');
    setReserveBatch('');
    setReserveNotes(`Reserved for Project #${project?.projectCode || projectId}`);
    setIsReserveModalOpen(true);
  };

  const handleConfirmReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequirement) return;
    const q = parseFloat(reserveQty);
    if (isNaN(q) || q <= 0) {
      setActionError('Please enter a valid reservation quantity');
      return;
    }
    setIsReserving(true);
    try {
      await inventoryApi.reserveStock(projectId, {
        requirementId: selectedRequirement.id,
        inventoryItemId: selectedRequirement.inventoryItemId,
        quantity: q,
        notes: reserveNotes ? `${reserveBatch ? 'Batch: ' + reserveBatch + '. ' : ''}${reserveNotes}` : reserveBatch ? `Batch: ${reserveBatch}` : undefined,
      });
      setActionSuccess(`Successfully reserved ${q} units of ${selectedRequirement.materialName}`);
      setIsReserveModalOpen(false);
      await loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to reserve stock');
    } finally {
      setIsReserving(false);
    }
  };

  const handleOpenIssue = (req: ProjectMaterialRequirementDto) => {
    setSelectedRequirement(req);
    const unissuedReserved = Math.max(0, req.reservedQuantity - req.issuedQuantity);
    const needed = unissuedReserved > 0 ? unissuedReserved : Math.max(0, req.requiredQuantity - req.issuedQuantity);
    setIssueQty(needed > 0 ? needed.toString() : '1');
    setIssuedTo('Production Floor');
    setIssueNotes(`Issued for Project #${project?.projectCode || projectId}`);
    setIsIssueModalOpen(true);
  };

  const handleConfirmIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequirement) return;
    const q = parseFloat(issueQty);
    if (isNaN(q) || q <= 0) {
      setActionError('Please enter a valid issue quantity');
      return;
    }
    setIsIssuing(true);
    try {
      await inventoryApi.issueStock(projectId, {
        requirementId: selectedRequirement.id,
        quantity: q,
        notes: `${issuedTo ? 'Issued to: ' + issuedTo + '. ' : ''}${issueNotes || ''}`.trim() || undefined,
      });
      setActionSuccess(`Successfully issued ${q} units to ${issuedTo}`);
      setIsIssueModalOpen(false);
      await loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to issue stock');
    } finally {
      setIsIssuing(false);
    }
  };

  const validateEditPhone = (val: string): string | null => {
    if (!val || val.trim() === '') return null;
    const cleaned = val.trim();
    if (!/^\d+$/.test(cleaned)) {
      return 'Please enter a valid 10-digit mobile number.';
    }
    if (cleaned.length !== 10) {
      return 'Mobile number must contain exactly 10 digits.';
    }
    return null;
  };

  const handleEditPhoneChange = (val: string) => {
    setEditClientPhone(val);
    setEditPhoneError(validateEditPhone(val));
    if (editClientErrors.editClientPhone) {
      setEditClientErrors((prev) => ({ ...prev, editClientPhone: '' }));
    }
  };

  const handleOpenEditClient = () => {
    if (!project?.client) return;
    setEditClientName(project.client.companyName || '');
    setEditClientPhone(project.client.phone || '');
    setEditClientEmail(project.client.email || '');
    setEditClientAddress(project.client.address || '');
    setEditClientContactPerson(project.client.contactPerson || '');
    setEditClientGstNumber(project.client.gstNumber || '');
    if (project.client.customFields) {
      setEditCustomFields(
        Object.entries(project.client.customFields).map(([k, v], idx) => ({
          id: `edit-cf-${idx}-${Date.now()}`,
          key: k,
          value: v,
        }))
      );
    } else {
      setEditCustomFields([]);
    }
    setEditPhoneError(validateEditPhone(project.client.phone || ''));
    setEditClientErrors({});
    setIsEditClientModalOpen(true);
  };

  const handleAddEditCustomField = () => {
    setEditCustomFields((prev) => [
      ...prev,
      { id: `edit-cf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, key: '', value: '' },
    ]);
  };

  const handleUpdateEditCustomField = (id: string, key: string, value: string) => {
    setEditCustomFields((prev) =>
      prev.map((cf) => (cf.id === id ? { ...cf, key, value } : cf))
    );
  };

  const handleRemoveEditCustomField = (id: string) => {
    setEditCustomFields((prev) => prev.filter((cf) => cf.id !== id));
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project?.client?.id) return;

    const errors: Record<string, string> = {};
    if (!editClientName.trim()) {
      errors.editClientName = 'Client name is required';
    }
    if (!editClientPhone.trim()) {
      errors.editClientPhone = 'Mobile number is required';
    } else {
      const pErr = validateEditPhone(editClientPhone);
      if (pErr) {
        errors.editClientPhone = pErr;
      }
    }
    if (!editClientAddress.trim()) {
      errors.editClientAddress = 'Client address is required';
    }
    if (editClientEmail && editClientEmail.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editClientEmail.trim())) {
        errors.editClientEmail = 'Please enter a valid email address';
      }
    }

    if (Object.keys(errors).length > 0) {
      setEditClientErrors(errors);
      return;
    }

    setIsSavingClient(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const customMap: Record<string, string> = {};
      editCustomFields.forEach((cf) => {
        if (cf.key.trim() && cf.value.trim()) {
          customMap[cf.key.trim()] = cf.value.trim();
        }
      });

      await apiClient.put(`/clients/${project.client.id}`, {
        companyName: editClientName.trim(),
        phone: editClientPhone.trim(),
        address: editClientAddress.trim(),
        email: editClientEmail.trim() || undefined,
        contactPerson: editClientContactPerson.trim() || undefined,
        gstNumber: editClientGstNumber.trim() || undefined,
        customFields: Object.keys(customMap).length > 0 ? customMap : undefined,
      });

      setIsEditClientModalOpen(false);
      setActionSuccess('Client contact details updated successfully and audited.');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update client details');
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleRetryWhatsApp = async () => {
    setIsRetryingWhatsApp(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiClient.post<ApiResponse<string>>(`/projects/${projectId}/whatsapp/retry`);
      setActionSuccess(res.data.message || 'Customer WhatsApp completion notification sent successfully!');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to send WhatsApp notification. Please check client mobile number.');
    } finally {
      setIsRetryingWhatsApp(false);
    }
  };


  useEffect(() => {
    if (!hasRole(['ROLE_ADMIN', 'ROLE_MANAGER'])) {
      if (hasRole(['ROLE_DESIGNER'])) setActiveTab('designs');
      else if (hasRole(['ROLE_PRODUCTION'])) setActiveTab('production');
      else if (hasRole(['ROLE_QC'])) setActiveTab('qc');
      else if (hasRole(['ROLE_DISPATCH'])) setActiveTab('dispatch');
    }
  }, []);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const handleOpenAssignModal = (department: DepartmentType, label: string, currentEmployeeId?: string) => {
    setAssignDepartment(department);
    setAssignDepartmentLabel(label);
    setSelectedEmployeeId(currentEmployeeId || '');
    setAssignNotes('');
    setIsAssignModalOpen(true);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    setIsAssigning(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiClient.post(`/projects/${projectId}/assign`, {
        department: assignDepartment,
        employeeId: selectedEmployeeId,
        notes: assignNotes.trim() || undefined,
      });

      setIsAssignModalOpen(false);
      setActionSuccess(`${assignDepartmentLabel} task assigned/reassigned successfully! Real-time notification sent.`);
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Failed to assign ${assignDepartmentLabel} task`);
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle Workflow State Transition
  const handleTransition = async (targetStatus: ProjectStatus) => {
    setIsTransitioning(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await apiClient.post(`/projects/${projectId}/workflow/transition`, {
        targetStatus,
      });
      setActionSuccess(`Project successfully moved to ${targetStatus}`);
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'State transition rejected by security policy');
    } finally {
      setIsTransitioning(false);
    }
  };

  // PATH A: Submit Technical Machine Compatibility Check
  const handleRecordTechnicalCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setActionError(null);
    try {
      const targetFileId = selectedApprovedFileId || project?.approvedDesignFileId || (project?.designFiles && project.designFiles.length > 0 ? project.designFiles[project.designFiles.length - 1].id : null);
      await apiClient.post(`/projects/${projectId}/technical-check`, {
        passed: techCheckPassed,
        compatibilityNotes: techCheckNotes,
        designFileId: targetFileId,
      });
      setIsTechCheckModalOpen(false);
      setActionSuccess(techCheckPassed
        ? 'Technical check passed! Project released to Production.'
        : 'Technical check failed. Returned to Manager for client correction.');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record technical check');
    } finally {
      setIsTransitioning(false);
    }
  };

  // PATH B: Submit Customer Approval
  const handleRecordCustomerApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setActionError(null);
    try {
      await apiClient.post(`/projects/${projectId}/customer-approval`, {
        approved: customerApproved,
        feedback: customerFeedback,
        designFileId: selectedApprovedFileId || null,
      });
      setIsCustomerApprovalModalOpen(false);
      setActionSuccess(customerApproved
        ? 'Customer approval recorded! Pending Manager production sign-off.'
        : 'Customer requested changes. Project moved back to Designer.');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record customer approval');
    } finally {
      setIsTransitioning(false);
    }
  };

  // PATH B: Submit Manager Approval & Lock
  const handleRecordManagerApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApprovedFileId) {
      setActionError('Please select the design file version to approve and lock for production.');
      return;
    }
    setIsTransitioning(true);
    setActionError(null);
    try {
      await apiClient.post(`/projects/${projectId}/manager-approval`, {
        approved: true,
        approvedDesignFileId: selectedApprovedFileId,
        notes: managerApprovalNotes,
      });
      setIsManagerApprovalModalOpen(false);
      setActionSuccess('Manager approved! Design version is now locked/immutable and released for Production.');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record manager approval');
    } finally {
      setIsTransitioning(false);
    }
  };

  // Submit Installation
  const handleRecordInstallation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransitioning(true);
    setActionError(null);
    try {
      await apiClient.post(`/projects/${projectId}/installation`, {
        installationDate: installDate,
        installationNotes: installNotes,
      });
      setIsInstallModalOpen(false);
      setActionSuccess('Installation completed and project successfully closed out!');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record installation');
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle Design File Upload
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient.post(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setActionSuccess(`File "${selectedFile.name}" uploaded and validated with Apache Tika magic-bytes`);
      setSelectedFile(null);
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'File upload rejected: MIME validation failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle File Download (Authorized Streaming)
  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      const response = await apiClient.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download file. Resource permission denied.');
    }
  };

  // Handle Production Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/projects/${projectId}/production-tasks`, {
        taskName,
        materialSpecification: materialSpec,
        machineType,
        quantity: parseInt(quantity, 10),
      });
      setIsTaskModalOpen(false);
      setTaskName('');
      setMaterialSpec('');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiClient.patch(`/production-tasks/${taskId}/complete`);
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update task');
    }
  };

  // Handle QC Recording
  const handleRecordQc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/projects/${projectId}/qc`, {
        passed: qcPassed,
        colorAccuracyScore: colorScore,
        dimensionAccuracyScore: dimensionScore,
        finishingScore: finishScore,
        remarks: qcRemarks,
        defectsNotes: defectsNotes || undefined,
      });
      setIsQcModalOpen(false);
      setQcRemarks('');
      setDefectsNotes('');
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to submit QC evaluation');
    }
  };

  // Handle Dispatch Recording
  const handleRecordDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post(`/projects/${projectId}/dispatch`, {
        dispatchDate: new Date().toISOString().split('T')[0],
        courierPartner,
        trackingNumber,
        recipientName,
        destinationAddress,
        dispatchNotes,
      });
      setIsDispatchModalOpen(false);
      loadProject();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to record dispatch');
    }
  };

  if (isLoading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={32} className="spin" color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading project details &amp; permissions...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-wrapper">
        <button onClick={onBack} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'Back to Projects & Pipeline' : 'Back to My Work'}
        </button>
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={36} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h3>Access Denied / Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{actionError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Top Breadcrumb & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button onClick={onBack} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'Back to Projects & Pipeline' : 'Back to My Work'}
        </button>
        <button onClick={loadProject} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh Details
        </button>
      </div>

      {/* Action Notification Messages */}
      {actionError && (
        <div className="alert-error" style={{ marginBottom: '1.25rem' }}>
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', color: '#166534', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Warning banner for incomplete client contact info */}
      {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && project.client && (!project.client.phone || project.client.phone.length !== 10 || !project.client.address) && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: 'var(--radius-md)', color: '#fbbf24', fontSize: '0.875rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} />
            <span>
              <strong>Incomplete Client Contact:</strong> Customer 10-digit mobile number or address is missing. WhatsApp dispatch notifications cannot be delivered until updated.
            </span>
          </div>
          <button onClick={handleOpenEditClient} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Edit3 size={13} /> Update Client Contact Details
          </button>
        </div>
      )}

      {/* Project Header Banner */}
      <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary)' }}>
                {project.projectCode}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: project.customerProvidedDesign ? 'rgba(168, 85, 247, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                color: project.customerProvidedDesign ? '#c084fc' : '#38bdf8',
                border: `1px solid ${project.customerProvidedDesign ? 'rgba(168, 85, 247, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
              }}>
                {project.customerProvidedDesign ? 'PATH A: Customer Design' : 'PATH B: Design Required'}
              </span>
              {project.leadCode && (
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(167, 139, 250, 0.15)',
                  color: '#a78bfa',
                  border: '1px solid rgba(167, 139, 250, 0.35)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  Converted from: {project.leadCode}
                </span>
              )}
              <StatusBadge priority={project.priority} size="sm" />
              <StatusBadge status={project.status} size="sm" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{project.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Client: <strong style={{ color: 'var(--text-main)' }}>{project.client?.companyName}</strong>
              {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && project.client?.contactPerson ? (
                <span> ({project.client.contactPerson}{project.client.phone ? ` • ${project.client.phone}` : ''})</span>
              ) : null}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', background: 'var(--bg-card)', padding: '0.85rem 1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target Delivery</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{project.dueDate || 'N/A'}</div>
            </div>
            {project.budget !== null && project.budget !== undefined && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Budget</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--success)' }}>
                  ₹{project.budget.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Timeline (Manager / Owner Full View vs Operational Department Status) */}
      {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? (
        <WorkflowStepper currentStatus={project.status} customerProvidedDesign={project.customerProvidedDesign} />
      ) : (
        <div
          className="glass-card"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Department Action Status
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {project.status.replace(/_/g, ' ')}
            </div>
          </div>
          <StatusBadge status={project.status} size="md" />
        </div>
      )}

      {/* Workflow Action Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: '#FFFFFF', border: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Business Workflow Hand-offs &amp; Approvals
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Current Stage: <strong>{project.status.replace(/_/g, ' ')}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* COMPLETED: Retry WhatsApp Notification Action */}
            {project.status === 'COMPLETED' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={handleRetryWhatsApp}
                disabled={isRetryingWhatsApp}
                className="btn btn-secondary btn-sm"
                style={{ background: 'rgba(37, 211, 102, 0.15)', border: '1px solid #25d366', color: '#25d366', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                title="Send or retry customer WhatsApp project completion notification"
              >
                <MessageSquare size={16} /> {isRetryingWhatsApp ? 'Sending WhatsApp...' : 'Send / Retry WhatsApp Notification'}
              </button>
            )}

            {/* PATH A: Designer Technical Check Action */}
            {project.customerProvidedDesign && (project.status === 'DESIGN_TECHNICAL_CHECK' || project.status === 'MANAGER_REVIEW' || project.status === 'DRAFT') && hasRole(['ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsTechCheckModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
              >
                <Wrench size={16} /> Perform Machine Technical Check
              </button>
            )}

            {/* PATH B: Designer Start Design Action */}
            {!project.customerProvidedDesign && (project.status === 'MANAGER_REVIEW' || project.status === 'DRAFT') && hasRole(['ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => handleTransition('DESIGN_IN_PROGRESS')}
                disabled={isTransitioning}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #38bdf8, #6366f1)' }}
              >
                <Sparkles size={16} /> Start Artwork Design
              </button>
            )}


            {/* PATH B: Designer Submit Design Action */}
            {!project.customerProvidedDesign && project.status === 'DESIGN_IN_PROGRESS' && hasRole(['ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => handleTransition('DESIGN_SUBMITTED')}
                disabled={isTransitioning}
                className="btn btn-primary btn-sm"
              >
                <CheckSquare size={16} /> Submit Artwork for Customer Approval
              </button>
            )}

            {/* PATH B: Manager Record Customer Approval */}
            {!project.customerProvidedDesign && (project.status === 'DESIGN_SUBMITTED' || project.status === 'CUSTOMER_APPROVAL_PENDING') && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsCustomerApprovalModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #eab308, #ca8a04)' }}
              >
                <ThumbsUp size={16} /> Record Customer Approval
              </button>
            )}

            {/* PATH B: Manager Final Production Approval & Version Lock */}
            {!project.customerProvidedDesign && project.status === 'CUSTOMER_APPROVED' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsManagerApprovalModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                <Lock size={16} /> Manager Approve &amp; Lock for Production
              </button>
            )}

            {/* Production Start Action */}
            {project.status === 'READY_FOR_PRODUCTION' && hasRole(['ROLE_PRODUCTION', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => handleTransition('IN_PRODUCTION')}
                disabled={isTransitioning}
                className="btn btn-primary btn-sm"
              >
                <Hammer size={16} /> Start Print &amp; Fabrication
              </button>
            )}

            {/* Production Finish Action */}
            {project.status === 'IN_PRODUCTION' && hasRole(['ROLE_PRODUCTION', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => handleTransition('QC_PENDING')}
                disabled={isTransitioning}
                className="btn btn-primary btn-sm"
              >
                <ShieldCheck size={16} /> Send to Quality Control (QC)
              </button>
            )}

            {/* QC Action */}
            {project.status === 'QC_PENDING' && hasRole(['ROLE_QC', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsQcModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}
              >
                <ShieldCheck size={16} /> Record QC Inspection
              </button>
            )}

            {/* Dispatch Action */}
            {(project.status === 'QC_PASSED' || project.status === 'DISPATCH_PENDING') && hasRole(['ROLE_DISPATCH', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsDispatchModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #38bdf8, #0284c7)' }}
              >
                <Send size={16} /> Record Logistics &amp; Dispatch
              </button>
            )}

            {/* Installation Action */}
            {(project.status === 'DISPATCHED' || project.status === 'INSTALLATION_PENDING') && hasRole(['ROLE_DISPATCH', 'ROLE_ADMIN', 'ROLE_MANAGER']) && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="btn btn-primary btn-sm"
                style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
              >
                <Wrench size={16} /> Record Installation Completion
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {(hasRole(['ROLE_ADMIN', 'ROLE_MANAGER'])
          ? [
              { id: 'overview', label: 'Overview & Staff', icon: <UserIcon size={16} /> },
              { id: 'requirements', label: `Service Checklist (${project.lineItems?.length || 0})`, icon: <Layers size={16} /> },
              { id: 'materials', label: `Material Inventory (${materialRequirements.length || 0})`, icon: <Package size={16} /> },
              { id: 'designs', label: `Design Proofs (${project.designFiles?.length || 0})`, icon: <FileText size={16} /> },
              { id: 'production', label: `Production Tasks (${project.productionTasks?.length || 0})`, icon: <Hammer size={16} /> },
              { id: 'qc', label: `QC Inspections (${project.qcEvaluations?.length || 0})`, icon: <ShieldCheck size={16} /> },
              { id: 'dispatch', label: `Logistics & Install (${project.dispatchRecords?.length || 0})`, icon: <Send size={16} /> },
              { id: 'audit', label: `Audit Trail (${auditLogs.length})`, icon: <Clock size={16} /> },
            ]
          : hasRole(['ROLE_DESIGNER'])
          ? [
              { id: 'designs', label: `My Design Work (${project.designFiles?.length || 0})`, icon: <FileText size={16} /> },
              { id: 'requirements', label: `Service Specs (${project.lineItems?.length || 0})`, icon: <Layers size={16} /> },
            ]
          : hasRole(['ROLE_PRODUCTION'])
          ? [
              { id: 'requirements', label: `Service Checklist (${project.lineItems?.length || 0})`, icon: <Layers size={16} /> },
              { id: 'materials', label: `Material Inventory (${materialRequirements.length || 0})`, icon: <Package size={16} /> },
              { id: 'production', label: `My Production Work (${project.productionTasks?.length || 0})`, icon: <Hammer size={16} /> },
            ]
          : hasRole(['ROLE_QC'])
          ? [
              { id: 'requirements', label: `Service Specs (${project.lineItems?.length || 0})`, icon: <Layers size={16} /> },
              { id: 'qc', label: `My QC Work (${project.qcEvaluations?.length || 0})`, icon: <ShieldCheck size={16} /> },
            ]
          : hasRole(['ROLE_DISPATCH'])
          ? [
              { id: 'dispatch', label: `My Dispatch & Install Work (${project.dispatchRecords?.length || 0})`, icon: <Send size={16} /> },
            ]
          : []
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.25rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {/* 1. Overview & Staff (ADMIN / MANAGER ONLY) */}
      {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Project Scope &amp; Specifications</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {project.description || 'No detailed scope provided.'}
            </p>

            {project.installationNotes && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fb7185' }}>Installation Completed</div>
                <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                  Date: {project.installationDate || 'Completed'} • {project.installationNotes}
                </div>
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Client Contact Details &amp; WhatsApp Integration
                </h4>
                {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
                  <button
                    onClick={handleOpenEditClient}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    <Edit3 size={13} />
                    Edit Client Details
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Client / Company Name</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{project.client?.companyName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Contact Person</div>
                  <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{project.client?.contactPerson || 'Not provided'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Mobile Number (WhatsApp)</div>
                  <div style={{ fontWeight: 600, color: hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'var(--text-main)' : 'var(--text-dim)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && project.client?.phone ? (
                      <>
                        <span>{project.client.phone}</span>
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MessageSquare size={10} /> +91 {project.client.phone}
                        </span>
                      </>
                    ) : (
                      'Restricted / Internal Access'
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Email Address</div>
                  <div style={{ fontWeight: 600, color: hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'var(--text-main)' : 'var(--text-dim)', marginTop: '0.15rem' }}>
                    {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? (project.client?.email || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontWeight: 400 }}>Not provided</span>) : 'Protected'}
                  </div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Client Address (Delivery Destination)</div>
                  <div style={{ fontWeight: 500, marginTop: '0.15rem', color: hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'var(--text-main)' : 'var(--text-dim)', lineHeight: 1.4 }}>
                    {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? (project.client?.address || 'Not specified') : 'Protected'}
                  </div>
                </div>
                {project.client?.gstNumber && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>GST Number</div>
                    <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {project.client.gstNumber}
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Client Fields */}
              {project.client?.customFields && Object.keys(project.client.customFields).length > 0 && (
                <div style={{ marginTop: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Custom Client Details
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(project.client.customFields).map(([k, v]) => (
                      <div key={k} style={{ padding: '0.35rem 0.75rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-dim)', marginRight: '0.35rem' }}>{k}:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WhatsApp Notification Status & Retry (if COMPLETED) */}
              {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && project.status === 'COMPLETED' && (
                <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <MessageSquare size={18} color="#4ade80" />
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4ade80' }}>WhatsApp Dispatch Notification System</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: +91 {project.client?.phone}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleRetryWhatsApp}
                    disabled={isRetryingWhatsApp}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={12} className={isRetryingWhatsApp ? 'animate-spin' : ''} />
                    {isRetryingWhatsApp ? 'Sending...' : 'Resend WhatsApp Alert'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Assigned Personnel</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Departmental operational task assignments</p>
              </div>
              <span className="badge badge-draft" style={{ fontSize: '0.75rem' }}>
                {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) ? 'Manager Allocation' : 'Assigned Staff'}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { role: 'Designer', department: 'DESIGN' as DepartmentType, user: project.assignedDesigner },
                { role: 'Production Master', department: 'PRODUCTION' as DepartmentType, user: project.assignedProduction },
                { role: 'QC Inspector', department: 'QUALITY_CONTROL' as DepartmentType, user: project.assignedQc },
                { role: 'Dispatch Lead', department: 'DISPATCH' as DepartmentType, user: project.assignedDispatch },
              ].map((staff, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-card)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {staff.role}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                        {staff.user ? (
                          <span style={{ color: 'var(--text-main)' }}>{staff.user.fullName}</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
                    <button
                      onClick={() => handleOpenAssignModal(staff.department, staff.role, staff.user?.id)}
                      className={`btn btn-sm ${staff.user ? 'btn-secondary' : 'btn-primary'}`}
                      style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                    >
                      {staff.user ? 'Reassign' : 'Assign'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Design Proofs & Artwork (DESIGNER / ADMIN / MANAGER) */}
      {activeTab === 'designs' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          {!hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Project Scope &amp; Design Specifications
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {project.description || 'No specific design instructions provided.'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Artwork Proofing, Versioning &amp; Technical Verification</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {project.customerProvidedDesign
                  ? 'Path A: Customer-supplied files verified for machine compatibility.'
                  : 'Path B: Versioned artwork (V1, V2...) requiring Customer Approval and Manager Production Lock.'}
              </p>
            </div>
          </div>

          {/* Upload Form */}
          {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_DESIGNER']) && (
            <form onSubmit={handleFileUpload} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                accept=".pdf,.ai,.psd,.cdr,.png,.jpg,.jpeg,.tiff,.zip"
                style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}
                required
              />
              <button type="submit" disabled={!selectedFile || isUploading} className="btn btn-primary btn-sm">
                <UploadCloud size={16} />
                {isUploading ? 'Validating & Uploading...' : 'Upload Design Version'}
              </button>
            </form>
          )}

          {/* Files List */}
          {project.designFiles?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No design files uploaded yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>File Name</th>
                    <th>Status &amp; Verification</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Uploaded At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {project.designFiles?.map((f) => {
                    const isApprovedForProd = f.isProductionApproved || project.approvedDesignFileId === f.id;
                    return (
                      <tr key={f.id} style={{ background: isApprovedForProd ? 'rgba(52, 211, 153, 0.05)' : 'transparent' }}>
                        <td>
                          <span className="badge badge-design">v{f.versionNumber}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong>{f.originalFileName}</strong>
                            {isApprovedForProd && (
                              <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--bg-subtle)', color: 'var(--text-main)', borderRadius: '4px', fontWeight: 700, border: '1px solid var(--border-subtle)' }}>
                                LOCKED FOR PRODUCTION
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {f.mimeType}
                          </div>
                        </td>
                        <td>
                          {project.customerProvidedDesign ? (
                            f.technicalCheckPassed !== null && f.technicalCheckPassed !== undefined ? (
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                {f.technicalCheckPassed ? 'Machine Check Passed' : 'Compatibility Failed'}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending Technical Check</span>
                            )
                          ) : (
                            <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {f.approvedByCustomer && <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Customer Approved</span>}
                              {f.approvedByManager && <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Manager Approved</span>}
                              {!f.approvedByCustomer && !f.approvedByManager && <span style={{ color: '#94a3b8' }}>Awaiting Sign-off</span>}
                            </div>
                          )}
                        </td>
                        <td>{(f.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</td>
                        <td>{f.uploadedBy?.fullName}</td>
                        <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDownloadFile(f.id, f.originalFileName)}
                            className="btn btn-outline btn-sm"
                          >
                            <Download size={14} /> Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Production Tasks (PRODUCTION / ADMIN / MANAGER) */}
      {activeTab === 'production' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          {!hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Production Specifications &amp; Instructions
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {project.description || 'Standard production guidelines apply.'}
              </p>
              {project.designFiles && project.designFiles.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Approved Artwork for Print Floor:</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {project.designFiles[project.designFiles.length - 1].originalFileName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(project.designFiles![project.designFiles!.length - 1].id, project.designFiles![project.designFiles!.length - 1].originalFileName)}
                    className="btn btn-outline btn-sm"
                  >
                    <Download size={14} /> Download Approved Artwork
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Print &amp; Fabrication Tasks</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Production queue for flex, vinyl, acrylic, and frame assembly
              </p>
            </div>
            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION']) && (
              <button onClick={() => setIsTaskModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={16} /> Add Task
              </button>
            )}
          </div>

          {project.productionTasks?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No production tasks scheduled yet.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Material Spec</th>
                    <th>Machine</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {project.productionTasks?.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.taskName}</strong></td>
                      <td>{t.materialSpecification || 'Standard'}</td>
                      <td>{t.machineType || 'N/A'}</td>
                      <td>{t.quantity} units</td>
                      <td>
                        <span className={`badge ${t.status === 'COMPLETED' ? 'badge-delivered' : 'badge-production'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.status !== 'COMPLETED' && hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION']) && (
                          <button
                            onClick={() => handleCompleteTask(t.id)}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle size={14} /> Mark Completed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. QC Inspections (QC / ADMIN / MANAGER) */}
      {activeTab === 'qc' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          {!hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                QC Specifications &amp; Tolerances
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {project.description || 'Standard quality control inspection guidelines apply.'}
              </p>
              {project.designFiles && project.designFiles.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Approved Proof Reference:</span>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {project.designFiles[project.designFiles.length - 1].originalFileName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(project.designFiles![project.designFiles!.length - 1].id, project.designFiles![project.designFiles!.length - 1].originalFileName)}
                    className="btn btn-outline btn-sm"
                  >
                    <Download size={14} /> Download Proof Reference
                  </button>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Quality Control &amp; Assurance Inspections</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Multi-metric inspection scores against approved production proof
              </p>
            </div>
            {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_QC']) && (
              <button onClick={() => setIsQcModalOpen(true)} className="btn btn-primary btn-sm">
                <ShieldCheck size={16} /> Record Inspection
              </button>
            )}
          </div>

          {project.qcEvaluations?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No QC evaluations recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {project.qcEvaluations?.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: `1px solid ${q.passed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${q.passed ? 'badge-delivered' : 'badge-cancelled'}`}>
                        {q.passed ? 'PASSED QC' : 'FAILED QC'}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Inspected by {q.inspector?.fullName} on {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Color Accuracy</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{q.colorAccuracyScore} / 10</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Dimension Accuracy</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{q.dimensionAccuracyScore} / 10</div>
                    </div>
                    <div style={{ background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Finishing Quality</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{q.finishingScore} / 10</div>
                    </div>
                  </div>

                  {q.remarks && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <strong>Remarks:</strong> {q.remarks}
                    </p>
                  )}
                  {q.defectsNotes && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
                      <strong>Defects:</strong> {q.defectsNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Logistics & Dispatch (DISPATCH / ADMIN / MANAGER) */}
      {activeTab === 'dispatch' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          {!hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']) && (
            <div style={{ marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Delivery Destination &amp; Client</div>
                <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{project.client?.companyName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{project.client?.address || 'Standard Delivery Address'}</div>
                {project.client?.contactPerson && (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Contact: {project.client.contactPerson}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Installation Requirement</div>
                <div style={{ fontWeight: 600, marginTop: '0.25rem', color: 'var(--text-main)' }}>
                  {project.installationRequired ? 'On-Site Installation Required' : 'Delivery Only (No Installation)'}
                </div>
                {project.installationNotes && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>Notes: {project.installationNotes}</div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Logistics, Courier &amp; On-Site Installation</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Courier partner tracking, recipient verification, and on-site installation proof
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_DISPATCH']) && (
                <>
                  <button onClick={() => setIsDispatchModalOpen(true)} className="btn btn-primary btn-sm">
                    <Send size={16} /> Record Dispatch
                  </button>
                  <button onClick={() => setIsInstallModalOpen(true)} className="btn btn-secondary btn-sm">
                    <Wrench size={16} /> Record Installation
                  </button>
                </>
              )}
            </div>
          </div>

          {project.dispatchRecords?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              No dispatch records entered yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {project.dispatchRecords?.map((d) => (
                <div key={d.id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{d.courierPartner}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)', fontSize: '0.875rem' }}>
                        Tracking #: {d.trackingNumber}
                      </div>
                    </div>
                    <span className="badge badge-dispatch">DISPATCHED</span>
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <div>Recipient: <strong style={{ color: 'var(--text-main)' }}>{d.recipientName}</strong></div>
                    <div>Destination: {d.destinationAddress}</div>
                    <div>Dispatched On: {d.dispatchDate} by {d.dispatchedBy?.fullName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Service Checklist (Requirements) */}
      {activeTab === 'requirements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Client Requirement &amp; Advertising Service Checklist</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Specifications, physical dimensions, material selections, and finishing options defined for this project
                </p>
              </div>
              {project.enquiryNumber && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <Layers size={14} /> Origin Enquiry: #{project.enquiryNumber}
                </div>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Services</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {project.lineItems?.length || 0}
                </div>
              </div>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Area</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#3b82f6', marginTop: '0.2rem' }}>
                  {(project.lineItems || []).reduce((acc, item) => acc + (item.totalAreaSqFt || 0), 0).toFixed(2)} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>sq.ft</span>
                </div>
              </div>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Units</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                  {(project.lineItems || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                </div>
              </div>
            </div>

            {/* Line Items List */}
            {(!project.lineItems || project.lineItems.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                <Layers size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Line Item Specifications Recorded</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>This project was created without line item checklist specifications.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {project.lineItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ background: 'var(--bg-base)', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {item.serviceName}
                        </span>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                          {(item.selectedMaterials && item.selectedMaterials.length > 0) ? item.selectedMaterials.join(', ') : 'Custom Substrate'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {item.installationRequired && (
                          <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '3px', background: '#fef3c7', color: '#b45309', fontWeight: 600 }}>
                            Installation Required
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          Qty: {item.quantity} {item.quantityUnit}
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Dimensions &amp; Unit</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {item.width} × {item.height} {item.dimensionUnit}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Area Per Unit / Total</div>
                        <div style={{ fontWeight: 600, color: '#3b82f6', marginTop: '0.2rem' }}>
                          {item.width && item.height ? (item.width * item.height).toFixed(2) : '—'} {item.dimensionUnit} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>→ Total: {item.totalAreaSqFt || (item.width && item.height ? item.width * item.height * item.quantity : 0)} sq.ft</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Printing &amp; Sides</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {item.printSides === 'DOUBLE_SIDED' ? 'Double-Sided' : 'Single-Sided'} ({item.printingType || 'Standard'})
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Design Requirement</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                          {item.designStatus === 'CLIENT_PROVIDED' ? 'Client Proof Provided' : item.designStatus === 'DESIGN_REQUIRED' ? 'In-House Studio Design' : item.designStatus || 'Standard'}
                        </div>
                      </div>
                    </div>

                    {(item.finishingRequirements && item.finishingRequirements.length > 0) && (
                      <div style={{ padding: '0.5rem 1rem 0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Finishing Treatments</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {item.finishingRequirements.map((opt: string, oIdx: number) => (
                            <span key={oIdx} style={{ fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.15rem 0.5rem', borderRadius: '3px', color: '#334155' }}>
                              ✓ {opt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.remarks && (
                      <div style={{ padding: '0.5rem 1rem 0.75rem 1rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <strong>Operator Remarks:</strong> {item.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Panel: Material Inventory & Requirements */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Project Material Requirements &amp; Inventory Traceability</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Track raw material allocations, physical warehouse reservations, and stock issue disbursements for this project
                </p>
              </div>
              <button
                onClick={loadProject}
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={13} /> Refresh Stock Status
              </button>
            </div>

            {materialRequirements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-base)', border: '1px dashed var(--border-subtle)', borderRadius: '6px', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Material Requirements Linked</div>
                <div style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Material requirements are automatically generated when project line items specify catalog substrates.
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Item</th>
                      <th>Service Allocation</th>
                      <th style={{ textAlign: 'right' }}>Required</th>
                      <th style={{ textAlign: 'right' }}>Reserved</th>
                      <th style={{ textAlign: 'right' }}>Issued</th>
                      <th style={{ textAlign: 'right' }}>Available in Stock</th>
                      <th>Status</th>
                      {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION']) && (
                        <th style={{ textAlign: 'center' }}>Warehouse Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {materialRequirements.map((req) => {
                      const avail = req.availableInStock ?? 0;
                      const isFullyReserved = req.reservedQuantity >= req.requiredQuantity;
                      const isFullyIssued = req.issuedQuantity >= req.requiredQuantity;

                      const getStatusBadge = () => {
                        switch (req.status) {
                          case 'FULLY_ISSUED':
                            return <span style={{ fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d' }}>ISSUED</span>;
                          case 'PARTIALLY_ISSUED':
                            return <span style={{ fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fed7aa', color: '#c2410c' }}>PARTIAL ISSUE</span>;
                          case 'RESERVED':
                            return <span style={{ fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1' }}>RESERVED</span>;
                          default:
                            return <span style={{ fontSize: '11px', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#f3f4f6', color: '#4b5563' }}>PENDING</span>;
                        }
                      };

                      return (
                        <tr key={req.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {req.materialName || 'Raw Material'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                              SKU: {req.itemCode || 'N/A'}
                            </div>
                          </td>
                          <td style={{ fontSize: '12px' }}>
                            {req.serviceName || 'General Production'}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>
                            {req.requiredQuantity} {req.unit}
                          </td>
                          <td style={{ textAlign: 'right', color: '#0284c7', fontWeight: 600 }}>
                            {req.reservedQuantity} {req.unit}
                          </td>
                          <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                            {req.issuedQuantity} {req.unit}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 600, color: avail < 10 ? '#dc2626' : 'var(--text-main)' }}>
                              {avail} {req.unit}
                            </span>
                            {avail < 10 && (
                              <div style={{ fontSize: '10px', color: '#dc2626' }}>Low Stock</div>
                            )}
                          </td>
                          <td>{getStatusBadge()}</td>
                          {hasRole(['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_PRODUCTION']) && (
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenReserve(req)}
                                  disabled={isFullyReserved || avail <= 0}
                                  className="btn btn-outline btn-sm"
                                  style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}
                                  title={isFullyReserved ? 'Already fully reserved' : avail <= 0 ? 'Out of stock' : 'Reserve inventory'}
                                >
                                  Reserve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenIssue(req)}
                                  disabled={isFullyIssued || (req.reservedQuantity <= req.issuedQuantity && avail <= 0)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: '11px', padding: '0.25rem 0.5rem' }}
                                  title={isFullyIssued ? 'Fully issued' : 'Issue to floor'}
                                >
                                  Issue
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Audit Trail */}
      {activeTab === 'audit' && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Resource Security Audit Trail</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Old State</th>
                  <th>New State</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No audit records found for this project.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.actorEmail}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.actorRole}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.oldValue || '—'}</td>
                      <td>{log.newValue || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{log.ipAddress}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Path A Designer Technical Check */}
      {isTechCheckModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Designer Technical / Machine Compatibility Check</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Check customer-supplied design for print resolution, CMYK color gamut, bleed, and machine cut paths.
            </p>
            <form onSubmit={handleRecordTechnicalCheck}>
              <div className="form-group">
                <label className="form-label">Technical Check Result</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: techCheckPassed ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                    border: techCheckPassed ? '1px solid #34d399' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" checked={techCheckPassed} onChange={() => setTechCheckPassed(true)} />
                    <span style={{ fontWeight: 700, color: '#000000' }}>Compatible for Production</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: !techCheckPassed ? 'var(--bg-subtle)' : 'transparent',
                    border: !techCheckPassed ? '1px solid #000000' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" checked={!techCheckPassed} onChange={() => setTechCheckPassed(false)} />
                    <span style={{ fontWeight: 700, color: '#000000' }}>Needs Customer Revision</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Technical Compatibility Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={techCheckNotes}
                  onChange={(e) => setTechCheckNotes(e.target.value)}
                  placeholder="e.g. Resolution 300 DPI verified, CMYK curves checked, suitable for flatbed UV printing."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsTechCheckModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Technical Check</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Path B Customer Approval */}
      {isCustomerApprovalModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Record Customer Design Approval</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Record client decision for the submitted artwork proofs.
            </p>
            <form onSubmit={handleRecordCustomerApproval}>
              <div className="form-group">
                <label className="form-label">Client Decision</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: customerApproved ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
                    border: customerApproved ? '1px solid #34d399' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" checked={customerApproved} onChange={() => setCustomerApproved(true)} />
                    <span style={{ fontWeight: 700, color: '#000000' }}>Customer Approved</span>
                  </label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: !customerApproved ? 'var(--bg-subtle)' : 'transparent',
                    border: !customerApproved ? '1px solid #000000' : '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input type="radio" checked={!customerApproved} onChange={() => setCustomerApproved(false)} />
                    <span style={{ fontWeight: 700, color: '#000000' }}>Changes Requested</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Customer Feedback / Remarks</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={customerFeedback}
                  onChange={(e) => setCustomerFeedback(e.target.value)}
                  placeholder="e.g. Approved logo placement and dimensions as per quote."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsCustomerApprovalModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Customer Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Path B Manager Production Approval & Version Lock */}
      {isManagerApprovalModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Manager Approval &amp; Production Version Lock</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Select the approved design version to permanently lock for production.
            </p>
            <form onSubmit={handleRecordManagerApproval}>
              <div className="form-group">
                <label className="form-label">Select Approved Design File Version</label>
                <select
                  className="form-select"
                  value={selectedApprovedFileId}
                  onChange={(e) => setSelectedApprovedFileId(e.target.value)}
                  required
                >
                  {project.designFiles?.map((f) => (
                    <option key={f.id} value={f.id}>
                      Version {f.versionNumber}: {f.originalFileName} (Uploaded by {f.uploadedBy?.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pre-Press Verification Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={managerApprovalNotes}
                  onChange={(e) => setManagerApprovalNotes(e.target.value)}
                  placeholder="Pre-press check verified..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsManagerApprovalModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Lock &amp; Release to Production</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Installation Record */}
      {isInstallModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Record On-Site Installation</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Confirm on-site mounting, wiring, and client handover.
            </p>
            <form onSubmit={handleRecordInstallation}>
              <div className="form-group">
                <label className="form-label">Installation Completion Date</label>
                <input type="date" className="form-input" value={installDate} onChange={(e) => setInstallDate(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Installation &amp; Handover Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={installNotes}
                  onChange={(e) => setInstallNotes(e.target.value)}
                  placeholder="Mounted securely on facade, electrical connections tested..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsInstallModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Production Task */}
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Add Production Task</h3>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Task Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. UV Flatbed Printing on 5mm Acrylic"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Material Spec</label>
                <input
                  type="text"
                  className="form-input"
                  value={materialSpec}
                  onChange={(e) => setMaterialSpec(e.target.value)}
                  placeholder="e.g. 3M Cast Vinyl + Gloss Lamination"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Machine</label>
                  <select className="form-select" value={machineType} onChange={(e) => setMachineType(e.target.value)}>
                    <option value="Flatbed UV Printer">Flatbed UV Printer</option>
                    <option value="Eco-Solvent Large Format">Eco-Solvent Large Format</option>
                    <option value="CNC Router / Laser Cutter">CNC Router / Laser Cutter</option>
                    <option value="Tension Fabric LED System">Tension Fabric LED System</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QC Inspection */}
      {isQcModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Record Quality Control Inspection</h3>
            <form onSubmit={handleRecordQc}>
              <div className="form-group">
                <label className="form-label">Overall Evaluation</label>
                <select className="form-select" value={qcPassed ? 'PASS' : 'FAIL'} onChange={(e) => setQcPassed(e.target.value === 'PASS')}>
                  <option value="PASS">Pass Quality Standards</option>
                  <option value="FAIL">Reject Quality / Needs Rework</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Color Accuracy (1-10)</label>
                  <input type="number" min="1" max="10" className="form-input" value={colorScore} onChange={(e) => setColorScore(parseInt(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Dimension Accuracy (1-10)</label>
                  <input type="number" min="1" max="10" className="form-input" value={dimensionScore} onChange={(e) => setDimensionScore(parseInt(e.target.value))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Finishing Score (1-10)</label>
                  <input type="number" min="1" max="10" className="form-input" value={finishScore} onChange={(e) => setFinishScore(parseInt(e.target.value))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-textarea" rows={2} value={qcRemarks} onChange={(e) => setQcRemarks(e.target.value)} placeholder="Color delta within 1.5, edges smoothed..." required />
              </div>

              {!qcPassed && (
                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--danger)' }}>Defects / Rework Instructions</label>
                  <textarea className="form-textarea" rows={2} value={defectsNotes} onChange={(e) => setDefectsNotes(e.target.value)} placeholder="Describe defects..." required />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsQcModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save QC Decision</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Dispatch */}
      {isDispatchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Record Dispatch &amp; Logistics</h3>
            <form onSubmit={handleRecordDispatch}>
              <div className="form-group">
                <label className="form-label">Courier Partner</label>
                <select className="form-select" value={courierPartner} onChange={(e) => setCourierPartner(e.target.value)}>
                  <option value="Rohilla In-House Delivery Fleet">Rohilla In-House Delivery Fleet</option>
                  <option value="Blue Dart Express">Blue Dart Express</option>
                  <option value="DTDC Courier">DTDC Courier</option>
                  <option value="V-Trans Logistics">V-Trans Logistics (Heavy Freight)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tracking / Consignment Number</label>
                <input type="text" className="form-input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. BD-984729104" required />
              </div>

              <div className="form-group">
                <label className="form-label">Recipient Name</label>
                <input type="text" className="form-input" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Address</label>
                <textarea className="form-textarea" rows={2} value={destinationAddress} onChange={(e) => setDestinationAddress(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Dispatch Notes</label>
                <input type="text" className="form-input" value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)} placeholder="e.g. 2 boxes containing flex rolls" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setIsDispatchModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Assign / Reassign Task */}
      {isAssignModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Assign {assignDepartmentLabel}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Allocate project task to an active {assignDepartmentLabel} team member
                </p>
              </div>
              <button onClick={() => setIsAssignModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAssignTask}>
              <div className="form-group">
                <label className="form-label">Select Active Employee ({assignDepartment})</label>
                <select
                  className="form-select"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Active Department Employee --</option>
                  {allStaff
                    .filter(
                      (u) =>
                        u.status === 'ACTIVE' &&
                        (u.department === assignDepartment ||
                          (assignDepartment === 'DESIGN' && u.roles.includes('ROLE_DESIGNER')) ||
                          (assignDepartment === 'PRODUCTION' && u.roles.includes('ROLE_PRODUCTION')) ||
                          (assignDepartment === 'QUALITY_CONTROL' && u.roles.includes('ROLE_QC')) ||
                          (assignDepartment === 'DISPATCH' && u.roles.includes('ROLE_DISPATCH')))
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment / Reassignment Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Assigned for artwork creation / Reassigned due to shift schedule"
                />
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-card)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem',
                }}
              >
                The assigned employee will receive an instant notification and see this project in their active department workspace.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isAssigning || !selectedEmployeeId} className="btn btn-primary">
                  {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Edit Client Contact Details (ADMIN / MANAGER ONLY) */}
      {isEditClientModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Client Contact Details</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Update client information and WhatsApp notification settings (Audited)
                </p>
              </div>
              <button onClick={() => setIsEditClientModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Client Name / Company <span style={{ color: '#ef4444' }}>*</span></span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editClientName}
                  onChange={(e) => {
                    setEditClientName(e.target.value);
                    if (editClientErrors.editClientName) setEditClientErrors((prev) => ({ ...prev, editClientName: '' }));
                  }}
                  placeholder="e.g. Acme Corp / Rahul Sharma"
                  required
                />
                {editClientErrors.editClientName && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {editClientErrors.editClientName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Mobile Number (WhatsApp Notifications) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '0.875rem', fontWeight: 600 }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    className="form-input"
                    style={{ paddingLeft: '3.25rem' }}
                    value={editClientPhone}
                    onChange={(e) => handleEditPhoneChange(e.target.value)}
                    placeholder="9810001111"
                    maxLength={10}
                    required
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Enter exact 10-digit mobile number for automated WhatsApp dispatch alerts.
                </div>
                {(editPhoneError || editClientErrors.editClientPhone) && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {editPhoneError || editClientErrors.editClientPhone}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Client Address (Physical / Delivery) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editClientAddress}
                  onChange={(e) => {
                    setEditClientAddress(e.target.value);
                    if (editClientErrors.editClientAddress) setEditClientErrors((prev) => ({ ...prev, editClientAddress: '' }));
                  }}
                  placeholder="e.g. Shop 42, Connaught Place, New Delhi 110001"
                  required
                />
                {editClientErrors.editClientAddress && (
                  <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {editClientErrors.editClientAddress}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Optional)</span>
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={editClientEmail}
                    onChange={(e) => {
                      setEditClientEmail(e.target.value);
                      if (editClientErrors.editClientEmail) setEditClientErrors((prev) => ({ ...prev, editClientEmail: '' }));
                    }}
                    placeholder="client@company.com"
                  />
                  {editClientErrors.editClientEmail && (
                    <div style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {editClientErrors.editClientEmail}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Contact Person <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editClientContactPerson}
                    onChange={(e) => setEditClientContactPerson(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  GST Number <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  value={editClientGstNumber}
                  onChange={(e) => setEditClientGstNumber(e.target.value)}
                  placeholder="07AAAAA0000A1Z5"
                />
              </div>

              {/* Dynamic Custom Client Details Section */}
              <div style={{ marginTop: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Custom Client Details</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Add dynamic custom attributes (e.g., Secondary Contact, Alternate Delivery Address)</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditCustomField}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem' }}
                  >
                    <Plus size={13} />
                    Add Custom Detail
                  </button>
                </div>

                {editCustomFields.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>
                    No custom fields added. Click "+ Add Custom Detail" to add key-value pairs.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {editCustomFields.map((cf) => (
                      <div key={cf.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1, fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Field Name (e.g. Alternate Phone)"
                          value={cf.key}
                          onChange={(e) => handleUpdateEditCustomField(cf.id, e.target.value, cf.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          style={{ flex: 1.5, fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
                          placeholder="Field Value"
                          value={cf.value}
                          onChange={(e) => handleUpdateEditCustomField(cf.id, cf.key, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEditCustomField(cf.id)}
                          className="btn btn-outline btn-sm"
                          style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.4rem' }}
                          title="Remove Field"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  background: 'var(--bg-base)',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.25rem',
                }}
              >
                Changing customer contact details will be logged to the project audit history with previous and new values.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingClient || !!editPhoneError}
                  className="btn btn-primary"
                >
                  {isSavingClient ? 'Saving...' : 'Save Client Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Stock Reservation */}
      {isReserveModalOpen && selectedRequirement && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Reserve Inventory Stock</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Hold physical inventory in the warehouse allocated specifically for Project #{project?.projectCode}.
            </p>

            <form onSubmit={handleConfirmReserve}>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedRequirement.materialName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Required: <strong>{selectedRequirement.requiredQuantity} {selectedRequirement.unit}</strong> • Currently Reserved: <strong>{selectedRequirement.reservedQuantity} {selectedRequirement.unit}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#0284c7', marginTop: '0.25rem' }}>
                  Available in Warehouse: <strong>{selectedRequirement.availableInStock ?? 0} {selectedRequirement.unit}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Quantity to Reserve ({selectedRequirement.unit}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedRequirement.availableInStock ?? 9999}
                  className="form-input"
                  value={reserveQty}
                  onChange={(e) => setReserveQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Batch / Roll Number (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ROLL-2026-B8"
                  value={reserveBatch}
                  onChange={(e) => setReserveBatch(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Warehouse Storage Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={reserveLocation}
                  onChange={(e) => setReserveLocation(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Reservation Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={reserveNotes}
                  onChange={(e) => setReserveNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsReserveModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isReserving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReserving}
                  className="btn btn-primary"
                >
                  {isReserving ? 'Reserving...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Stock Issuance */}
      {isIssueModalOpen && selectedRequirement && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Issue Stock to Production</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Authorize release of physical material from warehouse to printing/fabrication floor.
            </p>

            <form onSubmit={handleConfirmIssue}>
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedRequirement.materialName}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                  Total Required: <strong>{selectedRequirement.requiredQuantity} {selectedRequirement.unit}</strong> • Already Issued: <strong>{selectedRequirement.issuedQuantity} {selectedRequirement.unit}</strong>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#16a34a', marginTop: '0.25rem' }}>
                  Reserved Quantity: <strong>{selectedRequirement.reservedQuantity} {selectedRequirement.unit}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Quantity to Issue ({selectedRequirement.unit}) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Issued To (Operator / Floor) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Issue Notes</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={issueNotes}
                  onChange={(e) => setIssueNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isIssuing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  {isIssuing ? 'Issuing...' : 'Authorize & Issue Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
