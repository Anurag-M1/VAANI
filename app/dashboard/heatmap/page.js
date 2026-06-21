'use client';

import { useState, useEffect } from 'react';
import { DELHI_DISTRICTS } from '@/data/complaints';
import { useRouter } from 'next/navigation';
import { resources, complaints as complaintsApi, analytics } from '../../lib/api';

const mapApiComplaintToMock = (c) => ({
  id: c.complaint_id,
  description: c.complaint_text,
  category: c.category,
  categoryIcon: c.category === 'water' ? '🚰' : c.category === 'electricity' ? '⚡' : c.category === 'roads' ? '🛣️' : c.category === 'sanitation' ? '🧹' : c.category === 'sewage' ? '🕳️' : '📋',
  status: c.status?.toLowerCase(),
  priority: c.priority?.toLowerCase()?.replace('defcon_', ''),
  createdAt: c.createdAt,
  assignedTo: c.assigned_officer_id?.name || 'Unassigned',
  location: {
    area: c.location?.address?.split(',')[0] || 'Delhi',
    district: c.location?.district || 'Central'
  }
});

export default function DistrictMapPage() {
  const router = useRouter();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtData, setDistrictData] = useState([]);
  const [nearbyComplaints, setNearbyComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadDistricts() {
      try {
        setLoading(true);
        const res = await analytics.leaderboard();
        if (res && res.leaderboard) {
          // Map backend schema to matching page layout schema
          const mapped = res.leaderboard.map(d => ({
            id: d.code,
            name: `${d.district} / ${d.district}`,
            totalComplaints: d.total || 0,
            resolved: d.resolved || 0,
            pending: d.pending || 0,
            critical: d.slaBreached || 0,
            dm: d.dm_name || 'DM'
          }));
          setDistrictData(mapped);
          setIsDemoMode(false);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to load district leaderboard:', err);
        setDistrictData([]);
      } finally {
        setLoading(false);
      }
    }
    loadDistricts();
  }, []);

  useEffect(() => {
    if (!selectedDistrict) {
      setNearbyComplaints([]);
      return;
    }
    async function loadNearby() {
      try {
        const res = await complaintsApi.list({ district: selectedDistrict });
        if (res && res.complaints) {
          setNearbyComplaints(res.complaints.map(mapApiComplaintToMock).slice(0, 5));
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to load nearby complaints:', err);
        setNearbyComplaints([]);
      }
    }
    loadNearby();
  }, [selectedDistrict]);

  const maxComplaints = districtData.length > 0 ? Math.max(...districtData.map(d => d.totalComplaints)) : 100;

  const getHeatColor = (count) => {
    const ratio = count / maxComplaints;
    if (ratio > 0.75) return '#D50000';
    if (ratio > 0.5) return '#E65100';
    if (ratio > 0.25) return '#F57F17';
    return '#2E7D32';
  };

  const selected = selectedDistrict ? districtData.find(d => d.id === selectedDistrict) : null;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>🗺️ District-wise Map</h1>
          <span className="page-title-hi">जिला मानचित्र — दिल्ली के 11 जिले</span>
        </div>
      </div>

      <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
        <span className="alert-banner-icon">💡</span>
        Click on a district to see detailed complaints in that area. Useful for CM field visits.
        <span style={{ fontFamily: 'var(--font-hindi)', marginLeft: 8 }}>
          विस्तृत शिकायतें देखने के लिए जिले पर क्लिक करें।
        </span>
      </div>

      <div className="grid-dashboard">
        {/* District Grid */}
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">📍 Delhi Districts <span className="card-title-hi">दिल्ली के जिले</span></div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }} /> Low
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F57F17', display: 'inline-block' }} /> Medium
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#E65100', display: 'inline-block' }} /> High
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#D50000', display: 'inline-block' }} /> Critical
                </span>
              </div>
            </div>
            <div className="card-body">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--space-4)',
              }}>
                {districtData.map((district) => {
                  const heatColor = getHeatColor(district.totalComplaints);
                  const isSelected = selectedDistrict === district.id;
                  return (
                    <button
                      key={district.id}
                      onClick={() => setSelectedDistrict(isSelected ? null : district.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        padding: 'var(--space-5) var(--space-3)',
                        background: isSelected ? heatColor : 'var(--color-surface)',
                        color: isSelected ? 'white' : 'var(--color-text-primary)',
                        border: `2px solid ${isSelected ? heatColor : 'var(--color-border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        fontFamily: 'var(--font-primary)',
                        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isSelected ? 'var(--shadow-lg)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: isSelected ? 'rgba(255,255,255,0.2)' : heatColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isSelected ? 'white' : 'white',
                        fontWeight: 800, fontSize: 'var(--text-sm)',
                      }}>
                        {district.totalComplaints > 999 ? Math.round(district.totalComplaints / 1000) + 'K' : district.totalComplaints}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textAlign: 'center', lineHeight: 1.3 }}>
                        {district.name.split('/')[0].trim()}
                      </div>
                      {district.critical > 0 && (
                        <span style={{
                          background: isSelected ? 'rgba(255,255,255,0.3)' : '#FFCDD2',
                          color: isSelected ? 'white' : '#D50000',
                          padding: '1px 8px', borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-xs)', fontWeight: 700,
                        }}>
                          🚨 {district.critical}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* District Detail Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {selected ? (
            <>
              <div className="card" style={{ borderTop: `4px solid ${getHeatColor(selected.totalComplaints)}` }}>
                <div className="card-header">
                  <div className="card-title">
                    📍 {selected.name.split('/')[0].trim()}
                  </div>
                </div>
                <div className="card-body">
                  <div style={{ fontFamily: 'var(--font-hindi)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    {selected.name.split('/')[1]?.trim()}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-primary-surface)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary)' }}>{selected.totalComplaints.toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total / कुल</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: '#FFF3E0', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-saffron)' }}>{selected.pending.toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Pending / लंबित</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: 'var(--color-green-surface)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-green)' }}>{selected.resolved.toLocaleString()}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Resolved / हल</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', background: '#FFCDD2', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--priority-critical)' }}>{selected.critical}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Critical / गंभीर</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nearby Complaints */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">📋 Area Complaints <span className="card-title-hi">क्षेत्र शिकायतें</span></div>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  {nearbyComplaints.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 'var(--space-4) var(--space-5)',
                        borderBottom: i < nearbyComplaints.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => router.push(`/dashboard/complaints/${c.id}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                        <span>{c.categoryIcon}</span>
                        <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-primary)' }}>{c.id}</span>
                        <span className={`badge badge-${c.priority}`}>{c.priority}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }} className="truncate">{c.description}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>📍 {c.location.area}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                  <div className="empty-state-icon">📍</div>
                  <div className="empty-state-title">Select a District</div>
                  <div className="empty-state-text">Click on a district to see detailed information and nearby complaints.</div>
                  <div style={{ fontFamily: 'var(--font-hindi)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                    विस्तृत जानकारी के लिए किसी जिले पर क्लिक करें
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
