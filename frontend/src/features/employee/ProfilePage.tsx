import React, { useEffect, useState } from 'react';
import { UserProfile, EmployeeDocument, DocumentType, UpdateProfileRequest } from '../../shared/types';
import { profileService, authService } from '../../services/apiService';
import {
  User,
  Shield,
  FileText,
  Lock,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  UploadCloud,
  Eye,
  History,
  KeyRound,
  Edit3,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  RefreshCw,
  X,
  Copy,
  Check
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedEmpId, setCopiedEmpId] = useState(false);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergName, setEditEmergName] = useState('');
  const [editEmergPhone, setEditEmergPhone] = useState('');
  const [editEmergRel, setEditEmergRel] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // KYC Upload Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycDocType, setKycDocType] = useState<DocumentType>('AADHAAR');
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycDocNumber, setKycDocNumber] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [kycUploadError, setKycUploadError] = useState<string | null>(null);

  // Document History Modal State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDocType, setHistoryDocType] = useState<DocumentType>('AADHAAR');
  const [docHistory, setDocHistory] = useState<EmployeeDocument[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Profile Photo Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load employee profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEditModal = () => {
    if (!profile) return;
    setEditFullName(profile.fullName || '');
    setEditPhone(profile.phone || '');
    setEditAddress(profile.address || '');
    setEditEmergName(profile.emergencyContactName || '');
    setEditEmergPhone(profile.emergencyContactPhone || '');
    setEditEmergRel(profile.emergencyContactRelation || '');
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) {
      setActionError('Full name is required');
      return;
    }

    setIsSavingProfile(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const payload: UpdateProfileRequest = {
        fullName: editFullName.trim(),
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        emergencyContactName: editEmergName.trim() || undefined,
        emergencyContactPhone: editEmergPhone.trim() || undefined,
        emergencyContactRelation: editEmergRel.trim() || undefined,
      };
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
      setIsEditModalOpen(false);
      setActionSuccess('Profile updated successfully.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await profileService.uploadProfilePhoto(file);
      setProfile(updated);
      setActionSuccess('Profile photo updated successfully.');
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to upload photo. Please ensure it is JPG or PNG (max 5MB).');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleOpenKycModal = (type: DocumentType) => {
    setKycDocType(type);
    setKycFile(null);
    setKycDocNumber('');
    setKycUploadError(null);
    setIsKycModalOpen(true);
  };

  const handleUploadKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycFile) {
      setKycUploadError('Please select a document file to upload (PDF, JPG, PNG).');
      return;
    }

    setIsUploadingKyc(true);
    setKycUploadError(null);
    try {
      await profileService.uploadKycDocument(kycDocType, kycFile, kycDocNumber.trim() || undefined);
      setIsKycModalOpen(false);
      setActionSuccess(`${kycDocType} document uploaded and submitted for verification.`);
      fetchProfile();
    } catch (err: any) {
      setKycUploadError(err.response?.data?.message || 'Failed to upload document. Ensure valid PDF, JPG, or PNG.');
    } finally {
      setIsUploadingKyc(false);
    }
  };

  const handleOpenHistoryModal = async (type: DocumentType) => {
    setHistoryDocType(type);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    try {
      const history = await profileService.getDocumentHistory(type);
      setDocHistory(history);
    } catch (err: any) {
      console.error('Failed to load history', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const copyEmployeeId = () => {
    if (!profile?.employeeId) return;
    navigator.clipboard.writeText(profile.employeeId);
    setCopiedEmpId(true);
    setTimeout(() => setCopiedEmpId(false), 2000);
  };

  const getDoc = (type: DocumentType): EmployeeDocument | undefined => {
    return profile?.documents?.find((d) => d.documentType === type && d.current);
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={12} /> Verified
          </span>
        );
      case 'UPLOADED':
      case 'UNDER_REVIEW':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
            <Clock size={12} /> Pending Verification
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: '#FFF5F5', color: '#DC2626', border: '1px solid #FEB2B2' }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
            Not Uploaded
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <RefreshCw size={36} className="spin" color="var(--primary)" />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading your employee profile...
        </p>
      </div>
    );
  }

  const aadhaarDoc = getDoc('AADHAAR');
  const panDoc = getDoc('PAN');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Alert Banners */}
      {actionSuccess && (
        <div style={{ padding: '0.85rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 'var(--radius-md)', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* 1. HEADER CARD */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Profile Photo Avatar with Upload Overlay */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: profile?.hasProfilePhoto
                  ? `url(/api/v1/profile/photo?t=${Date.now()}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                border: '3px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {!profile?.hasProfilePhoto && (profile?.fullName ? profile.fullName.charAt(0) : 'U')}
            </div>

            <label
              htmlFor="profile-photo-upload"
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                border: '2px solid var(--bg-card)',
              }}
              title="Upload Profile Photo (JPG/PNG)"
            >
              <Camera size={14} className={isUploadingPhoto ? 'spin' : ''} />
            </label>
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
              disabled={isUploadingPhoto}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                {profile?.fullName}
              </h1>
              {profile?.employeeId && (
                <button
                  onClick={copyEmployeeId}
                  style={{
                    background: 'rgba(99, 102, 241, 0.12)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'var(--primary)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Click to copy Employee ID"
                >
                  <span>{profile.employeeId}</span>
                  {copiedEmpId ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary">{profile?.department}</span>
              <span className="badge badge-draft">
                {profile?.roles?.[0]?.replace('ROLE_', '') || 'EMPLOYEE'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: profile?.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: profile?.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                }}
              >
                {profile?.status}
              </span>
            </div>
          </div>
        </div>

        <button onClick={handleOpenEditModal} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Edit3 size={15} /> Edit Profile
        </button>
      </div>

      {/* 2 & 3. TWO-COLUMN GRID: Personal Info & Employee Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.75rem' }}>
        {/* Card A: Personal Information */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <User size={18} color="var(--primary)" /> Personal Information
            </h2>
            <button onClick={handleOpenEditModal} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
              <Edit3 size={12} /> Edit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Full Name</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{profile?.fullName}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Mail size={12} /> Login Email <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>(Immutable / Managed by Owner)</span>
              </div>
              <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginTop: '0.15rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Lock size={13} color="var(--text-dim)" />
                {profile?.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={12} /> Contact Mobile Number
              </div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                {profile?.phone || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Not provided</span>}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={12} /> Residential / Permanent Address
              </div>
              <div style={{ fontWeight: 500, marginTop: '0.15rem', color: profile?.address ? 'var(--text-main)' : 'var(--text-dim)', lineHeight: 1.4 }}>
                {profile?.address || 'Not provided'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Emergency Contact</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                {profile?.emergencyContactName ? (
                  <span>
                    {profile.emergencyContactName} {profile.emergencyContactRelation && `(${profile.emergencyContactRelation})`} • {profile.emergencyContactPhone || 'No Phone'}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>No emergency contact registered</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Employee Information */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Briefcase size={18} color="var(--secondary)" /> Employee Information
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              Controlled by Admin
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>System Employee ID</div>
              <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--primary)', marginTop: '0.15rem' }}>
                {profile?.employeeId || 'Pending'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Department</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>{profile?.department}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Operational Role</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                {profile?.roles?.[0]?.replace('ROLE_', '') || 'EMPLOYEE'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={12} /> Joining Date
              </div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                {profile?.joiningDate || 'Active Staff'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Account Status</div>
              <div style={{ fontWeight: 600, marginTop: '0.15rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: profile?.status === 'ACTIVE' ? '#4ade80' : '#f87171',
                    marginRight: '0.4rem',
                  }}
                />
                {profile?.status}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Authentication Security</div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#38bdf8', marginTop: '0.15rem' }}>
                Argon2id Encrypted • Active Session
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. IDENTITY & KYC DOCUMENTS */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
              <Shield size={20} color="var(--primary)" /> Identity &amp; KYC Document Management
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Upload your government identity documents for employment verification. Files are stored securely in encrypted private storage.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: '6px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
            Private Storage • IDOR Protected
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* KYC 1: Aadhaar Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: aadhaarDoc?.status === 'REJECTED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={20} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Aadhaar Card</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>National Identity Document</div>
                </div>
              </div>
              {renderStatusBadge(aadhaarDoc?.status)}
            </div>

            {aadhaarDoc ? (
              <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Document Version:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>v{aadhaarDoc.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>File Name:</span>
                  <span style={{ fontWeight: 500 }}>{aadhaarDoc.originalFileName}</span>
                </div>
                {aadhaarDoc.documentNumberMasked && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Aadhaar Number:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{aadhaarDoc.documentNumberMasked}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Uploaded:</span>
                  <span>{new Date(aadhaarDoc.uploadedAt).toLocaleDateString()}</span>
                </div>

                {aadhaarDoc.status === 'REJECTED' && aadhaarDoc.rejectionReason && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#f87171' }}>
                    <strong>Rejection Reason:</strong> {aadhaarDoc.rejectionReason}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)', marginBottom: '1rem' }}>
                No Aadhaar card uploaded yet.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleOpenKycModal('AADHAAR')}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <UploadCloud size={14} /> {aadhaarDoc ? 'Upload Replacement' : 'Upload Aadhaar'}
              </button>

              {aadhaarDoc && (
                <a
                  href={profileService.getDocumentDownloadUrl(aadhaarDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Eye size={14} /> View Securely
                </a>
              )}

              <button
                onClick={() => handleOpenHistoryModal('AADHAAR')}
                className="btn btn-secondary btn-sm"
                title="View Document Version History"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <History size={14} /> History
              </button>
            </div>
          </div>

          {/* KYC 2: PAN Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: panDoc?.status === 'REJECTED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={20} color="#38bdf8" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>PAN Card</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Permanent Account Number (Tax ID)</div>
                </div>
              </div>
              {renderStatusBadge(panDoc?.status)}
            </div>

            {panDoc ? (
              <div style={{ background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Document Version:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>v{panDoc.version}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>File Name:</span>
                  <span style={{ fontWeight: 500 }}>{panDoc.originalFileName}</span>
                </div>
                {panDoc.documentNumberMasked && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>PAN Number:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{panDoc.documentNumberMasked}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  <span>Uploaded:</span>
                  <span>{new Date(panDoc.uploadedAt).toLocaleDateString()}</span>
                </div>

                {panDoc.status === 'REJECTED' && panDoc.rejectionReason && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', fontSize: '0.75rem', color: '#f87171' }}>
                    <strong>Rejection Reason:</strong> {panDoc.rejectionReason}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-subtle)', marginBottom: '1rem' }}>
                No PAN card uploaded yet.
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleOpenKycModal('PAN')}
                className="btn btn-primary btn-sm"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <UploadCloud size={14} /> {panDoc ? 'Upload Replacement' : 'Upload PAN Card'}
              </button>

              {panDoc && (
                <a
                  href={profileService.getDocumentDownloadUrl(panDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Eye size={14} /> View Securely
                </a>
              )}

              <button
                onClick={() => handleOpenHistoryModal('PAN')}
                className="btn btn-secondary btn-sm"
                title="View Document Version History"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <History size={14} /> History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SECURITY & PASSWORD CARD */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <KeyRound size={18} color="var(--primary)" /> Security &amp; Password Settings
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Update your account password. All passwords are encrypted with high-memory Argon2id hashing algorithms.
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#4ade80', background: 'rgba(34, 197, 94, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            Argon2id Protected
          </span>
        </div>

        {passwordSuccess && (
          <div style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '0.8125rem' }}>
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ maxWidth: '640px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min. 8 chars)</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword || !oldPassword || !newPassword || !confirmPassword}
            className="btn btn-primary btn-sm"
          >
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* MODAL 1: Edit Personal Profile */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Personal Details</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Update your contact details and address (Audited)
                </p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Pooja Verma"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9811003300"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Enter your street address, city, state, postal code"
                />
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Emergency Contact Details
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Contact Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editEmergName}
                      onChange={(e) => setEditEmergName(e.target.value)}
                      placeholder="e.g. Ramesh Verma"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Relationship</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editEmergRel}
                      onChange={(e) => setEditEmergRel(e.target.value)}
                      placeholder="e.g. Spouse / Parent"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Emergency Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={editEmergPhone}
                      onChange={(e) => setEditEmergPhone(e.target.value)}
                      placeholder="e.g. 9811003399"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingProfile || !editFullName} className="btn btn-primary">
                  {isSavingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload KYC Document */}
      {isKycModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upload {kycDocType} Document</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Submit verified government identity proof (PDF, JPG, PNG - Max 10MB)
                </p>
              </div>
              <button onClick={() => setIsKycModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            {kycUploadError && (
              <div className="alert-error" style={{ marginBottom: '1rem' }}>
                {kycUploadError}
              </div>
            )}

            <form onSubmit={handleUploadKyc}>
              <div className="form-group">
                <label className="form-label">
                  Document Number <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>(Optional - will be masked)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={kycDocNumber}
                  onChange={(e) => setKycDocNumber(e.target.value)}
                  placeholder={kycDocType === 'AADHAAR' ? 'e.g. 1234 5678 9012' : 'e.g. ABCDE1234F'}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Select File (PDF / JPG / PNG) <span style={{ color: '#ef4444' }}>*</span></label>
                <div
                  style={{
                    border: '2px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    textAlign: 'center',
                    background: 'var(--bg-card)',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('kyc-file-input')?.click()}
                >
                  <UploadCloud size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {kycFile ? kycFile.name : 'Click or browse to choose identity file'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    Allowed: PDF, JPG, PNG (Max 10MB)
                  </div>
                </div>
                <input
                  id="kyc-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  style={{ display: 'none' }}
                  onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                  required
                />
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
                If replacing an existing document, your previous version will be preserved in history for compliance auditing.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setIsKycModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isUploadingKyc || !kycFile} className="btn btn-primary">
                  {isUploadingKyc ? 'Uploading Document...' : 'Submit Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Document Version History */}
      {isHistoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{historyDocType} Version History</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Audit log of all uploaded versions of this identity document
                </p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="btn btn-outline btn-sm">
                <X size={16} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                <RefreshCw size={24} className="spin" />
              </div>
            ) : docHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                No version history recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '360px', overflowY: 'auto' }}>
                {docHistory.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      background: 'var(--bg-card)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      border: doc.current ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Version {doc.version}</span>
                        {doc.current && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.15)', padding: '1px 6px', borderRadius: '4px' }}>
                            CURRENT
                          </span>
                        )}
                      </div>
                      {renderStatusBadge(doc.status)}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span>{doc.originalFileName} ({(doc.fileSize / 1024).toFixed(1)} KB)</span>
                      <span>{new Date(doc.uploadedAt).toLocaleString()}</span>
                    </div>

                    {doc.rejectionReason && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                        Reason: {doc.rejectionReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setIsHistoryModalOpen(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
