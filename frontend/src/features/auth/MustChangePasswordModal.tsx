import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { apiClient } from '../../services/api/client';
import { ApiResponse, UserSummary } from '../../shared/types';
import { KeyRound, ShieldAlert, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';

export const MustChangePasswordModal: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If user does not need to change password or not logged in, do not show
  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from the temporary password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<UserSummary>>('/auth/change-password', {
        oldPassword,
        newPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        updateUser(res.data.data);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Please verify your current temporary password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
              margin: '0 auto 0.75rem',
            }}
          >
            <KeyRound size={22} color="#000000" />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '0.35rem', color: '#000000' }}>
            First Login — Change Password
          </h2>
          <p style={{ fontSize: '13px', color: '#666666', lineHeight: 1.5, margin: 0 }}>
            Welcome, <strong style={{ color: '#000000' }}>{user.fullName}</strong>. You logged in using a temporary onboarding password. Please create your permanent password to access your CRM workspace.
          </p>
        </div>

        {error && (
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
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div
            style={{
              textAlign: 'center',
              padding: '1.5rem 1rem',
              background: '#FAFAFA',
              border: '1px solid #000000',
              borderRadius: '4px',
              color: '#000000',
            }}
          >
            <CheckCircle2 size={36} color="#000000" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ fontWeight: 700, marginBottom: '0.25rem', color: '#000000' }}>Password Updated Successfully</h4>
            <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>
              Entering your department workstation...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Temporary / Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  className="form-input"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPasswords ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                New Permanent Password (min 8 characters)
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new permanent password"
                minLength={8}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Confirm New Password
              </label>
              <input
                type={showPasswords ? 'text' : 'password'}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                minLength={8}
                required
              />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '12px',
                color: '#666666',
                background: 'var(--bg-subtle)',
                padding: '0.5rem 0.75rem',
                borderRadius: '4px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Lock size={13} color="#000000" />
              <span>Passwords are encrypted and stored via Argon2id.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => logout()}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={isSubmitting}
              >
                Log Out
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Set Password & Enter CRM'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
