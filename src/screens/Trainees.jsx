// ============================================================
// QUEZ APP LITE — Trainees.jsx
// Trainer-side overview: see every active trainee and where each one is stuck.
// ============================================================

import React from 'react';
import { useApp } from '../context/AppContext';
import { getActiveTraineesSummary } from '../utils/storage';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Trainees() {
  const { language } = useApp();
  const lang = language || 'en';
  const trainees = getActiveTraineesSummary();

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Trainees Activos' : 'Active Trainees'}</div>
        <div style={S.headerSub}>{lang === 'es' ? 'Progreso y próximos pasos' : 'Progress and next steps'}</div>
      </div>

      <div style={S.body}>
        {trainees.length === 0 ? (
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎓</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Sin trainees' : 'No active trainees'}</div>
            <div style={S.emptyBody}>
              {lang === 'es'
                ? 'Cuando agregues empleados con rol "Trainee" aparecerán aquí.'
                : 'Add employees with the Trainee role and they will appear here.'}
            </div>
          </div>
        ) : (
          trainees.map(({ employee, record, completedPhases }) => {
            const p1 = !!record?.phase1?.passed;
            const p2 = !!record?.phase2?.passed;
            const p3 = !!record?.phase3?.passed;

            let nextStep = '';
            if (!p1) nextStep = lang === 'es' ? 'Iniciar Quiz Fase 1' : 'Start Phase 1 Quiz';
            else if (!p2) nextStep = lang === 'es' ? 'Comenzar Fase 2 — Habilidades' : 'Begin Phase 2 — Hands-On';
            else if (!p3) nextStep = lang === 'es' ? 'Comenzar Fase 3 — Bebidas' : 'Begin Phase 3 — Drinks';
            else nextStep = lang === 'es' ? 'Listo para aprobación' : 'Ready for approval';

            const isReady = p1 && p2 && p3;

            return (
              <div key={employee.id} style={{ ...S.card, ...(isReady ? S.cardReady : {}) }}>
                <div style={S.cardTop}>
                  <div>
                    <div style={S.name}>{employee.name}</div>
                    <div style={S.role}>{lang === 'es' ? 'Trainee' : 'Trainee'}</div>
                  </div>
                  <div style={{ ...S.progressBadge, ...(isReady ? S.progressBadgeReady : {}) }}>
                    {completedPhases} / 3
                  </div>
                </div>

                <div style={S.phaseDots}>
                  {[p1, p2, p3].map((done, i) => (
                    <div key={i} style={{ ...S.dot, ...(done ? S.dotDone : {}) }}>
                      {done ? '✓' : i + 1}
                    </div>
                  ))}
                </div>

                <div style={S.phaseList}>
                  <div style={S.phaseLine}>
                    <span style={{ color: p1 ? '#4CAF50' : '#555' }}>{p1 ? '✓' : '○'}</span>
                    <span>{lang === 'es' ? 'Fase 1 — Quiz' : 'Phase 1 — Quiz'}</span>
                    <span style={S.phaseDate}>{fmtDate(record?.phase1?.date)}</span>
                  </div>
                  <div style={S.phaseLine}>
                    <span style={{ color: p2 ? '#4CAF50' : '#555' }}>{p2 ? '✓' : '○'}</span>
                    <span>{lang === 'es' ? 'Fase 2 — Habilidades' : 'Phase 2 — Skills'}</span>
                    <span style={S.phaseDate}>
                      {p2
                        ? (record.phase2.trainerName
                            ? `${fmtDate(record.phase2.date)} · ${record.phase2.trainerName}`
                            : fmtDate(record.phase2.date))
                        : '—'}
                    </span>
                  </div>
                  <div style={S.phaseLine}>
                    <span style={{ color: p3 ? '#4CAF50' : '#555' }}>{p3 ? '✓' : '○'}</span>
                    <span>{lang === 'es' ? 'Fase 3 — Bebidas' : 'Phase 3 — Drinks'}</span>
                    <span style={S.phaseDate}>
                      {p3
                        ? (record.phase3.trainerName
                            ? `${fmtDate(record.phase3.date)} · ${record.phase3.trainerName}`
                            : fmtDate(record.phase3.date))
                        : '—'}
                    </span>
                  </div>
                </div>

                <div style={S.nextStep}>
                  <span style={S.nextLabel}>{lang === 'es' ? 'Próximo paso' : 'Next step'}</span>
                  <span style={S.nextValue}>{nextStep}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  body: { padding: '14px 16px' },

  card: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardReady: { borderColor: '#4CAF50' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  name: { fontSize: 17, fontWeight: 700, color: '#F5F0E8' },
  role: { fontSize: 12, color: '#888' },
  progressBadge: { background: '#222', color: '#888', fontWeight: 800, fontSize: 13, padding: '5px 11px', borderRadius: 14, border: '1px solid #333' },
  progressBadgeReady: { background: '#4CAF50', color: '#0D0D0D', borderColor: '#4CAF50' },

  phaseDots: { display: 'flex', gap: 6, marginBottom: 12 },
  dot: { flex: 1, height: 30, borderRadius: 8, background: '#1A1A1A', border: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: 12, fontWeight: 700 },
  dotDone: { background: 'rgba(76,175,80,0.18)', borderColor: '#4CAF50', color: '#4CAF50' },

  phaseList: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, background: '#0D0D0D', borderRadius: 8, padding: 10 },
  phaseLine: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#ddd' },
  phaseDate: { marginLeft: 'auto', fontSize: 11, color: '#666' },

  nextStep: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(212,175,55,0.08)', borderRadius: 7, border: '1px solid rgba(212,175,55,0.25)' },
  nextLabel: { fontSize: 10, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 },
  nextValue: { fontSize: 12, color: '#D4AF37', fontWeight: 700 },

  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 14, lineHeight: 1.6 },
};
