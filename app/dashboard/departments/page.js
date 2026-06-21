'use client';

import { useState, useEffect } from 'react';
import { getStoredUser, analytics } from '../../lib/api';

export default function DepartmentsPage() {
  const [deptData, setDeptData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadDepts() {
      try {
        setLoading(true);
        const stored = getStoredUser();
        setUser(stored);

        const res = await analytics.detailed();
        if (res && res.departmentWise) {
          let mapped = res.departmentWise.map(d => ({
            id: d.shortName,
            name: d.name,
            nameHi: d.name, // Will display department name in Hindi if backend supports, otherwise English name
            complaints: d.complaints,
            resolved: d.resolved,
            color: d.color,
            slaCompliance: d.slaCompliance,
            avgResolutionDays: Math.round(d.avgResolutionDays),
            satisfaction: d.satisfaction
          }));

          // Filter to only the user's dept if dept_manager role
          if (stored && ['department_manager', 'nodal_officer', 'commissioner'].includes(stored.role) && stored.department) {
            mapped = mapped.filter(d => d.id.toLowerCase() === stored.department.code.toLowerCase());
          }

          setDeptData(mapped);
          setIsDemoMode(false);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to load department analytics:', err);
        setDeptData([]);
      } finally {
        setLoading(false);
      }
    }
    loadDepts();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>🏢 Departments</h1>
          <span className="page-title-hi">विभाग — {deptData.length} विभाग</span>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">ℹ️</span>
          Showing offline demo data — backend connection unavailable.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏢</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading departments data...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: 'var(--space-6)' }}>
          {deptData.sort((a, b) => b.complaints - a.complaints).map((dept) => {
            const resRate = dept.complaints > 0 ? Math.round((dept.resolved / dept.complaints) * 100) : 0;
            return (
              <div key={dept.id} className="card" style={{ borderTop: `4px solid ${dept.color}` }}>
                <div className="card-header">
                  <div className="card-title">
                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: dept.color, display: 'inline-block', flexShrink: 0 }} />
                    <span>{dept.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-muted)', background: 'var(--color-surface-hover)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{dept.id}</span>
                </div>
                <div className="card-body">
                  <div style={{ fontFamily: 'var(--font-hindi)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    {dept.nameHi}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{dept.complaints.toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total / कुल</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-green-surface)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-green)' }}>{dept.resolved.toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Resolved / हल</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: '#FFF3E0', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-saffron)' }}>{(dept.complaints - dept.resolved).toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Pending / लंबित</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>Resolution Rate</span>
                      <span style={{ fontWeight: 700, color: resRate >= 70 ? 'var(--color-green)' : resRate >= 50 ? 'var(--color-saffron)' : 'var(--priority-critical)' }}>
                        {resRate}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: 10 }}>
                      <div className={`progress-bar-fill ${resRate >= 70 ? 'green' : resRate >= 50 ? 'saffron' : 'red'}`} style={{ width: `${resRate}%` }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                      <span>SLA Compliance</span>
                      <span style={{ fontWeight: 700, color: dept.slaCompliance >= 80 ? 'var(--color-green)' : 'var(--color-saffron)' }}>{dept.slaCompliance}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>Avg Resolution</span>
                      <span style={{ fontWeight: 700 }}>{dept.avgResolutionDays} days</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                      <span>Citizen Satisfaction</span>
                      <span style={{ fontWeight: 700 }}>{dept.satisfaction}%</span>
                    </div>
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
