// ============================================================
// QUEZ APP LITE — Daily Checklist Screen
// Sessions 4 + 5: Opening (S4) + Mid-Service + Closing (S5)
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { OPENING_ITEMS, MID_SERVICE_ITEMS, CLOSING_ITEMS } from '../data/checklistItems';
import {
  sendOutOfRangeAlert,
  sendDailyChecklistEmail,
  sendClockOutEmail,
} from '../utils/emailService';
import {
  saveDailyChecklistRecord,
  markDailyChecklistSubmitted,
  isDailyChecklistSubmittedToday,
  isSectionUnlocked,
  loadSettings,
  loadCurrentUser,
  saveFlaggedItem,
} from '../utils/storage';

// ── Helpers ───────────────────────────────────────────────
const formatTime = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return '—';
  const diffMs = new Date(endIso) - new Date(startIso);
  const totalMin = Math.floor(diffMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const isOutOfRange = (item, value) => {
  if (item.type !== 'temp' && item.type !== 'ppm') return false;
  if (value === '' || value === null || value === undefined) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num < item.min || num > item.max;
};

const getRangeLabel = (item) => {
  if (item.type === 'temp' || item.type === 'ppm') {
    if (item.min === 0) return `≤${item.max}${item.unit}`;
    if (item.max === 212) return `≥${item.min}${item.unit}`;
    return `${item.min}–${item.max} ${item.unit}`;
  }
  return '';
};

// ── Section component ─────────────────────────────────────
const ChecklistSection = ({ section, lang, values, onChange, onRangeAlert }) => {
  const label = lang === 'es' ? section.sectionLabelEs : section.sectionLabel;
  const sectionNote = lang === 'es' ? section.noteEs : section.note;

  return (
    <div className="cl-section">
      <div className="cl-section-header">
        <span className="cl-section-title">{label}</span>
        {sectionNote && <span className="cl-section-note">{sectionNote}</span>}
      </div>
      <div className="cl-items">
        {section.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            lang={lang}
            value={values[item.id] || ''}
            correctiveAction={values[`${item.id}_corrective`] || ''}
            onChange={onChange}
            onRangeAlert={onRangeAlert}
          />
        ))}
      </div>
    </div>
  );
};

// ── Individual item component ─────────────────────────────
const ChecklistItem = ({ item, lang, value, correctiveAction, onChange, onRangeAlert }) => {
  const label = lang === 'es' ? item.labelEs : item.label;
  const note = lang === 'es' ? item.noteEs : item.note;
  const flagged = isOutOfRange(item, value);
  const rangeLabel = getRangeLabel(item);

  const handleNumericBlur = () => {
    if (flagged) {
      onRangeAlert(item, value);
    }
  };

  return (
    <div className={`cl-item ${flagged ? 'cl-item--flagged' : ''}`}>
      <div className="cl-item-main">
        <div className="cl-item-label">
          <span className="cl-item-name">{label}</span>
          {note && <span className="cl-item-note">{note}</span>}
          {flagged && (
            <span className="cl-item-flag-badge">
              ⚠ {lang === 'es' ? 'FUERA DE RANGO' : 'OUT OF RANGE'}
            </span>
          )}
        </div>
        <div className="cl-item-control">
          {item.type === 'check' && (
            <button
              className={`cl-toggle ${value === 'yes' ? 'cl-toggle--on' : ''}`}
              onClick={() => onChange(item.id, value === 'yes' ? '' : 'yes')}
              type="button"
            >
              {value === 'yes' ? '✓' : '—'}
            </button>
          )}
          {(item.type === 'temp' || item.type === 'ppm') && (
            <input
              className={`cl-input cl-input--num ${flagged ? 'cl-input--flagged' : ''}`}
              type="number"
              inputMode="decimal"
              placeholder={rangeLabel}
              value={value}
              onChange={(e) => onChange(item.id, e.target.value)}
              onBlur={handleNumericBlur}
            />
          )}
          {item.type === 'text' && (
            <input
              className="cl-input cl-input--text"
              type="text"
              placeholder={lang === 'es' ? 'Escribir...' : 'Enter...'}
              value={value}
              onChange={(e) => onChange(item.id, e.target.value)}
            />
          )}
          {item.type === 'time' && (
            <input
              className="cl-input cl-input--time"
              type="time"
              value={value}
              onChange={(e) => onChange(item.id, e.target.value)}
            />
          )}
        </div>
      </div>
      {flagged && (
        <div className="cl-corrective">
          <label className="cl-corrective-label">
            {lang === 'es' ? '→ Acción correctiva requerida:' : '→ Corrective action required:'}
          </label>
          <input
            className="cl-input cl-input--corrective"
            type="text"
            placeholder={lang === 'es' ? 'Describa la acción tomada...' : 'Describe action taken...'}
            value={correctiveAction}
            onChange={(e) => onChange(`${item.id}_corrective`, e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

// ── Tab bar ───────────────────────────────────────────────
const TABS = [
  { id: 'opening', label: 'Opening', labelEs: 'Apertura' },
  { id: 'mid', label: 'Mid-Service', labelEs: 'Medio Servicio' },
  { id: 'closing', label: 'Closing', labelEs: 'Cierre' },
];

// ── Main Screen ───────────────────────────────────────────
const DailyChecklist = ({ onClockOut }) => {
  const settings = loadSettings();
  const lang = settings.language || 'en';
  const user = loadCurrentUser();

  const [activeTab, setActiveTab] = useState('opening');
  const [values, setValues] = useState({});
  const [alertsSent, setAlertsSent] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(isDailyChecklistSubmittedToday());
  const [toast, setToast] = useState(null);

  const openingUnlocked = isSectionUnlocked('opening');
  const closingUnlocked = isSectionUnlocked('closing');

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Value change handler ─────────────────────────────────
  const handleChange = (id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  };

  // ── Out-of-range alert ────────────────────────────────────
  const handleRangeAlert = async (item, value) => {
    const alertKey = `${item.id}_${value}`;
    if (alertsSent.has(alertKey)) return;
    setAlertsSent((prev) => new Set(prev).add(alertKey));

    const flagEntry = {
      label: item.label,
      value: `${value} ${item.unit || ''}`,
      acceptableRange: getRangeLabel(item),
      correctiveAction: values[`${item.id}_corrective`] || '(pending)',
      operator: user?.name || 'Unknown',
      section: activeTab,
      timestamp: new Date().toISOString(),
    };
    saveFlaggedItem(flagEntry);

    await sendOutOfRangeAlert({
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
      item: item.label,
      value: `${value} ${item.unit || ''}`,
      acceptableRange: getRangeLabel(item),
      section: activeTab === 'opening' ? 'Opening' : activeTab === 'mid' ? 'Mid-Service' : 'Closing',
    });

    showToast(
      lang === 'es'
        ? `⚠ Alerta enviada: ${item.labelEs}`
        : `⚠ Alert sent: ${item.label}`,
      'warning'
    );
  };

  // ── Completion checks ─────────────────────────────────────
  const isSectionComplete = (sectionGroups) => {
    for (const group of sectionGroups) {
      for (const item of group.items) {
        const val = values[item.id];
        // Required fields: check = must be 'yes', numeric = must have a value, time = must have a value
        if (item.type === 'check' && val !== 'yes') return false;
        if ((item.type === 'temp' || item.type === 'ppm') && (!val || val === '')) return false;
        if (item.type === 'time' && (!val || val === '')) return false;
        // text fields (low_stock, waste_dump_site) are optional unless mandatory
        // waste_dump_site IS required
        if (item.id === 'waste_dump_site' && (!val || val.trim() === '')) return false;
        // If flagged, corrective action is required
        if (isOutOfRange(item, val) && (!values[`${item.id}_corrective`] || values[`${item.id}_corrective`].trim() === '')) {
          return false;
        }
      }
    }
    return true;
  };

  const openingComplete = isSectionComplete(OPENING_ITEMS);
  const midComplete = isSectionComplete(MID_SERVICE_ITEMS);
  const closingComplete = isSectionComplete(CLOSING_ITEMS);
  const allComplete = openingComplete && midComplete && closingComplete;

  // ── Progress calculation ──────────────────────────────────
  const countItems = (groups) =>
    groups.reduce((acc, g) => acc + g.items.length, 0);

  const countCompleted = (groups) => {
    let done = 0;
    for (const group of groups) {
      for (const item of group.items) {
        const val = values[item.id];
        if (item.type === 'check' && val === 'yes') done++;
        else if ((item.type === 'temp' || item.type === 'ppm') && val && val !== '') done++;
        else if (item.type === 'time' && val && val !== '') done++;
        else if (item.type === 'text') done++; // text fields always count
      }
    }
    return done;
  };

  const allGroups = [...OPENING_ITEMS, ...MID_SERVICE_ITEMS, ...CLOSING_ITEMS];
  const totalItems = countItems(allGroups);
  const completedItems = countCompleted(allGroups);
  const progressPct = Math.round((completedItems / totalItems) * 100);

  // ── Build email-ready section data ────────────────────────
  const buildSectionData = (groups) =>
    groups.map((group) => ({
      sectionLabel: group.sectionLabel,
      items: group.items.map((item) => ({
        label: item.label,
        value: values[item.id] || '',
        flagged: isOutOfRange(item, values[item.id]),
        correctiveAction: values[`${item.id}_corrective`] || '',
        acceptableRange: getRangeLabel(item),
      })),
    }));

  // ── Submit handler ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!allComplete || submitting) return;
    setSubmitting(true);

    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const allSections = [
      ...buildSectionData(OPENING_ITEMS),
      ...buildSectionData(MID_SERVICE_ITEMS),
      ...buildSectionData(CLOSING_ITEMS),
    ];

    const flaggedItems = allSections
      .flatMap((s) => s.items)
      .filter((i) => i.flagged);

    // Save to localStorage
    const record = {
      operator: user?.name || 'Unknown',
      role: user?.role || 'Unknown',
      location: user?.location || 'Unknown',
      date,
      submittedAt: now.toISOString(),
      sections: allSections,
      flaggedItems,
    };
    saveDailyChecklistRecord(record);
    markDailyChecklistSubmitted(user?.name, user?.location);

    // Send full daily log email
    await sendDailyChecklistEmail({
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
      date,
      sections: allSections,
      flaggedItems,
    });

    // Send clock-out email
    const clockInTime = user?.clockInTime
      ? formatTime(user.clockInTime)
      : '(not recorded)';
    const clockOutTime = time;
    const duration = formatDuration(user?.clockInTime, now.toISOString());

    await sendClockOutEmail({
      name: user?.name || 'Unknown',
      role: user?.role || 'Unknown',
      location: user?.location || 'Unknown',
      clockInTime,
      clockOutTime,
      duration,
    });

    setSubmitting(false);
    setSubmitted(true);

    // Notify parent to handle navigation/clock-out UI
    if (onClockOut) {
      onClockOut({ clockOutTime: now.toISOString(), duration });
    }
  };

  // ── Already submitted today ───────────────────────────────
  if (submitted) {
    return (
      <div className="cl-screen cl-screen--done">
        <div className="cl-done-card">
          <div className="cl-done-icon">✓</div>
          <h2 className="cl-done-title">
            {lang === 'es' ? 'Lista del Día Completada' : 'Daily Checklist Complete'}
          </h2>
          <p className="cl-done-sub">
            {lang === 'es'
              ? 'El registro de hoy ha sido guardado y enviado.'
              : "Today's record has been saved and sent."}
          </p>
          <p className="cl-done-note">
            {lang === 'es'
              ? 'La hora de salida ha sido registrada.'
              : 'Clock-out has been recorded.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-screen">
      {/* Toast */}
      {toast && (
        <div className={`cl-toast cl-toast--${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="cl-header">
        <h1 className="cl-title">
          {lang === 'es' ? 'Lista de Operaciones Diaria' : 'Daily Operations Checklist'}
        </h1>
        <div className="cl-meta">
          <span className="cl-meta-user">{user?.name || '—'}</span>
          <span className="cl-meta-sep">·</span>
          <span className="cl-meta-location">{user?.location || '—'}</span>
          <span className="cl-meta-sep">·</span>
          <span className="cl-meta-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="cl-progress-wrap">
          <div className="cl-progress-bar">
            <div className="cl-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="cl-progress-label">{progressPct}%</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="cl-tabs">
        {TABS.map((tab) => {
          const isLocked =
            (tab.id === 'opening' && !openingUnlocked) ||
            (tab.id === 'closing' && !closingUnlocked);
          const isDone =
            (tab.id === 'opening' && openingComplete) ||
            (tab.id === 'mid' && midComplete) ||
            (tab.id === 'closing' && closingComplete);

          return (
            <button
              key={tab.id}
              className={`cl-tab ${activeTab === tab.id ? 'cl-tab--active' : ''} ${isLocked ? 'cl-tab--locked' : ''} ${isDone ? 'cl-tab--done' : ''}`}
              onClick={() => !isLocked && setActiveTab(tab.id)}
              type="button"
            >
              {isLocked && <span className="cl-tab-lock">🔒</span>}
              {isDone && !isLocked && <span className="cl-tab-check">✓</span>}
              {lang === 'es' ? tab.labelEs : tab.label}
            </button>
          );
        })}
      </div>

      {/* Time lock banners */}
      {activeTab === 'opening' && !openingUnlocked && (
        <div className="cl-locked-banner">
          <span className="cl-lock-icon">🔒</span>
          <span>
            {lang === 'es'
              ? `Sección de apertura disponible a las ${settings.openingUnlockTime || '5:30 AM'}`
              : `Opening section unlocks at ${settings.openingUnlockTime || '5:30 AM'}`}
          </span>
        </div>
      )}
      {activeTab === 'closing' && !closingUnlocked && (
        <div className="cl-locked-banner">
          <span className="cl-lock-icon">🔒</span>
          <span>
            {lang === 'es'
              ? `Sección de cierre disponible a las ${settings.closingUnlockTime || '1:00 PM'}`
              : `Closing section unlocks at ${settings.closingUnlockTime || '1:00 PM'}`}
          </span>
        </div>
      )}

      {/* Checklist items */}
      <div className="cl-body">
        {activeTab === 'opening' && openingUnlocked && OPENING_ITEMS.map((section) => (
          <ChecklistSection
            key={section.section}
            section={section}
            lang={lang}
            values={values}
            onChange={handleChange}
            onRangeAlert={handleRangeAlert}
          />
        ))}
        {activeTab === 'mid' && MID_SERVICE_ITEMS.map((section) => (
          <ChecklistSection
            key={section.section}
            section={section}
            lang={lang}
            values={values}
            onChange={handleChange}
            onRangeAlert={handleRangeAlert}
          />
        ))}
        {activeTab === 'closing' && closingUnlocked && CLOSING_ITEMS.map((section) => (
          <ChecklistSection
            key={section.section}
            section={section}
            lang={lang}
            values={values}
            onChange={handleChange}
            onRangeAlert={handleRangeAlert}
          />
        ))}
      </div>

      {/* Submit — only visible on closing tab when closing is unlocked */}
      {activeTab === 'closing' && closingUnlocked && (
        <div className="cl-submit-wrap">
          {!allComplete && (
            <p className="cl-submit-note">
              {lang === 'es'
                ? 'Completa todas las secciones para enviar.'
                : 'Complete all three sections to submit.'}
            </p>
          )}
          <button
            className={`cl-submit-btn ${allComplete ? 'cl-submit-btn--ready' : 'cl-submit-btn--disabled'}`}
            disabled={!allComplete || submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting
              ? (lang === 'es' ? 'Enviando...' : 'Submitting...')
              : (lang === 'es' ? 'Enviar Lista del Día + Registrar Salida' : 'Submit Daily Log + Clock Out')}
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyChecklist;
