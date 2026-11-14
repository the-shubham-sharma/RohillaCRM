import React, { useState } from 'react';
import { DateFilterPeriod } from '../types';
import { Calendar, Filter } from 'lucide-react';

interface DateFilterBarProps {
  selectedPeriod: DateFilterPeriod;
  startDate?: string;
  endDate?: string;
  onFilterChange: (period: DateFilterPeriod, startDate?: string, endDate?: string) => void;
  accentColor?: string;
}

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  selectedPeriod,
  startDate,
  endDate,
  onFilterChange,
}) => {
  const [customStart, setCustomStart] = useState<string>(startDate || '');
  const [customEnd, setCustomEnd] = useState<string>(endDate || '');
  const [isCustomOpen, setIsCustomOpen] = useState<boolean>(selectedPeriod === 'CUSTOM');

  const filterOptions: { id: DateFilterPeriod; label: string }[] = [
    { id: 'TODAY', label: 'Today' },
    { id: 'THIS_WEEK', label: 'This Week' },
    { id: 'THIS_MONTH', label: 'This Month' },
    { id: 'LAST_MONTH', label: 'Last Month' },
    { id: 'THIS_QUARTER', label: 'This Quarter' },
    { id: 'THIS_YEAR', label: 'This Year' },
    { id: 'CUSTOM', label: 'Custom Range' },
  ];

  const handlePeriodClick = (period: DateFilterPeriod) => {
    if (period === 'CUSTOM') {
      setIsCustomOpen(true);
      onFilterChange('CUSTOM', customStart, customEnd);
    } else {
      setIsCustomOpen(false);
      onFilterChange(period);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange('CUSTOM', customStart, customEnd);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          background: 'var(--bg-subtle)',
          padding: '0.45rem 0.75rem',
          borderRadius: '4px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Filter size={14} color="#666666" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#666666', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Period:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
          {filterOptions.map((opt) => {
            const isSelected = selectedPeriod === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePeriodClick(opt.id)}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: '3px',
                  border: isSelected ? '1px solid #000000' : '1px solid transparent',
                  background: isSelected ? '#000000' : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#333333',
                  fontSize: '12px',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#E5E5E5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {isCustomOpen && (
        <form
          onSubmit={handleApplyCustom}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: '#FFFFFF',
            padding: '0.6rem 0.85rem',
            borderRadius: '4px',
            border: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Calendar size={14} color="#666666" />
            <span style={{ fontSize: '12px', color: '#000000', fontWeight: 500 }}>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '12px', width: 'auto' }}
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ fontSize: '12px', color: '#000000', fontWeight: 500 }}>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.3rem 0.5rem', fontSize: '12px', width: 'auto' }}
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}>
            Apply Filter
          </button>
        </form>
      )}
    </div>
  );
};
