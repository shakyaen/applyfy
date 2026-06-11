import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Briefcase, CalendarClock, CheckCircle2, ChevronRight,
  GraduationCap, LayoutDashboard, LockKeyhole,
  Trash2, UserPlus, Eye, EyeOff, PlusCircle,
  FileText, Building, Hash, Link, Calendar
} from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const screens = ['Sign Up', 'Student Details', 'Preferences', 'Add Application', 'Success', 'Dashboard'];

function App() {
  const [screen, setScreen] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [profile, setProfile] = useState({ 
    email: '', password: '', firstName: '', middleName: '', lastName: '', phone: '',
    university: '', year: '', studyArea: '' 
  });
  const [preferences, setPreferences] = useState({ jobType: 'Internship', reminder: 'Before deadlines' });
  const [applications, setApplications] = useState([]);
  const [jobForm, setJobForm] = useState({ company: '', role: '', type: 'Internship', deadline: '', source: '', link: '', notes: '' });
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestApp, setLatestApp] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const progress = useMemo(() => Math.round(((screen + 1) / screens.length) * 100), [screen]);
  const goNext = () => { setError(''); setApiError(''); setScreen(s => Math.min(s + 1, screens.length - 1)); };
  const goBack = () => { setError(''); setApiError(''); setScreen(s => Math.max(s - 1, 0)); };

  const validatePassword = (p) => {
    if (p.length < 8) return '8+ characters';
    if (!/[0-9]/.test(p)) return '1 number';
    if (!/[!@#$%^&*]/.test(p)) return '1 symbol';
    if (!/[A-Z]/.test(p)) return '1 uppercase';
    return null;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim()) { setError('First name required'); return; }
    if (!profile.lastName.trim()) { setError('Last name required'); return; }
    if (!profile.email.trim()) { setError('Email required'); return; }
    if (!profile.phone.trim()) { setError('Phone required'); return; }
    const pErr = validatePassword(profile.password);
    if (pErr) { setError(`Password needs: ${pErr}`); return; }
    
    setLoading(true);
    try {
      const { user } = await api.getUser(profile.email);
      if (user) { setError('Email exists. Login instead.'); setLoading(false); return; }
      await api.upsertUser({ 
        email: profile.email, password: profile.password, 
        first_name: profile.firstName, middle_name: profile.middleName, last_name: profile.lastName, 
        phone: profile.phone, university: '', year: '', study_area: '', 
        job_type: preferences.jobType, reminder_pref: preferences.reminder 
      });
      goNext();
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!profile.email) { setError('Email required'); return; }
    if (!profile.password) { setError('Password required'); return; }
    
    setLoading(true);
    try {
      const { user } = await api.getUser(profile.email);
      if (user && user.password === profile.password) {
        setProfile({ 
          email: user.email, firstName: user.first_name || '', middleName: user.middle_name || '', 
          lastName: user.last_name || '', phone: user.phone || '', 
          university: user.university || '', year: user.year || '', studyArea: user.study_area || '', 
          password: profile.password 
        });
        setPreferences({ jobType: user.job_type || 'Internship', reminder: user.reminder_pref || 'Before deadlines' });
        const { applications: apps } = await api.getApplications(profile.email);
        setApplications(apps);
        setScreen(5);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) { 
      setApiError(err.message); 
    }
    finally { setLoading(false); }
  };

  const handleProfile = async (e) => {
    e.preventDefault();
    if (!profile.university || !profile.year || !profile.studyArea) { setError('Complete all fields'); return; }
    setLoading(true);
    try {
      await api.upsertUser({ email: profile.email, password: profile.password, first_name: profile.firstName, middle_name: profile.middleName, last_name: profile.lastName, phone: profile.phone, university: profile.university, year: profile.year, study_area: profile.studyArea, job_type: preferences.jobType, reminder_pref: preferences.reminder });
      goNext();
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const handlePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.upsertUser({ email: profile.email, password: profile.password, first_name: profile.firstName, middle_name: profile.middleName, last_name: profile.lastName, phone: profile.phone, university: profile.university, year: profile.year, study_area: profile.studyArea, job_type: preferences.jobType, reminder_pref: preferences.reminder });
      goNext();
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!jobForm.company || !jobForm.role || !jobForm.deadline) { setError('Company, role, and deadline required'); return; }
    setLoading(true);
    try {
      const reminder = preferences.reminder === 'Weekly summary' ? 'Weekly review' : 'Before deadline';
      const { application } = await api.addApplication({ user_email: profile.email, company: jobForm.company, role: jobForm.role, type: jobForm.type || preferences.jobType, deadline: jobForm.deadline, source: jobForm.source, link: jobForm.link, notes: jobForm.notes, status: 'Applied', reminder });
      setLatestApp(application);
      setApplications(prev => [application, ...prev]);
      setJobForm({ company: '', role: '', type: preferences.jobType, deadline: '', source: '', link: '', notes: '' });
      goNext();
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  const loadApplications = useCallback(async () => {
    if (!profile.email) return;
    setLoading(true);
    try {
      const { applications: apps } = await api.getApplications(profile.email);
      setApplications(apps);
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  }, [profile.email]);

  useEffect(() => { if (screen === 5) loadApplications(); }, [screen, loadApplications]);

  const handleStatusChange = async (id, status) => {
    try { await api.updateStatus(id, status); setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a)); } 
    catch (err) { setApiError(err.message); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteApplication(id); setApplications(apps => apps.filter(a => a.id !== id)); } 
    catch (err) { setApiError(err.message); }
  };

  const showTwoColumns = screen === 0 && !showLogin;

  return (
    <main className={showTwoColumns ? "app-shell" : "dashboard-shell"}>
      {showTwoColumns && (
        <section className="hero-panel">
          <div className="brand-row"><div className="brand-mark"><Briefcase size={28} /></div><div><p className="eyebrow">22877755</p><h1>APPLYFY</h1></div></div>
          <h2>Apply smarter. <span className="gradient-text">Land faster.</span></h2>
          <p>A student-focused job application tracker that replaces messy spreadsheets with fast logging, clear deadlines, and real-time status tracking — backed by Supabase.</p>
          <div className="how-it-works">
            <div className="how-card"><div className="how-icon">📝</div><h3>30-second entry</h3><p>Log applications without friction.</p></div>
            <div className="how-card"><div className="how-icon">⏰</div><h3>Deadline awareness</h3><p>Keep deadlines visible.</p></div>
            <div className="how-card"><div className="how-icon">💾</div><h3>Persistent data</h3><p>Saved to Supabase.</p></div>
          </div>
        </section>
      )}

      <section className="phone-panel">
        <div className="step-header">
          <span>{showLogin ? 'Login' : screens[screen]}</span>
          <span>{!showLogin && screen !== 0 && screen !== 5 ? `${progress}%` : ''}</span>
        </div>
        {!showLogin && screen !== 0 && screen !== 5 && <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>}
        {apiError && <div className="api-error">{apiError}</div>}

        {showLogin && (
          <LoginScreen 
            profile={profile} setProfile={setProfile} error={error} loading={loading} onSubmit={handleLogin}
            onSwitchToSignUp={() => { setShowLogin(false); setError(''); setProfile({ ...profile, password: '' }); }}
            showPassword={showPassword} setShowPassword={setShowPassword}
          />
        )}

        {!showLogin && screen === 0 && (
          <SignUpScreen 
            profile={profile} setProfile={setProfile} error={error} loading={loading} onSubmit={handleSignUp}
            onSwitchToLogin={() => { setShowLogin(true); setError(''); setProfile({ ...profile, password: '' }); }}
            showPassword={showPassword} setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
            validatePassword={validatePassword}
          />
        )}

        {!showLogin && screen === 1 && <ProfileScreen profile={profile} setProfile={setProfile} error={error} loading={loading} onBack={goBack} onSubmit={handleProfile} />}
        {!showLogin && screen === 2 && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} loading={loading} onBack={goBack} onSubmit={handlePreferences} />}
        {!showLogin && screen === 3 && <AddApplicationScreen jobForm={jobForm} setJobForm={setJobForm} preferences={preferences} error={error} loading={loading} onBack={goBack} onSubmit={handleAddApplication} />}
        {!showLogin && screen === 4 && <SuccessScreen latestApp={latestApp} onAddAnother={() => setScreen(3)} onDashboard={() => setScreen(5)} />}
        {!showLogin && screen === 5 && (
          <DashboardScreen 
            applications={applications} loading={loading} onStatusChange={handleStatusChange} 
            onDelete={handleDelete} onAddApplication={() => setScreen(3)}
          />
        )}
      </section>
    </main>
  );
}

function LoginScreen({ profile, setProfile, error, loading, onSubmit, onSwitchToSignUp, showPassword, setShowPassword }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><LockKeyhole size={26} /></div>
      <h2>Welcome back</h2>
      <p>Enter your email and password to access your dashboard.</p>
      <label>Email</label>
      <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="student@email.com" required />
      <label>Password</label>
      <div style={{ position: 'relative' }}>
        <input type={showPassword ? "text" : "password"} value={profile.password} onChange={e => setProfile({ ...profile, password: e.target.value })} placeholder="Enter password" style={{ paddingRight: '40px' }} required />
        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      {loading ? <Loader /> : <button className="primary-btn" type="submit">Login <ChevronRight size={18} /></button>}
      <div style={{ textAlign: 'center', marginTop: 16 }}><span style={{ color: '#6B7280' }}>New to Applyfy? </span><button type="button" onClick={onSwitchToSignUp} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 'bold', cursor: 'pointer' }}>Create account</button></div>
      <small>Your data is stored securely in Supabase.</small>
    </form>
  );
}

function SignUpScreen({ profile, setProfile, error, loading, onSubmit, onSwitchToLogin, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, validatePassword }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const handlePasswordChange = (e) => { const newPwd = e.target.value; setProfile({ ...profile, password: newPwd }); setPasswordError(newPwd ? validatePassword(newPwd) : ''); };
  const handleSubmit = (e) => { e.preventDefault(); if (profile.password !== confirmPassword) { setPasswordError('Passwords do not match'); return; } if (passwordError) return; onSubmit(e); };
  return (
    <form className="screen-card" onSubmit={handleSubmit}>
      <div className="screen-icon"><UserPlus size={26} /></div>
      <h2>Create account</h2>
      <p>Join Applyfy to start tracking your job applications.</p>
      <div className="grid-2"><div><label>First name</label><input value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} placeholder="John" required /></div><div><label>Last name</label><input value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} placeholder="Doe" required /></div></div>
      <div className="grid-2"><div><label>Middle name (opt)</label><input value={profile.middleName} onChange={e => setProfile({ ...profile, middleName: e.target.value })} placeholder="Robert" /></div><div><label>Contact number</label><input type="tel" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} placeholder="+61 4XX XXX XXX" required /></div></div>
      <label>Email</label><input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} placeholder="student@email.com" required />
      <label>Password</label>
      <div style={{ position: 'relative' }}><input type={showPassword ? "text" : "password"} value={profile.password} onChange={handlePasswordChange} placeholder="Create strong password" style={{ paddingRight: 40 }} required /><button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      <small>8+ chars, 1 number, 1 symbol, 1 uppercase</small>
      <label>Confirm password</label>
      <div style={{ position: 'relative' }}><input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ paddingRight: 40 }} required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
      {(error || passwordError) && <p className="error-text">{error || passwordError}</p>}
      {loading ? <Loader /> : <button className="primary-btn" type="submit">Sign up <ChevronRight size={18} /></button>}
      <div style={{ textAlign: 'center', marginTop: 16 }}><span style={{ color: '#6B7280' }}>Already a member? </span><button type="button" onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 'bold', cursor: 'pointer' }}>Login here</button></div>
      <small>By signing up, you agree to our Terms of Service.</small>
    </form>
  );
}

function Loader() { return <div className="loading-overlay"><div className="spinner" /><span>Saving...</span></div>; }

function ProfileScreen({ profile, setProfile, error, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><GraduationCap size={26} /></div>
      <h2>Student details</h2>
      <p>Tell us about your education.</p>
      <label>University</label><input value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })} placeholder="La Trobe University" required />
      <label>Year level</label><select value={profile.year} onChange={e => setProfile({ ...profile, year: e.target.value })} required><option value="">Select</option><option>First year</option><option>Second year</option><option>Third year</option><option>Fourth year</option><option>Recent graduate</option></select>
      <label>Study area</label><input value={profile.studyArea} onChange={e => setProfile({ ...profile, studyArea: e.target.value })} placeholder="Business / IT / Health" required />
      {error && <p className="error-text">{error}</p>}
      {loading ? <Loader /> : <div className="button-row"><button type="button" className="ghost-btn" onClick={onBack}>Back</button><button className="primary-btn" type="submit">Save & Continue</button></div>}
    </form>
  );
}

function PreferencesScreen({ preferences, setPreferences, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><CalendarClock size={26} /></div>
      <h2>Job preferences</h2>
      <p>Set your job type and reminders.</p>
      <label>Primary job type</label><select value={preferences.jobType} onChange={e => setPreferences({ ...preferences, jobType: e.target.value })}><option>Internship</option><option>Graduate role</option><option>Part-time</option><option>Casual</option></select>
      <label>Reminder preference</label><select value={preferences.reminder} onChange={e => setPreferences({ ...preferences, reminder: e.target.value })}><option>Before deadlines</option><option>Weekly summary</option><option>Follow-up reminders</option></select>
      <div className="note-box">Preferences saved to your profile.</div>
      {loading ? <Loader /> : <div className="button-row"><button type="button" className="ghost-btn" onClick={onBack}>Back</button><button className="primary-btn" type="submit">Save & Continue</button></div>}
    </form>
  );
}

function AddApplicationScreen({ jobForm, setJobForm, preferences, error, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><Briefcase size={26} /></div>
      <h2>Add application</h2>
      <p>Log a new job application.</p>
      <div className="grid-2"><div><label>Company</label><input value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} placeholder="Google" required /></div><div><label>Role</label><input value={jobForm.role} onChange={e => setJobForm({ ...jobForm, role: e.target.value })} placeholder="Software Engineer" required /></div></div>
      <div className="grid-2"><div><label>Job type</label><select value={jobForm.type || preferences.jobType} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}><option>Internship</option><option>Graduate role</option><option>Part-time</option><option>Casual</option></select></div><div><label>Deadline</label><input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} required /></div></div>
      <div className="grid-2"><div><label>Source</label><input value={jobForm.source} onChange={e => setJobForm({ ...jobForm, source: e.target.value })} placeholder="LinkedIn" /></div><div><label>Job link</label><input value={jobForm.link} onChange={e => setJobForm({ ...jobForm, link: e.target.value })} placeholder="https://..." /></div></div>
      <label>Notes (optional)</label><textarea value={jobForm.notes || ''} onChange={e => setJobForm({ ...jobForm, notes: e.target.value })} placeholder="Add your notes here..." rows="4" />
      {error && <p className="error-text">{error}</p>}
      {loading ? <Loader /> : <div className="button-row"><button type="button" className="ghost-btn" onClick={onBack}>Back</button><button className="primary-btn" type="submit">Save to Supabase</button></div>}
    </form>
  );
}

function SuccessScreen({ latestApp, onAddAnother, onDashboard }) {
  return (
    <div className="screen-card center-card">
      <div className="success-icon"><CheckCircle2 size={48} /></div>
      <h2>Application saved!</h2>
      <p>{latestApp?.company} – {latestApp?.role} saved to your dashboard.</p>
      <div className="summary-card"><strong>Next step</strong><span>{latestApp?.reminder || 'Reminder before deadline'}</span></div>
      <button className="primary-btn full" onClick={onDashboard}>View tracker</button>
      <button className="ghost-btn full" onClick={onAddAnother}>Add another application</button>
    </div>
  );
}

function DashboardScreen({ applications, loading, onStatusChange, onDelete, onAddApplication }) {
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];
  const [filter, setFilter] = useState('All');
  const stats = { total: applications.length, applied: applications.filter(a => a.status === 'Applied').length, interview: applications.filter(a => a.status === 'Interview').length, offer: applications.filter(a => a.status === 'Offer').length };
  const getSuccessRate = () => stats.total === 0 ? 0 : Math.round((stats.offer / stats.total) * 100);
  const filtered = filter === 'All' ? [...applications] : applications.filter(a => a.status === filter);

  return (
    <div className="screen-card">
      <div className="dashboard-header"><div className="screen-icon"><LayoutDashboard size={26} /></div><div><h2>Tracker dashboard</h2><p>All your applications loaded from Supabase.</p></div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📊</div><div className="stat-value">{stats.total}</div><div className="stat-label">Total applied</div></div>
        <div className="stat-card"><div className="stat-icon">⏳</div><div className="stat-value">{stats.applied}</div><div className="stat-label">In progress</div></div>
        <div className="stat-card"><div className="stat-icon">🎯</div><div className="stat-value">{stats.interview}</div><div className="stat-label">Interviews</div></div>
        <div className="stat-card"><div className="stat-icon">🏆</div><div className="stat-value">{stats.offer}</div><div className="stat-label">Offers</div></div>
        <div className="stat-card success-rate"><div className="stat-icon">📈</div><div className="stat-value">{getSuccessRate()}%</div><div className="stat-label">Success rate</div></div>
      </div>
      <div className="filter-buttons">{['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'].map(f => <button key={f} onClick={() => setFilter(f)} className={`filter-btn ${filter === f ? 'active' : ''}`}>{f}</button>)}</div>
      <button className="primary-btn add-btn" onClick={onAddApplication}><PlusCircle size={18} /> Add New Application</button>
      {loading ? <Loader /> : (
        <div className="application-list">
          {filtered.length === 0 ? <div className="empty-state"><Briefcase size={48} /><p>No applications yet. Click "Add New Application" to start!</p></div> :
            filtered.map(app => (
              <article className="application-item" key={app.id}>
                <div className="application-info">
                  <div className="application-header"><span className="company-name">{app.company}</span><span className="role-name">{app.role}</span><span className="job-type-badge">{app.type}</span></div>
                  <div className="application-meta"><span>📅 {app.deadline ? `${Math.ceil((new Date(app.deadline) - new Date()) / 86400000)} days left` : 'No deadline'}</span><span>🔗 {app.source || 'Manual'}</span></div>
                  {app.notes && <div className="application-notes"><small>📝 {app.notes.length > 100 ? app.notes.substring(0, 100) + '...' : app.notes}</small></div>}
                </div>
                <div className="item-actions">
                  <select value={app.status} onChange={e => onStatusChange(app.id, e.target.value)} className="status-select">{statuses.map(s => <option key={s}>{s}</option>)}</select>
                  <div className="status-badge" data-status={app.status}>{app.status}</div>
                  <button className="delete-btn" onClick={() => onDelete(app.id)}><Trash2 size={14} /> Delete</button>
                </div>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
