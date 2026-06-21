'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COMPLAINT_CATEGORIES, DELHI_DISTRICTS, DEPARTMENTS, COMPLAINT_STATUS, PRIORITY_LEVELS } from '@/data/complaints';
import { complaints as apiComplaints, getStoredUser } from '../../lib/api';

const mapApiComplaintToMock = (c) => ({
  id: c.complaint_id,
  _id: c._id,
  description: c.complaint_text,
  category: c.category,
  categoryLabel: c.category ? `${c.category.toUpperCase()}/${c.category}` : 'Complaint/शिकायत',
  categoryIcon: c.category === 'water' ? '🚰' : c.category === 'electricity' ? '⚡' : c.category === 'roads' ? '🛣️' : c.category === 'sanitation' ? '🧹' : c.category === 'sewage' ? '🕳️' : '📋',
  status: c.status?.toLowerCase(),
  priority: c.priority?.toLowerCase()?.replace('defcon_', ''),
  createdAt: c.createdAt,
  citizenName: c.citizen_id?.name || 'Citizen',
  citizenPhone: c.citizen_id?.mobile || '',
  department: c.department_id?.code || c.department_id?.name || 'MCD',
  assignedTo: c.assigned_officer_id?.name || 'Unassigned',
  slaBreached: c.sla_breached,
  location: {
    area: c.location?.address?.split(',')[0] || 'Delhi',
    district: c.location?.district || 'Central'
  }
});

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const labels = {
    filed: 'Filed', pending_assign: 'Pending Assignment', assigned: 'Assigned', in_progress: 'In Progress',
    escalated: 'Escalated', resolved: 'Resolved', closed: 'Closed',
    reopened: 'Reopened', false_closure: '⚠️ False Closure',
    disputed: '⚠️ Disputed', provisionally_closed: 'Provisionally Closed'
  };
  const normalized = status?.toLowerCase();
  return <span className={`badge badge-${normalized}`}>{labels[normalized] || status}</span>;
}

function PriorityBadge({ priority }) {
  const icons = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', defcon_red: '🔴', defcon_orange: '🟠', defcon_yellow: '🟡', defcon_green: '🟢' };
  const normalized = priority?.toLowerCase();
  return <span className={`badge badge-${normalized}`}>
    {icons[normalized] || '🟢'} {priority?.replace('defcon_', '')?.toUpperCase()}
  </span>;
}

export default function ComplaintsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  const [sortBy, setSortBy] = useState('newest');
  const [complaintsList, setComplaintsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      if (stored.role === 'district_officer' && stored.district) {
        setDistrictFilter(stored.district.toLowerCase().replace(/\s+/g, '_'));
      }
      if (['department_manager', 'nodal_officer', 'commissioner'].includes(stored.role) && stored.department) {
        setDepartmentFilter(stored.department.code);
      }
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const params = {};
        if (statusFilter !== 'all') params.status = statusFilter.toUpperCase();
        if (priorityFilter !== 'all') params.priority = priorityFilter.startsWith('DEFCON_') ? priorityFilter : `DEFCON_${priorityFilter.toUpperCase()}`;
        if (districtFilter !== 'all') params.district = districtFilter;
        if (departmentFilter !== 'all') params.department = departmentFilter;
        if (searchQuery) params.search = searchQuery;
        
        if (sortBy === 'newest') params.sort = '-createdAt';
        else if (sortBy === 'oldest') params.sort = 'createdAt';
        else if (sortBy === 'priority') params.sort = 'priority';

        const res = await apiComplaints.list(params);
        if (res && res.complaints) {
          setComplaintsList(res.complaints.map(mapApiComplaintToMock));
          setIsDemoMode(false);
        } else {
          throw new Error('API failed');
        }
      } catch (err) {
        console.error('Failed to load complaints:', err);
        setComplaintsList([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchQuery, statusFilter, priorityFilter, districtFilter, departmentFilter, sortBy]);

  const filteredComplaints = complaintsList;

  const statusCounts = useMemo(() => {
    const counts = { all: complaintsList.length };
    complaintsList.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [complaintsList]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
    if (!user || user.role !== 'district_officer') {
      setDistrictFilter('all');
    }
    if (!user || !['department_manager', 'nodal_officer', 'commissioner'].includes(user.role)) {
      setDepartmentFilter('all');
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>📋 All Complaints</h1>
          <span className="page-title-hi">सभी शिकायतें — कुल {filteredComplaints.length} शिकायतें</span>
        </div>
        <div className="page-actions">
          <button
            className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setViewMode('cards')}
            id="view-cards"
          >
            📇 Cards
          </button>
          <button
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setViewMode('table')}
            id="view-table"
          >
            📊 Table
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-bar" style={{ maxWidth: '100%', marginBottom: 'var(--space-4)' }}>
        <span className="search-bar-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by ID, description, area, citizen name... / खोजें..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="complaints-search"
        />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Status Filter */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 160 }}>
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} id="filter-status" style={{ minHeight: 44 }}>
            <option value="all">All Status ({statusCounts.all})</option>
            {Object.values(COMPLAINT_STATUS).map(s => (
              <option key={s} value={s.toLowerCase()}>{s.replace(/_/g, ' ')} ({statusCounts[s.toLowerCase()] || 0})</option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
          <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} id="filter-priority" style={{ minHeight: 44 }}>
            <option value="all">All Priority</option>
            {Object.values(PRIORITY_LEVELS).map(p => (
              <option key={p} value={p.toLowerCase()}>{p}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <select
            className="form-select"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            disabled={user && user.role === 'district_officer'}
            id="filter-district"
            style={{ minHeight: 44 }}
          >
            <option value="all">All Districts</option>
            {DELHI_DISTRICTS.map(d => (
              <option key={d.id} value={d.id}>{d.name.split('/')[0].trim()}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 180 }}>
          <select
            className="form-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            disabled={user && ['department_manager', 'nodal_officer', 'commissioner'].includes(user.role)}
            id="filter-department"
            style={{ minHeight: 44 }}
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
          <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} id="filter-sort" style={{ minHeight: 44 }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Clear */}
        <button className="btn btn-ghost btn-sm" onClick={clearFilters} id="btn-clear-filters">
          ✕ Clear Filters
        </button>
      </div>

      {/* Results Count */}
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
        Showing <strong>{filteredComplaints.length}</strong> complaints
        {searchQuery && <> for &quot;<strong>{searchQuery}</strong>&quot;</>}
      </div>

      {/* Complaints List — Card View */}
      {viewMode === 'cards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filteredComplaints.map((complaint) => (
            <div
              key={complaint.id}
              className={`complaint-card ${complaint.slaBreached ? 'critical' : ''}`}
              onClick={() => router.push(`/dashboard/complaints/${complaint._id}`)}
              style={{ position: 'relative' }}
            >
              <div className="complaint-card-icon">
                {complaint.categoryIcon}
              </div>
              <div className="complaint-card-body">
                <div className="complaint-card-header">
                  <span className="complaint-card-id">{complaint.id}</span>
                  <div className="complaint-card-meta">
                    <StatusBadge status={complaint.status} />
                    <PriorityBadge priority={complaint.priority} />
                    {complaint.slaBreached && <span className="badge badge-critical">SLA Breached</span>}
                  </div>
                </div>
                <div className="complaint-card-title" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  wordBreak: 'break-word'
                }}>{complaint.description}</div>
                <div className="complaint-card-info">
                  <span>👤 {complaint.citizenName}</span>
                  <span>📍 {complaint.location.area}</span>
                  <span>🏢 {complaint.department}</span>
                  <span>📅 {formatDate(complaint.createdAt)}</span>
                  <span>📱 {complaint.source}</span>
                </div>
                {complaint.assignedTo && (
                  <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    👷 Assigned to: <strong>{complaint.assignedTo}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complaints List — Table View */}
      {viewMode === 'table' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>District</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className={c.slaBreached ? 'critical' : ''}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/dashboard/complaints/${c._id}`)}
                  >
                    <td><span className="complaint-card-id">{c.id}</span></td>
                    <td>{c.categoryIcon} {c.categoryLabel.split('/')[0].trim()}</td>
                    <td style={{ maxWidth: 300 }}><div className="truncate">{c.description}</div></td>
                    <td>{c.location.area}</td>
                    <td>{c.department}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(c.createdAt)}</td>
                    <td>{c.assignedTo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredComplaints.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No Complaints Found</div>
          <div className="empty-state-text">Try adjusting your filters or search query.</div>
          <button className="btn btn-primary mt-4" onClick={clearFilters}>Clear All Filters</button>
        </div>
      )}
    </div>
  );
}
