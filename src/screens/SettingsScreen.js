import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSettings, saveSettings, getEmployees, saveEmployees, getMenu, saveMenu, resetEmployeePin, getPeriodicDueConfig, savePeriodicDueConfig, getSeasonalDrink, setSeasonalDrink, getTodayLocation, setTodayLocation, getLocationSchedule, setLocationSchedule, getTodayScheduledLocation, isLocationOverridden, getDailyGoal, setDailyGoal, getPlaylistUrl, setPlaylistUrl, downloadBackup, readBackupFile, restoreFromBundle, getStorageHealth, requestPersistentStorage, getAutoBackupConfig, setAutoBackupConfig, sendBackupEmail, getLastAutoBackupAt, logAudit } from '../utils/storage';

const ROLES = ['owner','manager','leadBarista','barista','trainee'];
const ROLE_LABELS = { owner:'Owner', manager:'Manager', leadBarista:'Lead Barista', barista:'Barista', trainee:'Trainee' };
const ROLE_COLORS = { owner:'#D4AF37', manager:'#7BB3F0', leadBarista:'#9B7BF0', barista:'#7BF0B3', trainee:'#888880' };
const PIN_ROLES = ['owner','manager'];
const CATEGORIES = ['Honey Signature','Espresso Classic','Frappe','Volume','Non-Coffee'];

const DEFAULT_MENU_DRINKS = [
  {id:'drink-1',name:'Quez Honey Mocha',nameEs:'Mocha de Miel Quez',category:'Honey Signature',price12:6.50,price16:7.10,eightySix:false},
  {id:'drink-2',name:'Hot Honey Spice Latte',nameEs:'Latte de Miel y Especias',category:'Honey Signature',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-3',name:'Golden Bear Cold Brew',nameEs:'Cold Brew Oso Dorado',category:'Honey Signature',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-4',name:'Lavender Honey Fog',nameEs:'Niebla de Lavanda y Miel',category:'Honey Signature',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-5',name:'Honey Cinnamon Latte',nameEs:'Latte de Miel y Canela',category:'Honey Signature',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-6',name:'Honey Cold Brew',nameEs:'Cold Brew de Miel',category:'Honey Signature',price12:4.95,price16:5.55,eightySix:false},
  {id:'drink-7',name:'Vanilla Latte',nameEs:'Latte de Vainilla',category:'Espresso Classic',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-8',name:'Caramel Latte',nameEs:'Latte de Caramelo',category:'Espresso Classic',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-9',name:'Salted Caramel Latte',nameEs:'Latte de Caramelo Salado',category:'Espresso Classic',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-10',name:'Americano',nameEs:'Americano',category:'Espresso Classic',price12:3.95,price16:4.55,eightySix:false},
  {id:'drink-11',name:'Caramel Crunch Frappe',nameEs:'Frappe de Caramelo Crujiente',category:'Frappe',price12:6.50,price16:7.10,eightySix:false},
  {id:'drink-12',name:'Mocha Frappe',nameEs:'Frappe de Mocha',category:'Frappe',price12:6.50,price16:7.10,eightySix:false},
  {id:'drink-13',name:'Drip Coffee',nameEs:'Cafe de Filtro',category:'Volume',price12:3.50,price16:4.10,eightySix:false},
  {id:'drink-14',name:'Chai Latte',nameEs:'Latte de Chai',category:'Non-Coffee',price12:5.95,price16:6.55,eightySix:false},
  {id:'drink-15',name:'Strawberry Lemonade',nameEs:'Limonada de Fresa',category:'Non-Coffee',price12:4.95,price16:5.55,eightySix:false},
];

const S = {
  screen:{display:'flex',flexDirection:'column',height:'100%',background:'#0D0D0D',overflow:'hidden'},
  header:{padding:'20px 20px 14px',borderBottom:'1px solid rgba(212,175,55,0.2)',background:'#1A1A1A',flexShrink:0},
  headerTitle:{fontFamily:'Georgia,serif',fontSize:22,color:'#D4AF37',letterSpacing:'0.02em'},
  headerSub:{fontSize:11,color:'#888',marginTop:3,letterSpacing:'0.08em',textTransform:'uppercase'},
  body:{flex:1,overflowY:'auto',padding:'14px 14px 40px',WebkitOverflowScrolling:'touch'},
  card:{background:'#1A1A1A',border:'1px solid rgba(212,175,55,0.15)',borderRadius:14,marginBottom:10,overflow:'hidden'},
  cardBtn:{width:'100%',background:'none',border:'none',cursor:'pointer',padding:'14px 18px',display:'flex',alignItems:'center',gap:12,textAlign:'left'},
  cardTitle:{flex:1,fontFamily:'Georgia,serif',fontSize:15,fontWeight:'normal'},
  cardBody:{padding:'4px 18px 20px'},
  label:{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#888',marginBottom:5,display:'block'},
  input:{width:'100%',background:'#2A2A2A',border:'1px solid rgba(212,175,55,0.3)',borderRadius:7,color:'#F5F0E8',fontFamily:'inherit',fontSize:15,padding:'10px 13px',outline:'none',boxSizing:'border-box'},
  note:{fontSize:12,color:'#666',marginTop:4},
  row:{display:'flex',alignItems:'center',gap:10,padding:'11px 0',borderBottom:'1px solid rgba(212,175,55,0.1)'},
  btn:{display:'inline-flex',alignItems:'center',justifyContent:'center',border:'none',borderRadius:7,fontFamily:'inherit',fontSize:14,fontWeight:600,cursor:'pointer',padding:'9px 16px',transition:'all 0.15s'},
  btnGold:{background:'#D4AF37',color:'#0D0D0D'},
  btnGhost:{background:'transparent',border:'1px solid rgba(212,175,55,0.3)',color:'#F5F0E8'},
  btnDanger:{background:'rgba(200,75,75,0.15)',border:'1px solid #C84B4B',color:'#C84B4B'},
  btnSuccess:{background:'rgba(75,156,90,0.15)',border:'1px solid #4B9C5A',color:'#4B9C5A'},
  btnSm:{fontSize:12,padding:'5px 10px'},
  divider:{height:1,background:'rgba(212,175,55,0.1)',margin:'14px 0'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:500,display:'flex',alignItems:'flex-end',justifyContent:'center'},
  sheet:{background:'#1A1A1A',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:640,maxHeight:'85vh',overflowY:'auto',padding:'22px 20px 40px'},
  sheetTitle:{fontFamily:'Georgia,serif',fontSize:19,color:'#D4AF37',marginBottom:20},
  catLabel:{fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#D4AF37',marginBottom:8,paddingBottom:6,borderBottom:'1px solid rgba(212,175,55,0.15)'},
  toggle:{position:'relative',width:46,height:26,flexShrink:0},
  trackBase:{position:'absolute',inset:0,borderRadius:13,transition:'background 0.2s',cursor:'pointer'},
  thumb:{position:'absolute',top:3,left:3,width:20,height:20,background:'white',borderRadius:'50%',transition:'transform 0.2s',pointerEvents:'none'},
};

function Toggle({checked, onChange, disabled}) {
  return (
    <label style={{...S.toggle, ...(disabled ? { opacity: 0.55, cursor: 'not-allowed' } : {})}}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e=>!disabled && onChange(e.target.checked)}
        style={{position:'absolute',opacity:0,width:0,height:0}}
      />
      <span style={{...S.trackBase, background: checked ? '#D4AF37' : '#3A3A3A'}} />
      <span style={{...S.thumb, transform: checked ? 'translateX(20px)' : 'none'}} />
    </label>
  );
}

function Toast({msg, type}) {
  if (!msg) return null;
  return (
    <div style={{position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',background:'#1A1A1A',border:`1px solid ${type==='error'?'#C84B4B':'#D4AF37'}`,borderRadius:10,padding:'11px 20px',fontSize:14,color:type==='error'?'#C84B4B':'#D4AF37',zIndex:1000,whiteSpace:'nowrap',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {type==='error'?'⚠ ':'✓ '}{msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type='success') => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 2500);
  }, []);
  return [toast, show];
}

function Section({id, icon, title, expanded, onToggle, children, singleMode}) {
  // singleMode = each section is its own page (route 'settings:<id>').
  // In that mode we only render the matching section and lose the
  // collapse toggle entirely.
  if (singleMode) {
    if (!expanded) return null;
    return (
      <div style={S.card}>
        <div style={{ ...S.cardBtn, cursor: 'default' }}>
          <span style={{fontSize:20}}>{icon}</span>
          <span style={{...S.cardTitle, color: '#D4AF37', fontSize: 16}}>{title}</span>
        </div>
        <div style={S.cardBody}>{children}</div>
      </div>
    );
  }
  return (
    <div style={S.card}>
      <button style={S.cardBtn} onClick={()=>onToggle(id)}>
        <span style={{fontSize:18}}>{icon}</span>
        <span style={{...S.cardTitle, color: expanded?'#D4AF37':'#F5F0E8'}}>{title}</span>
        <span style={{color:'#666',fontSize:18}}>{expanded?'−':'+'}</span>
      </button>
      {expanded && <div style={S.cardBody}>{children}</div>}
    </div>
  );
}

function Field({label, note, children}) {
  return (
    <div style={{marginBottom:16}}>
      <span style={S.label}>{label}</span>
      {children}
      {note && <div style={S.note}>{note}</div>}
    </div>
  );
}

function EmployeeModal({emp, employees, onSave, onClose}) {
  const isEdit = !!emp;
  const [name, setName] = useState(emp?.name||'');
  const [role, setRole] = useState(emp?.role||'barista');
  // New employees default to PIN 0000 and must change on first login.
  const [pin, setPin] = useState(emp?.pin || '0000');
  const [wage, setWage] = useState(emp?.wagePerHour != null ? String(emp.wagePerHour) : '');
  // Trainer is stored by id; legacy records may have only trainerName — back-fill.
  const [trainerId, setTrainerId] = useState(() => {
    if (emp?.trainerId) return emp.trainerId;
    if (emp?.trainerName && Array.isArray(employees)) {
      const match = employees.find((x) => x.name === emp.trainerName);
      return match?.id || '';
    }
    return '';
  });
  const [birthday, setBirthday] = useState(emp?.birthday || ''); // MM-DD format
  const [err, setErr] = useState({});

  // Potential trainers — owner / manager / lead barista.
  // `active !== false` so legacy records without an explicit `active` field
  // (older seeded owners, etc.) still appear. Sorted owner-first so the
  // operator setting up their first hire sees themselves at the top.
  const trainerRank = { owner: 0, manager: 1, leadBarista: 2 };
  const potentialTrainers = employees
    .filter((e) => e.active !== false && (e.role === 'owner' || e.role === 'manager' || e.role === 'leadBarista'))
    .sort((a, b) => (trainerRank[a.role] ?? 9) - (trainerRank[b.role] ?? 9));

  function save() {
    const e = {};
    if (!name.trim()) e.name = 'Required';
    else if (!isEdit && employees.some(x=>x.active&&x.name.toLowerCase()===name.trim().toLowerCase())) e.name = 'Name already exists';
    if (!/^\d{4}$/.test(pin)) e.pin = 'Must be exactly 4 digits';
    const wageNum = wage === '' ? 0 : parseFloat(wage);
    if (wage !== '' && (!Number.isFinite(wageNum) || wageNum < 0)) e.wage = 'Must be a positive number';
    if (birthday && !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(birthday)) {
      e.birthday = 'Format MM-DD (e.g. 08-23). Month 01-12, day 01-31.';
    }
    if (Object.keys(e).length) { setErr(e); return; }
    // Anyone whose PIN was set to the default must change it on first login.
    const mustChangePin = pin === '0000' ? true : (emp?.mustChangePin || false);
    onSave({
      ...(emp||{}),
      name: name.trim(),
      role,
      pin,
      mustChangePin,
      wagePerHour: Number.isFinite(wageNum) ? Math.round(wageNum * 100) / 100 : 0,
      trainerId: trainerId || null,
      // Keep trainerName in sync for backward compat / display fallback
      trainerName: trainerId ? (potentialTrainers.find((t) => t.id === trainerId)?.name || null) : null,
      birthday: birthday && /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(birthday) ? birthday : null,
      active: true,
      id: emp?.id || ('emp-'+Date.now()),
      createdAt: emp?.createdAt || new Date().toISOString(),
    });
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <span style={S.sheetTitle}>{isEdit?'Edit Employee':'Add Employee'}</span>
          <button style={{...S.btn,...S.btnGhost,padding:'6px 12px'}} onClick={onClose}>✕</button>
        </div>
        <Field label="Employee Name">
          <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" autoFocus />
          {err.name && <div style={{...S.note,color:'#C84B4B'}}>{err.name}</div>}
        </Field>
        <Field label="Role">
          <select style={S.input} value={role} onChange={e=>setRole(e.target.value)}>
            {ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <Field label="PIN" note="4 digits, required for all roles. Default 0000 — employee will be prompted to change on first login.">
          <input style={S.input} type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4-digit PIN" maxLength={4} />
          {err.pin && <div style={{...S.note,color:'#C84B4B'}}>{err.pin}</div>}
          {isEdit && (
            <button
              type="button"
              style={{...S.btn,...S.btnGhost,marginTop:8,fontSize:12,padding:'6px 10px'}}
              onClick={() => {
                if (!window.confirm(`Reset ${emp.name}'s PIN to 0000? They will be prompted to set a new one on next login.`)) return;
                resetEmployeePin(emp.id, 'admin');
                setPin('0000');
                window.alert('PIN reset. Employee will set a new PIN on next login.');
              }}
            >
              ↻ Reset PIN to 0000
            </button>
          )}
        </Field>
        <Field label="Wage per Hour ($)" note="Used to calculate labor cost on Reports. Leave 0 if not tracking.">
          <input
            style={S.input}
            type="text"
            inputMode="decimal"
            value={wage}
            onChange={e=>setWage(e.target.value.replace(/[^0-9.]/g,''))}
            placeholder="e.g. 14.50"
            maxLength={7}
          />
          {err.wage && <div style={{...S.note,color:'#C84B4B'}}>{err.wage}</div>}
        </Field>
        {role === 'trainee' && (
          <Field label="Assigned Trainer" note="Shown on the trainee's Home so they know who to ask.">
            <select style={S.input} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
              <option value="">— None —</option>
              {potentialTrainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Birthday (MM-DD)" note="Optional. Surfaces on the Home a week before — builds team warmth. Year not stored.">
          <input
            style={S.input}
            type="text"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value.replace(/[^\d-]/g, '').slice(0, 5))}
            placeholder="08-23"
            maxLength={5}
          />
          {err.birthday && <div style={{...S.note,color:'#C84B4B'}}>{err.birthday}</div>}
        </Field>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button style={{...S.btn,...S.btnGhost,flex:1}} onClick={onClose}>Cancel</button>
          <button style={{...S.btn,...S.btnGold,flex:1}} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

function DrinkModal({drink, onSave, onClose}) {
  const isEdit = !!drink;
  const [name, setName] = useState(drink?.name||'');
  const [nameEs, setNameEs] = useState(drink?.nameEs||'');
  const [category, setCategory] = useState(drink?.category||'Espresso Classic');
  const [price12, setPrice12] = useState(drink?.price12!=null?String(drink.price12):'');
  const [price16, setPrice16] = useState(drink?.price16!=null?String(drink.price16):'');
  const [err, setErr] = useState({});

  function save() {
    const e = {};
    if (!name.trim()) e.name = 'Required';
    if (!price12||isNaN(parseFloat(price12))) e.price12 = 'Required';
    if (!price16||isNaN(parseFloat(price16))) e.price16 = 'Required';
    if (Object.keys(e).length) { setErr(e); return; }
    onSave({id:drink?.id||('drink-'+Date.now()), name:name.trim(), nameEs:nameEs.trim()||name.trim(), category, price12:parseFloat(price12), price16:parseFloat(price16), eightySix:drink?.eightySix||false});
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <span style={S.sheetTitle}>{isEdit?'Edit Drink':'Add Drink'}</span>
          <button style={{...S.btn,...S.btnGhost,padding:'6px 12px'}} onClick={onClose}>✕</button>
        </div>
        <Field label="Drink Name (English)">
          <input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Drink name" autoFocus />
          {err.name && <div style={{...S.note,color:'#C84B4B'}}>{err.name}</div>}
        </Field>
        <Field label="Drink Name (Español)">
          <input style={S.input} value={nameEs} onChange={e=>setNameEs(e.target.value)} placeholder="Nombre en español" />
        </Field>
        <Field label="Category">
          <select style={S.input} value={category} onChange={e=>setCategory(e.target.value)}>
            {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Field label="Price 12oz">
            <input style={S.input} type="number" step="0.05" min="0" value={price12} onChange={e=>setPrice12(e.target.value)} placeholder="0.00" />
            {err.price12 && <div style={{...S.note,color:'#C84B4B'}}>{err.price12}</div>}
          </Field>
          <Field label="Price 16oz">
            <input style={S.input} type="number" step="0.05" min="0" value={price16} onChange={e=>setPrice16(e.target.value)} placeholder="0.00" />
            {err.price16 && <div style={{...S.note,color:'#C84B4B'}}>{err.price16}</div>}
          </Field>
        </div>
        <div style={{display:'flex',gap:10,marginTop:24}}>
          <button style={{...S.btn,...S.btnGhost,flex:1}} onClick={onClose}>Cancel</button>
          <button style={{...S.btn,...S.btnGold,flex:1}} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  );
}

function DataBackupEditor({ viewerIsOwner = true }) {
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState('');
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const fileRef = useRef(null);

  const refresh = async () => {
    try {
      const h = await getStorageHealth();
      setHealth(h);
    } catch {}
  };

  useEffect(() => { refresh(); }, []);

  // Detect installable + already-installed state
  useEffect(() => {
    // Already installed (PWA mode)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      setIsInstalled(standalone);
    }
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    const installed = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setStatus('Installing... after install completes, persistent storage will be granted automatically.');
      // Re-request persistent after a beat
      setTimeout(async () => {
        await requestPersistentStorage();
        refresh();
      }, 1500);
    }
  };

  const fmtBytes = (n) => {
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  };
  const fmtDt = (iso) => iso ? new Date(iso).toLocaleString() : '—';

  const handleExport = () => {
    downloadBackup();
    setStatus('Backup downloaded.');
    refresh();
    setTimeout(() => setStatus(''), 3500);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('Import this backup? This will REPLACE all current data on this device. Cannot be undone.')) {
      e.target.value = '';
      return;
    }
    try {
      const bundle = await readBackupFile(file);
      restoreFromBundle(bundle, 'replace');
      setStatus(`Restored ${bundle.keyCount || Object.keys(bundle.data).length} keys. Reloading...`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setStatus('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Auto-backup config
  const [autoBackup, setAutoBackupState] = useState(() => getAutoBackupConfig());
  const [lastAuto, setLastAuto] = useState(() => getLastAutoBackupAt());
  const [sendingNow, setSendingNow] = useState(false);

  const updateAuto = (patch) => {
    const next = { ...autoBackup, ...patch };
    setAutoBackupState(next);
    setAutoBackupConfig(next);
  };

  const sendAutoNow = async () => {
    setSendingNow(true);
    setStatus('Sending backup email...');
    const result = await sendBackupEmail('manual', 'admin');
    setSendingNow(false);
    setLastAuto(getLastAutoBackupAt());
    if (result.sent) {
      setStatus(`✓ Backup emailed to ${result.recipients} recipient${result.recipients !== 1 ? 's' : ''}${result.tooBig ? ' (size warning sent — manual export needed)' : ''}.`);
    } else {
      setStatus('✗ Send failed: ' + (result.error || 'unknown'));
    }
    setTimeout(() => setStatus(''), 5000);
  };

  const handleRequestPersist = async () => {
    const granted = await requestPersistentStorage();
    setStatus(granted
      ? 'Persistent storage granted. The browser will protect this data from eviction.'
      : 'Persistent status not granted. The app will keep trying. Bookmark or install the app to improve eligibility.');
    refresh();
    setTimeout(() => setStatus(''), 6000);
  };

  return (
    <div>
      <div style={{...S.note, marginBottom: 16}}>
        All data lives in your browser's localStorage on this device. Export it weekly so you always have a backup file. If you ever clear your browser, switch devices, or hit a problem — import the most recent backup to restore.
      </div>

      {/* Install as App — the reliable path to persistent storage */}
      {(installPrompt || !isInstalled) && (
        <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.45)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            {isInstalled ? '✓ Installed as App' : 'Install for Best Durability'}
          </div>
          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.5, marginBottom: installPrompt || !isInstalled ? 10 : 0 }}>
            {isInstalled
              ? "Quez is running as an installed app. Persistent storage was granted automatically — your data is protected from browser eviction."
              : installPrompt
                ? "Install Quez to your home screen. Once installed, the browser automatically grants persistent storage and protects your data."
                : "Already installed elsewhere? Open the installed app for full durability. If installing isn't offered here, your browser may not support PWA install on this device. Try Chrome on Android or Safari → Share → Add to Home Screen on iOS."}
          </div>
          {installPrompt && (
            <button style={{...S.btn, ...S.btnGold, width: '100%'}} onClick={handleInstall}>
              ⬇ Install Quez App
            </button>
          )}
          {!installPrompt && !isInstalled && (
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.5 }}>
              <b style={{ color: '#D4AF37' }}>iPhone / iPad:</b> tap Share → "Add to Home Screen"<br />
              <b style={{ color: '#D4AF37' }}>Android Chrome:</b> tap ⋮ menu → "Install app"<br />
              <b style={{ color: '#D4AF37' }}>Desktop Chrome:</b> click the ⊕ install icon in the address bar
            </div>
          )}
        </div>
      )}

      {/* Storage health */}
      {health && (
        <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Storage Health</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#aaa' }}>Data used</span>
            <span style={{ color: '#D4AF37', fontWeight: 700 }}>
              {fmtBytes(health.usedBytes)}
              {health.quotaBytes > 0 && <span style={{ color: '#888', fontWeight: 400 }}> / {fmtBytes(health.quotaBytes)} ({health.percent}%)</span>}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#aaa' }}>Persistent</span>
            <span style={{ color: health.isPersistent ? '#4CAF50' : '#E05252', fontWeight: 700 }}>
              {health.isPersistent ? '✓ Protected from eviction' : '✗ Not protected'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: '#aaa' }}>Last backup</span>
            <span style={{ color: health.lastBackupAt ? '#F5F0E8' : '#E05252', fontWeight: 600 }}>
              {fmtDt(health.lastBackupAt)}
            </span>
          </div>
          {!health.isPersistent && (
            <button style={{...S.btn, ...S.btnGhost, width: '100%', marginTop: 10}} onClick={handleRequestPersist}>
              Request persistent storage
            </button>
          )}
        </div>
      )}

      {/* Auto-backup email — owner-managed business policy */}
      {viewerIsOwner && (
      <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          📧 Auto-Email Backup
        </div>
        <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.5, marginBottom: 10 }}>
          Sends a copy of every backup to your owner email + additional recipients automatically. Worst-case data loss is capped at one day.
        </div>

        <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #1a1a1a', cursor:'pointer'}}>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:'#F5F0E8'}}>Auto-backup enabled</div>
            <div style={{fontSize:11, color:'#888'}}>Master switch</div>
          </div>
          <Toggle checked={autoBackup.enabled} onChange={(v) => updateAuto({ enabled: v })} />
        </label>

        <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #1a1a1a', cursor:'pointer', opacity: autoBackup.enabled ? 1 : 0.4}}>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:'#F5F0E8'}}>Daily — first app open</div>
            <div style={{fontSize:11, color:'#888'}}>Fires once per calendar day, on the first interaction</div>
          </div>
          <Toggle checked={autoBackup.daily} onChange={(v) => updateAuto({ daily: v })} disabled={!autoBackup.enabled} />
        </label>

        <label style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', cursor:'pointer', opacity: autoBackup.enabled ? 1 : 0.4}}>
          <div>
            <div style={{fontSize:14, fontWeight:600, color:'#F5F0E8'}}>On closing checklist</div>
            <div style={{fontSize:11, color:'#888'}}>Belt-and-suspenders trigger at end of business day</div>
          </div>
          <Toggle checked={autoBackup.onClosingChecklist} onChange={(v) => updateAuto({ onClosingChecklist: v })} disabled={!autoBackup.enabled} />
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, padding: '8px 10px', background: '#1A1A1A', borderRadius: 6 }}>
          <div style={{fontSize:11, color:'#888'}}>Last auto-email</div>
          <div style={{fontSize:12, color: lastAuto ? '#D4AF37' : '#666', fontWeight:600}}>
            {lastAuto ? new Date(lastAuto).toLocaleString() : 'never'}
          </div>
        </div>

        <button
          style={{...S.btn, ...S.btnGhost, width: '100%', marginTop: 10, opacity: sendingNow ? 0.6 : 1}}
          disabled={sendingNow}
          onClick={sendAutoNow}
        >
          {sendingNow ? 'Sending...' : '✉ Send Backup Email Now'}
        </button>
      </div>
      )}

      {/* Export / Import — Export available to all admins, Import owner-only (destructive) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button style={{...S.btn, ...S.btnGold, flex: 1}} onClick={handleExport}>
          ⬇ Export Backup
        </button>
        {viewerIsOwner && (
          <>
            <button style={{...S.btn, ...S.btnGhost, flex: 1}} onClick={() => fileRef.current?.click()}>
              ⬆ Import Backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </>
        )}
      </div>
      {!viewerIsOwner && (
        <div style={{ fontSize: 11, color: '#888', fontStyle: 'italic', padding: '4px 0 8px' }}>
          Import (data restore) is owner-only — it overwrites all device data.
        </div>
      )}

      {status && (
        <div style={{ fontSize: 12, color: status.startsWith('Import failed') ? '#E05252' : '#4CAF50', padding: '6px 0' }}>
          {status}
        </div>
      )}

      <div style={{ fontSize: 11, color: '#666', marginTop: 8, lineHeight: 1.5 }}>
        <b>Tip:</b> Email the backup file to yourself once a week. If you ever lose this device's data, just open the email and import the attachment.
      </div>
    </div>
  );
}

function TodayOpsEditor() {
  const [seasonal, setSeasonal] = useState(() => getSeasonalDrink());
  const [location, setLocation] = useState(() => getTodayLocation());
  const [locationSchedule, setLocationScheduleState] = useState(() => getLocationSchedule());
  const [goal, setGoal] = useState(() => String(getDailyGoal() || ''));
  const [playlist, setPlaylist] = useState(() => getPlaylistUrl());

  return (
    <div>
      <div style={{...S.note, marginBottom: 14}}>
        Quick-update fields that appear on every employee's home page. Set the seasonal, where the unit is parked today, and a daily drinks goal.
      </div>
      <Field label="Featured / Seasonal Drink" note="Shown on Home as 'This season's drink'.">
        <input
          style={S.input}
          value={seasonal}
          onChange={(e) => { setSeasonal(e.target.value); setSeasonalDrink(e.target.value); }}
          placeholder="e.g. Lavender Honey Fog"
          maxLength={80}
        />
      </Field>
      <Field label="Today's Location" note="Where is the unit parked today? Shown on every Home.">
        <input
          style={S.input}
          value={location}
          onChange={(e) => { setLocation(e.target.value); setTodayLocation(e.target.value); }}
          placeholder="e.g. Broadway Corridor — West End"
          maxLength={80}
        />
        {isLocationOverridden() && (() => {
          const scheduled = getTodayScheduledLocation();
          return (
            <div style={{
              marginTop: 8,
              padding: '9px 12px',
              borderRadius: 8,
              background: 'rgba(255,184,74,0.08)',
              border: '1px solid rgba(255,184,74,0.4)',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: 12, color: '#FFB84A', fontWeight: 700 }}>
                Scheduled today: <strong style={{ color: '#FFCF7E' }}>{scheduled}</strong>
              </span>
              <span style={{ fontSize: 11, color: '#888' }}>using override</span>
              <button
                onClick={() => { setLocation(scheduled); setTodayLocation(scheduled); }}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: '1px solid #FFB84A',
                  color: '#FFB84A',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                }}
              >
                Revert
              </button>
            </div>
          );
        })()}
      </Field>
      <Field label="Weekly Location Schedule" note="Pre-fills Today's Location automatically on app boot each morning. Manual edits still override.">
        {['sun','mon','tue','wed','thu','fri','sat'].map((day) => (
          <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 44, fontSize: 11, fontWeight: 700, color: '#888',
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              {day}
            </div>
            <input
              style={{ ...S.input, flex: 1 }}
              value={locationSchedule[day] || ''}
              onChange={(e) => {
                const next = { ...locationSchedule, [day]: e.target.value };
                setLocationScheduleState(next);
                setLocationSchedule(next);
              }}
              placeholder="leave blank to skip auto-fill this day"
              maxLength={80}
            />
          </div>
        ))}
      </Field>
      <Field label="Daily Drink Goal" note="Drives the goal-progress bar + streak counter. Leave 0 to hide.">
        <input
          style={S.input}
          type="number"
          min={0}
          value={goal}
          onChange={(e) => { setGoal(e.target.value); setDailyGoal(parseInt(e.target.value, 10) || 0); }}
          placeholder="e.g. 150"
        />
      </Field>
      <Field label="Today's Playlist URL" note="Spotify, Apple Music, or YouTube link. Shows as a ▶ button on every Home.">
        <input
          style={S.input}
          type="url"
          value={playlist}
          onChange={(e) => { setPlaylist(e.target.value); setPlaylistUrl(e.target.value); }}
          placeholder="https://open.spotify.com/playlist/..."
        />
      </Field>
    </div>
  );
}

function PeriodicScheduleEditor() {
  const [cfg, setCfg] = useState(() => getPeriodicDueConfig());
  const update = (key, patch) => {
    const next = { ...cfg, [key]: { ...cfg[key], ...patch } };
    setCfg(next);
    savePeriodicDueConfig({ [key]: next[key] });
  };

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <div style={{...S.note, marginBottom: 16}}>
        Set the day each periodic checklist becomes due. Changes apply immediately and are checked against today's date.
      </div>

      {/* Weekly */}
      <div style={{marginBottom: 18}}>
        <div style={{fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 8, letterSpacing: '0.06em'}}>WEEKLY</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 13, color: '#aaa', flex: 1}}>Due every</span>
          <select
            style={{...S.input, width: 120}}
            value={cfg.weekly.dow}
            onChange={(e) => update('weekly', { dow: parseInt(e.target.value, 10) })}
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Monthly */}
      <div style={{marginBottom: 18}}>
        <div style={{fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 8, letterSpacing: '0.06em'}}>MONTHLY</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 13, color: '#aaa', flex: 1}}>Due on day</span>
          <select
            style={{...S.input, width: 100}}
            value={cfg.monthly.dom}
            onChange={(e) => update('monthly', { dom: parseInt(e.target.value, 10) })}
          >
            {Array.from({length: 28}, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span style={{fontSize: 12, color: '#666'}}>of the month</span>
        </div>
      </div>

      {/* Quarterly */}
      <div style={{marginBottom: 18}}>
        <div style={{fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 8, letterSpacing: '0.06em'}}>QUARTERLY</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
          <span style={{fontSize: 13, color: '#aaa', flex: 1}}>Due on day</span>
          <select
            style={{...S.input, width: 100}}
            value={cfg.quarterly.dom}
            onChange={(e) => update('quarterly', { dom: parseInt(e.target.value, 10) })}
          >
            {Array.from({length: 28}, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <span style={{fontSize: 12, color: '#666'}}>of these months:</span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4}}>
          {MONTHS.map((m, i) => {
            const active = cfg.quarterly.months.includes(i);
            return (
              <button
                key={i}
                type="button"
                style={{
                  background: active ? 'rgba(212,175,55,0.18)' : '#1A1A1A',
                  border: active ? '1px solid #D4AF37' : '1px solid #333',
                  color: active ? '#D4AF37' : '#888',
                  padding: '6px 0',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  const months = active
                    ? cfg.quarterly.months.filter((x) => x !== i)
                    : [...cfg.quarterly.months, i].sort((a, b) => a - b);
                  update('quarterly', { months });
                }}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Annual */}
      <div>
        <div style={{fontSize: 13, fontWeight: 700, color: '#D4AF37', marginBottom: 8, letterSpacing: '0.06em'}}>ANNUAL</div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontSize: 13, color: '#aaa', flex: 1}}>Due on</span>
          <select
            style={{...S.input, width: 110}}
            value={cfg.annual.month}
            onChange={(e) => update('annual', { month: parseInt(e.target.value, 10) })}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            style={{...S.input, width: 80}}
            value={cfg.annual.day}
            onChange={(e) => update('annual', { day: parseInt(e.target.value, 10) })}
          >
            {Array.from({length: 28}, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({message, onConfirm, onClose}) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.sheet,maxHeight:'40vh'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,lineHeight:1.6,color:'#F5F0E8',marginBottom:24}}>{message}</div>
        <div style={{display:'flex',gap:10}}>
          <button style={{...S.btn,...S.btnGhost,flex:1}} onClick={onClose}>Cancel</button>
          <button style={{...S.btn,...S.btnDanger,flex:1}} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsScreen({ initialSection = 'employees', singleSection = false }) {
  const { language, setLanguage, currentUser } = useApp();
  const viewerIsOwner = currentUser?.role === 'owner';
  const [settings, setSettingsState] = useState(()=>getSettings());
  const [employees, setEmployees] = useState(()=>getEmployees());
  const [menu, setMenu] = useState(()=>{
    const m = getMenu();
    return m.length > 0 ? m : DEFAULT_MENU_DRINKS;
  });
  // initialSection is set by deep-link routes like 'settings:menu' so opening
  // a specific Admin tile lands directly on the right section. singleSection
  // (true when the route includes ':') restricts the page to ONLY that
  // section so each one feels like its own page rather than a giant scroll.
  const [expanded, setExpanded] = useState(initialSection || 'employees');
  // In single-section mode, the section is fixed at the requested target
  // regardless of any local toggle attempts.
  const visibleSection = singleSection ? initialSection : expanded;
  const [toast, showToast] = useToast();
  const [empModal, setEmpModal] = useState(null);
  const [drinkModal, setDrinkModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const saveTimer = useRef(null);

  // Seed the default menu on first launch only. `menu` is initial-state derived, never re-evaluated.
  useEffect(()=>{
    if(menu.length>0 && getMenu().length===0) { saveMenu(menu); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  function persistSettings(next) {
    setSettingsState(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(()=>saveSettings(next), 500);
  }

  function updateSetting(path, value) {
    const keys = path.split('.');
    const next = {...settings};
    let obj = next;
    for (let i=0;i<keys.length-1;i++) { obj[keys[i]]={...obj[keys[i]]}; obj=obj[keys[i]]; }
    obj[keys[keys.length-1]] = value;
    persistSettings(next);
  }

  function toggleSection(id) { setExpanded(p=>p===id?null:id); }

  // Employees
  function saveEmployee(data) {
    const list = getEmployees();
    const idx = list.findIndex(e=>e.id===data.id);
    const next = idx>=0 ? list.map(e=>e.id===data.id?data:e) : [...list,data];
    saveEmployees(next);
    setEmployees(next);
    setEmpModal(null);
    showToast('Saved');
  }

  function toggleEmpActive(emp) {
    // Cannot deactivate an owner unless the viewer is also an owner; never deactivate yourself.
    if (emp.role === 'owner' && !viewerIsOwner) return;
    if (emp.id === currentUser?.id) return;
    setConfirm({
      message: emp.active ? `Deactivate ${emp.name}? They will be removed from the login screen.` : `Reactivate ${emp.name}?`,
      onConfirm: ()=>{
        const next = employees.map(e=>e.id===emp.id?{...e,active:!e.active}:e);
        saveEmployees(next); setEmployees(next); setConfirm(null); showToast('Saved');
      }
    });
  }

  // Hard-delete an employee record entirely. Owner-only, two-step confirm,
  // never self-delete, never delete the last remaining owner. Logged to the
  // audit trail so the deletion stays accountable.
  function deleteEmployee(emp) {
    if (!viewerIsOwner) return;
    if (emp.id === currentUser?.id) {
      showToast('Cannot delete yourself');
      return;
    }
    if (emp.role === 'owner') {
      const otherOwners = employees.filter(e => e.role === 'owner' && e.id !== emp.id && e.active);
      if (otherOwners.length === 0) {
        showToast('Cannot delete the last owner');
        return;
      }
    }
    setConfirm({
      message: `Permanently delete ${emp.name}? This removes the record entirely — login, training progress, drink history attribution. This cannot be undone.`,
      onConfirm: () => {
        // Second confirm — destructive, no recovery short of restoring a backup.
        setConfirm({
          message: `Are you absolutely sure? ${emp.name}'s record will be gone forever. Consider deactivating instead if you might bring them back.`,
          onConfirm: () => {
            const next = employees.filter(e => e.id !== emp.id);
            saveEmployees(next);
            setEmployees(next);
            logAudit('employee_deleted', {
              employeeId: emp.id,
              employeeName: emp.name,
              role: emp.role,
              byName: currentUser?.name || 'Owner',
            });
            setConfirm(null);
            showToast(`${emp.name} deleted`);
          },
        });
      },
    });
  }

  function setTrainingBypass(empId, val) {
    const next = employees.map(e=>e.id===empId?{...e,trainingBypass:val}:e);
    saveEmployees(next); setEmployees(next); showToast('Saved');
  }

  // Menu
  function saveDrink(data) {
    const idx = menu.findIndex(d=>d.id===data.id);
    const next = idx>=0 ? menu.map(d=>d.id===data.id?data:d) : [...menu,data];
    saveMenu(next); setMenu(next); setDrinkModal(null); showToast('Saved');
  }

  function toggle86(id) {
    const next = menu.map(d=>d.id===id?{...d,eightySix:!d.eightySix}:d);
    saveMenu(next); setMenu(next); showToast('Saved');
  }

  function removeDrink(drink) {
    setConfirm({
      message: `Remove "${drink.name}" from the menu permanently?`,
      onConfirm: ()=>{
        const next = menu.filter(d=>d.id!==drink.id);
        saveMenu(next); setMenu(next); setConfirm(null); showToast('Saved');
      }
    });
  }

  // Locations
  function addLocation() {
    const val = newLocation.trim();
    if (!val) return;
    if (settings.locations.includes(val)) { showToast('Already exists','error'); return; }
    updateSetting('locations',[...settings.locations,val]);
    setNewLocation('');
    showToast('Saved');
  }

  function removeLocation(loc) {
    if (settings.locations.length<=1) { showToast('Need at least one location','error'); return; }
    updateSetting('locations',settings.locations.filter(l=>l!==loc));
    showToast('Saved');
  }

  // Email test
  async function testEmail() {
    if (!window.emailjs) { showToast('EmailJS not loaded','error'); return; }
    const {ownerEmail,emailjs} = settings;
    if (!ownerEmail||!emailjs.serviceId||!emailjs.templateId||!emailjs.publicKey) {
      showToast('Fill in all email fields first','error'); return;
    }
    setEmailTesting(true);
    try {
      window.emailjs.init({publicKey: emailjs.publicKey});
      await window.emailjs.send(emailjs.serviceId, emailjs.templateId, {
        to_email: ownerEmail,
        subject: 'Quez App Test Email',
        message: 'Your EmailJS credentials are working correctly.'
      });
      showToast('Test email sent!');
    } catch(e) {
      console.error('EmailJS error:', JSON.stringify(e));
      showToast('Send failed: ' + (e.text || e.message || JSON.stringify(e)),'error');
    }
    setEmailTesting(false);
  }

  // Language
  function setLang(lang) {
    updateSetting('language', lang);
    setLanguage(lang);
    showToast('Saved');
  }

  const lang = language || 'en';

  // Section title labels — used to swap the page header into a
  // section-specific header when this screen is rendered as a single page.
  const SECTION_TITLES = {
    employees: 'Employee Management',
    email: 'Email Configuration',
    locations: 'Locations',
    timeLocks: 'Time Locks',
    todayOps: "Today's Operations",
    dataBackup: 'Data & Backup',
    periodicDue: 'Periodic Schedule',
    training: 'Training Settings',
    menu: 'Menu Management',
    language: 'Language',
  };
  const pageTitle = singleSection
    ? (SECTION_TITLES[visibleSection] || 'Settings')
    : 'Settings';
  const pageSub = singleSection
    ? (viewerIsOwner ? '' : 'Owner-only items hidden')
    : 'Owner access only';

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerTitle}>{pageTitle}</div>
        {pageSub && <div style={S.headerSub}>{pageSub}</div>}
      </div>

      <div style={S.body}>

        {/* EMPLOYEES */}
        <Section id="employees" icon="👥" title="Employee Management" expanded={visibleSection==='employees'} onToggle={toggleSection} singleMode={singleSection}>
          {employees.map(emp=>(
            <div key={emp.id} style={{...S.row, opacity:emp.active?1:0.45}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#2A2A2A',border:`2px solid ${ROLE_COLORS[emp.role]||'#888'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:ROLE_COLORS[emp.role]||'#888',flexShrink:0}}>
                {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:'#F5F0E8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {emp.name}{emp.role==='owner'&&<span style={{color:'#D4AF37',marginLeft:6,fontSize:11}}>★</span>}
                </div>
                <div style={{fontSize:12,color:ROLE_COLORS[emp.role]||'#888',marginTop:1}}>
                  {ROLE_LABELS[emp.role]}{emp.pin&&PIN_ROLES.includes(emp.role)&&<span style={{color:'#555',marginLeft:8}}>PIN ••••</span>}
                </div>
              </div>
              {(() => {
                // Manager cannot edit an owner row; owner can edit anyone.
                const isOwnerRow = emp.role === 'owner';
                const canEdit = viewerIsOwner || !isOwnerRow;
                if (!canEdit) {
                  return (
                    <div style={{fontSize:11,color:'#666',fontStyle:'italic',whiteSpace:'nowrap'}}>read-only</div>
                  );
                }
                // Owner-only purge: hard-delete an employee record. Hidden for
                // self and for the last owner. Distinct from deactivate (the
                // ✕ / ↩ button below) which keeps the record for history.
                const canDelete = viewerIsOwner && emp.id !== currentUser?.id && (
                  emp.role !== 'owner' ||
                  employees.filter(e => e.role === 'owner' && e.id !== emp.id && e.active).length > 0
                );
                return (
                  <div style={{display:'flex',gap:6}}>
                    <button style={{...S.btn,padding:'5px 10px',fontSize:13,...S.btnGhost}} onClick={()=>setEmpModal(emp)}>✎</button>
                    <button style={{...S.btn,padding:'5px 10px',fontSize:13,...(emp.active?S.btnDanger:S.btnSuccess)}} onClick={()=>toggleEmpActive(emp)} title={emp.active?'Deactivate':'Reactivate'}>
                      {emp.active?'✕':'↩'}
                    </button>
                    {canDelete && (
                      <button
                        style={{...S.btn,padding:'5px 8px',fontSize:13,background:'transparent',border:'1px solid #E05252',color:'#E05252'}}
                        onClick={()=>deleteEmployee(emp)}
                        title="Delete permanently"
                      >🗑</button>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
          <button style={{...S.btn,...S.btnGold,width:'100%',marginTop:16}} onClick={()=>setEmpModal({})}>
            + Add Employee
          </button>
        </Section>

        {/* EMAIL */}
        <Section id="email" icon="✉️" title="Email Configuration" expanded={visibleSection==='email'} onToggle={toggleSection} singleMode={singleSection}>
          <Field label="Owner Email Address" note="All automatic emails are sent here">
            <input style={S.input} type="email" value={settings.ownerEmail} onChange={e=>updateSetting('ownerEmail',e.target.value)} placeholder="owner@quezcoffeeco.com" />
          </Field>
          <Field label="Additional Recipients" note="One per line. Reports are also sent to these addresses (bookkeeper, regional, etc).">
            <textarea
              style={{...S.input, minHeight: 70, fontFamily: 'inherit'}}
              value={(settings.additionalEmails || []).join('\n')}
              onChange={(e) => updateSetting('additionalEmails', e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              placeholder={'bookkeeper@example.com\nregional@example.com'}
              rows={3}
            />
          </Field>
          <div style={{...S.divider}} />
          {viewerIsOwner ? (
            <>
              <div style={{fontSize:12,fontWeight:700,color:'#D4AF37',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:14}}>EmailJS Credentials (Owner Only)</div>
              <Field label="Service ID">
                <input style={S.input} value={settings.emailjs.serviceId} onChange={e=>updateSetting('emailjs.serviceId',e.target.value)} placeholder="service_xxxxxxx" autoCapitalize="off" autoCorrect="off" />
              </Field>
              <Field label="Template ID">
                <input style={S.input} value={settings.emailjs.templateId} onChange={e=>updateSetting('emailjs.templateId',e.target.value)} placeholder="template_xxxxxxx" autoCapitalize="off" autoCorrect="off" />
              </Field>
              <Field label="Public Key" note="Find these at emailjs.com → Account → API Keys">
                <input style={S.input} type="password" value={settings.emailjs.publicKey} onChange={e=>updateSetting('emailjs.publicKey',e.target.value)} placeholder="Public key" autoCapitalize="off" autoCorrect="off" />
              </Field>
              <button style={{...S.btn,...S.btnGhost,width:'100%',marginTop:4}} onClick={testEmail} disabled={emailTesting}>
                {emailTesting ? 'Sending...' : 'Send Test Email'}
              </button>
            </>
          ) : (
            <div style={{padding:'10px 12px',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.25)',borderRadius:8,fontSize:12,color:'#aaa'}}>
              EmailJS provider credentials are owner-managed and not editable from the Manager role.
            </div>
          )}
        </Section>

        {/* LOCATIONS */}
        <Section id="locations" icon="📍" title="Locations" expanded={visibleSection==='locations'} onToggle={toggleSection} singleMode={singleSection}>
          <div style={{...S.note,marginBottom:12}}>These appear in the location dropdown at login.</div>
          {settings.locations.map(loc=>(
            <div key={loc} style={{...S.row}}>
              <span style={{flex:1,fontSize:14,color:'#F5F0E8'}}>📍 {loc}</span>
              {settings.locations.length>1&&(
                <button style={{...S.btn,...S.btnDanger,...S.btnSm}} onClick={()=>removeLocation(loc)}>Remove</button>
              )}
            </div>
          ))}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <input style={{...S.input,flex:1}} value={newLocation} onChange={e=>setNewLocation(e.target.value)} placeholder="New location name" onKeyDown={e=>e.key==='Enter'&&addLocation()} />
            <button style={{...S.btn,...S.btnGold}} onClick={addLocation}>Add</button>
          </div>
        </Section>

        {/* TIME LOCKS */}
        <Section id="timeLocks" icon="🕐" title="Time Locks" expanded={visibleSection==='timeLocks'} onToggle={toggleSection} singleMode={singleSection}>
          <div style={{...S.note,marginBottom:16}}>When enabled, employees cannot access checklist sections until the configured time.</div>
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:15,fontWeight:600,color:'#F5F0E8'}}>Opening Section</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:settings.timeLocks.openingLockEnabled?'#D4AF37':'#666'}}>{settings.timeLocks.openingLockEnabled?'Enabled':'Disabled'}</span>
                <Toggle checked={settings.timeLocks.openingLockEnabled} onChange={v=>updateSetting('timeLocks.openingLockEnabled',v)} />
              </div>
            </div>
            {settings.timeLocks.openingLockEnabled&&(
              <div>
                <span style={S.label}>Unlock Time</span>
                <input style={{...S.input,width:'auto'}} type="time" value={settings.timeLocks.openingUnlockTime} onChange={e=>updateSetting('timeLocks.openingUnlockTime',e.target.value)} />
              </div>
            )}
          </div>
          <div style={S.divider} />
          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:15,fontWeight:600,color:'#F5F0E8'}}>Closing Section</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:settings.timeLocks.closingLockEnabled?'#D4AF37':'#666'}}>{settings.timeLocks.closingLockEnabled?'Enabled':'Disabled'}</span>
                <Toggle checked={settings.timeLocks.closingLockEnabled} onChange={v=>updateSetting('timeLocks.closingLockEnabled',v)} />
              </div>
            </div>
            {settings.timeLocks.closingLockEnabled&&(
              <div>
                <span style={S.label}>Unlock Time</span>
                <input style={{...S.input,width:'auto'}} type="time" value={settings.timeLocks.closingUnlockTime} onChange={e=>updateSetting('timeLocks.closingUnlockTime',e.target.value)} />
              </div>
            )}
          </div>
        </Section>

        {/* TODAY'S OPERATIONS — owner sets the daily business policy */}
        {viewerIsOwner && (
          <Section id="todayOps" icon="☕" title="Today's Operations" expanded={visibleSection==='todayOps'} onToggle={toggleSection} singleMode={singleSection}>
            <TodayOpsEditor />
          </Section>
        )}

        {/* DATA & BACKUP */}
        <Section id="dataBackup" icon="💾" title="Data & Backup" expanded={visibleSection==='dataBackup'} onToggle={toggleSection} singleMode={singleSection}>
          <DataBackupEditor viewerIsOwner={viewerIsOwner} />
        </Section>

        {/* PERIODIC SCHEDULE */}
        <Section id="periodicDue" icon="📅" title="Periodic Checklist Schedule" expanded={visibleSection==='periodicDue'} onToggle={toggleSection} singleMode={singleSection}>
          <PeriodicScheduleEditor />
        </Section>

        {/* TRAINING BYPASS */}
        <Section id="training" icon="🎓" title="Training Settings" expanded={visibleSection==='training'} onToggle={toggleSection} singleMode={singleSection}>
          <div style={{...S.note,marginBottom:12}}>
            Bypass skips all training phases and immediately grants the assigned role.
            {!viewerIsOwner && (
              <span style={{display:'block',marginTop:4,color:'#888',fontSize:11,fontStyle:'italic'}}>
                Viewing as Manager — bypass toggles are read-only for audit reasons. Ask the owner to change.
              </span>
            )}
          </div>
          {employees.filter(e=>e.active&&e.role!=='owner').map(emp=>(
            <div key={emp.id} style={S.row}>
              <div style={{width:30,height:30,borderRadius:'50%',background:'#2A2A2A',border:`1px solid ${ROLE_COLORS[emp.role]||'#888'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:ROLE_COLORS[emp.role]||'#888',flexShrink:0}}>
                {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,color:'#F5F0E8'}}>{emp.name}</div>
                <div style={{fontSize:12,color:'#666'}}>{ROLE_LABELS[emp.role]}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,color:emp.trainingBypass?'#C88B4B':'#666'}}>{emp.trainingBypass?'Bypassed':'Required'}</span>
                <Toggle checked={!!emp.trainingBypass} onChange={v=>setTrainingBypass(emp.id,v)} disabled={!viewerIsOwner} />
              </div>
            </div>
          ))}
          {employees.filter(e=>e.active&&e.role!=='owner').length===0&&(
            <div style={{textAlign:'center',padding:'20px 0',color:'#555',fontSize:13}}>No other employees yet.</div>
          )}
        </Section>

        {/* MENU */}
        <Section id="menu" icon="☕" title="Menu Management" expanded={visibleSection==='menu'} onToggle={toggleSection} singleMode={singleSection}>
          {CATEGORIES.map(cat=>{
            const drinks = menu.filter(d=>d.category===cat);
            if (!drinks.length) return null;
            return (
              <div key={cat} style={{marginBottom:18}}>
                <div style={S.catLabel}>{cat}</div>
                {drinks.map(drink=>(
                  <div key={drink.id} style={S.row}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:drink.eightySix?'#555':'#F5F0E8',textDecoration:drink.eightySix?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {drink.name}
                        {drink.eightySix&&<span style={{marginLeft:8,fontSize:10,fontWeight:800,background:'rgba(200,75,75,0.15)',border:'1px solid #C84B4B',color:'#C84B4B',padding:'1px 6px',borderRadius:4}}>86</span>}
                      </div>
                      <div style={{fontSize:12,color:'#666',marginTop:1}}>${drink.price12.toFixed(2)} / ${drink.price16.toFixed(2)}</div>
                    </div>
                    <div style={{display:'flex',gap:5,flexShrink:0}}>
                      {/* Managers can 86/un-86 (operational), owner can edit pricing/delete (financial) */}
                      <button style={{...S.btn,...S.btnSm,...(drink.eightySix?S.btnSuccess:S.btnDanger)}} onClick={()=>toggle86(drink.id)}>
                        {drink.eightySix?'UN-86':'86'}
                      </button>
                      {viewerIsOwner ? (
                        <>
                          <button style={{...S.btn,...S.btnGhost,...S.btnSm}} onClick={()=>setDrinkModal(drink)}>✎</button>
                          <button style={{...S.btn,...S.btnDanger,...S.btnSm}} onClick={()=>removeDrink(drink)}>✕</button>
                        </>
                      ) : (
                        <span style={{fontSize:10,color:'#666',padding:'4px 6px'}}>owner-only</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {viewerIsOwner && (
            <button style={{...S.btn,...S.btnGold,width:'100%',marginTop:8}} onClick={()=>setDrinkModal({})}>+ Add Drink</button>
          )}
        </Section>

        {/* LANGUAGE */}
        <Section id="language" icon="🌐" title="Language" expanded={visibleSection==='language'} onToggle={toggleSection} singleMode={singleSection}>
          <div style={{display:'flex',gap:10}}>
            <button style={{...S.btn,flex:1,...(lang==='en'?S.btnGold:S.btnGhost)}} onClick={()=>setLang('en')}>🇺🇸 English</button>
            <button style={{...S.btn,flex:1,...(lang==='es'?S.btnGold:S.btnGhost)}} onClick={()=>setLang('es')}>🇲🇽 Español</button>
          </div>
        </Section>

        <div style={{height:32}} />
      </div>

      {empModal&&<EmployeeModal emp={Object.keys(empModal).length?empModal:null} employees={employees} onSave={saveEmployee} onClose={()=>setEmpModal(null)} />}
      {drinkModal&&<DrinkModal drink={Object.keys(drinkModal).length?drinkModal:null} onSave={saveDrink} onClose={()=>setDrinkModal(null)} />}
      {confirm&&<ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onClose={()=>setConfirm(null)} />}
      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
