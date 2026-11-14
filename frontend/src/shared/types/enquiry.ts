import { Client, UserSummary } from './index';

export type EnquiryStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'CONVERTED_TO_PROJECT'
  | 'CANCELLED';

export type EnquiryPriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type LeadSource = 
  | 'WALK_IN'
  | 'PHONE_CALL'
  | 'WHATSAPP'
  | 'EMAIL'
  | 'EXTERNAL_WEBSITE'
  | 'REFERRAL'
  | 'OTHER';

export type DimensionUnit = 'FEET' | 'INCHES' | 'METRES' | 'MILLIMETRES';

export type QuantityUnit = 'PIECE' | 'SET' | 'RUNNING_FT' | 'SQ_FT' | 'OTHER';

export type PrintSides = 'SINGLE_SIDED' | 'DOUBLE_SIDED';

export type PrintingType = 
  | 'FULL_COLOUR'
  | 'BLACK_AND_WHITE'
  | 'UV_PRINT'
  | 'SOLVENT_PRINT'
  | 'ECO_SOLVENT_PRINT'
  | 'LATEX_PRINT';

export type DesignRequirementStatus = 
  | 'CLIENT_PROVIDED'
  | 'DESIGN_REQUIRED'
  | 'MINOR_MODIFICATION'
  | 'PENDING_APPROVAL';

export type QuotationStatus = 
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SENT'
  | 'ACCEPTED'
  | 'REJECTED';

export interface ServiceCatalogDto {
  serviceName: string;
  materials: string[];
  finishingOptions: string[];
  defaultUnits: string[];
}

export interface EnquiryLineItemRequest {
  id?: string;
  serviceName: string;
  width?: number;
  height?: number;
  dimensionUnit: DimensionUnit;
  siteMeasurementRequired: boolean;
  quantity: number;
  quantityUnit: QuantityUnit;
  printSides: PrintSides;
  printingType: PrintingType;
  areaPerSideSqFt?: number;
  totalAreaSqFt?: number;
  areaPerSideSqM?: number;
  totalAreaSqM?: number;
  installationRequired: boolean;
  installationLocation?: string;
  siteInspectionRequired: boolean;
  deliveryDate?: string;
  designStatus: DesignRequirementStatus;
  selectedMaterials: string[];
  materialConfirmedByManager: boolean;
  finishingRequirements: string[];
  remarks?: string;
}

export interface EnquiryLineItemDto extends EnquiryLineItemRequest {
  id: string;
}

export interface EnquiryCreateRequest {
  clientId?: string;
  clientName: string;
  companyName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  gstNumber?: string;
  leadSource?: LeadSource;
  isDraft: boolean;
  priority?: EnquiryPriority;
  expectedCompletionDate?: string;
  quotationStatus?: QuotationStatus;
  estimatedAmount?: number;
  designStatus?: DesignRequirementStatus;
  customerRemarks?: string;
  internalRemarks?: string;
  lineItems: EnquiryLineItemRequest[];
}

export interface EnquiryResponseDto {
  id: string;
  enquiryNumber: string;
  enquiryDate: string;
  client?: Client;
  clientName: string;
  companyName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  gstNumber?: string;
  leadSource: LeadSource;
  recordedBy?: UserSummary;
  status: EnquiryStatus;
  priority: EnquiryPriority;
  expectedCompletionDate?: string;
  quotationStatus: QuotationStatus;
  estimatedAmount?: number;
  designStatus: DesignRequirementStatus;
  customerRemarks?: string;
  internalRemarks?: string;
  convertedProjectId?: string;
  convertedProjectCode?: string;
  lineItems: EnquiryLineItemDto[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// INVENTORY & MATERIAL REQUIREMENTS
// ==========================================

export type RequirementStatus = 
  | 'PENDING'
  | 'RESERVED'
  | 'PARTIALLY_ISSUED'
  | 'FULLY_ISSUED'
  | 'CANCELLED';

export type StockTransactionType = 
  | 'OPENING_BALANCE'
  | 'PURCHASE_RECEIPT'
  | 'RESERVATION'
  | 'MATERIAL_ISSUE'
  | 'RETURN_TO_STOCK'
  | 'WASTAGE'
  | 'DAMAGE'
  | 'ADJUSTMENT';

export interface InventoryItemDto {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  unitCost?: number;
  location?: string;
  notes?: string;
  lowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItemRequest {
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  initialStock?: number;
  reorderLevel?: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export interface UpdateInventoryItemRequest {
  name?: string;
  category?: string;
  unit?: string;
  reorderLevel?: number;
  unitCost?: number;
  location?: string;
  notes?: string;
}

export interface ProjectMaterialRequirementDto {
  id: string;
  projectId: string;
  inventoryItemId?: string;
  itemCode?: string;
  materialName: string;
  serviceName?: string;
  requiredQuantity: number;
  unit: string;
  reservedQuantity: number;
  issuedQuantity: number;
  availableInStock: number;
  status: RequirementStatus;
  notes?: string;
}

export interface StockReserveRequest {
  requirementId: string;
  inventoryItemId?: string;
  quantity: number;
  notes?: string;
}

export interface StockIssueRequest {
  requirementId: string;
  quantity: number;
  notes?: string;
}

export interface StockTransactionDto {
  id: string;
  transactionCode: string;
  inventoryItemId: string;
  itemCode: string;
  itemName: string;
  transactionType: StockTransactionType;
  quantity: number;
  unit: string;
  balanceBefore: number;
  balanceAfter: number;
  projectId?: string;
  projectCode?: string;
  enquiryId?: string;
  enquiryNumber?: string;
  performedBy?: UserSummary;
  reason?: string;
  createdAt: string;
}

export interface StockTransactionRequest {
  inventoryItemId: string;
  transactionType: StockTransactionType;
  quantity: number;
  projectId?: string;
  reason?: string;
}
