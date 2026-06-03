import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Briefcase, CalendarClock, CheckCircle2, ChevronRight,
  GraduationCap, LayoutDashboard, LockKeyhole, ShieldCheck,
  Sparkles, Trash2
} from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const screens = ['Login', 'Student Details', 'Preferences', 'Add Application', 'Success', 'Dashboard'];

// ─────────────────────────────────────────
// Root App
// ─────────────────────────────────────────
function App() {
  const [screen, setScreen] = useState(0);
  const [profile, setProfile] = useState({ email: '', university: '', year: '', studyArea: '' });
  const [preferences, setPreferences] = useState({ jobType: 'Internship', reminder: 'Before deadlines' });
  const [applications, setApplications] = useState([]);
  const [jobForm, setJobForm] = useState({ company: '', role: '', type: 'Internship', deadline: '', source: '', link: '' });
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestApp, setLatestApp] = useState(null);

  const progress = useMemo(() => Math.round(((screen + 1) / screens.length) * 100), [screen]);

  function goNext() { setError(''); setApiError(''); setScreen(s => Math.min(s + 1, screens.length - 1)); }
  function goBack() { setError(''); setApiError(''); setScreen(s => Math.max(s - 1, 0)); }

  // ── Login ──
  async function handleLogin(e) {
    e.preventDefault();
    if (!profile.email.trim()) { setError('Please enter an email address.'); return; }
    setLoading(true);
    try {
      const { user } = await api.getUser(profile.email.trim());
      if (user) {
        setProfile({
          email: user.email,
          university: user.university,
          year: user.year,
          studyArea: user.study_area,
        });
        setPreferences({ jobType: user.job_type, reminder: user.reminder_pref });
      }
      goNext();
    } catch (err) {
      setApiError(`Backend error: ${err.message}. Check your API is running.`);
    } finally {
      setLoading(false);
    }
  }

  // ── Profile ──
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

  // ── Preferences ──
  async function handlePreferences(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.upsertUser({
        email: profile.email,
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

  // ── Add Application ──
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
        status: 'Applied',
        reminder,
      });
      setLatestApp(application);
      setApplications(prev => [application, ...prev]);
      setJobForm({ company: '', role: '', type: preferences.jobType, deadline: '', source: '', link: '' });
      goNext();
    } catch (err) {
      setApiError(`Could not save application: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ── Load applications when Dashboard opens ──
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

  // ── Update status ──
  async function handleStatusChange(id, status) {
    try {
      await api.updateStatus(id, status);
      setApplications(apps => apps.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) {
      setApiError(`Status update failed: ${err.message}`);
    }
  }

  // ── Delete application ──
  async function handleDelete(id) {
    try {
      await api.deleteApplication(id);
      setApplications(apps => apps.filter(a => a.id !== id));
    } catch (err) {
      setApiError(`Delete failed: ${err.message}`);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="brand-row">
          <div className="brand-mark"><Briefcase size={26} /></div>
          <div>
            <p className="eyebrow">22877755</p>
            <h1>APPLYFY</h1>
          </div>
        </div>
        <h2>Apply smarter. Land faster.</h2>
        <p>
          A student-focused job application tracker that replaces messy spreadsheets with fast logging, clear deadlines, and real-time status tracking — backed by Supabase.
        </p>
        <div className="feature-list">
          <Feature icon={<Sparkles />} title="30-second entry" text="Log job applications quickly without spreadsheet friction." />
          <Feature icon={<CalendarClock />} title="Deadline awareness" text="Keep upcoming deadlines and follow-ups visible." />
          <Feature icon={<ShieldCheck />} title="Persistent data" text="Your applications are saved to Supabase and available next time you log in." />
        </div>
      </section>

      <section className="phone-panel">
        <div className="step-header">
          <span>{screens[screen]}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>

        {apiError && <div className="api-error" style={{ marginBottom: 12 }}>{apiError}</div>}

        {screen === 0 && <LoginScreen profile={profile} setProfile={setProfile} error={error} loading={loading} onSubmit={handleLogin} />}
        {screen === 1 && <ProfileScreen profile={profile} setProfile={setProfile} error={error} loading={loading} onBack={goBack} onSubmit={handleProfile} />}
        {screen === 2 && <PreferencesScreen preferences={preferences} setPreferences={setPreferences} loading={loading} onBack={goBack} onSubmit={handlePreferences} />}
        {screen === 3 && <AddApplicationScreen jobForm={jobForm} setJobForm={setJobForm} preferences={preferences} error={error} loading={loading} onBack={goBack} onSubmit={handleAddApplication} />}
        {screen === 4 && <SuccessScreen latestApp={latestApp} onAddAnother={() => setScreen(3)} onDashboard={() => setScreen(5)} />}
        {screen === 5 && <DashboardScreen applications={applications} loading={loading} onStatusChange={handleStatusChange} onDelete={handleDelete} onAddApplication={() => setScreen(3)} />}
      </section>
    </main>
  );
}

// ─────────────────────────────────────────
// Shared Components
// ─────────────────────────────────────────
function Feature({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <div><strong>{title}</strong><p>{text}</p></div>
    </div>
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

// ─────────────────────────────────────────
// Screens
// ─────────────────────────────────────────
function LoginScreen({ profile, setProfile, error, loading, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><LockKeyhole /></div>
      <h2>Welcome back</h2>
      <p>Enter your email to load your saved applications or start tracking new ones.</p>
      <label>Email address
        <input
          type="email"
          value={profile.email}
          onChange={e => setProfile({ ...profile, email: e.target.value })}
          placeholder="student@email.com"
          autoComplete="email"
        />
      </label>
      <label>Password<input type="password" placeholder="Demo — any password works" /></label>
      {error && <p className="error-text">{error}</p>}
      {loading ? <Loader /> : (
        <button className="primary-btn" type="submit">
          Login <ChevronRight size={18} />
        </button>
      )}
      <small>Your data is stored in Supabase and retrieved on next login.</small>
    </form>
  );
}

function ProfileScreen({ profile, setProfile, error, loading, onBack, onSubmit }) {
  return (
    <form className="screen-card" onSubmit={onSubmit}>
      <div className="screen-icon"><GraduationCap /></div>
      <h2>Student details</h2>
      <p>This information personalises your job tracker and is saved to your profile.</p>
      <label>University
        <input value={profile.university} onChange={e => setProfile({ ...profile, university: e.target.value })} placeholder="La Trobe University" />
      </label>
      <label>Year level
        <select value={profile.year} onChange={e => setProfile({ ...profile, year: e.target.value })}>
          <option value="">Select year</option>
          <option>First year</option><option>Second year</option><option>Third year</option><option>Fourth year</option><option>Recent graduate</option>
        </select>
      </label>
      <label>Study area
        <input value={profile.studyArea} onChange={e => setProfile({ ...profile, studyArea: e.target.value })} placeholder="Business / IT / Health" />
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
      <p>Set the type of job and reminder style you want to focus on.</p>
      <label>Primary job type
        <select value={preferences.jobType} onChange={e => setPreferences({ ...preferences, jobType: e.target.value })}>
          <option>Internship</option><option>Graduate role</option><option>Part-time</option><option>Casual</option>
        </select>
      </label>
      <label>Reminder preference
        <select value={preferences.reminder} onChange={e => setPreferences({ ...preferences, reminder: e.target.value })}>
          <option>Before deadlines</option><option>Weekly summary</option><option>Follow-up reminders</option>
        </select>
      </label>
      <div className="note-box">Preferences are saved to your Supabase profile for future sessions.</div>
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
      <p>Capture the core job details — this will be saved to Supabase instantly.</p>
      <div className="grid-2">
        <label>Company
          <input value={jobForm.company} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} placeholder="Company name" />
        </label>
        <label>Role
          <input value={jobForm.role} onChange={e => setJobForm({ ...jobForm, role: e.target.value })} placeholder="Role title" />
        </label>
      </div>
      <div className="grid-2">
        <label>Job type
          <select value={jobForm.type || preferences.jobType} onChange={e => setJobForm({ ...jobForm, type: e.target.value })}>
            <option>Internship</option><option>Graduate role</option><option>Part-time</option><option>Casual</option>
          </select>
        </label>
        <label>Deadline
          <input type="date" value={jobForm.deadline} onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} />
        </label>
      </div>
      <label>Source
        <input value={jobForm.source} onChange={e => setJobForm({ ...jobForm, source: e.target.value })} placeholder="LinkedIn / Seek / Company site" />
      </label>
      <label>Job link
        <input value={jobForm.link} onChange={e => setJobForm({ ...jobForm, link: e.target.value })} placeholder="https://..." />
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
      <p>{latestApp?.company} – {latestApp?.role} has been saved to your Supabase database.</p>
      <div className="summary-card">
        <strong>Next step</strong>
        <span>{latestApp?.reminder || 'Reminder before deadline'}</span>
      </div>
      <button className="primary-btn full" onClick={onDashboard}>View tracker</button>
      <button className="ghost-btn full" onClick={onAddAnother}>Add another application</button>
    </div>
  );
}

function DashboardScreen({ applications, loading, onStatusChange, onDelete, onAddApplication }) {
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected', 'Ghosted'];

  return (
    <div className="screen-card dashboard-card">
      <div className="screen-icon"><LayoutDashboard /></div>
      <h2>Tracker dashboard</h2>
      <p>All your applications are loaded live from Supabase.</p>

      <div className="stats-row">
        <div><strong>{applications.length}</strong><span>Total</span></div>
        <div><strong>{applications.filter(a => a.status === 'Interview').length}</strong><span>Interviews</span></div>
        <div><strong>{applications.filter(a => a.status === 'Applied').length}</strong><span>Applied</span></div>
      </div>

      {loading ? <Loader /> : (
        <div className="application-list">
          {applications.length === 0 ? (
            <div className="empty-state">
              <Briefcase size={40} />
              <p>No applications yet. Add your first one!</p>
            </div>
          ) : applications.map(app => (
           <article className="application-item" key={app.id}>
              <div>
                <strong>{app.company}</strong>
                <span>{app.role} · {app.type}</span>
                <small>{app.deadline ? `${Math.ceil((new Date(app.deadline) - new Date()) / 86400000)} days left` : 'No deadline'} · {app.source || 'Manual entry'}</small>
              </div>
              <div className="item-actions">
                <select
                  value={app.status}
                  onChange={e => onStatusChange(app.id, e.target.value)}
                  style={{color: app.status === 'Interview' ? '#16a35d' : app.status === 'Offer' ? '#f0a500' : app.status === 'Rejected' ? '#c0392b' : app.status === 'Ghosted' ? '#888888' : '#214ecf', fontWeight: '700'}}
                >
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="delete-btn" onClick={() => onDelete(app.id)} title="Delete">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <button className="primary-btn full" style={{ marginTop: 16 }} onClick={onAddApplication}>
        Add another application
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
