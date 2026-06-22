'use client';

import { useState, useEffect } from 'react';
import { resources } from '../../lib/api';


export default function VisitLogsPage() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const res = await resources.visits();
      if (res && res.visits) {
        setVisits(res.visits);
      }
    } catch (err) {
      console.error('Failed to fetch visit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handlePlanVisit = async (e) => {
    e.preventDefault();
    if (!location || !date || !purpose) return;

    setSubmitting(true);
    try {
      const payload = {
        location,
        visit_date: new Date(date).toISOString(),
        purpose,
        notes,
      };

      await resources.createVisit(payload);

      // Reset Form
      setLocation('');
      setDate('');
      setPurpose('');
      setNotes('');
      setShowModal(false);
      fetchVisits();
    } catch (err) {
      alert('Failed to log visit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <h1>📍 CM Inspection Visit Logs</h1>
          <span className="page-title-hi">मुख्यमंत्री क्षेत्र निरीक्षण और दौरा लॉग</span>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" id="btn-plan-visit" onClick={() => setShowModal(true)}>
            📍 Plan New Visit / नया दौरा
          </button>
        </div>
      </div>

      {isDemoMode && (
        <div className="alert-banner alert-banner-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span className="alert-banner-icon">ℹ️</span>
          Demo mode active: Displaying simulated inspections.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>Loading inspections...</div>
        </div>
      ) : visits.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <div className="empty-state-icon">📍</div>
              <div className="empty-state-title">No visits planned</div>
              <div className="empty-state-text">Schedule an inspection to review complaints in the field.</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {visits.map((visit) => (
            <div key={visit._id} className="card">
              <div className="card-header" style={{ background: 'var(--color-primary-surface)' }}>
                <div className="card-title" style={{ gap: 'var(--space-4)' }}>
                  <span>📍</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>{visit.location}</div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 400, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      📅 {new Date(visit.visit_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <span className="badge badge-new badge-lg">
                  {visit.complaints_nearby} Nearby / आसपास
                </span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Purpose / उद्देश्य
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{visit.purpose}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Visitor Designation
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                      👤 {visit.visitor_id?.name || 'Chief Minister'} ({visit.visitor_id?.role?.toUpperCase() || 'CM'})
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Resolved during Inspection
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: 'var(--color-green)', marginTop: 4 }}>
                      {visit.resolved_count || 0}
                    </div>
                  </div>
                </div>

                {visit.notes && (
                  <div style={{
                    background: 'var(--color-surface-hover)',
                    padding: 'var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--color-primary)',
                  }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 4 }}>
                      Notes & Directives / सीएम निर्देश
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>{visit.notes}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Visit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal animate-fade-in">
            <div className="modal-header">
              <div className="modal-title">📍 Log/Plan Inspection Visit</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handlePlanVisit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className="form-label">Location / क्षेत्र</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Laxmi Nagar Ward 12, East Delhi"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Visit Date / तिथि</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Purpose / उद्देश्य</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Surprise sanitation audit & sewer line inspection"
                    required
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Notes & Field Directives / दौरा विवरण</label>
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Describe direct orders given on the ground, officer reviews, or citizen testimonials."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ background: 'var(--color-primary)' }} disabled={submitting}>
                    {submitting ? 'Saving...' : 'Plan Visit'}
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
