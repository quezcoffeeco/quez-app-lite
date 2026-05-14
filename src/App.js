import React, { useState, useEffect } from 'react';
import './index.css';
import { load, save } from './utils/storage';
import { initEmailFlush, sendEmail } from './utils/email';

// ── Screens (stubs for now, built in later sessions) ──
const PlaceholderScreen = ({ title }) => (
  <div className="screen">
    <div className="screen-header"><h2>{title}</h2></div>
    <div className="screen-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <p style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-header)', fontSize: 20 }}>Coming in a future session</p>
    </div>
  </div>
);

// ── Setup Screen (first launch) ──
const SetupScreen = ({ onComplete }) => {
  const [serviceId, setServiceId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    if (!serviceId || !templateId || !publicKey || !ownerEmail) {
      setStatus('Please fill in all fields.');
      return;
    }
    const settings = load('quez_settings', {});
    save('quez_settings', {
      ...settings,
      emailjs_service_id: serviceId,
      emailjs_template_id: templateId,
      emailjs_public_key: publicKey,
      owner_email: ownerEmail,
    });
    setTesting(true);
    setStatus('Sending test email...');
    try {
      await sendEmail({
        to_email: ownerEmail,
        subject: 'Quez App Lite — Setup Test',
        message: 'EmailJS is configured correctly. The Quez App Lite is ready.',
        from_name: 'Quez App Lite',
      });
      setStatus('✓ Test email sent! Check your inbox, then continue.');
      setTimeout(() => onComplete(), 2000);
    } catch {
      setStatus('Email failed. Check your credentials and try again.');
    }
    setTesting(false);
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: 'var(--radius)',
    background: 'var(--color-mid-gray)', border: '1px solid rgba(212,175,55,0.3)',
    color: 'var(--color-cream)', fontSize: 15, marginBottom: 12,
  };
  const labelStyle = { fontSize: 12, color: 'var(--color-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4, display: 'block' };

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--color-mid-gray)', border: '2px solid var(--color-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ color: 'var(--color-gold)', fontSize: 28 }}>Q</span>
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Quez Coffee Co.</h1>
          <p style={{ color: 'var(--color-cream)', opacity: 0.6, fontSize: 14 }}>First-time setup — EmailJS Configuration</p>
        </div>

        <div className="card">
          <label style={labelStyle}>Owner Email</label>
          <input style={inputStyle} type="email" placeholder="support@quezcoffeeco.com" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} />

          <label style={labelStyle}>EmailJS Service ID</label>
          <input style={inputStyle} placeholder="service_xxxxxxx" value={serviceId} onChange={e => setServiceId(e.target.value)} />

          <label style={labelStyle}>EmailJS Template ID</label>
          <input style={inputStyle} placeholder="template_xxxxxxx" value={templateId} onChange={e => setTemplateId(e.target.value)} />

          <label style={labelStyle}>EmailJS Public Key</label>
          <input style={inputStyle} placeholder="xxxxxxxxxxxxxxxxxxxx" value={publicKey} onChange={e => setPublicKey(e.target.value)} />

          {status ? (
            <p style={{ textAlign: 'center', marginBottom: 12, color: status.startsWith('✓') ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 14 }}>{status}</p>
          ) : null}

          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={testing} style={{ marginBottom: 12 }}>
            {testing ? 'Sending...' : 'Save & Send Test Email'}
          </button>
          <button className="btn btn-secondary btn-full" onClick={onComplete}>
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bottom Navigation ──
const NAV_TABS = {
  owner: [
    { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
    { id: 'checklists', label: 'Checklists', icon: '✓' },
    { id: 'orders', label: 'Orders', icon: '☕' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'settings', label: 'Settings', icon: '⚙' },
  ],
  manager: [
    { id: 'checklists', label: 'Checklists', icon: '✓' },
    { id: 'orders', label: 'Orders', icon: '☕' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
    { id: 'recipes', label: 'Recipes', icon: '📖' },
  ],
  lead_barista: [
    { id: 'checklists', label: 'Checklists', icon: '✓' },
    { id: 'orders', label: 'Orders', icon: '☕' },
    { id: 'recipes', label: 'Recipes', icon: '📖' },
    { id: 'schedule', label: 'Schedule', icon: '📅' },
  ],
  barista: [
    { id: 'checklists', label: 'Checklists', icon: '✓' },
    { id: 'orders', label: 'Orders', icon: '☕' },
    { id: 'recipes', label: 'Recipes', icon: '📖' },
  ],
  trainee: [
    { id: 'training', label: 'Training', icon: '🎓' },
  ],
};

const BottomNav = ({ role, activeTab, onTabChange }) => {
  const tabs = NAV_TABS[role] || NAV_TABS.barista;
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 'var(--nav-height)',
      background: 'var(--color-dark-gray)',
      borderTop: '1px solid rgba(212,175,55,0.2)',
      display: 'flex', zIndex: 100,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'none', gap: 4,
            borderTop: activeTab === tab.id ? '2px solid var(--color-gold)' : '2px solid transparent',
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase',
            color: activeTab === tab.id ? 'var(--color-gold)' : 'rgba(245,240,232,0.5)',
          }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// ── Quick Login Gate (Session 1 stub — full login built in Session 2) ──
const EMPLOYEES = [
  { name: 'Ryan Rodriguez', role: 'owner' },
  { name: 'Manager Demo', role: 'manager' },
  { name: 'Lead Demo', role: 'lead_barista' },
  { name: 'Barista Demo', role: 'barista' },
  { name: 'Trainee Demo', role: 'trainee' },
];

const QuickLogin = ({ onLogin }) => {
  const [selected, setSelected] = useState('');

  const handleLogin = () => {
    const emp = EMPLOYEES.find(e => e.name === selected);
    if (emp) onLogin(emp);
  };

  const selectStyle = {
    width: '100%', padding: '12px', borderRadius: 'var(--radius)',
    background: 'var(--color-mid-gray)', border: '1px solid rgba(212,175,55,0.3)',
    color: 'var(--color-cream)', fontSize: 16, marginBottom: 16,
    appearance: 'none',
  };

  return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--color-mid-gray)', border: '2px solid var(--color-gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ color: 'var(--color-gold)', fontSize: 28 }}>Q</span>
          </div>
          <h1 style={{ fontSize: 22, marginBottom: 4 }}>Quez Coffee Co.</h1>
          <p style={{ color: 'var(--color-cream)', opacity: 0.6, fontSize: 13 }}>Session 1 Preview — Full login coming in Session 2</p>
        </div>
        <div className="card">
          <select style={selectStyle} value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select your name...</option>
            {EMPLOYEES.map(e => <option key={e.name} value={e.name}>{e.name} ({e.role})</option>)}
          </select>
          <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={!selected}>
            Enter App
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main App ──
export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | setup | login | app
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    initEmailFlush();
    const settings = load('quez_settings', {});
    const hasEmailJS = settings.emailjs_service_id && settings.emailjs_template_id && settings.emailjs_public_key;
    setPhase(hasEmailJS ? 'login' : 'setup');
  }, []);

  const handleSetupComplete = () => setPhase('login');

  const handleLogin = (employee) => {
    setCurrentUser(employee);
    const tabs = NAV_TABS[employee.role] || NAV_TABS.barista;
    setActiveTab(tabs[0].id);
    setPhase('app');
  };

  const getScreenForTab = (tab) => {
    const titles = {
      dashboard: 'Owner Dashboard',
      checklists: 'Checklists',
      orders: 'Orders & Build Queue',
      schedule: 'Schedule',
      settings: 'Settings',
      recipes: 'Recipe Viewer',
      training: 'Training Portal',
    };
    return <PlaceholderScreen title={titles[tab] || tab} />;
  };

  if (phase === 'loading') return (
    <div className="screen" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <p style={{ color: 'var(--color-gold)' }}>Loading...</p>
    </div>
  );

  if (phase === 'setup') return <SetupScreen onComplete={handleSetupComplete} />;
  if (phase === 'login') return <QuickLogin onLogin={handleLogin} />;

  return (
    <div className="screen">
      {getScreenForTab(activeTab)}
      <BottomNav role={currentUser?.role} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}