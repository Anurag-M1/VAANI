'use client';

import { useState, useEffect } from 'react';
import { analytics } from '../../lib/api';


export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('districts'); // 'districts' | 'officers'
  const [districtsList, setDistrictsList] = useState([]);
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        if (activeTab === 'districts') {
          const res = await analytics.leaderboard();
          if (res && res.leaderboard) {
            setDistrictsList(res.leaderboard);
            setIsDemoMode(false);
          } else {
            throw new Error('API failed or returned invalid data');
          }
        } else {
          const res = await analytics.officerLeaderboard();
          if (res && res.officers) {
            setOfficersList(res.officers);
            setIsDemoMode(false);
          } else {
            throw new Error('API failed or returned invalid data');
          }
        }
      } catch (err) {
        console.error('Failed to load leaderboard data:', err);
        if (activeTab === 'districts') {
          setDistrictsList([]);
        } else {
          setOfficersList([]);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab]);

  // Podium component for top 3
  const renderPodium = (items, type) => {
    const top3 = items.slice(0, 3);
    if (top3.length < 3) return null;

    const medals = ['🥇', '🥈', '🥉'];
    const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze visual order
    const heights = ['140px', '180px', '120px'];
    const colors = ['#C0C0C0', '#FFD700', '#CD7F32'];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 'var(--space-4)', marginBottom: 'var(--space-8)', padding: 'var(--space-6) 0' }}>
        {podiumOrder.map((idx, pos) => {
          const item = top3[idx];
          const name = type === 'districts' ? item.district : item.name;
          const score = type === 'districts' ? `${item.score || item.resolution_rate} pts` : `${item.officer_profile?.scorecard?.credibility_score || 0}/100`;
          const sub = type === 'districts' ? item.dm_name : (item.department?.name || 'Department');
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, maxWidth: 200 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{medals[idx]}</div>
              <div style={{ fontWeight: 800, fontSize: 'var(--text-base)', textAlign: 'center', marginBottom: 2 }}>{name}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginBottom: 'var(--space-3)' }}>{sub}</div>
              <div style={{
                width: '100%',
                height: heights[pos],
                background: `linear-gradient(180deg, ${colors[pos]}40 0%, ${colors[pos]}20 100%)`,
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `2px solid ${colors[pos]}60`,
                borderBottom: 'none',
              }}>
                <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 900, color: 'var(--color-text-primary)' }}>{score}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>🏆 Accountability Leaderboard</h1>
          <span className="page-title-hi">जवाबदेही लीडरबोर्ड — प्रदर्शन रैंकिंग</span>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className={`btn ${activeTab === 'districts' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('districts')}
          >
            📍 Districts / जिला
          </button>
          <button
            className={`btn ${activeTab === 'officers' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('officers')}
          >
            👷 Officers / अधिकारी
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">ℹ️</span>
          Demo mode active: Displaying simulated offline data.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🏆</div>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading leaderboard data...</div>
        </div>
      ) : activeTab === 'districts' ? (
        <>
          {/* Podium */}
          {districtsList.length >= 3 && renderPodium(districtsList, 'districts')}

          {/* Full Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                📍 Delhi Districts Performance Rankings
                <span className="card-title-hi">दिल्ली जिला प्रदर्शन सूचकांक</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 70, textAlign: 'center' }}>Rank</th>
                    <th style={{ minWidth: 160 }}>District / जिला</th>
                    <th style={{ minWidth: 150 }}>DM Nodal Officer</th>
                    <th style={{ textAlign: 'center', minWidth: 150 }}>Governance Score</th>
                    <th style={{ textAlign: 'center', minWidth: 140 }}>Resolution Rate</th>
                    <th style={{ textAlign: 'center', minWidth: 90 }}>Total</th>
                    <th style={{ textAlign: 'center', minWidth: 90 }}>Resolved</th>
                    <th style={{ textAlign: 'center', minWidth: 90 }}>Pending</th>
                    <th style={{ textAlign: 'center', minWidth: 120 }}>False Closure %</th>
                  </tr>
                </thead>
                <tbody>
                  {districtsList.map((dist, index) => {
                    const rank = index + 1;
                    const rateColor = dist.resolution_rate >= 80 ? 'var(--color-green)' : dist.resolution_rate >= 60 ? 'var(--color-saffron)' : 'var(--priority-critical)';
                    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                    return (
                      <tr key={dist.code} style={{ background: rank <= 3 ? 'var(--color-surface-hover)' : 'none' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 'var(--text-lg)' }}>{rankIcon}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 2 }}>{dist.district}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{dist.code}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{dist.dm_name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>District Magistrate</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: 'var(--text-xl)', marginBottom: 4 }}>{dist.score || dist.resolution_rate} / 100</div>
                          <div className="progress-bar" style={{ height: 8, width: 100, margin: '0 auto' }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${dist.score || dist.resolution_rate}%`,
                                background: 'var(--color-primary)'
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: rateColor, fontSize: 'var(--text-base)' }}>
                          {dist.resolution_rate}%
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 'var(--text-base)' }}>{dist.total}</td>
                        <td style={{ textAlign: 'center', color: 'var(--color-green)', fontWeight: 700, fontSize: 'var(--text-base)' }}>{dist.resolved}</td>
                        <td style={{ textAlign: 'center', color: 'var(--color-saffron)', fontWeight: 700, fontSize: 'var(--text-base)' }}>{dist.pending}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            color: dist.false_closure_rate > 5 ? 'var(--priority-critical)' : 'var(--color-text-muted)',
                            fontWeight: 700,
                            fontSize: 'var(--text-base)',
                          }}>
                            {dist.false_closure_rate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Podium */}
          {officersList.length >= 3 && renderPodium(officersList, 'officers')}

          {/* Full Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                👷 Officer Credibility & Output Rankings
                <span className="card-title-hi">अधिकारी विश्वसनीयता स्कोर</span>
              </div>
            </div>
            <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 70, textAlign: 'center' }}>Rank</th>
                    <th style={{ minWidth: 180 }}>Officer Name / पद</th>
                    <th style={{ minWidth: 160 }}>Department / Area</th>
                    <th style={{ textAlign: 'center', minWidth: 150 }}>Credibility Score</th>
                    <th style={{ textAlign: 'center', minWidth: 90 }}>Assigned</th>
                    <th style={{ textAlign: 'center', minWidth: 90 }}>Resolved</th>
                    <th style={{ textAlign: 'center', minWidth: 140 }}>Avg Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {officersList.map((officer, index) => {
                    const rank = index + 1;
                    const profile = officer.officer_profile || {};
                    const scorecard = profile.scorecard || {};
                    const credibility = scorecard.credibility_score || 100;
                    const credColor = credibility >= 85 ? 'var(--color-green)' : credibility >= 70 ? 'var(--color-saffron)' : 'var(--priority-critical)';
                    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
                    return (
                      <tr key={officer._id} style={{ background: rank <= 3 ? 'var(--color-surface-hover)' : 'none' }}>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 'var(--text-lg)' }}>{rankIcon}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 2 }}>{officer.name}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{profile.designation || 'Field Officer'}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{officer.department?.name || 'Department'}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>📍 {officer.district}</div>
                        </td>
                        <td style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                          <div style={{ fontWeight: 800, color: credColor, fontSize: 'var(--text-xl)', marginBottom: 4 }}>{credibility} / 100</div>
                          <div className="progress-bar" style={{ height: 8, width: 100, margin: '0 auto' }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${credibility}%`,
                                background: credColor
                              }}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, fontSize: 'var(--text-base)' }}>{scorecard.total_assigned || 0}</td>
                        <td style={{ textAlign: 'center', color: 'var(--color-green)', fontWeight: 700, fontSize: 'var(--text-base)' }}>{scorecard.total_resolved || 0}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {scorecard.avg_resolution_time_hours ? `${Math.round(scorecard.avg_resolution_time_hours / 24)} days` : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
