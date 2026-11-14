import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import {
  ProjectListItem,
  ApiResponse,
  DepartmentWorkspace,
  DesignerHistoryItem,
  ProductionHistoryItem,
  QcHistoryItem,
  DispatchHistoryItem,
  DesignerPerformance,
  ProductionPerformance,
  QcPerformance,
  DispatchPerformance,
  TeamPerformance,
  CompanyPerformance,
  DateFilterPeriod
} from '../../shared/types';
import { apiClient } from '../../services/api/client';
import { StatusBadge } from '../../shared/components/StatusBadge';
import { DateFilterBar } from '../../shared/components/DateFilterBar';
import {
  Clock,
  ShieldCheck,
  Send,
  Plus,
  RefreshCw,
  Hammer,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CheckCircle,
  XCircle,
  ArrowUpRight
} from 'lucide-react';

interface DashboardProps {
  initialView?: 'workstation' | 'history' | 'team_performance' | 'company_analytics';
  onSelectProject: (projectId: string) => void;
  onNavigateToProjects: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialView = 'workstation', onSelectProject, onNavigateToProjects }) => {
  const { user, hasRole } = useAuth();

  const isPrivileged = hasRole(['ROLE_ADMIN', 'ROLE_MANAGER']);
  const isOwner = hasRole('ROLE_ADMIN');
  const isDesigner = hasRole('ROLE_DESIGNER');
  const isProduction = hasRole('ROLE_PRODUCTION');
  const isQc = hasRole('ROLE_QC');
  const isDispatch = hasRole('ROLE_DISPATCH');

  // Active view tab inside dashboard: 'workstation' | 'history' | 'team_performance' | 'company_analytics'
  const [viewTab, setViewTab] = useState<'workstation' | 'history' | 'team_performance' | 'company_analytics'>(initialView);

  useEffect(() => {
    if (initialView) {
      setViewTab(initialView);
    }
  }, [initialView]);

  // Filter period state for History and Performance
  const [selectedPeriod, setSelectedPeriod] = useState<DateFilterPeriod>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();

  // Data states
  const [workspace, setWorkspace] = useState<DepartmentWorkspace | null>(null);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Department-specific history
  const [designerHistory, setDesignerHistory] = useState<DesignerHistoryItem[]>([]);
  const [productionHistory, setProductionHistory] = useState<ProductionHistoryItem[]>([]);
  const [qcHistory, setQcHistory] = useState<QcHistoryItem[]>([]);
  const [dispatchHistory, setDispatchHistory] = useState<DispatchHistoryItem[]>([]);

  // Department-specific performance
  const [designerPerf, setDesignerPerf] = useState<DesignerPerformance | null>(null);
  const [productionPerf, setProductionPerf] = useState<ProductionPerformance | null>(null);
  const [qcPerf, setQcPerf] = useState<QcPerformance | null>(null);
  const [dispatchPerf, setDispatchPerf] = useState<DispatchPerformance | null>(null);

  // Management performance
  const [teamPerf, setTeamPerf] = useState<TeamPerformance | null>(null);
  const [companyPerf, setCompanyPerf] = useState<CompanyPerformance | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (isDesigner) {
        const [wsRes, histRes, perfRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentWorkspace>>('/workspace/designer'),
          apiClient.get<ApiResponse<DesignerHistoryItem[]>>(`/workspace/history/designer?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
          apiClient.get<ApiResponse<DesignerPerformance>>(`/workspace/performance/designer?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
        ]);
        setWorkspace(wsRes.data.data);
        setDesignerHistory(histRes.data.data || []);
        setDesignerPerf(perfRes.data.data);
      } else if (isProduction) {
        const [wsRes, histRes, perfRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentWorkspace>>('/workspace/production'),
          apiClient.get<ApiResponse<ProductionHistoryItem[]>>(`/workspace/history/production?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
          apiClient.get<ApiResponse<ProductionPerformance>>(`/workspace/performance/production?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
        ]);
        setWorkspace(wsRes.data.data);
        setProductionHistory(histRes.data.data || []);
        setProductionPerf(perfRes.data.data);
      } else if (isQc) {
        const [wsRes, histRes, perfRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentWorkspace>>('/workspace/qc'),
          apiClient.get<ApiResponse<QcHistoryItem[]>>(`/workspace/history/qc?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
          apiClient.get<ApiResponse<QcPerformance>>(`/workspace/performance/qc?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
        ]);
        setWorkspace(wsRes.data.data);
        setQcHistory(histRes.data.data || []);
        setQcPerf(perfRes.data.data);
      } else if (isDispatch) {
        const [wsRes, histRes, perfRes] = await Promise.all([
          apiClient.get<ApiResponse<DepartmentWorkspace>>('/workspace/dispatch'),
          apiClient.get<ApiResponse<DispatchHistoryItem[]>>(`/workspace/history/dispatch?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
          apiClient.get<ApiResponse<DispatchPerformance>>(`/workspace/performance/dispatch?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
        ]);
        setWorkspace(wsRes.data.data);
        setDispatchHistory(histRes.data.data || []);
        setDispatchPerf(perfRes.data.data);
      } else if (isPrivileged) {
        const [projRes, teamRes, compRes] = await Promise.all([
          apiClient.get<ApiResponse<ProjectListItem[]>>('/projects'),
          apiClient.get<ApiResponse<TeamPerformance>>(`/workspace/performance/team?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),
          apiClient.get<ApiResponse<CompanyPerformance>>(`/workspace/performance/company?period=${selectedPeriod}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`)
        ]);
        setProjects(projRes.data.data || []);
        setTeamPerf(teamRes.data.data);
        setCompanyPerf(compRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, selectedPeriod, startDate, endDate]);

  const handleFilterChange = (period: DateFilterPeriod, start?: string, end?: string) => {
    setSelectedPeriod(period);
    setStartDate(start);
    setEndDate(end);
  };

  // =========================================================================
  // 1. DESIGNER WORKSPACE & HISTORY
  // =========================================================================
  if (isDesigner) {
    return (
      <div className="page-wrapper">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Designer Studio Workspace</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Focused Creative Workstation • Action-Required Tasks &amp; Permanent History
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewTab('workstation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'workstation' ? '#000000' : 'transparent',
              border: viewTab === 'workstation' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'workstation' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My Design Work
          </button>

          <button
            onClick={() => setViewTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'history' ? '#000000' : 'transparent',
              border: viewTab === 'history' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'history' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My History &amp; Records ({designerHistory.length})
          </button>
        </div>

        {/* VIEW 1: Main Dashboard = Only Pending Work */}
        {viewTab === 'workstation' && workspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Section 1: My Active Work (Action Required) */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={18} color="var(--warning)" /> MY ACTIVE WORK
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pending design tasks, artwork creation, technical checks &amp; rework requests
                  </p>
                </div>
                <span className="badge badge-warning">{workspace.activeWork.length} Action Required</span>
              </div>

              {workspace.activeWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <p>All active design tasks are up to date! No pending work requires your action.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspace.activeWork.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{p.projectCode}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: p.customerProvidedDesign ? 'rgba(168, 85, 247, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: p.customerProvidedDesign ? '#c084fc' : '#38bdf8' }}>
                            {p.customerProvidedDesign ? 'Path A: Compatibility Check' : 'Path B: Design Required'}
                          </span>
                          <StatusBadge priority={p.priority} size="sm" />
                          <StatusBadge status={p.status} size="sm" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: <strong>{p.client?.companyName}</strong></p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Deadline</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.dueDate || 'N/A'}</div>
                        </div>
                        <button onClick={() => onSelectProject(p.id)} className="btn btn-primary btn-sm">
                          View Design Task <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Waiting for Review (Submitted designs awaiting approval) */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="#c084fc" /> WAITING FOR REVIEW
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Artwork proofs submitted, awaiting customer decision or manager approval
                  </p>
                </div>
                <span className="badge badge-design">{workspace.waitingWork.length} In Review</span>
              </div>

              {workspace.waitingWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No submitted designs currently awaiting review.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {workspace.waitingWork.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>{p.projectCode}</span>
                          <StatusBadge status={p.status} size="sm" />
                        </div>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                      </div>
                      <button onClick={() => onSelectProject(p.id)} className="btn btn-outline btn-sm">
                        Open Task
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Dedicated History & Records Tab */}
        {viewTab === 'history' && (
          <div>
            {/* Time Filter Bar */}
            <DateFilterBar
              selectedPeriod={selectedPeriod}
              startDate={startDate}
              endDate={endDate}
              onFilterChange={handleFilterChange}
            />

            {/* Performance KPI Cards */}
            {designerPerf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designs Completed</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>
                    {designerPerf.designsCompleted}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>In {selectedPeriod.replace(/_/g, ' ').toLowerCase()}</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Designs Submitted</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>
                    {designerPerf.designsSubmitted}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Submitted for review</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revisions Handled</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>
                    {designerPerf.revisionsCount}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Changes completed</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Completion Time</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>
                    {designerPerf.averageCompletionTimeDays} <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>days</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Start to approval</div>
                </div>

                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>On-Time Completion</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>
                    {designerPerf.onTimeCompletionRate}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Met client deadline</div>
                </div>
              </div>
            )}

            {/* Permanent Design Work History Table */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>My History &amp; Records ({designerHistory.length} total records)</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Complete historical record of completed designs, proof versions, revisions, and on-time performance
                  </p>
                </div>
              </div>

              {designerHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No historical records found for the selected time filter.
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Code</th>
                        <th>Task &amp; Path</th>
                        <th>Assigned</th>
                        <th>Completed</th>
                        <th>Versions</th>
                        <th>Revisions</th>
                        <th>Duration</th>
                        <th>Deadline</th>
                        <th>On-Time</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {designerHistory.map((h) => (
                        <tr key={h.projectId}>
                          <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{h.projectCode}</span></td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{h.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{h.taskType}</div>
                          </td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(h.assignedAt).toLocaleDateString()}</span></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.completedAt ? new Date(h.completedAt).toLocaleDateString() : 'In Progress'}</span></td>
                          <td><span className="badge badge-design">v{h.versionCount}</span></td>
                          <td><span style={{ fontWeight: 600, color: h.reworkCount > 0 ? '#f87171' : 'var(--text-muted)' }}>{h.reworkCount}</span></td>
                          <td><span style={{ fontSize: '0.8rem' }}>{h.completionTimeDays ? `${h.completionTimeDays} d` : '—'}</span></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.dueDate || 'N/A'}</span></td>
                          <td>
                            {h.onTime ? (
                              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={13} /> Met
                              </span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <XCircle size={13} /> Delayed
                              </span>
                            )}
                          </td>
                          <td>
                            <button onClick={() => onSelectProject(h.projectId)} className="btn btn-secondary btn-sm">
                              Open Task
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. PRODUCTION WORKSPACE & HISTORY
  // =========================================================================
  if (isProduction) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Production Floor Workspace</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Print &amp; Fabrication Floor • Active Floor Tasks &amp; History Records
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewTab('workstation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'workstation' ? '#000000' : 'transparent',
              border: viewTab === 'workstation' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'workstation' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My Production Work
          </button>
          <button
            onClick={() => setViewTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'history' ? '#000000' : 'transparent',
              border: viewTab === 'history' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'history' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My History &amp; Records ({productionHistory.length})
          </button>
        </div>

        {/* VIEW 1: Main Dashboard = Only Pending Work */}
        {viewTab === 'workstation' && workspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Hammer size={18} color="var(--warning)" /> MY ACTIVE PRODUCTION WORK
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Pending print jobs, fabrication queues, machine setup &amp; rework tasks
                  </p>
                </div>
                <span className="badge badge-warning">{workspace.activeWork.length} In Queue</span>
              </div>

              {workspace.activeWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <p>All active print &amp; fabrication jobs are up to date! No pending floor tasks.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspace.activeWork.map((p) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{p.projectCode}</span>
                          <StatusBadge status={p.status} size="sm" />
                          <StatusBadge priority={p.priority} size="sm" />
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: <strong>{p.client?.companyName}</strong></p>
                      </div>
                      <button onClick={() => onSelectProject(p.id)} className="btn btn-primary btn-sm">
                        Work on Job <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upstream / Waiting Queue */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={18} color="var(--warning)" /> UPSTREAM / WAITING JOBS
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Jobs currently in design, proofing, or awaiting manager release to production
                  </p>
                </div>
                <span className="badge badge-design">{workspace.waitingWork.length} Upstream</span>
              </div>

              {workspace.waitingWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No upstream jobs waiting.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {workspace.waitingWork.map((p) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginRight: '0.5rem' }}>{p.projectCode}</span>
                        <strong>{p.title}</strong>
                      </div>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: History & Records Tab */}
        {viewTab === 'history' && (
          <div>
            {/* Time Filter Bar */}
            <DateFilterBar
              selectedPeriod={selectedPeriod}
              startDate={startDate}
              endDate={endDate}
              onFilterChange={handleFilterChange}
            />

            {/* Production Performance KPIs */}
            {productionPerf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jobs Completed</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{productionPerf.jobsCompleted}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Progress</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{productionPerf.jobsInProgress}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rework Jobs</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{productionPerf.reworkJobs}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Production Time</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{productionPerf.averageProductionTimeHours} <span style={{ fontSize: '0.85rem' }}>hrs</span></div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>On-Time Rate</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{productionPerf.onTimeCompletionRate}%</div>
                </div>
              </div>
            )}

            {/* Production History Table */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>My History &amp; Records ({productionHistory.length} total records)</h2>
              {productionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No production history found for this period.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Code</th>
                        <th>Job / Task</th>
                        <th>Material Spec</th>
                        <th>Machine</th>
                        <th>Qty</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productionHistory.map((h, i) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{h.projectCode}</span></td>
                          <td><div style={{ fontWeight: 600 }}>{h.title}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{h.taskName}</div></td>
                          <td><span style={{ fontSize: '0.8rem' }}>{h.materialSpecification || 'Standard'}</span></td>
                          <td><span style={{ fontSize: '0.8rem' }}>{h.machineType || 'Floor'}</span></td>
                          <td>{h.quantity}</td>
                          <td>{h.durationHours ? `${h.durationHours} hrs` : '—'}</td>
                          <td><span className="badge badge-production">{h.status}</span></td>
                          <td><span style={{ fontSize: '0.8rem' }}>{h.dueDate || 'N/A'}</span></td>
                          <td>
                            <button onClick={() => onSelectProject(h.projectId)} className="btn btn-secondary btn-sm">
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. QC WORKSPACE & HISTORY
  // =========================================================================
  if (isQc) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>QC Inspection Workstation</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Quality Assurance • Active Inspection Queue &amp; Inspection History Records
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewTab('workstation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'workstation' ? '#000000' : 'transparent',
              border: viewTab === 'workstation' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'workstation' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My QC Inspections
          </button>
          <button
            onClick={() => setViewTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'history' ? '#000000' : 'transparent',
              border: viewTab === 'history' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'history' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My History &amp; Records ({qcHistory.length})
          </button>
        </div>

        {/* VIEW 1: Main Dashboard = Only Pending Work */}
        {viewTab === 'workstation' && workspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={18} color="#c084fc" /> MY ACTIVE INSPECTIONS
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Fabricated projects currently pending quality inspection and sign-off
                  </p>
                </div>
                <span className="badge badge-warning">{workspace.activeWork.length} Pending Inspection</span>
              </div>

              {workspace.activeWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <p>All finished jobs have been inspected! No pending QC tasks in queue.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspace.activeWork.map((p) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', marginRight: '0.5rem' }}>{p.projectCode}</span>
                        <StatusBadge status={p.status} size="sm" />
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '0.25rem' }}>{p.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: <strong>{p.client?.companyName}</strong></p>
                      </div>
                      <button onClick={() => onSelectProject(p.id)} className="btn btn-primary btn-sm">
                        Inspect Job <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: History & Records Tab */}
        {viewTab === 'history' && (
          <div>
            {/* Time Filter Bar */}
            <DateFilterBar
              selectedPeriod={selectedPeriod}
              startDate={startDate}
              endDate={endDate}
              onFilterChange={handleFilterChange}
            />

            {/* QC Performance KPIs */}
            {qcPerf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Inspections Done</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{qcPerf.inspectionsCompleted}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pass Rate</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{qcPerf.passRate}%</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rework Rate</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{qcPerf.reworkRate}%</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Quality Score</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{qcPerf.averageQualityScore} <span style={{ fontSize: '0.85rem' }}>/ 10</span></div>
                </div>
              </div>
            )}

            {/* QC History Records Table */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>My History &amp; Records ({qcHistory.length} total records)</h2>
              {qcHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No QC evaluation records found for this period.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Code</th>
                        <th>Job Title</th>
                        <th>Inspection Date</th>
                        <th>Result</th>
                        <th>Color Score</th>
                        <th>Dimension Score</th>
                        <th>Finish Score</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qcHistory.map((h, i) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{h.projectCode}</span></td>
                          <td><strong>{h.title}</strong></td>
                          <td><span style={{ fontSize: '0.8rem' }}>{new Date(h.inspectionDate).toLocaleDateString()}</span></td>
                          <td><span className={`badge ${h.passed ? 'badge-delivered' : 'badge-cancelled'}`}>{h.passed ? 'PASSED' : 'REWORK'}</span></td>
                          <td>{h.colorAccuracyScore}/10</td>
                          <td>{h.dimensionAccuracyScore}/10</td>
                          <td>{h.finishingScore}/10</td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.remarks || '—'}</span></td>
                          <td>
                            <button onClick={() => onSelectProject(h.projectId)} className="btn btn-secondary btn-sm">
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. DISPATCH WORKSPACE & HISTORY
  // =========================================================================
  if (isDispatch) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dispatch &amp; Installation Workstation</h1>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Logistics &amp; Installation • Active Shipments &amp; Complete Delivery History
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        {/* View Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <button
            onClick={() => setViewTab('workstation')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'workstation' ? '#000000' : 'transparent',
              border: viewTab === 'workstation' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'workstation' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My Dispatch Work
          </button>
          <button
            onClick={() => setViewTab('history')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'history' ? '#000000' : 'transparent',
              border: viewTab === 'history' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'history' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            My History &amp; Records ({dispatchHistory.length})
          </button>
        </div>

        {/* VIEW 1: Main Dashboard = Only Pending Work */}
        {viewTab === 'workstation' && workspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Send size={18} color="var(--success)" /> MY ACTIVE DISPATCH &amp; INSTALLATION
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Orders ready for packaging, courier booking, transport &amp; on-site installation
                  </p>
                </div>
                <span className="badge badge-warning">{workspace.activeWork.length} Pending Delivery</span>
              </div>

              {workspace.activeWork.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem' }} />
                  <p>All passed orders have been dispatched and installed! No pending logistics tasks.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {workspace.activeWork.map((p) => (
                    <div key={p.id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', border: '1px solid var(--border-subtle)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{p.projectCode}</span>
                          <StatusBadge status={p.status} size="sm" />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
                            {p.installationRequired ? 'On-Site Mounting' : 'Delivery Only'}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client: <strong>{p.client?.companyName}</strong></p>
                      </div>
                      <button onClick={() => onSelectProject(p.id)} className="btn btn-primary btn-sm">
                        Manage Logistics <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: History & Records Tab */}
        {viewTab === 'history' && (
          <div>
            {/* Time Filter Bar */}
            <DateFilterBar
              selectedPeriod={selectedPeriod}
              startDate={startDate}
              endDate={endDate}
              onFilterChange={handleFilterChange}
            />

            {/* Dispatch Performance KPIs */}
            {dispatchPerf && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dispatches</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{dispatchPerf.dispatchesCompleted}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Installations Done</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{dispatchPerf.installationsCompleted}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Jobs</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{dispatchPerf.pendingJobs}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>On-Time Rate</div>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{dispatchPerf.onTimeCompletionRate}%</div>
                </div>
              </div>
            )}

            {/* Logistics & Dispatch History Table */}
            <div className="glass-card" style={{ padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', fontWeight: 700 }}>My History &amp; Records ({dispatchHistory.length} total records)</h2>
              {dispatchHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No dispatch history found for this period.</div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project Code</th>
                        <th>Title</th>
                        <th>Courier</th>
                        <th>Tracking Number</th>
                        <th>Dispatch Date</th>
                        <th>Install Required</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchHistory.map((h, i) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{h.projectCode}</span></td>
                          <td><strong>{h.title}</strong></td>
                          <td>{h.courierPartner}</td>
                          <td><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>{h.trackingNumber}</span></td>
                          <td>{h.dispatchDate}</td>
                          <td>{h.installationRequired ? 'Yes (Mounted)' : 'No'}</td>
                          <td><span className="badge badge-delivered">{h.deliveryStatus}</span></td>
                          <td>
                            <button onClick={() => onSelectProject(h.projectId)} className="btn btn-secondary btn-sm">
                              Open
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. OWNER & MANAGER CONSOLE (Full Project View & Department Comparison)
  // =========================================================================
  return (
    <div className="page-wrapper">
      {/* Welcome Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem', fontWeight: 800 }}>
            {isOwner ? 'Aditye Rohilla — Owner Command Center' : 'Operations Management Console'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Rohilla Advertising CRM • Complete Project Lifecycle, Department Workload &amp; Performance
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={isLoading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={onNavigateToProjects} className="btn btn-primary btn-sm">
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Top View Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setViewTab('workstation')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: viewTab === 'workstation' ? '#000000' : 'transparent',
            border: viewTab === 'workstation' ? '1px solid #000000' : '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: viewTab === 'workstation' ? '#FFFFFF' : '#4B5563',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Company Pipeline
        </button>

        <button
          onClick={() => setViewTab('team_performance')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: viewTab === 'team_performance' ? '#000000' : 'transparent',
            border: viewTab === 'team_performance' ? '1px solid #000000' : '1px solid var(--border-subtle)',
            borderRadius: '4px',
            color: viewTab === 'team_performance' ? '#FFFFFF' : '#4B5563',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Department Performance Comparison
        </button>

        {isOwner && (
          <button
            onClick={() => setViewTab('company_analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: viewTab === 'company_analytics' ? '#000000' : 'transparent',
              border: viewTab === 'company_analytics' ? '1px solid #000000' : '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: viewTab === 'company_analytics' ? '#FFFFFF' : '#4B5563',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Company-Wide Analytics
          </button>
        )}
      </div>

      {/* VIEW 1: Company Projects Pipeline (Live Active Pipeline) */}
      {viewTab === 'workstation' && (
        <>
          {/* Executive KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            {[
              { title: 'Total Projects', count: projects.length },
              { title: 'In Design & Artwork', count: projects.filter(p => p.status.includes('DESIGN') || p.status === 'DRAFT').length },
              { title: 'Active Production', count: projects.filter(p => p.status === 'READY_FOR_PRODUCTION' || p.status === 'IN_PRODUCTION').length },
              { title: 'QC Inspections', count: projects.filter(p => p.status === 'QC_PENDING' || p.status === 'QC_PASSED').length },
              { title: 'Completed & Installed', count: projects.filter(p => p.status === 'COMPLETED' || p.status === 'INSTALLATION_COMPLETED').length },
            ].map((card, i) => (
              <div key={i} className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{card.title}</div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#000000' }}>{card.count}</div>
              </div>
            ))}
          </div>

          {/* Full Projects Table */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem' }}>Full Project Lifecycle Pipeline</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Visible exclusively to Owner &amp; Operations Manager
                </p>
              </div>
              <button onClick={onNavigateToProjects} className="btn btn-outline btn-sm">
                View All Pipeline <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project Code</th>
                    <th>Title &amp; Client</th>
                    <th>Path</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Staff</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>{p.projectCode}</span></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{p.client?.companyName}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
                          {p.customerProvidedDesign ? 'Path A' : 'Path B'}
                        </span>
                      </td>
                      <td><StatusBadge priority={p.priority} size="sm" /></td>
                      <td><StatusBadge status={p.status} size="sm" /></td>
                      <td>
                        <div style={{ fontSize: '0.8rem' }}>
                          {p.assignedDesigner && <div>Design: {p.assignedDesigner.fullName}</div>}
                          {p.assignedProduction && <div style={{ color: 'var(--text-dim)' }}>Prod: {p.assignedProduction.fullName}</div>}
                        </div>
                      </td>
                      <td><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.dueDate || 'N/A'}</span></td>
                      <td>
                        <button onClick={() => onSelectProject(p.id)} className="btn btn-secondary btn-sm">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: Department Performance Comparison Matrix */}
      {viewTab === 'team_performance' && (
        <div>
          {/* Time Filter Bar */}
          <DateFilterBar
            selectedPeriod={selectedPeriod}
            startDate={startDate}
            endDate={endDate}
            onFilterChange={handleFilterChange}
            accentColor="var(--primary)"
          />

          {teamPerf && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Design Team Table */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#000000', fontWeight: 700 }}>
                  DESIGN TEAM PERFORMANCE
                </h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Designer Name</th>
                        <th>Email</th>
                        <th>Completed</th>
                        <th>Submitted / Active</th>
                        <th>Revisions</th>
                        <th>Avg Time</th>
                        <th>On-Time Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerf.designerMetrics.map((m) => (
                        <tr key={m.userId}>
                          <td><strong>{m.fullName}</strong></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{m.email}</span></td>
                          <td><span className="badge badge-delivered">{m.completedCount}</span></td>
                          <td>{m.submittedOrActiveCount}</td>
                          <td>{m.reworkCount}</td>
                          <td>{m.averageTime} {m.timeUnit}</td>
                          <td><strong>{m.onTimeRate}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Production Team Table */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#000000', fontWeight: 700 }}>
                  PRODUCTION TEAM PERFORMANCE
                </h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Specialist Name</th>
                        <th>Email</th>
                        <th>Completed</th>
                        <th>Active Jobs</th>
                        <th>Rework</th>
                        <th>Avg Duration</th>
                        <th>On-Time Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerf.productionMetrics.map((m) => (
                        <tr key={m.userId}>
                          <td><strong>{m.fullName}</strong></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{m.email}</span></td>
                          <td><span className="badge badge-delivered">{m.completedCount}</span></td>
                          <td>{m.submittedOrActiveCount}</td>
                          <td>{m.reworkCount}</td>
                          <td>{m.averageTime} {m.timeUnit}</td>
                          <td><strong>{m.onTimeRate}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QC Team Table */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#000000', fontWeight: 700 }}>
                  QUALITY CONTROL TEAM PERFORMANCE
                </h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Inspector Name</th>
                        <th>Email</th>
                        <th>Inspections</th>
                        <th>Assigned Jobs</th>
                        <th>Rework Flagged</th>
                        <th>Avg Inspection Time</th>
                        <th>Quality Index</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerf.qcMetrics.map((m) => (
                        <tr key={m.userId}>
                          <td><strong>{m.fullName}</strong></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{m.email}</span></td>
                          <td><span className="badge badge-delivered">{m.completedCount}</span></td>
                          <td>{m.submittedOrActiveCount}</td>
                          <td>{m.reworkCount}</td>
                          <td>{m.averageTime} {m.timeUnit}</td>
                          <td><strong>{m.onTimeRate}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispatch Team Table */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#000000', fontWeight: 700 }}>
                  DISPATCH &amp; INSTALLATION PERFORMANCE
                </h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Logistics Lead</th>
                        <th>Email</th>
                        <th>Dispatches &amp; Installs</th>
                        <th>Pending Jobs</th>
                        <th>Avg Fulfillment</th>
                        <th>On-Time Delivery Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamPerf.dispatchMetrics.map((m) => (
                        <tr key={m.userId}>
                          <td><strong>{m.fullName}</strong></td>
                          <td><span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{m.email}</span></td>
                          <td><span className="badge badge-delivered">{m.completedCount}</span></td>
                          <td>{m.submittedOrActiveCount}</td>
                          <td>{m.averageTime} {m.timeUnit}</td>
                          <td><strong style={{ color: 'var(--success)' }}>{m.onTimeRate}%</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Owner Executive Analytics */}
      {viewTab === 'company_analytics' && (
        <div>
          {/* Time Filter Bar */}
          <DateFilterBar
            selectedPeriod={selectedPeriod}
            startDate={startDate}
            endDate={endDate}
            onFilterChange={handleFilterChange}
            accentColor="var(--primary)"
          />

          {companyPerf && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Executive Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL COMPANY PROJECTS</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>{companyPerf.totalProjects}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>ACTIVE PIPELINE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>{companyPerf.activeProjects}</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--success)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>OVERALL ON-TIME RATE</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: 'var(--success)' }}>{companyPerf.overallOnTimeRate}%</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid #f87171' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REWORK DETECTED</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)', color: '#f87171' }}>{companyPerf.totalReworkCount}</div>
                </div>
              </div>

              {/* Department Workload Breakdown */}
              <div className="glass-card" style={{ padding: '1.75rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Current Department Workload Distribution</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  {Object.entries(companyPerf.departmentWorkload).map(([dept, count]) => (
                    <div key={dept} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{dept}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', fontFamily: 'var(--font-display)' }}>{count} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>projects</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
