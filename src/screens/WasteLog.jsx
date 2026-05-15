// ============================================================
// QUEZ APP LITE — WasteLog.jsx
// Tracks drinks dumped/remade with reason codes.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { logWaste, getWasteLogRange, WASTE_REASONS, downloadCsv } from '../utils/storage';
import { drinkRecipes, PREP_TYPE_COLORS } from '../data/drinkRecipes';

const PREP_LABELS = {
  hot:     { en: 'Hot',     es: 'Caliente' },
  iced:    { en: 'Iced',    es: 'Frío' },
  blended: { en: 'Blended', es: 'Licuado' },
};

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function WasteLog() {
  const { language, currentUser } = useApp();
  const lang = language || 'en';

  const [days, setDays] = useState(7);
  const [log, setLog] = useState([]);
  const [adding, setAdding] = useState(false);
  const [drinkId, setDrinkId] = useState(drinkRecipes[0]?.id || '');
  const [size, setSize] = useState('12oz');
  const [prep, setPrep] = useState('hot');
  const [reason, setReason] = useState('spill');
  const [note, setNote] = useState('');

  const load = useCallback(() => {
    setLog(getWasteLogRange(days));
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const drink = drinkRecipes.find((d) => d.id === drinkId);
  const validPreps = drink ? Object.keys(drink.buildSteps) : ['hot'];

  // Make sure prep is valid for the selected drink
  useEffect(() => {
    if (drink && !validPreps.includes(prep)) setPrep(validPreps[0]);
  }, [drinkId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!drink) return;
    logWaste({
      drinkId: drink.id,
      drinkName: drink.name,
      size,
      prepType: prep,
      reason,
      note,
      byName: currentUser?.name || 'Unknown',
    });
    setAdding(false);
    setReason('spill');
    setNote('');
    load();
  };

  const exportCsv = () => {
    if (log.length === 0) return;
    const rows = log.map((w) => ({
      datetime: fmtDateTime(w.at),
      drink: w.drinkName,
      size: w.size,
      prep: w.prepType,
      reason: WASTE_REASONS.find((r) => r.id === w.reason)?.label.en || w.reason,
      note: w.note || '',
      byName: w.byName || '',
    }));
    downloadCsv(`waste-log-${days}d-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  // Summary tallies
  const totalCount = log.length;
  const byReason = {};
  log.forEach((w) => { byReason[w.reason] = (byReason[w.reason] || 0) + 1; });
  const reasonList = Object.entries(byReason).sort((a, b) => b[1] - a[1]);

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Registro de Desperdicio' : 'Waste & Remake Log'}</div>
        <div style={S.headerSub}>{lang === 'es' ? 'Bebidas desechadas con motivo' : 'Drinks dumped, with reasons'}</div>
      </div>

      <div style={S.toolbar}>
        <div style={S.rangeBar}>
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              style={{ ...S.rangeBtn, ...(days === d ? S.rangeBtnActive : {}) }}
              onClick={() => setDays(d)}
            >
              {d === 1 ? (lang === 'es' ? 'Hoy' : 'Today') : `${d} ${lang === 'es' ? 'días' : 'd'}`}
            </button>
          ))}
        </div>
        <button style={S.addBtn} onClick={() => setAdding(true)}>+ {lang === 'es' ? 'Registrar' : 'Log'}</button>
      </div>

      <div style={S.body}>
        {/* Summary */}
        <div style={S.summary}>
          <div style={S.bigStat}>{totalCount}</div>
          <div style={S.bigStatSub}>
            {lang === 'es' ? `bebidas desperdiciadas · últimos ${days} día${days !== 1 ? 's' : ''}` : `drinks wasted · last ${days} day${days !== 1 ? 's' : ''}`}
          </div>
          {reasonList.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {reasonList.map(([rid, c]) => (
                <div key={rid} style={S.reasonRow}>
                  <span style={{ color: '#ddd' }}>{WASTE_REASONS.find((r) => r.id === rid)?.label[lang] || rid}</span>
                  <span style={{ color: '#D4AF37', fontWeight: 700 }}>{c}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log */}
        {log.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Sin desperdicios' : 'No waste logged'}</div>
            <div style={S.emptyBody}>{lang === 'es' ? 'Tap + Registrar para empezar a rastrear.' : 'Tap + Log to start tracking.'}</div>
          </div>
        ) : (
          <>
            <button style={S.csvBtn} onClick={exportCsv}>⬇ {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}</button>
            {log.map((w) => (
              <div key={w.id} style={S.row}>
                <div style={S.rowMain}>
                  <div style={S.rowTop}>
                    <span style={{ ...S.sizePill, color: PREP_TYPE_COLORS[w.prepType === 'hot' ? 'Hot Only' : w.prepType === 'iced' ? 'Iced Only' : 'Blended Only'] }}>{w.size}</span>
                    <span style={S.rowName}>{w.drinkName}</span>
                  </div>
                  <div style={S.rowMeta}>
                    {WASTE_REASONS.find((r) => r.id === w.reason)?.label[lang] || w.reason}
                    {w.note && <span style={{ color: '#aaa' }}> · {w.note}</span>}
                  </div>
                  <div style={S.rowFoot}>
                    {fmtDateTime(w.at)} · {w.byName}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {adding && (
        <div style={S.overlay} onClick={() => setAdding(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 6 }}>✦</div>
            <h3 style={S.modalTitle}>{lang === 'es' ? 'Registrar Desperdicio' : 'Log Waste'}</h3>

            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Bebida' : 'Drink'}</label>
              <select style={S.input} value={drinkId} onChange={(e) => setDrinkId(e.target.value)}>
                {drinkRecipes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'Tamaño' : 'Size'}</label>
                <select style={S.input} value={size} onChange={(e) => setSize(e.target.value)}>
                  <option value="12oz">12oz</option>
                  <option value="16oz">16oz</option>
                </select>
              </div>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'Preparación' : 'Prep'}</label>
                <select style={S.input} value={prep} onChange={(e) => setPrep(e.target.value)}>
                  {validPreps.map((p) => <option key={p} value={p}>{PREP_LABELS[p][lang]}</option>)}
                </select>
              </div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Motivo' : 'Reason'}</label>
              <select style={S.input} value={reason} onChange={(e) => setReason(e.target.value)}>
                {WASTE_REASONS.map((r) => <option key={r.id} value={r.id}>{r.label[lang]}</option>)}
              </select>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Nota (opcional)' : 'Note (optional)'}</label>
              <input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} maxLength={100}
                placeholder={lang === 'es' ? 'detalles del incidente' : 'incident detail'} />
            </div>

            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setAdding(false)}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              <button style={S.btnGold} onClick={submit}>{lang === 'es' ? 'Registrar' : 'Log'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  toolbar: { display: 'flex', gap: 8, padding: 12, background: '#111', borderBottom: '1px solid #222', alignItems: 'center' },
  rangeBar: { display: 'flex', gap: 4, flex: 1 },
  rangeBtn: { flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  rangeBtnActive: { background: 'rgba(212,175,55,0.14)', border: '1px solid #D4AF37', color: '#D4AF37' },
  addBtn: { background: 'rgba(212,175,55,0.12)', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 8, padding: '8px 13px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },

  body: { padding: '14px 16px' },
  summary: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 14 },
  bigStat: { fontSize: 42, fontFamily: 'Georgia, serif', color: '#E05252', fontWeight: 700, lineHeight: 1 },
  bigStatSub: { fontSize: 12, color: '#888', marginTop: 2 },
  reasonRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1a1a1a', fontSize: 13 },

  csvBtn: { width: '100%', marginBottom: 10, background: 'transparent', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', borderRadius: 8, padding: '9px', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit' },

  row: { display: 'flex', gap: 10, padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, marginBottom: 8 },
  rowMain: { flex: 1, minWidth: 0 },
  rowTop: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 },
  sizePill: { fontSize: 10, background: '#222', border: '1px solid #333', borderRadius: 4, padding: '1px 6px', fontWeight: 700 },
  rowName: { fontSize: 14, color: '#F5F0E8', fontWeight: 700 },
  rowMeta: { fontSize: 12, color: '#ddd' },
  rowFoot: { fontSize: 10, color: '#666', marginTop: 3 },

  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 14 },

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
