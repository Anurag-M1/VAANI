'use client';

import { useState, useEffect } from 'react';
import { resources } from '../../lib/api';


export default function OfficersPage() {
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadOfficers() {
      try {
        setLoading(true);
        const res = await resources.officers();
        if (res && res.officers) {
          // Map backend schema to UI scorecard schema
          const mapped = res.officers.map(o => {
            const card = o.officer_profile?.scorecard || {};
            return {
              id: o._id,
              name: o.name,
              nameHi: o.name,
              designation: o.officer_profile?.designation || 'Field Officer',
              department: o.department?.name || 'MCD',
              activeComplaints: o.officer_profile?.active_complaints_count || 0,
              resolvedThisMonth: card.total_resolved || 0,
              avgResolutionDays: card.avg_resolution_time_hours ? Math.round(card.avg_resolution_time_hours / 24) : 2,
              performance: card.credibility_score || 95,
              bandwidth: o.officer_profile?.active_complaints_count > 15 ? 'overloaded' : o.officer_profile?.active_complaints_count > 10 ? 'high' : 'low',
              district: o.district,
              phone: o.mobile,
              status: o.officer_profile?.is_available ? 'active' : 'on_leave'
            };
          });
          setOfficersList(mapped);
          setIsDemoMode(false);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to load officers:', err);
        setOfficersList([]);
      } finally {
        setLoading(false);
      }
    }
    loadOfficers();
  }, []);
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>👤 Officers Directory</h1>
          <span className="page-title-hi">अधिकारी निर्देशिका — {officersList.length} अधिकारी</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" id="btn-add-officer">➕ Add Officer / अधिकारी जोड़ें</button>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">ℹ️</span>
          Demo mode active: Displaying simulated officers list.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading officers...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 'var(--space-6)' }}>
          {officersList.map((officer) => {
          const bandwidthColor = {
            low: 'var(--color-green)', moderate: 'var(--color-saffron)', 
            high: 'var(--priority-high)', overloaded: 'var(--priority-critical)', 
            unavailable: 'var(--color-text-muted)'
          };
          const bandwidthLabel = {
            low: '🟢 Low Load', moderate: '🟡 Moderate', 
            high: '🟠 High Load', overloaded: '🔴 Overloaded', 
            unavailable: '⚫ Unavailable'
          };

          return (
            <div key={officer.id} className="card" style={{ opacity: officer.status === 'on_leave' ? 0.6 : 1 }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: officer.status === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 'var(--text-xl)', fontWeight: 700, flexShrink: 0,
                  }}>
                    {officer.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{officer.name}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-hindi)' }}>{officer.nameHi}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      {officer.designation} • {officer.department}
                    </div>
                  </div>
                  {officer.status === 'on_leave' && (
                    <span className="badge badge-closed badge-lg">On Leave</span>
                  )}
                </div>

                <div style={{ 
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)',
                  padding: 'var(--space-4)', background: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Active / सक्रिय</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-saffron)' }}>{officer.activeComplaints}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Resolved / हल</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-green)' }}>{officer.resolvedThisMonth}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Avg Days / औसत दिन</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{officer.avgResolutionDays}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600 }}>Performance / प्रदर्शन</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: officer.performance >= 80 ? 'var(--color-green)' : officer.performance >= 60 ? 'var(--color-saffron)' : 'var(--priority-critical)' }}>
                      {officer.performance}%
                    </div>
                  </div>
                </div>

                {/* Bandwidth indicator */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                    Bandwidth: {bandwidthLabel[officer.bandwidth]}
                  </span>
                </div>
                <div className="progress-bar" style={{ height: 8, marginBottom: 'var(--space-4)' }}>
                  <div className="progress-bar-fill" style={{
                    width: `${officer.performance}%`,
                    background: officer.performance >= 80 ? 'var(--color-green)' : officer.performance >= 60 ? 'var(--color-saffron)' : 'var(--priority-critical)',
                  }} />
                </div>

                {/* Contact */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>📍 {officer.district}</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                  <span>📞 {officer.phone}</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                  <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>📞 Call</button>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>📋 Assign</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
