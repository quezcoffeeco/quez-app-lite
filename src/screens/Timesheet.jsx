// ============================================================
// QUEZ APP LITE — Timesheet.jsx
// Manager/owner view: edit time punches (fix forgotten clock-outs).
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getPunchesInRange, updatePunch, deletePunch } from '../utils/storage';
import { fmtClock } from '../utils/timeFormat';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
const fmtTime = (iso) => iso ? fmtClock(iso) : '—';
function durationHours(inIso, outIso) {
  if (!inIso || !outIso) return null;
  const ms = new Date(outIso) - new Date(inIso);
  return Math.max(0, ms / 3600000);
}
function toLocalDateTimeInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalDateTimeInput(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function Timesheet() {
  const { language, currentUser } = useApp();
  const lang = language || 'en';

  const [days, setDays] = useState(14);
  const [punches, setPunches] = useState([]);
  const [editing, setEditing] = useState(null); // { original clockInTime, employeeId, clockInTime, clockOutTime, name }

  const load = useCallback(() => {
    setPunches(getPunchesInRange(days));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (p) => {
    setEditing({
      originalIn: p.clockInTime,
      employeeId: p.employeeId,
      name: p.name,
      clockInTime: toLocalDateTimeInput(p.clockInTime),
      clockOutTime: toLocalDateTimeInput(p.clockOutTime),
    });
  };

  const saveEdit = () => {
    if (!editing) return;
    const inIso = fromLocalDateTimeInput(editing.clockInTime);
    const outIso = editing.clockOutTime ? fromLocalDateTimeInput(editing.clockOutTime) : null;
    if (!inIso) return;
    if (outIso && new Date(outIso) <= new Date(inIso)) {
      alert(lang === 'es' ? 'La hora de salida debe ser después de la entrada.' : 'Clock-out must be after clock-in.');
      return;
    }
    updatePunch(editing.originalIn, editing.employeeId, { clockInTime: inIso, clockOutTime: outIso }, currentUser?.name);
    setEditing(null);
    load();
  };

  const removeRow = (p) => {
    if (!window.confirm(lang === 'es' ? `¿Eliminar punch de ${p.name} del ${fmtDate(p.clockInTime)}?` : `Delete punch for ${p.name} on ${fmtDate(p.clockInTime)}?`)) return;
    deletePunch(p.clockInTime, p.employeeId, currentUser?.name);
    load();
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Hoja de Tiempo' : 'Timesheet'}</div>
        <div style={S.headerSub}>{lang === 'es' ? 'Editar registros de tiempo' : 'Edit time-clock records'}</div>
      </div>

      <div style={S.rangeBar}>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            style={{ ...S.rangeBtn, ...(days === d ? S.rangeBtnActive : {}) }}
            onClick={() => setDays(d)}
          >
            {d} {lang === 'es' ? 'días' : 'days'}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {punches.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Sin registros en este rango' : 'No punches in this range'}</div>
          </div>
        ) : (
          punches.map((p) => {
            const hrs = durationHours(p.clockInTime, p.clockOutTime);
            const openShift = !p.clockOutTime;
            return (
              <div key={`${p.employeeId}_${p.clockInTime}`} style={{ ...S.row, ...(openShift ? S.rowOpen : {}) }}>
                <div style={S.rowMain}>
                  <div style={S.rowName}>{p.name}</div>
                  <div style={S.rowMeta}>
                    {fmtDate(p.clockInTime)} · {fmtTime(p.clockInTime)} → {p.clockOutTime ? fmtTime(p.clockOutTime) : (lang === 'es' ? 'abierto' : 'open')}
                    {hrs != null && <span style={{ color: '#D4AF37', marginLeft: 8 }}>{hrs.toFixed(2)}h</span>}
                  </div>
                  {p.editedAt && (
                    <div style={S.rowEdited}>
                      {lang === 'es' ? 'editado' : 'edited'} · {fmtDate(p.editedAt)} · {p.editedBy || ''}
                    </div>
                  )}
                </div>
                <div style={S.rowActions}>
                  <button style={S.iconBtn} onClick={() => openEdit(p)}>✎</button>
                  <button style={{ ...S.iconBtn, color: '#E05252' }} onClick={() => removeRow(p)}>✕</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {editing && (
        <div style={S.overlay} onClick={() => setEditing(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 6 }}>✦</div>
            <h3 style={S.modalTitle}>{editing.name}</h3>
            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Entrada' : 'Clock-in'}</label>
              <input style={S.input} type="datetime-local" value={editing.clockInTime}
                onChange={(e) => setEditing((p) => ({ ...p, clockInTime: e.target.value }))} />
            </div>
            <div style={S.field}>
              <label style={S.fieldLabel}>
                {lang === 'es' ? 'Salida' : 'Clock-out'}
                <span style={{ color: '#666', fontWeight: 400, marginLeft: 6 }}>
                  ({lang === 'es' ? 'opcional' : 'optional'})
                </span>
              </label>
              <input style={S.input} type="datetime-local" value={editing.clockOutTime}
                onChange={(e) => setEditing((p) => ({ ...p, clockOutTime: e.target.value }))} />
              <button
                type="button"
                style={{ ...S.iconBtn, marginTop: 6, color: '#888', fontSize: 11, width: 'auto', padding: '4px 10px', borderRadius: 6 }}
                onClick={() => setEditing((p) => ({ ...p, clockOutTime: '' }))}
              >
                {lang === 'es' ? 'Limpiar salida' : 'Clear clock-out'}
              </button>
            </div>
            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setEditing(null)}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              <button style={S.btnGold} onClick={saveEdit}>{lang === 'es' ? 'Guardar' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center' },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rangeBar: { display: 'flex', gap: 4, padding: 12, background: '#111', borderBottom: '1px solid #222' },
  rangeBtn: { flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  rangeBtnActive: { background: 'rgba(212,175,55,0.14)', border: '1px solid #D4AF37', color: '#D4AF37' },
  body: { padding: '14px 16px' },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, marginBottom: 8 },
  rowOpen: { borderColor: '#E05252', background: 'rgba(224,82,82,0.05)' },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 700, color: '#F5F0E8' },
  rowMeta: { fontSize: 12, color: '#aaa', marginTop: 2 },
  rowEdited: { fontSize: 10, color: '#666', fontStyle: 'italic', marginTop: 3 },
  rowActions: { display: 'flex', gap: 5 },
  iconBtn: { background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontFamily: 'inherit' },
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#1A1A1A', border: '1px solid #D4AF37', borderRadius: 14, padding: '22px 20px', width: '100%', maxWidth: 380 },
  modalTitle: { color: '#F5F0E8', fontSize: 18, fontWeight: 700, margin: '0 0 14px' },
  field: { marginBottom: 12 },
  fieldLabel: { display: 'block', fontSize: 10, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 },
  input: { width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: 7, color: '#F5F0E8', fontFamily: 'inherit', fontSize: 14, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: 10, marginTop: 14 },
  btnCancel: { flex: 1, padding: '11px', background: '#0D0D0D', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnGold: { flex: 2, padding: '11px', background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
};
