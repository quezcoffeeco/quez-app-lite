// ============================================================
// QUEZ APP LITE — TrainingPortal.jsx
// Session 7: Phase 1 Content + 15-Question Quiz
// Phase 2 & 3 stubs ready for Session 8
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  getTrainingRecord,
  markPhase1Complete,
  setQuizLockout,
  getQuizLockoutInfo,
  applyTrainingBypassIfEnabled,
} from '../utils/storage';
import { getEmployees } from '../utils/storage';
import { sendQuezEmail } from '../utils/emailjs';
import { PHASE1_SECTIONS, QUIZ_QUESTIONS } from '../data/trainingContent';

// ── Shuffle helper ─────────────────────────────────────────
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Styles ─────────────────────────────────────────────────
const S = {
  screen: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#0D0D0D', overflow: 'hidden',
  },
  header: {
    padding: '18px 20px 14px',
    borderBottom: '1px solid rgba(212,175,55,0.2)',
    background: '#0D0D0D',
    flexShrink: 0,
  },
  headerTop: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Georgia, serif', fontSize: 22, color: '#D4AF37',
    letterSpacing: '0.02em',
  },
  headerSub: {
    fontSize: 11, color: '#666', marginTop: 3,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  body: {
    flex: 1, overflowY: 'auto', padding: '16px 16px 40px',
    WebkitOverflowScrolling: 'touch',
  },

  // Phase progress bar
  phaseBar: {
    display: 'flex', gap: 8, padding: '14px 16px 12px',
    background: '#0D0D0D', borderBottom: '1px solid rgba(212,175,55,0.1)',
    flexShrink: 0,
  },
  phaseStep: (active, done) => ({
    flex: 1, padding: '10px 6px', borderRadius: 10, textAlign: 'center',
    background: done ? 'rgba(212,175,55,0.15)' : active ? '#1A1A1A' : 'transparent',
    border: done ? '1px solid rgba(212,175,55,0.5)' : active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.07)',
    transition: 'all 0.2s',
    cursor: active || done ? 'pointer' : 'default',
  }),
  phaseStepNum: (active, done) => ({
    fontSize: 18, display: 'block', marginBottom: 2,
    filter: done ? 'none' : active ? 'none' : 'grayscale(1) opacity(0.4)',
  }),
  phaseStepLabel: (active, done) => ({
    fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase',
    color: done ? '#D4AF37' : active ? '#F5F0E8' : '#444',
    fontWeight: done || active ? 700 : 400,
  }),
  phaseStepStatus: (active, done) => ({
    fontSize: 9, color: done ? '#7BB37B' : active ? '#D4AF37' : '#333',
    marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em',
  }),

  // Section cards
  sectionCard: {
    background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.12)',
    borderRadius: 14, marginBottom: 10, overflow: 'hidden',
  },
  sectionBtn: {
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    textAlign: 'left',
  },
  sectionIcon: { fontSize: 20, flexShrink: 0 },
  sectionTitle: {
    flex: 1, fontFamily: 'Georgia, serif', fontSize: 15, color: '#F5F0E8',
  },
  urgentBadge: {
    fontSize: 9, fontWeight: 800, letterSpacing: '0.07em',
    textTransform: 'uppercase', color: '#C84B4B',
    background: 'rgba(200,75,75,0.12)', border: '1px solid rgba(200,75,75,0.3)',
    borderRadius: 4, padding: '2px 6px',
  },
  sectionBody: { padding: '4px 16px 20px' },
  contentBlock: {
    marginBottom: 18, paddingBottom: 18,
    borderBottom: '1px solid rgba(212,175,55,0.08)',
  },
  contentHeading: {
    fontFamily: 'Georgia, serif', fontSize: 14, color: '#D4AF37',
    marginBottom: 8, letterSpacing: '0.02em',
  },
  contentBody: {
    fontSize: 14, lineHeight: 1.7, color: '#C8C0B0',
  },

  // Quiz
  quizWrap: { padding: '0 0 20px' },
  quizHeader: {
    background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 14, padding: '18px 16px', marginBottom: 16,
  },
  quizTitle: {
    fontFamily: 'Georgia, serif', fontSize: 18, color: '#D4AF37',
    marginBottom: 6,
  },
  quizMeta: { fontSize: 13, color: '#888', lineHeight: 1.5 },
  quizProgress: {
    display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 0',
  },
  quizProgressBar: {
    flex: 1, height: 4, background: '#2A2A2A', borderRadius: 2, overflow: 'hidden',
  },
  quizProgressFill: (pct) => ({
    height: '100%', width: `${pct}%`,
    background: 'linear-gradient(90deg, #D4AF37, #F0CC60)',
    transition: 'width 0.3s ease', borderRadius: 2,
  }),

  // Question card
  questionCard: {
    background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: 14, padding: '18px 16px', marginBottom: 12,
  },
  questionNum: {
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase', color: '#D4AF37', marginBottom: 8,
  },
  questionText: {
    fontFamily: 'Georgia, serif', fontSize: 15, color: '#F5F0E8',
    lineHeight: 1.5, marginBottom: 16,
  },
  optionBtn: (state) => ({
    width: '100%', display: 'block', textAlign: 'left',
    padding: '12px 14px', marginBottom: 8, borderRadius: 10,
    border: state === 'correct' ? '1.5px solid #7BB37B' :
            state === 'wrong' ? '1.5px solid #C84B4B' :
            state === 'selected' ? '1.5px solid #D4AF37' :
            '1px solid rgba(255,255,255,0.08)',
    background: state === 'correct' ? 'rgba(123,179,123,0.1)' :
                state === 'wrong' ? 'rgba(200,75,75,0.1)' :
                state === 'selected' ? 'rgba(212,175,55,0.08)' : '#2A2A2A',
    color: state === 'correct' ? '#7BB37B' :
           state === 'wrong' ? '#C84B4B' :
           state === 'selected' ? '#D4AF37' : '#C8C0B0',
    fontSize: 14, lineHeight: 1.4, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
  }),

  // Results
  resultCard: (passed) => ({
    background: passed ? 'rgba(123,179,123,0.07)' : 'rgba(200,75,75,0.07)',
    border: `1.5px solid ${passed ? '#7BB37B' : '#C84B4B'}`,
    borderRadius: 16, padding: '24px 20px', marginBottom: 16, textAlign: 'center',
  }),
  resultIcon: { fontSize: 48, display: 'block', marginBottom: 12 },
  resultTitle: (passed) => ({
    fontFamily: 'Georgia, serif', fontSize: 22,
    color: passed ? '#7BB37B' : '#C84B4B', marginBottom: 8,
  }),
  resultScore: {
    fontFamily: 'Georgia, serif', fontSize: 36, color: '#D4AF37',
    marginBottom: 4,
  },
  resultSub: { fontSize: 13, color: '#888', lineHeight: 1.5 },
  wrongAnswerCard: {
    background: '#1A1A1A', border: '1px solid rgba(200,75,75,0.25)',
    borderRadius: 12, padding: '14px 14px', marginBottom: 8,
  },
  wrongQ: { fontSize: 13, color: '#F5F0E8', marginBottom: 6, lineHeight: 1.4 },
  wrongCorrect: { fontSize: 12, color: '#7BB37B', lineHeight: 1.4 },

  // Buttons
  btn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: 'none', borderRadius: 10, fontFamily: 'Georgia, serif',
    fontSize: 14, letterSpacing: '0.04em', cursor: 'pointer',
    padding: '14px 20px', textTransform: 'uppercase', transition: 'all 0.15s',
  },
  btnGold: { background: '#D4AF37', color: '#0D0D0D', fontWeight: 700 },
  btnGhost: {
    background: 'transparent', border: '1px solid rgba(212,175,55,0.3)',
    color: '#F5F0E8',
  },
  btnBlock: { width: '100%', marginTop: 12 },

  // Locked / bypass / complete states
  lockedBox: {
    background: '#1A1A1A', border: '1px solid rgba(200,75,75,0.3)',
    borderRadius: 14, padding: '20px 16px', textAlign: 'center',
  },
  completeBox: {
    background: 'rgba(123,179,123,0.07)', border: '1px solid rgba(123,179,123,0.3)',
    borderRadius: 14, padding: '20px 16px', textAlign: 'center',
    marginBottom: 12,
  },
  bypassBox: {
    background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 14, padding: '20px 16px', textAlign: 'center',
    marginBottom: 12,
  },
  stubBox: {
    background: '#111', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '24px 16px', textAlign: 'center',
  },
};

// ── Phase Step Component ───────────────────────────────────
function PhaseStep({ num, emoji, label, status, active, done, onClick }) {
  return (
    <div style={S.phaseStep(active, done)} onClick={onClick}>
      <span style={S.phaseStepNum(active, done)}>{emoji}</span>
      <span style={S.phaseStepLabel(active, done)}>Phase {num}</span>
      <div style={S.phaseStepStatus(active, done)}>{status}</div>
    </div>
  );
}

// ── Content Section ────────────────────────────────────────
function ContentSection({ section, lang, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div style={S.sectionCard}>
      <button style={S.sectionBtn} onClick={() => setOpen(o => !o)} type="button">
        <span style={S.sectionIcon}>{section.icon}</span>
        <span style={S.sectionTitle}>{section.title[lang]}</span>
        {section.urgent && <span style={S.urgentBadge}>Required</span>}
        <span style={{ color: '#555', fontSize: 18 }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div style={S.sectionBody}>
          {section.content.map((block, i) => (
            <div key={i} style={{
              ...S.contentBlock,
              ...(i === section.content.length - 1 ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}),
            }}>
              <div style={S.contentHeading}>{block.heading[lang]}</div>
              <div style={S.contentBody}>{block.body[lang]}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quiz Engine ────────────────────────────────────────────
function Quiz({ employeeId, lang, onPassed, onFailed }) {
  const [shuffledQ, setShuffledQ] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: selectedIndex }
  const [revealed, setRevealed] = useState({}); // { qId: true } after selecting
  const [phase, setPhase] = useState('questions'); // 'questions' | 'results'
  const [results, setResults] = useState(null);

  useEffect(() => {
    setShuffledQ(shuffleArray(QUIZ_QUESTIONS));
  }, []);

  function handleSelect(qId, optionIdx) {
    if (revealed[qId]) return; // already answered
    setAnswers(prev => ({ ...prev, [qId]: optionIdx }));
    setRevealed(prev => ({ ...prev, [qId]: true }));
  }

  function handleNext() {
    if (current < shuffledQ.length - 1) {
      setCurrent(c => c + 1);
    } else {
      submitQuiz();
    }
  }

  function submitQuiz() {
    let correct = 0;
    const wrong = [];
    shuffledQ.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct++;
      } else {
        wrong.push(q);
      }
    });
    const score = correct;
    const total = shuffledQ.length;
    const pct = Math.round((score / total) * 100);
    const passed = pct >= 80;
    setResults({ score, total, pct, passed, wrong });
    setPhase('results');
    if (passed) {
      onPassed();
    } else {
      onFailed();
    }
  }

  if (!shuffledQ.length) return null;

  if (phase === 'results' && results) {
    return (
      <div style={S.quizWrap}>
        <div style={S.resultCard(results.passed)}>
          <span style={S.resultIcon}>{results.passed ? '🎖️' : '📚'}</span>
          <div style={S.resultTitle(results.passed)}>
            {results.passed
              ? (lang === 'es' ? '¡Aprobado!' : 'Quiz Passed!')
              : (lang === 'es' ? 'No Aprobado' : 'Not Passed')}
          </div>
          <div style={S.resultScore}>{results.score}/{results.total}</div>
          <div style={S.resultSub}>
            {results.pct}% — {lang === 'es' ? 'Se requiere 80% para aprobar' : '80% required to pass'}
          </div>
          {!results.passed && (
            <div style={{ fontSize: 12, color: '#C84B4B', marginTop: 8 }}>
              {lang === 'es'
                ? 'Reintento disponible en 24 horas. Revisa el material de Phase 1.'
                : 'Retry available in 24 hours. Review the Phase 1 material.'}
            </div>
          )}
        </div>

        {!results.passed && results.wrong.length > 0 && (
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#888', marginBottom: 12,
            }}>
              {lang === 'es' ? 'Respuestas Incorrectas' : 'Incorrect Answers'}
            </div>
            {results.wrong.map(q => (
              <div key={q.id} style={S.wrongAnswerCard}>
                <div style={S.wrongQ}>
                  ✗ {q.question[lang]}
                </div>
                <div style={S.wrongCorrect}>
                  ✓ {q.explanation[lang]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Questions phase
  const q = shuffledQ[current];
  const answered = revealed[q.id];
  const selected = answers[q.id];
  const pct = Math.round((current / shuffledQ.length) * 100);

  function getOptionState(idx) {
    if (!answered) return 'default';
    if (idx === q.correctIndex) return 'correct';
    if (idx === selected && idx !== q.correctIndex) return 'wrong';
    return 'default';
  }

  return (
    <div style={S.quizWrap}>
      <div style={S.quizHeader}>
        <div style={S.quizTitle}>
          {lang === 'es' ? 'Examen — Fase 1' : 'Phase 1 Quiz'}
        </div>
        <div style={S.quizMeta}>
          {lang === 'es'
            ? '15 preguntas · 80% para aprobar · Reintento en 24 horas si no apruebas'
            : '15 questions · 80% to pass · 24-hour retry lockout if you don\'t pass'}
        </div>
        <div style={S.quizProgress}>
          <div style={S.quizProgressBar}>
            <div style={S.quizProgressFill(pct)} />
          </div>
          <span style={{ fontSize: 12, color: '#888', flexShrink: 0 }}>
            {current + 1}/{shuffledQ.length}
          </span>
        </div>
      </div>

      <div style={S.questionCard}>
        <div style={S.questionNum}>
          {lang === 'es' ? `Pregunta ${current + 1}` : `Question ${current + 1}`}
        </div>
        <div style={S.questionText}>{q.question[lang]}</div>

        {q.options[lang].map((opt, idx) => (
          <button
            key={idx}
            style={S.optionBtn(getOptionState(idx))}
            onClick={() => handleSelect(q.id, idx)}
            type="button"
          >
            <span style={{ opacity: 0.5, marginRight: 8 }}>
              {['A', 'B', 'C', 'D'][idx]}.
            </span>
            {opt}
          </button>
        ))}

        {answered && (
          <div style={{
            marginTop: 8, padding: '10px 12px', borderRadius: 8,
            background: selected === q.correctIndex
              ? 'rgba(123,179,123,0.08)' : 'rgba(200,75,75,0.08)',
            fontSize: 12, lineHeight: 1.5,
            color: selected === q.correctIndex ? '#7BB37B' : '#C84B4B',
          }}>
            {q.explanation[lang]}
          </div>
        )}
      </div>

      {answered && (
        <button
          style={{ ...S.btn, ...S.btnGold, ...S.btnBlock }}
          onClick={handleNext}
          type="button"
        >
          {current < shuffledQ.length - 1
            ? (lang === 'es' ? 'Siguiente Pregunta →' : 'Next Question →')
            : (lang === 'es' ? 'Ver Resultados' : 'See Results')}
        </button>
      )}
    </div>
  );
}

// ── Main Portal ────────────────────────────────────────────
export default function TrainingPortal() {
  const { session, language } = useApp();
  const lang = language || 'en';
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'quiz'
  const [activePhase, setActivePhase] = useState(1);
  const [trainingRecord, setTrainingRecord] = useState(null);
  const [lockoutInfo, setLockoutInfo] = useState({ isLocked: false });
  const [quizKey, setQuizKey] = useState(0); // force quiz remount on retry
  const [phase1JustPassed, setPhase1JustPassed] = useState(false);
  const employee = useCallback(() => {
    if (!session) return null;
    const emps = getEmployees();
    return emps.find(e => e.id === session.id) || null;
  }, [session]);

  // Load and refresh training state
  const refreshState = useCallback(() => {
    if (!session) return;
    const emp = employee();
    if (emp) applyTrainingBypassIfEnabled(emp);
    const record = getTrainingRecord(session.id);
    setTrainingRecord(record);
    setLockoutInfo(getQuizLockoutInfo(session.id));
  }, [session, employee]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  if (!session || !trainingRecord) return null;

  const emp = employee();
  const isBypassed = emp?.trainingBypass === true;
  const phase1Done = trainingRecord.phase1.passed;
  const phase2Done = trainingRecord.phase2.passed;
  const phase3Done = trainingRecord.phase3.passed;
  const allDone = phase1Done && phase2Done && phase3Done;

  // Send owner notification email when phase 1 passes
  function handleQuizPassed() {
    markPhase1Complete(session.id);
    setPhase1JustPassed(true);
    sendQuezEmail({
      subject: `[Quez Training] Phase 1 Complete — ${session.name}`,
      templateParams: {
        event_type: 'Training Phase 1 Complete',
        employee_name: session.name,
        location: session.location || 'Council Bluffs — Main',
        date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        message: `TRAINING PHASE 1 COMPLETE\n═══════════════════════════════\nEmployee: ${session.name}\nRole: ${session.role}\nDate: ${new Date().toLocaleDateString('en-US')}\nResult: Phase 1 Quiz PASSED\n\nThis employee is ready to begin Phase 2 supervised equipment training.\n═══════════════════════════════\nQuez Coffee Co. — Auto-Generated`,
      },
    });
    refreshState();
  }

  function handleQuizFailed() {
    setQuizLockout(session.id);
    refreshState();
  }

  // ── Render Phase 1 content ─────────────────────────────
  function renderPhase1() {
    if (isBypassed && !phase1Done) {
      // shouldn't happen since bypass applies on mount, but safety fallback
      return (
        <div style={S.bypassBox}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#D4AF37', marginBottom: 6 }}>
            {lang === 'es' ? 'Entrenamiento Omitido' : 'Training Bypassed'}
          </div>
          <div style={{ fontSize: 13, color: '#888' }}>
            {lang === 'es' ? 'El propietario ha activado la omisión de entrenamiento.' : 'Owner has enabled training bypass for your account.'}
          </div>
        </div>
      );
    }

    if (phase1Done) {
      return (
        <div>
          <div style={S.completeBox}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎖️</div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#7BB37B', marginBottom: 6 }}>
              {lang === 'es' ? 'Fase 1 Completada' : 'Phase 1 Complete'}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {lang === 'es'
                ? `Completado el ${new Date(trainingRecord.phase1.date).toLocaleDateString('es-MX')}`
                : `Completed ${new Date(trainingRecord.phase1.date).toLocaleDateString('en-US')}`}
              {trainingRecord.phase1.bypassed && (
                <span style={{ color: '#C88B4B', marginLeft: 6 }}>· Bypassed by owner</span>
              )}
            </div>
            {phase1JustPassed && (
              <div style={{ fontSize: 12, color: '#7BB37B', marginTop: 8 }}>
                {lang === 'es' ? '✓ Propietario notificado' : '✓ Owner notified by email'}
              </div>
            )}
          </div>
          {/* Still allow reviewing material even after passing */}
          <div style={{ fontSize: 12, color: '#555', textAlign: 'center', marginBottom: 16 }}>
            {lang === 'es' ? 'Puedes seguir revisando el material abajo.' : 'You can still review the material below.'}
          </div>
          {renderContentSections()}
        </div>
      );
    }

    return (
      <div>
        {activeTab === 'content' && (
          <div>
            <div style={{
              background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: 12, padding: '14px 14px', marginBottom: 16,
              fontSize: 13, lineHeight: 1.6, color: '#9A9080',
            }}>
              {lang === 'es'
                ? 'Lee todo el material antes de tomar el examen. El examen tiene 15 preguntas y requiere 80% para aprobar. Si no apruebas, hay un bloqueo de 24 horas antes de reintentar.'
                : 'Read all material before taking the quiz. The quiz has 15 questions and requires 80% to pass. If you don\'t pass, there is a 24-hour lockout before you can retry.'}
            </div>
            {renderContentSections()}
            <button
              style={{ ...S.btn, ...S.btnGold, ...S.btnBlock }}
              onClick={() => setActiveTab('quiz')}
              type="button"
            >
              {lang === 'es' ? 'Comenzar Examen →' : 'Take the Quiz →'}
            </button>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div>
            <button
              style={{ ...S.btn, ...S.btnGhost, marginBottom: 16 }}
              onClick={() => setActiveTab('content')}
              type="button"
            >
              ← {lang === 'es' ? 'Volver al Material' : 'Back to Material'}
            </button>

            {lockoutInfo.isLocked ? (
              <div style={S.lockedBox}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
                <div style={{
                  fontFamily: 'Georgia, serif', fontSize: 16, color: '#C84B4B', marginBottom: 8,
                }}>
                  {lang === 'es' ? 'Reintento Bloqueado' : 'Retry Locked'}
                </div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
                  {lang === 'es'
                    ? `Vuelve a intentarlo en ${lockoutInfo.remainingHours}h ${lockoutInfo.remainingMinutes}m. Usa este tiempo para revisar el material.`
                    : `Try again in ${lockoutInfo.remainingHours}h ${lockoutInfo.remainingMinutes}m. Use this time to review the material.`}
                </div>
              </div>
            ) : (
              <Quiz
                key={quizKey}
                employeeId={session.id}
                lang={lang}
                onPassed={handleQuizPassed}
                onFailed={() => { handleQuizFailed(); setQuizKey(k => k + 1); }}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  function renderContentSections() {
    return PHASE1_SECTIONS.map((section, i) => (
      <ContentSection
        key={section.id}
        section={section}
        lang={lang}
        defaultOpen={i === 0}
      />
    ));
  }

  function renderPhase2() {
    if (phase2Done) {
      return (
        <div style={S.completeBox}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎖️</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#7BB37B', marginBottom: 6 }}>
            {lang === 'es' ? 'Fase 2 Completada' : 'Phase 2 Complete'}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {lang === 'es' ? 'Entrenador:' : 'Trainer:'} {trainingRecord.phase2.trainerName || '—'} ·{' '}
            {trainingRecord.phase2.date ? new Date(trainingRecord.phase2.date).toLocaleDateString('en-US') : ''}
          </div>
        </div>
      );
    }
    if (!phase1Done) {
      return (
        <div style={{ ...S.stubBox, paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#555', marginBottom: 6 }}>
            {lang === 'es' ? 'Completa la Fase 1 primero' : 'Complete Phase 1 First'}
          </div>
          <div style={{ fontSize: 12, color: '#3A3A3A' }}>
            {lang === 'es'
              ? 'La Fase 2 se desbloquea después de aprobar el examen de la Fase 1.'
              : 'Phase 2 unlocks after passing the Phase 1 quiz.'}
          </div>
        </div>
      );
    }
    return (
      <div style={S.stubBox}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🛠️</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#D4AF37', marginBottom: 8 }}>
          {lang === 'es' ? 'Entrenamiento Práctico Supervisado' : 'Supervised Hands-On Training'}
        </div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
          {lang === 'es'
            ? 'La Fase 2 es completada con un entrenador. Pídele a tu gerente o propietario que inicie la sesión de Fase 2.'
            : 'Phase 2 is completed with a trainer. Ask your manager or owner to start your Phase 2 session.'}
        </div>
        <div style={{
          marginTop: 16, padding: '10px 14px', background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10,
          fontSize: 12, color: '#D4AF37',
        }}>
          {lang === 'es' ? '↑ Disponible en la Sesión 8' : '↑ Available in Session 8'}
        </div>
      </div>
    );
  }

  function renderPhase3() {
    if (phase3Done) {
      return (
        <div style={S.completeBox}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎖️</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#7BB37B', marginBottom: 6 }}>
            {lang === 'es' ? 'Fase 3 Completada' : 'Phase 3 Complete'}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            {lang === 'es' ? 'Entrenador:' : 'Trainer:'} {trainingRecord.phase3.trainerName || '—'} ·{' '}
            {trainingRecord.phase3.date ? new Date(trainingRecord.phase3.date).toLocaleDateString('en-US') : ''}
          </div>
        </div>
      );
    }
    if (!phase2Done) {
      return (
        <div style={{ ...S.stubBox, paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#555', marginBottom: 6 }}>
            {lang === 'es' ? 'Completa la Fase 2 primero' : 'Complete Phase 2 First'}
          </div>
          <div style={{ fontSize: 12, color: '#3A3A3A' }}>
            {lang === 'es'
              ? 'La Fase 3 se desbloquea después de completar la Fase 2.'
              : 'Phase 3 unlocks after completing Phase 2.'}
          </div>
        </div>
      );
    }
    return (
      <div style={S.stubBox}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: 15, color: '#D4AF37', marginBottom: 8 }}>
          {lang === 'es' ? 'Lista Diaria en Vivo Supervisada' : 'Supervised Live Daily Checklist'}
        </div>
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
          {lang === 'es'
            ? 'Completa una lista diaria real con supervisión directa del entrenador.'
            : 'Complete a real daily checklist under direct trainer supervision.'}
        </div>
        <div style={{
          marginTop: 16, padding: '10px 14px', background: 'rgba(212,175,55,0.06)',
          border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10,
          fontSize: 12, color: '#D4AF37',
        }}>
          {lang === 'es' ? '↑ Disponible en la Sesión 8' : '↑ Available in Session 8'}
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.headerTitle}>
            {lang === 'es' ? 'Portal de Entrenamiento' : 'Training Portal'}
          </div>
          {allDone && (
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: '#7BB37B',
              background: 'rgba(123,179,123,0.1)', border: '1px solid rgba(123,179,123,0.3)',
              borderRadius: 6, padding: '3px 8px',
            }}>
              {lang === 'es' ? '✓ Completo' : '✓ Complete'}
            </div>
          )}
        </div>
        <div style={S.headerSub}>
          {lang === 'es' ? `Hola, ${session.name}` : `Welcome, ${session.name}`}
        </div>
      </div>

      {/* Phase Progress Bar */}
      <div style={S.phaseBar}>
        <PhaseStep
          num={1} emoji="📖"
          label={lang === 'es' ? 'Orientación' : 'Orientation'}
          status={phase1Done ? (lang === 'es' ? 'Completado' : 'Complete') : (lang === 'es' ? 'En Progreso' : 'In Progress')}
          active={activePhase === 1} done={phase1Done}
          onClick={() => setActivePhase(1)}
        />
        <PhaseStep
          num={2} emoji="🛠️"
          label={lang === 'es' ? 'Equipo' : 'Equipment'}
          status={phase2Done ? (lang === 'es' ? 'Completado' : 'Complete') : (phase1Done ? (lang === 'es' ? 'Desbloqueado' : 'Unlocked') : (lang === 'es' ? 'Bloqueado' : 'Locked'))}
          active={activePhase === 2} done={phase2Done}
          onClick={() => setActivePhase(2)}
        />
        <PhaseStep
          num={3} emoji="☑️"
          label={lang === 'es' ? 'Lista en Vivo' : 'Live List'}
          status={phase3Done ? (lang === 'es' ? 'Completado' : 'Complete') : (phase2Done ? (lang === 'es' ? 'Desbloqueado' : 'Unlocked') : (lang === 'es' ? 'Bloqueado' : 'Locked'))}
          active={activePhase === 3} done={phase3Done}
          onClick={() => setActivePhase(3)}
        />
      </div>

      {/* Body */}
      <div style={S.body}>
        {activePhase === 1 && (
          <div>
            {/* Tab switcher — only show if phase 1 not done yet */}
            {!phase1Done && (
              <div style={{
                display: 'flex', gap: 6, marginBottom: 16,
                background: '#1A1A1A', borderRadius: 10, padding: 4,
              }}>
                <button
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
                    background: activeTab === 'content' ? '#D4AF37' : 'transparent',
                    color: activeTab === 'content' ? '#0D0D0D' : '#888',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setActiveTab('content')}
                  type="button"
                >
                  {lang === 'es' ? '📖 Material' : '📖 Study Material'}
                </button>
                <button
                  style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 13,
                    background: activeTab === 'quiz' ? '#D4AF37' : 'transparent',
                    color: activeTab === 'quiz' ? '#0D0D0D' : '#888',
                    transition: 'all 0.15s',
                  }}
                  onClick={() => setActiveTab('quiz')}
                  type="button"
                >
                  {lang === 'es' ? '✏️ Examen' : '✏️ Quiz'}
                </button>
              </div>
            )}
            {renderPhase1()}
          </div>
        )}
        {activePhase === 2 && renderPhase2()}
        {activePhase === 3 && renderPhase3()}
      </div>
    </div>
  );
}
