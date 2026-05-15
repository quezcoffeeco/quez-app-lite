// ============================================================
// QUEZ APP LITE — Reports.jsx
// Owner/Manager analytics: best-sellers, labor hours, modifier popularity.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getDrinkReportRange, getLaborReportRange, getLaborCostRange, getTodayModifierTally, getSettings, getReportRecipients, logAudit, downloadCsv } from '../utils/storage';
import { getModLabel } from '../data/drinkModifiers';
import { sendQuezEmail } from '../utils/emailjs';

const RANGES = [
  { key: 'today',  label: { en: 'Today',      es: 'Hoy' },     days: 1 },
  { key: 'week',   label: { en: '7 Days',     es: '7 Días' }, days: 7 },
  { key: 'month',  label: { en: '30 Days',    es: '30 Días' }, days: 30 },
];

export default function Reports() {
  const { language, currentUser } = useApp();
  const lang = language || 'en';

  const [range, setRange] = useState('week');
  const days = useMemo(() => RANGES.find((r) => r.key === range)?.days || 7, [range]);

  const [drinkReport, setDrinkReport] = useState({ total: 0, ranked: [] });
  const [laborReport, setLaborReport] = useState({ totalHours: 0, byEmployee: [] });
  const [laborCost, setLaborCost]     = useState({ totalCost: 0, byEmployee: [] });
  const [modTally, setModTally]       = useState({});
  const [emailStatus, setEmailStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'

  useEffect(() => {
    setDrinkReport(getDrinkReportRange(days));
    setLaborReport(getLaborReportRange(days));
    setLaborCost(getLaborCostRange(days));
    setModTally(getTodayModifierTally());
  }, [days, range]);

  const buildEmail = () => {
    const label = RANGES.find((r) => r.key === range)?.label[lang] || range;
    const subject = `[Quez Reports] ${label} — ${drinkReport.total} drinks · ${laborReport.totalHours.toFixed(1)}h labor`;
    const drinkLines = drinkReport.ranked.slice(0, 10).map((d, i) => `  ${i + 1}. ${d.name} — ${d.count}`);
    const laborLines = laborReport.byEmployee.map((row) => `  ${row.name} — ${row.hours.toFixed(1)}h (${row.shifts} shifts)`);
    const modLines = Object.entries(modTally).sort((a, b) => b[1] - a[1]).map(([id, n]) => `  ${getModLabel(id, 'en')} — ${n}`);
    const body =
      `Quez Coffee Co. — Operational Report (${label})\n` +
      `Generated: ${new Date().toLocaleString()}\n\n` +
      `═══ DRINKS SERVED ═══\nTotal: ${drinkReport.total}\n\nTop sellers:\n${drinkLines.join('\n') || '  (no data)'}\n\n` +
      `═══ LABOR HOURS ═══\nTotal: ${laborReport.totalHours.toFixed(1)}h across ${laborReport.byEmployee.length} employee${laborReport.byEmployee.length !== 1 ? 's' : ''}\n\nBy employee:\n${laborLines.join('\n') || '  (no completed shifts)'}\n\n` +
      `═══ CUSTOMIZATIONS (today) ═══\n${modLines.join('\n') || '  (none logged today)'}\n\n` +
      `QUEZ COFFEE CO. LLC · Council Bluffs, Iowa · Veteran Owned & Operated`;
    return { subject, body };
  };

  const handleSendReport = async () => {
    setEmailStatus('sending');
    const settings = getSettings();
    const recipients = getReportRecipients();
    const { subject, body } = buildEmail();
    try {
      // Fan-out: send to every configured recipient
      for (const to of recipients) {
        await sendQuezEmail({
          subject,
          templateParams: {
            to_email: to,
            subject, message: body,
            operator: currentUser?.name || 'Reports',
            location: settings?.locations?.[0] || 'Quez Coffee Co.',
            timestamp: new Date().toISOString(),
          },
        });
      }
      setEmailStatus('sent');
      logAudit('report_emailed', { range, recipients: recipients.length, by: currentUser?.name });
    } catch (e) {
      console.warn('Report email failed:', e);
      setEmailStatus('error');
    }
    setTimeout(() => setEmailStatus(''), 3500);
  };

  const exportDrinksCsv = () => {
    if (drinkReport.ranked.length === 0) return;
    const rows = drinkReport.ranked.map((d, i) => ({
      rank: i + 1, drink: d.name, total: d.count,
      sizes: Object.entries(d.sizes).map(([s,c]) => `${s}:${c}`).join(' '),
      preps: Object.entries(d.preps).map(([p,c]) => `${p}:${c}`).join(' '),
      mods:  Object.entries(d.mods ).map(([m,c]) => `${m}:${c}`).join(' '),
    }));
    downloadCsv(`drink-report-${range}-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  const exportLaborCsv = () => {
    const rows = laborCost.byEmployee.map((row) => ({
      employee: row.name,
      hours: row.hours,
      wagePerHour: row.wage,
      cost: row.cost,
    }));
    if (rows.length === 0) return;
    rows.push({ employee: 'TOTAL', hours: laborReport.totalHours, wagePerHour: '', cost: laborCost.totalCost });
    downloadCsv(`labor-report-${range}-${new Date().toISOString().slice(0,10)}.csv`, rows);
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Reportes' : 'Reports'}</div>
        <div style={S.headerSub}>{lang === 'es' ? 'Tendencias operativas' : 'Operational trends'}</div>
      </div>

      <div style={S.rangePicker}>
        {RANGES.map((r) => (
          <button
            key={r.key}
            style={{ ...S.rangeBtn, ...(range === r.key ? S.rangeBtnActive : {}) }}
            onClick={() => setRange(r.key)}
          >
            {r.label[lang]}
          </button>
        ))}
      </div>

      <div style={S.body}>
        {/* Send Report button + status */}
        <button
          style={{ ...S.sendBtn, ...(emailStatus === 'sending' ? { opacity: 0.6, cursor: 'wait' } : {}) }}
          onClick={handleSendReport}
          disabled={emailStatus === 'sending'}
        >
          {emailStatus === 'sending'
            ? (lang === 'es' ? 'Enviando...' : 'Sending...')
            : emailStatus === 'sent'
            ? (lang === 'es' ? '✓ Reporte enviado' : '✓ Report sent')
            : emailStatus === 'error'
            ? (lang === 'es' ? '✗ Error — toca para reintentar' : '✗ Failed — tap to retry')
            : (lang === 'es' ? '✉ Enviar Reporte por Correo' : '✉ Email This Report')}
        </button>

        {/* Drink summary */}
        <div style={S.card}>
          <div style={S.cardLabel}>{lang === 'es' ? 'Bebidas Servidas' : 'Drinks Served'}</div>
          <div style={S.bigStat}>{drinkReport.total}</div>
          <div style={S.bigStatSub}>
            {lang === 'es' ? `en los últimos ${days} día${days !== 1 ? 's' : ''}` : `over last ${days} day${days !== 1 ? 's' : ''}`}
          </div>

          {drinkReport.ranked.length === 0 ? (
            <div style={S.emptyText}>{lang === 'es' ? 'Sin datos en este rango.' : 'No data in this range.'}</div>
          ) : (
            <>
              <div style={S.list}>
                <div style={S.listSubLabel}>{lang === 'es' ? 'Más vendidas' : 'Best-sellers'}</div>
                {drinkReport.ranked.slice(0, 10).map((d, i) => {
                  const pct = drinkReport.total > 0 ? (d.count / drinkReport.total) * 100 : 0;
                  return (
                    <div key={d.name} style={S.rankRow}>
                      <span style={S.rankNum}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={S.rankName}>{d.name}</div>
                        <div style={S.rankBar}>
                          <div style={{ ...S.rankBarFill, width: `${pct}%` }} />
                        </div>
                      </div>
                      <span style={S.rankCount}>{d.count}</span>
                    </div>
                  );
                })}
              </div>
              <button style={S.csvBtn} onClick={exportDrinksCsv}>
                ⬇ {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}
              </button>
            </>
          )}
        </div>

        {/* Labor hours */}
        <div style={S.card}>
          <div style={S.cardLabel}>{lang === 'es' ? 'Horas Laborales' : 'Labor Hours'}</div>
          <div style={S.bigStat}>{laborReport.totalHours.toFixed(1)}h</div>
          <div style={S.bigStatSub}>
            {lang === 'es' ? `de ${laborReport.byEmployee.length} empleado${laborReport.byEmployee.length !== 1 ? 's' : ''}` : `from ${laborReport.byEmployee.length} employee${laborReport.byEmployee.length !== 1 ? 's' : ''}`}
          </div>

          {laborReport.byEmployee.length === 0 ? (
            <div style={S.emptyText}>{lang === 'es' ? 'Sin registros completos.' : 'No completed shifts.'}</div>
          ) : (
            <>
              <div style={S.list}>
                <div style={S.listSubLabel}>{lang === 'es' ? 'Por empleado' : 'By employee'}</div>
                {laborReport.byEmployee.map((row) => {
                  const pct = laborReport.totalHours > 0 ? (row.hours / laborReport.totalHours) * 100 : 0;
                  // Find matching cost row
                  const costRow = laborCost.byEmployee.find((c) => c.name === row.name);
                  return (
                    <div key={row.name} style={S.rankRow}>
                      <span style={S.rankNum}>·</span>
                      <div style={{ flex: 1 }}>
                        <div style={S.rankName}>
                          {row.name} <span style={S.shiftPill}>{row.shifts} {lang === 'es' ? 'turnos' : 'shifts'}</span>
                          {costRow && costRow.cost > 0 && (
                            <span style={{ ...S.shiftPill, color: '#D4AF37', marginLeft: 4 }}>${costRow.cost.toFixed(2)}</span>
                          )}
                        </div>
                        <div style={S.rankBar}>
                          <div style={{ ...S.rankBarFill, background: '#7BB3F0', width: `${pct}%` }} />
                        </div>
                      </div>
                      <span style={S.rankCount}>{row.hours.toFixed(1)}h</span>
                    </div>
                  );
                })}
              </div>
              {laborCost.totalCost > 0 && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(212,175,55,0.06)', borderRadius: 6, fontSize: 12, color: '#D4AF37', fontWeight: 700, textAlign: 'right' }}>
                  {lang === 'es' ? 'Costo total laboral:' : 'Total labor cost:'} ${laborCost.totalCost.toFixed(2)}
                </div>
              )}
              <button style={S.csvBtn} onClick={exportLaborCsv}>
                ⬇ {lang === 'es' ? 'Exportar CSV' : 'Export CSV'}
              </button>
            </>
          )}
        </div>

        {/* Modifier popularity (today only) */}
        <div style={S.card}>
          <div style={S.cardLabel}>{lang === 'es' ? 'Personalizaciones (hoy)' : 'Customizations (today)'}</div>
          {Object.keys(modTally).length === 0 ? (
            <div style={S.emptyText}>{lang === 'es' ? 'Sin personalizaciones registradas hoy.' : 'No modifiers logged today.'}</div>
          ) : (
            <div style={S.modList}>
              {Object.entries(modTally)
                .sort((a, b) => b[1] - a[1])
                .map(([id, count]) => (
                  <div key={id} style={S.modRow}>
                    <span style={S.modName}>{getModLabel(id, lang)}</span>
                    <span style={S.modCount}>{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center' },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  rangePicker: { display: 'flex', gap: 4, padding: 12, background: '#111', borderBottom: '1px solid #222' },
  rangeBtn: { flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#888', borderRadius: 8, padding: '9px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  rangeBtnActive: { background: 'rgba(212,175,55,0.14)', border: '1px solid #D4AF37', color: '#D4AF37' },

  body: { padding: '14px 16px' },
  sendBtn: { width: '100%', background: 'linear-gradient(180deg, #E6C661, #D4AF37)', color: '#0D0D0D', border: 'none', borderRadius: 11, padding: '13px', fontWeight: 800, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 14, fontFamily: 'inherit' },
  csvBtn: { width: '100%', marginTop: 10, background: 'transparent', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37', borderRadius: 8, padding: '9px', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit' },
  card: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 14 },
  cardLabel: { fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 10 },
  bigStat: { fontSize: 42, fontFamily: 'Georgia, serif', color: '#D4AF37', fontWeight: 700, lineHeight: 1 },
  bigStatSub: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#555', padding: '8px 0', fontStyle: 'italic' },

  list: { marginTop: 6 },
  listSubLabel: { fontSize: 10, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 },
  rankRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' },
  rankNum: { width: 18, color: '#666', fontSize: 12, fontWeight: 700, textAlign: 'center' },
  rankName: { fontSize: 13, color: '#F5F0E8', fontWeight: 600 },
  rankBar: { width: '100%', height: 4, background: '#222', borderRadius: 2, marginTop: 4, overflow: 'hidden' },
  rankBarFill: { height: '100%', background: '#D4AF37', borderRadius: 2, transition: 'width 0.3s ease' },
  rankCount: { fontSize: 13, color: '#D4AF37', fontWeight: 800, minWidth: 36, textAlign: 'right' },
  shiftPill: { fontSize: 10, background: '#222', color: '#888', padding: '2px 6px', borderRadius: 4, marginLeft: 6, fontWeight: 500 },

  modList: { display: 'flex', flexDirection: 'column', gap: 4 },
  modRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #1a1a1a' },
  modName: { fontSize: 13, color: '#ddd' },
  modCount: { fontSize: 13, color: '#D4AF37', fontWeight: 700 },
};
