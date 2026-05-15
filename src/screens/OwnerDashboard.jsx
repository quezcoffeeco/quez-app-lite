// ============================================================
// QUEZ APP LITE — OwnerDashboard.jsx
// src/screens/OwnerDashboard.jsx
// Session 6
//
// Panels:
//   1. Today's Date / Greeting
//   2. Daily Checklist Status (Opening / Mid-Service / Closing)
//   3. Periodic Checklist Status (Weekly / Monthly / Quarterly / Annual)
//   4. Clock-In Log (all punches today)
//   5. Flagged Items (out-of-range readings from today)
//   6. Time Clock Report (send unsent punches to owner email)
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  loadTodayClockRecords,
  loadTodayFlaggedItems,
  buildTimeClockReport,
  markPunchesSent,
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
} from '../utils/storage';
import { sendQuezEmail } from '../utils/emailjs';

// ── Helpers ───────────────────────────────────────────────────
function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(clockIn, clockOut) {
  if (!clockIn || !clockOut) return null;
  const ms = new Date(clockOut) - new Date(clockIn);
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function getRoleLabel(role) {
  const map = {
    owner: 'Owner',
    manager: 'Manager',
    lead_barista: 'Lead Barista',
    leadBarista: 'Lead Barista',
    barista: 'Barista',
    trainee: 'Trainee',
  };
  return map[role] || role;
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
  // Clock-in rows
  clockRow: {
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  clockName: {
    fontFamily: 'sans-serif',
    fontSize: '0.86rem',
    color: '#F5F0E8',
    fontWeight: 600,
    marginBottom: 2,
  },
  clockMeta: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#F5F0E8',
    opacity: 0.5,
  },
  clockTime: {
    fontFamily: 'sans-serif',
    fontSize: '0.72rem',
    color: '#D4AF37',
    marginTop: 2,
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
    background: 'none',
    border: 'none',
    color: '#D4AF37',
    fontSize: '0.72rem',
    fontFamily: 'sans-serif',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginLeft: 'auto',
    opacity: 0.7,
    padding: '2px 4px',
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

  const [clockRecords, setClockRecords] = useState([]);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [dailyStatus, setDailyStatus] = useState({ opening: false, midService: false, closing: false });
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportCount, setReportCount] = useState(0);


  const loadData = useCallback(() => {
    setClockRecords(loadTodayClockRecords());
    setFlaggedItems(loadTodayFlaggedItems());
    setDailyStatus(getDailySectionStatus());

    // Count unsent punches for the report button label
    const report = buildTimeClockReport();
    setReportCount(report?.count || 0);


  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 60 seconds while dashboard is open
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // ── Time Clock Report ─────────────────────────────────────
  async function handleSendTimeClockReport() {
    setSendingReport(true);
    const report = buildTimeClockReport();
    if (!report || report.count === 0) {
      setSendingReport(false);
      return;
    }
    try {
      await sendQuezEmail({
        subject: report.subject,
        templateParams: {
          subject: report.subject,
          message: report.body,
          operator: session?.name || 'Owner',
          location,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.warn('Time clock report queued:', e);
    }
    markPunchesSent();
    setSendingReport(false);
    setReportSent(true);
    setReportCount(0);
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

      {/* ── Panel 1: Daily Checklist Status ── */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>☑</span>
          <h2 style={S.panelTitle}>
            {isSpanish ? 'Checklist Diario de Hoy' : "Today's Daily Checklist"}
          </h2>
        </div>
        <div style={S.panelBody}>

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

        </div>
      </div>

      {/* ── Panel 2: Periodic Checklist Status ── */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>📅</span>
          <h2 style={S.panelTitle}>
            {isSpanish ? 'Checklists Periódicos' : 'Periodic Checklists'}
          </h2>
          <button
            style={{
              marginLeft: 'auto',
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
        <div style={S.panelBody}>
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
        </div>
      </div>

      {/* ── Panel 3: Clock-In Log ── */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>⏱</span>
          <h2 style={S.panelTitle}>
            {isSpanish ? 'Registro de Entradas de Hoy' : "Today's Clock-In Log"}
          </h2>
          <span style={{
            marginLeft: 'auto',
            background: 'rgba(212,175,55,0.12)',
            border: '1px solid rgba(212,175,55,0.25)',
            borderRadius: 10,
            color: '#D4AF37',
            fontFamily: 'sans-serif',
            fontSize: '0.7rem',
            padding: '2px 9px',
            fontWeight: 700,
          }}>
            {clockRecords.length}
          </span>
        </div>
        <div style={S.panelBody}>
          {clockRecords.length === 0 ? (
            <p style={S.empty}>
              {isSpanish ? 'Nadie ha registrado entrada hoy.' : 'No one has clocked in today.'}
            </p>
          ) : (
            clockRecords.map((punch, i) => {
              const isLast = i === clockRecords.length - 1;
              const duration = formatDuration(punch.clockInTime, punch.clockOutTime);
              return (
                <div key={punch.id || i} style={isLast ? { padding: '10px 0' } : S.clockRow}>
                  <div style={S.clockName}>{punch.name}</div>
                  <div style={S.clockMeta}>
                    {getRoleLabel(punch.role)} · {punch.location}
                    {punch.autoClosedFlag && (
                      <span style={{ color: '#e09050', marginLeft: 6 }}>
                        ⚠ {isSpanish ? 'Cierre automático' : 'Auto-closed'}
                      </span>
                    )}
                  </div>
                  <div style={S.clockTime}>
                    {isSpanish ? 'Entrada' : 'In'}: {formatTime(punch.clockInTime)}
                    {punch.clockOutTime
                      ? ` · ${isSpanish ? 'Salida' : 'Out'}: ${formatTime(punch.clockOutTime)}${duration ? ` · ${duration}` : ''}`
                      : ` · ${isSpanish ? 'Turno abierto' : 'Shift open'}`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Panel 4: Flagged Items ── */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>🚨</span>
          <h2 style={S.panelTitle}>
            {isSpanish ? 'Elementos Marcados Hoy' : "Today's Flagged Items"}
          </h2>
          {flaggedItems.length > 0 && (
            <span style={{
              marginLeft: 'auto',
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
          )}
        </div>
        <div style={S.panelBody}>
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
        </div>
      </div>

      {/* ── Panel 5: Time Clock Report ── */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <span style={S.panelIcon}>📊</span>
          <h2 style={S.panelTitle}>
            {isSpanish ? 'Reporte de Tiempo' : 'Time Clock Report'}
          </h2>
        </div>
        <div style={S.panelBody}>
          <p style={S.reportSub}>
            {reportCount > 0
              ? (isSpanish
                  ? `${reportCount} registro${reportCount !== 1 ? 's' : ''} sin enviar listo${reportCount !== 1 ? 's' : ''}. El reporte se enviará al correo del propietario.`
                  : `${reportCount} unsent punch record${reportCount !== 1 ? 's' : ''} ready. Report will be sent to the owner email.`)
              : (isSpanish
                  ? 'No hay registros de tiempo sin enviar en este momento.'
                  : 'No unsent time clock records at this time.')}
          </p>

          {reportSent ? (
            <div style={S.reportSent}>
              ✅ {isSpanish ? 'Reporte enviado correctamente.' : 'Report sent successfully.'}
            </div>
          ) : sendingReport ? (
            <div style={S.reportSending}>
              {isSpanish ? 'Enviando reporte...' : 'Sending report...'}
            </div>
          ) : (
            <button
              style={reportCount > 0 ? S.reportBtn : S.reportBtnDisabled}
              disabled={reportCount === 0}
              onClick={handleSendTimeClockReport}
            >
              {isSpanish ? 'Enviar Reporte de Tiempo' : 'Send Time Clock Report'}
            </button>
          )}
        </div>
      </div>

      {/* ── Footer spacing ── */}
      <div style={{ height: 16 }} />

    </div>
  );
}
