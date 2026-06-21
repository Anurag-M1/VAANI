'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, setToken, setStoredUser, initAuth } from './lib/api';

const roles = [
  { id: 'cm', label: 'Chief Minister', labelHi: 'मुख्यमंत्री', icon: '🏛️', desc: 'War Room Dashboard', phone: '+919999000001' },
  { id: 'district_officer', label: 'District Magistrate', labelHi: 'जिला मजिस्ट्रेट', icon: '🏢', desc: 'District overview', phone: '+919999000003' },
  { id: 'department_manager', label: 'Dept Manager', labelHi: 'विभाग प्रबंधक', icon: '📋', desc: 'MCD / DJB Admin', phone: '+919999000004' },
  { id: 'officer', label: 'Field Officer', labelHi: 'क्षेत्रीय अधिकारी', icon: '👷', desc: 'Resolution queue', phone: '+919999000005' },
  { id: 'citizen', label: 'Citizen Portal', labelHi: 'नागरिक पोर्टल', icon: '👤', desc: 'Track & file', phone: '+919800000020' },
];

export default function LoginPage() {
  const [step, setStep] = useState('role'); // 'role' → 'otp' → redirect
  const [selectedRole, setSelectedRole] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSubdomainEnforced, setIsSubdomainEnforced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const urlParams = new URLSearchParams(window.location.search);
      const paramSubdomain = urlParams.get('subdomain');
      let subdomain = paramSubdomain || '';

      if (!subdomain) {
        const parts = hostname.split('.');
        if (parts.length > 2 && parts[0] !== 'www') {
          subdomain = parts[0];
        } else if (parts.length > 1 && hostname.includes('localhost') && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      }

      subdomain = subdomain.toLowerCase();

      // Auto-configure roles based on subdomain
      if (subdomain === 'citizen') {
        setSelectedRole('citizen');
        setPhone('+91 9800000020'); // Auto-fill default citizen demo phone
        setIsSubdomainEnforced(true);
      } else if (subdomain === 'officer') {
        setSelectedRole('officer');
        setPhone('+91 9999000005'); // Auto-fill default officer demo phone
        setIsSubdomainEnforced(true);
      } else if (subdomain === 'cm') {
        setSelectedRole('cm');
        setPhone('+91 9999000001'); // Auto-fill CM phone
        setIsSubdomainEnforced(true);
      } else if (subdomain === 'dm') {
        setSelectedRole('district_officer');
        setPhone('+91 9999000003'); // Auto-fill DM phone
        setIsSubdomainEnforced(true);
      } else if (subdomain === 'dept') {
        setSelectedRole('department_manager');
        setPhone('+91 9999000004'); // Auto-fill Dept phone
        setIsSubdomainEnforced(true);
      }
    }
  }, []);

  const handlePhoneChange = (e) => {
    let input = e.target.value;
    
    // Always ensure +91 prefix
    if (!input.startsWith('+91')) {
      let digits = input.replace(/\D/g, '');
      if (digits.startsWith('91')) {
        digits = digits.slice(2);
      }
      input = '+91' + digits;
    }
    
    // Extract suffix after +91
    let suffix = input.substring(3);
    let digits = suffix.replace(/\D/g, '').slice(0, 10);
    
    setPhone('+91 ' + digits);
  };

  const isPhoneValid = phone.replace(/\D/g, '').length === 12;

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!isPhoneValid) return;
    setIsLoading(true);
    setError('');

    const cleanPhone = phone.replace(/\s+/g, '');
    const result = await auth.sendOtp(cleanPhone);
    setIsLoading(false);

    if (result.success) {
      setOtpSent(true);
      setStep('otp');
    } else {
      setError(result.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    setError('');

    const cleanPhone = phone.replace(/\s+/g, '');
    const result = await auth.verifyOtp(cleanPhone, otp);
    setIsLoading(false);

    if (result.success) {
      setToken(result.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaani_refresh', result.refreshToken);
      }
      setStoredUser(result.user);

      // Route based on role
      if (result.user.role === 'citizen') {
        router.push('/citizen');
      } else if (result.user.role === 'officer') {
        router.push('/officer');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(result.error || 'Invalid OTP');
    }
  };

  const handleQuickDemo = async (role) => {
    setSelectedRole(role.id);
    setIsLoading(true);
    setError('');

    const formattedPhone = role.phone.startsWith('+91') && !role.phone.startsWith('+91 ')
      ? '+91 ' + role.phone.slice(3)
      : role.phone;
    setPhone(formattedPhone);

    const cleanPhone = role.phone.replace(/\s+/g, '');

    // Send OTP
    await auth.sendOtp(cleanPhone);

    // Auto-verify with demo OTP
    const result = await auth.verifyOtp(cleanPhone, '123456');
    setIsLoading(false);

    if (result.success) {
      setToken(result.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaani_refresh', result.refreshToken);
      }
      setStoredUser(result.user);

      if (result.user.role === 'citizen') {
        router.push('/citizen');
      } else if (result.user.role === 'officer') {
        router.push('/officer');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Fallback: direct navigation for demo without backend
      if (role.id === 'citizen') router.push('/citizen');
      else if (role.id === 'officer') router.push('/officer');
      else router.push('/dashboard');
    }
  };

  return (
    <div className="login-page">
      {/* Tricolor top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: 'linear-gradient(to right, #FF9933 33%, #FFFFFF 33% 66%, #138808 66%)',
        zIndex: 10,
      }} />

      <div className="login-card">
        <div className="login-header">
          <div className="login-emblem">🏛️</div>
          <h1 className="login-title" style={{ letterSpacing: '2px' }}>VAANI</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600, letterSpacing: '0.5px', marginTop: '2px' }}>
            Vigilant Administration & Accountability Network Intelligence
          </p>
          <p className="login-subtitle">मुख्यमंत्री शिकायत प्रबंधन प्रणाली</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Government of NCT of Delhi | दिल्ली सरकार
          </p>
          <div className="login-tricolor" />
        </div>

        {error && (
          <div style={{
            background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3) var(--space-4)', color: '#C62828', fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-4)', textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <>
            {!isSubdomainEnforced ? (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                  Select Role / भूमिका चुनें
                </p>
                <div className="login-role-grid">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      className={`login-role-btn ${selectedRole === role.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedRole(role.id);
                        const formattedPhone = role.phone.startsWith('+91') && !role.phone.startsWith('+91 ')
                          ? '+91 ' + role.phone.slice(3)
                          : role.phone;
                        setPhone(formattedPhone);
                      }}
                      id={`role-${role.id}`}
                    >
                      <span className="login-role-icon">{role.icon}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }} className="login-role-text-container">
                        <span className="login-role-label">{role.label}</span>
                        <span className="login-role-label-hi">{role.labelHi}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-6)',
                backdropFilter: 'blur(8px)',
              }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>
                  {roles.find(r => r.id === (selectedRole === 'district_officer' ? 'district_officer' : selectedRole === 'department_manager' ? 'department_manager' : selectedRole))?.icon || '🏛️'}
                </span>
                <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-primary)', display: 'block' }}>
                  {roles.find(r => r.id === (selectedRole === 'district_officer' ? 'district_officer' : selectedRole === 'department_manager' ? 'department_manager' : selectedRole))?.label} Access Portal
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {roles.find(r => r.id === (selectedRole === 'district_officer' ? 'district_officer' : selectedRole === 'department_manager' ? 'department_manager' : selectedRole))?.labelHi} अधिकृत लॉगिन
                </span>
              </div>
            )}

            {/* OTP Login Form */}
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">
                  Mobile Number / मोबाइल नंबर
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+91 XXXXXXXXXX"
                  value={phone}
                  onChange={handlePhoneChange}
                  id="login-phone"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={!isPhoneValid || isLoading}
                id="login-send-otp"
                style={{ width: '100%', marginTop: 'var(--space-4)' }}
              >
                {isLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      width: 20, height: 20,
                      border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                      borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block'
                    }} />
                    Sending OTP...
                  </span>
                ) : (
                  <>📱 Send OTP / OTP भेजें</>
                )}
              </button>
            </form>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{
              background: 'var(--color-green-surface)', padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)',
              textAlign: 'center', fontSize: 'var(--text-sm)',
            }}>
              ✅ OTP sent to <strong>{phone}</strong>
              {process.env.NEXT_PUBLIC_DEMO_MODE !== 'false' && (
                <div style={{ marginTop: 4, color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  Demo OTP: <strong>123456</strong>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Enter OTP / OTP दर्ज करें
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                id="login-otp"
                style={{ fontSize: 'var(--text-2xl)', textAlign: 'center', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={otp.length < 6 || isLoading}
              id="login-verify"
              style={{ width: '100%', marginTop: 'var(--space-4)' }}
            >
              {isLoading ? 'Verifying...' : '🔐 Verify & Login / सत्यापित करें'}
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setStep('role'); setOtp(''); setError(''); }}
              style={{ width: '100%', marginTop: 'var(--space-3)' }}
            >
              ← Change Number / नंबर बदलें
            </button>
          </form>
        )}

        {/* Quick Demo Access */}
        <div className="login-quick-demo">
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-3)', textTransform: 'uppercase',
            letterSpacing: '1px', fontWeight: 600
          }}>
            Quick Demo Access (No OTP needed)
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => handleQuickDemo(roles.find(r => r.id === 'cm'))} id="demo-cm">
              🏛️ CM View
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleQuickDemo(roles.find(r => r.id === 'officer'))} id="demo-officer">
              👷 Officer View
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleQuickDemo(roles.find(r => r.id === 'citizen'))} id="demo-citizen">
              👤 Citizen View
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2026 Government of NCT of Delhi</p>
          <p style={{ fontFamily: 'var(--font-hindi)' }}>दिल्ली राष्ट्रीय राजधानी क्षेत्र सरकार</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
