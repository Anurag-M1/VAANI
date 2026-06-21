'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { COMPLAINT_CATEGORIES, DELHI_DISTRICTS } from '@/data/complaints';
import { complaints as complaintsApi, resources, clearToken, getStoredUser } from '../lib/api';
import { getSocket, connectSocket } from '../lib/socket';

export default function CitizenPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('file'); // 'file' or 'track'
  const [trackingId, setTrackingId] = useState('');
  const [citizenUser, setCitizenUser] = useState(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setCitizenUser(stored);

    // Re-read user when window regains focus (e.g., after logout/login cycle)
    const handleFocus = () => {
      const fresh = getStoredUser();
      if (fresh) setCitizenUser(fresh);
    };
    const handleStorageChange = () => {
      const fresh = getStoredUser();
      if (fresh) setCitizenUser(fresh);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    setCitizenUser(null);
    clearToken();
    router.push('/');
  };
  
  // File State
  const [formData, setFormData] = useState({
    name: '', phone: '', category: '', district: '', address: '', description: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [filedId, setFiledId] = useState('');
  const [filingError, setFilingError] = useState('');
  const [loading, setLoading] = useState(false);

  // Duplicate check state
  const [duplicateComplaints, setDuplicateComplaints] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  useEffect(() => {
    let active = true;
    const checkDuplicates = async () => {
      if (!formData.category || !formData.district) {
        setDuplicateComplaints([]);
        return;
      }
      const districtObj = DELHI_DISTRICTS.find(d => d.id === formData.district);
      if (!districtObj) return;

      setCheckingDuplicates(true);
      try {
        const res = await complaintsApi.duplicateCheck(districtObj.lat, districtObj.lng, formData.category);
        if (active) {
          if (res && res.duplicates) {
            setDuplicateComplaints(res.duplicates);
          } else {
            setDuplicateComplaints([]);
          }
        }
      } catch (err) {
        console.error('Duplicate check error:', err);
        if (active) setDuplicateComplaints([]);
      } finally {
        if (active) setCheckingDuplicates(false);
      }
    };

    checkDuplicates();
    return () => {
      active = false;
    };
  }, [formData.category, formData.district]);
  const [complaintImage, setComplaintImage] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await resources.notifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (citizenUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // poll fallback

      // Real-time socket support for notifications
      const socket = connectSocket(citizenUser._id, 'citizen');
      if (socket) {
        const handleNewNotification = (notif) => {
          console.log('Real-time notification received in citizen portal:', notif);
          setNotifications((prev) => {
            if (prev.some((n) => n._id === notif.id)) return prev;
            return [
              {
                _id: notif.id,
                event: notif.event,
                message: notif.message,
                complaint_id: notif.complaintId,
                sent_at: notif.timestamp || new Date(),
                is_read: false,
              },
              ...prev,
            ];
          });
        };
        socket.on('notification', handleNewNotification);
        return () => {
          clearInterval(interval);
          socket.off('notification', handleNewNotification);
        };
      }

      return () => clearInterval(interval);
    }
  }, [citizenUser]);

  const handleNotificationClick = async (notif) => {
    try {
      await resources.readNotification(notif._id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
    setShowNotifications(false);
    if (notif.complaint_id) {
      setTrackingLoading(true);
      setTrackError('');
      setTrackedComplaint(null);
      try {
        const res = await complaintsApi.get(notif.complaint_id);
        if (res && res.complaint) {
          setTrackingId(res.complaint.complaint_id);
          setTrackedComplaint(res.complaint);
          setActiveTab('track');
        }
      } catch (err) {
        setTrackingId(notif.complaint_id);
        setActiveTab('track');
      } finally {
        setTrackingLoading(false);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await resources.readAllNotifications();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };


  // Track State
  const [trackedComplaint, setTrackedComplaint] = useState(null);
  const [trackError, setTrackError] = useState('');

  // Subscribe to real-time updates for the tracked complaint
  useEffect(() => {
    if (trackedComplaint?._id) {
      const socket = getSocket();
      if (socket) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit('subscribe-complaint', trackedComplaint._id);
        const handleComplaintUpdated = (data) => {
          console.log('Real-time complaint update received in citizen portal:', data);
          complaintsApi.get(trackedComplaint.complaint_id)
            .then(res => {
              if (res && res.complaint) {
                setTrackedComplaint(res.complaint);
              }
            })
            .catch(err => console.error('Failed to reload complaint:', err));
        };
        socket.on('complaint-updated', handleComplaintUpdated);
        return () => {
          socket.off('complaint-updated', handleComplaintUpdated);
        };
      }
    }
  }, [trackedComplaint?._id]);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingMyComplaints, setLoadingMyComplaints] = useState(false);
  const [myComplaintsError, setMyComplaintsError] = useState('');

  const fetchMyComplaints = async () => {
    if (!citizenUser) return;
    setLoadingMyComplaints(true);
    setMyComplaintsError('');
    try {
      const res = await complaintsApi.myComplaints();
      if (res && res.complaints) {
        setMyComplaints(res.complaints);
      } else {
        throw new Error(res?.error || 'Failed to load your complaints');
      }
    } catch (err) {
      console.error('Failed to load my complaints:', err);
      setMyComplaintsError('Failed to load your complaints list.');
    } finally {
      setLoadingMyComplaints(false);
    }
  };

  useEffect(() => {
    if (citizenUser) {
      fetchMyComplaints();
    } else {
      setMyComplaints([]);
    }
  }, [citizenUser]);

  // Verify State
  const [verifying, setVerifying] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState('');
  // Rating State
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const handleCitizenImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setComplaintImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setComplaintImage(null);
    }
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.district || !formData.address) return;

    setLoading(true);
    setFilingError('');
    try {
      const payload = {
        complaint_text: formData.description,
        category: formData.category || 'sanitation',
        location: {
          address: formData.address,
          district: formData.district,
          coords: { lat: 28.62, lng: 77.22 } // mock default coords
        },
        source: 'web',
        media_urls: complaintImage ? [{ url: complaintImage, type: 'photo', uploaded_at: new Date() }] : []
      };

      const res = await complaintsApi.file(payload);
      if (res && res.success) {
        setFiledId(res.complaint.complaint_id);
        setSubmitted(true);
        fetchMyComplaints(); // Update complaints list after filing a new one
      } else {
        throw new Error(res?.error || 'Filing failed');
      }
    } catch (err) {
      setFilingError(err.message || 'Failed to submit complaint. Using offline simulation mode.');
      // Offline fallback
      const mockId = `VAANI-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*90000+10000)}`;
      setFiledId(mockId);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!trackingId) return;

    setTrackingLoading(true);
    setTrackError('');
    setTrackedComplaint(null);
    try {
      const res = await complaintsApi.get(trackingId);
      if (res && res.complaint) {
        setTrackedComplaint(res.complaint);
      } else {
        throw new Error(res?.error || 'Complaint not found');
      }
    } catch (err) {
      setTrackError('Complaint not found or backend offline. Please verify the ID.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCitizenVerify = async (response) => {
    if (!trackedComplaint) return;
    setVerifying(true);
    setVerifySuccess('');
    try {
      const res = await complaintsApi.citizenVerify(trackedComplaint.complaint_id, response);
      if (res && res.success) {
        setVerifySuccess(response === 'confirmed' ? '✅ Resolution confirmed! Thank you for your feedback.' : '⚠️ Resolution disputed. Case auto-escalated to Nodal Officer.');
        setTimeout(() => {
          setVerifying(false);
          handleTrackSubmit();
        }, 2000);
      } else {
        throw new Error(res?.error || 'Verification failed');
      }
    } catch (err) {
      // Demo fallback
      setVerifySuccess(response === 'confirmed' ? '✅ Resolution confirmed! (Offline Mode)' : '⚠️ Resolution disputed. (Offline Mode)');
      setTimeout(() => {
        setVerifying(false);
        setTrackedComplaint(prev => ({
          ...prev,
          status: response === 'confirmed' ? 'PROVISIONALLY_CLOSED' : 'DISPUTED'
        }));
      }, 2000);
    }
  };

  const handleCitizenRate = async () => {
    if (!trackedComplaint || ratingValue < 1) return;
    try {
      const res = await complaintsApi.citizenRate(trackedComplaint.complaint_id, ratingValue, ratingFeedback);
      if (res && res.success) {
        setRatingSubmitted(true);
        setTimeout(() => {
          handleTrackSubmit();
        }, 2000);
      } else {
        throw new Error(res?.error || 'Rating failed');
      }
    } catch (err) {
      alert(err?.message || 'Failed to submit rating. Please try again.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Government Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
        color: 'white',
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '4px solid var(--color-saffron)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{
              width: 48, height: 48, background: 'rgba(255,255,255,0.15)',
              borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.6rem',
            }}>🏛️</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>VAANI Citizen Portal — नागरिक शिकायत पोर्टल</div>
              <div style={{ opacity: 0.7, fontSize: 'var(--text-sm)' }}>Government of NCT of Delhi | दिल्ली सरकार</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            {/* Notification Bell */}
            {citizenUser && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    color: 'white',
                    borderRadius: '50%',
                    width: 38,
                    height: 38,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    transition: 'background 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                >
                  🔔
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: 'var(--priority-critical)',
                      color: 'white',
                      fontSize: '10px',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      border: '2px solid var(--color-primary)'
                    }}>
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '46px',
                    right: 0,
                    width: '320px',
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    zIndex: 1000,
                    color: 'var(--color-text-primary)'
                  }}>
                    <div style={{
                      padding: 'var(--space-3) var(--space-4)',
                      borderBottom: '1px solid var(--color-border-light)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <strong style={{ fontSize: 'var(--text-sm)' }}>Notifications</strong>
                      {notifications.some(n => !n.is_read) && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: 'var(--text-xs)',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif._id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                              padding: 'var(--space-3) var(--space-4)',
                              borderBottom: '1px solid var(--color-border-light)',
                              cursor: 'pointer',
                              background: notif.is_read ? 'transparent' : 'var(--color-surface-hover)',
                              transition: 'background 0.2s',
                              fontSize: 'var(--text-xs)'
                            }}
                          >
                            <div style={{ fontWeight: notif.is_read ? 500 : 700 }}>
                              {notif.message}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                              {new Date(notif.sent_at || notif.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {citizenUser?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', background: 'rgba(255,255,255,0.12)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'var(--text-sm)' }}>
                  {citizenUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{citizenUser.name}</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.35)',
                color: 'white', borderRadius: 'var(--radius-full)', padding: '8px 18px',
                cursor: 'pointer', fontWeight: 700, fontSize: 'var(--text-sm)', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 4, background: 'linear-gradient(to right, #FF9933 33%, #FFFFFF 33% 66%, #138808 66%)' }} />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
        {/* Tab Toggle */}
        <div style={{
          display: 'flex', marginBottom: 'var(--space-8)',
          background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
          padding: 4, border: '1px solid var(--color-border)',
        }}>
          <button
            className={`btn ${activeTab === 'file' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
            onClick={() => { setActiveTab('file'); setSubmitted(false); }}
            id="tab-file"
          >
            📝 File Complaint / शिकायत दर्ज करें
          </button>
          <button
            className={`btn ${activeTab === 'track' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: 'var(--radius-md)' }}
            onClick={() => { setActiveTab('track'); setTrackedComplaint(null); setTrackError(''); fetchMyComplaints(); }}
            id="tab-track"
          >
            🔍 Track Status / स्थिति जानें
          </button>
        </div>

        {/* FILE COMPLAINT */}
        {activeTab === 'file' && !submitted && (
          <div className="card animate-fade-in">
            <div className="card-header">
              <div className="card-title">
                📝 File New Complaint
                <span className="card-title-hi">नई शिकायत दर्ज करें</span>
              </div>
            </div>
            <div className="card-body">
              {filingError && (
                <div className="alert-banner alert-banner-warning" style={{ marginBottom: 'var(--space-4)' }}>
                  {filingError}
                </div>
              )}
              <form onSubmit={handleFileSubmit}>
                <div className="form-group">
                  <label className="form-label">
                    Full Name / पूरा नाम
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your full name / अपना पूरा नाम दर्ज करें"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number / मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. +91 9999900000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Category / श्रेणी</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%' }}
                    >
                      <option value="">Select Category</option>
                      {COMPLAINT_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">District / जिला</label>
                    <select
                      className="form-select"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      required
                      style={{ width: '100%' }}
                    >
                      <option value="">Select District</option>
                      {DELHI_DISTRICTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name.split('/')[0].trim()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Address / पता <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pincode, locality, building name / पिनकोड, इलाका..."
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Grievance Description / शिकायत का विवरण <span style={{ color: 'var(--priority-critical)' }}>*</span></label>
                  <textarea
                    className="textarea"
                    rows={5}
                    required
                    placeholder="Describe your issue in detail. Hindi or English. Trigger keywords like 'gas leak' will auto-escalate status."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Upload Image of Problem / समस्या की तस्वीर (वैकल्पिक)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleCitizenImageUpload}
                    style={{ width: '100%' }}
                  />
                  {complaintImage && (
                    <div style={{ marginTop: 'var(--space-3)' }}>
                      <img
                        src={complaintImage}
                        alt="Problem Preview"
                        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
                      />
                    </div>
                  )}
                </div>

                {duplicateComplaints && duplicateComplaints.length > 0 && (
                  <div className="alert-banner alert-banner-warning" style={{ marginBottom: 'var(--space-4)', display: 'block' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', fontWeight: 'bold' }}>
                      <span className="alert-banner-icon">⚠️</span>
                      <span>Duplicate Warning: Similar active complaints found nearby! / मिलती-जुलती शिकायतें पहले से दर्ज हैं!</span>
                    </div>
                    <p style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)', opacity: 0.9 }}>
                      Please review the matching active complaints. If your issue is already listed, you can track it instead of filing a duplicate.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {duplicateComplaints.map(dc => (
                        <div key={dc._id} style={{
                          background: 'rgba(255, 255, 255, 0.6)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 'var(--radius-sm)',
                          padding: 'var(--space-2) var(--space-3)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--space-2)'
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                              <span>ID: {dc.complaint_id}</span>
                              <span className={`badge badge-${dc.status?.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{dc.status}</span>
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                              📍 {dc.location?.address} | {dc.complaint_text}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => {
                              setActiveTab('track');
                              setTrackingId(dc.complaint_id);
                              setTrackedComplaint(dc);
                            }}
                            style={{ fontSize: '11px', padding: '4px 8px', height: 'auto', minHeight: '0' }}
                          >
                            🔍 View & Track
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-lg w-full" style={{ width: '100%', marginTop: 'var(--space-4)' }} disabled={loading}>
                  {loading ? 'Filing Complaint...' : '📤 Submit Complaint / शिकायत भेजें'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FILE COMPLAINT SUCCESS */}
        {activeTab === 'file' && submitted && (
          <div className="card animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
            <h2>Complaint Filed Successfully!</h2>
            <p style={{ fontFamily: 'var(--font-hindi)', fontSize: 'var(--text-lg)', color: 'var(--color-text-muted)' }}>शिकायत सफलतापूर्वक दर्ज की गई!</p>
            
            <div style={{
              background: 'var(--color-surface-hover)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              margin: 'var(--space-6) 0',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              border: '1px dashed var(--color-primary)'
            }}>
              Grievance ID: {filedId}
            </div>

            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              Please save this ID to track your complaint status. You will receive an SMS confirmation shortly.
            </p>

            <button className="btn btn-outline" onClick={() => { setSubmitted(false); setComplaintImage(null); setFormData({ name: '', phone: '', category: '', district: '', address: '', description: '' }); }}>
              File Another Complaint
            </button>
          </div>
        )}

        {/* TRACK STATUS */}
        {activeTab === 'track' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🔍 Track Grievance Status</div>
              </div>
              <div className="card-body">
                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Grievance ID (e.g. VAANI-20260621-10001)"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={trackingLoading}>
                    {trackingLoading ? 'Searching...' : 'Search'}
                  </button>
                </form>
                {trackError && <p style={{ color: 'var(--priority-critical)', marginTop: 'var(--space-3)', fontWeight: 600 }}>{trackError}</p>}
              </div>
            </div>

            {/* Raised complaints list by citizen */}
            {citizenUser && (
              <div className="card animate-fade-in" style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title" style={{ fontSize: 'var(--text-base)' }}>
                    📋 Your Raised Complaints / आपकी शिकायतें ({myComplaints.length})
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); fetchMyComplaints(); }}
                    className="btn btn-ghost btn-xs" 
                    title="Refresh List"
                    disabled={loadingMyComplaints}
                    style={{ padding: '4px 8px', fontSize: '11px', height: 'auto', minHeight: 0 }}
                  >
                    {loadingMyComplaints ? '🔄...' : '🔄 Refresh'}
                  </button>
                </div>
                <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto', padding: 'var(--space-4)' }}>
                  {loadingMyComplaints && myComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                      Loading your complaints... / शिकायतें लोड हो रही हैं...
                    </div>
                  ) : myComplaintsError ? (
                    <div style={{ color: 'var(--priority-critical)', textAlign: 'center', padding: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                      {myComplaintsError}
                    </div>
                  ) : myComplaints.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                      No complaints registered yet. / अभी तक कोई शिकायत दर्ज नहीं की गई है।
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {myComplaints.map((c) => {
                        const isSelected = trackedComplaint?.complaint_id === c.complaint_id;
                        return (
                          <div
                            key={c._id}
                            onClick={() => {
                              setTrackingId(c.complaint_id);
                              setTrackedComplaint(c);
                              setTrackError('');
                            }}
                            style={{
                              background: isSelected ? 'rgba(255, 153, 51, 0.08)' : 'var(--color-surface)',
                              border: isSelected ? '1.5px solid var(--color-saffron)' : '1px solid var(--color-border-light)',
                              borderRadius: 'var(--radius-md)',
                              padding: 'var(--space-3) var(--space-4)',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                              transition: 'all 0.2s',
                              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: isSelected ? 'var(--color-primary)' : 'inherit' }}>
                                  {c.complaint_id}
                                </span>
                                <span className={`badge badge-${c.status?.toLowerCase()}`} style={{ fontSize: '10px', padding: '2px 6px', textTransform: 'capitalize' }}>
                                  {c.status?.toLowerCase()?.replace(/_/g, ' ')}
                                </span>
                                {c.priority && ['DEFCON_RED', 'DEFCON_ORANGE'].includes(c.priority) && (
                                  <span style={{
                                    background: c.priority === 'DEFCON_RED' ? 'var(--priority-critical)' : 'var(--priority-major)',
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: 'var(--radius-sm)'
                                  }}>
                                    ⚠️ {c.priority.replace('DEFCON_', '')}
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-secondary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {c.complaint_text}
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                📍 {c.location?.address} • {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </div>
                            <div style={{ fontSize: '1.2rem', color: isSelected ? 'var(--color-saffron)' : 'var(--color-text-muted)' }}>
                              {isSelected ? '👉' : '🔍'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRACK RESULT COMPLAINT DETAILS */}
            {trackedComplaint && (
              <div className="card animate-fade-in">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="card-title">📋 ID: {trackedComplaint.complaint_id}</div>
                  <span className={`badge badge-${trackedComplaint.status?.toLowerCase()}`}>
                    {trackedComplaint.status}
                  </span>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <strong>Description:</strong>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>{trackedComplaint.complaint_text}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                    <div>📍 <strong>Address:</strong> {trackedComplaint.location?.address}</div>
                    <div>🏢 <strong>Department:</strong> {trackedComplaint.department_id?.name || 'MCD'}</div>
                  </div>

                  {/* Anti-False-Closure Citizen Gate */}
                  {trackedComplaint.status === 'PENDING_CLOSURE' && (
                    <div style={{
                      background: '#FFF8E1',
                      border: '2px solid var(--color-saffron)',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      marginTop: 'var(--space-3)'
                    }}>
                      <h4 style={{ margin: '0 0 var(--space-3) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        🛡️ Verify Resolution / समाधान का सत्यापन करें
                      </h4>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                        The field officer has submitted a resolution order. Under VAANI rules, this complaint will not close unless you verify.
                      </p>
                      
                      <div style={{ background: 'white', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                        <strong>Officer Speaking Order:</strong>
                        <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>
                          &ldquo;{trackedComplaint.closure?.speaking_order || 'No description provided'}&rdquo;
                        </p>
                      </div>

                      {verifySuccess ? (
                        <div style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                          {verifySuccess}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-success"
                            style={{ background: 'var(--color-green)', color: 'white', flex: 1 }}
                            onClick={() => handleCitizenVerify('confirmed')}
                            disabled={verifying}
                          >
                            ✅ Resolve / संतुष्ट हूँ
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ background: 'var(--priority-critical)', color: 'white', flex: 1 }}
                            onClick={() => handleCitizenVerify('disputed')}
                            disabled={verifying}
                          >
                            ❌ Dispute / असंतुष्ट हूँ
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Provisionally Closed / Dept Verified / DM Verified — show rating section */}
                  {['PROVISIONALLY_CLOSED', 'DEPT_VERIFIED', 'DM_VERIFIED'].includes(trackedComplaint.status) && !trackedComplaint.citizen_rating && (
                    <div style={{
                      background: 'linear-gradient(135deg, #FFF9E6, #FFF3CC)',
                      border: '2px solid #FFB300',
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-lg)',
                      marginTop: 'var(--space-3)'
                    }}>
                      <h4 style={{ margin: '0 0 var(--space-3) 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                        ⭐ Rate Your Experience / अपना अनुभव रेट करें
                      </h4>
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                        Your complaint has been verified. Please rate the resolution quality to finalize and close the complaint.
                      </p>
                      {ratingSubmitted ? (
                        <div style={{ color: 'var(--color-green)', fontWeight: 700 }}>✅ Thank you for your rating! Complaint closed.</div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-3)', justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => setRatingValue(star)}
                                style={{
                                  fontSize: '2rem',
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transform: ratingValue >= star ? 'scale(1.2)' : 'scale(1)',
                                  transition: 'transform 0.2s',
                                  filter: ratingValue >= star ? 'none' : 'grayscale(100%)',
                                  opacity: ratingValue >= star ? 1 : 0.4,
                                }}
                              >⭐</button>
                            ))}
                          </div>
                          <div style={{ textAlign: 'center', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-3)', color: ratingValue > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                            {ratingValue === 0 ? 'Select a rating' : `${ratingValue}/5 — ${['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingValue]}`}
                          </div>
                          <textarea
                            className="textarea"
                            placeholder="Write your feedback here (optional)... / अपनी प्रतिक्रिया यहाँ लिखें..."
                            value={ratingFeedback}
                            onChange={(e) => setRatingFeedback(e.target.value)}
                            style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }}
                            rows={2}
                          />
                          <button
                            className="btn btn-success"
                            style={{ width: '100%', background: 'var(--color-green)', color: 'white' }}
                            onClick={handleCitizenRate}
                            disabled={ratingValue < 1}
                          >
                            ⭐ Submit Rating & Close / रेटिंग दें और बंद करें
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Already rated + closed */}
                  {trackedComplaint.status === 'CLOSED' && (
                    <div style={{ background: 'var(--color-green-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', color: 'var(--color-green)', fontWeight: 600 }}>
                      ✅ This complaint is resolved and closed. Thank you!
                      {trackedComplaint.citizen_rating && (
                        <div style={{ marginTop: 'var(--space-2)' }}>
                          Your rating: {'⭐'.repeat(trackedComplaint.citizen_rating)} ({trackedComplaint.citizen_rating}/5)
                          {trackedComplaint.citizen_feedback_text && <div style={{ fontWeight: 400, fontStyle: 'italic', marginTop: 4 }}>&quot;{trackedComplaint.citizen_feedback_text}&quot;</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Provisionally closed with rating already given */}
                  {['PROVISIONALLY_CLOSED', 'DEPT_VERIFIED', 'DM_VERIFIED'].includes(trackedComplaint.status) && trackedComplaint.citizen_rating && (
                    <div style={{ background: 'var(--color-green-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--color-green)', fontWeight: 600 }}>
                      ✅ Your rating: {'⭐'.repeat(trackedComplaint.citizen_rating)} ({trackedComplaint.citizen_rating}/5). Awaiting final verification.
                    </div>
                  )}

                  {trackedComplaint.status === 'DISPUTED' && (
                    <div style={{ background: '#FFEBEE', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--priority-critical)', fontWeight: 600 }}>
                      ⚠️ Resolution was disputed. Case is auto-escalated to senior supervisor.
                    </div>
                  )}

                  {/* Timeline / समय-रेखा */}
                  {trackedComplaint.timeline && trackedComplaint.timeline.length > 0 && (
                    <div style={{ marginTop: 'var(--space-6)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-4)' }}>
                      <h4 style={{ margin: '0 0 var(--space-4) 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📜 Timeline / समय-रेखा
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingLeft: 'var(--space-2)' }}>
                        {trackedComplaint.timeline.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: 'var(--space-3)', position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)', zIndex: 2 }} />
                              {idx < trackedComplaint.timeline.length - 1 && (
                                <div style={{ width: '2px', flex: 1, background: 'var(--color-border-light)', margin: '4px 0' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, paddingBottom: idx < trackedComplaint.timeline.length - 1 ? '12px' : 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>{item.event}</div>
                              {item.note && (
                                <div style={{
                                  fontSize: 'var(--text-sm)',
                                  color: 'var(--color-text-secondary)',
                                  background: 'var(--color-surface-hover)',
                                  borderLeft: '3px solid var(--color-primary)',
                                  padding: '6px 12px',
                                  borderRadius: 'var(--radius-sm)',
                                  margin: '6px 0',
                                  fontWeight: 500
                                }}>
                                  &ldquo;{item.note}&rdquo;
                                </div>
                              )}
                              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                {new Date(item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} • {item.actor_role}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
