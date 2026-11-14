import React, { useState, useRef } from 'react';
import {
  Shield,
  ArrowLeft,
  AlertCircle,
  Phone,
  Layers,
  MapPin,
  FileText,
  Building,
  Upload,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { leadService } from '../../services/apiService';
import { CustomerEnquiryRequest, LeadResponseDto } from '../../shared/types';

interface CustomerQuoteProps {
  onNavigate: (path: string) => void;
}

export const CustomerQuote: React.FC<CustomerQuoteProps> = ({ onNavigate }) => {
  // Form State
  const [quoteData, setQuoteData] = useState<CustomerEnquiryRequest>({
    name: '',
    phone: '',
    email: '',
    company: '',
    productService: 'Outdoor Advertising',
    quantity: 1,
    size: '',
    location: '',
    requirement: '',
    designRequired: false,
    notes: '',
  });

  const [artworkFile, setArtworkFile] = useState<{ storageKey: string; originalFileName: string; fileSize: string } | null>(null);
  const [isUploadingArtwork, setIsUploadingArtwork] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<LeadResponseDto | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product service options
  const productOptions = [
    'Outdoor Advertising',
    'Large Format Flex Printing',
    '3D Acrylic & LED Signage',
    'Rollup Standees & Banners',
    'Highway Hoardings & Unipoles',
    'Storefront Glow Sign Boards',
    'Metal Frame Fabrication',
    'On-Site Turnkey Installation',
  ];

  // Clean & Validate Indian Phone Number (10 digits starting with 6, 7, 8, 9)
  const cleanPhone = (val: string): string => {
    let cleaned = val.replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.substring(1);
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuoteData({ ...quoteData, phone: val });
    const cleaned = cleanPhone(val);
    if (cleaned && !/^[6-9][0-9]{9}$/.test(cleaned)) {
      setPhoneError('Must be 10 digits starting with 6, 7, 8, or 9 (e.g. 9810001111)');
    } else {
      setPhoneError(null);
    }
  };

  // Artwork File Upload Handler
  const handleArtworkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setQuoteError('Artwork file size exceeds maximum permitted limit of 50MB.');
      return;
    }

    setIsUploadingArtwork(true);
    setQuoteError(null);
    try {
      const res = await leadService.uploadArtwork(file);
      setArtworkFile(res);
      setQuoteData((prev) => ({
        ...prev,
        designFileStorageKey: res.storageKey,
        designFileName: res.originalFileName,
      }));
    } catch (err: any) {
      setQuoteError(err.response?.data?.message || 'Failed to upload artwork file. Please check format.');
    } finally {
      setIsUploadingArtwork(false);
    }
  };

  // Customer Quote Submission Handler
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError(null);

    // Required Field Validations
    if (!quoteData.name.trim()) {
      setQuoteError('Please provide your full name.');
      return;
    }

    const cleanedPhone = cleanPhone(quoteData.phone);
    if (!cleanedPhone || !/^[6-9][0-9]{9}$/.test(cleanedPhone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number (e.g. 9810001111)');
      return;
    }

    if (!quoteData.requirement.trim()) {
      setQuoteError('Please describe your project requirements.');
      return;
    }

    if (!quoteData.size.trim()) {
      setQuoteError('Please specify dimensions/size (e.g. 10x4 ft).');
      return;
    }

    if (!quoteData.location.trim()) {
      setQuoteError('Please provide installation/delivery location.');
      return;
    }

    setIsSubmittingQuote(true);
    try {
      const payload: CustomerEnquiryRequest = {
        ...quoteData,
        name: quoteData.name.trim(),
        phone: cleanedPhone,
        email: quoteData.email?.trim() || undefined,
        company: quoteData.company?.trim() || undefined,
        requirement: quoteData.requirement.trim(),
        size: quoteData.size.trim(),
        location: quoteData.location.trim(),
        notes: quoteData.notes?.trim() || undefined,
      };

      const result = await leadService.submitPublicQuote(payload);
      setSubmittedLead(result);
    } catch (err: any) {
      setQuoteError(err.response?.data?.message || 'Could not submit quote request. Please try again or check connection.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCopyReference = () => {
    if (submittedLead?.leadCode) {
      navigator.clipboard.writeText(submittedLead.leadCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResetQuoteForm = () => {
    setSubmittedLead(null);
    setArtworkFile(null);
    setQuoteData({
      name: '',
      phone: '',
      email: '',
      company: '',
      productService: 'Outdoor Advertising',
      quantity: 1,
      size: '',
      location: '',
      requirement: '',
      designRequired: false,
      notes: '',
    });
    setQuoteError(null);
    setPhoneError(null);
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
      <div style={{ maxWidth: '760px', width: '100%', marginBottom: '1.25rem' }}>
        {/* Navigation Bar / Back button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onNavigate('/')}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            id="quote-back-btn"
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
              ROHILLA ADVERTISING
            </span>
          </div>
        </div>
      </div>

      {/* Main Form Container */}
      <div style={{ maxWidth: '760px', width: '100%' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '2.25rem 2rem',
          }}
        >
          {submittedLead ? (
            /* --- Success State --- */
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#F5F5F5',
                  border: '1px solid #000000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={32} color="#000000" />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#000000', marginBottom: '0.4rem' }}>
                Enquiry Submitted Successfully
              </h2>
              <p style={{ fontSize: '14px', color: '#666666', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Thank you, <strong style={{ color: '#000000' }}>{submittedLead.customerName}</strong>. Our estimating and production team will review your specifications and contact you shortly.
              </p>

              {/* Reference Code Box */}
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid #000000',
                  borderRadius: '4px',
                  padding: '1.25rem',
                  maxWidth: '440px',
                  margin: '0 auto 2rem',
                }}
              >
                <div style={{ fontSize: '11px', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
                  Enquiry Reference Code
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#000000', letterSpacing: '0.04em' }}>
                    {submittedLead.leadCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReference}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title="Copy Reference Code"
                  >
                    {copied ? <Check size={13} color="#000000" /> : <Copy size={13} />}
                    <span style={{ fontSize: '12px' }}>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResetQuoteForm}
                  className="btn btn-primary"
                >
                  Submit Another Quote
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/')}
                  className="btn btn-secondary"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            /* --- Quotation Form --- */
            <>
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
                  Commercial Intake
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '0.35rem', color: '#000000' }}>
                  Request a Commercial Quotation
                </h1>
                <p style={{ fontSize: '13px', color: '#666666', lineHeight: 1.5, margin: 0 }}>
                  No account or login required. Provide your project specifications below to receive an official proposal.
                </p>
              </div>

              {quoteError && (
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
                  <span>{quoteError}</span>
                </div>
              )}

              <form onSubmit={handleQuoteSubmit}>
                {/* Section 1: Customer Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Customer Name <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={quoteData.name}
                      onChange={(e) => setQuoteData({ ...quoteData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} /> Mobile Number <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      value={quoteData.phone}
                      onChange={handlePhoneChange}
                      placeholder="10 Digits (e.g. 9810001111)"
                      maxLength={14}
                    />
                    {phoneError && (
                      <span style={{ fontSize: '11px', color: '#000000', marginTop: '0.2rem', display: 'block' }}>
                        {phoneError}
                      </span>
                    )}
                  </div>
                </div>

                {/* Section 2: Product & Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Layers size={13} /> Product / Service <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      value={quoteData.productService}
                      onChange={(e) => setQuoteData({ ...quoteData, productService: e.target.value })}
                    >
                      {productOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Quantity <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      className="form-input"
                      value={quoteData.quantity}
                      onChange={(e) => setQuoteData({ ...quoteData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </div>
                </div>

                {/* Section 3: Size & Location */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Dimensions / Size <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={quoteData.size}
                      onChange={(e) => setQuoteData({ ...quoteData, size: e.target.value })}
                      placeholder="e.g. 10x4 ft, 20x10 ft, 3x6 ft"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <MapPin size={13} /> Location / City <span style={{ color: '#000000' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={quoteData.location}
                      onChange={(e) => setQuoteData({ ...quoteData, location: e.target.value })}
                      placeholder="e.g. Gurugram, Delhi NCR, Noida"
                    />
                  </div>
                </div>

                {/* Section 4: Requirement Description */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={13} /> Specifications &amp; Requirements <span style={{ color: '#000000' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    value={quoteData.requirement}
                    onChange={(e) => setQuoteData({ ...quoteData, requirement: e.target.value })}
                    placeholder="Describe your requirements (e.g. Backlit LED glow sign board for retail store entrance with 3D acrylic letters, weather-proof fabrication, and night illumination)..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Section 5: Optional Email & Company */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">
                      Email Address <span style={{ fontSize: '11px', color: '#666666' }}>(Optional)</span>
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={quoteData.email || ''}
                      onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                      placeholder="client@company.com"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Building size={13} /> Company Name <span style={{ fontSize: '11px', color: '#666666' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={quoteData.company || ''}
                      onChange={(e) => setQuoteData({ ...quoteData, company: e.target.value })}
                      placeholder="Your Business / Brand Name"
                    />
                  </div>
                </div>

                {/* Section 6: Design Assistance Option */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '0.85rem 1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', display: 'block', marginBottom: '0.5rem' }}>
                    Need Design Artwork Creation Assistance?
                  </label>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '13px', cursor: 'pointer', color: '#000000' }}>
                      <input
                        type="radio"
                        name="designRequired"
                        checked={quoteData.designRequired === true}
                        onChange={() => setQuoteData({ ...quoteData, designRequired: true })}
                        style={{ accentColor: '#000000' }}
                      />
                      <span>YES — I need design creation</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '13px', cursor: 'pointer', color: '#000000' }}>
                      <input
                        type="radio"
                        name="designRequired"
                        checked={quoteData.designRequired === false}
                        onChange={() => setQuoteData({ ...quoteData, designRequired: false })}
                        style={{ accentColor: '#000000' }}
                      />
                      <span>NO — I already have ready artwork</span>
                    </label>
                  </div>
                </div>

                {/* Section 7: Optional Artwork Upload */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">
                    Artwork / Reference Upload <span style={{ fontSize: '11px', color: '#666666' }}>(Optional)</span>
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleArtworkUpload}
                    accept=".pdf,.ai,.psd,.cdr,.png,.jpg,.jpeg,.tiff,.zip"
                    style={{ display: 'none' }}
                  />

                  {artworkFile ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '13px', color: '#000000' }}>
                        <CheckCircle2 size={16} color="#000000" />
                        <span style={{ fontWeight: 600 }}>{artworkFile.originalFileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setArtworkFile(null);
                          setQuoteData((prev) => ({ ...prev, designFileStorageKey: undefined, designFileName: undefined }));
                        }}
                        style={{ background: 'none', border: 'none', color: '#666666', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isUploadingArtwork}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', padding: '0.6rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.45rem' }}
                    >
                      {isUploadingArtwork ? (
                        <>
                          <RefreshCw size={13} className="spin" />
                          Uploading artwork...
                        </>
                      ) : (
                        <>
                          <Upload size={13} />
                          Upload Artwork / Reference File (PDF, AI, CDR, Images, Zip - Max 50MB)
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Section 8: Additional Notes */}
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">
                    Additional Notes <span style={{ fontSize: '11px', color: '#666666' }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={quoteData.notes || ''}
                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                    placeholder="Any specific timeline, installation constraints, or budget preference..."
                  />
                </div>

                {/* Submit Quote Button */}
                <button
                  type="submit"
                  disabled={isSubmittingQuote || isUploadingArtwork}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '14px',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                  id="customer-quote-submit-btn"
                >
                  {isSubmittingQuote ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      Submitting Quote Request...
                    </>
                  ) : (
                    <>
                      Submit Quotation Enquiry
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
