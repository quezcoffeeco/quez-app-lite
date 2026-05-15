// ============================================================
// QUEZ APP LITE — AuditLog.jsx
// Owner-visible log of important admin actions.
// ============================================================

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  getAuditLog,
  clearAuditLog,
  AUDIT_LOG_MAX,
  AUDIT_LOG_WARN_AT,
} from '../utils/storage';

const ACTION_LABELS = {
  pin_reset:         { en: 'PIN reset',           es: 'PIN reseteado' },
  shift_create:      { en: 'Shift created',       es: 'Turno creado' },
  shift_update:      { en: 'Shift updated',       es: 'Turno actualizado' },
  shift_delete:      { en: 'Shift removed',       es: 'Turno eliminado' },
  role_upgrade:      { en: 'Role upgraded',       es: 'Rol actualizado' },
  order_cancelled:   { en: 'Order cancelled',     es: 'Pedido cancelado' },
  order_uncancelled: { en: 'Cancel undone',       es: 'Cancelación deshecha' },
  session_lock:      { en: 'Session locked',      es: 'Sesión bloqueada' },
  backup_exported:   { en: 'Backup exported',     es: 'Respaldo exportado' },
  backup_restored:   { en: 'Backup restored',     es: 'Respaldo restaurado' },
  backup_emailed:    { en: 'Backup emailed',      es: 'Respaldo enviado' },
  punch_edit:        { en: 'Punch edited',        es: 'Marcaje editado' },
  punch_delete:      { en: 'Punch removed',       es: 'Marcaje eliminado' },
  swap_requested:    { en: 'Swap requested',      es: 'Cambio solicitado' },
  swap_approved:     { en: 'Swap approved',       es: 'Cambio aprobado' },
  swap_denied:       { en: 'Swap denied',         es: 'Cambio rechazado' },
  data_pruned:       { en: 'Old data pruned',     es: 'Datos antiguos depurados' },
};

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function downloadCsv(log) {
  const header = ['timestamp', 'action', 'details'];
  const rows = log.map((e) => {
    const detailStr = e.details ? JSON.stringify(e.details).replace(/"/g, '""') : '';
    return [e.at, e.action, `"${detailStr}"`].join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quez-audit-log-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AuditLog() {
  const { language } = useApp();
  const lang = language || 'en';
  const [refresh, setRefresh] = React.useState(0);
  const log = getAuditLog();
  const nearCap = log.length >= AUDIT_LOG_WARN_AT;
  const atCap = log.length >= AUDIT_LOG_MAX;

  const handleClear = () => {
    if (!window.confirm(lang === 'es'
      ? '¿Limpiar el registro de auditoría? Esta acción no se puede deshacer.'
      : 'Clear the audit log? This cannot be undone.')) return;
    clearAuditLog();
    setRefresh((n) => n + 1);
  };

  const handleExport = () => {
    if (log.length === 0) return;
    downloadCsv(log);
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Registro de Auditoría' : 'Audit Log'}</div>
        <div style={S.headerSub}>
          {lang === 'es' ? 'Acciones administrativas' : 'Administrative actions'}
          {log.length > 0 && (
            <span style={S.countPill}>{log.length} / {AUDIT_LOG_MAX}</span>
          )}
        </div>
      </div>

      <div style={S.body}>
        {nearCap && (
          <div style={atCap ? S.bannerCrit : S.bannerWarn}>
            <div style={S.bannerTitle}>
              {atCap
                ? (lang === 'es' ? '⚠ Registro lleno' : '⚠ Log at capacity')
                : (lang === 'es' ? '⚠ Acercándose al límite' : '⚠ Approaching capacity')}
            </div>
            <div style={S.bannerBody}>
              {atCap
                ? (lang === 'es'
                    ? `El registro guarda solo las últimas ${AUDIT_LOG_MAX} entradas. Las entradas más antiguas se están eliminando. Exporta a CSV para conservar el historial.`
                    : `Log only keeps the most recent ${AUDIT_LOG_MAX} entries. Older entries are being dropped. Export to CSV to preserve history.`)
                : (lang === 'es'
                    ? `Quedan ${AUDIT_LOG_MAX - log.length} entradas antes de que las más antiguas se eliminen. Exporta para conservar.`
                    : `${AUDIT_LOG_MAX - log.length} entries until oldest start dropping. Export to preserve.`)}
            </div>
            <button style={S.bannerBtn} onClick={handleExport}>
              {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}
            </button>
          </div>
        )}

        {log.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Sin registros' : 'No entries yet'}</div>
            <div style={S.emptyBody}>
              {lang === 'es'
                ? 'Las acciones de administración (PIN reseteado, turnos, aprobaciones) aparecerán aquí.'
                : 'Admin actions (PIN resets, shift changes, approvals) will appear here.'}
            </div>
          </div>
        ) : (
          <>
            <div style={S.list}>
              {log.map((entry) => {
                const label = ACTION_LABELS[entry.action]?.[lang] || entry.action;
                const summary = renderDetails(entry.details, lang);
                return (
                  <div key={entry.id} style={S.row}>
                    <div style={S.rowMain}>
                      <div style={S.rowAction}>{label}</div>
                      {summary && <div style={S.rowDetails}>{summary}</div>}
                    </div>
                    <div style={S.rowTime}>{fmt(entry.at)}</div>
                  </div>
                );
              })}
            </div>
            <div style={S.btnRow}>
              <button style={S.exportBtn} onClick={handleExport}>
                {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}
              </button>
              <button style={S.clearBtn} onClick={handleClear}>
                {lang === 'es' ? 'Limpiar Registro' : 'Clear Log'}
              </button>
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'none' }}>{refresh}</div>
    </div>
  );
}

function renderDetails(d, lang) {
  if (!d) return '';
  const parts = [];
  if (d.employeeName) parts.push(d.employeeName);
  if (d.orderNumber) parts.push(`#${d.orderNumber}`);
  if (d.dateStr) parts.push(d.dateStr);
  if (d.reason) parts.push(d.reason);
  if (d.kb) parts.push(`${d.kb} KB freed`);
  if (d.byName || d.by) parts.push(`${lang === 'es' ? 'por' : 'by'} ${d.byName || d.by}`);
  return parts.join(' · ');
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 },
  countPill: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: 'rgba(212,175,55,0.12)', color: '#D4AF37', fontSize: 11, fontWeight: 700 },
  body: { padding: '14px 16px' },
  bannerWarn: { background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.4)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  bannerCrit: { background: 'rgba(224,82,82,0.12)', border: '1px solid rgba(224,82,82,0.5)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 },
  bannerTitle: { fontWeight: 700, fontSize: 14, color: '#F5F0E8', marginBottom: 6 },
  bannerBody: { fontSize: 12, color: '#C8C0B0', lineHeight: 1.5, marginBottom: 10 },
  bannerBtn: { padding: '8px 14px', background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em' },
  list: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, overflow: 'hidden' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 14px', borderBottom: '1px solid #1a1a1a', gap: 10 },
  rowMain: { flex: 1, minWidth: 0 },
  rowAction: { fontSize: 14, fontWeight: 700, color: '#F5F0E8' },
  rowDetails: { fontSize: 12, color: '#888', marginTop: 2 },
  rowTime: { fontSize: 11, color: '#666', whiteSpace: 'nowrap' },
  btnRow: { display: 'flex', gap: 10, marginTop: 14 },
  exportBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  clearBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #E05252', color: '#E05252', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 14, lineHeight: 1.6 },
};
