// src/screens/DailyChecklistScreen.jsx
// Session 4 — Opening Section only
// Mid-service and Closing sections are built in Session 5

import React, { useState, useEffect, useCallback } from 'react';
import {
  OPENING_CHECKLIST_SECTIONS,
  validateReading,
  getTodayKey,
} from '../data/openingChecklistData';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { sendEmail, EMAIL_TYPES } from '../utils/email';

// ─── constants ───────────────────────────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'dailyChecklist_opening_';
const FLAG_KEY_PREFIX = 'dailyChecklist_flags_';
const SUBMITTED_KEY_PREFIX = 'dailyChecklist_opening_submitted_';

// ─── helpers ─────────────────────────────────────────────────────────────────
function getOpeningUnlockTime() {
  const settings = loadFromStorage('settings') || {};
  // Default 5:00 AM if not configured
  return settings.openingUnlockTime || '05:00';
}

function isOpeningUnlocked() {
  const settings = loadFromStorage('settings') || {};
  if (!settings.timeLocks) return true;
  if (!settings.timeLocks.openingLockEnabled) return true;
  const now = new Date();
  const unlockTime = settings.timeLocks.openingUnlockTime || '05:00';
  const [h, m] = unlockTime.split(':').map(Number);
  const unlock = new Date(now);
  unlock.setHours(h, m, 0, 0);
  return now >= unlock;
}

function isAlreadySubmittedToday() {
  return !!loadFromStorage(SUBMITTED_KEY_PREFIX + getTodayKey());
}

// ─── component ───────────────────────────────────────────────────────────────
export default function DailyChecklistScreen({ currentUser, language }) {
  const es = language === 'es';
  const todayKey = getTodayKey();
  const storageKey = STORAGE_KEY_PREFIX + todayKey;
  const flagKey = FLAG_KEY_PREFIX + todayKey;

  // All item values: { itemId: value }
  const [values, setValues] = useState(() => loadFromStorage(storageKey) || {});
  // Flags: items that have been detected out of range and alert already sent
  const [alertsSent, setAlertsSent] = useState(() => loadFromStorage(flagKey + '_alerts') || {});
  // Corrective action notes: { itemId: noteText }
  const [corrections, setCorrections] = useState(() => loadFromStorage(storageKey + '_corrections') || {});
  // Track which numeric fields have been touched (blurred) so we don't validate mid-type
  const [touched, setTouched] = useState({});

  const [unlocked, setUnlocked] = useState(isOpeningUnlocked());
  const [alreadySubmitted, setAlreadySubmitted] = useState(isAlreadySubmittedToday());
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [sendingAlert, setSendingAlert] = useState({});

  // Re-check unlock every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUnlocked(isOpeningUnlocked());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Persist values to localStorage on every change
  useEffect(() => {
    saveToStorage(storageKey, values);
  }, [values, storageKey]);

  useEffect(() => {
    saveToStorage(storageKey + '_corrections', corrections);
  }, [corrections, storageKey]);

  useEffect(() => {
    saveToStorage(flagKey + '_alerts', alertsSent);
  }, [alertsSent, flagKey]);

  // ── value handlers ──────────────────────────────────────────────────────────
  const handleValue = (itemId, value) => {
    setValues(prev => ({ ...prev, [itemId]: value }));
  };

  const handleBlur = async (item) => {
    setTouched(prev => ({ ...prev, [item.id]: true }));
    // Fire out-of-range alert email if not already sent
    if (item.type === 'temperature' || item.type === 'ppm') {
      const val = values[item.id];
      if (val === undefined || val === '') return;
      const result = validateReading(item, val);
      if (!result.valid && !alertsSent[item.id]) {
        await fireOutOfRangeAlert(item, val, result.reason);
      }
    }
  };

  const fireOutOfRangeAlert = async (item, value, reason) => {
    setSendingAlert(prev => ({ ...prev, [item.id]: true }));
    try {
      const settings = loadFromStorage('settings') || {};
      const clockIn = loadFromStorage('currentClockIn') || {};
      await sendEmail(EMAIL_TYPES.OUT_OF_RANGE_ALERT, {
        operator: currentUser?.name || 'Unknown',
        location: clockIn.location || settings.defaultLocation || 'Council Bluffs',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        item: item.label,
        reading: `${value}${item.unit || ''}`,
        reason: reason,
        reference: item.reference || '',
      });
      setAlertsSent(prev => ({ ...prev, [item.id]: true }));
    } catch (err) {
      console.error('Alert email failed:', err);
    } finally {
      setSendingAlert(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCorrection = (itemId, text) => {
    setCorrections(prev => ({ ...prev, [itemId]: text }));
  };

  // ── validation ──────────────────────────────────────────────────────────────
  const getItemStatus = useCallback((item) => {
    const val = values[item.id];

    if (item.type === 'yes_no') {
      if (val === 'yes' || val === 'no') return 'complete';
      return 'empty';
    }

    if (item.type === 'time_entry' || item.type === 'text_entry') {
      if (val && val.trim()) return 'complete';
      return 'empty';
    }

    if (item.type === 'temperature' || item.type === 'ppm') {
      if (!val && val !== 0) return 'empty';
      const result = validateReading(item, val);
      if (result.valid) return 'complete';
      if (!touched[item.id]) return 'entered';
      if (corrections[item.id]?.trim()) return 'flagged_corrected';
      return 'flagged';
    }

    return 'empty';
  }, [values, touched, corrections]);

  // All items across all sections flattened
  const allItems = OPENING_CHECKLIST_SECTIONS.flatMap(s => s.items);

  const completedCount = allItems.filter(item => {
    const status = getItemStatus(item);
    return status === 'complete' || status === 'flagged_corrected';
  }).length;

  const totalCount = allItems.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const canSubmit =
    allItems.every(item => {
      const status = getItemStatus(item);
      return status === 'complete' || status === 'flagged_corrected';
    }) && !submitting && !alreadySubmitted;

  // ── submission ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const settings = loadFromStorage('settings') || {};
      const clockIn = loadFromStorage('currentClockIn') || {};
      const location = clockIn.location || settings.defaultLocation || 'Council Bluffs';

      // Build full log text for email
      const logLines = [];
      logLines.push('QUEZ COFFEE CO. — DAILY OPENING CHECKLIST');
      logLines.push(`Date: ${new Date().toLocaleDateString()}`);
      logLines.push(`Time: ${new Date().toLocaleTimeString()}`);
      logLines.push(`Operator: ${currentUser?.name || 'Unknown'}`);
      logLines.push(`Location: ${location}`);
      logLines.push('');

      OPENING_CHECKLIST_SECTIONS.forEach(section => {
        logLines.push(`── ${section.label.toUpperCase()} ──`);
        section.items.forEach(item => {
          const val = values[item.id] ?? 'Not entered';
          const status = getItemStatus(item);
          const flag = (status === 'flagged' || status === 'flagged_corrected') ? ' ⚠ OUT OF RANGE' : '';
          logLines.push(`  ${item.label}: ${val}${item.unit || ''}${flag}`);
          if (corrections[item.id]) {
            logLines.push(`    ↳ Corrective action: ${corrections[item.id]}`);
          }
        });
        logLines.push('');
      });

      const flaggedItems = allItems
        .filter(item => {
          const s = getItemStatus(item);
          return s === 'flagged' || s === 'flagged_corrected';
        })
        .map(item => `${item.label}: ${values[item.id]}${item.unit || ''}`);

      await sendEmail(EMAIL_TYPES.CHECKLIST_SUBMISSION, {
        checklistType: 'Daily Opening',
        operator: currentUser?.name || 'Unknown',
        location,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        log: logLines.join('\n'),
        flaggedCount: flaggedItems.length,
        flaggedItems: flaggedItems.join(', ') || 'None',
      });

      // Save submission record
      saveToStorage(SUBMITTED_KEY_PREFIX + todayKey, {
        submittedAt: new Date().toISOString(),
        operator: currentUser?.name,
        flaggedCount: flaggedItems.length,
      });

      setAlreadySubmitted(true);
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Submission failed:', err);
      alert(es ? 'Error al enviar. Intente de nuevo.' : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  if (alreadySubmitted && submitSuccess) {
    return <SubmitSuccess es={es} />;
  }

  if (alreadySubmitted) {
    return <AlreadySubmitted es={es} />;
  }

  if (!unlocked) {
    return <TimeLocked es={es} unlockTime={getOpeningUnlockTime()} />;
  }

  return (
    <div style={styles.screen}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.sectionTag}>
            {es ? 'DIARIO' : 'DAILY'}
          </span>
          <span style={styles.headerTitle}>
            {es ? 'Lista de Apertura' : 'Opening Checklist'}
          </span>
        </div>
        <div style={styles.operatorLine}>
          {currentUser?.name} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressContainer}>
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressFill,
              width: `${progressPct}%`,
              background: progressPct === 100 ? 'var(--gold)' : 'var(--gold)',
              opacity: progressPct === 100 ? 1 : 0.7,
            }}
          />
        </div>
        <span style={styles.progressLabel}>
          {completedCount}/{totalCount} &nbsp;{es ? 'completos' : 'complete'} &nbsp;·&nbsp; {progressPct}%
        </span>
      </div>

      {/* Sections */}
      <div style={styles.sections}>
        {OPENING_CHECKLIST_SECTIONS.map(section => (
          <ChecklistSection
            key={section.id}
            section={section}
            values={values}
            corrections={corrections}
            touched={touched}
            alertsSent={alertsSent}
            sendingAlert={sendingAlert}
            es={es}
            getItemStatus={getItemStatus}
            onValue={handleValue}
            onBlur={handleBlur}
            onCorrection={handleCorrection}
          />
        ))}
      </div>

      {/* Submit */}
      <div style={styles.submitArea}>
        {!canSubmit && completedCount < totalCount && (
          <p style={styles.submitHint}>
            {es
              ? `Completa todos los ${totalCount} elementos para enviar`
              : `Complete all ${totalCount} items to submit`}
          </p>
        )}
        {!canSubmit && completedCount === totalCount && (
          <p style={{ ...styles.submitHint, color: 'var(--gold)' }}>
            {es
              ? 'Agrega notas de acción correctiva para los elementos marcados'
              : 'Add corrective action notes for flagged items'}
          </p>
        )}
        <button
          style={{
            ...styles.submitBtn,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting
            ? (es ? 'Enviando...' : 'Submitting...')
            : (es ? 'Enviar Lista de Apertura' : 'Submit Opening Checklist')}
        </button>
      </div>
    </div>
  );
}

// ─── ChecklistSection ─────────────────────────────────────────────────────────
function ChecklistSection({
  section, values, corrections, touched, alertsSent, sendingAlert, es,
  getItemStatus, onValue, onBlur, onCorrection,
}) {
  return (
    <div style={styles.sectionBlock}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionDivider} />
        <span style={styles.sectionLabel}>
          {es ? section.labelEs : section.label}
        </span>
        <span style={styles.sectionDivider} />
      </div>
      {section.items.map(item => (
        <ChecklistItem
          key={item.id}
          item={item}
          value={values[item.id]}
          correction={corrections[item.id] || ''}
          isTouched={!!touched[item.id]}
          alertSent={!!alertsSent[item.id]}
          sendingAlert={!!sendingAlert[item.id]}
          es={es}
          status={getItemStatus(item)}
          onValue={onValue}
          onBlur={onBlur}
          onCorrection={onCorrection}
        />
      ))}
    </div>
  );
}

// ─── ChecklistItem ────────────────────────────────────────────────────────────
function ChecklistItem({
  item, value, correction, isTouched, alertSent, sendingAlert,
  es, status, onValue, onBlur, onCorrection,
}) {
  const isOutOfRange = status === 'flagged' || status === 'flagged_corrected';
  const isComplete = status === 'complete' || status === 'flagged_corrected';

  const label = es && item.labelEs ? item.labelEs : item.label;
  const reference = es && item.referenceEs ? item.referenceEs : item.reference;

  const rowStyle = {
    ...styles.itemRow,
    borderLeft: isOutOfRange
      ? '3px solid #E53935'
      : isComplete
        ? '3px solid var(--gold)'
        : '3px solid var(--mid-gray)',
    background: isOutOfRange ? 'rgba(229, 57, 53, 0.05)' : 'var(--dark-gray)',
  };

  return (
    <div style={rowStyle}>
      {/* Status dot */}
      <div style={styles.itemTopRow}>
        <div style={styles.statusDot(status)} />
        <div style={styles.itemLabelArea}>
          <span style={styles.itemLabel}>{label}</span>
          {reference && (
            <span style={styles.itemReference}>{reference}</span>
          )}
        </div>
        <div style={styles.itemInput}>
          <ItemControl
            item={item}
            value={value}
            es={es}
            onValue={onValue}
            onBlur={onBlur}
          />
        </div>
      </div>

      {/* Out of range banner + corrective action */}
      {isOutOfRange && (
        <div style={styles.flagArea}>
          <div style={styles.flagBanner}>
            <span style={styles.flagIcon}>⚠</span>
            <span style={styles.flagText}>
              {es ? 'FUERA DE RANGO — Acción correctiva requerida' : 'OUT OF RANGE — Corrective action required'}
            </span>
            {sendingAlert && (
              <span style={styles.alertSending}>
                {es ? 'Enviando alerta...' : 'Sending alert...'}
              </span>
            )}
            {alertSent && !sendingAlert && (
              <span style={styles.alertSent}>
                {es ? '✓ Alerta enviada' : '✓ Alert sent'}
              </span>
            )}
          </div>
          <textarea
            style={{
              ...styles.correctionInput,
              borderColor: correction.trim() ? 'var(--gold)' : '#E53935',
            }}
            placeholder={es
              ? 'Describe la acción correctiva tomada...'
              : 'Describe corrective action taken...'}
            value={correction}
            onChange={e => onCorrection(item.id, e.target.value)}
            rows={2}
          />
          {!correction.trim() && (
            <span style={styles.correctionRequired}>
              {es ? 'Requerido antes de enviar' : 'Required before submission'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ItemControl — renders the right input type per item ─────────────────────
function ItemControl({ item, value, es, onValue, onBlur }) {
  if (item.type === 'yes_no') {
    return (
      <div style={styles.yesNoGroup}>
        <button
          style={{
            ...styles.yesNoBtn,
            background: value === 'yes' ? '#51d437' : 'transparent',
color: value === 'yes' ? '#0D0D0D' : '#000000',
          }}
          onClick={() => onValue(item.id, 'yes')}
        >
          {es ? 'SÍ' : 'YES'}
        </button>
        <button
          style={{
            ...styles.yesNoBtn,
            background: value === 'no' ? '#E53935' : 'transparent',
            color: value === 'no' ? '#000000' : '#000000',
          }}
          onClick={() => onValue(item.id, 'no')}
        >
          NO
        </button>
      </div>
    );
  }

  if (item.type === 'temperature' || item.type === 'ppm') {
    return (
      <div style={styles.numericGroup}>
        <input
          type="number"
          inputMode="decimal"
          style={styles.numericInput}
          value={value ?? ''}
          onChange={e => onValue(item.id, e.target.value)}
          onBlur={() => onBlur(item)}
          placeholder="—"
        />
        <span style={styles.unitLabel}>{item.unit}</span>
      </div>
    );
  }

  if (item.type === 'time_entry') {
    return (
      <input
        type="time"
        style={styles.timeInput}
        value={value ?? ''}
        onChange={e => onValue(item.id, e.target.value)}
      />
    );
  }

  if (item.type === 'text_entry') {
    return (
      <input
        type="text"
        style={styles.textInput}
        value={value ?? ''}
        onChange={e => onValue(item.id, e.target.value)}
        placeholder={es ? 'Escribir...' : 'Enter...'}
      />
    );
  }

  return null;
}

// ─── State screens ────────────────────────────────────────────────────────────
function TimeLocked({ es, unlockTime }) {
  const [h, m] = unlockTime.split(':').map(Number);
  const displayTime = new Date();
  displayTime.setHours(h, m);
  const formatted = displayTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div style={styles.stateScreen}>
      <div style={styles.lockIcon}>🔒</div>
      <h2 style={styles.stateTitle}>
        {es ? 'Lista de Apertura Bloqueada' : 'Opening Checklist Locked'}
      </h2>
      <p style={styles.stateBody}>
        {es
          ? `Disponible a las ${formatted}. Regresa entonces para comenzar.`
          : `Available at ${formatted}. Come back then to begin.`}
      </p>
      <p style={styles.stateNote}>
        {es
          ? 'El tiempo de apertura es configurable en Configuración.'
          : 'Opening time is configurable in Settings.'}
      </p>
    </div>
  );
}

function AlreadySubmitted({ es }) {
  return (
    <div style={styles.stateScreen}>
      <div style={styles.lockIcon}>✅</div>
      <h2 style={styles.stateTitle}>
        {es ? 'Ya enviado hoy' : 'Already Submitted Today'}
      </h2>
      <p style={styles.stateBody}>
        {es
          ? 'La lista de apertura de hoy ya fue completada y enviada.'
          : "Today's opening checklist has already been completed and submitted."}
      </p>
    </div>
  );
}

function SubmitSuccess({ es }) {
  return (
    <div style={styles.stateScreen}>
      <div style={styles.lockIcon}>✅</div>
      <h2 style={styles.stateTitle}>
        {es ? '¡Lista enviada!' : 'Checklist Submitted!'}
      </h2>
      <p style={styles.stateBody}>
        {es
          ? 'La lista de apertura fue registrada y el correo fue enviado.'
          : 'Opening checklist logged and email sent.'}
      </p>
      <p style={styles.stateNote}>
        {es ? 'Buen trabajo. Que tengas un gran día.' : 'Good work. Have a great shift.'}
      </p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  screen: {
    minHeight: '100vh',
    background: 'var(--jet-black)',
    paddingBottom: 120,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  header: {
    background: 'var(--dark-gray)',
    borderBottom: '1px solid rgba(212,175,55,0.2)',
    padding: '20px 20px 16px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'var(--gold)',
    background: 'rgba(212,175,55,0.12)',
    padding: '3px 8px',
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Georgia, serif',
    color: 'var(--cream)',
    fontWeight: 400,
  },
  operatorLine: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.5)',
    letterSpacing: '0.03em',
  },
  progressContainer: {
    padding: '12px 20px',
    background: 'var(--dark-gray)',
    borderBottom: '1px solid rgba(212,175,55,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  progressLabel: {
    fontSize: 12,
    color: 'var(--gold)',
    whiteSpace: 'nowrap',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  sections: {
    padding: '8px 0',
  },
  sectionBlock: {
    marginBottom: 4,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 20px 10px',
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    background: 'rgba(212,175,55,0.2)',
    display: 'block',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--gold)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  itemRow: {
    margin: '0 16px 8px',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftStyle: 'solid',
    padding: '12px 14px',
    transition: 'border-color 0.2s, background 0.2s',
  },
  itemTopRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  statusDot: (status) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 5,
    flexShrink: 0,
    background:
      status === 'complete' ? 'var(--gold)' :
      status === 'flagged_corrected' ? '#FFA726' :
      status === 'flagged' ? '#E53935' :
      status === 'entered' ? 'rgb(0, 0, 0)' :
      'rgba(255,255,255,0.2)',
    transition: 'background 0.2s',
  }),
  itemLabelArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
    color: 'var(--cream)',
    lineHeight: 1.3,
  },
  itemReference: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
    display: 'block',
    marginTop: 2,
  },
  itemInput: {
    flexShrink: 0,
  },
  yesNoGroup: {
    display: 'flex',
    gap: 4,
  },
  yesNoBtn: {
    padding: '6px 12px',
    border: '1px solid rgb(0, 0, 0)',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    minWidth: 44,
  },
  numericGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  numericInput: {
    width: 72,
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 6,
    color: 'var(--cream)',
    fontSize: 16,
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'Georgia, serif',
  },
  unitLabel: {
    fontSize: 11,
    color: 'rgba(245,240,232,0.5)',
    minWidth: 24,
  },
  timeInput: {
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 6,
    color: 'var(--cream)',
    fontSize: 14,
    outline: 'none',
  },
  textInput: {
    width: 120,
    padding: '6px 8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 6,
    color: 'var(--cream)',
    fontSize: 14,
    outline: 'none',
  },
  flagArea: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid rgba(229,57,53,0.2)',
  },
  flagBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  flagIcon: {
    fontSize: 14,
  },
  flagText: {
    fontSize: 12,
    fontWeight: 700,
    color: '#E53935',
    letterSpacing: '0.04em',
  },
  alertSending: {
    fontSize: 11,
    color: 'rgba(245,240,232,0.5)',
    fontStyle: 'italic',
  },
  alertSent: {
    fontSize: 11,
    color: 'var(--gold)',
    fontWeight: 600,
  },
  correctionInput: {
    width: '100%',
    padding: '8px 10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid',
    borderRadius: 6,
    color: 'var(--cream)',
    fontSize: 13,
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  correctionRequired: {
    fontSize: 11,
    color: '#E53935',
    marginTop: 4,
    display: 'block',
  },
  submitArea: {
    position: 'fixed',
    bottom: 80,
    left: 0,
    right: 0,
    padding: '12px 20px',
    background: 'var(--jet-black)',
    borderTop: '1px solid rgba(212,175,55,0.15)',
  },
  submitHint: {
    fontSize: 12,
    color: 'rgba(245,240,232,0.5)',
    textAlign: 'center',
    marginBottom: 8,
    margin: '0 0 8px',
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: 'var(--gold)',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontFamily: 'Georgia, serif',
    transition: 'opacity 0.2s',
  },
  stateScreen: {
    minHeight: '100vh',
    background: 'var(--jet-black)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    textAlign: 'center',
  },
  lockIcon: {
    fontSize: 52,
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 24,
    fontFamily: 'Georgia, serif',
    color: 'var(--cream)',
    fontWeight: 400,
    marginBottom: 12,
  },
  stateBody: {
    fontSize: 16,
    color: 'rgba(245,240,232,0.7)',
    lineHeight: 1.6,
    maxWidth: 360,
    marginBottom: 12,
  },
  stateNote: {
    fontSize: 13,
    color: 'rgba(245,240,232,0.4)',
    fontStyle: 'italic',
  },
};
