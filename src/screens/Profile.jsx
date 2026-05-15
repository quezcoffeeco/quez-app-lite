// ============================================================
// QUEZ APP LITE — Profile.jsx
// Universal per-user screen: change PIN + language preference.
// Available to every role.
// ============================================================

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getEmployees, updateEmployee, getSettings, saveSettings, resetMyHomeLayout, resetMyAdminLayout } from '../utils/storage';

export default function Profile() {
  const { currentUser, language, setLanguage } = useApp();
  const lang = language || 'en';

  // Lookup live employee record (the session might be stale on language field)
  const employees = getEmployees();
  const liveEmp = employees.find((e) => e.id === currentUser?.id) || currentUser;

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError]     = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  const handlePinChange = () => {
    setPinError('');
    setPinSuccess('');
    if (currentPin !== String(liveEmp?.pin || '')) {
      setPinError(lang === 'es' ? 'PIN actual incorrecto.' : 'Current PIN incorrect.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError(lang === 'es' ? 'El PIN nuevo debe ser de 4 dígitos.' : 'New PIN must be 4 digits.');
      return;
    }
    if (newPin === '0000') {
      setPinError(lang === 'es' ? 'Elige un PIN diferente al predeterminado.' : 'Pick a PIN other than the default.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError(lang === 'es' ? 'Los PIN no coinciden.' : 'PINs do not match.');
      return;
    }
    updateEmployee(liveEmp.id, { pin: newPin, mustChangePin: false });
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinSuccess(lang === 'es' ? 'PIN actualizado.' : 'PIN updated.');
    setTimeout(() => setPinSuccess(''), 3000);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Persist on the employee record so it sticks to the user
    updateEmployee(liveEmp.id, { language: newLang });
    // Also update app-level setting so it sticks across sessions for this device
    const s = getSettings();
    saveSettings({ ...s, language: newLang });
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>
          {lang === 'es' ? 'Mi Perfil' : 'My Profile'}
        </div>
        <div style={S.headerSub}>
          {liveEmp?.name} · {liveEmp?.role}
        </div>
      </div>

      <div style={S.body}>
        {/* Account card */}
        <div style={S.card}>
          <div style={S.cardLabel}>
            {lang === 'es' ? 'Cuenta' : 'Account'}
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>{lang === 'es' ? 'Nombre' : 'Name'}</span>
            <span style={S.rowValue}>{liveEmp?.name}</span>
          </div>
          <div style={S.row}>
            <span style={S.rowLabel}>{lang === 'es' ? 'Rol' : 'Role'}</span>
            <span style={S.rowValue}>{liveEmp?.role}</span>
          </div>
        </div>

        {/* Language */}
        <div style={S.card}>
          <div style={S.cardLabel}>
            {lang === 'es' ? 'Idioma' : 'Language'}
          </div>
          <div style={S.langRow}>
            {['en', 'es'].map((code) => (
              <button
                key={code}
                style={{ ...S.langBtn, ...(lang === code ? S.langBtnActive : {}) }}
                onClick={() => handleLanguageChange(code)}
              >
                {code === 'en' ? 'English' : 'Español'}
              </button>
            ))}
          </div>
        </div>

        {/* PIN change */}
        <div style={S.card}>
          <div style={S.cardLabel}>
            {lang === 'es' ? 'Cambiar PIN' : 'Change PIN'}
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>
              {lang === 'es' ? 'PIN actual' : 'Current PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={S.input}
            />
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>
              {lang === 'es' ? 'PIN nuevo' : 'New PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={S.input}
            />
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>
              {lang === 'es' ? 'Confirmar PIN nuevo' : 'Confirm new PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={S.input}
            />
          </div>

          {pinError && <div style={S.errorMsg}>{pinError}</div>}
          {pinSuccess && <div style={S.successMsg}>✓ {pinSuccess}</div>}

          <button style={S.btnGold} onClick={handlePinChange}>
            {lang === 'es' ? 'Actualizar PIN' : 'Update PIN'}
          </button>
        </div>

        {/* Layout / customization */}
        <div style={S.card}>
          <div style={S.cardLabel}>
            {lang === 'es' ? 'Personalización' : 'Customization'}
          </div>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 10 }}>
            {lang === 'es'
              ? 'Reordena y oculta tarjetas en Inicio o el panel de Admin desde sus pantallas. Esto restaura el orden original.'
              : 'Rearrange and hide cards on Home and the Admin Hub from those screens. This restores defaults.'}
          </div>
          <button
            style={{ ...S.btnGold, background: 'transparent', border: '1px solid rgba(212,175,55,0.40)', color: '#D4AF37' }}
            onClick={() => {
              if (!window.confirm(lang === 'es' ? '¿Restaurar el diseño predeterminado?' : 'Reset layout to defaults?')) return;
              resetMyHomeLayout(liveEmp.id);
              resetMyAdminLayout(liveEmp.id);
              window.alert(lang === 'es' ? 'Diseño restablecido.' : 'Layout reset.');
            }}
          >
            ↻ {lang === 'es' ? 'Restablecer Diseño' : 'Reset Layout to Defaults'}
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  screen: {
    background: '#0D0D0D',
    minHeight: '100vh',
    color: '#F5F0E8',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    paddingBottom: 100,
  },
  header: {
    background: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    padding: '20px 20px 14px',
    textAlign: 'center',
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },

  body: { padding: '16px' },

  card: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 800,
    marginBottom: 12,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  rowLabel: { color: '#888', fontSize: 13 },
  rowValue: { color: '#F5F0E8', fontSize: 14, fontWeight: 600 },

  langRow: { display: 'flex', gap: 8 },
  langBtn: {
    flex: 1,
    background: '#2A2A2A',
    border: '1px solid #333',
    color: '#888',
    padding: '10px 14px',
    borderRadius: 7,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  langBtnActive: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
  },

  formGroup: { marginBottom: 12 },
  label: {
    display: 'block',
    fontSize: 11,
    color: '#888',
    letterSpacing: '0.04em',
    fontWeight: 600,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 7,
    color: '#F5F0E8',
    fontFamily: 'inherit',
    fontSize: 16,
    padding: '10px 13px',
    outline: 'none',
    boxSizing: 'border-box',
    letterSpacing: '0.3em',
  },
  errorMsg: {
    color: '#E05252',
    fontSize: 13,
    marginBottom: 10,
  },
  successMsg: {
    color: '#4CAF50',
    fontSize: 13,
    marginBottom: 10,
  },
  btnGold: {
    width: '100%',
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 4,
  },
};
