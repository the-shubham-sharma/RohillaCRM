import React from 'react';
import {
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Shield,
  Building2,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface GatewayProps {
  onNavigate: (path: string) => void;
}

export const Gateway: React.FC<GatewayProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        padding: '3rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
        {/* Brand Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '4px',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={20} color="#FFFFFF" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, fontSize: '18px', color: '#000000', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              ROHILLA ADVERTISING
            </div>
            <div style={{ fontSize: '11px', color: '#666666', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Enterprise ERP &amp; Operations Portal
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}
          >
            Operations Gateway
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#666666',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Turnkey commercial signage and digital printing workflow system. Select your portal to continue.
          </p>
        </div>

        {/* Portals Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            textAlign: 'left',
          }}
        >
          {/* Card 1: Customer Quote */}
          <div
            onClick={() => onNavigate('/customer-quote')}
            id="choice-customer-btn"
            style={{
              padding: '2rem',
              cursor: 'pointer',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#000000';
              e.currentTarget.style.backgroundColor = '#FAFAFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: '#FFFFFF',
                  border: '1px solid #000000',
                  color: '#000000',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '1.25rem',
                }}
              >
                Commercial Quotation
              </div>

              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '4px',
                  background: '#F5F5F5',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <FileSpreadsheet size={22} color="#000000" />
              </div>

              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.5rem',
                }}
              >
                Request a Commercial Quote
              </h2>

              <p
                style={{
                  fontSize: '13px',
                  color: '#666666',
                  lineHeight: 1.5,
                  marginBottom: '1.75rem',
                }}
              >
                Instant specification and pricing intake for signage, LED boards, hoardings, standees, or flex fabrication. No login required.
              </p>
            </div>

            <div>
              <div
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                }}
              >
                <span>Request a Quote</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Card 2: Employee Login */}
          <div
            onClick={() => onNavigate('/employee-login')}
            id="choice-employee-btn"
            style={{
              padding: '2rem',
              cursor: 'pointer',
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#000000';
              e.currentTarget.style.backgroundColor = '#FAFAFA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '3px',
                  background: '#000000',
                  border: '1px solid #000000',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  marginBottom: '1.25rem',
                }}
              >
                Internal Operations
              </div>

              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '4px',
                  background: '#000000',
                  border: '1px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <Lock size={22} color="#FFFFFF" />
              </div>

              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#000000',
                  marginBottom: '0.5rem',
                }}
              >
                Employee Workstation Sign In
              </h2>

              <p
                style={{
                  fontSize: '13px',
                  color: '#666666',
                  lineHeight: 1.5,
                  marginBottom: '1.75rem',
                }}
              >
                Authorized role access for Management, Design Studio, Production Floor, QC Workstation, and Dispatch Logistics.
              </p>
            </div>

            <div>
              <div
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                }}
              >
                <span>Sign In to Workspace</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div
          style={{
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '2rem',
            color: '#666666',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={15} color="#000000" />
            <span>Turnkey Outdoor &amp; Indoor Commercial Signage</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={15} color="#000000" />
            <span>End-to-End In-House Fabrication &amp; QC</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckCircle2 size={15} color="#000000" />
            <span>Role-Based Access &amp; Tamper-Evident Audit Trails</span>
          </div>
        </div>
      </div>
    </div>
  );
};
