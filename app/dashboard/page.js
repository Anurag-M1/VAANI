'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analytics, complaints as apiComplaints, getStoredUser } from '../lib/api';

function formatNumber(num) {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }) {
  const labels = {
    filed: 'Filed / दर्ज',
    pending_assign: 'Pending Assignment',
    assigned: 'Assigned / सौंपा',
    in_progress: 'In Progress / प्रगति में',
    pending_closure: 'Pending Closure / सत्यापन में',
    disputed: '⚠️ Disputed / विवादित',
    provisionally_closed: 'Provisionally Closed / अस्थायी रूप से बंद',
    closed: 'Closed / बंद',
    escalated: 'Escalated / बढ़ाया',
    defcon_alert: '🚨 DEFCON Alert / डेफकॉन अलर्ट'
  };
  const normalized = status?.toLowerCase();
  return <span className={`badge badge-${normalized}`}>{labels[normalized] || status}</span>;
}

function PriorityBadge({ priority }) {
  const labels = {
    defcon_red: '🔴 Red',
    defcon_orange: '🟠 Orange',
    defcon_yellow: '🟡 Yellow',
    defcon_green: '🟢 Green',
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low',
  };
  const normalized = priority?.toLowerCase();
  return <span className={`badge badge-${normalized}`}>{labels[normalized] || priority}</span>;
}

// ---- Horizontal Bar Chart ----
function HorizontalBarChart({ data, maxValue, color }) {
  return (
    <div className="chart-bar-group">
      {data.map((item, i) => (
        <div className="chart-bar-item" key={i}>
          <span className="chart-bar-label">{item.label}</span>
          <div className="chart-bar-track">
            <div
              className="chart-bar-fill"
              style={{
                width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                background: item.color || color || 'var(--color-primary)',
              }}
            >
              {maxValue > 0 && (item.value / maxValue) * 100 > 15 ? item.value : ''}
            </div>
          </div>
          <span className="chart-bar-value">{item.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Weekly Mini Bar Chart ----
function WeeklyChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.complaints), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div className="mini-bar-chart" style={{ height: 80 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 2 }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: 80,
              justifyContent: 'flex-end',
              width: '100%',
              gap: 2,
              position: 'relative',
            }}>
              <div
                className="mini-bar"
                style={{
                  height: `${(d.complaints / max) * 100}%`,
                  background: 'var(--color-primary-lighter)',
                  opacity: 0.4,
                  width: '100%',
                  minWidth: 0,
                  borderRadius: '3px 3px 0 0',
                }}
                title={`${d.day}: ${d.complaints} complaints`}
              />
              <div
                className="mini-bar"
                style={{
                  height: `${(d.resolved / max) * 100}%`,
                  background: 'var(--color-green)',
                  width: '100%',
                  minWidth: 0,
                  position: 'absolute',
                  bottom: 0,
                  borderRadius: '3px 3px 0 0',
                }}
                title={`${d.day}: ${d.resolved} resolved`}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {data.map((d, i) => (
          <span key={i} style={{ 
            fontSize: 'var(--text-xs)', 
            color: 'var(--color-text-muted)', 
            flex: 1, 
            textAlign: 'center' 
          }}>
            {d.day}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: 'var(--color-primary-lighter)', borderRadius: 2, opacity: 0.4, display: 'inline-block' }} />
          Received / प्राप्त
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 10, height: 10, background: 'var(--color-green)', borderRadius: 2, display: 'inline-block' }} />
          Resolved / हल
        </span>
      </div>
    </div>
  );
}

// ---- SLA Gauge ----
function SLAGauge({ value }) {
  let color = 'green';
  let label = 'On Track';
  if (value < 50) { color = 'red'; label = 'Critical'; }
  else if (value < 70) { color = 'yellow'; label = 'At Risk'; }
  return (
    <div className="sla-gauge">
      <div className={`sla-dot ${color}`} />
      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{value}% — {label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showAlert, setShowAlert] = useState(true);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    todayComplaints: 0,
    pendingComplaints: 0,
    resolvedToday: 0,
    criticalAlerts: 0,
    slaCompliance: 80,
    avgResolutionDays: '2.4 days',
    citizenSatisfaction: 85,
    falseClosure: 0,
    disputedCount: 0,
  });
  const [criticalComplaints, setCriticalComplaints] = useState([]);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  const loadData = async () => {
    try {
      const dashboardRes = await analytics.dashboard();
      const complaintsRes = await apiComplaints.list({ limit: 100 });
      const criticalRes = await analytics.defcon();
      const districtsRes = await analytics.leaderboard();
      const trendsRes = await analytics.trends(7);

      if (dashboardRes && !dashboardRes.error) {
        const resolved = dashboardRes.todayResolved || 0;
        const disputed = dashboardRes.disputed || 0;
        const total = dashboardRes.total || 0;
        const slaBreach = dashboardRes.slaBreach || 0;
        const fRate = resolved > 0 ? parseFloat(((disputed / resolved) * 100).toFixed(1)) : 0;
        
        setStats(prev => ({
          ...prev,
          totalComplaints: total,
          todayComplaints: dashboardRes.todayFiled || 0,
          pendingComplaints: dashboardRes.pending || 0,
          resolvedToday: resolved,
          criticalAlerts: dashboardRes.criticalAlerts || 0,
          slaCompliance: dashboardRes.slaCompliance !== undefined ? dashboardRes.slaCompliance : 88,
          falseClosure: fRate,
          disputedCount: disputed,
        }));
      }

      if (complaintsRes && complaintsRes.complaints) {
        setRecentComplaints(complaintsRes.complaints);
      }

      if (criticalRes && criticalRes.alerts) {
        setCriticalComplaints(criticalRes.alerts);
      }

      if (districtsRes && districtsRes.leaderboard) {
        setDistrictsList(districtsRes.leaderboard);
      }

      if (trendsRes && trendsRes.trends) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedTrends = trendsRes.trends.map(t => {
          const d = new Date(t.date);
          return {
            day: days[d.getDay()],
            complaints: t.filed,
            resolved: t.resolved,
          };
        });
        setTrends(formattedTrends);
      }
    } catch (err) {
      console.warn('API error, fallback or retry:', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Compute department-specific KPIs helper
  const getDeptKPIs = (list, code) => {
    const counts = { k1: 0, k2: 0, k3: 0, k4: 0 };
    list.forEach(c => {
      const text = (c.complaint_text || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      
      if (code === 'DJB') {
        if (text.includes('leak') || text.includes('burst') || text.includes('pipe')) counts.k1++;
        else if (text.includes('pressure') || text.includes('supply') || text.includes('नहीं आ रहा')) counts.k2++;
        else if (text.includes('contaminate') || text.includes('quality') || text.includes('yellow') || text.includes('foul')) counts.k3++;
        else counts.k4++;
      } else if (code === 'BSES_R' || code === 'BSES_Y') {
        if (text.includes('outage') || text.includes('power') || text.includes('बिजली') || text.includes('गायब')) counts.k1++;
        else if (text.includes('street') || text.includes('light')) counts.k2++;
        else if (text.includes('wire') || text.includes('transformer') || text.includes('spark')) counts.k3++;
        else counts.k4++;
      } else if (code === 'MCD') {
        if (text.includes('garbage') || text.includes('dump') || text.includes('कूड़ा')) counts.k1++;
        else if (cat === 'encroachment' || text.includes('encroach') || text.includes('vendor')) counts.k2++;
        else if (cat === 'open_manhole' || text.includes('manhole')) counts.k3++;
        else counts.k4++;
      } else if (code === 'PWD') {
        if (text.includes('pothole') || text.includes('गड्ढा')) counts.k1++;
        else if (text.includes('damage') || text.includes('cave') || text.includes('repair')) counts.k2++;
        else if (text.includes('traffic') || text.includes('signal') || text.includes('obstruction')) counts.k3++;
        else counts.k4++;
      }
    });
    return counts;
  };

  // Branding Customization
  let dashboardTitle = "Dashboard Overview";
  let dashboardTitleHi = "डैशबोर्ड अवलोकन";
  let deptKPIConfig = null;

  if (user) {
    if (['department_manager', 'nodal_officer', 'commissioner'].includes(user.role) && user.department) {
      const deptName = user.department.name;
      const deptCode = user.department.code;
      if (deptCode === 'DJB') {
        dashboardTitle = "Delhi Jal Board Dashboard";
        dashboardTitleHi = "दिल्ली जल बोर्ड डैशबोर्ड";
      } else if (deptCode === 'BSES_R' || deptCode === 'BSES_Y') {
        dashboardTitle = "BSES Electricity Dashboard";
        dashboardTitleHi = "बीएसईएस बिजली विभाग डैशबोर्ड";
      } else if (deptCode === 'MCD') {
        dashboardTitle = "MCD Sanitation Dashboard";
        dashboardTitleHi = "एमसीडी स्वच्छता विभाग डैशबोर्ड";
      } else if (deptCode === 'PWD') {
        dashboardTitle = "PWD Roads Dashboard";
        dashboardTitleHi = "पीडब्ल्यूडी सड़क विभाग डैशबोर्ड";
      } else {
        dashboardTitle = `${deptName} Dashboard`;
        dashboardTitleHi = `${deptName} डैशबोर्ड`;
      }

      const counts = getDeptKPIs(recentComplaints, deptCode);
      if (deptCode === 'DJB') {
        deptKPIConfig = [
          { label: 'Water Leakage / पाइपलाइन रिसाव', value: counts.k1, icon: '💧', color: 'var(--color-primary)' },
          { label: 'Supply / Low Pressure / पानी की किल्लत', value: counts.k2, icon: '🚰', color: 'var(--color-saffron)' },
          { label: 'Contaminated Quality / दूषित पानी', value: counts.k3, icon: '🤢', color: 'var(--priority-critical)' },
          { label: 'Sewer Overflow / सीवर ओवरफ्लो', value: counts.k4, icon: '💩', color: '#8D6E63' },
        ];
      } else if (deptCode === 'BSES_R' || deptCode === 'BSES_Y') {
        deptKPIConfig = [
          { label: 'Power Outages / बिजली कटौती', value: counts.k1, icon: '🔌', color: 'var(--color-saffron)' },
          { label: 'Streetlight Issues / स्ट्रीटलाइट बंद', value: counts.k2, icon: '💡', color: '#FBC02D' },
          { label: 'Exposed Wires / खुले तार', value: counts.k3, icon: '⚡', color: 'var(--priority-critical)' },
          { label: 'Billing & Others / बिलिंग शिकायतें', value: counts.k4, icon: '💵', color: 'var(--color-green)' },
        ];
      } else if (deptCode === 'MCD') {
        deptKPIConfig = [
          { label: 'Garbage Accumulation / कचरा ढेर', value: counts.k1, icon: '🗑️', color: '#78909C' },
          { label: 'Encroachment / अवैध कब्ज़ा', value: counts.k2, icon: '🚧', color: 'var(--color-saffron)' },
          { label: 'Open Manholes / खुले मैनहोल', value: counts.k3, icon: '🕳️', color: 'var(--priority-critical)' },
          { label: 'Safety Hazards / सुरक्षा खतरे', value: counts.k4, icon: '⚠️', color: '#E53935' },
        ];
      } else if (deptCode === 'PWD') {
        deptKPIConfig = [
          { label: 'Potholes / गड्ढे', value: counts.k1, icon: '🕳️', color: '#8D6E63' },
          { label: 'Road Damage / टूटी सड़क', value: counts.k2, icon: '🛣️', color: 'var(--color-primary)' },
          { label: 'Traffic & Signals / ट्रैफिक सिग्नल', value: counts.k3, icon: '🚦', color: 'var(--color-green)' },
          { label: 'Obstructions / सड़क रुकावट', value: counts.k4, icon: '🚧', color: 'var(--color-saffron)' },
        ];
      }
    } else if (user.role === 'district_officer' && user.district) {
      dashboardTitle = `District Magistrate Dashboard — ${user.district}`;
      dashboardTitleHi = `जिला मजिस्ट्रेट डैशबोर्ड — ${user.district} जिला`;
    }
  }

  // Dynamic Category Stats Calculation
  const categoryIcons = {
    water: '💧', sewage: '💩', roads: '🛣️', sanitation: '🗑️',
    electricity: '🔌', encroachment: '🚧', pollution: '🏭', transport: '🚌',
    gas_leak: '💨', building_collapse: '🏢', open_manhole: '🕳️', fire_hazard: '🔥'
  };
  const categoryCounts = {};
  recentComplaints.forEach(c => {
    const cat = c.category || 'other';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCounts)
    .map(([cat, count]) => ({
      category: cat.charAt(0).toUpperCase() + cat.slice(1),
      count,
      icon: categoryIcons[cat] || '📋'
    }))
    .sort((a, b) => b.count - a.count);

  // Dynamic Department Stats Calculation
  const deptCounts = {};
  recentComplaints.forEach(c => {
    const dName = c.department_id?.code || 'CMO';
    deptCounts[dName] = (deptCounts[dName] || 0) + 1;
  });
  const deptData = Object.entries(deptCounts)
    .map(([name, val], idx) => {
      const colors = ['#FF9933', '#138808', '#000080', '#D50000', '#6A1B9A', '#00B0FF'];
      return {
        label: name,
        value: val,
        color: colors[idx % colors.length]
      };
    })
    .sort((a, b) => b.value - a.value);
  const maxDeptComplaints = deptData.length > 0 ? Math.max(...deptData.map(d => d.value)) : 0;

  // Filter out false closures (DISPUTED status)
  const falseClosureAlerts = recentComplaints.filter(c => c.status === 'DISPUTED');

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="animate-fade-in">
      {/* Critical Alert Banner */}
      {showAlert && criticalComplaints.length > 0 && (
        <div className="alert-banner alert-banner-critical animate-slide-down" style={{ marginBottom: 'var(--space-6)', borderRadius: 'var(--radius-lg)', position: 'relative', zIndex: 5 }}>
          <span className="alert-banner-icon">🚨</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{criticalComplaints.length} Critical Alerts</strong> — Life-threatening complaints require immediate attention!
            <span style={{ fontFamily: 'var(--font-hindi)', marginLeft: 8, display: 'inline' }}>
              {criticalComplaints.length} गंभीर शिकायतें तत्काल ध्यान की आवश्यकता!
            </span>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => router.push('/dashboard/critical')}
            id="btn-view-critical"
            style={{ flexShrink: 0 }}
          >
            View All / देखें
          </button>
          <button className="alert-banner-close" onClick={() => setShowAlert(false)} style={{ flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>📊 {dashboardTitle}</h1>
          <span className="page-title-hi">{dashboardTitleHi} — {new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} id="btn-refresh">
            🔄 Refresh / रिफ्रेश
          </button>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/reports')} id="btn-generate-report">
            📄 Generate Report / रिपोर्ट बनाएं
          </button>
        </div>
      </div>

      {/* ---- STAT CARDS ---- */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card" style={{ '--stat-accent': 'var(--color-primary)', '--stat-bg': 'var(--color-primary-surface)' }}>
          <div className="stat-card-icon" style={{ background: 'var(--color-primary-surface)' }}>📋</div>
          <div className="stat-card-value">{formatNumber(stats.totalComplaints)}</div>
          <div className="stat-card-label">Total Complaints</div>
          <div className="stat-card-label-hi">कुल शिकायतें</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': 'var(--color-saffron)', '--stat-bg': 'var(--color-saffron-surface)' }}>
          <div className="stat-card-icon" style={{ background: 'var(--color-saffron-surface)' }}>📥</div>
          <div className="stat-card-value">{stats.todayComplaints}</div>
          <div className="stat-card-label">Today&apos;s Filed</div>
          <div className="stat-card-label-hi">आज की शिकायतें</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': '#E65100', '--stat-bg': '#FFF3E0' }}>
          <div className="stat-card-icon" style={{ background: '#FFF3E0' }}>⏳</div>
          <div className="stat-card-value">{formatNumber(stats.pendingComplaints)}</div>
          <div className="stat-card-label">Pending / In Progress</div>
          <div className="stat-card-label-hi">लंबित</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': 'var(--color-green)', '--stat-bg': 'var(--color-green-surface)' }}>
          <div className="stat-card-icon" style={{ background: 'var(--color-green-surface)' }}>✅</div>
          <div className="stat-card-value">{stats.resolvedToday}</div>
          <div className="stat-card-label">Resolved Today</div>
          <div className="stat-card-label-hi">आज हल हुई</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': 'var(--priority-critical)', '--stat-bg': 'var(--priority-critical-bg)' }}>
          <div className="stat-card-icon" style={{ background: 'var(--priority-critical-bg)' }}>🚨</div>
          <div className="stat-card-value">{stats.criticalAlerts}</div>
          <div className="stat-card-label">SLA Breached</div>
          <div className="stat-card-label-hi">SLA उल्लंघन</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': '#6A1B9A', '--stat-bg': '#F3E5F5' }}>
          <div className="stat-card-icon" style={{ background: '#F3E5F5' }}>📊</div>
          <div className="stat-card-value">{stats.avgResolutionDays}</div>
          <div className="stat-card-label">Avg. Resolution Time</div>
          <div className="stat-card-label-hi">औसत समाधान दिन</div>
        </div>

        <div className="stat-card" style={{ '--stat-accent': '#1565C0', '--stat-bg': '#E3F2FD' }}>
          <div className="stat-card-icon" style={{ background: '#E3F2FD' }}>😊</div>
          <div className="stat-card-value">{stats.citizenSatisfaction}%</div>
          <div className="stat-card-label">Citizen Satisfaction</div>
          <div className="stat-card-label-hi">नागरिक संतुष्टि</div>
        </div>

        <div
          className="stat-card"
          style={{ '--stat-accent': '#D50000', '--stat-bg': '#FFCDD2', cursor: 'pointer' }}
          onClick={() => router.push('/dashboard/complaints?status=disputed')}
          title="View all false closure / disputed cases"
        >
          <div className="stat-card-icon" style={{ background: '#FFCDD2' }}>⚠️</div>
          <div className="stat-card-value">{stats.disputedCount}</div>
          <div className="stat-card-label">False Closure Cases</div>
          <div className="stat-card-label-hi">झूठी बंदी ({stats.falseClosure}%)</div>
        </div>
      </div>

      {/* ---- DEPARTMENT-SPECIFIC KPI TILES ---- */}
      {deptKPIConfig && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>
            🎯 Department-Specific Insights / विभाग-विशिष्ट अंतर्दृष्टि
          </h3>
          <div className="grid-4" style={{ gap: 'var(--space-4)' }}>
            {deptKPIConfig.map((kpi, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  borderLeft: `5px solid ${kpi.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  padding: 'var(--space-4) var(--space-5)',
                }}
              >
                <span style={{ fontSize: '2rem', marginRight: 'var(--space-4)' }}>{kpi.icon}</span>
                <div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>{kpi.value}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {kpi.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- QUICK ACTIONS ---- */}
      <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="card-header">
          <div className="card-title">
            ⚡ Quick Actions
            <span className="card-title-hi">त्वरित कार्य</span>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 'var(--space-4)', overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/complaints')} id="qa-view-all">
              <div className="quick-action-icon" style={{ background: 'var(--color-primary-surface)' }}>📋</div>
              <span className="quick-action-label">View All</span>
              <span className="quick-action-label-hi">सभी देखें</span>
            </button>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/critical')} id="qa-critical">
              <div className="quick-action-icon" style={{ background: '#FFCDD2' }}>🚨</div>
              <span className="quick-action-label">Critical</span>
              <span className="quick-action-label-hi">गंभीर</span>
            </button>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/leaderboard')} id="qa-leaderboard">
              <div className="quick-action-icon" style={{ background: '#FFE0B2' }}>🏆</div>
              <span className="quick-action-label">Leaderboard</span>
              <span className="quick-action-label-hi">लीडरबोर्ड</span>
            </button>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/heatmap')} id="qa-heatmap">
              <div className="quick-action-icon" style={{ background: '#E3F2FD' }}>🗺️</div>
              <span className="quick-action-label">District Map</span>
              <span className="quick-action-label-hi">जिला मानचित्र</span>
            </button>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/reports')} id="qa-report">
              <div className="quick-action-icon" style={{ background: '#F3E5F5' }}>📄</div>
              <span className="quick-action-label">Reports</span>
              <span className="quick-action-label-hi">रिपोर्ट</span>
            </button>
            <button className="quick-action-btn" onClick={() => router.push('/dashboard/visits')} id="qa-visits">
              <div className="quick-action-icon" style={{ background: '#FFF9C4' }}>📍</div>
              <span className="quick-action-label">Visit Logs</span>
              <span className="quick-action-label-hi">दौरा रिकॉर्ड</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---- MAIN GRID: Complaints Feed + Info Panel ---- */}
      <div className="grid-dashboard" style={{ marginBottom: 'var(--space-8)' }}>
        {/* Recent Complaints Feed */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              📋 Recent Complaints
              <span className="card-title-hi">हाल की शिकायतें</span>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => router.push('/dashboard/complaints')}
              id="btn-view-all-complaints"
            >
              View All →
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentComplaints.slice(0, 8).map((complaint, i) => (
              <div
                key={complaint._id}
                className="complaint-card"
                style={{
                  borderRadius: 0,
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid var(--color-border-light)',
                  borderBottom: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: 'var(--space-4) var(--space-5)',
                  display: 'flex',
                  gap: 'var(--space-4)'
                }}
                onClick={() => router.push(`/dashboard/complaints/${complaint._id}`)}
              >
                <div style={{ fontSize: '2rem' }}>
                  {categoryIcons[complaint.category] || '📋'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                      {complaint.complaint_id}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '8px',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {complaint.complaint_text}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    <span>📍 {complaint.location?.address || 'Delhi'}, {complaint.location?.district}</span>
                    {complaint.department_id && <span>🏢 {complaint.department_id.code}</span>}
                    <span>🕐 {formatDate(complaint.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card-footer" style={{ textAlign: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push('/dashboard/complaints')}
              id="btn-load-more"
            >
              View All Complaints →
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* SLA Compliance */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                ⏱️ SLA Compliance
                <span className="card-title-hi">SLA अनुपालन</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-4xl)', fontWeight: 800, color: stats.slaCompliance >= 70 ? 'var(--color-green)' : 'var(--priority-critical)' }}>
                  {stats.slaCompliance}%
                </div>
                <SLAGauge value={stats.slaCompliance} />
              </div>
              <div className="progress-bar" style={{ height: 14, marginBottom: 'var(--space-4)' }}>
                <div
                  className={`progress-bar-fill ${stats.slaCompliance >= 70 ? 'green' : stats.slaCompliance >= 50 ? 'saffron' : 'red'}`}
                  style={{ width: `${stats.slaCompliance}%` }}
                />
              </div>
            </div>
          </div>

          {/* Weekly Trend */}
          {trends.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  📈 Weekly Trend
                  <span className="card-title-hi">साप्ताहिक रुझान</span>
                </div>
              </div>
              <div className="card-body">
                <WeeklyChart data={trends} />
              </div>
            </div>
          )}

          {/* Top Categories */}
          {topCategories.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  🏷️ Top Categories
                  <span className="card-title-hi">शीर्ष श्रेणियां</span>
                </div>
              </div>
              <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                {topCategories.slice(0, 6).map((cat, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-2)',
                    borderBottom: i < topCategories.slice(0, 6).length - 1 ? '1px solid var(--color-border-light)' : 'none',
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{cat.icon}</span>
                    <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>{cat.category}</span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}>
                      {cat.count.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---- DEPARTMENT PERFORMANCE ---- */}
      {deptData.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-header">
            <div className="card-title">
              🏢 Department-wise Complaints
              <span className="card-title-hi">विभागवार शिकायतें</span>
            </div>
          </div>
          <div className="card-body">
            <HorizontalBarChart
              data={deptData}
              maxValue={maxDeptComplaints}
            />
          </div>
        </div>
      )}

      {/* ---- DISTRICT OVERVIEW ---- */}
      {districtsList.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="card-header">
            <div className="card-title">
              🗺️ District-wise Overview
              <span className="card-title-hi">जिलावार अवलोकन</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/heatmap')} id="btn-view-map">
              Full Map →
            </button>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District / जिला</th>
                    <th>Total</th>
                    <th>Pending</th>
                    <th>Resolved</th>
                    <th>SLA Breached</th>
                    <th>Resolution %</th>
                  </tr>
                </thead>
                <tbody>
                  {districtsList.map((d, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{d.district}</td>
                      <td>{d.total.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--status-in-progress)' }}>{d.pending.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-green)' }}>{d.resolved.toLocaleString('en-IN')}</td>
                      <td>
                        {d.slaBreached > 0 ? (
                          <span className="badge badge-critical">{d.slaBreached}</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>0</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="progress-bar" style={{ width: 80, height: 8 }}>
                            <div
                              className={`progress-bar-fill ${d.resolution_rate >= 70 ? 'green' : d.resolution_rate >= 50 ? 'saffron' : 'red'}`}
                              style={{ width: `${d.resolution_rate}%` }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{d.resolution_rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- FALSE CLOSURE ALERTS ---- */}
      {(falseClosureAlerts.length > 0 || stats.disputedCount > 0) && (
        <div className="card" style={{ marginBottom: 'var(--space-8)', border: '2px solid var(--priority-critical)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: '#FFF5F5' }}>
            <div className="card-title" style={{ color: 'var(--priority-critical)' }}>
              ⚠️ False Closure Alerts
              <span className="card-title-hi" style={{ color: 'var(--priority-critical)' }}>झूठी बंदी सूचनाएं</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className="badge badge-lg" style={{ background: 'var(--priority-critical)', color: 'white', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}>
                {stats.disputedCount} cases
              </span>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => router.push('/dashboard/complaints?status=disputed')}
                id="btn-view-all-false-closure"
              >
                View All →
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {falseClosureAlerts.slice(0, 3).map((c, i) => (
              <div
                key={c._id}
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  borderBottom: '1px solid var(--color-border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  cursor: 'pointer',
                }}
                onClick={() => router.push(`/dashboard/complaints/${c._id}`)}
              >
                <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                    {c.complaint_id} — {(c.category || '').toUpperCase()}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    {c.location?.address || 'Delhi'} • Citizen disputed resolution
                  </div>
                </div>
                <button className="btn btn-danger btn-sm">Review</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
