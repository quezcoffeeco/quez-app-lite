// ============================================================
// QUEZ APP LITE — PeriodicChecklists.jsx
// src/screens/PeriodicChecklists.jsx
// Session 6
//
// Role gating:
//   Weekly   → Lead Barista, Manager, Owner
//   Monthly  → Manager, Owner
//   Quarterly → Manager, Owner
//   Annual   → Manager, Owner
//
// Visibility logic:
//   Weekly   → Monday only, hides after submission
//   Monthly  → 1st of month only, hides after submission
//   Quarterly → Jan 1 / Apr 1 / Jul 1 / Oct 1, hides after submission
//   Annual   → Jan 1, hides after submission
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  weeklyChecklistItems,
  monthlyChecklistItems,
  quarterlyChecklistItems,
  annualChecklistItems,
} from '../data/periodicChecklistItems';
import {
  isWeeklyChecklistDue,
  isMonthlyChecklistDue,
  isQuarterlyChecklistDue,
  isAnnualChecklistDue,
  isWeeklySubmittedThisWeek,
  isMonthlySubmittedThisMonth,
  isQuarterlySubmittedThisQuarter,
  isAnnualSubmittedThisYear,
  markWeeklySubmitted,
  markMonthlySubmitted,
  markQuarterlySubmitted,
  markAnnualSubmitted,
  savePeriodicChecklistRecord,
} from '../utils/storage';
import { sendQuezEmail, sendStatusMessage } from '../utils/emailjs';
import { fmtClock } from '../utils/timeFormat';
import '../styles/periodic.css';

// ── Role helpers ─────────────────────────────────────────────
const ROLE_RANK = { owner: 4, manager: 3, leadBarista: 2, barista: 1, trainee: 0 };

function hasRank(userRole, minRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[minRole] || 0);
}

// ── Checklist type config ─────────────────────────────────────
const CHECKLISTS = [
  {
    key: 'weekly',
    label: 'Weekly',
    label_es: 'Semanal',
    minRole: 'leadBarista',
    isDue: isWeeklyChecklistDue,
    isSubmitted: isWeeklySubmittedThisWeek,
    markSubmitted: markWeeklySubmitted,
    items: weeklyChecklistItems,
    dueBadge: 'Every Monday',
    dueBadge_es: 'Cada Lunes',
    notDueMsg: 'The Weekly Checklist is due every Monday morning.',
    notDueMsg_es: 'El Checklist Semanal se realiza cada lunes por la mañana.',
    emailSubject: (loc) => `Weekly Checklist Submitted — ${loc}`,
  },
  {
    key: 'monthly',
    label: 'Monthly',
    label_es: 'Mensual',
    minRole: 'manager',
    isDue: isMonthlyChecklistDue,
    isSubmitted: isMonthlySubmittedThisMonth,
    markSubmitted: markMonthlySubmitted,
    items: monthlyChecklistItems,
    dueBadge: '1st of Month',
    dueBadge_es: '1° del Mes',
    notDueMsg: 'The Monthly Checklist is due on the 1st of each month.',
    notDueMsg_es: 'El Checklist Mensual se realiza el 1° de cada mes.',
    emailSubject: (loc) => `Monthly Checklist Submitted — ${loc}`,
  },
  {
    key: 'quarterly',
    label: 'Quarterly',
    label_es: 'Trimestral',
    minRole: 'manager',
    isDue: isQuarterlyChecklistDue,
    isSubmitted: isQuarterlySubmittedThisQuarter,
    markSubmitted: markQuarterlySubmitted,
    items: quarterlyChecklistItems,
    dueBadge: 'Jan · Apr · Jul · Oct',
    dueBadge_es: 'Ene · Abr · Jul · Oct',
    notDueMsg: 'The Quarterly Checklist is due January 1, April 1, July 1, and October 1.',
    notDueMsg_es: 'El Checklist Trimestral se realiza el 1 de enero, abril, julio y octubre.',
    emailSubject: (loc) => `Quarterly Checklist Submitted — ${loc}`,
  },
  {
    key: 'annual',
    label: 'Annual',
    label_es: 'Anual',
    minRole: 'manager',
    isDue: isAnnualChecklistDue,
    isSubmitted: isAnnualSubmittedThisYear,
    markSubmitted: markAnnualSubmitted,
    items: annualChecklistItems,
    dueBadge: 'January 1',
    dueBadge_es: '1 de Enero',
    notDueMsg: 'The Annual Checklist is due on January 1 each year.',
    notDueMsg_es: 'El Checklist Anual se realiza el 1 de enero de cada año.',
    emailSubject: (loc) => `Annual Checklist Submitted — ${loc}`,
  },
];

// ── Attribution pill (who last touched this item) ────────────
function initialsOf(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((p) => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('');
}
const AttribPill = ({ byName, at }) => {
  if (!byName) return null;
  const timeStr = at ? new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  return (
    <span
      title={`${byName}${timeStr ? ' · ' + timeStr : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(212,175,55,0.12)',
        border: '1px solid rgba(212,175,55,0.4)',
        color: '#D4AF37', fontSize: 9, fontWeight: 800,
        letterSpacing: '0.04em', flexShrink: 0, marginRight: 8,
      }}
    >
      {initialsOf(byName)}
    </span>
  );
};

// ── Local storage key for in-progress state ───────────────────
function inProgressKey(type) {
  const d = new Date();
  return `quez_periodic_progress_${type}_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

// ── Main component ────────────────────────────────────────────
export default function PeriodicChecklists() {
  const { session, settings, language } = useApp();
  const isSpanish = language === 'es';

  const userRole = session?.role || 'barista';
  const operatorName = session?.name || 'Unknown';
  const location = session?.location || settings?.locations?.[0] || 'Quez Coffee Co.';

  // Find the first tab this user has access to
  const accessibleTabs = CHECKLISTS.filter((c) => hasRank(userRole, c.minRole));
  const [activeTab, setActiveTab] = useState(
    accessibleTabs.length > 0 ? accessibleTabs[0].key : 'weekly'
  );

  // Per-tab state: { [itemId]: { checked: bool, notes: string, notesOpen: bool } }
  const [itemState, setItemState] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false); // local echo after submit in session
  const [emailDelivered, setEmailDelivered] = useState(true);
  const [emailStatusText, setEmailStatusText] = useState('');
  // Owner/manager can force-start a checklist outside its normal cadence
  const [forceStarted, setForceStarted] = useState({});  // { [tabKey]: bool }
  const canForceStart = userRole === 'owner' || userRole === 'manager';

  const config = CHECKLISTS.find((c) => c.key === activeTab);

  // Load persisted in-progress state when tab changes
  useEffect(() => {
    if (!config) return;
    const saved = localStorage.getItem(inProgressKey(activeTab));
    if (saved) {
      try {
        setItemState(JSON.parse(saved));
      } catch {
        setItemState({});
      }
    } else {
      setItemState({});
    }
    setSubmitted(false);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist in-progress state on every change
  useEffect(() => {
    if (!config) return;
    localStorage.setItem(inProgressKey(activeTab), JSON.stringify(itemState));
  }, [itemState, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Item interaction ────────────────────────────────────────
  const toggleCheck = useCallback((id) => {
    setItemState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        checked: !(prev[id]?.checked),
        byName: operatorName,
        at: new Date().toISOString(),
      },
    }));
  }, [operatorName]);

  const toggleNotes = useCallback((id) => {
    setItemState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notesOpen: !(prev[id]?.notesOpen),
      },
    }));
  }, []);

  const setNotes = useCallback((id, value) => {
    setItemState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes: value,
        byName: operatorName,
        at: new Date().toISOString(),
      },
    }));
  }, [operatorName]);

  // ── Progress ────────────────────────────────────────────────
  const items = config?.items || [];
  const checkedCount = items.filter((item) => itemState[item.id]?.checked).length;
  const totalCount = items.length;
  const allChecked = checkedCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // ── Build email body ────────────────────────────────────────
  function buildEmailBody() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const timeStr = fmtClock(now);

    let body = `QUEZ COFFEE CO. — ${config.label.toUpperCase()} CHECKLIST\n`;
    body += `${'='.repeat(52)}\n`;
    body += `Submitted by : ${operatorName}\n`;
    body += `Location     : ${location}\n`;
    body += `Date         : ${dateStr}\n`;
    body += `Time         : ${timeStr}\n`;
    body += `Checklist    : ${config.label}\n\n`;

    // Group by section
    const sections = [...new Set(items.map((i) => i.section))];
    sections.forEach((section) => {
      body += `── ${section.toUpperCase()} ──\n`;
      items
        .filter((i) => i.section === section)
        .forEach((item) => {
          const state = itemState[item.id];
          const checkmark = state?.checked ? '✓' : '✗';
          body += `  [${checkmark}] ${item.label}\n`;
          if (state?.notes?.trim()) {
            body += `       Notes: ${state.notes.trim()}\n`;
          }
        });
      body += '\n';
    });

    body += `Items completed: ${checkedCount} / ${totalCount}\n`;
    body += `\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa · Veteran Owned & Operated`;
    return body;
  }

  // ── Submit flow ─────────────────────────────────────────────
  async function handleConfirmSubmit() {
    setSending(true);
    setShowConfirmModal(false);

    const now = new Date();
    const subject = config.emailSubject(location);
    const body = buildEmailBody();

    let emailResult = { ok: true };
    try {
      emailResult = await sendQuezEmail({
        subject,
        templateParams: {
          subject,
          message: body,
          operator: operatorName,
          location,
          timestamp: now.toISOString(),
        },
      });
    } catch (e) {
      console.warn('Periodic checklist email exception:', e);
      emailResult = { ok: false, reason: 'send-error' };
    }

    // Save record to localStorage — submission is independent of email delivery
    const record = {
      type: activeTab,
      operator: operatorName,
      location,
      submittedAt: now.toISOString(),
      checkedCount,
      totalCount,
      items: items.map((item) => ({
        id: item.id,
        label: item.label,
        section: item.section,
        checked: itemState[item.id]?.checked || false,
        notes: itemState[item.id]?.notes || '',
      })),
    };

    savePeriodicChecklistRecord(record);
    config.markSubmitted();

    // Clear in-progress cache
    localStorage.removeItem(inProgressKey(activeTab));

    setSending(false);
    setSubmitted(true);
    // Tell the user the truth about email delivery
    setEmailStatusText(sendStatusMessage(emailResult).text);
    setEmailDelivered(emailResult.ok);
  }

  // ── Role gate ────────────────────────────────────────────────
  if (!hasRank(userRole, 'leadBarista')) {
    return (
      <div className="periodic-screen">
        <div className="periodic-role-gate">
          <div className="periodic-role-gate__icon">🔒</div>
          <h2 className="periodic-role-gate__title">
            {isSpanish ? 'Acceso Restringido' : 'Access Restricted'}
          </h2>
          <p className="periodic-role-gate__body">
            {isSpanish
              ? 'Los checklists periódicos requieren rol de Barista Principal o superior.'
              : 'Periodic checklists require Lead Barista role or above.'}
          </p>
        </div>
      </div>
    );
  }

  const naturallyDue       = config?.isDue();
  const isDue              = naturallyDue || forceStarted[activeTab];
  const isAlreadySubmitted = submitted || config?.isSubmitted();

  // ── Section groups ───────────────────────────────────────────
  const sectionGroups = [...new Set(items.map((i) => i.section))];

  return (
    <div className="periodic-screen">
      {/* ── Header ── */}
      <div className="periodic-header">
        <div className="periodic-header__top">
          <div>
            <h1 className="periodic-header__title">
              {isSpanish ? 'Checklists Periódicos' : 'Periodic Checklists'}
            </h1>
            <p className="periodic-header__subtitle">
              {operatorName} · {location}
            </p>
          </div>
          {isDue && !isAlreadySubmitted && (
            <div className="periodic-header__badge">
              {isSpanish ? config.dueBadge_es : config.dueBadge}
            </div>
          )}
        </div>

        {/* Progress bar — only show when due and not submitted */}
        {isDue && !isAlreadySubmitted && (
          <div className="periodic-progress">
            <div className="periodic-progress__bar-bg">
              <div
                className="periodic-progress__bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="periodic-progress__label">
              {checkedCount} / {totalCount}{' '}
              {isSpanish ? 'completados' : 'complete'} — {progressPct}%
            </div>
          </div>
        )}
      </div>

      {/* ── Tab row ── */}
      <div className="periodic-tabs">
        {CHECKLISTS.map((cl) => {
          const accessible = hasRank(userRole, cl.minRole);
          const tabSubmitted = cl.isSubmitted();
          return (
            <button
              key={cl.key}
              className={[
                'periodic-tab',
                activeTab === cl.key ? 'periodic-tab--active' : '',
                tabSubmitted ? 'periodic-tab--submitted' : '',
                !accessible ? 'periodic-tab--locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => accessible && setActiveTab(cl.key)}
              disabled={!accessible}
            >
              {tabSubmitted ? '✓ ' : ''}
              {isSpanish ? cl.label_es : cl.label}
              {!accessible ? ' 🔒' : ''}
            </button>
          );
        })}
      </div>

      {/* ── Already submitted banner ── */}
      {isAlreadySubmitted && (
        <div className="periodic-submitted-banner">
          <div className="periodic-submitted-banner__icon">{emailDelivered ? '✅' : '📝'}</div>
          <div className="periodic-submitted-banner__text">
            <strong>
              {isSpanish
                ? `Checklist ${config.label_es} enviado`
                : `${config.label} Checklist submitted`}
            </strong>
            <br />
            {emailDelivered
              ? (isSpanish
                  ? 'El registro fue guardado y el correo enviado. Regresa cuando corresponda.'
                  : 'The log was saved and the email was sent. Come back when it\'s due again.')
              : (isSpanish
                  ? `El registro fue guardado. ${emailStatusText || 'El correo no se envió.'}`
                  : `The log was saved. ${emailStatusText || 'Email did not send.'}`)}
          </div>
        </div>
      )}

      {/* ── Not due banner ── */}
      {!isDue && !isAlreadySubmitted && (
        <div className="periodic-not-due">
          <div className="periodic-not-due__icon">📅</div>
          <h3 className="periodic-not-due__title">
            {isSpanish ? 'No es necesario hoy' : 'Not Due Today'}
          </h3>
          <p className="periodic-not-due__body">
            {isSpanish ? config.notDueMsg_es : config.notDueMsg}
          </p>
          {canForceStart && (
            <button
              style={{
                marginTop: 16,
                background: 'linear-gradient(180deg, #E6C661, #D4AF37)',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: 12,
                padding: '11px 22px',
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => setForceStarted((p) => ({ ...p, [activeTab]: true }))}
            >
              ▶ {isSpanish ? 'Iniciar Ahora' : 'Start Now'}
            </button>
          )}
        </div>
      )}

      {/* ── Checklist body — only when due and not yet submitted ── */}
      {isDue && !isAlreadySubmitted && (
        <>
          {sectionGroups.map((section) => {
            const sectionItems = items.filter((i) => i.section === section);
            const sectionConfig = sectionItems[0];
            return (
              <div key={section} className="periodic-section">
                <div className="periodic-section__header">
                  <h2 className="periodic-section__title">
                    {isSpanish ? sectionConfig.section_es : section}
                  </h2>
                  <div className="periodic-section__line" />
                </div>

                {sectionItems.map((item) => {
                  const state = itemState[item.id] || {};
                  return (
                    <div
                      key={item.id}
                      className={`periodic-item ${state.checked ? 'periodic-item--checked' : ''}`}
                    >
                      <div className="periodic-item__row">
                        <AttribPill byName={state.byName} at={state.at} />
                        {/* Custom checkbox */}
                        <div
                          className={`periodic-item__check-box ${
                            state.checked ? 'periodic-item__check-box--checked' : ''
                          }`}
                          onClick={() => toggleCheck(item.id)}
                          role="checkbox"
                          aria-checked={!!state.checked}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === ' ' && toggleCheck(item.id)}
                        >
                          <span className="periodic-item__check-icon">✓</span>
                        </div>

                        <div className="periodic-item__content">
                          <p
                            className={`periodic-item__label ${
                              state.checked ? 'periodic-item__label--checked' : ''
                            }`}
                          >
                            {isSpanish ? item.label_es : item.label}
                          </p>
                          {item.hint && (
                            <p className="periodic-item__hint">
                              {isSpanish ? item.hint_es : item.hint}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Notes toggle */}
                      <button
                        className="periodic-item__notes-toggle"
                        onClick={() => toggleNotes(item.id)}
                      >
                        {state.notesOpen
                          ? isSpanish
                            ? '▲ Ocultar notas'
                            : '▲ Hide notes'
                          : isSpanish
                          ? '+ Agregar nota'
                          : '+ Add note'}
                      </button>

                      {state.notesOpen && (
                        <div className="periodic-item__notes-area">
                          <textarea
                            className="periodic-item__notes-input"
                            rows={3}
                            placeholder={
                              isSpanish
                                ? 'Escribe una nota opcional...'
                                : 'Optional note...'
                            }
                            value={state.notes || ''}
                            onChange={(e) => setNotes(item.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* ── Submit section ── */}
          <div className="periodic-submit">
            {!allChecked && (
              <p className="periodic-submit__blocker">
                {isSpanish
                  ? `Completa todos los elementos para enviar (${checkedCount}/${totalCount})`
                  : `Complete all items to submit (${checkedCount}/${totalCount})`}
              </p>
            )}

            {sending ? (
              <div className="periodic-sending">
                {isSpanish ? 'Enviando...' : 'Sending...'}
              </div>
            ) : (
              <button
                className="periodic-submit__btn"
                disabled={!allChecked}
                onClick={() => setShowConfirmModal(true)}
              >
                {isSpanish
                  ? `Enviar Checklist ${config.label_es}`
                  : `Submit ${config.label} Checklist`}
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Confirm modal ── */}
      {showConfirmModal && (
        <div className="periodic-modal-backdrop">
          <div className="periodic-modal">
            <div className="periodic-modal__icon">📋</div>
            <h2 className="periodic-modal__title">
              {isSpanish ? '¿Confirmar envío?' : 'Confirm Submission?'}
            </h2>
            <p className="periodic-modal__body">
              {isSpanish
                ? `El checklist ${config.label_es} se guardará y se enviará por correo al propietario. Esta acción no se puede deshacer.`
                : `The ${config.label} Checklist will be saved and emailed to the owner. This cannot be undone.`}
            </p>
            <div className="periodic-modal__actions">
              <button
                className="periodic-modal__cancel"
                onClick={() => setShowConfirmModal(false)}
              >
                {isSpanish ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                className="periodic-modal__confirm"
                onClick={handleConfirmSubmit}
              >
                {isSpanish ? 'Confirmar' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
