// ============================================================
// QUEZ APP LITE — Inventory.jsx
// Simple par-level tracker. Manager/owner sets par + on-hand;
// low-stock items surface on the Dashboard.
// ============================================================

import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getInventory, updateInventoryItem, saveInventory, DEFAULT_INVENTORY_ITEMS, downloadCsv } from '../utils/storage';

export default function Inventory() {
  const { language } = useApp();
  const lang = language || 'en';
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = useCallback(() => {
    setItems(getInventory());
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group items by category
  const categories = [];
  const seen = new Set();
  items.forEach((i) => { if (!seen.has(i.category)) { seen.add(i.category); categories.push(i.category); }});

  const lowCount = items.filter((i) => (i.onHand ?? 0) < (i.par ?? 0)).length;

  const adjust = (id, delta) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    const newOnHand = Math.max(0, (it.onHand || 0) + delta);
    updateInventoryItem(id, { onHand: newOnHand });
    load();
  };

  const saveEdit = (patch) => {
    if (!editing) return;
    updateInventoryItem(editing.id, patch);
    setEditing(null);
    load();
  };

  const resetDefaults = () => {
    if (!window.confirm(lang === 'es' ? '¿Restablecer la lista a valores predeterminados?' : 'Reset inventory to defaults?')) return;
    // Deep-copy so saving doesn't lock the saved state to the same reference
    // as the module-level DEFAULT (would let future deductions mutate it).
    saveInventory(DEFAULT_INVENTORY_ITEMS.map((i) => ({ ...i })));
    load();
  };

  const exportCsv = () => {
    if (items.length === 0) return;
    const rows = items.map((i) => ({
      item: i.name,
      category: i.category,
      onHand: i.onHand ?? 0,
      par: i.par ?? 0,
      unit: i.unit,
      lowStock: (i.onHand ?? 0) < (i.par ?? 0) ? 'YES' : '',
    }));
    downloadCsv(`inventory-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Inventario' : 'Inventory'}</div>
        <div style={S.headerSub}>
          {lowCount > 0
            ? (lang === 'es' ? `${lowCount} bajo el par` : `${lowCount} below par`)
            : (lang === 'es' ? 'Todo en stock' : 'All in stock')}
        </div>
      </div>

      <div style={S.toolbar}>
        <button style={S.csvBtn} onClick={exportCsv}>⬇ CSV</button>
        <button style={S.resetBtn} onClick={resetDefaults}>↻ {lang === 'es' ? 'Restablecer' : 'Reset Defaults'}</button>
      </div>

      <div style={S.body}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: 14 }}>
            <div style={S.catHeader}>{cat}</div>
            {items.filter((i) => i.category === cat).map((i) => {
              const low = (i.onHand ?? 0) < (i.par ?? 0);
              return (
                <div key={i.id} style={{ ...S.row, ...(low ? S.rowLow : {}) }}>
                  <div style={S.rowMain}>
                    <div style={S.rowName}>{i.name}</div>
                    <div style={S.rowMeta}>
                      {lang === 'es' ? 'Par' : 'Par'}: <b style={{ color: '#aaa' }}>{i.par}</b> {i.unit}
                      {low && (
                        <span style={S.lowPill}>{lang === 'es' ? 'BAJO' : 'LOW'}</span>
                      )}
                    </div>
                  </div>
                  <div style={S.adjustRow}>
                    <button style={S.adjBtn} onClick={() => adjust(i.id, -1)}>−</button>
                    <span style={{ ...S.onHand, color: low ? '#E05252' : '#D4AF37' }}>
                      {(() => {
                        const v = i.onHand ?? 0;
                        // Drop trailing zeros: 2.0 → 2, but keep 2.5 / 1.3
                        return Number.isInteger(v) ? v : Math.round(v * 10) / 10;
                      })()}
                    </span>
                    <button style={S.adjBtn} onClick={() => adjust(i.id, +1)}>+</button>
                  </div>
                  <button style={S.editBtn} onClick={() => setEditing({ ...i })}>✎</button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {editing && (
        <div style={S.overlay} onClick={() => setEditing(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 6 }}>✦</div>
            <h3 style={S.modalTitle}>{editing.name}</h3>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'Par' : 'Par'}</label>
                <input style={S.input} type="number" min={0} value={editing.par ?? 0}
                  onChange={(e) => setEditing((p) => ({ ...p, par: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div style={{ ...S.field, flex: 1 }}>
                <label style={S.fieldLabel}>{lang === 'es' ? 'En mano' : 'On hand'}</label>
                <input style={S.input} type="number" min={0} value={editing.onHand ?? 0}
                  onChange={(e) => setEditing((p) => ({ ...p, onHand: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.fieldLabel}>{lang === 'es' ? 'Unidad' : 'Unit'}</label>
              <input style={S.input} value={editing.unit} onChange={(e) => setEditing((p) => ({ ...p, unit: e.target.value }))} />
            </div>

            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setEditing(null)}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
              <button style={S.btnGold} onClick={() => saveEdit({ par: editing.par, onHand: editing.onHand, unit: editing.unit })}>
                {lang === 'es' ? 'Guardar' : 'Save'}
              </button>
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

  toolbar: { display: 'flex', gap: 8, padding: 10, background: '#111', borderBottom: '1px solid #222' },
  csvBtn: { background: 'transparent', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', borderRadius: 7, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },
  resetBtn: { background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 7, padding: '6px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' },

  body: { padding: '14px 16px' },
  catHeader: { fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, marginBottom: 6 },
  rowLow: { borderColor: '#E05252', background: 'rgba(224,82,82,0.06)' },
  rowMain: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: 700, color: '#F5F0E8' },
  rowMeta: { fontSize: 11, color: '#888', marginTop: 2 },
  lowPill: { display: 'inline-block', marginLeft: 8, background: '#E05252', color: '#fff', borderRadius: 4, padding: '1px 7px', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em' },

  adjustRow: { display: 'flex', alignItems: 'center', gap: 8 },
  adjBtn: { width: 32, height: 32, background: '#1A1A1A', border: '1px solid #333', color: '#D4AF37', borderRadius: 7, cursor: 'pointer', fontSize: 16, fontWeight: 800, fontFamily: 'inherit' },
  onHand: { fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, minWidth: 32, textAlign: 'center' },
  editBtn: { width: 30, height: 30, background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' },

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
