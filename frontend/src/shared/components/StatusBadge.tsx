import React from 'react';
import { ProjectStatus, Priority } from '../types';

interface StatusBadgeProps {
  status?: ProjectStatus;
  priority?: Priority;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, priority, size = 'md' }) => {
  if (priority) {
    const isUrgent = priority === 'URGENT';
    const isHigh = priority === 'HIGH';
    const isMedium = priority === 'MEDIUM';

    const getPriorityStyle = () => {
      if (isUrgent || isHigh) {
        return {
          bg: '#000000',
          text: '#FFFFFF',
          border: '1px solid #000000',
        };
      }
      if (isMedium) {
        return {
          bg: '#E5E5E5',
          text: '#000000',
          border: '1px solid #CCCCCC',
        };
      }
      // LOW
      return {
        bg: '#FFFFFF',
        text: '#666666',
        border: '1px solid #CCCCCC',
      };
    };

    const style = getPriorityStyle();

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: size === 'sm' ? '2px 6px' : '3px 8px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 600,
          borderRadius: '3px',
          background: style.bg,
          color: style.text,
          border: style.border,
          letterSpacing: '0.03em',
          lineHeight: 1.3,
          textTransform: 'uppercase',
        }}
      >
        {priority}
      </span>
    );
  }

  if (status) {
    const formatStatus = (s: ProjectStatus) => s.replace(/_/g, ' ');

    const completedStatuses: ProjectStatus[] = [
      'COMPLETED',
      'QC_PASSED',
      'PRODUCTION_COMPLETED',
      'CUSTOMER_APPROVED',
      'MANAGER_APPROVED',
      'INSTALLATION_COMPLETED',
    ];

    const inProgressStatuses: ProjectStatus[] = [
      'DESIGN_IN_PROGRESS',
      'IN_PRODUCTION',
      'DESIGN_TECHNICAL_CHECK',
      'DESIGN_SUBMITTED',
      'DISPATCHED',
    ];

    const rejectedStatuses: ProjectStatus[] = [
      'QC_REJECTED',
      'CUSTOMER_REWORK_REQUESTED',
      'CANCELLED',
    ];

    const getStatusStyle = (s: ProjectStatus) => {
      if (completedStatuses.includes(s)) {
        return {
          bg: '#000000',
          text: '#FFFFFF',
          border: '1px solid #000000',
        };
      }
      if (inProgressStatuses.includes(s)) {
        return {
          bg: '#E5E5E5',
          text: '#000000',
          border: '1px solid #CCCCCC',
        };
      }
      if (rejectedStatuses.includes(s)) {
        return {
          bg: '#FFFFFF',
          text: '#000000',
          border: '1px solid #000000',
        };
      }
      // Pending / Draft
      return {
        bg: '#FFFFFF',
        text: '#000000',
        border: '1px solid #CCCCCC',
      };
    };

    const style = getStatusStyle(status);

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: size === 'sm' ? '2px 6px' : '3px 8px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 600,
          borderRadius: '3px',
          background: style.bg,
          color: style.text,
          border: style.border,
          letterSpacing: '0.03em',
          lineHeight: 1.3,
          textTransform: 'uppercase',
        }}
      >
        {formatStatus(status)}
      </span>
    );
  }

  return null;
};
