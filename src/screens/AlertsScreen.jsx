// ============================================================
// QUEZ APP LITE — AlertsScreen.jsx
// Owner/manager-only roll-up of operational alerts. Mirrors the
// owner-dashboard alert row + email queue panel + storage health
// banner, but renders them regardless of any dismissal state so
// the operator can always check what's outstanding.
// ============================================================
import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  getLowStockItems,
  getHandoffNotes,
  getStorageHealth,
  clearDismissedAlerts,
} from '../utils/storage';
import { getEmailQueue, retryEmailQueue } from '../utils/emailjs';

const C = {
  black: '#0D0D0D', dark: '#1A1A1A', mid: '#2A2A2A',
  gold: '#D4AF37', cream: '#F5F0E8', gray: '#9A9080',
  red: '#E05252', amber: '#FFB84A', green: '#4CAF50',
};

export default function AlertsScreen() {
  const { navigate, language } = useApp();
  const isSpanish = language === 'es';

  const [lowStock, setLowStock] = useState([]);
  const [handoffs, setHandoffs] = useState([]);
  const [emailQueue, setEmailQueueState] = useState([]);
  const [storageHealth, setStorageHealth] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(() => {
    setLowStock(getLowStockItems());
    setHandoffs(getHandoffNotes());
    setEmailQueueState(getEmailQueue());
    try { setStorageHealth(getStorageHealth()); } catch { setStorageHealth(null); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // "Reset dismissals" exists so the operator can pull the dashboard tiles
  // back even if they dismissed earlier and want them visible again.
  const handleReset = () => {
    clearDismissedAlerts();
    navigate('dashboard');
  };

  const handleRetryQueue = async () => {
    setRetrying(true);
    try { await retryEmailQueue(); } catch {}
    setRetrying(false);
    load();
  };

  const totalAlerts = (lowStock.length > 0 ? 1 : 0)
    + (handoffs.length > 0 ? 1 : 0)
    + (emailQueue.length > 0 ? 1 : 0);

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <h1 style={S.title}>
          {isSpanish ? 'Alertas Operativas' : 'Operational Alerts'}
        </h1>
        <p style={S.sub}>
          {totalAlerts === 0
            ? (isSpanish ? 'Nada que atender. Todo limpio.' : 'Nothing to address. All clear.')
            : (isSpanish
                ? `${totalAlerts} tipo${totalAlerts !== 1 ? 's' : ''} de alerta abierta`
                : `${totalAlerts} alert type${totalAlerts !== 1 ? 's' : ''} open`)}
        </p>
      </div>

      <div style={S.body}>
        {totalAlerts === 0 && (
          <div style={S.emptyCard}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
            <div style={{ fontSize: 14, color: C.cream, marginBottom: 4 }}>
              {isSpanish ? 'No hay alertas operativas.' : 'No operational alerts.'}
            </div>
            <div style={{ fontSize: 12, color: C.gray }}>
              {isSpanish
                ? 'Esta pantalla aparece en Más solo cuando hay algo que requiere atención.'
                : 'This screen appears in More only when something needs your attention.'}
            </div>
          </div>
        )}

        {/* ── Low Stock ── */}
        {lowStock.length > 0 && (
          <div style={{ ...S.card, borderColor: C.red }}>
            <div style={S.cardHeader}>
              <span style={{ ...S.cardIcon, color: C.red }}>📦</span>
              <span style={S.cardTitle}>
                {isSpanish ? 'Stock Bajo' : 'Low Stock'}
              </span>
              <span style={{ ...S.cardBadge, background: 'rgba(224,82,82,0.15)', color: C.red, borderColor: C.red }}>
                {lowStock.length}
              </span>
            </div>
            <div style={S.cardBody}>
              {lowStock.slice(0, 10).map((item) => {
                const onHand = Number.isInteger(item.onHand)
                  ? item.onHand
                  : Math.round((item.onHand ?? 0) * 10) / 10;
                return (
                  <div key={item.id} style={S.lineRow}>
                    <span style={{ color: C.cream }}>{item.name}</span>
                    <span style={{ color: C.red, fontWeight: 700 }}>
                      {onHand} / {item.par} {item.unit}
                    </span>
                  </div>
                );
              })}
              {lowStock.length > 10 && (
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6, textAlign: 'center' }}>
                  +{lowStock.length - 10} {isSpanish ? 'más' : 'more'}
                </div>
              )}
            </div>
            <button style={S.cardAction} onClick={() => navigate('inventory')}>
              {isSpanish ? 'Abrir Inventario →' : 'Open Inventory →'}
            </button>
          </div>
        )}

        {/* ── Hand-off Notes ── */}
        {handoffs.length > 0 && (
          <div style={{ ...S.card, borderColor: C.gold }}>
            <div style={S.cardHeader}>
              <span style={{ ...S.cardIcon, color: C.gold }}>📝</span>
              <span style={S.cardTitle}>
                {isSpanish ? 'Notas de Hand-off' : 'Hand-off Notes'}
              </span>
              <span style={{ ...S.cardBadge, background: 'rgba(212,175,55,0.15)', color: C.gold, borderColor: C.gold }}>
                {handoffs.length}
              </span>
            </div>
            <div style={S.cardBody}>
              {handoffs.slice(0, 5).map((h) => (
                <div key={h.id} style={S.handoffRow}>
                  <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginBottom: 2 }}>
                    {h.byName} · {new Date(h.at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                  </div>
                  <div style={{ fontSize: 13, color: C.cream, fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{h.text}"
                  </div>
                </div>
              ))}
              {handoffs.length > 5 && (
                <div style={{ fontSize: 11, color: C.gray, marginTop: 6, textAlign: 'center' }}>
                  +{handoffs.length - 5} {isSpanish ? 'más' : 'more'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Email Queue ── */}
        {emailQueue.length > 0 && (
          <div style={{ ...S.card, borderColor: C.amber }}>
            <div style={S.cardHeader}>
              <span style={{ ...S.cardIcon, color: C.amber }}>✉</span>
              <span style={S.cardTitle}>
                {isSpanish ? 'Correos en Cola' : 'Emails Queued'}
              </span>
              <span style={{ ...S.cardBadge, background: 'rgba(255,184,74,0.15)', color: C.amber, borderColor: C.amber }}>
                {emailQueue.length}
              </span>
            </div>
            <div style={S.cardBody}>
              <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.5 }}>
                {isSpanish
                  ? `${emailQueue.length} envío${emailQueue.length !== 1 ? 's' : ''} no se completó. EmailJS no está configurado o estuviste sin conexión.`
                  : `${emailQueue.length} send${emailQueue.length !== 1 ? 's' : ''} did not complete. EmailJS isn't configured or you were offline.`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.cardAction} onClick={handleRetryQueue} disabled={retrying}>
                {retrying
                  ? (isSpanish ? 'Reintentando...' : 'Retrying...')
                  : (isSpanish ? '↺ Reintentar Cola' : '↺ Retry Queue')}
              </button>
              <button
                style={{ ...S.cardAction, background: 'transparent', color: C.amber, border: '1px solid ' + C.amber }}
                onClick={() => navigate('settings')}
              >
                {isSpanish ? 'Ajustes' : 'Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── Storage Health (only when there's something to act on) ── */}
        {storageHealth && (() => {
          const lastBackup = storageHealth.lastBackupAt ? new Date(storageHealth.lastBackupAt) : null;
          const daysSince = lastBackup ? Math.floor((Date.now() - lastBackup.getTime()) / 86400000) : null;
          const noBackup = !lastBackup;
          const staleBackup = daysSince !== null && daysSince >= 7;
          const notPersistent = !storageHealth.isPersistent;
          const isNoisyStorage = storageHealth.percent > 80;
          const hasIssue = noBackup || staleBackup || notPersistent || isNoisyStorage;
          if (!hasIssue) return null;
          return (
            <div style={{ ...S.card, borderColor: C.gold }}>
              <div style={S.cardHeader}>
                <span style={{ ...S.cardIcon, color: C.gold }}>💾</span>
                <span style={S.cardTitle}>
                  {isSpanish ? 'Salud de Datos' : 'Data Health'}
                </span>
              </div>
              <div style={S.cardBody}>
                {noBackup && (
                  <div style={S.lineRow}>
                    <span style={{ color: C.cream }}>
                      {isSpanish ? 'Nunca se ha exportado un respaldo.' : 'No backup has ever been exported.'}
                    </span>
                  </div>
                )}
                {!noBackup && staleBackup && (
                  <div style={S.lineRow}>
                    <span style={{ color: C.cream }}>
                      {isSpanish
                        ? `Último respaldo hace ${daysSince} días.`
                        : `Last backup was ${daysSince} days ago.`}
                    </span>
                  </div>
                )}
                {notPersistent && (
                  <div style={S.lineRow}>
                    <span style={{ color: C.cream }}>
                      {isSpanish
                        ? 'El navegador podría descartar los datos sin protección persistente.'
                        : 'Browser may evict data without persistent protection.'}
                    </span>
                  </div>
                )}
                {isNoisyStorage && (
                  <div style={S.lineRow}>
                    <span style={{ color: C.cream }}>
                      {isSpanish
                        ? `${storageHealth.percent}% del almacenamiento usado.`
                        : `${storageHealth.percent}% of storage used.`}
                    </span>
                  </div>
                )}
              </div>
              <button style={S.cardAction} onClick={() => navigate('settings')}>
                {isSpanish ? 'Abrir Datos y Respaldo →' : 'Open Data & Backup →'}
              </button>
            </div>
          );
        })()}

        {/* Reset dismissed tiles — only relevant if there ARE alerts above */}
        {totalAlerts > 0 && (
          <button style={S.resetBtn} onClick={handleReset}>
            {isSpanish
              ? '↺ Restablecer alertas descartadas en el dashboard'
              : '↺ Reset dismissed alerts on the dashboard'}
          </button>
        )}
      </div>
    </div>
  );
}

const S = {
  screen: {
    minHeight: '100vh',
    background: C.black,
    color: C.cream,
    paddingBottom: 100,
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
  },
  header: {
    padding: '20px 16px 14px',
    background: C.dark,
    borderBottom: `1px solid ${C.gold}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  title: {
    margin: 0,
    fontFamily: 'Georgia, serif',
    color: C.gold,
    fontSize: 19,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  sub: {
    margin: '4px 0 0',
    color: C.gray,
    fontSize: 13,
  },
  body: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    maxWidth: 760,
    margin: '0 auto',
  },
  emptyCard: {
    background: C.dark,
    border: '1px solid ' + C.mid,
    borderRadius: 12,
    padding: '24px 18px',
    textAlign: 'center',
  },
  card: {
    background: C.dark,
    border: '1px solid',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  cardIcon: { fontSize: 18 },
  cardTitle: {
    flex: 1,
    fontFamily: 'sans-serif',
    fontSize: 12,
    letterSpacing: '0.08em',
    fontWeight: 800,
    textTransform: 'uppercase',
    color: C.cream,
  },
  cardBadge: {
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 12,
    padding: '2px 10px',
    border: '1px solid',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  lineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    fontSize: 13,
  },
  handoffRow: {
    padding: '8px 10px',
    background: C.black,
    border: '1px solid #222',
    borderRadius: 8,
  },
  cardAction: {
    minHeight: 44,
    background: C.gold,
    border: 'none',
    borderRadius: 8,
    color: C.black,
    fontWeight: 800,
    fontSize: 13,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '0 16px',
    flex: 1,
  },
  resetBtn: {
    marginTop: 8,
    minHeight: 44,
    background: 'transparent',
    border: '1px solid ' + C.mid,
    borderRadius: 8,
    color: C.gray,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};
