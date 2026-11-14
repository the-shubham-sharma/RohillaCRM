import React, { useState, useEffect } from 'react';
import {
  EnquiryResponseDto,
  EnquiryCreateRequest,
  EnquiryStatus,
  EnquiryPriority,
  LeadSource,
  QuotationStatus,
  DesignRequirementStatus,
  EnquiryLineItemRequest,
} from '../../shared/types';
import { enquiryApi } from '../../services/api';
import { useAuth } from '../../shared/context/AuthContext';
import { ClientSelector, ClientDataState } from './components/ClientSelector';
import { ClientRequirementChecklist } from './components/ClientRequirementChecklist';
import {
  PlusCircle,
  Inbox,
  Bookmark,
  History,
  CheckCircle2,
  ExternalLink,
  Edit,
  Save,
  Send,
  AlertCircle,
  Search,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';

interface FrontOfficeManagementProps {
  onSelectProject?: (projectId: string) => void;
}

export const FrontOfficeManagement: React.FC<FrontOfficeManagementProps> = ({ onSelectProject }) => {
  const { hasRole } = useAuth();
  const isManagerOrAdmin = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);

  const [activeSubTab, setActiveSubTab] = useState<'new' | 'drafts' | 'submitted' | 'history'>('submitted');
  const [enquiries, setEnquiries] = useState<EnquiryResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryResponseDto | null>(null);
  const [editingEnquiryId, setEditingEnquiryId] = useState<string | null>(null);

  // Form State
  const [clientData, setClientData] = useState<ClientDataState>({
    mode: 'new',
    clientName: '',
    companyName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    address: '',
    gstNumber: '',
  });

  const [leadSource, setLeadSource] = useState<LeadSource>('WALK_IN');
  const [priority, setPriority] = useState<EnquiryPriority>('NORMAL');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState<string>('');
  const [quotationStatus, setQuotationStatus] = useState<QuotationStatus>('PENDING');
  const [estimatedAmount, setEstimatedAmount] = useState<string>('');
  const [designStatus, setDesignStatus] = useState<DesignRequirementStatus>('CLIENT_PROVIDED');
  const [customerRemarks, setCustomerRemarks] = useState<string>('');
  const [internalRemarks, setInternalRemarks] = useState<string>('');
  const [lineItems, setLineItems] = useState<EnquiryLineItemRequest[]>([
    {
      serviceName: 'Flex Printing',
      width: 10,
      height: 5,
      dimensionUnit: 'FEET',
      siteMeasurementRequired: false,
      siteInspectionRequired: false,
      quantity: 1,
      quantityUnit: 'PIECE',
      printSides: 'SINGLE_SIDED',
      printingType: 'FULL_COLOUR',
      areaPerSideSqFt: 50,
      totalAreaSqFt: 50,
      areaPerSideSqM: 4.65,
      totalAreaSqM: 4.65,
      installationRequired: false,
      selectedMaterials: ['Frontlit Flex'],
      materialConfirmedByManager: false,
      finishingRequirements: ['Eyelets', 'Edge Folding'],
      designStatus: 'CLIENT_PROVIDED',
      remarks: '',
    },
  ]);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadEnquiries();
  }, [activeSubTab]);

  const loadEnquiries = async () => {
    try {
      setLoading(true);
      let statusFilter: EnquiryStatus | undefined;
      if (activeSubTab === 'drafts') statusFilter = 'DRAFT';
      else if (activeSubTab === 'submitted') statusFilter = 'SUBMITTED';
      else if (activeSubTab === 'history') statusFilter = 'CONVERTED_TO_PROJECT';

      const data = await enquiryApi.getAll({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
      });
      setEnquiries(data);
    } catch (err: any) {
      console.error('Failed to load enquiries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingEnquiryId(null);
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
    setLeadSource('WALK_IN');
    setPriority('NORMAL');
    setExpectedCompletionDate('');
    setQuotationStatus('PENDING');
    setEstimatedAmount('');
    setDesignStatus('CLIENT_PROVIDED');
    setCustomerRemarks('');
    setInternalRemarks('');
    setLineItems([
      {
        serviceName: 'Flex Printing',
        width: 10,
        height: 5,
        dimensionUnit: 'FEET',
        siteMeasurementRequired: false,
        siteInspectionRequired: false,
        quantity: 1,
        quantityUnit: 'PIECE',
        printSides: 'SINGLE_SIDED',
        printingType: 'FULL_COLOUR',
        areaPerSideSqFt: 50,
        totalAreaSqFt: 50,
        areaPerSideSqM: 4.65,
        totalAreaSqM: 4.65,
        installationRequired: false,
        selectedMaterials: ['Frontlit Flex'],
        materialConfirmedByManager: false,
        finishingRequirements: ['Eyelets', 'Edge Folding'],
        designStatus: 'CLIENT_PROVIDED',
        remarks: '',
      },
    ]);
    setFormErrors({});
  };

  const handleStartEdit = (enquiry: EnquiryResponseDto) => {
    setEditingEnquiryId(enquiry.id);
    setClientData({
      mode: enquiry.client ? 'existing' : 'new',
      selectedClientId: enquiry.client?.id,
      clientName: enquiry.clientName,
      companyName: enquiry.companyName || '',
      phone: enquiry.phone,
      alternatePhone: enquiry.alternatePhone || '',
      email: enquiry.email || '',
      address: enquiry.address,
      gstNumber: enquiry.gstNumber || '',
    });
    setLeadSource(enquiry.leadSource);
    setPriority(enquiry.priority);
    setExpectedCompletionDate(enquiry.expectedCompletionDate || '');
    setQuotationStatus(enquiry.quotationStatus);
    setEstimatedAmount(enquiry.estimatedAmount ? enquiry.estimatedAmount.toString() : '');
    setDesignStatus(enquiry.designStatus);
    setCustomerRemarks(enquiry.customerRemarks || '');
    setInternalRemarks(enquiry.internalRemarks || '');
    setLineItems(
      enquiry.lineItems.map((li) => ({
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
        materialConfirmedByManager: li.materialConfirmedByManager,
        finishingRequirements: [...li.finishingRequirements],
        remarks: li.remarks,
      }))
    );
    setActiveSubTab('new');
  };

  const validateForm = (isDraft: boolean): boolean => {
    const errors: Record<string, string> = {};

    if (!clientData.clientName?.trim()) {
      errors.clientName = 'Client contact name is required';
    }

    if (!clientData.phone?.trim()) {
      errors.phone = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(clientData.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9811002233)';
    }

    if (clientData.alternatePhone?.trim() && !/^[6-9]\d{9}$/.test(clientData.alternatePhone.trim())) {
      errors.alternatePhone = 'Alternate phone must be a valid 10-digit Indian mobile number';
    }

    if (!isDraft && !clientData.address?.trim()) {
      errors.address = 'Address is required for submitted enquiries';
    }

    if (lineItems.length === 0) {
      errors.lineItems = 'At least one advertising service item is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOrSubmit = async (isDraft: boolean) => {
    if (!validateForm(isDraft)) {
      setFeedbackMessage({
        type: 'error',
        text: 'Please resolve the highlighted validation errors before proceeding.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const payload: EnquiryCreateRequest = {
        clientId: clientData.mode === 'existing' ? clientData.selectedClientId : undefined,
        clientName: clientData.clientName.trim(),
        companyName: clientData.companyName?.trim() || undefined,
        phone: clientData.phone.trim(),
        alternatePhone: clientData.alternatePhone?.trim() || undefined,
        email: clientData.email?.trim() || undefined,
        address: clientData.address.trim(),
        gstNumber: clientData.gstNumber?.trim() || undefined,
        leadSource,
        isDraft,
        priority,
        expectedCompletionDate: expectedCompletionDate || undefined,
        quotationStatus,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
        designStatus,
        customerRemarks: customerRemarks.trim() || undefined,
        internalRemarks: internalRemarks.trim() || undefined,
        lineItems,
      };

      let result: EnquiryResponseDto;
      if (editingEnquiryId) {
        result = await enquiryApi.update(editingEnquiryId, payload);
        setFeedbackMessage({
          type: 'success',
          text: `Enquiry ${result.enquiryNumber} updated successfully as ${result.status}!`,
        });
      } else {
        result = await enquiryApi.createOrSave(payload);
        setFeedbackMessage({
          type: 'success',
          text: `Enquiry ${result.enquiryNumber} recorded successfully as ${result.status}!`,
        });
      }

      handleResetForm();
      setActiveSubTab(isDraft ? 'drafts' : 'submitted');
    } catch (err: any) {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to record enquiry. Please verify details.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToProject = async (enquiryId: string) => {
    if (!window.confirm('Convert this Front Office enquiry into an active CRM project? This will generate project line items and initialize workflow tracking.')) {
      return;
    }

    try {
      setLoading(true);
      const res = await enquiryApi.convertToProject(enquiryId);
      setFeedbackMessage({
        type: 'success',
        text: `Enquiry successfully converted to project ${res.projectCode}!`,
      });
      setSelectedEnquiry(null);
      loadEnquiries();
      if (onSelectProject && res.id) {
        onSelectProject(res.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert enquiry to project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Inbox size={24} /> Front Office Enquiry Desk
          </h1>
          <p style={{ fontSize: '13px', color: '#666666', margin: '4px 0 0 0' }}>
            Capture client enquiries, advertising requirement checklists, calculate dimensions, manage drafts, and convert to projects.
          </p>
        </div>

        <button
          onClick={() => {
            handleResetForm();
            setActiveSubTab('new');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.1rem',
            background: '#000000',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '4px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={16} /> New Client Enquiry
        </button>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMessage && (
        <div
          style={{
            padding: '0.85rem 1.15rem',
            borderRadius: '4px',
            marginBottom: '1.25rem',
            background: feedbackMessage.type === 'success' ? '#F0FFF4' : '#FFF5F5',
            border: feedbackMessage.type === 'success' ? '1px solid #38A169' : '1px solid #E53E3E',
            color: feedbackMessage.type === 'success' ? '#22543D' : '#742A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveSubTab('submitted')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeSubTab === 'submitted' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'submitted' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <Inbox size={16} /> Submitted Enquiries
        </button>
        <button
          onClick={() => setActiveSubTab('drafts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeSubTab === 'drafts' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'drafts' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <Bookmark size={16} /> Saved Drafts
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeSubTab === 'history' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'history' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <History size={16} /> Converted & Past Enquiries
        </button>
        <button
          onClick={() => {
            handleResetForm();
            setActiveSubTab('new');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: activeSubTab === 'new' ? 700 : 500,
            color: '#000000',
            background: 'none',
            border: 'none',
            borderBottom: activeSubTab === 'new' ? '2px solid #000000' : '2px solid transparent',
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={16} /> {editingEnquiryId ? 'Edit Enquiry' : 'Create New Enquiry'}
        </button>
      </div>

      {/* TAB 1: NEW / EDIT ENQUIRY FORM */}
      {activeSubTab === 'new' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveOrSubmit(false);
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
        >
          {/* Section 1: Client Selector Component */}
          <ClientSelector
            value={clientData}
            onChange={setClientData}
            errors={formErrors}
            disabled={isSubmitting}
          />

          {/* Section 2: Shared Client Requirement Checklist */}
          <ClientRequirementChecklist
            lineItems={lineItems}
            onChange={setLineItems}
            errors={formErrors}
            disabled={isSubmitting}
          />
          {formErrors.lineItems && (
            <p style={{ fontSize: '12px', color: '#E53E3E', margin: '-1rem 0 0 0' }}>{formErrors.lineItems}</p>
          )}

          {/* Section 3: Commercial & Workflow Options */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 1rem 0', color: '#000000', borderBottom: '1px solid #EEEEEE', paddingBottom: '0.5rem' }}>
              Enquiry Logistics, Quotation & Priority
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Lead Source
                </label>
                <select
                  value={leadSource}
                  onChange={(e) => setLeadSource(e.target.value as LeadSource)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="WALK_IN">Walk-in Client (Front Office)</option>
                  <option value="PHONE_CALL">Direct Phone Call</option>
                  <option value="WHATSAPP">WhatsApp Enquiry</option>
                  <option value="EMAIL">Email Enquiry</option>
                  <option value="EXTERNAL_WEBSITE">Website Portal Lead</option>
                  <option value="REFERRAL">Referral / Existing Client</option>
                  <option value="OTHER">Other Source</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Project Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as EnquiryPriority)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent (Express)</option>
                  <option value="EMERGENCY">Emergency (Same Day / Critical)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Target Delivery / Completion Date
                </label>
                <input
                  type="date"
                  value={expectedCompletionDate}
                  onChange={(e) => setExpectedCompletionDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Estimated Quote Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 45000"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Quotation Status
                </label>
                <select
                  value={quotationStatus}
                  onChange={(e) => setQuotationStatus(e.target.value as QuotationStatus)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="PENDING">Pending Quotation Estimation</option>
                  <option value="SENT">Quotation Sent to Client</option>
                  <option value="ACCEPTED">Quotation Accepted</option>
                  <option value="NOT_REQUIRED">Not Required / Direct Order</option>
                  <option value="REJECTED">Quotation Rejected</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Primary Artwork & Design Status
                </label>
                <select
                  value={designStatus}
                  onChange={(e) => setDesignStatus(e.target.value as DesignRequirementStatus)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="CLIENT_PROVIDED">Client Providing Print-Ready Artwork (Path A)</option>
                  <option value="DESIGN_REQUIRED">New Graphic Design Required (Path B)</option>
                  <option value="MINOR_MODIFICATION">Minor Artwork Modification Required</option>
                  <option value="PENDING_APPROVAL">Pending Customer Proof Approval</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Customer Request & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Record customer preferences, delivery instructions, event timings, or site restrictions..."
                  value={customerRemarks}
                  onChange={(e) => setCustomerRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
                  Internal Operations Notes (Confidential)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for production master, manager review, scaffolding requirements, structural checks..."
                  value={internalRemarks}
                  onChange={(e) => setInternalRemarks(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 0' }}>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResetForm}
              style={{
                padding: '0.65rem 1.25rem',
                fontSize: '13px',
                fontWeight: 600,
                background: '#F5F5F5',
                color: '#333333',
                border: '1px solid #D9D9D9',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Reset Form
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSaveOrSubmit(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.25rem',
                fontSize: '13px',
                fontWeight: 600,
                background: '#FFFFFF',
                color: '#000000',
                border: '1px solid #000000',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Save size={15} /> Save as Draft
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.65rem 1.5rem',
                fontSize: '13px',
                fontWeight: 700,
                background: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              <Send size={15} /> {editingEnquiryId ? 'Update & Submit Enquiry' : 'Submit Client Enquiry'}
            </button>
          </div>
        </form>
      )}

      {/* TABS 2, 3, 4: LIST TABLES (Submitted, Drafts, History) */}
      {activeSubTab !== 'new' && (
        <div>
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                placeholder="Search by client, enquiry #, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadEnquiries()}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2rem',
                  fontSize: '13px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            <button
              onClick={loadEnquiries}
              style={{
                padding: '0.5rem 0.9rem',
                fontSize: '13px',
                background: '#F5F5F5',
                border: '1px solid #D9D9D9',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666666' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <p>Loading enquiries...</p>
            </div>
          ) : enquiries.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#FAFAFA', border: '1px dashed #D0D0D0', borderRadius: '4px' }}>
              <Inbox size={36} style={{ color: '#AAAAAA', marginBottom: '0.5rem' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#333333', margin: 0 }}>
                No enquiries found in {activeSubTab}
              </h3>
              <p style={{ fontSize: '12px', color: '#888888', margin: '4px 0 1rem 0' }}>
                Create a new enquiry or adjust your search filter.
              </p>
              <button
                onClick={() => {
                  handleResetForm();
                  setActiveSubTab('new');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Create New Enquiry
              </button>
            </div>
          ) : (
            /* Table View */
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8F9FA', borderBottom: '1px solid #E5E5E5', color: '#444444', fontWeight: 600, fontSize: '12px' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Enquiry #</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Client & Company</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Phone & Mobile</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Services & Items</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enq) => {
                    const servicesSummary = enq.lineItems.map((li) => li.serviceName).join(', ');
                    const totalArea = enq.lineItems.reduce((acc, li) => acc + (li.totalAreaSqFt || 0) * (li.quantity || 1), 0);

                    return (
                      <tr
                        key={enq.id}
                        style={{ borderBottom: '1px solid #EEEEEE', cursor: 'pointer' }}
                        onClick={() => setSelectedEnquiry(enq)}
                      >
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#000000' }}>
                          {enq.enquiryNumber}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#000000' }}>{enq.companyName || enq.clientName}</div>
                          {enq.companyName && <div style={{ fontSize: '11px', color: '#666666' }}>{enq.clientName}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#444444' }}>
                          {enq.phone}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 500, color: '#222222' }}>{servicesSummary || 'Custom Advertising'}</div>
                          <div style={{ fontSize: '11px', color: '#777777' }}>
                            {enq.lineItems.length} item(s) • {totalArea > 0 ? `${totalArea.toFixed(1)} sq. ft.` : ''}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: enq.priority === 'EMERGENCY' ? '#000000' : enq.priority === 'URGENT' ? '#444444' : '#EEEEEE',
                              color: enq.priority === 'NORMAL' ? '#333333' : '#FFFFFF',
                            }}
                          >
                            {enq.priority}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: enq.status === 'CONVERTED_TO_PROJECT' ? '#000000' : enq.status === 'DRAFT' ? '#F5F5F5' : '#E8F5E9',
                              color: enq.status === 'CONVERTED_TO_PROJECT' ? '#FFFFFF' : enq.status === 'DRAFT' ? '#555555' : '#2E7D32',
                              border: enq.status === 'DRAFT' ? '1px solid #D0D0D0' : 'none',
                            }}
                          >
                            {enq.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => setSelectedEnquiry(enq)}
                              title="View Details"
                              style={{
                                padding: '0.35rem 0.65rem',
                                background: '#FFFFFF',
                                border: '1px solid #D9D9D9',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Eye size={13} /> View
                            </button>

                            {enq.status === 'DRAFT' && (
                              <button
                                onClick={() => handleStartEdit(enq)}
                                title="Edit Draft"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#000000',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                <Edit size={13} /> Edit
                              </button>
                            )}

                            {isManagerOrAdmin && enq.status !== 'CONVERTED_TO_PROJECT' && enq.status !== 'DRAFT' && (
                              <button
                                onClick={() => handleConvertToProject(enq.id)}
                                title="Convert to Active Project"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#000000',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                Convert <ArrowRight size={13} />
                              </button>
                            )}

                            {enq.convertedProjectId && (
                              <button
                                onClick={() => onSelectProject && onSelectProject(enq.convertedProjectId!)}
                                title="Open Converted Project"
                                style={{
                                  padding: '0.35rem 0.65rem',
                                  background: '#F0F0F0',
                                  color: '#000000',
                                  border: '1px solid #000000',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                }}
                              >
                                {enq.convertedProjectCode} <ExternalLink size={11} />
                              </button>
                            )}
                          </div>
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

      {/* ENQUIRY DETAIL MODAL */}
      {selectedEnquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '6px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #EEEEEE',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {selectedEnquiry.enquiryNumber}
                  </h2>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: selectedEnquiry.status === 'CONVERTED_TO_PROJECT' ? '#000000' : '#E8F5E9',
                      color: selectedEnquiry.status === 'CONVERTED_TO_PROJECT' ? '#FFFFFF' : '#2E7D32',
                    }}
                  >
                    {selectedEnquiry.status}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#666666', margin: '3px 0 0' }}>
                  Recorded on {selectedEnquiry.enquiryDate} • Lead Source: {selectedEnquiry.leadSource}
                </p>
              </div>

              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666666' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Client Info Grid */}
              <div style={{ background: '#F9F9F9', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '1rem' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#000000' }}>
                  Customer Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', fontSize: '12px', color: '#333333' }}>
                  <div><strong>Company:</strong> {selectedEnquiry.companyName || 'N/A'}</div>
                  <div><strong>Contact Person:</strong> {selectedEnquiry.clientName}</div>
                  <div><strong>Phone:</strong> {selectedEnquiry.phone}</div>
                  <div><strong>Alternate:</strong> {selectedEnquiry.alternatePhone || 'N/A'}</div>
                  <div><strong>Email:</strong> {selectedEnquiry.email || 'N/A'}</div>
                  <div><strong>GSTIN:</strong> {selectedEnquiry.gstNumber || 'N/A'}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {selectedEnquiry.address}</div>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 0.65rem 0', color: '#000000' }}>
                  Advertising Service Requirements ({selectedEnquiry.lineItems.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {selectedEnquiry.lineItems.map((li, idx) => (
                    <div
                      key={li.id || idx}
                      style={{
                        border: '1px solid #E0E0E0',
                        borderRadius: '4px',
                        padding: '0.85rem',
                        background: '#FFFFFF',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#000000' }}>
                          #{idx + 1}. {li.serviceName}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#333333' }}>
                          {li.quantity} {li.quantityUnit} • {li.totalAreaSqFt || 0} sq. ft.
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem', fontSize: '11px', color: '#555555' }}>
                        <div><strong>Dimensions:</strong> {li.width} x {li.height} {li.dimensionUnit} ({li.printSides})</div>
                        <div><strong>Print Type:</strong> {li.printingType}</div>
                        <div><strong>Design:</strong> {li.designStatus}</div>
                        <div><strong>Installation:</strong> {li.installationRequired ? `Yes (${li.installationLocation || 'Site'})` : 'No'}</div>
                      </div>

                      {li.selectedMaterials?.length > 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '11px' }}>
                          <strong>Selected Materials:</strong>{' '}
                          {li.selectedMaterials.map((m) => (
                            <span key={m} style={{ background: '#EEEEEE', padding: '1px 6px', borderRadius: '3px', marginRight: '4px' }}>
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {li.finishingRequirements?.length > 0 && (
                        <div style={{ marginTop: '0.3rem', fontSize: '11px' }}>
                          <strong>Finishing:</strong>{' '}
                          {li.finishingRequirements.map((f) => (
                            <span key={f} style={{ background: '#F5F5F5', border: '1px solid #D9D9D9', padding: '1px 6px', borderRadius: '3px', marginRight: '4px' }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      )}

                      {li.remarks && (
                        <div style={{ marginTop: '0.35rem', fontSize: '11px', color: '#666666', fontStyle: 'italic' }}>
                          Note: {li.remarks}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Commercial & Remarks */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '12px' }}>
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.75rem' }}>
                  <strong>Estimated Amount:</strong> {selectedEnquiry.estimatedAmount ? `₹ ${selectedEnquiry.estimatedAmount.toLocaleString('en-IN')}` : 'Pending'}
                </div>
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.75rem' }}>
                  <strong>Quotation Status:</strong> {selectedEnquiry.quotationStatus}
                </div>
                <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.75rem' }}>
                  <strong>Completion Target:</strong> {selectedEnquiry.expectedCompletionDate || 'Not specified'}
                </div>
              </div>

              {selectedEnquiry.customerRemarks && (
                <div style={{ fontSize: '12px', color: '#444444' }}>
                  <strong>Customer Remarks:</strong> {selectedEnquiry.customerRemarks}
                </div>
              )}

              {selectedEnquiry.internalRemarks && (
                <div style={{ fontSize: '12px', color: '#444444', background: '#F5F5F5', padding: '0.5rem', borderRadius: '3px' }}>
                  <strong>Internal Notes:</strong> {selectedEnquiry.internalRemarks}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #EEEEEE',
                background: '#F9F9F9',
              }}
            >
              <div>
                {selectedEnquiry.convertedProjectCode && (
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000' }}>
                    Linked Project: {selectedEnquiry.convertedProjectCode}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#FFFFFF',
                    border: '1px solid #D9D9D9',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>

                {isManagerOrAdmin && selectedEnquiry.status !== 'CONVERTED_TO_PROJECT' && selectedEnquiry.status !== 'DRAFT' && (
                  <button
                    onClick={() => handleConvertToProject(selectedEnquiry.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1.25rem',
                      background: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Convert into Project <ArrowRight size={14} />
                  </button>
                )}

                {selectedEnquiry.convertedProjectId && (
                  <button
                    onClick={() => {
                      if (onSelectProject) {
                        onSelectProject(selectedEnquiry.convertedProjectId!);
                        setSelectedEnquiry(null);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1.25rem',
                      background: '#000000',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Open Project <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
