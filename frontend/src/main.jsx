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

  // Two columns ONLY for Sign Up page (screen 0 AND not in login mode)
  const showTwoColumns = screen === 0 && !showLogin;

  return (
    <main className={showTwoColumns ? "app-shell" : "dashboard-shell"}>
      {/* Hero Panel - Left side, only on Sign Up page */}
      {showTwoColumns && (
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

// Rest of your components (LoginScreen, SignUpScreen, Loader, ProfileScreen, PreferencesScreen, AddApplicationScreen, SuccessScreen, DashboardScreen) 
// remain exactly the same as before
