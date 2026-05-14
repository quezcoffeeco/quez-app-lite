import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getActiveEmployees, getSettings, addClockInRecord, getPinLockout, setPinLockout, clearPinLockout } from '../utils/storage';
import { sendClockInEmail } from '../utils/emailjs';
import { t, roleLabel } from '../utils/i18n';
import './LoginScreen.css';

const PIN_ROLES = ['owner', 'manager'];
const MAX_ATTEMPTS = 3;

export default function LoginScreen() {
  const { login, language } = useApp();
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState('select');
  const [error, setError] = useState('');
  const [lockout, setLockoutState] = useState({ attempts: 0, lockedUntil: null });

  useEffect(() => {
    const active = getActiveEmployees();
    const settings = getSettings();
    setEmployees(active);
    setLocations(settings.locations || ['Council Bluffs - Trailer']);
    if (settings.locations && settings.locations.length === 1) {
      setSelectedLocation(settings.locations[0]);
    }
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) return;
  setLockoutState(getPinLockout(selectedEmployeeId) || { attempts: 0, lockedUntil: null });
    setPin('');
    setError('');
  }, [selectedEmployeeId]);

  const selectedEmployee = employees.find(function(e) { return e.id === selectedEmployeeId; }) || null;
  const requiresPin = selectedEmployee && PIN_ROLES.includes(selectedEmployee.role);
  const isLocked = lockout.lockedUntil !== null;
  const attemptsLeft = MAX_ATTEMPTS - (lockout.attempts || 0);

  function handleEmployeeChange(e) {
    setSelectedEmployeeId(e.target.value);
    setPhase('select');
    setPin('');
    setError('');
  }

  function handleLocationChange(e) {
    setSelectedLocation(e.target.value);
  }

  function handleContinue() {
    if (!selectedEmployeeId || !selectedLocation) return;
    if (requiresPin) {
      setPhase('pin');
    } else {
      doClockIn(selectedEmployee);
    }
  }

  function handlePinDigit(digit) {
    if (pin.length >= 4) return;
    var next = pin + digit;
    setPin(next);
    setError('');
    if (next.length === 4) {
      setTimeout(function() { validatePin(next); }, 120);
    }
  }

  function handlePinBackspace() {
    setPin(function(p) { return p.slice(0, -1); });
    setError('');
  }

  function validatePin(entered) {
    if (!selectedEmployee) return;
    if (entered === String(selectedEmployee.pin)) {
      clearPinLockout(selectedEmployee.id);
      doClockIn(selectedEmployee);
    } else {
      var newAttempts = (lockout.attempts || 0) + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        var lockedState = { attempts: newAttempts, lockedUntil: new Date().toISOString() };
        setPinLockout(selectedEmployee.id, lockedState);
        setLockoutState(lockedState);
        setPin('');
        setError(t('accountLocked', language));
      } else {
        var failState = { attempts: newAttempts, lockedUntil: null };
        setPinLockout(selectedEmployee.id, failState);
        setLockoutState(failState);
        setPin('');
        setError(t('incorrectPin', language) + ' - ' + (MAX_ATTEMPTS - newAttempts) + ' attempts remaining');
      }
    }
  }

  function doClockIn(employee) {
    setPhase('loading');
    var clockInTime = new Date().toISOString();
    var sessionData = {
      id: employee.id,
      name: employee.name,
      role: employee.role,
      location: selectedLocation,
      clockInTime: clockInTime,
    };
    addClockInRecord({
      employeeId: employee.id,
      name: employee.name,
      role: employee.role,
      location: selectedLocation,
      clockInTime: clockInTime,
    });
    sendClockInEmail({
      name: employee.name,
      role: roleLabel(employee.role, language),
      location: selectedLocation,
      clockInTime: clockInTime,
    });
    setPhase('success');
    setTimeout(function() { login(sessionData); }, 1200);
  }

  function renderPinDots() {
    return (
      <div className="ls-pin-dots">
        {[0,1,2,3].map(function(i) {
          return <span key={i} className={'ls-pin-dot ' + (i < pin.length ? 'filled' : '')} />;
        })}
      </div>
    );
  }

  function renderNumpad() {
    var digits = ['1','2','3','4','5','6','7','8','9','','0','back'];
    return (
      <div className="ls-numpad">
        {digits.map(function(d, i) {
          if (d === '') return <span key={i} className="ls-numpad-spacer" />;
          if (d === 'back') return <button key={i} className="ls-numpad-key ls-numpad-back" onClick={handlePinBackspace}>&#9003;</button>;
          return <button key={i} className="ls-numpad-key" onClick={function() { handlePinDigit(d); }} disabled={isLocked}>{d}</button>;
        })}
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="ls-root ls-success-screen">
        <div className="ls-seal">Q</div>
        <p className="ls-success-name">{t('welcomeBack', language, selectedEmployee && selectedEmployee.name)}</p>
        <p className="ls-success-role">{roleLabel(selectedEmployee && selectedEmployee.role, language)}</p>
        <div className="ls-loading-ring" />
      </div>
    );
  }

  return (
    <div className="ls-root">
      <div className="ls-header">
        <div className="ls-seal">Q</div>
        <h1 className="ls-title">{t('appName', language)}</h1>
        <p className="ls-subtitle">{t('tagline', language)}</p>
      </div>
      <div className="ls-card">
        {phase === 'select' && (
          <div className="ls-select-phase">
            <div className="ls-field">
              <label className="ls-label">{t('selectEmployee', language)}</label>
              {employees.length === 0 ? (
                <p className="ls-empty-state">{t('noEmployeesConfigured', language)}</p>
              ) : (
                <div className="ls-select-wrap">
                  <select className="ls-select" value={selectedEmployeeId} onChange={handleEmployeeChange}>
                    <option value="">— Select Name —</option>
                    {employees.map(function(emp) {
                      return <option key={emp.id} value={emp.id}>{emp.name}{emp.role === 'owner' ? ' ★' : ''}</option>;
                    })}
                  </select>
                  <span className="ls-select-arrow">▾</span>
                </div>
              )}
            </div>
            {locations.length > 1 && (
              <div className="ls-field">
                <label className="ls-label">{t('selectLocation', language)}</label>
                <div className="ls-select-wrap">
                  <select className="ls-select" value={selectedLocation} onChange={handleLocationChange}>
                    <option value="">— Select Location —</option>
                    {locations.map(function(loc) {
                      return <option key={loc} value={loc}>{loc}</option>;
                    })}
                  </select>
                  <span className="ls-select-arrow">▾</span>
                </div>
              </div>
            )}
            {selectedEmployee && (
              <div className="ls-role-badge">
                <span className="ls-role-dot" />
                {roleLabel(selectedEmployee.role, language)}
              </div>
            )}
            {isLocked && <p className="ls-error">Account locked. Contact owner.</p>}
            <button className="ls-btn-primary" disabled={!selectedEmployeeId || !selectedLocation || isLocked} onClick={handleContinue}>
              {requiresPin ? t('enterPin', language) : t('signIn', language)}
            </button>
          </div>
        )}
        {phase === 'pin' && (
          <div className="ls-pin-phase">
            <div className="ls-pin-identity">
              <p className="ls-pin-name">{selectedEmployee && selectedEmployee.name}</p>
              <p className="ls-pin-role">{roleLabel(selectedEmployee && selectedEmployee.role, language)}</p>
            </div>
            <p className="ls-pin-prompt">{t('enterPin', language)}</p>
            {renderPinDots()}
            {error && <div className="ls-error">{error}</div>}
            {renderNumpad()}
            <button className="ls-btn-ghost" onClick={function() { setPhase('select'); setPin(''); setError(''); }}>Back</button>
          </div>
        )}
        {phase === 'loading' && (
          <div className="ls-loading-phase">
            <div className="ls-loading-ring" />
            <p className="ls-loading-text">{t('clockingIn', language)}</p>
          </div>
        )}
      </div>
      <p className="ls-footer">Quez Coffee Co. LLC · Veteran-Owned</p>
    </div>
  );
}