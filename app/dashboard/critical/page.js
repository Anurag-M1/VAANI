'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analytics } from '../../lib/api';

export default function CriticalAlertsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const [allAlerts, setAllAlerts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);


  useEffect(() => {
    async function loadAlerts() {
      try {
        setLoading(true);
        const [res, statsRes] = await Promise.all([
          analytics.defcon(),
          analytics.dashboard().catch(() => null)
        ]);
        if (res && res.alerts) {
          const getDefconLevel = (priority) => {
            if (!priority) return 'DEFCON_GREEN';
            const upper = priority.toUpperCase();
            if (upper === 'CRITICAL' || upper === 'DEFCON_RED') return 'DEFCON_RED';
            if (upper === 'HIGH' || upper === 'DEFCON_ORANGE') return 'DEFCON_ORANGE';
            if (upper === 'MEDIUM' || upper === 'DEFCON_YELLOW') return 'DEFCON_YELLOW';
            return 'DEFCON_GREEN';
          };
          const mapped = res.alerts.map(c => {
            const level = getDefconLevel(c.priority);
            return {
              id: c.complaint_id,
              description: c.complaint_text,
              categoryIcon: c.category === 'water' ? '🚰' : c.category === 'electricity' ? '⚡' : c.category === 'roads' ? '🛣️' : c.category === 'sanitation' ? '🧹' : c.category === 'sewage' ? '🕳️' : '📋',
              status: c.status,
              priority: level,
              defcon: level,
              triggerKeyword: level === 'DEFCON_RED' ? 'Life-threatening issue detected' : 'Infrastructure hazard detected',
              slaDeadline: c.sla_deadline,
              location: {
                area: c.location?.address?.split(',')[0] || 'Delhi',
                districtName: c.location?.district || 'Central'
              },
              assignedTo: c.assigned_officer_id?.name || 'Unassigned'
            };
          });
          setAllAlerts(mapped);
        }
        if (statsRes && !statsRes.error) {
          setTotalCount(statsRes.total || 0);
        } else {
          setTotalCount(res?.alerts?.length || 0);
        }
        setIsDemoMode(false);
      } catch (err) {
        console.error('Failed to load alerts:', err);
        setAllAlerts([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }
    loadAlerts();
  }, []);

  const filtered = filter === 'all' ? allAlerts : allAlerts.filter(a => a.defcon === filter);

  const counts = {
    DEFCON_RED: allAlerts.filter(a => a.defcon === 'DEFCON_RED').length,
    DEFCON_ORANGE: allAlerts.filter(a => a.defcon === 'DEFCON_ORANGE').length,
    DEFCON_YELLOW: allAlerts.filter(a => a.defcon === 'DEFCON_YELLOW').length,
  };

  const defconStyles = {
    DEFCON_RED: { bg: '#D50000', text: 'white', label: '🔴 DEFCON RED', desc: 'Life-Threatening / जीवन-खतरा' },
    DEFCON_ORANGE: { bg: '#E65100', text: 'white', label: '🟠 DEFCON ORANGE', desc: 'Infrastructure Hazard / बुनियादी खतरा' },
    DEFCON_YELLOW: { bg: '#F57F17', text: 'black', label: '🟡 DEFCON YELLOW', desc: 'SLA Breach / SLA उल्लंघन' },
    DEFCON_GREEN: { bg: '#2E7D32', text: 'white', label: '🟢 DEFCON GREEN', desc: 'Normal / सामान्य' },
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>🚨 DEFCON Alert Center</h1>
          <span className="page-title-hi">डेफकॉन अलर्ट केंद्र — तत्काल कार्रवाई आवश्यक</span>
        </div>
      </div>

      {/* DEFCON Level Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {Object.entries(counts).map(([level, count]) => {
          const style = defconStyles[level] || defconStyles.DEFCON_GREEN;
          return (
            <button
              key={level}
              className="stat-card"
              style={{ 
                '--stat-accent': style.bg,
                border: filter === level ? `3px solid ${style.bg}` : undefined,
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setFilter(filter === level ? 'all' : level)}
            >
              <div className="stat-card-value" style={{ color: style.bg }}>
                {count}
              </div>
              <div className="stat-card-label">{style.label}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{style.desc}</div>
            </button>
          );
        })}
        <div className="stat-card" style={{ '--stat-accent': 'var(--color-green)' }}>
          <div className="stat-card-value" style={{ color: 'var(--color-green)' }}>
            {Math.max(0, totalCount - allAlerts.length)}
          </div>
          <div className="stat-card-label">🟢 DEFCON GREEN</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>Normal / सामान्य</div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            ⚠️ Active Alerts ({filtered.length})
            <span className="card-title-hi">सक्रिय अलर्ट</span>
          </div>
          {filter !== 'all' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilter('all')}>
              Show All
            </button>
          )}
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">No Active Alerts</div>
              <div className="empty-state-text">All clear! No critical situations detected.</div>
            </div>
          ) : (
            filtered.map((alert, i) => {
              const style = defconStyles[alert.defcon] || defconStyles.DEFCON_GREEN;
              const slaLeft = Math.ceil((new Date(alert.slaDeadline) - new Date()) / 3600000);
              return (
                <div
                  key={alert.id}
                  style={{
                    padding: 'var(--space-5)',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                    borderLeft: `5px solid ${style.bg}`,
                    cursor: 'pointer',
                    background: alert.defcon === 'DEFCON_RED' ? '#FFF5F5' : undefined,
                    transition: 'background var(--transition-fast)',
                  }}
                  onClick={() => router.push(`/dashboard/complaints/${alert.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{
                      background: style.bg, color: style.text,
                      padding: '3px 12px', borderRadius: 'var(--radius-full)',
                      fontWeight: 800, fontSize: 'var(--text-xs)',
                      animation: alert.defcon === 'DEFCON_RED' ? 'pulse-badge 2s ease-in-out infinite' : 'none',
                    }}>
                      {style.label}
                    </span>
                    <span style={{ fontSize: '1.3rem' }}>{alert.categoryIcon}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                      {alert.id}
                    </span>
                    <span className={`badge badge-${alert.status}`} style={{ marginLeft: 'auto' }}>
                      {alert.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                    {alert.description}
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    <span>📍 {alert.location?.area}, {alert.location?.districtName?.split('/')[0]?.trim()}</span>
                    <span>🏷️ Trigger: {alert.triggerKeyword}</span>
                    <span style={{
                      fontWeight: 700,
                      color: slaLeft < 0 ? 'var(--priority-critical)' : slaLeft < 4 ? 'var(--priority-high)' : 'var(--color-text-muted)',
                    }}>
                      ⏱️ {slaLeft < 0 ? `${Math.abs(slaLeft)}h OVERDUE` : `${slaLeft}h remaining`}
                    </span>
                    <span>👷 {alert.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
