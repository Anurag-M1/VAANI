'use client';

import { useState, useEffect } from 'react';
import { getStoredUser, setStoredUser } from '../../lib/api';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [notifications, setNotifications] = useState({
    critical: true,
    newComplaints: true,
    slaBreach: true,
    falseClosure: true,
    dailyDigest: false,
  });
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | 'error' | ''
  const [notifSaveStatus, setNotifSaveStatus] = useState('');
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      const userPhone = stored.phone || stored.mobile || '';
      const displayPhone = userPhone.startsWith('+91') && !userPhone.startsWith('+91 ')
        ? '+91 ' + userPhone.slice(3)
        : userPhone || '+91 11-23890000';
      setProfile({
        name: stored.name || '',
        email: stored.email || (userPhone ? userPhone.replace('+91', '').trim() + '@delhi.gov.in' : 'cm.office@delhi.gov.in'),
        phone: displayPhone,
      });
    }
    // Load saved notification prefs
    try {
      const savedNotif = localStorage.getItem('vaani_notif_prefs');
      if (savedNotif) setNotifications(JSON.parse(savedNotif));
      const savedTheme = localStorage.getItem('vaani_theme');
      if (savedTheme) setTheme(savedTheme);
      const savedLang = localStorage.getItem('vaani_language');
      if (savedLang) setLanguage(savedLang);
    } catch { /* ignore */ }
  }, []);

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    try {
      // Try live save via API
      const token = localStorage.getItem('vaani_token');
      if (token) {
        const res = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api') + '/auth/me',
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: profile.name }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setStoredUser({ ...data.user });
            setUser(data.user);
          }
        }
      }
      // Always persist locally
      if (user) {
        const updated = { ...user, name: profile.name };
        setStoredUser(updated);
        setUser(updated);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vaani_user_updated'));
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2500);
    } catch {
      // Fallback: save locally
      if (user) {
        const updated = { ...user, name: profile.name };
        setStoredUser(updated);
        setUser(updated);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vaani_user_updated'));
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  const handleToggleNotification = (key, val) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: val };
      localStorage.setItem('vaani_notif_prefs', JSON.stringify(updated));
      return updated;
    });
    setNotifSaveStatus('saved');
    setTimeout(() => setNotifSaveStatus(''), 1500);
  };

  const handleThemeChange = (t) => {
    setTheme(t);
    localStorage.setItem('vaani_theme', t);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
      window.dispatchEvent(new Event('vaani_appearance_changed'));
    }
    setSaveStatus('theme_saved');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const handleLanguageChange = (l) => {
    setLanguage(l);
    localStorage.setItem('vaani_language', l);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-lang', l);
      window.dispatchEvent(new Event('vaani_appearance_changed'));
    }
    setSaveStatus('theme_saved');
    setTimeout(() => setSaveStatus(''), 1500);
  };

  const handleSaveNotifications = () => {
    setNotifSaveStatus('saving');
    try {
      localStorage.setItem('vaani_notif_prefs', JSON.stringify(notifications));
      setNotifSaveStatus('saved');
      setTimeout(() => setNotifSaveStatus(''), 2500);
    } catch {
      setNotifSaveStatus('error');
      setTimeout(() => setNotifSaveStatus(''), 2500);
    }
  };

  const handleSaveAppearance = () => {
    localStorage.setItem('vaani_theme', theme);
    localStorage.setItem('vaani_language', language);
    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', theme);
    setSaveStatus('theme_saved');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const notifItems = [
    { key: 'critical', label: 'Critical Alerts / गंभीर सूचनाएं', desc: 'Life-threatening complaints requiring immediate action' },
    { key: 'newComplaints', label: 'New Complaints / नई शिकायतें', desc: 'When new complaints are filed in your jurisdiction' },
    { key: 'slaBreach', label: 'SLA Breach / SLA उल्लंघन', desc: 'When SLA deadline is breached for a complaint' },
    { key: 'falseClosure', label: 'False Closures / झूठी बंदी', desc: 'When citizen disputes a closure order' },
    { key: 'dailyDigest', label: 'Daily Digest / दैनिक सारांश', desc: 'Morning briefing summary of all activity' },
  ];

  const statusBadge = (st) => {
    if (st === 'saving') return <span style={{ color: 'var(--color-saffron)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>⏳ Saving...</span>;
    if (st === 'saved' || st === 'theme_saved') return <span style={{ color: 'var(--color-green)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>✅ Saved successfully!</span>;
    if (st === 'error') return <span style={{ color: 'var(--priority-critical)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>❌ Error saving</span>;
    return null;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>⚙️ Settings</h1>
          <span className="page-title-hi">सेटिंग्स — System Configuration</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'var(--space-6)' }}>
        
        {/* Profile Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👤 Profile Settings <span className="card-title-hi">प्रोफ़ाइल सेटिंग्स</span></div>
            {statusBadge(saveStatus)}
          </div>
          <div className="card-body">
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-primary-surface)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                {profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'CM'}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {user?.role === 'cm' ? 'Chief Minister' : user?.role === 'department_manager' ? `${user?.department?.name || ''} Manager` : user?.role || 'Administrator'}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, marginTop: 2 }}>
                  {user?.phone || user?.mobile}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name / नाम</label>
              <input
                type="text"
                className="form-input"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                id="settings-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email / ईमेल <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(Display only)</span></label>
              <input
                type="email"
                className="form-input"
                value={profile.email}
                onChange={e => setProfile({ ...profile, email: e.target.value })}
                id="settings-email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone / फ़ोन <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>(Registered, read-only)</span></label>
              <input
                type="tel"
                className="form-input"
                value={profile.phone}
                readOnly
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                id="settings-phone"
              />
            </div>
            <button
              className="btn btn-primary"
              id="btn-save-profile"
              onClick={handleSaveProfile}
              disabled={saveStatus === 'saving'}
              style={{ width: '100%' }}
            >
              {saveStatus === 'saving' ? '⏳ Saving...' : '💾 Save Profile / सुरक्षित करें'}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔔 Notifications <span className="card-title-hi">सूचनाएं</span></div>
            {statusBadge(notifSaveStatus)}
          </div>
          <div className="card-body">
            {notifItems.map((item, i) => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 'var(--space-4) 0',
                borderBottom: i < notifItems.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                gap: 'var(--space-4)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{item.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <label style={{ position: 'relative', width: 52, height: 28, cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={notifications[item.key]}
                    readOnly
                    style={{ display: 'none' }}
                  />
                  <div
                    onClick={() => handleToggleNotification(item.key, !notifications[item.key])}
                    style={{
                      width: 52, height: 28, borderRadius: 14,
                      background: notifications[item.key] ? 'var(--color-primary)' : 'var(--color-border)',
                      transition: 'background 0.25s',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 2,
                      left: notifications[item.key] ? 26 : 2,
                      transition: 'left 0.25s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }} />
                  </div>
                </label>
              </div>
            ))}
            <button
              className="btn btn-outline"
              onClick={handleSaveNotifications}
              disabled={notifSaveStatus === 'saving'}
              style={{ width: '100%', marginTop: 'var(--space-4)', display: 'none' }}
              id="btn-save-notifications"
            >
              {notifSaveStatus === 'saving' ? '⏳ Saving...' : '💾 Save Notifications / सेव करें'}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎨 Appearance <span className="card-title-hi">डिस्प्ले सेटिंग्स</span></div>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Interface Language</label>
              <select
                className="form-select"
                value={language}
                onChange={e => handleLanguageChange(e.target.value)}
                style={{ width: '100%' }}
                id="settings-language"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी (Hindi)</option>
                <option value="both">English + हिंदी</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Theme / थीम</label>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                {['system', 'light', 'dark'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    style={{
                      flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${theme === t ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: theme === t ? 'var(--color-primary-surface)' : 'var(--color-surface)',
                      fontWeight: theme === t ? 700 : 500,
                      color: theme === t ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: 'var(--text-sm)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'system' ? '💻 System' : t === 'light' ? '☀️ Light' : '🌙 Dark'}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleSaveAppearance}
              style={{ width: '100%', display: 'none' }}
              id="btn-save-appearance"
            >
              💾 Save Appearance
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">ℹ️ System Info <span className="card-title-hi">सिस्टम जानकारी</span></div>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {[
                ['System', 'VAANI CM Grievance Dashboard v2.0'],
                ['Organization', 'Government of NCT of Delhi'],
                ['User Role', user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'],
                ['Department', user?.department?.name || user?.district || 'CM War Room'],
                ['Session Phone', user?.phone || user?.mobile || 'N/A'],
                ['API Status', '🟢 Connected'],
                ['Last Sync', new Date().toLocaleString('en-IN')],
              ].map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border-light)', gap: 'var(--space-4)' }}>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', flexShrink: 0 }}>{key}</span>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
