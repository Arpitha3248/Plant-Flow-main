import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Factory, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../auth/AuthContext';

interface LocationState { from?: { pathname: string } }

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, session } = useAuth();
  const location = useLocation();
  const locState = location.state as LocationState | null;

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(false);
  const [showPw,       setShowPw]       = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [errorMsg,     setErrorMsg]     = useState('');
  const [fieldErr,     setFieldErr]     = useState<{ email?: string; pw?: string }>({});
  const [appVersion,   setAppVersion]   = useState('1.0.0');
  const [dest,         setDest]         = useState<string | null>(null);

  useEffect(() => {
    window.desktopAPI?.getAppInfo().then(i => setAppVersion(i.version)).catch(() => {});
  }, []);  // runs once only — safe

  // ── Already logged in: redirect at render time (NO useEffect — prevents loops) ──
  if (isAuthenticated && session) {
    const from = locState?.from?.pathname;
    const to = (from && from !== '/login') ? from : (session.role === 'ADMIN' ? '/admin' : '/plantflow');
    return <Navigate to={to} replace />;
  }

  // ── After successful login: one render with dest set → Navigate away ──
  if (dest) return <Navigate to={dest} replace />;

  function validate() {
    const e: { email?: string; pw?: string } = {};
    if (!email.trim())                                        e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!password)                                            e.pw = 'Password is required.';
    else if (password.length < 6)                             e.pw = 'Minimum 6 characters.';
    setFieldErr(e);
    return !e.email && !e.pw;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await login({ email: email.trim(), password, rememberMe });
      if (res.success) {
        const from = locState?.from?.pathname;
        const restored = authService.restoreSession();
        const to = (from && from !== '/login') ? from : (restored?.role === 'ADMIN' ? '/admin' : '/plantflow');
        setDest(to);   // triggers one re-render → Navigate
      } else {
        setErrorMsg(res.error ?? 'Login failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inp = (extra: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    border: '1px solid #e2e8f0', outline: 'none', boxSizing: 'border-box',
    color: '#1e293b', background: 'white', ...extra,
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#f1f5f9 0%,#f8fafc 50%,#eef2ff 100%)', padding: 16, fontFamily: 'Inter,sans-serif' }}>

      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:64, height:64, borderRadius:16, background:'linear-gradient(135deg,#4f46e5,#6366f1)',
            boxShadow:'0 8px 20px rgba(79,70,229,.35)', marginBottom:14 }}>
            <Factory style={{ width:32, height:32, color:'white' }} />
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#1e293b', margin:0 }}>PlantFlow</h1>
          <p style={{ fontSize:12, color:'#64748b', marginTop:4, fontWeight:500 }}>
            Industrial Digital Twin &amp; Plant Process Management
          </p>
        </div>

        {/* Card */}
        <div style={{ background:'white', borderRadius:18, border:'1px solid #e2e8f0',
          boxShadow:'0 20px 50px rgba(0,0,0,.09)', overflow:'hidden' }}>

          <div style={{ padding:'24px 28px 18px', borderBottom:'1px solid #f1f5f9' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#1e293b', margin:0 }}>Sign In</h2>
            <p style={{ fontSize:12, color:'#94a3b8', margin:'4px 0 0' }}>
              Enter your credentials to access the platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding:'22px 28px', display:'flex', flexDirection:'column', gap:16 }} noValidate>

            {errorMsg && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
                background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, color:'#b91c1c', fontSize:13 }}>
                <AlertCircle style={{ width:15, height:15, flexShrink:0 }} />{errorMsg}
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                  width:15, height:15, color:'#94a3b8', pointerEvents:'none' }} />
                <input type="email" autoComplete="email" value={email} placeholder="you@plantflow.local"
                  onChange={e => { setEmail(e.target.value); setFieldErr(p=>({...p,email:undefined})); setErrorMsg(''); }}
                  style={inp({ paddingLeft:36, borderColor: fieldErr.email ? '#f87171' : '#e2e8f0' })} />
              </div>
              {fieldErr.email && <p style={{ fontSize:11, color:'#dc2626', margin:'3px 0 0' }}>{fieldErr.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#475569',
                textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5 }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                  width:15, height:15, color:'#94a3b8', pointerEvents:'none' }} />
                <input type={showPw?'text':'password'} autoComplete="current-password" value={password} placeholder="••••••••"
                  onChange={e => { setPassword(e.target.value); setFieldErr(p=>({...p,pw:undefined})); setErrorMsg(''); }}
                  style={inp({ paddingLeft:36, paddingRight:38, borderColor: fieldErr.pw ? '#f87171' : '#e2e8f0' })} />
                <button type="button" onClick={()=>setShowPw(v=>!v)} tabIndex={-1}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:0 }}>
                  {showPw ? <EyeOff style={{width:15,height:15}}/> : <Eye style={{width:15,height:15}}/>}
                </button>
              </div>
              {fieldErr.pw && <p style={{ fontSize:11, color:'#dc2626', margin:'3px 0 0' }}>{fieldErr.pw}</p>}
            </div>

            {/* Remember me */}
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              <div onClick={()=>setRememberMe(v=>!v)} style={{ width:15, height:15, borderRadius:4, flexShrink:0,
                border:`2px solid ${rememberMe?'#4f46e5':'#cbd5e1'}`, background:rememberMe?'#4f46e5':'white',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                {rememberMe && <CheckCircle style={{width:10,height:10,color:'white'}}/>}
              </div>
              <span style={{ fontSize:12, color:'#475569', fontWeight:500 }}>Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              style={{ width:'100%', padding:'11px 0', background: submitting?'#818cf8':'#4f46e5',
                color:'white', fontWeight:700, fontSize:14, borderRadius:11, border:'none',
                cursor: submitting?'not-allowed':'pointer', display:'flex', alignItems:'center',
                justifyContent:'center', gap:8, boxShadow:'0 4px 14px rgba(79,70,229,.3)', transition:'background .15s' }}>
              {submitting ? <><Loader style={{width:15,height:15,animation:'spin 1s linear infinite'}}/><span>Signing in…</span></> : 'Sign In'}
            </button>
          </form>

          {/* Dev creds */}
          <div style={{ padding:'0 28px 22px' }}>
            <div style={{ padding:'11px 13px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10 }}>
              <p style={{ fontSize:10, fontWeight:800, color:'#92400e', textTransform:'uppercase',
                letterSpacing:'0.08em', margin:'0 0 5px' }}>⚠ Development Only</p>
              <p style={{ fontSize:11, color:'#92400e', fontFamily:'monospace', margin:'2px 0' }}>
                Admin: admin@plantflow.local / Admin@1234</p>
              <p style={{ fontSize:11, color:'#92400e', fontFamily:'monospace', margin:'2px 0' }}>
                Operator: operator@plantflow.local / Operator@1234</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:18 }}>
          <p style={{ fontSize:11, color:'#94a3b8', margin:0 }}>PlantFlow v{appVersion} · Industrial Process Management</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:5 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981' }}/>
            <span style={{ fontSize:10, color:'#94a3b8' }}>System Operational</span>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};
