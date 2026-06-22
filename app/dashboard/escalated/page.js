'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { complaints as complaintsApi, getStoredUser } from '../../lib/api';


export default function EscalatedPage() {
  const router = useRouter();
  const [complaintsList, setComplaintsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  // CM Directive modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [directiveText, setDirectiveText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEscalated = async () => {
    try {
      setLoading(true);
      const res = await complaintsApi.list({ status: 'ESCALATED' });
      if (res && res.complaints) {
        setComplaintsList(res.complaints);
        setIsDemoMode(false);
      } else {
        throw new Error('Failed to fetch escalated');
      }
    } catch (err) {
      console.error('Failed to fetch escalated complaints:', err);
      setComplaintsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = getStoredUser();
    if (u) setCurrentUser(u);
    fetchEscalated();
  }, []);

  const handleOpenDirective = (complaint) => {
    setSelectedComplaint(complaint);
    setDirectiveText(complaint.cm_directive || '');
    setSuccessMsg('');
  };

  const handleSendDirective = async (e) => {
    e.preventDefault();
    if (!directiveText.trim()) return;

    setSubmitting(true);
    try {
      if (isDemoMode) {
        // Mock success
        setComplaintsList(prev => prev.map(c => 
          c.complaint_id === selectedComplaint.complaint_id 
            ? { ...c, cm_directive: directiveText, cm_flagged: true } 
            : c
        ));
      } else {
        await complaintsApi.cmDirective(selectedComplaint.complaint_id, directiveText);
      }
      setSuccessMsg('🏛️ CM Directive issued successfully!');
      setTimeout(() => {
        setSelectedComplaint(null);
        fetchEscalated();
      }, 1500);
    } catch (err) {
      alert('Failed to issue directive. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>🏛️ Escalated to CM</h1>
          <span className="page-title-hi">मुख्य मंत्री कार्यालय (CMO) में लंबित शिकायतें</span>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">ℹ️</span>
          Demo mode active: Displaying simulated escalated complaints.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading escalated complaints...</div>
        </div>
      ) : complaintsList.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">All Clear</div>
              <div className="empty-state-text">No pending complaints are currently escalated to the CM level.</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {complaintsList.map((complaint) => {
            const date = new Date(complaint.createdAt);
            const daysOpen = Math.ceil((new Date() - date) / 86400000);
            return (
              <div key={complaint._id} className="card" style={{ borderLeft: '6px solid var(--priority-critical)' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {complaint.complaint_id}
                      </span>
                      <span className={`badge badge-${complaint.priority?.toLowerCase()}`}>
                        {complaint.priority}
                      </span>
                      <span className="badge badge-escalated">
                        ESCALATED ({daysOpen}d open)
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => router.push(`/dashboard/complaints/${complaint.complaint_id}`)}
                      >
                        👁️ View Details
                      </button>
                      {currentUser?.role === 'super_admin' && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ background: 'var(--color-primary)' }}
                          onClick={() => handleOpenDirective(complaint)}
                        >
                          🏛️ CM Directive
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={{
                    marginTop: 'var(--space-4)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {complaint.complaint_text}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                    <div>📍 <strong>Location:</strong> {complaint.location?.address || 'Delhi'} ({complaint.location?.district})</div>
                    <div>🏢 <strong>Department:</strong> {complaint.department_id?.name || 'MCD'}</div>
                    <div>👷 <strong>Officer:</strong> {complaint.assigned_officer_id?.name || 'Unassigned'}</div>
                  </div>

                  {complaint.cm_directive && (
                    <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-primary-surface)', borderLeft: '3px solid var(--color-primary)', borderRadius: 'var(--radius-sm)' }}>
                      <strong>🏛️ CM Directive Issued:</strong>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>&ldquo;{complaint.cm_directive}&rdquo;</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CM Directive Modal */}
      {selectedComplaint && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in">
            <div className="modal-header">
              <div className="modal-title">🏛️ Issue CM Directive</div>
              <button className="modal-close" onClick={() => setSelectedComplaint(null)}>✕</button>
            </div>
            <div className="modal-body">
              {successMsg ? (
                <div style={{ color: 'var(--color-green)', fontWeight: 700, textAlign: 'center', padding: 'var(--space-6)' }}>
                  {successMsg}
                </div>
              ) : (
                <form onSubmit={handleSendDirective}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                    Your directive will be pinned to this complaint timeline and sent directly as an SMS notification to the nodal officer of <strong>{selectedComplaint.department_id?.name}</strong> and the assigned field officer <strong>{selectedComplaint.assigned_officer_id?.name}</strong>.
                  </p>
                  <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Directive text (English/Hindi):</label>
                    <textarea
                      className="textarea"
                      rows={5}
                      required
                      placeholder="e.g. Clean the garbage pile near the primary school within 24 hours. Submit photo evidence. / २४ घंटे के भीतर प्राथमिक विद्यालय के पास के कचरे को साफ करें।"
                      value={directiveText}
                      onChange={(e) => setDirectiveText(e.target.value)}
                      style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setSelectedComplaint(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)' }} disabled={submitting}>
                      {submitting ? 'Issuing...' : 'Issue Directive'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
