'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { complaints as complaintsApi, resources, getStoredUser, clearToken } from '../lib/api';
import { connectSocket } from '../lib/socket';

const defconColors = {
  DEFCON_RED: { bg: '#D50000', label: '🔴 RED', text: 'white' },
  DEFCON_ORANGE: { bg: '#E65100', label: '🟠 ORANGE', text: 'white' },
  DEFCON_YELLOW: { bg: '#F57F17', label: '🟡 YELLOW', text: 'black' },
  DEFCON_GREEN: { bg: '#2E7D32', label: '🟢 GREEN', text: 'white' },
};

const categoryIcons = {
  water: '💧', sewage: '💩', roads: '🛣️', sanitation: '🗑️',
  electricity: '🔌', encroachment: '🚧', pollution: '🏭', transport: '🚌',
  gas_leak: '💨', building_collapse: '🏢', open_manhole: '🕳️', fire_hazard: '🔥'
};

export default function OfficerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [scorecardData, setScorecardData] = useState(null);
  const [tab, setTab] = useState('queue');
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const res = await complaintsApi.officerQueue();
      if (res && res.complaints) {
        const mapped = res.complaints.map(c => {
          const slaHoursLeft = c.sla_deadline ? Math.ceil((new Date(c.sla_deadline) - new Date()) / 3600000) : 72;
          return {
            id: c.complaint_id,
            _id: c._id,
            description: c.complaint_text,
            category: c.category,
            categoryIcon: categoryIcons[c.category] || '📋',
            status: c.status?.toLowerCase(),
            priority: c.priority || 'DEFCON_GREEN',
            slaHoursLeft,
            location: {
              area: c.location?.address?.split(',')[0] || 'Delhi',
              district: c.location?.district || 'Central'
            }
          };
        });
        setQueue(mapped);
      }
    } catch (err) {
      console.warn('Queue loading error:', err);
    }
  };

  const loadScorecard = async (userId) => {
    try {
      const res = await resources.officerScorecard(userId);
      if (res && res.officer) {
        setScorecardData(res.officer.officer_profile?.scorecard);
      }
    } catch (err) {
      console.warn('Failed to load scorecard:', err);
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (!stored || stored.role !== 'officer') {
      router.push('/');
      return;
    }
    setUser(stored);

    const initData = async () => {
      setLoading(true);
      await Promise.all([
        loadQueue(),
        loadScorecard(stored.id || stored._id)
      ]);
      setLoading(false);
    };
    initData();

    // Connect socket
    const socket = connectSocket(stored.id || stored._id, stored.role, stored.district);
    if (socket) {
      const handleUpdate = () => {
        loadQueue();
        loadScorecard(stored.id || stored._id);
      };
      socket.on('complaint-updated', handleUpdate);
      socket.on('new-complaint', handleUpdate);
      socket.on('notification', handleUpdate);

      return () => {
        socket.off('complaint-updated', handleUpdate);
        socket.off('new-complaint', handleUpdate);
        socket.off('notification', handleUpdate);
      };
    }
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  const scorecard = {
    todayResolved: scorecardData?.total_resolved || 0,
    todayPending: queue.length,
    todayOverdue: queue.filter(c => c.slaHoursLeft < 0).length,
    monthResolved: scorecardData?.total_resolved || 0,
    teamAvg: 38,
    credibility: scorecardData?.credibility_score || 100,
    onTimeRate: Math.round(scorecardData?.on_time_rate || 78),
    satisfaction: (scorecardData?.citizen_satisfaction_avg || 4.2).toFixed(1),
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg)', gap: 'var(--space-4)'
      }}>
        <div style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>👷</div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '1px' }}>
          LOADING VAANI OFFICER QUEUE...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: 'var(--space-6)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div className="page-title">
          <h1>👷 Officer Dashboard</h1>
          <span className="page-title-hi">अधिकारी डैशबोर्ड — {user?.name} ({user?.department?.code || 'Field'})</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', height: 'fit-content' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => router.push('/dashboard/settings')}
            id="btn-settings"
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            ⚙️ Settings / सेटिंग्स
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleLogout}
            id="btn-logout"
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            🚪 Logout / लॉगआउट
          </button>
        </div>
      </div>

      {/* Scorecard Banner */}
      <div className="card" style={{ 
        marginBottom: 'var(--space-6)', 
        borderLeft: `4px solid ${scorecard.credibility >= 80 ? 'var(--color-green)' : scorecard.credibility >= 60 ? 'var(--color-saffron)' : 'var(--priority-critical)'}` 
      }}>
        <div className="card-body" style={{ padding: 'var(--space-4) var(--space-6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-4)', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-green)' }}>{scorecard.todayResolved}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Resolved Cases</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-saffron)' }}>{queue.length}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Active Queue</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--priority-critical)' }}>{scorecard.todayOverdue}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Overdue Cases</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>{scorecard.monthResolved}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Resolved</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: scorecard.credibility >= 80 ? 'var(--color-green)' : 'var(--color-saffron)' }}>
                {scorecard.credibility}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Credibility Score</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>⭐ {scorecard.satisfaction}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Citizen Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {[
          { id: 'queue', label: `📋 My Queue (${queue.length})`, labelHi: 'मेरी कतार' },
          { id: 'scorecard', label: '📊 Scorecard', labelHi: 'स्कोरकार्ड' },
        ].map(t => (
          <button
            key={t.id}
            className={`btn ${tab === t.id ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {queue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">Queue Empty!</div>
              <div className="empty-state-text">All complaints resolved. Great work!</div>
            </div>
          ) : (
            queue.map(c => {
              const defcon = defconColors[c.priority] || defconColors.DEFCON_GREEN;
              const isOverdue = c.slaHoursLeft < 0;
              return (
                <div
                  key={c.id}
                  className="card"
                  style={{ 
                    borderLeft: `5px solid ${defcon.bg}`,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() => router.push(`/dashboard/complaints/${c._id}`)}
                >
                  <div className="card-body" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                      {/* DEFCON Badge */}
                      <span style={{
                        background: defcon.bg, color: defcon.text,
                        padding: '4px 12px', borderRadius: 'var(--radius-full)',
                        fontWeight: 800, fontSize: 'var(--text-xs)', whiteSpace: 'nowrap',
                        animation: c.priority === 'DEFCON_RED' ? 'pulse-badge 2s ease-in-out infinite' : 'none',
                      }}>
                        {defcon.label}
                      </span>

                      {/* Icon + Category */}
                      <span style={{ fontSize: '1.5rem' }}>{c.categoryIcon}</span>

                      {/* ID */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                        {c.id}
                      </span>

                      {/* SLA */}
                      <span style={{
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                        color: isOverdue ? 'var(--priority-critical)' : c.slaHoursLeft < 12 ? 'var(--priority-high)' : 'var(--color-green)',
                        marginLeft: 'auto',
                      }}>
                        {isOverdue ? `⚠️ ${Math.abs(c.slaHoursLeft)}h OVERDUE` : `⏱️ ${c.slaHoursLeft}h left`}
                      </span>
                    </div>
                    <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }} className="truncate">
                      {c.description}
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      <span>📍 {c.location?.area}</span>
                      <span>• {c.location?.district}</span>
                      <span style={{ textTransform: 'capitalize' }}>• Status: {c.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Scorecard Tab */}
      {tab === 'scorecard' && (
        <div className="grid-2">
          {/* Credibility Gauge */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🎯 Credibility Score <span className="card-title-hi">विश्वसनीयता स्कोर</span></div>
            </div>
            <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{
                width: 160, height: 160, borderRadius: '50%',
                background: `conic-gradient(${scorecard.credibility >= 80 ? 'var(--color-green)' : scorecard.credibility >= 60 ? 'var(--color-saffron)' : 'var(--priority-critical)'} ${scorecard.credibility * 3.6}deg, var(--color-border-light) 0)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
              }}>
                <div style={{
                  width: 120, height: 120, borderRadius: '50%',
                  background: 'var(--color-surface)', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 900 }}>{scorecard.credibility}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>out of 100</div>
                </div>
              </div>
              <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                {scorecard.credibility >= 80 ? '✅ Excellent — Keep it up!' : scorecard.credibility >= 60 ? '⚠️ Needs improvement' : '🚨 Low credibility — Review required'}
              </p>
            </div>
          </div>

          {/* Monthly Performance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 Performance Stats <span className="card-title-hi">प्रदर्शन आंकड़े</span></div>
            </div>
            <div className="card-body">
              {[
                { label: 'Resolved complaints', value: scorecard.monthResolved, color: 'var(--color-green)' },
                { label: 'Team average', value: scorecard.teamAvg, color: 'var(--color-primary)' },
                { label: 'On-time rate', value: `${scorecard.onTimeRate}%`, color: scorecard.onTimeRate >= 70 ? 'var(--color-green)' : 'var(--color-saffron)' },
                { label: 'Citizen satisfaction', value: `⭐ ${scorecard.satisfaction}/5`, color: 'var(--color-saffron)' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) 0', borderBottom: i < 3 ? '1px solid var(--color-border-light)' : 'none' }}>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{s.label}</span>
                  <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
