import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Shield, Bell, Check, ExternalLink } from 'lucide-react';
import { NotificationItem } from '../types';
import { notificationApi } from '../../services/api/notificationApi';

interface NavbarProps {
  onOpenProfile?: () => void;
  onSelectProject?: (projectId: string) => void;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenProfile, onSelectProject, onNavigate }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setErrorMessage(null);
      const [items, count] = await Promise.all([
        notificationApi.getAll(),
        notificationApi.getUnreadCount(),
      ]);
      const normalizedItems = (items || []).map(item => ({
        ...item,
        isRead: Boolean(item.isRead ?? (item as any).read),
      }));
      setNotifications(normalizedItems);
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
      setErrorMessage('Unable to load notifications.');
    }
  };

  // Initial fetch and 15s background polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Outside click auto-close handler
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [showDropdown]);

  // Format relative timestamp
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Handle clicking individual notification
  const handleNotificationClick = async (n: NotificationItem) => {
    // 1. Mark as read immediately in UI state and call API
    if (!n.isRead) {
      setNotifications(prev =>
        prev.map(item => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      try {
        await notificationApi.markAsRead(n.id);
      } catch (err) {
        console.error('Failed to mark notification as read on server:', err);
      }
    }

    // 2. Auto-close notification drawer
    setShowDropdown(false);

    // 3. Navigate to target project or page
    if (n.linkUrl) {
      if (n.linkUrl.startsWith('/projects/')) {
        const projectId = n.linkUrl.replace('/projects/', '').trim();
        if (projectId && onSelectProject) {
          onSelectProject(projectId);
          return;
        }
      }
      if (onNavigate) {
        onNavigate(n.linkUrl);
      }
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await notificationApi.markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setErrorMessage('Unable to mark all as read.');
    }
  };

  // Badge count display logic: 0 = hidden, 1..99 = number, >99 = "99+"
  const getBadgeDisplay = () => {
    if (unreadCount <= 0) return null;
    if (unreadCount > 99) return '99+';
    return unreadCount.toString();
  };

  return (
    <header
      style={{
        height: '64px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.75rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#000000', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              ROHILLA CRM
            </div>
            <div style={{ fontSize: '11px', color: '#666666', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Enterprise Operations Suite
            </div>
          </div>
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Notifications Trigger & Dropdown Container */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDropdown(prev => !prev)}
              style={{
                position: 'relative',
                background: showDropdown ? '#F5F5F5' : '#FFFFFF',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.45rem',
                color: '#000000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#000000',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    border: '1px solid #FFFFFF',
                  }}
                >
                  {getBadgeDisplay()}
                </span>
              )}
            </button>

            {/* Notification Drawer */}
            {showDropdown && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '380px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '480px',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Bell size={15} color="#000000" />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#000000' }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#000000',
                          color: '#FFFFFF',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 600,
                        }}
                      >
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666666',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#000000')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#666666')}
                      title="Mark all notifications as read"
                    >
                      <Check size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#F5F5F5',
                      color: '#000000',
                      fontSize: '12px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Notification Items List */}
                <div style={{ overflowY: 'auto', flex: 1, maxHeight: '400px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: '#666666', fontSize: '13px' }}>
                      <Bell size={24} style={{ opacity: 0.3, margin: '0 auto 0.5rem', display: 'block' }} />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          background: n.isRead ? '#FFFFFF' : '#F9F9F9',
                          borderLeft: n.isRead ? '3px solid transparent' : '3px solid #000000',
                          transition: 'background 0.12s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#F5F5F5';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = n.isRead ? '#FFFFFF' : '#F9F9F9';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontWeight: n.isRead ? 500 : 700,
                              fontSize: '13px',
                              color: '#000000',
                              lineHeight: 1.3,
                            }}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: '#000000',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>

                        <div style={{ fontSize: '12px', color: '#666666', lineHeight: 1.4 }}>
                          {n.message}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '11px', color: '#888888' }}>
                            {formatTime(n.createdAt)}
                          </span>
                          {n.linkUrl && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#000000',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontWeight: 600,
                              }}
                            >
                              <span>Open task</span>
                              <ExternalLink size={10} />
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Department Tag */}
          <span
            style={{
              background: '#F5F5F5',
              border: '1px solid var(--border-subtle)',
              padding: '0.3rem 0.65rem',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#000000',
            }}
          >
            {user.department}
          </span>

          {/* User Profile Card */}
          <div
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: onOpenProfile ? 'pointer' : 'default',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (onOpenProfile) e.currentTarget.style.background = '#F5F5F5'; }}
            onMouseLeave={e => { if (onOpenProfile) e.currentTarget.style.background = 'transparent'; }}
            title="Open My Profile & KYC"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
              }}
            >
              {user.fullName.charAt(0)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>
                {user.roles.includes('ROLE_ADMIN') ? (
                  <span>Aditye Rohilla <span style={{ color: '#666666', fontWeight: 600 }}>— Owner</span></span>
                ) : (
                  user.fullName
                )}
              </span>
              <span style={{ fontSize: '11px', color: '#666666', fontWeight: 500 }}>
                {user.roles.includes('ROLE_ADMIN') 
                  ? 'ADMIN / OWNER'
                  : user.roles[0]?.replace('ROLE_', '')}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="btn btn-outline btn-sm"
            title="Log Out"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#000000' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </header>
  );
};
