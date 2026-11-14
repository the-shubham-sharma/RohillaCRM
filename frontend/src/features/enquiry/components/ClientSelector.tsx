import React, { useState, useEffect } from 'react';
import { Client } from '../../../shared/types';
import { clientApi } from '../../../services/api';
import { User, Building, Phone, Mail, MapPin, Hash, Plus, CheckCircle2, Search } from 'lucide-react';

export interface ClientDataState {
  mode: 'existing' | 'new';
  selectedClientId?: string;
  clientName: string;
  companyName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address: string;
  gstNumber?: string;
}

interface ClientSelectorProps {
  value: ClientDataState;
  onChange: (updated: ClientDataState) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientApi.getAll();
      setClients(data);
    } catch (err) {
      console.error('Failed to load clients', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId);
    if (selected) {
      onChange({
        mode: 'existing',
        selectedClientId: selected.id,
        clientName: selected.contactPerson || selected.companyName,
        companyName: selected.companyName,
        phone: selected.phone || '',
        email: selected.email || '',
        address: selected.address || '',
        gstNumber: selected.gstNumber || '',
      });
    }
  };

  const handleModeSwitch = (mode: 'existing' | 'new') => {
    if (mode === 'new') {
      onChange({
        mode: 'new',
        selectedClientId: undefined,
        clientName: '',
        companyName: '',
        phone: '',
        alternatePhone: '',
        email: '',
        address: '',
        gstNumber: '',
      });
    } else {
      onChange({
        ...value,
        mode: 'existing',
      });
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
  );

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #EEEEEE', paddingBottom: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#000000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building size={18} /> Client & Customer Information
          </h3>
          <p style={{ fontSize: '12px', color: '#666666', margin: '2px 0 0 0' }}>
            Select an existing customer account or enter new client details
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.25rem', background: '#F5F5F5', padding: '3px', borderRadius: '4px' }}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeSwitch('existing')}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '12px',
              fontWeight: value.mode === 'existing' ? 700 : 500,
              background: value.mode === 'existing' ? '#000000' : 'transparent',
              color: value.mode === 'existing' ? '#FFFFFF' : '#444444',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Existing Client ({loading ? '...' : clients.length})
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleModeSwitch('new')}
            style={{
              padding: '0.4rem 0.75rem',
              fontSize: '12px',
              fontWeight: value.mode === 'new' ? 700 : 500,
              background: value.mode === 'new' ? '#000000' : 'transparent',
              color: value.mode === 'new' ? '#FFFFFF' : '#444444',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={13} /> New Client
          </button>
        </div>
      </div>

      {value.mode === 'existing' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Select Client Account <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
                <input
                  type="text"
                  placeholder="Type to filter clients by company, person or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    fontSize: '13px',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                  }}
                />
                <select
                  disabled={disabled}
                  value={value.selectedClientId || ''}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    fontSize: '13px',
                    border: errors.clientName ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                  }}
                >
                  <option value="">-- Choose Existing Client --</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} {c.contactPerson ? `(${c.contactPerson})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {errors.clientName && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.clientName}</p>}
          </div>

          {value.selectedClientId && (
            <div style={{ background: '#F9F9F9', border: '1px solid #E5E5E5', borderRadius: '4px', padding: '0.85rem', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#000000', fontWeight: 600, fontSize: '13px', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={16} /> Selected: {value.companyName}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '12px', color: '#555555' }}>
                <div><strong>Contact:</strong> {value.clientName || 'N/A'}</div>
                <div><strong>Phone:</strong> {value.phone}</div>
                <div><strong>Email:</strong> {value.email || 'N/A'}</div>
                <div><strong>GSTIN:</strong> {value.gstNumber || 'N/A'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {value.address}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* New Client Form Mode */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Contact Person / Client Name <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                disabled={disabled}
                placeholder="e.g. Rahul Sharma"
                value={value.clientName}
                onChange={(e) => onChange({ ...value, clientName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: errors.clientName ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            {errors.clientName && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.clientName}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Company / Business Name
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                disabled={disabled}
                placeholder="e.g. Verma Retail Brands Pvt. Ltd."
                value={value.companyName}
                onChange={(e) => onChange({ ...value, companyName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Primary Mobile (10-Digit) <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="tel"
                disabled={disabled}
                placeholder="e.g. 9811002233"
                maxLength={10}
                value={value.phone}
                onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/\D/g, '') })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: errors.phone ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            {errors.phone && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.phone}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Alternate Phone (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="tel"
                disabled={disabled}
                placeholder="e.g. 9811004455"
                maxLength={10}
                value={value.alternatePhone || ''}
                onChange={(e) => onChange({ ...value, alternatePhone: e.target.value.replace(/\D/g, '') })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: errors.alternatePhone ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            {errors.alternatePhone && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.alternatePhone}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="email"
                disabled={disabled}
                placeholder="e.g. rahul@company.com"
                value={value.email || ''}
                onChange={(e) => onChange({ ...value, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: errors.email ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            {errors.email && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.email}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              GSTIN Number (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Hash size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                disabled={disabled}
                placeholder="e.g. 06AAAAA1234A1Z5"
                maxLength={15}
                value={value.gstNumber || ''}
                onChange={(e) => onChange({ ...value, gstNumber: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#333333', marginBottom: '0.35rem' }}>
              Address & City <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888888' }} />
              <input
                type="text"
                disabled={disabled}
                placeholder="e.g. Plot 24, Sector 18, Udyog Vihar, Gurugram"
                value={value.address}
                onChange={(e) => onChange({ ...value, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem 0.55rem 2rem',
                  fontSize: '13px',
                  border: errors.address ? '1px solid #E53E3E' : '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                }}
              />
            </div>
            {errors.address && <p style={{ fontSize: '11px', color: '#E53E3E', margin: '3px 0 0' }}>{errors.address}</p>}
          </div>
        </div>
      )}
    </div>
  );
};
