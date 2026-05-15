// ============================================================
// QUEZ APP LITE — ShiftSwaps.jsx
// Employees request to drop a shift; manager approves/denies.
// In-app only (no SMS/push).
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getSwapRequests, createSwapRequest, resolveSwapRequest, getUpcomingShiftsFor } from '../utils/storage';
import { fmtShiftTime, fmtRelTime } from '../utils/timeFormat';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
const fmtTime = fmtShiftTime;

export default function ShiftSwaps() {
  const { language, currentUser } = useApp();
  const lang = language || 'en';
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  const [tab, setTab] = useState(isAdmin ? 'pending' : 'mine');
  const [requests, setRequests] = useState([]);
  const [creating, setCreating] = useState(false);
  const [requestType, setRequestType] = useState('shift_drop'); // 'shift_drop' | 'day_off'
  const [pickedShift, setPickedShift] = useState(null);
  const [dayOffDate, setDayOffDate] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    setRequests(getSwapRequests());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Visible by tab
  const filtered = (() => {
    if (tab === 'pending') return requests.filter((r) => r.status === 'pending');
    if (tab === 'history') return requests.filter((r) => r.status !== 'pending');
    if (tab === 'mine')    return requests.filter((r) => r.employeeId === currentUser?.id);
    return requests;
  })();

  const myUpcoming = currentUser ? getUpcomingShiftsFor(currentUser.id, 14) : [];

  const handleApprove = (r) => {
    resolveSwapRequest(r.id, 'approved', currentUser?.name);
    load();
  };
  const handleDeny = (r) => {
    resolveSwapRequest(r.id, 'denied', currentUser?.name);
    load();
  };

  const submitRequest = () => {
    if (!currentUser) return;
    if (requestType === 'shift_drop' && !pickedShift) return;
    if (requestType === 'day_off' && !dayOffDate) return;
    createSwapRequest({
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      dateStr: requestType === 'shift_drop' ? pickedShift.date : dayOffDate,
      shiftId: requestType === 'shift_drop' ? pickedShift.id : null,
      type: requestType,
      reason,
    });
    setCreating(false);
    setPickedShift(null);
    setDayOffDate('');
    setReason('');
    setRequestType('shift_drop');
    load();
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Cambios de Turno' : 'Shift Swaps'}</div>
        <div style={S.headerSub}>{lang === 'es' ? 'Solicitudes de cambio (en la app)' : 'Swap requests (in-app)'}</div>
      </div>

      <div style={S.tabs}>
        {isAdmin ? (
          <>
            <button style={{ ...S.tab, ...(tab === 'pending' ? S.tabActive : {}) }} onClick={() => setTab('pending')}>
              {lang === 'es' ? 'Pendientes' : 'Pending'}
              {requests.filter((r) => r.status === 'pending').length > 0 && (
                <span style={S.badge}>{requests.filter((r) => r.status === 'pending').length}</span>
              )}
            </button>
            <button style={{ ...S.tab, ...(tab === 'history' ? S.tabActive : {}) }} onClick={() => setTab('history')}>
              {lang === 'es' ? 'Historial' : 'History'}
            </button>
          </>
        ) : (
          <button style={{ ...S.tab, ...S.tabActive }}>
            {lang === 'es' ? 'Mis Solicitudes' : 'My Requests'}
          </button>
        )}
      </div>

      {!isAdmin && (
        <button style={S.newBtn} onClick={() => setCreating(true)}>
          + {lang === 'es' ? 'Pedir Cambio' : 'Request Swap'}
        </button>
      )}

      <div style={S.body}>
        {filtered.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
            <div style={S.emptyTitle}>
              {tab === 'pending' ? (lang === 'es' ? 'Bandeja vacía. Buena.' : 'Inbox zero. Nice.')
                                 : (lang === 'es' ? 'Sin historial todavía' : 'No history yet')}
            </div>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} style={S.card}>
              <div style={S.cardTop}>
                <div>
                  <div style={S.cardName}>
                    {r.employeeName}
                    <span style={S.typePill}>
                      {r.type === 'day_off'
                        ? (lang === 'es' ? 'DÍA LIBRE' : 'DAY OFF')
                        : (lang === 'es' ? 'DEJAR TURNO' : 'SHIFT DROP')}
                    </span>
                  </div>
                  <div style={S.cardSub}>{fmtDate(r.dateStr)} · {fmtRelTime(r.createdAt)}</div>
                </div>
                <div style={{ ...S.statusPill, ...(STATUS_STYLES[r.status] || {}) }}>
                  {r.status.toUpperCase()}
                </div>
              </div>
              {r.reason && <div style={S.reason}>📝 {r.reason}</div>}
              {r.resolvedAt && (
                <div style={S.resolved}>
                  {r.status === 'approved' ? '✓' : '✕'} {r.resolvedBy} · {fmtRelTime(r.resolvedAt)}
                </div>
              )}
              {isAdmin && r.status === 'pending' && (
                <div style={S.actions}>
                  <button style={S.denyBtn} onClick={() => handleDeny(r)}>
                    {lang === 'es' ? 'Negar' : 'Deny'}
                  </button>
                  <button style={S.approveBtn} onClick={() => handleApprove(r)}>
                    {lang === 'es' ? 'Aprobar' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {creating && (
        <div style={S.overlay} onClick={() => setCreating(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 6 }}>✦</div>
            <h3 style={S.modalTitle}>{lang === 'es' ? 'Nueva Solicitud' : 'New Request'}</h3>

            {/* Type toggle */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: requestType === 'shift_drop' ? 'rgba(212,175,55,0.18)' : '#1A1A1A',
                  border: requestType === 'shift_drop' ? '1px solid #D4AF37' : '1px solid #333',
                  color: requestType === 'shift_drop' ? '#D4AF37' : '#888',
                  borderRadius: 8,
                  padding: '9px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => setRequestType('shift_drop')}
              >
                {lang === 'es' ? 'Dejar Turno' : 'Drop a Shift'}
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  background: requestType === 'day_off' ? 'rgba(212,175,55,0.18)' : '#1A1A1A',
                  border: requestType === 'day_off' ? '1px solid #D4AF37' : '1px solid #333',
                  color: requestType === 'day_off' ? '#D4AF37' : '#888',
                  borderRadius: 8,
                  padding: '9px',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => setRequestType('day_off')}
              >
                {lang === 'es' ? 'Día Libre' : 'Day Off'}
              </button>
            </div>

            {requestType === 'shift_drop' ? (
              <div style={S.field}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'Selecciona el turno' : 'Pick your shift'}</label>
                {myUpcoming.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#888', padding: '10px 0' }}>
                    {lang === 'es' ? 'No tienes turnos próximos.' : 'You have no upcoming shifts.'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {myUpcoming.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        style={{
                          background: pickedShift?.id === s.id ? 'rgba(212,175,55,0.18)' : '#0D0D0D',
                          border: pickedShift?.id === s.id ? '1px solid #D4AF37' : '1px solid #333',
                          borderRadius: 8,
                          padding: '10px 12px',
                          textAlign: 'left',
                          color: '#F5F0E8',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                        onClick={() => setPickedShift(s)}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(s.date)}</div>
                        <div style={{ fontSize: 12, color: '#D4AF37' }}>{fmtTime(s.start)} – {fmtTime(s.end)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={S.field}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'Fecha del día libre' : 'Day off date'}</label>
                <input
                  style={S.input}
                  type="date"
                  value={dayOffDate}
                  onChange={(e) => setDayOffDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                  {lang === 'es' ? 'El gerente verá tu solicitud y la aprobará o negará.' : "Manager sees your request and will approve or deny."}
                </div>
              </div>
            )}

            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Motivo (opcional)' : 'Reason (optional)'}</label>
              <input style={S.input} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={120}
                placeholder={lang === 'es' ? 'p. ej. cita médica' : 'e.g. doctor appointment'} />
            </div>

            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setCreating(false)}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              <button
                style={{ ...S.btnGold, opacity: ((requestType === 'shift_drop' && pickedShift) || (requestType === 'day_off' && dayOffDate)) ? 1 : 0.5 }}
                disabled={!((requestType === 'shift_drop' && pickedShift) || (requestType === 'day_off' && dayOffDate))}
                onClick={submitRequest}
              >
                {lang === 'es' ? 'Enviar' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  pending:  { background: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37', color: '#D4AF37' },
  approved: { background: 'rgba(76,175,80,0.15)',  border: '1px solid #4CAF50', color: '#4CAF50' },
  denied:   { background: 'rgba(224,82,82,0.12)',  border: '1px solid #E05252', color: '#E05252' },
};

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center' },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  tabs: { display: 'flex', gap: 4, padding: 12, background: '#111', borderBottom: '1px solid #222' },
  tab: { flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { background: 'rgba(212,175,55,0.14)', border: '1px solid #D4AF37', color: '#D4AF37' },
  badge: { background: '#D4AF37', color: '#0D0D0D', borderRadius: '50%', minWidth: 20, height: 20, fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },

  newBtn: { width: 'calc(100% - 28px)', margin: '0 14px', background: 'rgba(212,175,55,0.12)', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 },

  body: { padding: '12px 14px' },
  card: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 15, fontWeight: 700, color: '#F5F0E8' },
  cardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  statusPill: { borderRadius: 4, padding: '3px 9px', fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' },
  typePill: { display: 'inline-block', marginLeft: 8, background: '#2A2A2A', color: '#aaa', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' },
  reason: { fontSize: 13, color: '#ddd', padding: '8px 10px', background: '#0D0D0D', borderRadius: 6, marginBottom: 8 },
  resolved: { fontSize: 11, color: '#888', marginBottom: 8 },
  actions: { display: 'flex', gap: 8, marginTop: 4 },
  denyBtn: { flex: 1, background: 'transparent', border: '1px solid #E05252', color: '#E05252', borderRadius: 8, padding: '9px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  approveBtn: { flex: 1, background: '#4CAF50', border: 'none', color: '#0D0D0D', borderRadius: 8, padding: '9px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#1A1A1A', border: '1px solid #D4AF37', borderRadius: 14, padding: '22px 20px', width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto' },
  modalTitle: { color: '#F5F0E8', fontSize: 18, fontWeight: 700, margin: '0 0 14px' },
  field: { marginBottom: 12 },
  fieldLabel: { display: 'block', fontSize: 10, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 },
  input: { width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: 7, color: '#F5F0E8', fontFamily: 'inherit', fontSize: 14, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 10, marginTop: 14 },
  btnCancel: { flex: 1, padding: '11px', background: '#0D0D0D', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnGold: { flex: 2, padding: '11px', background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
};
