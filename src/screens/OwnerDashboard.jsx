// ============================================================
// QUEZ APP LITE — OwnerDashboard.jsx
// src/screens/OwnerDashboard.jsx
// Session 6
//
// Panels:
//   1. Today's Date / Greeting
//   2. Daily Checklist Status (Opening / Mid-Service / Closing)
//   3. Periodic Checklist Status (Weekly / Monthly / Quarterly / Annual)
//   4. Flagged Items (out-of-range readings from today)
//   5. Daily Drink Report (send today's drink tally to owner email)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  loadTodayFlaggedItems,
  buildDailyDrinkReport,
  getTodayDrinkTally,
  getReportRecipients,
  getStorageHealth,
  getHandoffNotes,
  getLowStockItems,
  isDailyChecklistSubmittedToday,
  loadChecklistState,
  isWeeklyChecklistDue,
  isWeeklySubmittedThisWeek,
  isMonthlyChecklistDue,
  isMonthlySubmittedThisMonth,
  isQuarterlyChecklistDue,
  isQuarterlySubmittedThisQuarter,
  isAnnualChecklistDue,
  isAnnualSubmittedThisYear,
  getSettings,
  getPreLaunchProgress,
  getBuildTimeStats,
  getActiveTraineesSummary,
  logAudit,
  alertsAreDismissed,
  dismissAlerts,
} from '../utils/storage';
import { sendQuezEmail, sendStatusMessage, getEmailQueue, retryEmailQueue, deleteQueuedEmail, clearEmailQueue } from '../utils/emailjs';
import { fmtClock } from '../utils/timeFormat';
import { TOTAL_TASKS as PRELAUNCH_TOTAL } from '../data/preLaunchTimeline';

// ── Helpers ───────────────────────────────────────────────────
const formatTime = (iso) => iso ? fmtClock(iso) : '—';

// Persisted collapse state per panel — survives reloads, role switches,
// and is included in the JSON backup like every other quez_* key.
const PANEL_COLLAPSE_KEY = 'quez_owner_panel_collapsed';
function getPanelCollapseState() {
  try { return JSON.parse(localStorage.getItem(PANEL_COLLAPSE_KEY) || '{}') || {}; }
  catch { return {}; }
}
function persistPanelCollapsed(id, collapsed) {
  const state = getPanelCollapseState();
  state[id] = collapsed;
  try { localStorage.setItem(PANEL_COLLAPSE_KEY, JSON.stringify(state)); } catch {}
}

// Drop-in replacement for the panel + panelHeader + panelBody pattern.
// Header is clickable to toggle; chevron indicates state. Optional
// headerRight slot for badges / shortcut buttons that shouldn't toggle.
// Defaults to collapsed so the dashboard surface stays scannable.
function CollapsiblePanel({ id, icon, title, headerRight, children, defaultCollapsed = true }) {
  const [collapsed, setCollapsed] = useState(() => {
    const state = getPanelCollapseState();
    return id in state ? !!state[id] : defaultCollapsed;
  });
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    persistPanelCollapsed(id, next);
  };
  // When inside the .quez-card-grid wrapper, collapsed panels tile into
  // columns (compact iPad view) and expanded panels span the full row so
  // wide content like badge rows isn't squeezed.
  return (
    <div className={collapsed ? undefined : 'quez-card-full'} style={S.panel}>
      <div style={{ ...S.panelHeader, borderBottom: collapsed ? 'none' : S.panelHeader.borderBottom }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
            font: 'inherit',
            textAlign: 'left',
            minWidth: 0,
            minHeight: 44,
          }}
        >
          <span style={S.panelIcon}>{icon}</span>
          <h2 style={{ ...S.panelTitle, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
          <span
            aria-hidden="true"
            style={{
              color: '#D4AF37',
              fontSize: 16,
              transition: 'transform 0.18s ease',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              display: 'inline-block',
              marginLeft: 8,
            }}
          >▾</span>
        </button>
        {headerRight && (
          <div onClick={(e) => e.stopPropagation()} style={{ marginLeft: 8 }}>
            {headerRight}
          </div>
        )}
      </div>
      {!collapsed && <div style={S.panelBody}>{children}</div>}
    </div>
  );
}

function getTodayDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  screen: {
    minHeight: '100vh',
    background: '#0D0D0D',
    color: '#F5F0E8',
    paddingBottom: 100,
    fontFamily: 'Georgia, serif',
  },
  header: {
    background: '#1A1A1A',
    borderBottom: '2px solid #D4AF37',
    padding: '20px 16px 16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#D4AF37',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  },
  headerSub: {
    fontSize: '0.72rem',
    color: '#F5F0E8',
    opacity: 0.5,
    fontFamily: 'sans-serif',
    margin: '4px 0 0',
    letterSpacing: '0.04em',
  },
  panel: {
    margin: '16px 16px 0',
    background: '#1A1A1A',
    border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px 12px',
    borderBottom: '1px solid rgba(212,175,55,0.1)',
  },
  panelIcon: {
    fontSize: '1.1rem',
  },
  panelTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#D4AF37',
    fontFamily: 'sans-serif',
    margin: 0,
  },
  panelBody: {
    padding: '12px 16px 16px',
  },
  // Status rows
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  statusRowLast: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
  },
  statusLabel: {
    fontFamily: 'sans-serif',
    fontSize: '0.83rem',
    color: '#F5F0E8',
    flex: 1,
  },
  statusValue: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#F5F0E8',
    opacity: 0.55,
    textAlign: 'right',
  },
  statusValueDone: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#4caf82',
    textAlign: 'right',
    fontWeight: 600,
  },
  statusValuePending: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#e09050',
    textAlign: 'right',
    fontWeight: 600,
  },
  // Flag rows
  flagRow: {
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  flagItem: {
    fontFamily: 'sans-serif',
    fontSize: '0.84rem',
    color: '#e05252',
    fontWeight: 600,
    marginBottom: 2,
  },
  flagMeta: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#F5F0E8',
    opacity: 0.5,
  },
  flagAction: {
    fontFamily: 'sans-serif',
    fontSize: '0.75rem',
    color: '#D4AF37',
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Empty state
  empty: {
    fontFamily: 'sans-serif',
    fontSize: '0.8rem',
    color: '#F5F0E8',
    opacity: 0.35,
    fontStyle: 'italic',
    padding: '4px 0',
  },
  // Time clock report button
  reportBtn: {
    width: '100%',
    padding: '14px',
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'Georgia, serif',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: 4,
  },
  reportBtnDisabled: {
    width: '100%',
    padding: '14px',
    background: 'rgba(212,175,55,0.2)',
    color: 'rgba(245,240,232,0.3)',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'Georgia, serif',
    fontSize: '0.95rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    cursor: 'not-allowed',
    marginTop: 4,
  },
  reportSent: {
    fontFamily: 'sans-serif',
    fontSize: '0.82rem',
    color: '#4caf82',
    padding: '10px 0 4px',
    textAlign: 'center',
  },
  reportSending: {
    fontFamily: 'sans-serif',
    fontSize: '0.82rem',
    color: '#D4AF37',
    padding: '10px 0 4px',
    textAlign: 'center',
    letterSpacing: '0.04em',
  },
  reportSub: {
    fontFamily: 'sans-serif',
    fontSize: '0.73rem',
    color: '#F5F0E8',
    opacity: 0.45,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  // Refresh button
  refreshBtn: {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.35)',
    color: '#D4AF37',
    fontSize: '0.78rem',
    fontFamily: 'sans-serif',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginLeft: 'auto',
    padding: '0 14px',
    minHeight: 44,
    borderRadius: 8,
    fontWeight: 700,
  },
};

// ── Daily checklist section status ───────────────────────────
function getDailySectionStatus() {
  const state = loadChecklistState();
  const submitted = isDailyChecklistSubmittedToday();
  const s = state?.sectionSubmitted || {};

  return {
    opening:    s.opening || false,
    midService: s.midService || s.mid || false,
    closing:    submitted || s.closing || false,
  };
}

// ── Main Component ────────────────────────────────────────────
export default function OwnerDashboard() {
  const { session, language, navigate } = useApp();
  const isSpanish = language === 'es';
  const settings = getSettings();
  const location = session?.location || settings?.locations?.[0] || 'Quez Coffee Co.';

  const [flaggedItems, setFlaggedItems] = useState([]);
  const [dailyStatus, setDailyStatus] = useState({ opening: false, midService: false, closing: false });
  const [drinkTally, setDrinkTally] = useState({});
  const [drinkTotal, setDrinkTotal] = useState(0);
  const [sendingDrinkReport, setSendingDrinkReport] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [drinkReportSent, setDrinkReportSent] = useState(false);
  const [drinkReportStatus, setDrinkReportStatus] = useState('');     // '' | 'sent' | 'queued' | 'error'
  const [drinkReportStatusText, setDrinkReportStatusText] = useState('');
  const [buildTimeToday, setBuildTimeToday] = useState({ count: 0, avgSec: 0, byPrep: { espresso: { count: 0, avgSec: 0 }, drip: { count: 0, avgSec: 0 }, iced: { count: 0, avgSec: 0 }, blended: { count: 0, avgSec: 0 } } });
  const [buildTime7Day, setBuildTime7Day]   = useState({ count: 0, avgSec: 0, byPrep: { espresso: { count: 0, avgSec: 0 }, drip: { count: 0, avgSec: 0 }, iced: { count: 0, avgSec: 0 }, blended: { count: 0, avgSec: 0 } } });
  const [trainees, setTrainees] = useState([]);
  const [emailQueue, setEmailQueueState] = useState([]);
  const [retryStatus, setRetryStatus] = useState('');                 // '' | 'retrying' | 'sent' | 'partial' | 'error'
  const [retryStatusText, setRetryStatusText] = useState('');
  const [handoffs, setHandoffs] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [storageHealth, setStorageHealth] = useState(null);


  const loadData = useCallback(() => {
    setFlaggedItems(loadTodayFlaggedItems());
    setDailyStatus(getDailySectionStatus());

    // Today's drink tally
    const tally = getTodayDrinkTally();
    setDrinkTally(tally);
    setDrinkTotal(Object.values(tally).reduce((sum, t) => sum + t.total, 0));

    // Hand-off log + low-stock
    setHandoffs(getHandoffNotes().slice(0, 5));
    setLowStockCount(getLowStockItems().length);

    // Email queue — surfaces failed/queued sends to the owner with retry
    setEmailQueueState(getEmailQueue());

    // Build-time analytics — today's avg vs trailing 7-day avg
    setBuildTimeToday(getBuildTimeStats(1));
    setBuildTime7Day(getBuildTimeStats(7));

    // Trainees in flight — surfaces cohort progress for the owner
    setTrainees(getActiveTraineesSummary());

    // Storage health (async — fire and forget)
    getStorageHealth().then(setStorageHealth).catch(() => {});
  }, []);

  // ── Email queue retry handler ────────────────────────────────
  async function handleRetryEmailQueue() {
    setRetryStatus('retrying');
    const startCount = emailQueue.length;
    setRetryStatusText(
      isSpanish
        ? `Enviando 0 de ${startCount}...`
        : `Sending 0 of ${startCount}...`
    );
    // Progress callback updates the live "Sending N of M..." message after
    // each attempt, so the owner sees movement during a large batch retry.
    const result = await retryEmailQueue(({ index, total }) => {
      setRetryStatusText(
        isSpanish
          ? `Enviando ${index} de ${total}...`
          : `Sending ${index} of ${total}...`
      );
    });
    setEmailQueueState(getEmailQueue());
    logAudit('email_queue_retried', {
      sent: result.sent,
      remaining: result.remaining,
      reason: result.reason,
      by: session?.name || 'Owner',
    });
    if (result.ok && result.sent > 0) {
      setRetryStatus('sent');
      setRetryStatusText(isSpanish
        ? `✓ ${result.sent} correo${result.sent !== 1 ? 's' : ''} enviado${result.sent !== 1 ? 's' : ''}`
        : `✓ ${result.sent} email${result.sent !== 1 ? 's' : ''} sent`);
    } else if (result.ok && result.sent === 0) {
      setRetryStatus('sent');
      setRetryStatusText(isSpanish ? 'Cola vacía — nada que reintentar' : 'Queue empty — nothing to retry');
    } else if (result.reason === 'no-credentials' || result.reason === 'sdk-missing') {
      setRetryStatus('error');
      setRetryStatusText(isSpanish
        ? 'EmailJS no está configurado en Ajustes → Datos y Respaldo'
        : 'EmailJS is not configured in Settings → Data & Backup');
    } else if (result.reason === 'offline') {
      setRetryStatus('error');
      setRetryStatusText(isSpanish ? 'Sin conexión — reintenta cuando estés en línea' : 'Offline — try again when online');
    } else {
      setRetryStatus('partial');
      setRetryStatusText(isSpanish
        ? `${result.sent} enviado${result.sent !== 1 ? 's' : ''}, ${result.remaining} aún en cola`
        : `${result.sent} sent, ${result.remaining} still queued`);
    }
    setTimeout(() => { setRetryStatus(''); setRetryStatusText(''); }, 6000);
  }

  function handleDeleteQueuedEmail(index, subject) {
    const ok = window.confirm(isSpanish
      ? `Eliminar "${subject || 'este correo'}" de la cola? Esta acción no se puede deshacer.`
      : `Drop "${subject || 'this email'}" from the queue? This cannot be undone.`);
    if (!ok) return;
    deleteQueuedEmail(index);
    setEmailQueueState(getEmailQueue());
    logAudit('email_queue_cleared', { dropped: subject || '', remaining: getEmailQueue().length, by: session?.name || 'Owner' });
  }

  function handleClearAllQueued() {
    const count = emailQueue.length;
    const ok = window.confirm(isSpanish
      ? `Eliminar TODOS los ${count} correos en cola? Los envíos no se completarán.`
      : `Drop ALL ${count} queued emails? They will not be delivered.`);
    if (!ok) return;
    clearEmailQueue();
    setEmailQueueState(getEmailQueue());
    logAudit('email_queue_cleared', { cleared: count, by: session?.name || 'Owner' });
  }

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds while dashboard is open
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Daily Drink Report ────────────────────────────────────
  async function handleSendDrinkReport() {
    setSendingDrinkReport(true);
    const report = buildDailyDrinkReport();
    let lastResult = { ok: true };
    let anyFailed = false;
    try {
      for (const to of getReportRecipients()) {
        const result = await sendQuezEmail({
          subject: report.subject,
          templateParams: {
            to_email: to,
            subject: report.subject,
            message: report.body,
            operator: session?.name || 'Owner',
            location,
            timestamp: new Date().toISOString(),
          },
        });
        lastResult = result;
        if (!result.ok) anyFailed = true;
      }
    } catch (e) {
      console.warn('Drink report exception:', e);
      anyFailed = true;
      lastResult = { ok: false, reason: 'send-error' };
    }
    setSendingDrinkReport(false);
    const status = sendStatusMessage(lastResult, isSpanish ? 'es' : 'en');
    setDrinkReportStatus(status.variant);
    setDrinkReportStatusText(status.text);
    // Only mark "sent" if delivery was confirmed end-to-end.
    setDrinkReportSent(!anyFailed);
  }

  // ── Periodic checklist rows config ───────────────────────
  const periodicRows = [
    {
      label: isSpanish ? 'Semanal' : 'Weekly',
      due: isWeeklyChecklistDue(),
      submitted: isWeeklySubmittedThisWeek(),
      notDueLabel: isSpanish ? 'No es lunes' : 'Not due today',
    },
    {
      label: isSpanish ? 'Mensual' : 'Monthly',
      due: isMonthlyChecklistDue(),
      submitted: isMonthlySubmittedThisMonth(),
      notDueLabel: isSpanish ? 'No es el 1° del mes' : 'Not due today',
    },
    {
      label: isSpanish ? 'Trimestral' : 'Quarterly',
      due: isQuarterlyChecklistDue(),
      submitted: isQuarterlySubmittedThisQuarter(),
      notDueLabel: isSpanish ? 'No es trimestral hoy' : 'Not due today',
    },
    {
      label: isSpanish ? 'Anual' : 'Annual',
      due: isAnnualChecklistDue(),
      submitted: isAnnualSubmittedThisYear(),
      notDueLabel: isSpanish ? 'No es el 1 de enero' : 'Not due today',
    },
  ];

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={S.screen}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={S.headerTitle}>
              {isSpanish ? 'Panel del Propietario' : 'Owner Dashboard'}
            </h1>
            <p style={S.headerSub}>
              {getTodayDateString()} · {location}
            </p>
          </div>
          <button style={S.refreshBtn} onClick={loadData}>
            ↺ {isSpanish ? 'Actualizar' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Alert Tiles — dismissible. Dismissal lasts one day; if a NEW
              alert appears (count grows), the row reappears automatically.
              The Alerts screen in More always shows live state regardless. ── */}
      {(() => {
        const currentSnapshot = {
          lowStock: lowStockCount,
          handoffs: handoffs.length,
          emailQueue: emailQueue.length,
        };
        const anyAlert = lowStockCount > 0 || handoffs.length > 0 || emailQueue.length > 0;
        if (!anyAlert) return null;
        if (alertsAreDismissed(currentSnapshot)) {
          return (
            <div style={{ padding: '10px 16px 0' }}>
              <button
                onClick={() => navigate('alerts')}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: '1px dashed rgba(212,175,55,0.30)',
                  borderRadius: 8,
                  color: '#888',
                  fontSize: 12,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {isSpanish
                  ? '🚨 Alertas descartadas hoy — toca para ver'
                  : '🚨 Alerts dismissed for today — tap to view'}
              </button>
            </div>
          );
        }
        return (
          <div style={{ padding: '12px 16px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[lowStockCount > 0, handoffs.length > 0, emailQueue.length > 0].filter(Boolean).length || 1}, 1fr)`, gap: 8 }}>
              {lowStockCount > 0 && (
                <div style={{ background: '#111', border: '1px solid #E05252', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase' }}>{isSpanish ? 'Stock' : 'Stock'}</div>
                  <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: '#E05252', fontWeight: 700 }}>{lowStockCount}</div>
                  <div style={{ fontSize: 9, color: '#666' }}>{isSpanish ? 'bajo par' : 'below par'}</div>
                </div>
              )}
              {handoffs.length > 0 && (
                <div style={{ background: '#111', border: '1px solid #D4AF37', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase' }}>{isSpanish ? 'Notas' : 'Hand-offs'}</div>
                  <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: '#D4AF37', fontWeight: 700 }}>{handoffs.length}</div>
                  <div style={{ fontSize: 9, color: '#666' }}>{isSpanish ? 'últimas 24h' : 'last 24h'}</div>
                </div>
              )}
              {emailQueue.length > 0 && (
                <div style={{ background: '#111', border: '1px solid #FFB84A', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em', fontWeight: 800, textTransform: 'uppercase' }}>{isSpanish ? 'Cola' : 'Queue'}</div>
                  <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: '#FFB84A', fontWeight: 700 }}>{emailQueue.length}</div>
                  <div style={{ fontSize: 9, color: '#666' }}>{isSpanish ? 'correos pendientes' : 'emails pending'}</div>
                </div>
              )}
            </div>
            <button
              onClick={() => { dismissAlerts(currentSnapshot); loadData(); }}
              style={{
                marginTop: 8,
                background: 'transparent',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: 6,
                color: '#888',
                fontSize: 11,
                letterSpacing: '0.04em',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'block',
                marginLeft: 'auto',
              }}
            >
              ✕ {isSpanish ? 'Descartar hasta mañana' : 'Dismiss until tomorrow'}
            </button>
          </div>
        );
      })()}

      {/* ── Email Queue Panel — shows when any send has been deferred.
              Hidden when the alert row is dismissed; the Alerts screen in
              More still surfaces it. ── */}
      {emailQueue.length > 0 && !alertsAreDismissed({ lowStock: lowStockCount, handoffs: handoffs.length, emailQueue: emailQueue.length }) && (
        <div style={{ padding: '12px 16px 0' }}>
          {/* Large-queue warning fires at 100+ — usually means EmailJS was
              never wired and reports have been piling up for days. Goes red
              to break through the amber-queue background noise. */}
          {emailQueue.length >= 100 && (
            <div style={{
              marginBottom: 10,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(224,82,82,0.08)',
              border: '1px solid #E05252',
              color: '#FFB3B3',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.4,
            }}>
              🚨 {isSpanish
                ? `La cola tiene ${emailQueue.length} correos. EmailJS probablemente no está configurado. Ve a Ajustes → Datos y Respaldo.`
                : `Queue is ${emailQueue.length} deep. EmailJS likely isn't configured. Open Settings → Data & Backup.`}
            </div>
          )}
          <div style={{
            background: 'rgba(255,184,74,0.06)',
            border: '1px solid rgba(255,184,74,0.4)',
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#FFB84A', letterSpacing: '0.08em', fontWeight: 800, textTransform: 'uppercase' }}>
                  ⚠ {isSpanish ? 'Correos en cola' : 'Emails queued'}
                </div>
                <div style={{ fontSize: 12, color: '#bbb', marginTop: 2 }}>
                  {isSpanish
                    ? `${emailQueue.length} envío${emailQueue.length !== 1 ? 's' : ''} no se completó. Puede ser que EmailJS no esté configurado o que no haya conexión.`
                    : `${emailQueue.length} send${emailQueue.length !== 1 ? 's' : ''} did not complete. Likely EmailJS not configured or offline.`}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 6, marginBottom: 10, maxHeight: 160, overflowY: 'auto' }}>
              {emailQueue.slice(0, 8).map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 0', fontSize: 11, borderBottom: '1px solid rgba(255,184,74,0.10)',
                }}>
                  <span style={{ color: '#ddd', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.subject || (isSpanish ? '(Sin asunto)' : '(No subject)')}
                  </span>
                  <span style={{ color: '#888', flexShrink: 0, fontSize: 10 }}>
                    {item.queuedAt ? formatTime(item.queuedAt) : ''}
                  </span>
                  <button
                    onClick={() => handleDeleteQueuedEmail(i, item.subject)}
                    title={isSpanish ? 'Eliminar de la cola' : 'Drop from queue'}
                    style={{
                      background: 'transparent', border: '1px solid rgba(224,82,82,0.4)',
                      color: '#E05252', borderRadius: 4,
                      width: 22, height: 22, lineHeight: '18px',
                      fontSize: 12, fontWeight: 800, cursor: 'pointer',
                      fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {emailQueue.length > 8 && (
                <div style={{ fontSize: 11, color: '#888', padding: '5px 0', fontStyle: 'italic' }}>
                  {isSpanish ? `+ ${emailQueue.length - 8} más (visibles tras vaciar arriba)` : `+ ${emailQueue.length - 8} more (visible after clearing above)`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{
                  flex: 2,
                  background: retryStatus === 'retrying' ? '#2A2A2A' : '#FFB84A',
                  color: retryStatus === 'retrying' ? '#888' : '#0D0D0D',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px',
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: retryStatus === 'retrying' ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={handleRetryEmailQueue}
                disabled={retryStatus === 'retrying'}
              >
                {retryStatus === 'retrying'
                  ? (isSpanish ? 'Reintentando...' : 'Retrying...')
                  : (isSpanish ? '↻ Reintentar Envíos' : '↻ Retry Sends Now')}
              </button>
              <button
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: '1px solid rgba(224,82,82,0.5)',
                  color: '#E05252',
                  borderRadius: 8,
                  padding: '10px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={handleClearAllQueued}
                disabled={retryStatus === 'retrying'}
              >
                {isSpanish ? 'Vaciar Cola' : 'Clear All'}
              </button>
            </div>
            {retryStatusText && retryStatus !== 'retrying' && (
              <div style={{
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                textAlign: 'center',
                background:
                  retryStatus === 'sent' ? 'rgba(76,175,80,0.10)' :
                  retryStatus === 'partial' ? 'rgba(255,184,74,0.10)' :
                  'rgba(224,82,82,0.10)',
                color:
                  retryStatus === 'sent' ? '#4CAF50' :
                  retryStatus === 'partial' ? '#FFB84A' :
                  '#E05252',
              }}>
                {retryStatusText}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Storage health banner — only shows when there's something to act on,
              and respects the alert-dismissal so dismissing alerts hides this
              banner too. Always visible from the Alerts screen in More. ── */}
      {storageHealth && !alertsAreDismissed({ lowStock: lowStockCount, handoffs: handoffs.length, emailQueue: emailQueue.length }) && (() => {
        // EmailJS-not-configured row intentionally suppressed — the owner has
        // mentally noted the requirement and doesn't want repeated reminders.
        const lastBackup = storageHealth.lastBackupAt ? new Date(storageHealth.lastBackupAt) : null;
        const daysSince = lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / 86400000) : null;
        const noBackup       = !lastBackup;
        const staleBackup    = daysSince !== null && daysSince >= 7;
        const notPersistent  = !storageHealth.isPersistent;
        const isNoisyStorage = storageHealth.percent > 80;
        const autoStatus     = storageHealth.autoBackupStatus;
        const autoTooBig     = autoStatus?.state === 'too_big';
        const autoFailed     = autoStatus?.state === 'failed';
        const autoQueued     = autoStatus?.state === 'queued';
        const hasIssue = noBackup || staleBackup || notPersistent || isNoisyStorage || autoTooBig || autoFailed || autoQueued;
        if (!hasIssue) return null;
        return (
          <div style={{ margin: '8px 16px 0', padding: '10px 13px', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.40)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 6 }}>
              💾 Data Health
            </div>
            <div style={{ fontSize: 12, color: '#ddd', lineHeight: 1.5 }}>
              {noBackup && <div>· {isSpanish ? 'No has hecho un respaldo todavía.' : "You haven't exported a backup yet."}</div>}
              {!noBackup && staleBackup && <div>· {isSpanish ? `Último respaldo hace ${daysSince} días.` : `Last backup was ${daysSince} days ago.`}</div>}
              {autoTooBig && (
                <div style={{ color: '#FFB3B3' }}>
                  · {isSpanish
                      ? `El respaldo automático excede el límite del correo (${(autoStatus.sizeBytes / 1024).toFixed(0)} KB). Solo se envía una alerta — exporta manualmente.`
                      : `Auto-backup exceeds email body limit (${(autoStatus.sizeBytes / 1024).toFixed(0)} KB). Only an alert is sending — export manually to retain data.`}
                </div>
              )}
              {autoFailed && (
                <div style={{ color: '#FFB3B3' }}>
                  · {isSpanish
                      ? `El último envío automático falló: ${autoStatus.error || 'error desconocido'}.`
                      : `Last auto-backup send failed: ${autoStatus.error || 'unknown error'}.`}
                </div>
              )}
              {autoQueued && (
                <div style={{ color: '#FFD699' }}>
                  · {isSpanish
                      ? `El respaldo JSON automático está en cola — usa el panel de Correos en Cola arriba para reenviarlo.`
                      : `Auto-backup JSON is queued — use the Emails Queued panel above to retry the send.`}
                </div>
              )}
              {notPersistent && <div>· {isSpanish ? 'El navegador podría descartar los datos sin protección persistente.' : 'Browser may evict data without persistent protection.'}</div>}
              {isNoisyStorage && <div>· {isSpanish ? `${storageHealth.percent}% del almacenamiento usado.` : `${storageHealth.percent}% of storage used.`}</div>}
            </div>
            <button
              style={{ marginTop: 8, background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => navigate('settings')}
            >
              {isSpanish ? 'Abrir Datos y Respaldo' : 'Open Data & Backup'}
            </button>
          </div>
        );
      })()}

      {/* ── Pre-Launch Timeline tile (owner only) ── */}
      {session?.role === 'owner' && (() => {
        const progress = getPreLaunchProgress();
        // Hidden tasks shouldn't count against the total — they're tasks the
        // owner has marked irrelevant, not work that still needs doing.
        const hidden = Object.values(progress).filter((v) => v && v.hidden).length;
        const visible = Math.max(0, PRELAUNCH_TOTAL - hidden);
        const done = Object.values(progress).filter((v) => v && v.done && !v.hidden).length;
        const pct = visible > 0 ? Math.round((done / visible) * 100) : 0;
        return (
          <div
            onClick={() => navigate('preLaunchTimeline')}
            style={{
              margin: '12px 16px 0',
              background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02))',
              border: '1px solid rgba(212,175,55,0.4)',
              borderRadius: 12,
              padding: '14px 16px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>🚀</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#D4AF37', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Pre-Launch Timeline
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>
                  Soft Open Feb 2027
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#F5F0E8', fontFamily: 'Georgia, serif' }}>
                {done}<span style={{ color: '#666', fontSize: 14 }}>/{visible}</span>
              </div>
            </div>
            <div style={{ height: 5, background: '#222', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #D4AF37, #B8941C)', transition: 'width 0.3s ease' }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#888', textAlign: 'right' }}>
              {pct}% complete · Tap to open →
            </div>
          </div>
        );
      })()}

      {/* Below this line the panels and tiles tile into a multi-column
          grid on iPad (≥820px). Above stays full-width because it's the
          alert/CTA strip the owner reads first. Expanded panels still
          span all columns so badge rows + flagged items aren't squeezed. */}
      <div className="quez-card-grid" style={{ padding: '14px 16px 0' }}>
      {/* ── Hand-off Notes (recent 24h) ── */}
      {handoffs.length > 0 && (
        <CollapsiblePanel
          id="handoffs"
          icon="📝"
          title={isSpanish ? 'Notas de Hand-off' : 'Hand-off Notes'}
          headerRight={
            <span style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, color: '#D4AF37', fontFamily: 'sans-serif', fontSize: '0.7rem', padding: '2px 9px', fontWeight: 700 }}>
              {handoffs.length}
            </span>
          }
        >
          {handoffs.map((h) => (
            <div key={h.id} style={{ padding: '10px 12px', background: '#0D0D0D', border: '1px solid #222', borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: '#D4AF37', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
                {h.byName} · {new Date(h.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 13, color: '#F5F0E8', fontStyle: 'italic', lineHeight: 1.45 }}>
                "{h.text}"
              </div>
            </div>
          ))}
        </CollapsiblePanel>
      )}

      {/* ── Panel 1: Daily Checklist Status ── */}
      <CollapsiblePanel
        id="dailyChecklist"
        icon="☑"
        title={isSpanish ? 'Checklist Diario de Hoy' : "Today's Daily Checklist"}
        headerRight={(() => {
          // Surface section completion on the collapsed header so the owner
          // doesn't have to expand each panel to see whether opening/mid/
          // closing have been submitted.
          const done = [dailyStatus.opening, dailyStatus.midService, dailyStatus.closing].filter(Boolean).length;
          const total = 3;
          const allDone = done === total;
          const noneDone = done === 0;
          return (
            <span style={{
              background: allDone ? 'rgba(76,175,80,0.10)' : noneDone ? 'rgba(224,82,82,0.10)' : 'rgba(255,184,74,0.10)',
              border: '1px solid ' + (allDone ? 'rgba(76,175,80,0.5)' : noneDone ? 'rgba(224,82,82,0.5)' : 'rgba(255,184,74,0.5)'),
              color: allDone ? '#4CAF50' : noneDone ? '#E05252' : '#FFB84A',
              fontSize: '0.72rem', fontFamily: 'sans-serif', fontWeight: 700,
              borderRadius: 10, padding: '3px 9px', whiteSpace: 'nowrap',
            }}>
              {done}/{total}{allDone ? ' ✓' : ''}
            </span>
          );
        })()}
      >
        {[
          { key: 'opening', label: isSpanish ? 'Apertura' : 'Opening' },
          { key: 'midService', label: isSpanish ? 'Servicio Intermedio' : 'Mid-Service' },
          { key: 'closing', label: isSpanish ? 'Cierre' : 'Closing' },
        ].map((section, i, arr) => {
          const done = dailyStatus[section.key];
          const isLast = i === arr.length - 1;
          return (
            <div key={section.key} style={isLast ? S.statusRowLast : S.statusRow}>
              <span style={{ fontSize: '1rem', minWidth: 22, textAlign: 'center' }}>
                {done ? '✅' : '⬜'}
              </span>
              <span style={S.statusLabel}>{section.label}</span>
              <span style={done ? S.statusValueDone : S.statusValuePending}>
                {done
                  ? (isSpanish ? 'Completado' : 'Submitted')
                  : (isSpanish ? 'Pendiente' : 'Pending')}
              </span>
            </div>
          );
        })}
      </CollapsiblePanel>

      {/* ── Panel 2: Periodic Checklist Status ── */}
      <CollapsiblePanel
        id="periodicChecklists"
        icon="📅"
        title={isSpanish ? 'Checklists Periódicos' : 'Periodic Checklists'}
        headerRight={(() => {
          const dueUnsubmitted = periodicRows.filter((r) => r.due && !r.submitted).length;
          const anyDue = periodicRows.some((r) => r.due);
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {anyDue && (
                <span style={{
                  background: dueUnsubmitted > 0 ? 'rgba(224,82,82,0.10)' : 'rgba(76,175,80,0.10)',
                  border: '1px solid ' + (dueUnsubmitted > 0 ? 'rgba(224,82,82,0.5)' : 'rgba(76,175,80,0.5)'),
                  color: dueUnsubmitted > 0 ? '#E05252' : '#4CAF50',
                  fontSize: '0.72rem', fontFamily: 'sans-serif', fontWeight: 700,
                  borderRadius: 10, padding: '3px 9px', whiteSpace: 'nowrap',
                }}>
                  {dueUnsubmitted > 0
                    ? (isSpanish ? `${dueUnsubmitted} PEND` : `${dueUnsubmitted} DUE`)
                    : '✓'}
                </span>
              )}
              <button
                style={{
                  background: 'rgba(212,175,55,0.12)',
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: 6,
                  color: '#D4AF37',
                  fontFamily: 'sans-serif',
                  fontSize: '0.68rem',
                  letterSpacing: '0.05em',
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('periodicChecklists')}
              >
                {isSpanish ? 'Abrir →' : 'Open →'}
              </button>
            </div>
          );
        })()}
      >
        {periodicRows.map((row, i) => {
          const isLast = i === periodicRows.length - 1;
          return (
            <div key={row.label} style={isLast ? S.statusRowLast : S.statusRow}>
              <span style={{ fontSize: '1rem', minWidth: 22, textAlign: 'center', opacity: row.due ? 1 : 0.35 }}>
                {!row.due ? '–' : row.submitted ? '✅' : '⚠️'}
              </span>
              <span style={{ ...S.statusLabel, opacity: row.due ? 1 : 0.4 }}>
                {row.label}
              </span>
              <span style={
                !row.due ? S.statusValue :
                row.submitted ? S.statusValueDone :
                S.statusValuePending
              }>
                {!row.due
                  ? row.notDueLabel
                  : row.submitted
                  ? (isSpanish ? 'Enviado' : 'Submitted')
                  : (isSpanish ? 'PENDIENTE' : 'DUE — Not submitted')}
              </span>
            </div>
          );
        })}
      </CollapsiblePanel>

      {/* ── Panel 3: Flagged Items ── */}
      <CollapsiblePanel
        id="flaggedItems"
        icon="🚨"
        title={isSpanish ? 'Elementos Marcados Hoy' : "Today's Flagged Items"}
        headerRight={flaggedItems.length > 0 ? (
          <span style={{
            background: 'rgba(224,82,82,0.15)',
            border: '1px solid rgba(224,82,82,0.4)',
            borderRadius: 10,
            color: '#e05252',
            fontFamily: 'sans-serif',
            fontSize: '0.7rem',
            padding: '2px 9px',
            fontWeight: 700,
          }}>
            {flaggedItems.length}
          </span>
        ) : null}
      >
        {flaggedItems.length === 0 ? (
          <p style={S.empty}>
            {isSpanish ? 'Sin elementos marcados hoy. ✓' : 'No flagged items today. ✓'}
          </p>
        ) : (
          flaggedItems.map((flag, i) => {
            const isLast = i === flaggedItems.length - 1;
            return (
              <div key={flag.id || i} style={isLast ? { padding: '10px 0' } : S.flagRow}>
                <div style={S.flagItem}>{flag.item || flag.label || 'Flagged item'}</div>
                <div style={S.flagMeta}>
                  {flag.section && `${flag.section} · `}
                  {flag.operator && `${flag.operator} · `}
                  {formatTime(flag.timestamp || flag.flaggedAt)}
                </div>
                {flag.correctiveAction && (
                  <div style={S.flagAction}>
                    {isSpanish ? 'Acción correctiva' : 'Corrective action'}: {flag.correctiveAction}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CollapsiblePanel>

      {/* ── Build-time tile (with per-prep breakdown surfaced when slower) ── */}
      {(buildTimeToday.count > 0 || buildTime7Day.count > 0) && (() => {
        const fmt = (s) => {
          if (!s) return '—';
          const m = Math.floor(s / 60);
          const r = s % 60;
          return `${m}:${r.toString().padStart(2, '0')}`;
        };
        const today = buildTimeToday.avgSec;
        const week  = buildTime7Day.avgSec;
        const slower = today > 0 && week > 0 && today > week + 15; // > 15 sec slower than baseline
        // Identify the slowest prep today — the chokepoint to investigate
        const prepEntries = ['espresso', 'drip', 'iced', 'blended']
          .map((k) => ({ k, ...(buildTimeToday.byPrep[k] || { count: 0, avgSec: 0 }) }))
          .filter((p) => p.count > 0)
          .sort((a, b) => b.avgSec - a.avgSec);
        const slowestPrep = prepEntries[0];
        const prepLabel = {
          espresso: isSpanish ? 'espresso' : 'espresso',
          drip:     isSpanish ? 'goteo'    : 'drip',
          iced:     isSpanish ? 'frío'     : 'iced',
          blended:  isSpanish ? 'licuado'  : 'blended',
        };
        return (
          <div style={{ margin: '8px 16px 0', padding: '12px 14px', background: '#111', border: '1px solid ' + (slower ? '#FFB84A' : '#2A2A2A'), borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: '#888', letterSpacing: '0.10em', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
              ⏱ {isSpanish ? 'Tiempo de Preparación' : 'Build Time'}
            </div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: slower ? '#FFB84A' : '#D4AF37', fontWeight: 700 }}>{fmt(today)}</div>
                <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isSpanish ? `hoy · ${buildTimeToday.count}` : `today · ${buildTimeToday.count}`}
                </div>
              </div>
              <div style={{ color: '#444', fontSize: 18 }}>vs</div>
              <div>
                <div style={{ fontSize: 18, color: '#888' }}>{fmt(week)}</div>
                <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isSpanish ? `prom 7d · ${buildTime7Day.count}` : `7-day avg · ${buildTime7Day.count}`}
                </div>
              </div>
              {slower && (
                <div style={{ marginLeft: 'auto', color: '#FFB84A', fontSize: 11, fontWeight: 700 }}>
                  ↑ {isSpanish ? 'más lento que el promedio' : 'slower than baseline'}
                </div>
              )}
            </div>
            {/* Per-prep breakdown row — small chips, sorted by today's avg. */}
            {prepEntries.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {prepEntries.map((p, idx) => {
                  const baseline = buildTime7Day.byPrep[p.k]?.avgSec || 0;
                  const isLagging = baseline > 0 && p.avgSec > baseline + 15;
                  return (
                    <span
                      key={p.k}
                      style={{
                        fontSize: 11,
                        padding: '3px 9px',
                        borderRadius: 5,
                        border: '1px solid ' + (isLagging && idx === 0 ? '#FFB84A' : '#333'),
                        background: isLagging && idx === 0 ? 'rgba(255,184,74,0.08)' : 'transparent',
                        color: isLagging && idx === 0 ? '#FFB84A' : '#aaa',
                        fontWeight: 600,
                      }}
                    >
                      {prepLabel[p.k]}: {fmt(p.avgSec)}
                      {baseline > 0 && <span style={{ color: '#666', marginLeft: 4 }}>· {fmt(baseline)}</span>}
                    </span>
                  );
                })}
              </div>
            )}
            {/* Surface the chokepoint as a one-line callout */}
            {slower && slowestPrep && (() => {
              const baseline = buildTime7Day.byPrep[slowestPrep.k]?.avgSec || 0;
              if (baseline > 0 && slowestPrep.avgSec > baseline + 15) {
                return (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#bbb', lineHeight: 1.4 }}>
                    {isSpanish
                      ? `Cuello de botella: ${prepLabel[slowestPrep.k]} promedia ${fmt(slowestPrep.avgSec)} hoy vs ${fmt(baseline)} normal. Investiga el equipo.`
                      : `Bottleneck: ${prepLabel[slowestPrep.k]} averaging ${fmt(slowestPrep.avgSec)} today vs ${fmt(baseline)} normal. Investigate the equipment.`}
                  </div>
                );
              }
              return null;
            })()}
          </div>
        );
      })()}

      {/* ── Trainee cohort tile — shows all active trainees + phase progress.
          Surfaces who's closest to graduation so the owner can plan the
          Training Approval cadence. Hidden when no trainees are active. ── */}
      {trainees.length > 0 && (() => {
        const phaseDot = (done) => (
          <span style={{
            display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
            background: done ? '#D4AF37' : '#2A2A2A',
            border: '1px solid ' + (done ? '#D4AF37' : '#333'),
            marginRight: 4,
          }} />
        );
        // Sort by completedPhases desc so the closest-to-graduation trainee
        // floats to the top.
        const sorted = [...trainees].sort((a, b) => b.completedPhases - a.completedPhases);
        return (
          <div style={{ margin: '8px 16px 0', padding: '12px 14px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#888', letterSpacing: '0.10em', fontWeight: 800, textTransform: 'uppercase' }}>
                🎓 {isSpanish ? `Trainees (${trainees.length})` : `Trainees (${trainees.length})`}
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: '#D4AF37', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => navigate('trainees')}
              >
                {isSpanish ? 'Ver todos ›' : 'View all ›'}
              </button>
            </div>
            {sorted.map((t) => {
              const r = t.record || {};
              const p1 = !!r.phase1?.passed;
              const p2 = !!r.phase2?.passed;
              const p3 = !!r.phase3?.passed;
              const ready = p1 && p2 && p3;
              return (
                <div key={t.employee.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 0', borderBottom: '1px solid #1a1a1a',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F0E8' }}>
                      {t.employee.name}
                      {ready && (
                        <span style={{ marginLeft: 8, color: '#4CAF50', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em' }}>
                          {isSpanish ? '✓ LISTO PARA APROBAR' : '✓ READY TO APPROVE'}
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center' }}>
                      {phaseDot(p1)}{phaseDot(p2)}{phaseDot(p3)}
                      <span style={{ marginLeft: 6, color: '#888', fontSize: 11 }}>
                        {t.completedPhases}/3 {isSpanish ? 'fases' : 'phases'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── Panel 4: Daily Drink Report ── */}
      <CollapsiblePanel
        id="drinkReport"
        icon="☕"
        title={isSpanish ? 'Reporte Diario de Bebidas' : 'Daily Drink Report'}
        headerRight={drinkTotal > 0 ? (
          <span style={{ background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, color: '#D4AF37', fontFamily: 'sans-serif', fontSize: '0.7rem', padding: '2px 9px', fontWeight: 700 }}>
            {drinkTotal}
          </span>
        ) : null}
      >
        <p style={S.reportSub}>
          {drinkTotal > 0
            ? (isSpanish
                ? `${drinkTotal} bebida${drinkTotal !== 1 ? 's' : ''} servida${drinkTotal !== 1 ? 's' : ''} hoy en ${Object.keys(drinkTally).length} variedad${Object.keys(drinkTally).length !== 1 ? 'es' : ''}.`
                : `${drinkTotal} drink${drinkTotal !== 1 ? 's' : ''} served today across ${Object.keys(drinkTally).length} variet${Object.keys(drinkTally).length !== 1 ? 'ies' : 'y'}.`)
            : (isSpanish
                ? 'Aún no se han servido bebidas hoy.'
                : 'No drinks have been served yet today.')}
        </p>

        {drinkTotal > 0 && (
          <div style={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: 8, padding: '10px 12px', margin: '8px 0 12px', maxHeight: 200, overflowY: 'auto' }}>
            {Object.keys(drinkTally)
              .sort((a, b) => drinkTally[b].total - drinkTally[a].total)
              .map((name) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: '#ddd' }}>{name}</span>
                  <span style={{ color: '#D4AF37', fontWeight: 700 }}>{drinkTally[name].total}</span>
                </div>
              ))}
          </div>
        )}

        {sendingDrinkReport ? (
          <div style={S.reportSending}>
            {isSpanish ? 'Enviando reporte...' : 'Sending report...'}
          </div>
        ) : (
          <>
            <button
              style={drinkTotal > 0 ? S.reportBtn : S.reportBtnDisabled}
              disabled={drinkTotal === 0}
              onClick={handleSendDrinkReport}
            >
              {isSpanish ? 'Enviar Reporte de Bebidas' : 'Send Drink Report'}
            </button>
            {drinkReportStatusText && (
              <div style={{
                marginTop: 8,
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                background:
                  drinkReportStatus === 'sent' ? 'rgba(76,175,80,0.10)' :
                  drinkReportStatus === 'queued' ? 'rgba(255,184,74,0.10)' :
                  'rgba(224,82,82,0.10)',
                border: '1px solid ' + (
                  drinkReportStatus === 'sent' ? 'rgba(76,175,80,0.45)' :
                  drinkReportStatus === 'queued' ? 'rgba(255,184,74,0.45)' :
                  'rgba(224,82,82,0.45)'
                ),
                color:
                  drinkReportStatus === 'sent' ? '#4CAF50' :
                  drinkReportStatus === 'queued' ? '#FFB84A' :
                  '#E05252',
              }}>
                {drinkReportStatusText}
              </div>
            )}
          </>
        )}
      </CollapsiblePanel>
      </div>
      {/* end .quez-card-grid */}

      {/* ── Footer spacing ── */}
      <div style={{ height: 16 }} />

    </div>
  );
}
