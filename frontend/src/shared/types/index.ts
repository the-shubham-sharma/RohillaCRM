export type RoleType = 
  | 'ROLE_ADMIN'
  | 'ROLE_MANAGER'
  | 'ROLE_DESIGNER'
  | 'ROLE_PRODUCTION'
  | 'ROLE_QC'
  | 'ROLE_DISPATCH';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type DepartmentType = 
  | 'MANAGEMENT'
  | 'DESIGN'
  | 'PRODUCTION'
  | 'QUALITY_CONTROL'
  | 'DISPATCH';

export type ProjectStatus = 
  | 'DRAFT'
  | 'MANAGER_REVIEW'
  | 'DESIGN_TECHNICAL_CHECK'
  | 'DESIGN_IN_PROGRESS'
  | 'DESIGN_SUBMITTED'
  | 'CUSTOMER_APPROVAL_PENDING'
  | 'CUSTOMER_APPROVED'
  | 'CUSTOMER_REWORK_REQUESTED'
  | 'MANAGER_APPROVED'
  | 'READY_FOR_PRODUCTION'
  | 'IN_PRODUCTION'
  | 'PRODUCTION_COMPLETED'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_REJECTED'
  | 'DISPATCH_PENDING'
  | 'DISPATCHED'
  | 'INSTALLATION_PENDING'
  | 'INSTALLATION_COMPLETED'
  | 'COMPLETED'
  | 'CANCELLED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type DateFilterPeriod = 
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export type AuditAction = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'USER_CREATED'
  | 'USER_STATUS_UPDATED'
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'ROLE_ASSIGNED'
  | 'PASSWORD_CHANGED'
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_ASSIGNED'
  | 'PROJECT_REASSIGNED'
  | 'PROJECT_STATUS_TRANSITION'
  | 'DESIGN_UPLOADED'
  | 'DESIGN_VERSION_CREATED'
  | 'TECHNICAL_CHECK_RECORDED'
  | 'CUSTOMER_APPROVAL'
  | 'MANAGER_APPROVAL'
  | 'PRODUCTION_TASK_STARTED'
  | 'PRODUCTION_TASK_COMPLETED'
  | 'PRODUCTION_COMPLETED'
  | 'QC_INSPECTION_RECORDED'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'DISPATCH_RECORDED'
  | 'DISPATCH_COMPLETED'
  | 'INSTALLATION_RECORDED'
  | 'INSTALLATION_COMPLETED'
  | 'PROJECT_COMPLETED'
  | 'CLIENT_CREATED'
  | 'CLIENT_UPDATED'
  | 'WHATSAPP_NOTIFICATION_SENT'
  | 'WHATSAPP_NOTIFICATION_FAILED'
  | 'FILE_DOWNLOADED'
  | 'ACCESS_DENIED_ATTEMPT'
  | 'PROFILE_CREATED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_PHOTO_UPDATED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REPLACED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED';

export type DocumentType = 'AADHAAR' | 'PAN';

export type DocumentVerificationStatus =
  | 'NOT_UPLOADED'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export interface UserSummary {
  id: string;
  employeeId?: string;
  email: string;
  fullName: string;
  phone?: string;
  department: DepartmentType;
  status: UserStatus;
  roles: RoleType[];
  permissions: string[];
  mustChangePassword?: boolean;
  temporaryPassword?: string;
  joiningDate?: string;
  hasProfilePhoto?: boolean;
  aadhaarStatus?: DocumentVerificationStatus;
  panStatus?: DocumentVerificationStatus;
}

export interface EmployeeDocument {
  id: string;
  documentType: DocumentType;
  documentNumberMasked?: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  status: DocumentVerificationStatus;
  uploadedAt: string;
  verifiedAt?: string;
  verifiedByName?: string;
  rejectionReason?: string;
  version: number;
  current: boolean;
}

export interface UserProfile {
  id: string;
  employeeId: string;
  email: string;
  fullName: string;
  phone?: string;
  department: DepartmentType;
  status: UserStatus;
  roles: RoleType[];
  joiningDate?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  hasProfilePhoto: boolean;
  profilePhotoUrl?: string;
  documents: EmployeeDocument[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface VerifyDocumentRequest {
  status: DocumentVerificationStatus;
  rejectionReason?: string;
  documentNumber?: string;
}

export interface AssignTaskRequest {
  department: DepartmentType;
  employeeId: string;
  notes?: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface CreateEmployeeRequest {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  department: DepartmentType;
  roles: RoleType[];
  status?: UserStatus;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserSummary;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  formattedWhatsAppPhone?: string;
  address?: string;
  gstNumber?: string;
  customFields?: Record<string, string>;
  createdAt: string;
}

export interface CreateClientRequest {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address: string;
  gstNumber?: string;
  customFields?: Record<string, string>;
}

export interface UpdateClientRequest {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address: string;
  gstNumber?: string;
  customFields?: Record<string, string>;
}

export interface CreateProjectRequest {
  projectCode: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientEmail?: string;
  contactPerson?: string;
  gstNumber?: string;
  clientCustomFields?: Record<string, string>;
  priority: Priority;
  customerProvidedDesign: boolean;
  installationRequired: boolean;
  dueDate?: string;
  budget?: number;
  assignedDesignerId?: string;
  assignedProductionId?: string;
  assignedQcId?: string;
  assignedDispatchId?: string;
  enquiryId?: string;
  lineItems?: import('./enquiry').EnquiryLineItemRequest[];
}


export interface DesignFile {
  id: string;
  projectId: string;
  originalFileName: string;
  storageKey: string;
  fileSizeBytes: number;
  mimeType: string;
  versionNumber: number;
  uploadedBy: UserSummary;
  technicalCheckPassed?: boolean;
  compatibilityNotes?: string;
  technicalCheckedBy?: UserSummary;
  approvedByCustomer?: boolean;
  customerFeedback?: string;
  approvedByManager?: UserSummary;
  managerApprovedAt?: string;
  isProductionApproved: boolean;
  isLocked: boolean;
  createdAt: string;
}

export interface ProductionTask {
  id: string;
  projectId: string;
  taskName: string;
  materialSpecification?: string;
  machineType?: string;
  quantity: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: UserSummary;
  notes?: string;
  createdAt: string;
}

export interface QCEvaluation {
  id: string;
  projectId: string;
  inspector: UserSummary;
  passed: boolean;
  colorAccuracyScore: number;
  dimensionAccuracyScore: number;
  finishingScore: number;
  remarks?: string;
  defectsNotes?: string;
  inspectionPhotoStorageKey?: string;
  createdAt: string;
}

export interface DispatchRecord {
  id: string;
  projectId: string;
  dispatchDate: string;
  courierPartner: string;
  trackingNumber: string;
  recipientName: string;
  destinationAddress: string;
  podPhotoStorageKey?: string;
  dispatchedBy: UserSummary;
  dispatchNotes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProjectListItem {
  id: string;
  projectCode: string;
  title: string;
  description?: string;
  client: Client;
  status: ProjectStatus;
  priority: Priority;
  customerProvidedDesign: boolean;
  approvedDesignFileId?: string;
  installationRequired: boolean;
  leadId?: string;
  leadCode?: string;
  assignedDesigner?: UserSummary;
  assignedProduction?: UserSummary;
  assignedQc?: UserSummary;
  assignedDispatch?: UserSummary;
  createdBy: UserSummary;
  dueDate?: string;
  budget?: number;
  designFilesCount: number;
  productionTasksCount: number;
  qcPassed?: boolean;
  isDispatched: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectListItem {
  installationDate?: string;
  installationNotes?: string;
  installationCompletedBy?: UserSummary;
  designFiles: DesignFile[];
  productionTasks: ProductionTask[];
  qcEvaluations: QCEvaluation[];
  dispatchRecords: DispatchRecord[];
  enquiryId?: string;
  enquiryNumber?: string;
  lineItems?: import('./enquiry').EnquiryLineItemDto[];
  materialRequirements?: import('./enquiry').ProjectMaterialRequirementDto[];
  allowedNextStatuses: ProjectStatus[];
}

export interface AuditLogItem {
  id: string;
  actorId?: string;
  actorEmail: string;
  actorRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress: string;
  userAgent?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ==========================================
// DEPARTMENT WORKSPACES & WORKSTATIONS
// ==========================================

export interface DepartmentWorkspace {
  department: DepartmentType;
  userFullName: string;
  userRole: string;
  activeWork: ProjectListItem[];
  waitingWork: ProjectListItem[];
  recentWork: ProjectListItem[];
}

// ==========================================
// DEPARTMENT PERMANENT WORK HISTORY
// ==========================================

export interface DesignerHistoryItem {
  projectId: string;
  projectCode: string;
  title: string;
  taskType: string;
  assignedAt: string;
  startedAt: string;
  submittedAt: string;
  completedAt?: string;
  versionCount: number;
  reworkCount: number;
  finalStatus: string;
  completionTimeHours?: number;
  completionTimeDays?: number;
  priority: Priority;
  dueDate?: string;
  onTime: boolean;
  latestFeedback?: string;
}

export interface ProductionHistoryItem {
  projectId: string;
  projectCode: string;
  title: string;
  taskId?: string;
  taskName: string;
  materialSpecification?: string;
  machineType?: string;
  quantity: number;
  assignedAt: string;
  startedAt: string;
  completedAt?: string;
  durationHours?: number;
  reworkCount: number;
  qcSubmissionDate?: string;
  status: string;
  priority: Priority;
  dueDate?: string;
  onTime: boolean;
  notes?: string;
}

export interface QcHistoryItem {
  projectId: string;
  projectCode: string;
  title: string;
  evaluationId: string;
  inspectionDate: string;
  inspectionType: string;
  passed: boolean;
  colorAccuracyScore: number;
  dimensionAccuracyScore: number;
  finishingScore: number;
  averageScore: number;
  remarks?: string;
  defectsNotes?: string;
  reworkRequested: boolean;
  inspectionDurationMinutes: number;
  totalInspections: number;
  onTime: boolean;
}

export interface DispatchHistoryItem {
  projectId: string;
  projectCode: string;
  title: string;
  recordId?: string;
  courierPartner: string;
  trackingNumber: string;
  assignedAt: string;
  dispatchDate: string;
  installationRequired: boolean;
  installationDate?: string;
  completedAt?: string;
  deliveryStatus: string;
  recipientSummary?: string;
  destinationSummary?: string;
  onTime: boolean;
  dispatchNotes?: string;
  installationNotes?: string;
}

// ==========================================
// DEPARTMENT & EXECUTIVE PERFORMANCE
// ==========================================

export interface DesignerPerformance {
  period: DateFilterPeriod;
  designsCompleted: number;
  designsSubmitted: number;
  revisionsCount: number;
  averageCompletionTimeDays: number;
  onTimeCompletionRate: number;
  activeJobs: number;
}

export interface ProductionPerformance {
  period: DateFilterPeriod;
  jobsCompleted: number;
  jobsInProgress: number;
  reworkJobs: number;
  averageProductionTimeHours: number;
  onTimeCompletionRate: number;
}

export interface QcPerformance {
  period: DateFilterPeriod;
  inspectionsCompleted: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
  passRate: number;
  reworkRate: number;
  averageInspectionTimeMinutes: number;
  averageQualityScore: number;
}

export interface DispatchPerformance {
  period: DateFilterPeriod;
  dispatchesCompleted: number;
  installationsCompleted: number;
  pendingJobs: number;
  onTimeCompletionRate: number;
  averageCompletionTimeDays: number;
}

export interface EmployeePerformanceSummary {
  userId: string;
  fullName: string;
  email: string;
  department: string;
  completedCount: number;
  submittedOrActiveCount: number;
  reworkCount: number;
  onTimeRate: number;
  averageTime: number;
  timeUnit: string;
}

export interface TeamPerformance {
  period: DateFilterPeriod;
  designerMetrics: EmployeePerformanceSummary[];
  productionMetrics: EmployeePerformanceSummary[];
  qcMetrics: EmployeePerformanceSummary[];
  dispatchMetrics: EmployeePerformanceSummary[];
}

export interface CompanyPerformance {
  period: DateFilterPeriod;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overallOnTimeRate: number;
  delaysCount: number;
  totalReworkCount: number;
  departmentWorkload: Record<string, number>;
  designerProductivity: DesignerPerformance;
  productionProductivity: ProductionPerformance;
  qcProductivity: QcPerformance;
  dispatchProductivity: DispatchPerformance;
}

export type LeadStatus = 'NEW_LEAD' | 'CONTACTED' | 'CONVERTED' | 'ARCHIVED';

export interface Lead {
  id: string;
  leadCode: string;
  customerName: string;
  phone: string;
  email?: string;
  companyName?: string;
  requirement: string;
  productService: string;
  quantity: number;
  size: string;
  location: string;
  designRequired: boolean;
  designFileStorageKey?: string;
  designFileName?: string;
  notes?: string;
  status: LeadStatus;
  convertedProjectId?: string;
  convertedProjectCode?: string;
  assignedManagerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerEnquiryRequest {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  requirement: string;
  productService: string;
  quantity: number;
  size: string;
  location: string;
  designRequired?: boolean;
  designFileStorageKey?: string;
  designFileName?: string;
  notes?: string;
}

export interface LeadResponseDto extends Lead {}

export interface UpdateLeadStatusRequest {
  status: LeadStatus;
  notes?: string;
}

export interface CreateUserRequest {
  email: string;
  fullName: string;
  phoneNumber?: string;
  department: DepartmentType;
  roles: RoleType[];
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export * from './enquiry';
