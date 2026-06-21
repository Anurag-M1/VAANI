'use client';

import { useState, useEffect } from 'react';
import { resources, complaints } from '../../lib/api';
import { DELHI_DISTRICTS } from '../../../data/complaints';

export default function OfficersPage() {
  const [officersList, setOfficersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Dropdowns Lists
  const [departments, setDepartments] = useState([]);
  const [assignableComplaints, setAssignableComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Selection States
  const [selectedOfficerForAssign, setSelectedOfficerForAssign] = useState(null);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');

  // New Officer Form State
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    mobile: '',
    email: '',
    district: 'central',
    department: '',
    designation: 'Field Officer',
  });

  const loadOfficers = async () => {
    try {
      setLoading(true);
      const res = await resources.officers();
      if (res && res.officers) {
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
  };

  useEffect(() => {
    loadOfficers();
  }, []);

  // Fetch departments list
  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await resources.departments();
        if (res && res.departments) {
          setDepartments(res.departments);
          if (res.departments.length > 0) {
            setNewOfficer(prev => ({ ...prev, department: res.departments[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    }
    fetchDepts();
  }, []);

  // Open Assign Complaint Modal
  const handleAssignClick = async (officer) => {
    setSelectedOfficerForAssign(officer);
    setIsAssignModalOpen(true);
    setLoadingComplaints(true);
    setAssignableComplaints([]);
    setSelectedComplaintId('');
    try {
      const res = await complaints.list({ limit: 100 });
      if (res && res.complaints) {
        const assignable = res.complaints.filter(c => 
          ['FILED', 'PENDING_ASSIGN', 'DISPUTED'].includes(c.status)
        );
        setAssignableComplaints(assignable);
        if (assignable.length > 0) {
          setSelectedComplaintId(assignable[0].complaint_id);
        }
      }
    } catch (err) {
      console.error('Failed to load assignable complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  // Submit Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaintId || !selectedOfficerForAssign) return;

    try {
      const res = await complaints.assign(selectedComplaintId, selectedOfficerForAssign.id);
      if (res && res.success) {
        alert(`Successfully assigned complaint ${selectedComplaintId} to ${selectedOfficerForAssign.name}!`);
        setIsAssignModalOpen(false);
        loadOfficers(); // Reload to refresh active complaints count
      } else {
        alert(res?.error || 'Failed to assign complaint');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to assign complaint');
    }
  };

  // Submit New Officer
  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    if (!newOfficer.name || !newOfficer.mobile || !newOfficer.department) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const res = await resources.createOfficer(newOfficer);
      if (res && res.success) {
        alert('Officer created successfully!');
        setIsAddModalOpen(false);
        setNewOfficer({
          name: '',
          mobile: '',
          email: '',
          district: 'central',
          department: departments.length > 0 ? departments[0]._id : '',
          designation: 'Field Officer',
        });
        loadOfficers();
      } else {
        alert(res?.error || 'Failed to create officer');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create officer');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>👤 Officers Directory</h1>
          <span className="page-title-hi">अधिकारी निर्देशिका — {officersList.length} अधिकारी</span>
        </div>
        <div className="page-actions">
          <button 
            className="btn btn-primary" 
            id="btn-add-officer" 
            onClick={() => setIsAddModalOpen(true)}
          >
            ➕ Add Officer / अधिकारी जोड़ें
          </button>
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

                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                    <span>📍 {officer.district?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>
                    <span>📞 {officer.phone}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => {
                        alert(`📞 Initiating secure VoIP connection to ${officer.name}...`);
                        window.location.href = `tel:${officer.phone}`;
                      }}
                    >
                      📞 Call
                    </button>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => handleAssignClick(officer)}
                      disabled={officer.status === 'on_leave'}
                    >
                      📋 Assign
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD OFFICER MODAL --- */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)', backdropFilter: 'blur(3px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">➕ Add New Field Officer</div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateOfficer} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Full Name <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter full name"
                    value={newOfficer.name}
                    onChange={(e) => setNewOfficer({ ...newOfficer, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={newOfficer.mobile}
                    onChange={(e) => setNewOfficer({ ...newOfficer, mobile: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. officer@vaani.gov.in"
                    value={newOfficer.email}
                    onChange={(e) => setNewOfficer({ ...newOfficer, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                  <select
                    className="form-select"
                    value={newOfficer.department}
                    onChange={(e) => setNewOfficer({ ...newOfficer, department: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  >
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
                    ))}
                  </select>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">District <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                    <select
                      className="form-select"
                      value={newOfficer.district}
                      onChange={(e) => setNewOfficer({ ...newOfficer, district: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    >
                      {DELHI_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>{d.name.split('/')[0].trim()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newOfficer.designation}
                      onChange={(e) => setNewOfficer({ ...newOfficer, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Add Officer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- ASSIGN COMPLAINT MODAL --- */}
      {isAssignModalOpen && selectedOfficerForAssign && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)', backdropFilter: 'blur(3px)'
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">
                📋 Assign Case to {selectedOfficerForAssign.name}
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--color-text-muted)' }}
              >
                ✕
              </button>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Select an active unassigned or disputed complaint to assign to this officer.
                </p>

                {loadingComplaints ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                    Loading assignable complaints...
                  </div>
                ) : assignableComplaints.length === 0 ? (
                  <div style={{
                    padding: 'var(--space-4)', background: 'var(--color-surface-hover)',
                    borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--priority-critical)',
                    fontWeight: 600, fontSize: 'var(--text-sm)'
                  }}>
                    ⚠️ No active unassigned or disputed complaints found in the database.
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Active Complaints <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                    <select
                      className="form-select"
                      value={selectedComplaintId}
                      onChange={(e) => setSelectedComplaintId(e.target.value)}
                      required
                      style={{ width: '100%' }}
                    >
                      {assignableComplaints.map((c) => (
                        <option key={c._id} value={c.complaint_id}>
                          {c.complaint_id} — {c.category?.toUpperCase()} ({c.status})
                        </option>
                      ))}
                    </select>
                    
                    {/* Selected complaint details snippet */}
                    {(() => {
                      const selectedComp = assignableComplaints.find(c => c.complaint_id === selectedComplaintId);
                      if (!selectedComp) return null;
                      return (
                        <div style={{
                          marginTop: 'var(--space-3)', padding: 'var(--space-3)',
                          background: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)',
                          borderLeft: '3px solid var(--color-primary)', fontSize: 'var(--text-xs)'
                        }}>
                          <strong>Details:</strong>
                          <p style={{ margin: '2px 0', fontStyle: 'italic' }}>&ldquo;{selectedComp.complaint_text}&rdquo;</p>
                          <div style={{ color: 'var(--color-text-muted)', marginTop: 4 }}>📍 {selectedComp.location?.address}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAssignModalOpen(false)}>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    disabled={assignableComplaints.length === 0}
                  >
                    Confirm Assignment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
