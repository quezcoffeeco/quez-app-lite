import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSettings, saveSettings, getEmployees, saveEmployees, getMenu, saveMenu } from '../utils/storage';
import { t } from '../utils/i18n';

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

function Toggle({checked, onChange}) {
  return (
    <label style={S.toggle}>
      <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} style={{position:'absolute',opacity:0,width:0,height:0}} />
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

function Section({id, icon, title, expanded, onToggle, children}) {
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
  const [pin, setPin] = useState(emp?.pin||'');
  const [err, setErr] = useState({});
  const needsPin = PIN_ROLES.includes(role);

  function save() {
    const e = {};
    if (!name.trim()) e.name = 'Required';
    else if (!isEdit && employees.some(x=>x.active&&x.name.toLowerCase()===name.trim().toLowerCase())) e.name = 'Name already exists';
    if (needsPin && !/^\d{4}$/.test(pin)) e.pin = 'Must be exactly 4 digits';
    if (Object.keys(e).length) { setErr(e); return; }
    onSave({...(emp||{}), name:name.trim(), role, pin:needsPin?pin:'', active:true, id:emp?.id||('emp-'+Date.now()), createdAt:emp?.createdAt||new Date().toISOString()});
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
        {needsPin && (
          <Field label="PIN" note="4 digits, required for Owner and Manager">
            <input style={S.input} type="password" inputMode="numeric" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} placeholder="4-digit PIN" maxLength={4} />
            {err.pin && <div style={{...S.note,color:'#C84B4B'}}>{err.pin}</div>}
          </Field>
        )}
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

export default function SettingsScreen() {
  const { language, setLanguage } = useApp();
  const [settings, setSettingsState] = useState(()=>getSettings());
  const [employees, setEmployees] = useState(()=>getEmployees());
  const [menu, setMenu] = useState(()=>{
    const m = getMenu();
    return m.length > 0 ? m : DEFAULT_MENU_DRINKS;
  });
  const [expanded, setExpanded] = useState('employees');
  const [toast, showToast] = useToast();
  const [empModal, setEmpModal] = useState(null);
  const [drinkModal, setDrinkModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [emailTesting, setEmailTesting] = useState(false);
  const saveTimer = useRef(null);

  useEffect(()=>{
    if(menu.length>0 && getMenu().length===0) { saveMenu(menu); }
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
    if (emp.id==='emp-owner-001') return;
    setConfirm({
      message: emp.active ? `Deactivate ${emp.name}? They will be removed from the login screen.` : `Reactivate ${emp.name}?`,
      onConfirm: ()=>{
        const next = employees.map(e=>e.id===emp.id?{...e,active:!e.active}:e);
        saveEmployees(next); setEmployees(next); setConfirm(null); showToast('Saved');
      }
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

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerTitle}>Settings</div>
        <div style={S.headerSub}>Owner access only</div>
      </div>

      <div style={S.body}>

        {/* EMPLOYEES */}
        <Section id="employees" icon="👥" title="Employee Management" expanded={expanded==='employees'} onToggle={toggleSection}>
          {employees.map(emp=>(
            <div key={emp.id} style={{...S.row, opacity:emp.active?1:0.45}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#2A2A2A',border:`2px solid ${ROLE_COLORS[emp.role]||'#888'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:ROLE_COLORS[emp.role]||'#888',flexShrink:0}}>
                {emp.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,color:'#F5F0E8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {emp.name}{emp.id==='emp-owner-001'&&<span style={{color:'#D4AF37',marginLeft:6,fontSize:11}}>★</span>}
                </div>
                <div style={{fontSize:12,color:ROLE_COLORS[emp.role]||'#888',marginTop:1}}>
                  {ROLE_LABELS[emp.role]}{emp.pin&&PIN_ROLES.includes(emp.role)&&<span style={{color:'#555',marginLeft:8}}>PIN ••••</span>}
                </div>
              </div>
              {emp.id!=='emp-owner-001'&&(
                <div style={{display:'flex',gap:6}}>
                  <button style={{...S.btn,padding:'5px 10px',fontSize:13,...S.btnGhost}} onClick={()=>setEmpModal(emp)}>✎</button>
                  <button style={{...S.btn,padding:'5px 10px',fontSize:13,...(emp.active?S.btnDanger:S.btnSuccess)}} onClick={()=>toggleEmpActive(emp)}>
                    {emp.active?'✕':'↩'}
                  </button>
                </div>
              )}
            </div>
          ))}
          <button style={{...S.btn,...S.btnGold,width:'100%',marginTop:16}} onClick={()=>setEmpModal({})}>
            + Add Employee
          </button>
        </Section>

        {/* EMAIL */}
        <Section id="email" icon="✉️" title="Email Configuration" expanded={expanded==='email'} onToggle={toggleSection}>
          <Field label="Owner Email Address" note="All automatic emails are sent here">
            <input style={S.input} type="email" value={settings.ownerEmail} onChange={e=>updateSetting('ownerEmail',e.target.value)} placeholder="owner@quezcoffeeco.com" />
          </Field>
          <div style={{...S.divider}} />
          <div style={{fontSize:12,fontWeight:700,color:'#D4AF37',letterSpacing:'0.07em',textTransform:'uppercase',marginBottom:14}}>EmailJS Credentials</div>
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
        </Section>

        {/* LOCATIONS */}
        <Section id="locations" icon="📍" title="Locations" expanded={expanded==='locations'} onToggle={toggleSection}>
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
        <Section id="timeLocks" icon="🕐" title="Time Locks" expanded={expanded==='timeLocks'} onToggle={toggleSection}>
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

        {/* TRAINING BYPASS */}
        <Section id="training" icon="🎓" title="Training Settings" expanded={expanded==='training'} onToggle={toggleSection}>
          <div style={{...S.note,marginBottom:12}}>Bypass skips all training phases and immediately grants the assigned role.</div>
          {employees.filter(e=>e.active&&e.id!=='emp-owner-001').map(emp=>(
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
                <Toggle checked={!!emp.trainingBypass} onChange={v=>setTrainingBypass(emp.id,v)} />
              </div>
            </div>
          ))}
          {employees.filter(e=>e.active&&e.id!=='emp-owner-001').length===0&&(
            <div style={{textAlign:'center',padding:'20px 0',color:'#555',fontSize:13}}>No other employees yet.</div>
          )}
        </Section>

        {/* MENU */}
        <Section id="menu" icon="☕" title="Menu Management" expanded={expanded==='menu'} onToggle={toggleSection}>
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
                      <button style={{...S.btn,...S.btnSm,...(drink.eightySix?S.btnSuccess:S.btnDanger)}} onClick={()=>toggle86(drink.id)}>
                        {drink.eightySix?'UN-86':'86'}
                      </button>
                      <button style={{...S.btn,...S.btnGhost,...S.btnSm}} onClick={()=>setDrinkModal(drink)}>✎</button>
                      <button style={{...S.btn,...S.btnDanger,...S.btnSm}} onClick={()=>removeDrink(drink)}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <button style={{...S.btn,...S.btnGold,width:'100%',marginTop:8}} onClick={()=>setDrinkModal({})}>+ Add Drink</button>
        </Section>

        {/* LANGUAGE */}
        <Section id="language" icon="🌐" title="Language" expanded={expanded==='language'} onToggle={toggleSection}>
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
