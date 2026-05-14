// ============================================================
// QUEZ APP LITE — End of Day Drink Count Screen
// Employee enters total cups and per-drink counts.
// Auto-sends summary email via EmailJS on submit.
// ============================================================
import React, { useState, useMemo } from 'react';
import { DRINK_LIST_DEFAULT } from '../data/checklistItems';
import { sendDrinkCountEmail } from '../utils/emailService';
import {
  saveDrinkCountRecord,
  loadSettings,
  loadCurrentUser,
} from '../utils/storage';

const EndOfDayCount = () => {
  const settings = loadSettings();
  const lang = settings.language || 'en';
  const user = loadCurrentUser();

  // Build drink list: try menuItems from localStorage (Session 9 will populate),
  // fall back to the default 15-drink list.
  const drinkList = useMemo(() => {
    try {
      const menuItems = JSON.parse(localStorage.getItem('quez_menu_items') || '[]');
      if (menuItems.length > 0) {
        return menuItems.map((d) => ({
          id: d.id || d.name.toLowerCase().replace(/\s/g, '_'),
          name: d.name,
          nameEs: d.nameEs || d.name,
        }));
      }
    } catch {}
    return DRINK_LIST_DEFAULT;
  }, []);

  const [totalCups, setTotalCups] = useState('');
  const [counts, setCounts] = useState(
    Object.fromEntries(drinkList.map((d) => [d.id, '']))
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleCountChange = (id, val) => {
    setCounts((prev) => ({ ...prev, [id]: val }));
  };

  // Calculated total from individual drink counts
  const calculatedTotal = Object.values(counts).reduce(
    (sum, v) => sum + (parseInt(v, 10) || 0),
    0
  );

  const handleSubmit = async () => {
    if (!totalCups || parseInt(totalCups, 10) < 0) {
      setError(lang === 'es' ? 'Ingresa el total de tazas.' : 'Enter total cups served.');
      return;
    }
    setError('');
    setSubmitting(true);

    const now = new Date();
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const drinkCounts = drinkList.map((d) => ({
      name: lang === 'es' ? d.nameEs : d.name,
      count: parseInt(counts[d.id], 10) || 0,
    }));

    const record = {
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
      date,
      submittedAt: now.toISOString(),
      totalCups: parseInt(totalCups, 10),
      drinkCounts,
    };

    saveDrinkCountRecord(record);

    await sendDrinkCountEmail({
      operator: user?.name || 'Unknown',
      location: user?.location || 'Unknown',
      date,
      totalCups: parseInt(totalCups, 10),
      drinkCounts,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Done state ────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="eod-screen eod-screen--done">
        <div className="eod-done-card">
          <div className="eod-done-icon">✓</div>
          <h2 className="eod-done-title">
            {lang === 'es' ? 'Conteo Enviado' : 'Count Submitted'}
          </h2>
          <p className="eod-done-sub">
            {lang === 'es'
              ? 'El resumen del día ha sido enviado al propietario.'
              : 'Daily summary has been sent to the owner.'}
          </p>
          <div className="eod-done-total">
            {parseInt(totalCups, 10)}{' '}
            {lang === 'es' ? 'tazas servidas hoy' : 'cups served today'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eod-screen">
      {/* Header */}
      <div className="eod-header">
        <h1 className="eod-title">
          {lang === 'es' ? 'Conteo de Bebidas del Día' : 'End of Day Drink Count'}
        </h1>
        <div className="eod-meta">
          <span>{user?.name || '—'}</span>
          <span className="eod-meta-sep">·</span>
          <span>{user?.location || '—'}</span>
          <span className="eod-meta-sep">·</span>
          <span>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Total cups — entered by operator */}
      <div className="eod-total-section">
        <label className="eod-total-label">
          {lang === 'es' ? 'Total de tazas servidas hoy' : 'Total cups served today'}
        </label>
        <input
          className="eod-total-input"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="0"
          value={totalCups}
          onChange={(e) => setTotalCups(e.target.value)}
        />
        {calculatedTotal > 0 && (
          <p className="eod-calc-note">
            {lang === 'es'
              ? `Suma de las bebidas: ${calculatedTotal}`
              : `Drink totals sum to: ${calculatedTotal}`}
          </p>
        )}
      </div>

      {/* Per-drink counts */}
      <div className="eod-drinks-section">
        <h2 className="eod-drinks-title">
          {lang === 'es' ? 'Desglose por Bebida' : 'Breakdown by Drink'}
        </h2>
        <p className="eod-drinks-note">
          {lang === 'es'
            ? 'Ingresa 0 o deja en blanco si no se vendió ninguno.'
            : 'Enter 0 or leave blank if none were sold.'}
        </p>
        <div className="eod-drink-list">
          {drinkList.map((drink) => (
            <div key={drink.id} className="eod-drink-row">
              <span className="eod-drink-name">
                {lang === 'es' ? drink.nameEs : drink.name}
              </span>
              <input
                className="eod-drink-input"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={counts[drink.id]}
                onChange={(e) => handleCountChange(drink.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="eod-error">{error}</p>}

      {/* Submit */}
      <div className="eod-submit-wrap">
        <button
          className="eod-submit-btn"
          onClick={handleSubmit}
          disabled={submitting}
          type="button"
        >
          {submitting
            ? (lang === 'es' ? 'Enviando...' : 'Sending...')
            : (lang === 'es' ? 'Enviar Conteo del Día' : 'Submit End of Day Count')}
        </button>
      </div>
    </div>
  );
};

export default EndOfDayCount;
