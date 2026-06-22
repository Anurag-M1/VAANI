'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, clearToken, resources } from '../lib/api';
import { connectSocket } from '../lib/socket';

const navItems = [
  { id: 'dashboard', path: '/dashboard', icon: '📊', label: 'War Room', labelHi: 'वॉर रूम', badge: null },
  { id: 'complaints', path: '/dashboard/complaints', icon: '📋', label: 'Complaints', labelHi: 'शिकायतें', badge: null },
  { id: 'critical', path: '/dashboard/critical', icon: '🚨', label: 'DEFCON Alerts', labelHi: 'डेफकॉन सूचनाएं', badge: null, badgeClass: 'critical' },
  { id: 'heatmap', path: '/dashboard/heatmap', icon: '🗺️', label: 'Delhi Heatmap', labelHi: 'दिल्ली हीटमैप', badge: null },
  { id: 'leaderboard', path: '/dashboard/leaderboard', icon: '🏆', label: 'Leaderboard', labelHi: 'लीडरबोर्ड', badge: null },
  { id: 'analytics', path: '/dashboard/analytics', icon: '📈', label: 'Analytics', labelHi: 'विश्लेषण', badge: null },
  { id: 'departments', path: '/dashboard/departments', icon: '🏢', label: 'Departments', labelHi: 'विभाग', badge: null },
  { id: 'officers', path: '/dashboard/officers', icon: '👤', label: 'Officers', labelHi: 'अधिकारी', badge: null },
  { id: 'escalated', path: '/dashboard/escalated', icon: '⬆️', label: 'Escalated to CM', labelHi: 'CM को भेजी गई', badge: null },
  { id: 'visits', path: '/dashboard/visits', icon: '📍', label: 'Visit Logs', labelHi: 'दौरा रिकॉर्ड', badge: null },
  { id: 'reports', path: '/dashboard/reports', icon: '📄', label: 'Reports', labelHi: 'रिपोर्ट', badge: null },
];

const bottomNavItems = [
  { id: 'settings', path: '/dashboard/settings', icon: '⚙️', label: 'Settings', labelHi: 'सेटिंग्स' },
];

const routePermissions = {
  '/dashboard': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/complaints': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin', 'officer'],
  '/dashboard/critical': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/heatmap': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/leaderboard': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/analytics': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/departments': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/officers': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/escalated': ['cm', 'cm_staff', 'super_admin'],
  '/dashboard/visits': ['cm', 'cm_staff', 'district_officer', 'super_admin'],
  '/dashboard/reports': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin'],
  '/dashboard/settings': ['cm', 'cm_staff', 'district_officer', 'department_manager', 'nodal_officer', 'commissioner', 'super_admin', 'officer'],
};

const roleLabel = {
  cm: 'Chief Minister',
  cm_staff: 'CM Staff',
  district_officer: 'District Magistrate',
  department_manager: 'Dept Manager',
  nodal_officer: 'Nodal Officer',
  commissioner: 'Commissioner',
  officer: 'Field Officer',
  citizen: 'Citizen',
  super_admin: 'Super Admin',
};

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const pathname = usePathname();
  const router = useRouter();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  useEffect(() => {
    // Load appearance theme and language
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('vaani_theme') || 'system';
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      const savedLang = localStorage.getItem('vaani_language') || 'en';
      document.documentElement.setAttribute('data-lang', savedLang);
    }

    const stored = getStoredUser();
    if (!stored) {
      router.push('/');
      return;
    }

    if (stored.role === 'citizen') {
      router.push('/citizen');
      return;
    }
    if (stored.role === 'officer' && !pathname.startsWith('/dashboard/complaints') && !pathname.startsWith('/dashboard/settings')) {
      router.push('/officer');
      return;
    }

    setUser(stored);

    // Guard route access
    const matchedRoute = Object.keys(routePermissions)
      .sort((a, b) => b.length - a.length)
      .find(routePrefix => {
        if (routePrefix === '/dashboard') {
          return pathname === '/dashboard';
        }
        return pathname.startsWith(routePrefix);
      });
    
    const allowedRoles = matchedRoute ? routePermissions[matchedRoute] : [];
    if (allowedRoles.length > 0 && !allowedRoles.includes(stored.role)) {
      console.warn(`Access denied to path: ${pathname} for role: ${stored.role}`);
      router.push('/dashboard');
      return;
    }

    setLoading(false);

    // Connect socket
    const socket = connectSocket(stored._id, stored.role, stored.district);

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await resources.notifications();
        if (res && res.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.notifications.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };
    fetchNotifications();

    // Listen to real-time notification events
    let handleSocketNotification;
    if (socket) {
      handleSocketNotification = (newNotification) => {
        const notificationObj = {
          _id: newNotification.id,
          event: newNotification.event,
          message: newNotification.message,
          complaint_id: newNotification.complaintId,
          sent_at: newNotification.timestamp || new Date(),
          is_read: false
        };
        setNotifications(prev => [notificationObj, ...prev]);
        setUnreadCount(prev => prev + 1);
      };
      socket.on('notification', handleSocketNotification);
    }

    // Custom events listeners for real-time settings updates
    const handleUserUpdate = () => {
      const updatedUser = getStoredUser();
      setUser(updatedUser);
    };
    const handleAppearanceChange = () => {
      const savedTheme = localStorage.getItem('vaani_theme') || 'system';
      document.documentElement.setAttribute('data-theme', savedTheme);
      
      const savedLang = localStorage.getItem('vaani_language') || 'en';
      document.documentElement.setAttribute('data-lang', savedLang);
    };

    window.addEventListener('vaani_user_updated', handleUserUpdate);
    window.addEventListener('vaani_appearance_changed', handleAppearanceChange);

    return () => {
      if (socket && handleSocketNotification) {
        socket.off('notification', handleSocketNotification);
      }
      window.removeEventListener('vaani_user_updated', handleUserUpdate);
      window.removeEventListener('vaani_appearance_changed', handleAppearanceChange);
    };
  }, [pathname, router]);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await resources.readAllNotifications();
      if (res && res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    setDropdownOpen(false);
    try {
      if (!n.is_read) {
        const res = await resources.readNotification(n._id);
        if (res && res.success) {
          setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, is_read: true } : item));
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      if (n.complaint_id) {
        router.push(`/dashboard/complaints/${n.complaint_id}`);
      }
    } catch (err) {
      console.error('Error handleNotificationClick:', err);
    }
  };

  const isActive = (path) => {
    if (path === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(path);
  };

  const currentTime = new Date().toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const filteredNavItems = navItems.filter(item => {
    const allowedRoles = routePermissions[item.path] || [];
    return !user || allowedRoles.includes(user.role);
  });

  const getSubLabel = () => {
    if (!user) return 'Administrator';
    if (user.role === 'cm') return 'Chief Minister';
    if (['department_manager', 'nodal_officer', 'commissioner', 'officer'].includes(user.role) && user.department) {
      return `${user.department.code} ${roleLabel[user.role] || ''}`;
    }
    if (user.role === 'district_officer' && user.district) {
      return `DM ${user.district}`;
    }
    return roleLabel[user.role] || 'Administrator';
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-surface)', gap: 'var(--space-4)'
      }}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>🏛️</div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '1px' }}>
          VAANI SECURE ROUTING...
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="sidebar-emblem">🏛️</div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title" style={{ letterSpacing: '2px', fontSize: 'var(--text-base)' }}>VAANI</span>
              <span className="sidebar-brand-subtitle">शिकायत प्रबंधन प्रणाली</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu / मुख्य मेन्यू</div>
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => { router.push(item.path); setSidebarOpen(false); }}
              id={`nav-${item.id}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-text">
                <span>{item.label}</span>
                <span className="sidebar-link-text-hi">{item.labelHi}</span>
              </span>
              {item.badge && (
                <span className={`sidebar-badge ${item.badgeClass || ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-6)' }}>System / सिस्टम</div>
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => { router.push(item.path); setSidebarOpen(false); }}
              id={`nav-${item.id}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span className="sidebar-link-text">
                <span>{item.label}</span>
                <span className="sidebar-link-text-hi">{item.labelHi}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ 
            height: '3px', 
            background: 'linear-gradient(to right, #FF9933 33%, #FFFFFF 33% 66%, #138808 66%)',
            borderRadius: '2px', marginBottom: 'var(--space-3)'
          }} />
          Govt. of NCT of Delhi<br />
          <span style={{ fontFamily: 'var(--font-hindi)' }}>दिल्ली सरकार</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main">
        {/* Top Header Bar */}
        <header className="app-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            id="sidebar-toggle"
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'space-between', minWidth: 0, gap: 'var(--space-4)' }}>
            <div className="header-search-container" style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <form
                className="search-bar"
                style={{ display: 'flex' }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(`/dashboard/complaints?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
              >
                <span className="search-bar-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search... / खोजें..."
                  id="global-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-muted)', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                )}
              </form>
            </div>

            <div className="header-right-container" style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                display: 'none'
              }} className="header-time">
                {currentTime}
              </span>

              {/* Notification Bell Dropdown Component */}
              <div style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  id="btn-notifications"
                  aria-label="Notifications"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{ position: 'relative' }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'var(--priority-critical)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '15px',
                      height: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-surface)',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    width: '320px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      padding: 'var(--space-3) var(--space-4)',
                      background: 'var(--color-primary-surface)',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        Notifications ({unreadCount})
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: 'var(--space-6)',
                          textAlign: 'center',
                          color: 'var(--color-text-muted)',
                          fontSize: 'var(--text-sm)'
                        }}>
                          No notifications
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: 'var(--space-3) var(--space-4)',
                              borderBottom: '1px solid var(--color-border-light)',
                              cursor: 'pointer',
                              background: n.is_read ? 'transparent' : 'var(--color-primary-surface)',
                              opacity: n.is_read ? 0.7 : 1,
                              transition: 'background var(--transition-fast)',
                              display: 'flex',
                              gap: '10px',
                            }}
                          >
                            <div style={{ fontSize: '1.2rem' }}>
                              {n.event === 'defcon-alert' ? '🚨' : n.event === 'sla-breach' ? '⏱️' : '🔔'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-secondary)',
                                lineHeight: '1.4',
                                wordBreak: 'break-word',
                                textAlign: 'left'
                              }}>
                                {n.message}
                              </div>
                              <div style={{
                                fontSize: '9px',
                                color: 'var(--color-text-muted)',
                                marginTop: '4px',
                                textAlign: 'left'
                              }}>
                                {formatDate(n.sent_at)}
                              </div>
                            </div>
                            {!n.is_read && (
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--color-primary)',
                                alignSelf: 'center'
                              }} />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <div 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                    padding: 'var(--space-2) var(--space-4)',
                    background: 'var(--color-primary-surface)',
                    borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  id="profile-widget"
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 'var(--text-sm)', fontWeight: 700
                  }}>
                    {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CM'}
                  </div>
                  <div className="hide-mobile" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700 }}>{user?.name || 'CM Office'}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      {getSubLabel()}
                    </span>
                  </div>
                  <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '2px' }}>▼</span>
                </div>

                {profileDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    overflow: 'hidden',
                    padding: 'var(--space-3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)'
                  }}>
                    <div style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 600 }}>
                        {roleLabel[user?.role]}
                      </div>
                      {user?.department && (
                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '6px' }}>
                          🏢 {user.department.name} ({user.department.code})
                        </div>
                      )}
                      {user?.district && !user?.department && (
                        <div style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700, marginTop: '6px' }}>
                          📍 District: {user.district}
                        </div>
                      )}
                    </div>
                    <div style={{ height: '1px', background: 'var(--color-border-light)', margin: '4px 0' }} />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        border: 'none',
                        background: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--priority-critical)',
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background var(--transition-fast)'
                      }}
                      className="profile-dropdown-item"
                    >
                      🚪 Logout / लॉगआउट
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="app-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        @media (min-width: 769px) {
          .header-time {
            display: block !important;
          }
        }
        .profile-dropdown-item:hover {
          background-color: var(--color-primary-surface) !important;
        }
      `}</style>
    </div>
  );
}
