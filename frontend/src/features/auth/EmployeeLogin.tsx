import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { getDashboardRouteForRoles } from '../../shared/utils/roles';
import {
  Lock,
  Mail,
  ArrowRight,
  Shield,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface EmployeeLoginProps {
  onNavigate: (path: string) => void;
}

export const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await login(email.trim(), password);
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const targetRoute = getDashboardRouteForRoles(parsedUser?.roles);
      onNavigate(targetRoute);
    } catch (err: any) {
      if (err.response?.data?.message) {
        setLoginError(err.response.data.message);
      } else {
        setLoginError('Invalid employee credentials or server unavailable.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        padding: '2.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', marginBottom: '1.25rem' }}>
        {/* Navigation Bar / Back button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onNavigate('/')}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            id="login-back-btn"
          >
            <ArrowLeft size={14} />
            <span>Back to Gateway</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '4px',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={16} color="#FFFFFF" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#000000' }}>
              ROHILLA CRM
            </span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '2.25rem 2rem',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '2px 7px',
                borderRadius: '3px',
                background: '#FFFFFF',
                border: '1px solid #000000',
                color: '#000000',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
              }}
            >
              Staff Authentication
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '0.35rem', color: '#000000' }}>
              Employee Sign In
            </h1>
            <p style={{ fontSize: '13px', color: '#666666', lineHeight: 1.5, margin: 0 }}>
              Authorized role access for Management, Design Studio, Production Floor, QC Workstation, and Dispatch Logistics.
            </p>
          </div>

          {loginError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                background: '#FFFFFF',
                border: '1px solid #000000',
                borderRadius: '4px',
                color: '#000000',
                fontSize: '13px',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={14} /> Corporate Email / Login ID
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@rohilla.com"
                autoComplete="username"
                required
                id="employee-email-input"
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={14} /> Password
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                id="employee-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !email || !password}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              id="employee-login-btn"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw size={15} className="spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Workspace
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Trust Badges */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666666', fontSize: '12px' }}>
              <CheckCircle2 size={14} color="#000000" />
              <span>Role-Based Access Control (Admin, Manager, Designer, Production, QC, Dispatch)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666666', fontSize: '12px' }}>
              <CheckCircle2 size={14} color="#000000" />
              <span>Argon2id Encrypted &bull; Tamper-Evident Audit Trails</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
