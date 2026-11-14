import React, { useEffect, useState } from 'react';
import { AuditLogItem, ApiResponse } from '../../shared/types';
import { apiClient } from '../../services/api/client';
import { Search, RefreshCw, Filter } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<AuditLogItem[]>>('/audit-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resourceType && log.resourceType.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.newValue && log.newValue.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('FAILED') || action.includes('DENIED')) {
      return {
        bg: '#FFFFFF',
        color: '#000000',
        border: '1px solid #000000',
      };
    }
    if (action.includes('SUCCESS') || action.includes('PASSED')) {
      return {
        bg: '#000000',
        color: '#FFFFFF',
        border: '1px solid #000000',
      };
    }
    return {
      bg: '#E5E5E5',
      color: '#000000',
      border: '1px solid #CCCCCC',
    };
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '0.2rem', color: '#000000' }}>Tamper-Evident Audit Logs</h1>
          <p style={{ color: '#666666', fontSize: '13px', margin: 0 }}>
            Immutable record of authentication events, workflow state transitions, uploads, and data changes.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} className={isLoading ? 'spin' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={15} color="#888888" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by actor, action, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={15} color="#666666" />
          <select
            className="form-select"
            style={{ width: '220px' }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="PROJECT_STATUS_TRANSITION">PROJECT_STATUS_TRANSITION</option>
            <option value="PROJECT_CREATED">PROJECT_CREATED</option>
            <option value="DESIGN_UPLOADED">DESIGN_UPLOADED</option>
            <option value="PRODUCTION_TASK_STARTED">PRODUCTION_TASK_STARTED</option>
            <option value="QC_INSPECTION_RECORDED">QC_INSPECTION_RECORDED</option>
            <option value="DISPATCH_RECORDED">DISPATCH_RECORDED</option>
            <option value="USER_STATUS_UPDATED">USER_STATUS_UPDATED</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target Resource</th>
              <th>Old State</th>
              <th>New State / Change</th>
              <th>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#666666' }}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const style = getActionBadgeStyle(log.action);
                return (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#000000' }}>{log.actorEmail}</div>
                      <div style={{ fontSize: '11px', color: '#666666' }}>{log.actorRole}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '2px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          background: style.bg,
                          color: style.color,
                          border: style.border,
                        }}
                      >
                        <span>{log.action}</span>
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '13px', color: '#000000' }}>
                        {log.resourceType}
                        {log.resourceId && (
                          <span style={{ fontSize: '11px', color: '#666666', display: 'block' }}>
                            ID: {log.resourceId.substring(0, 8)}...
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#666666' }}>
                      {log.oldValue || '-'}
                    </td>
                    <td style={{ fontSize: '13px', color: '#000000', maxWidth: '350px' }}>
                      {log.newValue || '-'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#666666' }}>
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};