import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const heroArt = (
  <svg viewBox="0 0 600 500" className="w-full h-full" role="img" aria-label="StudyWave hero illustration">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="brain" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    <rect x="40" y="40" width="520" height="420" rx="28" fill="url(#bg)" stroke="rgba(255,255,255,0.12)" />
    <circle cx="468" cy="124" r="78" fill="rgba(168,85,247,0.25)" />
    <circle cx="148" cy="386" r="92" fill="rgba(56,189,248,0.18)" />
    <path d="M280 125c-40 0-74 31-74 71 0 36 27 65 61 72 0 26 20 48 46 48h2c32 0 57-26 57-58 0-18-8-34-20-44 20-8 33-28 33-50 0-31-26-56-58-56h-7c-12 0-23 4-32 10z" fill="url(#brain)" opacity="0.95" />
    <rect x="180" y="280" width="240" height="86" rx="18" fill="#111827" stroke="#38BDF8" strokeWidth="2" />
    <rect x="204" y="298" width="88" height="12" rx="6" fill="#38BDF8" />
    <rect x="204" y="322" width="132" height="12" rx="6" fill="#A855F7" />
    <circle cx="406" cy="220" r="14" fill="#F8FAFC" />
    <circle cx="430" cy="250" r="10" fill="#F8FAFC" opacity="0.8" />
  </svg>
);

const features = [
  { title: 'Smart Planner', icon: '🧠', description: 'AI-powered task sequencing that keeps priorities clear.', accent: 'from-cyan-500 to-blue-600' },
  { title: 'Focus Timer', icon: '⏱️', description: 'Pomodoro-ready rhythm built for deep study sprints.', accent: 'from-fuchsia-500 to-violet-600' },
  { title: 'Revision Highlights', icon: '✨', description: 'Your best ideas surface exactly when you need review.', accent: 'from-indigo-500 to-sky-500' }
];

const avatars = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'
];

function App() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Checking connection');
  const [backendStatus, setBackendStatus] = useState('Checking backend...');
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ name: 'Ava', email: 'ava@example.com', password: '123456' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('/api/health')
      .then(({ data }) => setBackendStatus(data.mode === 'mongo' ? 'Connected to MongoDB' : 'Connected in demo mode'))
      .catch(() => setBackendStatus('Backend offline'));

    const token = localStorage.getItem('studywave_token');
    if (token) {
      axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.removeItem('studywave_token'));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('studywave_token');
    const headers = { Authorization: `Bearer ${token}` };

    axios.get('/api/tasks', { headers }).then(({ data }) => setTasks(data));
    axios.get('/api/notes', { headers }).then(({ data }) => setNotes(data));
    axios.get('/api/dashboard', { headers }).then(({ data }) => setDashboard(data));
  }, [user]);

  useEffect(() => {
    const socket = io();
    socket.on('connect', () => setSocketStatus('Live sync active'));
    socket.on('disconnect', () => setSocketStatus('Disconnected'));
    socket.emit('join-room', user?._id || 'guest');
    return () => socket.disconnect();
  }, [user]);

  const handleAuth = async (event) => {
    event.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const { data } = await axios.post(endpoint, authMode === 'login' ? { email: form.email, password: form.password } : form);
      if (data.token) {
        localStorage.setItem('studywave_token', data.token);
      }
      setUser(data.user);
      setMessage(authMode === 'login' ? 'Signed in successfully' : 'Account created successfully');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Connection failed');
    }
  };

  const stats = useMemo(() => [
    { label: 'Completed tasks', value: dashboard?.completedTasks || 0 },
    { label: 'Study hours', value: `${dashboard?.studyMinutes ? Math.round(dashboard.studyMinutes / 60) : 0}h` },
    { label: 'Notes ready', value: notes.length }
  ], [dashboard, notes]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_24%),linear-gradient(135deg,_#020617,_#030712_55%,_#0f172a)] text-slate-100">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">StudyWave</p>
          <h1 className="text-2xl font-semibold text-white">A smart study hub for ambitious learners</h1>
        </div>
        <button className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-200 transition hover:-translate-y-0.5 hover:bg-cyan-500/20">
          {user ? `Hello, ${user.name}` : 'Start for free'}
        </button>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 lg:px-10">
        <section className="grid items-center gap-10 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-[0_0_80px_rgba(34,211,238,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">
              Premium study productivity • Live sync across devices
            </div>
            <h2 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Turn your study flow into a beautifully organized, high-energy system.
            </h2>
            <p className="max-w-xl text-lg text-slate-300">
              StudyWave blends smart planning, Pomodoro focus, and spaced-repetition notes into one polished experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-medium text-white transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                Create your plan
              </button>
              <button className="rounded-full border border-white/15 px-6 py-3 font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200">
                Watch demo
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">{socketStatus}</span>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-cyan-200">{backendStatus}</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_0_60px_rgba(37,99,235,0.16)]">
            <div className="animate-float rounded-[24px] border border-white/10 bg-slate-900/80 p-3">
              {heroArt}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="group rounded-[24px] border border-white/10 bg-slate-900/70 p-6 transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,0.15)]">
              <div className={`inline-flex rounded-2xl bg-gradient-to-br ${feature.accent} p-4 text-3xl shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-800">
                <div className={`h-1.5 rounded-full bg-gradient-to-r ${feature.accent}`} style={{ width: `${70 + index * 8}%` }} />
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/70 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Live auth</p>
                <h3 className="mt-2 text-2xl font-semibold">Connect to the backend</h3>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">API ready</div>
            </div>

            <form onSubmit={handleAuth} className="mt-6 space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setAuthMode('login')} className={`rounded-full px-3 py-2 text-sm ${authMode === 'login' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  Login
                </button>
                <button type="button" onClick={() => setAuthMode('register')} className={`rounded-full px-3 py-2 text-sm ${authMode === 'register' ? 'bg-fuchsia-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  Register
                </button>
              </div>
              {authMode === 'register' && (
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" placeholder="Full name" />
              )}
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" placeholder="Email" />
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 text-sm text-white" placeholder="Password" />
              <button type="submit" className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white">
                {authMode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
            {message && <p className="mt-3 text-sm text-cyan-200">{message}</p>}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-fuchsia-300">Focus zone</p>
                <h3 className="mt-2 text-2xl font-semibold">Your study board</h3>
              </div>
              <div className="flex -space-x-2">
                {avatars.map((avatar, index) => (
                  <img key={avatar} src={avatar} alt={`student-${index + 1}`} className="h-11 w-11 rounded-full border-2 border-slate-900 object-cover" />
                ))}
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="mt-8 rounded-[24px] border border-dashed border-cyan-400/30 bg-slate-950/50 p-6 text-center">
                <svg viewBox="0 0 320 220" className="mx-auto h-40 w-full" role="img" aria-label="All caught up illustration">
                  <rect x="40" y="40" width="240" height="140" rx="24" fill="#111827" stroke="#38BDF8" strokeWidth="2" />
                  <circle cx="160" cy="106" r="36" fill="#A855F7" opacity="0.9" />
                  <circle cx="146" cy="100" r="8" fill="#F8FAFC" />
                  <circle cx="174" cy="100" r="8" fill="#F8FAFC" />
                  <path d="M140 124c12 14 28 14 40 0" stroke="#F8FAFC" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <circle cx="250" cy="74" r="14" fill="#FBBF24" />
                </svg>
                <h4 className="mt-4 text-xl font-semibold text-white">All caught up!</h4>
                <p className="mt-2 text-sm text-slate-400">Your study plan is clear and calm for the moment.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {tasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="text-sm text-slate-400">{task.priority} • {task.status}</p>
                    </div>
                    <div className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">{task.estimated_time}m</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
