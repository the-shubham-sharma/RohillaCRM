import React, { ReactNode } from 'react';

export interface DepartmentMember {
  id: string;
  fullName: string;
}

export interface DepartmentWorkCardProps {
  title: string;
  icon?: ReactNode;
  accentColor?: string;
  badgeClassName?: string;
  badgeStyle?: React.CSSProperties;
  activeCount: number;
  members: DepartmentMember[];
  emptyText: string;
}

export const DepartmentWorkCard: React.FC<DepartmentWorkCardProps> = ({
  title,
  icon,
  activeCount,
  members,
  emptyText,
}) => {
  return (
    <div
      className="glass-card"
      style={{
        padding: '1.15rem 1.25rem',
        border: '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        borderRadius: '4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 700,
            fontSize: '14px',
            color: '#000000',
          }}
        >
          {icon && <span style={{ color: '#000000', display: 'flex', alignItems: 'center' }}>{icon}</span>}
          <span>{title}</span>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 7px',
            fontSize: '11px',
            fontWeight: 600,
            borderRadius: '3px',
            background: activeCount > 0 ? '#E5E5E5' : '#FFFFFF',
            color: '#000000',
            border: '1px solid #CCCCCC',
            letterSpacing: '0.02em',
          }}
        >
          {activeCount} ACTIVE
        </span>
      </div>

      {members.length === 0 ? (
        <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>
          {emptyText}
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.45rem',
          }}
        >
          {members.map((member) => (
            <li
              key={member.id}
              style={{
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#000000',
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#000000',
                  flexShrink: 0,
                }}
              />
              <span>{member.fullName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
