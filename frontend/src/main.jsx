import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Briefcase, CalendarClock, CheckCircle2, ChevronRight,
  GraduationCap, LayoutDashboard, LockKeyhole, ShieldCheck,
  Sparkles, Trash2, UserPlus, Eye, EyeOff, Phone, Mail, User, PlusCircle,
  FileText, Building, Hash, Link, Calendar, Briefcase as JobIcon
} from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const screens = ['Sign Up', 'Student Details', 'Preferences', 'Add Application', 'Success', 'Dashboard'];

// ─────────────────────────────────────────
// Root App
// ─────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [profile, setProfile] = useState({ 
    email: '', 
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    university: '', 
    year: '', 
    studyArea: '' 
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

  function goNext() { setError(''); setApiError(''); setScreen(s => Math.min(s + 1, screens.length - 1)); }
  function goBack() { setError(''); setApiError(''); setScreen(s => Math.max(s - 1, 0)); }

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[0-9]/.test(password)) return 'Password must contain at least 1 number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least 1 symbol (!@#$%^&*)';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter';
    return null;
  };

  async function handleSignUp(e) {
    e.preventDefault();
    if (!profile.firstName.trim()) { setError('First name is required'); return; }
    if (!profile.lastName.trim()) { setError('Last name is required'); return; }
    if (!profile.email.trim()) { setError('Email address is required'); return; }
    if (!profile.phone.trim()) { setError('Contact number is required'); return; }
    if (!profile.password) { setError('Password is required'); return; }
    
    const passwordError = validatePassword(profile.password);
    if (passwordError) { setError(passwordError); return; }
    
    setLoading(true);
    try {
      const { user } = await api.getUser(profile.email.trim());
      if (user) {
        setError('An account with this email already exists. Please login instead.');
        setLoading(false);
        return;
      }
      
      await api.upsertUser({
        email: profile.email,
        password: profile.password,
        first_name: profile.firstName,
        middle_name: profile.middleName,
        last_name: profile.lastName,
        phone: profile.phone,
        university: '',
        year: '',
        study_area: '',
        job_type: preferences.jobType,
        reminder_pref: preferences.reminder,
      });
      
      goNext();
    } catch (err) {
      setApiError(`Sign up failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    if (!profile.email.trim()) { setError('Please enter your email address.'); return; }
    if (!profile.password) { setError('Please enter your password.'); return; }
    
    setLoading(true);
    try {
      const { user } = await api.getUser(profile.email.trim());
      if (user && user.password === profile.password) {
        setProfile({
          email: user.email,
          firstName: user.first_name || '',
          middleName: user.middle_name || '',
          lastName: user.last_name || '',
          phone: user.phone || '',
          university: user.university || '',
          year: user.year || '',
          studyArea: user.study_area || '',
          password: profile.password,
        });
        setPreferences({ jobType: user.job_type || 'Internship', reminder: user.reminder_pref || 'Before deadlines' });
        
        const { applications: apps } = await api.getApplications(profile.email.trim());
        setApplications(apps);
        
        setScreen(5);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setApiError(`Login error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleProfile(e) {
    e.preventDefault();
    if (!profile.university || !profile.year || !profile.studyArea.trim()) {
      setError('Please complete all fields.');
      return;
    }
    setLoading(true);
    try {
      await api.upsertUser({
        email: profile.email,
        password: profile.password,
        first_name: profile.firstName,
        middle_name: profile.middleName,
        last_name: profile.lastName,
        phone: profile.phone,
        university: profile.university,
        year: profile.year,
        study_area: profile.studyArea,
        job_type: preferences.jobType,
        reminder_pref: preferences.reminder,
      });
      goNext();
    } catch (err) {
      setApiError(`Could not save profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handlePreferences(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.upsertUser({
        email: profile.email,
        password: profile.password,
        first_name: profile.firstName,
        middle_name: profile.middleName,
        last_name: profile.lastName,
        phone: profile.phone,
        university: profile.university,
        year: profile.year,
        study_area: profile.studyArea,
        job_type: preferences.jobType,
        reminder_pref: preferences.reminder,
      });
      goNext();
    } catch (err) {
      setApiError(`Could not save preferences: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddApplication(e) {
    e.preventDefault();
    if (!jobForm.company.trim() || !jobForm.role.trim() || !jobForm.deadline) {
      setError('Company, role title, and deadline are required.');
      return;
    }
    setLoading(true);
    try {
      const reminder = preferences.reminder === 'Weekly summary'
        ? 'Included in weekly review'
        : 'Reminder before deadline';
      const { application } = await api.addApplication({
        user_email: profile.email,
        company: jobForm.company,
        role: jobForm.role,
        type: jobForm.type || preferences.jobType,
        deadline: jobForm.deadline,
        source: jobForm.source,
        link: jobForm.link,
        notes: jobForm.notes,
        status: 'Applied',
        reminder,
      });
      setLatestApp(application);
      setApplications(prev => [application, ...prev]);
      setJobForm({ company: '', role: '', type: preferences.jobType, deadline: '', source: '', link: '', notes: '' });
      goNext();
    } catch (err) {
      setApiError(`Could not save application: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const loadApplications = useCallback(async () => {
    if (!profile.email) return;
    setLoading(true);
    try {
      const { applications: apps } = await api.getApplications(profile.email);
      setApplications(apps);
    } catch (err) {
      setApiError(`Could not load applications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [profile.email]);

  useEffect(() => {
    if (screen === 5) loadApplications();
  }, [screen, loadApplications]);

  async function handleStatusChange(id, status) {
    try {
      await api.updateStatus(id, status);
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      setApiError(`Status update failed: ${err.message}`);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteApplication(id);
      setApplications(apps => apps.filter(a => a.id !== id));
    } catch (err) {
      setApiError(`Delete failed: ${err.message}`);
    }
  }

  // TWO COLUMN LAYOUT ONLY for Sign Up (screen === 0 AND showLogin === false)
  // ALL other screens (Login, Dashboard, etc.) use SINGLE COLUMN
  const isTwoColumnLayout = (screen === 0 && showLogin === false);

  return (
    <main className={isTwoColumnLayout ? "app-shell" : "dashboard-shell"}>
      {/* Hero Panel - ONLY visible on Sign Up page (two column layout) */}
      {isTwoColumnLayout && (
        <section className="hero-panel">
          <div className="brand-row">
            <div className="brand-mark"><Briefcase size={26} /></div>
            <div>
              <p className="eyebrow">22877755</p>
              <h1>APPLYFY</h1>
            </div>
          </div>
          <h2>Apply smarter. <span className="gradient-text">Land faster.</span></h2>
          <p>
            A student-focused job application tracker that replaces messy spreadsheets with fast logging, clear deadlines, and real-time status tracking — backed by Supabase.
          </p>
          <div className="how-it-works">
            <div className="how-card">
              <div className="how-icon">📝</div>
              <h3>30-second entry</h3>
              <p>Log job applications quickly without spreadsheet friction.</p>
            </div>
            <div className="how-card">
              <div className="how-icon">⏰</div>
              <h3>Deadline awareness</h3>
              <p>Keep upcoming deadlines and follow-ups visible.</p>
            </div>
            <div className="how-card">
              <div className="how-icon">💾</div>
              <h3>Persistent data</h3>
              <p>Your applications are saved to Supabase and available next time you log in.</p>
            </div>
          </div>
        </section>
      )}

      <section className="phone-panel">
        <div className="step-header">
          <span>{showLogin ? 'Login' : screens[screen]}</span>
          <span>{!showLogin && screen !== 0 && screen !== 5 ? `${progress}%` : ''}</span>
        </div>
        {!showLogin && screen !== 0 && screen !== 5 && <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>}
        
        {apiError && <div className="api-error" style={{ marginBottom: 12 }}>{apiError}</div>}

        {/* LOGIN SCREEN */}
        {showLogin && (
          <LoginScreen 
            profile={profile} 
            setProfile={setProfile} 
            error={error} 
            loading={loading} 
            onSubmit={handleLogin}
            onSwitchToSignUp={() => {
              setShowLogin(false);
              setError('');
              setProfile({ ...profile, password: '' });
            }}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />
        )}

        {/* SIGN UP SCREEN */}
        {!showLogin && screen === 0 && (
          <SignUpScreen 
            profile={profile} 
            setProfile={setProfile} 
            error={error} 
            loading={loading} 
            onSubmit={handleSignUp}
            onSwitchToLogin={() => {
              setShowLogin(true);
              setError('');
              setProfile({ ...profile, password: '' });
            }}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            validatePassword={validatePassword}
          />
        )}

        {/* OTHER SCREENS */}
        {!showLogin && screen === 1 && <ProfileScreen profile={profile} setProfile={setProfile} error={error} loading={loading} onBack={goBack} onSubmit={handleProfile} />}
        {!showLogin && screen === 2 && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} loading={loading} onBack={goBack} onSubmit={handlePreferences} />}
        {!showLogin && screen === 3 && <AddApplicationScreen jobForm={jobForm} setJobForm={setJobForm} preferences={preferences} error={error} loading={loading} onBack={goBack} onSubmit={handleAddApplication} />}
        {!showLogin && screen === 4 && <SuccessScreen latestApp={latestApp} onAddAnother={() => setScreen(3)} onDashboard={() => setScreen(5)} />}
        {!showLogin && screen === 5 && (
          <DashboardScreen 
            applications={applications} 
            loading={loading} 
            onStatusChange={handleStatusChange} 
            onDelete={handleDelete} 
            onAddApplication={() => setScreen(3)}
          />
        )}
      </section>
    </main>
  );
}

// ─────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────
function LoginScreen({ profile, setProfile, error, loading, onSubmit, onSwitchToSignUp, showPassword, setShowPassword }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><LockKeyhole /></div>
      <h2>Welcome back</h2>
      <p>Enter your email and password to access your dashboard.</p>
      
      <label>Email address
        <input 
          type="email" 
          value={profile.email} 
          onChange={e => setProfile({ ...profile, email: e.target.value })} 
          placeholder="student@email.com" 
          required
        />
      </label>
      
      <label>Password
        <div style={{ position: 'relative' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            value={profile.password} 
            onChange={e => setProfile({ ...profile, password: e.target.value })} 
            placeholder="Enter your password" 
            style={{ paddingRight: '40px' }}
            required
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)} 
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      
      {error && <p className="error-text">{error}</p>}
      
      {loading ? <Loader /> : (
        <button className="primary-btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>
          Login <ChevronRight size={18} />
        </button>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span style={{ color: '#6B7280' }}>New to Applyfy? </span>
        <button 
          type="button" 
          onClick={onSwitchToSignUp} 
          style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Create an account
        </button>
      </div>
      
      <small>Your data is stored securely in Supabase.</small>
    </form>
  );
}

// ─────────────────────────────────────────
// SIGN UP SCREEN
// ─────────────────────────────────────────
function SignUpScreen({ profile, setProfile, error, loading, onSubmit, onSwitchToLogin, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, validatePassword }) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setProfile({ ...profile, password: newPassword });
    setPasswordError(newPassword ? validatePassword(newPassword) : '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (profile.password !== confirmPassword) { 
      setPasswordError('Passwords do not match'); 
      return; 
    }
    if (passwordError) return;
    onSubmit(e);
  };

  return (
    <form className="screen-card" onSubmit={handleSubmit}>
      <div className="screen-icon"><UserPlus /></div>
      <h2>Create your account</h2>
      <p>Join Applyfy to start tracking your job applications.</p>
      
      <div className="grid-2">
        <label>First name
          <input 
            value={profile.firstName} 
            onChange={e => setProfile({ ...profile, firstName: e.target.value })} 
            placeholder="John" 
            required
          />
        </label>
        <label>Last name
          <input 
            value={profile.lastName} 
            onChange={e => setProfile({ ...profile, lastName: e.target.value })} 
            placeholder="Doe" 
            required
          />
        </label>
      </div>
      
      <div className="grid-2">
        <label>Middle name (optional)
          <input 
            value={profile.middleName} 
            onChange={e => setProfile({ ...profile, middleName: e.target.value })} 
            placeholder="Robert" 
          />
        </label>
        <label>Contact number
          <input 
            type="tel" 
            value={profile.phone} 
            onChange={e => setProfile({ ...profile, phone: e.target.value })} 
            placeholder="+61 4XX XXX XXX" 
            required
          />
        </label>
      </div>
      
      <label>Email address
        <input 
          type="email" 
          value={profile.email} 
          onChange={e => setProfile({ ...profile, email: e.target.value })} 
          placeholder="student@email.com" 
          required
        />
      </label>
      
      <label>Password
        <div style={{ position: 'relative' }}>
          <input 
            type={showPassword ? "text" : "password"} 
            value={profile.password}
            onChange={handlePasswordChange}
            placeholder="Create a strong password"
            style={{ paddingRight: '40px' }}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <small style={{ fontSize: '11px', marginTop: '4px' }}>
          Must be at least 8 characters, include 1 number, 1 symbol, and 1 uppercase letter
        </small>
      </label>
      
      <label>Confirm password
        <div style={{ position: 'relative' }}>
          <input 
            type={showConfirmPassword ? "text" : "password"} 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            style={{ paddingRight: '40px' }}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      
      {(error || passwordError) && <p className="error-text">{error || passwordError}</p>}
      
      {loading ? <Loader /> : (
        <button className="primary-btn" type="submit" style={{ width: '100%', marginTop: '16px' }}>
          Sign up <ChevronRight size={18} />
        </button>
      )}
      
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <span style={{ color: '#6B7280' }}>Already a member? </span>
        <button 
          type="button" 
          onClick={onSwitchToLogin} 
          style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Login here
        </button>
      </div>
      
      <small>By signing up, you agree to our Terms of Service.</small>
    </form>
  );
}

function Loader() {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <span>Saving to Supabase…</span>
    </div>
  );
}

function ProfileScreen({ profile, setProfile, error, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><GraduationCap /></div>
      <h2>Student details</h2>
      <p>Tell us about your education to personalise your experience.</p>
      
      <label>University
        <input 
          value={profile.university} 
          onChange={e => setProfile({ ...profile, university: e.target.value })} 
          placeholder="La Trobe University" 
          required
        />
      </label>
      
      <label>Year level
        <select value={profile.year} onChange={e => setProfile({ ...profile, year: e.target.value })} required>
          <option value="">Select year</option>
          <option>First year</option>
          <option>Second year</option>
          <option>Third year</option>
          <option>Fourth year</option>
          <option>Recent graduate</option>
        </select>
      </label>
      
      <label>Study area
        <input 
          value={profile.studyArea} 
          onChange={e => setProfile({ ...profile, studyArea: e.target.value })} 
          placeholder="Business / IT / Health" 
          required
        />
      </label>
      
      {error && <p className="error-text">{error}</p>}
      
      {loading ? <Loader /> : (
        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={onBack}>Back</button>
          <button className="primary-btn" type="submit">Save & Continue</button>
        </div>
      )}
    </form>
  );
}

function PreferencesScreen({ preferences, setPreferences, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><CalendarClock /></div>
      <h2>Job preferences</h2>
      <p>Set your job type and reminder preferences.</p>
      
      <label>Primary job type
        <select value={preferences.jobType} onChange={e => setPreferences({ ...preferences, jobType: e.target.value })}>
          <option>Internship</option>
          <option>Graduate role</option>
          <option>Part-time</option>
          <option>Casual</option>
        </select>
      </label>
      
      <label>Reminder preference
        <select value={preferences.reminder} onChange={e => setPreferences({ ...preferences, reminder: e.target.value })}>
          <option>Before deadlines</option>
          <option>Weekly summary</option>
          <option>Follow-up reminders</option>
        </select>
      </label>
      
      <div className="note-box">Preferences are saved to your profile for future sessions.</div>
      
      {loading ? <Loader /> : (
        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={onBack}>Back</button>
          <button className="primary-btn" type="submit">Save & Continue</button>
        </div>
      )}
    </form>
  );
}

function AddApplicationScreen({ jobForm, setJobForm, preferences, error, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><Briefcase /></div>
      <h2>Add application</h2>
      <p>Log a new job application to your tracker.</p>
      
      <div className="grid-2">
        <label><Building size={14} /> Company
          <input value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} placeholder="e.g., Google, Atlassian" required />
        </label>
        <label><Hash size={14} /> Role
          <input value={jobForm.role} onChange={e => setJobForm({ ...jobForm, role: e.target.value })} placeholder="e.g., Software Engineer" required />
        </label>
      </div>
      
      <div className="grid-2">
        <label><JobIcon size={14} /> Job type
          <select value={jobForm.type || preferences.jobType} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}>
            <option>Internship</option>
            <option>Graduate role</option>
            <option>Part-time</option>
            <option>Casual</option>
          </select>
        </label>
        <label><Calendar size={14} /> Deadline
          <input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} required />
        </label>
      </div>
      
      <div className="grid-2">
        <label><Briefcase size={14} /> Source
          <input value={jobForm.source} onChange={e => setJobForm({ ...jobForm, source: e.target.value })} placeholder="LinkedIn / Seek / Company site" />
        </label>
        <label><Link size={14} /> Job link
          <input value={jobForm.link} onChange={e => setJobForm({ ...jobForm, link: e.target.value })} placeholder="https://..." />
        </label>
      </div>
      
      <label><FileText size={14} /> Notes (optional)
        <textarea 
          value={jobForm.notes || ''} 
          onChange={e => setJobForm({ ...jobForm, notes: e.target.value })} 
          placeholder="e.g., Applied via referral, mentioned team culture, salary expectations..."
          rows="4"
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #d8e0f5', fontFamily: 'inherit', resize: 'vertical' }}
        />
      </label>
      
      {error && <p className="error-text">{error}</p>}
      
      {loading ? <Loader /> : (
        <div className="button-row">
          <button type="button" className="ghost-btn" onClick={onBack}>Back</button>
          <button className="primary-btn" type="submit">Save to Supabase</button>
        </div>
      )}
    </form>
  );
}

function SuccessScreen({ latestApp, onAddAnother, onDashboard }) {
  return (
    <div className="screen-card center-card">
      <div className="success-icon"><CheckCircle2 /></div>
      <h2>Application saved!</h2>
      <p>{latestApp?.company} – {latestApp?.role} has been saved to your dashboard.</p>
      
      <div className="summary-card">
        <strong>Next step</strong>
        <span>{latestApp?.reminder || 'Reminder before deadline'}</span>
      </div>
      
      <button className="primary-btn full" onClick={onDashboard}>
        View tracker
      </button>
      <button className="ghost-btn full" onClick={onAddAnother}>
        Add another application
      </button>
    </div>
  );
}

function DashboardScreen({ applications, loading, onStatusChange, onDelete, onAddApplication }) {
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];
  const [filter, setFilter] = useState('All');
  
  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer: applications.filter(a => a.status === 'Offer').length,
  };
  
  const getSuccessRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.offer / stats.total) * 100);
  };
  
  const filtered = filter === 'All' 
    ? [...applications].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    : applications.filter(a => a.status === filter).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return (
    <div className="screen-card dashboard-card">
      <div className="dashboard-header">
        <div className="screen-icon"><LayoutDashboard /></div>
        <div>
          <h2>Tracker dashboard</h2>
          <p>All your applications are loaded live from Supabase.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total applied</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.applied}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.interview}</div>
          <div className="stat-label">Interviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.offer}</div>
          <div className="stat-label">Offers</div>
        </div>
        <div className="stat-card success-rate">
          <div className="stat-icon">📈</div>
          <div className="stat-value">{getSuccessRate()}%</div>
          <div className="stat-label">Success rate</div>
        </div>
      </div>

      <div className="filter-buttons">
        {['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f}
          </button>
        ))}
      </div>

      <button className="primary-btn add-btn" onClick={onAddApplication}>
        <PlusCircle size={18} /> Add New Application
      </button>

      {loading ? <Loader /> : (
        <div className="application-list">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={48} />
              <p>{filter === 'All' ? 'No applications yet. Click "Add New Application" to get started!' : `No ${filter} applications!`}</p>
            </div>
          ) : (
            filtered.map(app => (
              <article className="application-item" key={app.id}>
                <div className="application-info">
                  <div className="application-header">
                    <strong className="company-name">{app.company}</strong>
                    <span className="role-name">{app.role}</span>
                    <span className="job-type-badge">{app.type}</span>
                  </div>
                  <div className="application-meta">
                    <small className="deadline">
                      📅 {app.deadline ? (
                        Math.ceil((new Date(app.deadline) - new Date()) / 86400000) === 1 
                          ? '1 day left' 
                          : `${Math.ceil((new Date(app.deadline) - new Date()) / 86400000)} days left`
                      ) : 'No deadline'}
                    </small>
                    <small className="source">🔗 {app.source || 'Manual entry'}</small>
                  </div>
                  {app.notes && (
                    <div className="application-notes">
                      <small>📝 {app.notes.length > 100 ? app.notes.substring(0, 100) + '...' : app.notes}</small>
                    </div>
                  )}
                </div>
                <div className="item-actions">
                  <select
                    value={app.status}
                    onChange={e => onStatusChange(app.id, e.target.value)}
                    className="status-select"
                  >
                    {statuses.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <div className="status-badge" data-status={app.status}>
                    {app.status}
                  </div>
                  <button className="delete-btn" onClick={() => onDelete(app.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
