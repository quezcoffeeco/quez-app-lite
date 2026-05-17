// ============================================================
// QUEZ APP LITE — Daily Checklist Screen
// Checklist state is global (date-based), not per-user.
// Anyone who logs in picks up exactly where it was left off.
// ============================================================
import React, { useState, useCallback } from 'react';
import { OPENING_ITEMS, MID_SERVICE_ITEMS, CLOSING_ITEMS } from '../data/checklistItems';
import { sendQuezEmail, sendStatusMessage } from '../utils/emailjs';
import {
  saveDailyChecklistRecord,
  markDailyChecklistSubmitted,
  isSectionUnlocked,
  loadSettings,
  getSession,
  saveFlaggedItem,
  saveChecklistState,
  loadChecklistState,
  storageGet,
} from '../utils/storage';
import { fmtClock } from '../utils/timeFormat';

// ── Helpers ───────────────────────────────────────────────
const fmtTime = (iso) => iso ? fmtClock(iso) : '—';

const fmtDate = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

const isItemComplete = (item, values) => {
  const val = values[item.id];
  // Items explicitly marked required:false don't gate the submit — they're
  // conditional ("check if yes", "leave blank if none"). Treated as complete
  // no matter what so the operator can submit without forcing a false answer.
  if (item.required === false) return true;
  if (item.type === 'check') return val === 'yes';
  if (item.type === 'range') return val === 'ok' || val === 'flag';
  if (item.type === 'text') {
    if (item.required) return val && val.trim() !== '';
    return true;
  }
  return false;
};

const isSectionGroupComplete = (groups, values) => {
  for (const group of groups) {
    for (const item of group.items) {
      if (!isItemComplete(item, values)) return false;
      if (item.type === 'range' && values[item.id] === 'flag') {
        const ca = values[`${item.id}_corrective`];
        if (!ca || ca.trim() === '') return false;
      }
    }
  }
  return true;
};

// ── Corrective Action Modal ───────────────────────────────
const CorrectiveModal = ({ item, lang, onSave, onClose }) => {
  const [text, setText] = useState('');
  const label = lang === 'es' ? item.labelEs : item.label;
  const range = lang === 'es' ? item.rangeLabelEs : item.rangeLabel;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={styles.modalWarning}>⚠</span>
          <span style={styles.modalTitle}>
            {lang === 'es' ? 'Fuera de Rango' : 'Out of Range'}
          </span>
        </div>
        <p style={styles.modalItem}>{label}</p>
        <p style={styles.modalRange}>
          {lang === 'es' ? 'Rango aceptable:' : 'Acceptable range:'}{' '}
          <strong style={{ color: '#D4AF37' }}>{range}</strong>
        </p>
        <p style={styles.modalPrompt}>
          {lang === 'es'
            ? 'Describe la acción correctiva tomada:'
            : 'Describe the corrective action taken:'}
        </p>
        <textarea
          style={styles.modalTextarea}
          placeholder={lang === 'es' ? 'Acción tomada...' : 'Action taken...'}
          value={text}
          onChange={e => setText(e.target.value)}
          autoFocus
          rows={3}
        />
        <div style={styles.modalBtns}>
          <button style={styles.modalBtnGhost} onClick={onClose} type="button">
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button
            style={{
              ...styles.modalBtnGold,
              opacity: text.trim() ? 1 : 0.4,
              cursor: text.trim() ? 'pointer' : 'not-allowed',
            }}
            onClick={() => text.trim() && onSave(text.trim())}
            type="button"
          >
            {lang === 'es' ? 'Guardar' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Range Toggle Item ─────────────────────────────────────
// ── Attribution Pill ──────────────────────────────────────
// Shows WHO is currently the last touch on this item. The first-name pill
// (gold filled, dark text) is loud enough to read at a glance from across
// the bar so any teammate can answer "did John check that?"
function firstNameOf(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0] || '?';
  return first.length > 8 ? first.slice(0, 7) + '…' : first;
}
const AttribPill = ({ meta }) => {
  if (!meta?.byName) return null;
  const timeStr = meta.at
    ? new Date(meta.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '';
  return (
    <span
      title={`${meta.byName}${timeStr ? ' · ' + timeStr : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        height: 28,
        padding: '0 10px',
        borderRadius: 14,
        background: '#D4AF37',
        color: '#0D0D0D',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.04em',
        flexShrink: 0,
        marginRight: 8,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 9, opacity: 0.7 }}>✓</span>
      {firstNameOf(meta.byName)}
    </span>
  );
};

const RangeItem = ({ item, lang, value, meta, onOk, onFlag }) => {
  const label = lang === 'es' ? item.labelEs : item.label;
  const rangeLabel = lang === 'es' ? item.rangeLabelEs : item.rangeLabel;
  const note = lang === 'es' ? item.noteEs : item.note;
  const isFlagged = value === 'flag';
  const isOk = value === 'ok';

  return (
    <div style={{ ...styles.item, ...(isFlagged ? styles.itemFlagged : isOk ? styles.itemOk : {}) }}>
      <div style={styles.itemLeft}>
        <span style={styles.itemLabel}>{label}</span>
        <span style={styles.itemRange}>{rangeLabel}</span>
        {note ? <span style={styles.itemNote}>{note}</span> : null}
      </div>
      <div style={styles.rangeToggle}>
        {(isOk || isFlagged) && <AttribPill meta={meta} />}
        <button
          style={{ ...styles.rangeBtn, ...(isOk ? styles.rangeBtnOk : styles.rangeBtnOkInactive) }}
          onClick={onOk} type="button" aria-label="Within range"
        >✓</button>
        <button
          style={{ ...styles.rangeBtn, ...(isFlagged ? styles.rangeBtnFlag : styles.rangeBtnFlagInactive) }}
          onClick={onFlag} type="button" aria-label="Out of range"
        >✗</button>
      </div>
    </div>
  );
};

// ── Check Toggle Item ─────────────────────────────────────
const CheckItem = ({ item, lang, value, meta, onChange }) => {
  const label = lang === 'es' ? item.labelEs : item.label;
  const note = lang === 'es' ? item.noteEs : item.note;
  const isChecked = value === 'yes';

  return (
    <div style={{ ...styles.item, ...(isChecked ? styles.itemOk : {}) }}>
      <div style={styles.itemLeft}>
        <span style={styles.itemLabel}>{label}</span>
        {note ? <span style={styles.itemNote}>{note}</span> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {isChecked && <AttribPill meta={meta} />}
        <button
          style={{ ...styles.checkBtn, ...(isChecked ? styles.checkBtnOn : styles.checkBtnOff) }}
          onClick={() => onChange(isChecked ? '' : 'yes')} type="button"
        >
          {isChecked ? '✓' : '—'}
        </button>
      </div>
    </div>
  );
};

// ── Text Item ─────────────────────────────────────────────
const TextItem = ({ item, lang, value, meta, onChange }) => {
  const label = lang === 'es' ? item.labelEs : item.label;
  const note = lang === 'es' ? item.noteEs : item.note;

  return (
    <div style={styles.item}>
      <div style={styles.itemLeft}>
        <span style={styles.itemLabel}>{label}</span>
        {note ? <span style={styles.itemNote}>{note}</span> : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {value && value.trim() !== '' && <AttribPill meta={meta} />}
        <input
          style={styles.textInput}
          type="text"
          placeholder={lang === 'es' ? 'Escribir...' : 'Enter...'}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
};

// ── Section Block ─────────────────────────────────────────
const SectionBlock = ({ group, lang, values, meta, onCheck, onRangeOk, onRangeFlag }) => {
  const label = lang === 'es' ? group.sectionLabelEs : group.sectionLabel;
  const note = lang === 'es' ? group.noteEs : group.note;

  return (
    <div style={styles.sectionBlock}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>{label}</span>
        {note && <span style={styles.sectionNote}>{note}</span>}
      </div>
      {group.items.map(item => {
        const m = meta?.[item.id];
        if (item.type === 'range') return (
          <RangeItem key={item.id} item={item} lang={lang} value={values[item.id] || ''} meta={m}
            onOk={() => onRangeOk(item)} onFlag={() => onRangeFlag(item)} />
        );
        if (item.type === 'check') return (
          <CheckItem key={item.id} item={item} lang={lang} value={values[item.id] || ''} meta={m}
            onChange={val => onCheck(item.id, val)} />
        );
        if (item.type === 'text') return (
          <TextItem key={item.id} item={item} lang={lang} value={values[item.id] || ''} meta={m}
            onChange={val => onCheck(item.id, val)} />
        );
        return null;
      })}
    </div>
  );
};

const TABS = [
  { id: 'opening', label: 'Opening', labelEs: 'Apertura' },
  { id: 'mid', label: 'Mid-Service', labelEs: 'Medio Servicio' },
  { id: 'closing', label: 'Closing', labelEs: 'Cierre' },
];

// ── Build email body ──────────────────────────────────────
const buildEmailBody = ({ sectionName, groups, values, startTime, submitTime, operator, location }) => {
  let body = `${sectionName.toUpperCase()} CHECKLIST\n`;
  body += `═══════════════════════════════\n`;
  body += `Operator:   ${operator}\nLocation:   ${location}\nDate:       ${fmtDate()}\n`;
  body += `Started:    ${fmtTime(startTime)}\nSubmitted:  ${fmtTime(submitTime)}\n`;
  body += `═══════════════════════════════\n\n`;

  const flagged = [];
  for (const group of groups) {
    body += `── ${group.sectionLabel.toUpperCase()} ──\n`;
    for (const item of group.items) {
      const val = values[item.id] || '';
      let display = '—';
      if (item.type === 'check') display = val === 'yes' ? '✓ Yes' : '✗ No';
      if (item.type === 'range') {
        if (val === 'ok') display = '✓ Within Range';
        else if (val === 'flag') {
          display = '✗ OUT OF RANGE';
          flagged.push({ label: item.label, range: item.rangeLabel, corrective: values[`${item.id}_corrective`] || '(none)' });
        }
      }
      if (item.type === 'text') display = val || '(blank)';
      body += `  ${item.label}: ${display}\n`;
      if (item.type === 'range' && val === 'flag') {
        body += `    → Corrective: ${values[`${item.id}_corrective`] || '(none)'}\n`;
      }
    }
    body += '\n';
  }

  if (flagged.length) {
    body += `⚠ FLAGGED (${flagged.length}):\n`;
    for (const f of flagged) {
      body += `  • ${f.label} (${f.range}) → ${f.corrective}\n`;
    }
  }
  body += `\n═══════════════════════════════\nQuez Coffee Co. — Iowa DIAL Compliance`;
  return body;
};

// ── Main Screen ───────────────────────────────────────────
const DailyChecklist = () => {
  const settings = loadSettings();
  const lang = settings.language || 'en';
  const user = getSession();

  // Load global checklist state from localStorage
  const savedState = loadChecklistState();

  const [activeTab, setActiveTab] = useState('opening');
  const [values, setValues] = useState(savedState.values || {});
  const [meta, setMeta] = useState(savedState.meta || {});
  const [sectionStartTimes, setSectionStartTimes] = useState(savedState.sectionStartTimes || {});
  const [sectionSubmitted, setSectionSubmitted] = useState(
    savedState.sectionSubmitted || { opening: false, mid: false, closing: false }
  );
  const [correctiveModal, setCorrectiveModal] = useState(null);
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast] = useState(null);

  const openingUnlocked = isSectionUnlocked('opening');
  const closingUnlocked = isSectionUnlocked('closing');

  // ── Persist state to localStorage on every change ────────
  const persistState = useCallback((newValues, newStartTimes, newSubmitted, newMeta) => {
    saveChecklistState({
      values: newValues,
      meta: newMeta !== undefined ? newMeta : meta,
      sectionStartTimes: newStartTimes,
      sectionSubmitted: newSubmitted,
    });
  }, [meta]);

  // Record attribution: who touched item id, when. Returns the next meta object.
  const recordMeta = useCallback((id) => {
    const next = {
      ...meta,
      [id]: { byName: user?.name || 'Unknown', at: new Date().toISOString() },
    };
    setMeta(next);
    return next;
  }, [meta, user]);

  // ── Auto-timestamp on first touch ─────────────────────────
  const recordStartTime = useCallback((section) => {
    setSectionStartTimes(prev => {
      if (prev[section]) return prev;
      const next = { ...prev, [section]: new Date().toISOString() };
      persistState(values, next, sectionSubmitted);
      return next;
    });
  }, [values, sectionSubmitted, persistState]);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Value handlers ────────────────────────────────────────
  const handleCheck = (section, id, val) => {
    recordStartTime(section);
    const nextMeta = recordMeta(id);
    setValues(prev => {
      const next = { ...prev, [id]: val };
      persistState(next, sectionStartTimes, sectionSubmitted, nextMeta);
      return next;
    });
  };

  const handleRangeOk = (section, item) => {
    recordStartTime(section);
    const nextMeta = recordMeta(item.id);
    // Toggle off if it's already OK — second tap clears the selection so the
    // operator can undo without picking the opposite (which would change the
    // meaning of the reading).
    const newVal = values[item.id] === 'ok' ? '' : 'ok';
    setValues(prev => {
      const next = { ...prev, [item.id]: newVal };
      persistState(next, sectionStartTimes, sectionSubmitted, nextMeta);
      return next;
    });
  };

  const handleRangeFlag = (section, item) => {
    recordStartTime(section);
    // Tapping the flag button while already flagged clears the flag AND its
    // corrective text — keeps the audit log honest, no orphaned correctives.
    if (values[item.id] === 'flag') {
      const nextMeta = recordMeta(item.id);
      setValues(prev => {
        const next = { ...prev, [item.id]: '', [`${item.id}_corrective`]: '' };
        persistState(next, sectionStartTimes, sectionSubmitted, nextMeta);
        return next;
      });
      return;
    }
    setCorrectiveModal({ item, section });
  };

  const handleCorrectiveSave = (text) => {
    const { item, section } = correctiveModal;
    const nextMeta = recordMeta(item.id);
    setValues(prev => {
      const next = { ...prev, [item.id]: 'flag', [`${item.id}_corrective`]: text };
      persistState(next, sectionStartTimes, sectionSubmitted, nextMeta);
      return next;
    });
    saveFlaggedItem({
      label: item.label,
      rangeLabel: item.rangeLabel,
      correctiveAction: text,
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
      section,
    });
    // Fire-and-react: surface the actual delivery state, don't claim "sent"
    // before we hear back from the SDK.
    sendQuezEmail({
      subject: `⚠ Out of Range: ${item.label} — ${fmtDate()}`,
      templateParams: {
        event_type: 'Out-of-Range Alert',
        employee_name: user?.name || 'Unknown',
        location: user?.location || 'Unknown',
        date: fmtDate(),
        message: `OUT OF RANGE: ${item.label}\nAcceptable range: ${item.rangeLabel}\nCorrective action: ${text}\nOperator: ${user?.name}\nLocation: ${user?.location}`,
      },
    }).then((result) => {
      const status = sendStatusMessage(result, lang);
      const variant = result.ok ? 'warning' : (status.variant === 'error' ? 'error' : 'warning');
      const prefix = result.ok
        ? (lang === 'es' ? '⚠ Alerta enviada' : '⚠ Alert sent')
        : (lang === 'es' ? '⚠ Alerta registrada — ' : '⚠ Alert recorded — ') + status.text;
      showToast(prefix, variant);
    });
    setCorrectiveModal(null);
  };

  // ── Completion ────────────────────────────────────────────
  const openingComplete = isSectionGroupComplete(OPENING_ITEMS, values);
  const midComplete = isSectionGroupComplete(MID_SERVICE_ITEMS, values);
  const closingComplete = isSectionGroupComplete(CLOSING_ITEMS, values);

  // ── Progress ──────────────────────────────────────────────
  // Only count items that actually gate the submit. Optional items (the
  // conditional ones marked required:false) are never blockers, so they
  // don't belong in the denominator either.
  const allGroups = [...OPENING_ITEMS, ...MID_SERVICE_ITEMS, ...CLOSING_ITEMS];
  const requiredItems = allGroups.flatMap((g) =>
    g.items.filter((i) => i.required !== false && (i.type !== 'text' || i.required)),
  );
  const totalItems = requiredItems.length;
  const doneItems = requiredItems.filter((item) => isItemComplete(item, values)).length;
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 100;

  // ── Submit section ────────────────────────────────────────
  const handleSectionSubmit = async (section) => {
    if (submitting) return;
    setSubmitting(section);

    const now = new Date().toISOString();
    const startTime = sectionStartTimes[section] || now;

    const groupMap = { opening: OPENING_ITEMS, mid: MID_SERVICE_ITEMS, closing: CLOSING_ITEMS };
    const nameMap = { opening: 'Opening', mid: 'Mid-Service', closing: 'Closing' };

    const groups = groupMap[section];
    const sectionName = nameMap[section];

    let body = buildEmailBody({
      sectionName, groups, values,
      startTime, submitTime: now,
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
    });

    if (section === 'closing') {
      // Drink count from order system (placeholder until order screen built)
      const orderData = storageGet('quez_order_totals');
      if (orderData && orderData.totalCups > 0) {
        body += `\n\nDRINK COUNT — TODAY\n═══════════════════════════════\nTotal Cups: ${orderData.totalCups}\n`;
        if (orderData.breakdown) {
          for (const [name, count] of Object.entries(orderData.breakdown)) {
            if (count > 0) body += `  ${name}: ${count}\n`;
          }
        }
        localStorage.removeItem('quez_order_totals');
      } else {
        body += `\n\nDRINK COUNT: Order tracking active in future update.`;
      }
      saveDailyChecklistRecord({
        operator: user?.name || 'Unknown',
        location: user?.location || 'Unknown',
        date: fmtDate(),
        submittedAt: now,
      });
      markDailyChecklistSubmitted(user?.name, user?.location);
      // Fire auto-backup on close (subject to user config + 24h throttle)
      try {
        const { maybeAutoBackup } = await import('../utils/storage');
        maybeAutoBackup('closing_checklist').catch(() => {});
      } catch {}
    }

    const emailResult = await sendQuezEmail({
      subject: `[Quez] ${sectionName} Checklist — ${user?.name || 'Unknown'} — ${fmtDate()}`,
      templateParams: {
        event_type: `${sectionName} Checklist`,
        employee_name: user?.name || 'Unknown',
        location: user?.location || 'Unknown',
        date: fmtDate(),
        message: body,
      },
    });

    // The in-app submission record is saved regardless of email delivery
    // (the checklist is locally recorded above for closing; sectionSubmitted
    // is a UI flag, not a delivery confirmation). But the toast should tell
    // the truth about whether the OWNER actually received the email.
    const newSubmitted = { ...sectionSubmitted, [section]: true };
    setSectionSubmitted(newSubmitted);
    persistState(values, sectionStartTimes, newSubmitted);
    setSubmitting(null);

    const status = sendStatusMessage(emailResult, lang);
    if (emailResult.ok) {
      showToast(
        lang === 'es' ? `✓ ${sectionName} enviado` : `✓ ${sectionName} checklist submitted & emailed`,
        'success'
      );
    } else {
      showToast(
        (lang === 'es' ? `${sectionName} guardado — ` : `${sectionName} saved — `) + status.text,
        status.variant === 'error' ? 'error' : 'warning'
      );
    }

    if (section === 'opening') setActiveTab('mid');
    if (section === 'mid') setActiveTab('closing');
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={styles.screen}>
      {correctiveModal && (
        <CorrectiveModal
          item={correctiveModal.item}
          lang={lang}
          onSave={handleCorrectiveSave}
          onClose={() => setCorrectiveModal(null)}
        />
      )}

      {toast && (
        <div style={{
          ...styles.toast,
          background: toast.type === 'warning' ? '#C0392B' : toast.type === 'success' ? '#27AE60' : '#D4AF37',
          color: toast.type === 'warning' ? '#fff' : '#0D0D0D',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={styles.header}>
        <h1 style={styles.headerTitle}>
          {lang === 'es' ? 'Lista de Operaciones' : 'Daily Operations Checklist'}
        </h1>
        <div style={styles.headerMeta}>
          <span style={styles.metaName}>{user?.name || '—'}</span>
          <span style={styles.metaSep}>·</span>
          <span style={styles.metaSub}>{user?.location || '—'}</span>
          <span style={styles.metaSep}>·</span>
          <span style={styles.metaSub}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div style={styles.progressWrap}>
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPct}%` }} />
          </div>
          <span style={styles.progressLabel}>{progressPct}%</span>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map(tab => {
          const locked = (tab.id === 'opening' && !openingUnlocked) || (tab.id === 'closing' && !closingUnlocked);
          const done = sectionSubmitted[tab.id];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{ ...styles.tab, ...(active ? styles.tabActive : {}), ...(locked ? styles.tabLocked : {}), ...(done ? styles.tabDone : {}) }}
              onClick={() => !locked && setActiveTab(tab.id)}
              type="button"
            >
              {done ? '✓ ' : locked ? '🔒 ' : ''}
              {lang === 'es' ? tab.labelEs : tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.body}>
        {activeTab === 'opening' && !openingUnlocked && <div style={styles.lockedBanner}>🔒 {lang === 'es' ? `Apertura disponible a las ${settings.timeLocks?.openingUnlockTime || '5:30 AM'}` : `Opening unlocks at ${settings.timeLocks?.openingUnlockTime || '5:30 AM'}`}</div>}
        {activeTab === 'closing' && !closingUnlocked && <div style={styles.lockedBanner}>🔒 {lang === 'es' ? `Cierre disponible a las ${settings.timeLocks?.closingUnlockTime || '1:00 PM'}` : `Closing unlocks at ${settings.timeLocks?.closingUnlockTime || '1:00 PM'}`}</div>}

        {activeTab === 'opening' && sectionSubmitted.opening && <div style={styles.submittedBanner}>✓ {lang === 'es' ? 'Apertura enviada y registrada' : 'Opening submitted and logged'}</div>}
        {activeTab === 'mid' && sectionSubmitted.mid && <div style={styles.submittedBanner}>✓ {lang === 'es' ? 'Medio servicio enviado' : 'Mid-service submitted and logged'}</div>}
        {activeTab === 'closing' && sectionSubmitted.closing && <div style={styles.submittedBanner}>✓ {lang === 'es' ? 'Cierre enviado — turno completado' : 'Closing submitted — shift complete'}</div>}

        {activeTab === 'opening' && openingUnlocked && !sectionSubmitted.opening && OPENING_ITEMS.map(group => (
          <SectionBlock key={group.section} group={group} lang={lang} values={values} meta={meta}
            onCheck={(id, val) => handleCheck('opening', id, val)}
            onRangeOk={item => handleRangeOk('opening', item)}
            onRangeFlag={item => handleRangeFlag('opening', item)} />
        ))}

        {activeTab === 'mid' && !sectionSubmitted.mid && MID_SERVICE_ITEMS.map(group => (
          <SectionBlock key={group.section} group={group} lang={lang} values={values} meta={meta}
            onCheck={(id, val) => handleCheck('mid', id, val)}
            onRangeOk={item => handleRangeOk('mid', item)}
            onRangeFlag={item => handleRangeFlag('mid', item)} />
        ))}

        {activeTab === 'closing' && closingUnlocked && !sectionSubmitted.closing && CLOSING_ITEMS.map(group => (
          <SectionBlock key={group.section} group={group} lang={lang} values={values} meta={meta}
            onCheck={(id, val) => handleCheck('closing', id, val)}
            onRangeOk={item => handleRangeOk('closing', item)}
            onRangeFlag={item => handleRangeFlag('closing', item)} />
        ))}

        {activeTab === 'opening' && openingUnlocked && !sectionSubmitted.opening && (
          <div style={styles.submitWrap}>
            {!openingComplete && <p style={styles.submitNote}>{lang === 'es' ? 'Completa todos los elementos para enviar.' : 'Complete all items to submit.'}</p>}
            <button
              style={{ ...styles.submitBtn, ...(openingComplete ? styles.submitBtnReady : styles.submitBtnDisabled) }}
              disabled={!openingComplete || submitting === 'opening'}
              onClick={() => handleSectionSubmit('opening')} type="button"
            >
              {submitting === 'opening' ? (lang === 'es' ? 'Enviando...' : 'Submitting...') : (lang === 'es' ? 'Enviar Apertura' : 'Submit Opening Checklist')}
            </button>
          </div>
        )}

        {activeTab === 'mid' && !sectionSubmitted.mid && (
          <div style={styles.submitWrap}>
            {!midComplete && <p style={styles.submitNote}>{lang === 'es' ? 'Completa todos los elementos para enviar.' : 'Complete all items to submit.'}</p>}
            <button
              style={{ ...styles.submitBtn, ...(midComplete ? styles.submitBtnReady : styles.submitBtnDisabled) }}
              disabled={!midComplete || submitting === 'mid'}
              onClick={() => handleSectionSubmit('mid')} type="button"
            >
              {submitting === 'mid' ? (lang === 'es' ? 'Enviando...' : 'Submitting...') : (lang === 'es' ? 'Enviar Medio Servicio' : 'Submit Mid-Service Checklist')}
            </button>
          </div>
        )}

        {activeTab === 'closing' && closingUnlocked && !sectionSubmitted.closing && (
          <div style={styles.submitWrap}>
            {!closingComplete && <p style={styles.submitNote}>{lang === 'es' ? 'Completa todos los elementos para enviar.' : 'Complete all items to submit.'}</p>}
            <button
              style={{ ...styles.submitBtn, ...(closingComplete ? styles.submitBtnReady : styles.submitBtnDisabled) }}
              disabled={!closingComplete || submitting === 'closing'}
              onClick={() => handleSectionSubmit('closing')} type="button"
            >
              {submitting === 'closing' ? (lang === 'es' ? 'Enviando...' : 'Submitting...') : (lang === 'es' ? 'Enviar Cierre' : 'Submit Closing Checklist')}
            </button>
          </div>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────
const C = {
  black: '#0D0D0D', dark: '#1A1A1A', mid: '#2A2A2A',
  gold: '#D4AF37', cream: '#F5F0E8', gray: '#9A9080',
  border: 'rgba(212,175,55,0.18)', borderStrong: 'rgba(212,175,55,0.4)',
  green: '#27AE60', greenBg: 'rgba(39,174,96,0.12)',
  red: '#C0392B', redBg: 'rgba(192,57,43,0.12)',
};

const styles = {
  screen: { display: 'flex', flexDirection: 'column', minHeight: '100vh', background: C.black, paddingBottom: 80 },
  header: { padding: '20px 20px 14px', background: C.dark, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 },
  headerTitle: { fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 'normal', color: C.gold, letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' },
  headerMeta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaName: { fontSize: 13, color: C.cream, fontWeight: 500 },
  metaSep: { fontSize: 10, color: C.gray },
  metaSub: { fontSize: 12, color: C.gray },
  progressWrap: { display: 'flex', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 3, background: C.mid, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', background: C.gold, borderRadius: 2, transition: 'width 0.4s ease' },
  progressLabel: { fontSize: 11, color: C.gold, minWidth: 30, textAlign: 'right', fontFamily: 'Georgia, serif' },
  tabs: { display: 'flex', background: C.dark, borderBottom: `1px solid ${C.border}`, padding: '0 16px', gap: 2 },
  tab: { flex: 1, padding: '11px 6px', background: 'none', border: 'none', borderBottom: '2px solid transparent', color: C.gray, fontSize: 12, fontFamily: 'Georgia, serif', letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { color: C.gold, borderBottomColor: C.gold },
  tabDone: { color: C.green, borderBottomColor: C.green },
  tabLocked: { color: '#444', cursor: 'not-allowed' },
  body: { flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 },
  lockedBanner: { background: C.mid, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', color: C.gray, fontSize: 14, fontFamily: 'Georgia, serif' },
  submittedBanner: { background: C.greenBg, border: `1px solid ${C.green}`, borderRadius: 8, padding: '14px 16px', color: C.green, fontSize: 14, fontFamily: 'Georgia, serif' },
  sectionBlock: { border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' },
  sectionHeader: { background: C.mid, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.gold },
  sectionNote: { fontSize: 11, color: C.gray },
  item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: C.dark, borderTop: `1px solid ${C.border}`, gap: 12, transition: 'background 0.15s' },
  itemFlagged: { background: C.redBg, borderLeft: `3px solid ${C.red}` },
  itemOk: { background: 'rgba(39,174,96,0.06)' },
  itemLeft: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3 },
  itemLabel: { fontSize: 14, color: C.cream, lineHeight: 1.3 },
  itemRange: { fontSize: 12, color: C.gold, fontFamily: 'Georgia, serif' },
  itemNote: { fontSize: 11, color: C.gray },
  rangeToggle: { display: 'flex', gap: 8, flexShrink: 0 },
  rangeBtn: { width: 44, height: 44, borderRadius: 8, border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', fontWeight: 700 },
  rangeBtnOk: { background: C.green, color: '#fff' },
  rangeBtnOkInactive: { background: C.mid, color: '#555', border: `1px solid ${C.border}` },
  rangeBtnFlag: { background: C.red, color: '#fff' },
  rangeBtnFlagInactive: { background: C.mid, color: '#555', border: `1px solid ${C.border}` },
  checkBtn: { width: 44, height: 44, borderRadius: 8, border: 'none', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' },
  checkBtnOn: { background: C.greenBg, color: C.green, border: `1px solid ${C.green}` },
  checkBtnOff: { background: C.mid, color: '#555', border: `1px solid ${C.border}` },
  textInput: { background: C.mid, border: `1px solid ${C.border}`, borderRadius: 8, color: C.cream, fontSize: 13, padding: '10px 12px', outline: 'none', width: 160 },
  submitWrap: { padding: '8px 0 4px' },
  submitNote: { textAlign: 'center', fontSize: 12, color: C.gray, fontFamily: 'Georgia, serif', margin: '0 0 8px' },
  submitBtn: { width: '100%', padding: 16, border: 'none', borderRadius: 10, fontFamily: 'Georgia, serif', fontSize: 15, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' },
  submitBtnReady: { background: C.gold, color: C.black },
  submitBtnDisabled: { background: C.mid, color: '#555', cursor: 'not-allowed' },
  toast: { position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '11px 22px', borderRadius: 8, fontSize: 14, fontFamily: 'Georgia, serif', zIndex: 999, whiteSpace: 'nowrap', pointerEvents: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal: { background: C.dark, borderTop: `1px solid ${C.borderStrong}`, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 580, padding: '24px 20px 40px' },
  modalHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  modalWarning: { fontSize: 22, color: C.red },
  modalTitle: { fontFamily: 'Georgia, serif', fontSize: 18, color: C.red, letterSpacing: '0.03em' },
  modalItem: { fontSize: 15, color: C.cream, margin: '0 0 6px' },
  modalRange: { fontSize: 13, color: C.gray, margin: '0 0 16px' },
  modalPrompt: { fontSize: 13, color: C.gold, fontFamily: 'Georgia, serif', margin: '0 0 8px' },
  modalTextarea: { width: '100%', boxSizing: 'border-box', background: C.mid, border: `1px solid ${C.borderStrong}`, borderRadius: 8, color: C.cream, fontSize: 14, padding: '12px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' },
  modalBtns: { display: 'flex', gap: 10, marginTop: 16 },
  modalBtnGhost: { flex: 1, padding: '13px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, color: C.cream, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  modalBtnGold: { flex: 1, padding: '13px', background: C.gold, border: 'none', borderRadius: 8, color: C.black, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: '0.04em' },
};

export default DailyChecklist;
