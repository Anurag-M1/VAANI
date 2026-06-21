'use client';

import { useState, useEffect } from 'react';
import { COMPLAINT_CATEGORIES } from '@/data/complaints';
import { analytics } from '../../lib/api';

function HorizontalBarChart({ data = [], maxValue = 1 }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No data available / कोई डेटा उपलब्ध नहीं है</div>;
  }
  const safeMax = maxValue || 1;
  return (
    <div className="chart-bar-group">
      {data.map((item, i) => (
        <div className="chart-bar-item" key={i}>
          <span className="chart-bar-label">{item.label}</span>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${((item.value || 0) / safeMax) * 100}%`, background: item.color || 'var(--color-primary)' }}>
              {((item.value || 0) / safeMax) * 100 > 15 ? item.value : ''}
            </div>
          </div>
          <span className="chart-bar-value">{(item.value || 0).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await analytics.detailed();
        if (res && !res.error) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load detailed analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading analytics data...</div>
      </div>
    );
  }

  const stats = data;

  // Department performance
  const deptPerformance = (stats.departmentWise || [])
    .sort((a, b) => (b.slaCompliance || 0) - (a.slaCompliance || 0))
    .map(d => ({
      label: d.shortName || 'Unknown',
      value: d.slaCompliance || 0,
      color: (d.slaCompliance || 0) >= 70 ? 'var(--color-green)' : (d.slaCompliance || 0) >= 50 ? 'var(--color-saffron)' : 'var(--priority-critical)',
    }));

  // Monthly trend
  const monthlyData = stats.monthlyTrend || [];
  const maxMonthly = Math.max(...monthlyData.map(d => d.complaints || 0), 1);

  // Status distribution
  const statusDist = stats.statusDist || {};
  const totalComplaints = stats.totalComplaints || 0;
  const totalForPercentage = totalComplaints || 1;

  // Category distribution
  const catData = Object.entries(stats.catDist || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cat, count]) => {
      const catInfo = COMPLAINT_CATEGORIES.find(cc => cc.id === cat);
      return { label: catInfo ? catInfo.icon + ' ' + catInfo.label.split('/')[0].trim() : cat, value: count };
    });
  const maxCat = Math.max(...catData.map(d => d.value || 0), 1);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>📈 Analytics & Insights</h1>
          <span className="page-title-hi">विश्लेषण और अंतर्दृष्टि</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" id="btn-export-csv">📊 Export CSV</button>
          <button className="btn btn-primary btn-sm" id="btn-download-pdf">📄 Download PDF</button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card" style={{ '--stat-accent': 'var(--color-primary)' }}>
          <div className="stat-card-value">{(stats.totalComplaints || 0).toLocaleString('en-IN')}</div>
          <div className="stat-card-label">Total Complaints / कुल शिकायतें</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--color-green)' }}>
          <div className="stat-card-value">{stats.slaCompliance || 0}%</div>
          <div className="stat-card-label">SLA Compliance / SLA अनुपालन</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': 'var(--color-saffron)' }}>
          <div className="stat-card-value">{stats.avgResolutionDays || 0}</div>
          <div className="stat-card-label">Avg Resolution Days / औसत दिन</div>
        </div>
        <div className="stat-card" style={{ '--stat-accent': '#D50000' }}>
          <div className="stat-card-value">{stats.falseClosure || 0}%</div>
          <div className="stat-card-label">False Closure Rate / झूठी बंदी दर</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Status Distribution <span className="card-title-hi">स्थिति वितरण</span></div>
          </div>
          <div className="card-body">

            {Object.entries(statusDist).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-3)' }}>
                <span className={`badge badge-${status}`} style={{ minWidth: 120, justifyContent: 'center' }}>
                  {status.replace(/_/g, ' ')}
                </span>
                <div className="progress-bar" style={{ flex: 1, height: 20, borderRadius: 4 }}>
                  <div className="progress-bar-fill" style={{
                    width: `${(count / totalForPercentage) * 100}%`,
                    borderRadius: 4,
                    background: `var(--status-${status.replace(/_/g, '-')}, var(--color-primary))`,
                  }} />
                </div>
                <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{count}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', minWidth: 40 }}>
                  {Math.round((count / totalForPercentage) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Monthly Trend <span className="card-title-hi">मासिक रुझान</span></div>
          </div>
          <div className="card-body">
            {monthlyData.map((m, i) => (
              <div key={i} style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600 }}>{m.month} 2026</span>
                  <span>{(m.complaints || 0).toLocaleString('en-IN')} total / {(m.resolved || 0).toLocaleString('en-IN')} resolved</span>
                </div>
                <div style={{ position: 'relative', height: 24 }}>
                  <div className="progress-bar" style={{ height: 24, position: 'absolute', width: '100%' }}>
                    <div className="progress-bar-fill" style={{
                      width: `${((m.complaints || 0) / maxMonthly) * 100}%`,
                      background: 'var(--color-primary-lighter)',
                      opacity: 0.3,
                      height: '100%',
                    }} />
                  </div>
                  <div className="progress-bar" style={{ height: 24, position: 'absolute', width: '100%', background: 'transparent' }}>
                    <div className="progress-bar-fill green" style={{
                      width: `${((m.resolved || 0) / maxMonthly) * 100}%`,
                      height: '100%',
                    }} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', fontSize: 'var(--text-xs)', marginTop: 'var(--space-4)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: 'var(--color-primary-lighter)', opacity: 0.3, borderRadius: 2, display: 'inline-block' }} />
                Received
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 12, height: 12, background: 'var(--color-green)', borderRadius: 2, display: 'inline-block' }} />
                Resolved
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Department SLA */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏢 Department SLA Compliance <span className="card-title-hi">विभाग SLA</span></div>
          </div>
          <div className="card-body">
            <HorizontalBarChart data={deptPerformance} maxValue={100} />
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏷️ Category Breakdown <span className="card-title-hi">श्रेणी विश्लेषण</span></div>
          </div>
          <div className="card-body">
            <HorizontalBarChart data={catData} maxValue={maxCat} />
          </div>
        </div>
      </div>

      {/* Department Detailed Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📊 Department Performance Table <span className="card-title-hi">विभाग प्रदर्शन तालिका</span></div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department / विभाग</th>
                  <th>Total</th>
                  <th>Resolved</th>
                  <th>Resolution %</th>
                  <th>Avg Days</th>
                  <th>SLA %</th>
                  <th>Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {(stats.departmentWise || []).sort((a, b) => (b.complaints || 0) - (a.complaints || 0)).map((d, i) => {
                  const resRate = d.complaints ? Math.round(((d.resolved || 0) / d.complaints) * 100) : 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>
                        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: d.color || '#95a5a6', marginRight: 8 }} />
                        {d.shortName || 'Unknown'}
                      </td>
                      <td>{(d.complaints || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-green)' }}>{(d.resolved || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60, height: 8 }}>
                            <div className={`progress-bar-fill ${resRate >= 70 ? 'green' : resRate >= 50 ? 'saffron' : 'red'}`} style={{ width: `${resRate}%` }} />
                          </div>
                          {resRate}%
                        </div>
                      </td>
                      <td>{d.avgResolutionDays || 0}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: (d.slaCompliance || 0) >= 70 ? 'var(--color-green)' : (d.slaCompliance || 0) >= 50 ? 'var(--color-saffron)' : 'var(--priority-critical)' }}>
                          {d.slaCompliance || 0}%
                        </span>
                      </td>
                      <td>{d.satisfaction || 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
