'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DEPARTMENTS } from '@/data/complaints';
import { complaints as complaintsApi, resources, getStoredUser } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function StatusBadge({ status }) {
  const labels = {
    filed: 'Filed / दर्ज',
    pending_assign: 'Pending Assignment',
    assigned: 'Assigned / सौंपा',
    in_progress: 'In Progress / प्रगति में',
    pending_closure: 'Pending Closure / सत्यापन में',
    dept_verified: '✅ Dept Verified / विभाग सत्यापित',
    dm_verified: '✅ DM Verified / डीएम सत्यापित',
    disputed: '⚠️ Disputed / विवादित',
    provisionally_closed: 'Provisionally Closed / अस्थायी रूप से बंद',
    closed: 'Closed / बंद',
    escalated: 'Escalated / बढ़ाया',
    defcon_alert: '🚨 DEFCON Alert / डेफकॉन अलर्ट'
  };
  const normalized = status?.toLowerCase();
  return <span className={`badge badge-${normalized} badge-lg`}>{labels[normalized] || status}</span>;
}

function PriorityBadge({ priority }) {
  const icons = { defcon_red: '🔴', defcon_orange: '🟠', defcon_yellow: '🟡', defcon_green: '🟢', critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
  const normalized = priority?.toLowerCase();
  return <span className={`badge badge-${normalized} badge-lg`}>{icons[normalized] || '🟢'} {priority?.toUpperCase()}</span>;
}

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [complaint, setComplaint] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [note, setNote] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  
  // Anti-false-closure fields
  const [speakingOrder, setSpeakingOrder] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  
  // Directive fields
  const [directiveText, setDirectiveText] = useState('');

  // SLA Extension fields
  const [showExtendSlaModal, setShowExtendSlaModal] = useState(false);
  const [extendHours, setExtendHours] = useState('');
  const [extendReason, setExtendReason] = useState('');

  const [officersList, setOfficersList] = useState([]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      const res = await complaintsApi.get(params.id);
      if (res && res.complaint) {
        setComplaint(res.complaint);
      } else {
        throw new Error('Complaint not found in DB');
      }
    } catch (err) {
      console.error('Failed to load complaint details:', err);
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getStoredUser();
    if (u) setCurrentUser(u);
    loadComplaint();

    // Fetch officers for assignment selection
    async function loadOfficers() {
      try {
        const res = await resources.officers();
        if (res && res.officers) {
          setOfficersList(res.officers);
        } else {
          setOfficersList([]);
        }
      } catch (err) {
        console.error('Failed to load officers list:', err);
        setOfficersList([]);
      }
    }
    loadOfficers();
  }, [params.id]);

  useEffect(() => {
    if (complaint?._id) {
      const socket = getSocket();
      if (socket) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('subscribe-complaint', complaint._id);
        const handleComplaintUpdated = (data) => {
          console.log('Real-time update received for complaint:', data);
          loadComplaint();
        };
        socket.on('complaint-updated', handleComplaintUpdated);
        return () => {
          socket.off('complaint-updated', handleComplaintUpdated);
        };
      }
    }
  }, [complaint?._id]);

  const handleExtendSla = async (e) => {
    e.preventDefault();
    if (!extendHours || isNaN(extendHours)) return;
    try {
      const res = await complaintsApi.extendSla(complaint.complaint_id, extendHours, extendReason);
      if (res && res.error) {
        alert(`Failed to extend SLA: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
      setShowExtendSlaModal(false);
      setExtendHours('');
      setExtendReason('');
    } catch {
      alert('Failed to extend SLA deadline');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const res = await complaintsApi.addTimeline(complaint.complaint_id, {
        event: `Note added by ${currentUser?.name || currentUser?.role || 'User'}`,
        note
      });
      if (res && res.error) {
        alert(`Failed to add note: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
      setNote('');
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleEscalate = async () => {
    try {
      const res = await complaintsApi.escalate(complaint.complaint_id, 'Escalated from CMO Dashboard overview action');
      if (res && res.error) {
        alert(`Failed to escalate: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
    } catch {
      alert('Escalation failed');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;
    try {
      const selected = officersList.find(o => o.id === assigneeId || o._id === assigneeId);
      const res = await complaintsApi.addTimeline(complaint.complaint_id, {
        event: `Reassigned to ${selected?.name}`,
        note: `Reason: ${assignReason}. Assigned ID: ${assigneeId}`
      });
      if (res && res.error) {
        alert(`Failed to reassign: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
      setShowAssignModal(false);
      setAssignReason('');
    } catch {
      alert('Reassign failed');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (speakingOrder.length < 80) {
      alert('Anti-False-Closure warning: Speaking order must describe work in at least 80 characters.');
      return;
    }
    try {
      const res = await complaintsApi.resolve(complaint.complaint_id, {
        speaking_order: speakingOrder,
        resolution_photos: [{ url: resolutionPhoto, gps: { lat: 28.65, lng: 77.21 } }]
      });
      if (res && res.error) {
        alert(`Failed to submit resolution details: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
      setShowResolveModal(false);
      setSpeakingOrder('');
      setResolutionPhoto('');
    } catch (err) {
      alert('Failed to submit resolution details.');
    }
  };

  const handleCMDirectiveSubmit = async (e) => {
    e.preventDefault();
    if (!directiveText.trim()) return;
    try {
      const res = await complaintsApi.cmDirective(complaint.complaint_id, directiveText);
      if (res && res.error) {
        alert(`Failed to send directive: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
      setShowDirectiveModal(false);
      setDirectiveText('');
    } catch {
      alert('Failed to send directive');
    }
  };

  const handleDeptVerify = async () => {
    try {
      const res = await complaintsApi.deptVerify(complaint.complaint_id, 'Department has verified the resolution.');
      if (res && res.error) {
        alert(`Failed to verify: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
    } catch (err) {
      alert(err?.error || 'Department verification failed');
    }
  };

  const handleDmVerify = async () => {
    try {
      const res = await complaintsApi.dmVerify(complaint.complaint_id, 'District Magistrate has verified and approved the resolution.');
      if (res && res.error) {
        alert(`Failed to verify: ${res.error || res.message}`);
        return;
      }
      loadComplaint();
    } catch (err) {
      alert(err?.error || 'DM verification failed');
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🔍</div>
        <div className="empty-state-title">Complaint Not Found</div>
        <div className="empty-state-text">The complaint ID &quot;{params.id}&quot; was not found.</div>
        <button className="btn btn-primary mt-4" onClick={() => router.push('/dashboard/complaints')}>
          ← Back to Complaints
        </button>
      </div>
    );
  }

  const slaDate = complaint.sla_deadline ? new Date(complaint.sla_deadline) : null;
  const now = new Date();
  const slaRemaining = slaDate && !isNaN(slaDate.getTime()) ? Math.ceil((slaDate - now) / 3600000) : null;

  // Role-based visibility helpers
  const role = currentUser?.role;
  const isOfficer = role === 'officer';
  const isDeptManager = ['department_manager', 'nodal_officer', 'commissioner'].includes(role);
  const isDM = role === 'district_officer';
  const isCM = ['cm', 'cm_staff'].includes(role);
  const isSuperAdmin = role === 'super_admin';
  const status = complaint.status;

  // Can resolve: officers + dept managers, only when status allows
  const canResolve = (isOfficer || isDeptManager || isSuperAdmin) && ['ASSIGNED', 'IN_PROGRESS', 'FILED', 'DISPUTED'].includes(status);
  // Can dept verify: dept managers, only when PROVISIONALLY_CLOSED
  const canDeptVerify = (isDeptManager || isSuperAdmin) && status === 'PROVISIONALLY_CLOSED';
  // Can DM verify: DM or CM, only when DEPT_VERIFIED
  const canDmVerify = (isDM || isCM || isSuperAdmin) && status === 'DEPT_VERIFIED';
  // Can escalate: not CM (CM has directive instead)
  const canEscalate = !isCM && !['CLOSED', 'DM_VERIFIED', 'PROVISIONALLY_CLOSED', 'DEPT_VERIFIED'].includes(status);
  // Can extend SLA: CM or DM only
  const canExtendSla = (isCM || isDM || isSuperAdmin) && !['CLOSED', 'DM_VERIFIED'].includes(status);
  // Can issue CM directive: only for super_admin
  const canDirective = isSuperAdmin;
  // Can reassign: anyone except when closed
  const canReassign = !['CLOSED', 'DM_VERIFIED'].includes(status);

  return (
    <div className="animate-fade-in">
      {/* Back Button & Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => router.push('/dashboard/complaints')}
          style={{ marginBottom: 'var(--space-4)' }}
          id="btn-back"
        >
          ← Back to Complaints / शिकायत सूची
        </button>

        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                {complaint.complaint_id}
              </h1>
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.status === 'ESCALATED' && (
                <span className="badge badge-critical badge-lg" style={{ animation: 'pulse-badge 2s ease-in-out infinite' }}>
                  ⚠️ CM WAR ROOM REVIEW
                </span>
              )}
            </div>
            <span className="page-title-hi">
              शिकायत विवरण — {complaint.category?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* SLA Alert */}
      {complaint.sla_breached && (
        <div className="alert-banner alert-banner-warning" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">⏰</span>
          <strong>SLA BREACHED</strong> — This complaint has exceeded its resolution deadline.
        </div>
      )}

      {/* Citizen Rating Display */}
      {complaint.citizen_rating && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">⭐</span>
          <strong>Citizen Rating:</strong> {'⭐'.repeat(complaint.citizen_rating)} ({complaint.citizen_rating}/5)
          {complaint.citizen_feedback_text && <span> — &quot;{complaint.citizen_feedback_text}&quot;</span>}
        </div>
      )}

      <div className="grid-dashboard">
        {/* Left Column — Complaint Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                📋 Complaint Details
                <span className="card-title-hi">शिकायत विवरण</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{
                background: 'var(--color-surface-hover)',
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                fontSize: 'var(--text-base)',
                lineHeight: 1.8,
                borderLeft: '4px solid var(--color-primary)',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {complaint.complaint_text}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-5)' }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                    Category / श्रेणी
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                    🏷️ {complaint.category}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                    Department / विभाग
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                    🏢 {complaint.department_id?.name || 'MCD'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                    Location / स्थान
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                    📍 {complaint.location?.address} ({complaint.location?.district})
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase' }}>
                    SLA Deadline / समय सीमा
                  </div>
                  <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: slaRemaining !== null && slaRemaining < 0 ? 'var(--priority-critical)' : 'inherit' }}>
                    ⏱️ {slaDate ? formatDate(complaint.sla_deadline) : 'Not set'} {slaRemaining !== null ? `(${slaRemaining < 0 ? `${Math.abs(slaRemaining)}h OVERDUE` : `${slaRemaining}h left`})` : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CM Directive Display */}
          {complaint.cm_directive && (
            <div className="card" style={{ borderLeft: '5px solid var(--color-primary)', background: 'var(--color-primary-surface)' }}>
              <div className="card-header">
                <div className="card-title">
                  🏛️ CM Office Directive
                  <span className="card-title-hi">मुख्यमंत्री कार्यालय निर्देश</span>
                </div>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-primary)', fontStyle: 'italic', fontWeight: 600, wordBreak: 'break-word' }}>
                  &quot;{complaint.cm_directive}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Closure Progress Banner */}
          {['PENDING_CLOSURE', 'PROVISIONALLY_CLOSED', 'DEPT_VERIFIED', 'DM_VERIFIED', 'CLOSED'].includes(status) && (
            <div className="card" style={{ borderLeft: '5px solid var(--color-green)' }}>
              <div className="card-header">
                <div className="card-title">📊 Closure Progress / बंद करने की प्रगति</div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
                  {[
                    { label: '👷 Officer Resolved', done: true },
                    { label: '👤 Citizen Confirmed', done: ['PROVISIONALLY_CLOSED', 'DEPT_VERIFIED', 'DM_VERIFIED', 'CLOSED'].includes(status) },
                    { label: '🏢 Dept Verified', done: ['DEPT_VERIFIED', 'DM_VERIFIED', 'CLOSED'].includes(status) },
                    { label: '🏛️ DM Verified', done: ['DM_VERIFIED', 'CLOSED'].includes(status) },
                    { label: '⭐ Citizen Rated & Closed', done: status === 'CLOSED' },
                  ].map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%',
                        background: step.done ? 'var(--color-green)' : 'var(--color-border)',
                        color: step.done ? 'white' : 'var(--color-text-muted)',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>{step.done ? '✓' : i + 1}</span>
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: step.done ? 700 : 400, color: step.done ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                        {step.label}
                      </span>
                      {i < 4 && <span style={{ color: 'var(--color-border)', margin: '0 4px' }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Add Note */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                ✍️ Add Note / Action
                <span className="card-title-hi">टिप्पणी / कार्रवाई जोड़ें</span>
              </div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Note / टिप्पणी</label>
                <textarea
                  className="textarea"
                  placeholder="Write your note here... / यहाँ अपनी टिप्पणी लिखें..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                />
              </div>
              <button className="btn btn-primary" onClick={handleAddNote} style={{ marginTop: 'var(--space-3)' }}>
                ✍️ Add Note / टिप्पणी जोड़ें
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — Actions & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                ⚡ Actions
                <span className="card-title-hi">कार्रवाई</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {canEscalate && (
                <button className="btn btn-saffron btn-lg w-full" style={{ width: '100%' }} onClick={handleEscalate}>
                  ⬆️ Escalate / बढ़ाएं
                </button>
              )}
              {canReassign && (
                <button className="btn btn-primary btn-lg w-full" style={{ width: '100%' }} onClick={() => setShowAssignModal(true)}>
                  👤 Reassign / पुनः सौंपें
                </button>
              )}
              {canResolve && (
                <button className="btn btn-success btn-lg w-full" style={{ width: '100%', background: 'var(--color-green)' }} onClick={() => setShowResolveModal(true)}>
                  ✅ Mark Resolved / हल करें
                </button>
              )}
              {canDeptVerify && (
                <button className="btn btn-success btn-lg w-full" style={{ width: '100%', background: 'linear-gradient(135deg, hsl(145, 63%, 42%), hsl(160, 50%, 35%))' }} onClick={handleDeptVerify}>
                  🏢 Dept Verify Closure / विभाग सत्यापन
                </button>
              )}
              {canDmVerify && (
                <button className="btn btn-success btn-lg w-full" style={{ width: '100%', background: 'linear-gradient(135deg, hsl(220, 70%, 50%), hsl(240, 50%, 45%))' }} onClick={handleDmVerify}>
                  🏛️ DM Verify Closure / डीएम सत्यापन
                </button>
              )}
              {canDirective && (
                <button className="btn btn-outline btn-lg w-full" style={{ width: '100%' }} onClick={() => setShowDirectiveModal(true)}>
                  🏛️ Issue CM Directive / मुख्यमंत्री निर्देश
                </button>
              )}
              {canExtendSla && (
                <button className="btn btn-outline btn-lg w-full" style={{ width: '100%', borderColor: 'var(--color-primary)', color: 'var(--color-primary)', marginTop: 'var(--space-1)' }} onClick={() => setShowExtendSlaModal(true)}>
                  ⏱️ Extend SLA / समय बढ़ाएं
                </button>
              )}
              {status === 'CLOSED' && (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-green)', fontWeight: 700, fontSize: 'var(--text-base)' }}>
                  ✅ Complaint fully closed / शिकायत पूरी तरह बंद
                </div>
              )}
            </div>
          </div>

          {/* Assigned Officer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                👷 Assigned Officer
                <span className="card-title-hi">सौंपे गए अधिकारी</span>
              </div>
            </div>
            <div className="card-body">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-4)',
                background: 'var(--color-surface-hover)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}>
                  {complaint.assigned_officer_id?.name ? complaint.assigned_officer_id.name.split(' ').map(n => n[0]).join('').slice(0, 2) : '👷'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{complaint.assigned_officer_id?.name || 'Unassigned'}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{complaint.department_id?.name || 'MCD'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                📜 Timeline
                <span className="card-title-hi">समय-रेखा</span>
              </div>
            </div>
            <div className="card-body">
              <div className="timeline">
                {complaint.timeline?.map((item, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <div className="timeline-step" style={{ fontWeight: 700 }}>{item.event}</div>
                      {item.note && (
                        <div style={{
                          fontSize: 'var(--text-md)',
                          fontWeight: 600,
                          color: 'var(--color-text-primary)',
                          background: 'var(--color-surface-hover)',
                          borderLeft: '4px solid var(--color-primary)',
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-sm)',
                          margin: 'var(--space-2) 0',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}>
                          &quot;{item.note}&quot;
                        </div>
                      )}
                      <div className="timeline-meta">
                        {formatDate(item.timestamp)} • {item.actor_id?.name || item.actor_role} ({item.actor_role})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">👤 Reassign Complaint / शिकायत पुनः सौंपें</div>
              <button className="btn btn-ghost" style={{ fontSize: '1.2rem', padding: 4 }} onClick={() => setShowAssignModal(false)}>✕</button>
            </div>
            <form onSubmit={handleReassign}>
              <div className="card-body">
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label className="form-label">Select Officer / अधिकारी चुनें</label>
                  <select className="form-select" style={{ width: '100%', padding: 'var(--space-2)' }} value={assigneeId} onChange={e => setAssigneeId(e.target.value)} required>
                    <option value="">-- Select Officer --</option>
                    {officersList.map(o => (
                      <option key={o.id || o._id} value={o.id || o._id}>
                        {o.name} ({o.district})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason / कारण</label>
                  <textarea className="textarea" placeholder="Reason for reassignment..." value={assignReason} onChange={e => setAssignReason(e.target.value)} required style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)' }}>✅ Assign / सौंपें</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal (Anti-False-Closure Engine Gate) */}
      {showResolveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 550, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">🛡️ Anti-False-Closure Resolution Form</div>
              <button className="btn btn-ghost" style={{ fontSize: '1.2rem', padding: 4 }} onClick={() => setShowResolveModal(false)}>✕</button>
            </div>
            <form onSubmit={handleResolve}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="alert-banner alert-banner-info" style={{ margin: 0 }}>
                  <strong>MANDATORY CLOSURE RULES:</strong><br />
                  1. You must input a speaking order (min 80 characters).<br />
                  2. Upload at least 1 timestamped resolution photo.
                </div>
                <div>
                  <label className="form-label">Speaking Order / विस्तृत आदेश (min 80 characters)</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    required
                    placeholder="Describe: what issue was verified, what actions were executed, and status of cleanup. Be detailed."
                    value={speakingOrder}
                    onChange={(e) => setSpeakingOrder(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                  <div style={{ fontSize: 'var(--text-xs)', color: speakingOrder.length >= 80 ? 'var(--color-green)' : 'var(--priority-critical)', marginTop: 4, fontWeight: 700 }}>
                    Length: {speakingOrder.length} / 80 characters minimum
                  </div>
                </div>
                <div>
                  <label className="form-label">Upload Resolution Photo / समाधान की तस्वीर</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setResolutionPhoto(reader.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        setResolutionPhoto('');
                      }
                    }}
                    required
                  />
                  {resolutionPhoto && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <img src={resolutionPhoto} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowResolveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" style={{ background: 'var(--color-green)' }} disabled={speakingOrder.length < 80}>
                  ✅ Initiate Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CM Directive Modal */}
      {showDirectiveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">🏛️ Issue CM Directive</div>
              <button className="btn btn-ghost" style={{ fontSize: '1.2rem', padding: 4 }} onClick={() => setShowDirectiveModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCMDirectiveSubmit}>
              <div className="card-body">
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  Your directive will update the complaint status, flag it, and issue an SMS alert to the department heads.
                </p>
                <div className="form-group">
                  <label className="form-label">Directive text:</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    required
                    placeholder="Write the official CM directive here..."
                    value={directiveText}
                    onChange={(e) => setDirectiveText(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDirectiveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)' }}>Issue Directive</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend SLA Modal */}
      {showExtendSlaModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-4)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-2xl)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">⏱️ Extend SLA Deadline</div>
              <button className="btn btn-ghost" style={{ fontSize: '1.2rem', padding: 4 }} onClick={() => setShowExtendSlaModal(false)}>✕</button>
            </div>
            <form onSubmit={handleExtendSla}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  Provide the number of hours to extend the resolution timeline. This action will clear the SLA breach flag and update the timeline log.
                </p>
                <div className="form-group">
                  <label className="form-label">Hours to Extend / अतिरिक्त घंटे:</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    required
                    placeholder="e.g. 24, 48, 72"
                    value={extendHours}
                    onChange={(e) => setExtendHours(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Extension / समय बढ़ाने का कारण:</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    required
                    placeholder="Provide a detailed justification for the extension..."
                    value={extendReason}
                    onChange={(e) => setExtendReason(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>
              <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowExtendSlaModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)' }}>Extend SLA</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
