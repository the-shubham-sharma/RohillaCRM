import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Building,
  MapPin,
  Download,
  CheckCircle2,
  Sparkles,
  X,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { leadService } from '../../services/apiService';
import { Lead, LeadStatus, UpdateLeadStatusRequest } from '../../shared/types';

interface LeadsManagementProps {
  onSelectProject?: (projectId: string) => void;
}

export const LeadsManagement: React.FC<LeadsManagementProps> = ({ onSelectProject }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<LeadStatus>('NEW_LEAD');
  const [managerNotes, setManagerNotes] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const data = await leadService.getAllLeads(params);
      setLeads(data);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  const handleOpenLead = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setManagerNotes('');
    setActionMessage(null);
  };

  const handleCloseModal = () => {
    setSelectedLead(null);
    setActionMessage(null);
  };

  const handleConvertToProject = async (lead: Lead) => {
    setIsConverting(true);
    setActionMessage(null);
    try {
      const project = await leadService.convertLead(lead.id);
      setActionMessage({
        type: 'success',
        text: `Lead ${lead.leadCode} successfully converted! Project ${project.projectCode} is now active in the Project Pipeline.`
      });
      // Refresh lead details
      const updatedLead = await leadService.getLeadById(lead.id);
      setSelectedLead(updatedLead);
      setLeads((prev) => prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)));
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to convert lead to project.'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    setIsUpdatingStatus(true);
    setActionMessage(null);
    try {
      const payload: UpdateLeadStatusRequest = {
        status: newStatus,
        notes: managerNotes.trim() || undefined,
      };
      const updated = await leadService.updateLeadStatus(selectedLead.id, payload);
      setSelectedLead(updated);
      setActionMessage({
        type: 'success',
        text: newStatus === 'CONVERTED'
          ? `Lead converted to Project ${updated.convertedProjectCode || ''} & entered Project Pipeline!`
          : `Lead status updated to ${newStatus}`
      });
      // Update in leads array
      setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update lead status.' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Metrics
  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW_LEAD').length;
  const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
  const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW_LEAD':
        return (
          <span style={{ padding: '2px 7px', borderRadius: '3px', background: '#FFFFFF', color: '#000000', fontSize: '11px', fontWeight: 600, border: '1px solid #000000', display: 'inline-block' }}>
            NEW ENQUIRY
          </span>
        );
      case 'CONTACTED':
        return (
          <span style={{ padding: '2px 7px', borderRadius: '3px', background: '#E5E5E5', color: '#000000', fontSize: '11px', fontWeight: 600, border: '1px solid #CCCCCC', display: 'inline-block' }}>
            CONTACTED
          </span>
        );
      case 'CONVERTED':
        return (
          <span style={{ padding: '2px 7px', borderRadius: '3px', background: '#000000', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, border: '1px solid #000000', display: 'inline-block' }}>
            CONVERTED
          </span>
        );
      case 'ARCHIVED':
        return (
          <span style={{ padding: '2px 7px', borderRadius: '3px', background: '#FFFFFF', color: '#000000', fontSize: '11px', fontWeight: 600, border: '1px solid #000000', display: 'inline-block' }}>
            ARCHIVED
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#000000', margin: 0 }}>
            Customer Leads &amp; Enquiries
          </h1>
          <p style={{ fontSize: '13px', color: '#666666', margin: 0, marginTop: '0.25rem' }}>
            Review, track, and convert incoming public quote requests submitted via Rohilla Advertising entry portal.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Total Enquiries</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#000000', marginTop: '0.25rem' }}>{totalLeads}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>New Leads</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#000000', marginTop: '0.25rem' }}>{newLeadsCount}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>In Discussion</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#000000', marginTop: '0.25rem' }}>{contactedCount}</div>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Converted to Jobs</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#000000', marginTop: '0.25rem' }}>{convertedCount}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, phone, code, company..."
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={15} color="#888888" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '12px', color: '#666666', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Filter size={14} /> Status:
          </span>
          <select
            className="form-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW_LEAD">New Enquiries</option>
            <option value="CONTACTED">Contacted</option>
            <option value="CONVERTED">Converted</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Leads List / Table */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={28} className="spin" color="#000000" />
          <p style={{ marginTop: '1rem', color: '#666666', fontSize: '13px' }}>Loading customer leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '4rem 2rem', textAlign: 'center' }}>
          <Inbox size={40} color="#888888" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '16px', color: '#000000', marginBottom: '0.25rem' }}>No Leads Found</h3>
          <p style={{ fontSize: '13px', color: '#666666', maxWidth: '400px', margin: '0 auto' }}>
            No customer quote requests match the selected filters or search query.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference Code</th>
                <th>Customer</th>
                <th>Product / Service</th>
                <th>Qty &amp; Size</th>
                <th>Location</th>
                <th>Status</th>
                <th>Date Received</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 700, color: '#000000', fontFamily: 'var(--font-mono)' }}>
                    {lead.leadCode}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#000000' }}>{lead.customerName}</div>
                    <div style={{ fontSize: '12px', color: '#666666', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
                      <Phone size={11} color="#666666" />
                      <a href={`tel:+91${lead.phone}`} style={{ color: '#000000' }}>
                        +91 {lead.phone}
                      </a>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: '#000000', fontWeight: 500 }}>{lead.productService}</div>
                    <div style={{ fontSize: '12px', color: '#666666', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.requirement}
                    </div>
                  </td>
                  <td style={{ color: '#000000' }}>
                    <div>Qty: {lead.quantity}</div>
                    <div style={{ fontSize: '12px', color: '#666666' }}>{lead.size}</div>
                  </td>
                  <td style={{ color: '#666666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} color="#666666" />
                      {lead.location}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {getStatusBadge(lead.status)}
                      {lead.convertedProjectCode && (
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#000000' }}>
                          {lead.convertedProjectCode}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ color: '#666666', fontSize: '12px' }}>
                    {formatDate(lead.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenLead(lead)}
                      className="btn btn-outline btn-sm"
                    >
                      Review &amp; Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail & Status Modal */}
      {selectedLead && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#666666', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                  {selectedLead.leadCode}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#000000', margin: 0, marginTop: '0.2rem' }}>
                  Enquiry Details: {selectedLead.customerName}
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', color: '#666666', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Alert Banner */}
            {actionMessage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem 0.85rem',
                  background: '#FFFFFF',
                  border: '1px solid #000000',
                  borderRadius: '4px',
                  color: '#000000',
                  fontSize: '13px',
                  marginBottom: '1.25rem',
                }}
              >
                {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{actionMessage.text}</span>
              </div>
            )}

            {/* Quick Conversion CTA */}
            {selectedLead.status !== 'CONVERTED' ? (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#000000' }}>
                    Convert Lead into Production Project
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', marginTop: '0.2rem' }}>
                    Spawns a real operational project in the Pipeline, locks requirements, and allows immediate assignment.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleConvertToProject(selectedLead)}
                  disabled={isConverting}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
                >
                  {isConverting ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      Convert to Project
                      <ArrowUpRight size={13} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                style={{
                  background: '#F5F5F5',
                  border: '1px solid #000000',
                  borderRadius: '4px',
                  padding: '1rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <CheckCircle2 size={16} />
                    Job Active in Pipeline: {selectedLead.convertedProjectCode}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666666', marginTop: '0.2rem' }}>
                    This enquiry has been officially converted. Team members can view and process artwork in the workspace.
                  </div>
                </div>
                {selectedLead.convertedProjectId && onSelectProject && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseModal();
                      onSelectProject(selectedLead.convertedProjectId!);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <span>Open in Project Pipeline</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Customer & Company Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '4px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#666666' }}>Mobile Number</div>
                <div style={{ fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '13px' }}>
                  <Phone size={13} color="#000000" />
                  <a href={`tel:+91${selectedLead.phone}`} style={{ color: '#000000' }}>
                    +91 {selectedLead.phone}
                  </a>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#666666' }}>Email Address</div>
                <div style={{ fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '13px' }}>
                  <Mail size={13} color="#000000" />
                  {selectedLead.email ? selectedLead.email : <span style={{ color: '#888888', fontWeight: 400 }}>Not provided</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#666666' }}>Company / Brand</div>
                <div style={{ fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '13px' }}>
                  <Building size={13} color="#000000" />
                  {selectedLead.companyName ? selectedLead.companyName : <span style={{ color: '#888888', fontWeight: 400 }}>Not provided</span>}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#666666' }}>Site Location</div>
                <div style={{ fontWeight: 600, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '13px' }}>
                  <MapPin size={13} color="#000000" />
                  {selectedLead.location}
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.5rem' }}>
                Specification Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: '#666666' }}>Product/Service:</span>
                  <div style={{ fontWeight: 600, color: '#000000', marginTop: '0.15rem', fontSize: '13px' }}>{selectedLead.productService}</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: '#666666' }}>Quantity:</span>
                  <div style={{ fontWeight: 600, color: '#000000', marginTop: '0.15rem', fontSize: '13px' }}>{selectedLead.quantity} Units</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '11px', color: '#666666' }}>Dimensions:</span>
                  <div style={{ fontWeight: 600, color: '#000000', marginTop: '0.15rem', fontSize: '13px' }}>{selectedLead.size}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '11px', color: '#666666', fontWeight: 600 }}>Customer Requirement:</span>
                <p style={{ color: '#000000', fontSize: '13px', lineHeight: 1.5, marginTop: '0.25rem', margin: 0 }}>
                  {selectedLead.requirement}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '12px', color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={13} color="#000000" />
                  Design Assistance: <strong>{selectedLead.designRequired ? 'YES (Creation Required)' : 'NO (Has Final Design)'}</strong>
                </div>

                {selectedLead.designFileName && (
                  <div style={{ fontSize: '12px', color: '#000000', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Download size={13} color="#000000" />
                    Artwork Uploaded: <strong>{selectedLead.designFileName}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleUpdateStatus} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginBottom: '0.75rem' }}>
                Update Lead Status &amp; Notes
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                  >
                    <option value="NEW_LEAD">New Enquiry</option>
                    <option value="CONTACTED">Contacted Client</option>
                    <option value="CONVERTED">Converted to Job</option>
                    <option value="ARCHIVED">Archived / Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Manager Action Notes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="e.g. Sent formal quotation on email, site survey scheduled..."
                  />
                </div>
              </div>

              {selectedLead.notes && (
                <div style={{ fontSize: '12px', color: '#666666', marginBottom: '1rem', background: 'var(--bg-subtle)', padding: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <strong style={{ color: '#000000' }}>History Log:</strong>
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: '0.25rem', color: '#333333' }}>{selectedLead.notes}</div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary btn-sm">
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isUpdatingStatus ? <RefreshCw size={13} className="spin" /> : <CheckCircle2 size={13} />}
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
