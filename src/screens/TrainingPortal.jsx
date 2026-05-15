import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { phase1Sections, phase1Quiz, phase2SkillGroups, phase3Drinks, phase3Standards } from '../data/trainingContent';
import {
  getTrainingRecord,
  markPhase1Complete,
  markPhase2Complete,
  markPhase3Complete,
  setQuizLockout,
  getQuizLockoutInfo,
  savePhase2Progress,
  loadPhase2Progress,
  clearPhase2Progress,
  savePhase3Progress,
  loadPhase3Progress,
  clearPhase3Progress,
  getEmployees,
} from '../utils/storage';
import { sendQuezEmail } from '../utils/emailjs';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle each question's answer options independently. Keeps en/es option
// lists aligned and updates correctIndex so the right answer can land at any position.
function shuffleQuestionOptions(questions) {
  return questions.map((q) => {
    const n = q.options.en.length;
    const order = shuffle(Array.from({ length: n }, (_, i) => i));
    return {
      ...q,
      options: {
        en: order.map((i) => q.options.en[i]),
        es: order.map((i) => q.options.es[i]),
      },
      correctIndex: order.indexOf(q.correctIndex),
    };
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// TRAINER COUNTERSIGN MODAL
// Appears when a trainer needs to confirm a skill or mark phase complete
// Trainer selects their name and enters their PIN (Owner/Manager only can countersign)
// ─────────────────────────────────────────────────────────────────────────────
function TrainerCountersignModal({ lang, onConfirm, onCancel, title, description }) {
  // AppContext doesn't expose `employees`; read directly from storage so the
  // dropdown is always populated. Sort owner → manager → leadBarista so the
  // operator setting up their first hire sees themselves at the top.
  const trainerRank = { owner: 0, manager: 1, leadBarista: 2 };
  const eligibleTrainers = (getEmployees() || [])
    .filter((e) => e.active !== false && (e.role === 'owner' || e.role === 'manager' || e.role === 'leadBarista'))
    .sort((a, b) => (trainerRank[a.role] ?? 9) - (trainerRank[b.role] ?? 9));

  const [trainerName, setTrainerName] = useState('');
  const [trainerPin, setTrainerPin] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!trainerName) {
      setError(lang === 'es' ? 'Selecciona un entrenador.' : 'Select a trainer.');
      return;
    }
    const trainer = eligibleTrainers.find((e) => e.name === trainerName);
    // Owner and Manager require PIN; Lead Barista does not
    if (trainer && (trainer.role === 'owner' || trainer.role === 'manager')) {
      if (!trainerPin) {
        setError(lang === 'es' ? 'Se requiere PIN para este rol.' : 'PIN required for this role.');
        return;
      }
      if (trainer.pin !== trainerPin) {
        setError(lang === 'es' ? 'PIN incorrecto.' : 'Incorrect PIN.');
        return;
      }
    }
    onConfirm(trainerName);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <span style={styles.goldText}>✦</span>
          <h3 style={styles.modalTitle}>{title}</h3>
        </div>
        {description && <p style={styles.modalDesc}>{description}</p>}

        <div style={styles.formGroup}>
          <label style={styles.label}>
            {lang === 'es' ? 'Nombre del Entrenador' : 'Trainer Name'}
          </label>
          <select
            style={styles.select}
            value={trainerName}
            onChange={(e) => { setTrainerName(e.target.value); setError(''); setTrainerPin(''); }}
          >
            <option value="">{lang === 'es' ? '— Seleccionar —' : '— Select —'}</option>
            {eligibleTrainers.map((e) => (
              <option key={e.id} value={e.name}>{e.name} ({e.role})</option>
            ))}
          </select>
        </div>

        {trainerName && (() => {
          const trainer = eligibleTrainers.find((e) => e.name === trainerName);
          return trainer && (trainer.role === 'owner' || trainer.role === 'manager') ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                style={styles.input}
                value={trainerPin}
                onChange={(e) => { setTrainerPin(e.target.value); setError(''); }}
                placeholder="••••"
              />
            </div>
          ) : null;
        })()}

        {error && <p style={styles.errorText}>{error}</p>}

        <div style={styles.modalActions}>
          <button style={styles.btnSecondary} onClick={onCancel}>
            {lang === 'es' ? 'Cancelar' : 'Cancel'}
          </button>
          <button style={styles.btnGold} onClick={handleConfirm}>
            {lang === 'es' ? 'Confirmar' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainingPortal() {
  const { currentUser, language } = useApp();
  const lang = language || 'en';

  // Phase navigation: 'phase1' | 'phase2' | 'phase3'
  const [activePhase, setActivePhase] = useState('phase1');

  // Training record for the current trainee
  const [record, setRecord] = useState(null);

  // ── Phase 1 state
  const [p1Tab, setP1Tab] = useState('study'); // 'study' | 'quiz'
  const [expandedSections, setExpandedSections] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]); // { questionId, selectedIndex, correct }
  const [quizDone, setQuizDone] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState({ isLocked: false });

  // ── Phase 2 state
  const [signedSkills, setSignedSkills] = useState(new Set());
  const [countersignModal, setCountersignModal] = useState(null);
  // countersignModal: { type: 'skill'|'phase2complete'|'phase3complete', skillId, trainerCallback }

  // ── Phase 3 state
  const [signedDrinks, setSignedDrinks] = useState(new Set());

  // ─────────────────────────────────────────────────────────────────────────
  // LOAD TRAINING RECORD
  // ─────────────────────────────────────────────────────────────────────────
  const loadRecord = useCallback(() => {
    if (!currentUser) return;
    const r = getTrainingRecord(currentUser.id);
    setRecord(r);

    // Load saved Phase 2 progress
    const p2progress = loadPhase2Progress(currentUser.id);
    setSignedSkills(new Set(p2progress.signedSkillIds || []));

    // Load saved Phase 3 progress
    const p3progress = loadPhase3Progress(currentUser.id);
    setSignedDrinks(new Set(p3progress.signedDrinkIds || []));

    // Check quiz lockout
    const lockout = getQuizLockoutInfo(currentUser.id);
    setLockoutInfo(lockout);
  }, [currentUser]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  // Randomize quiz on mount (once) — shuffle both question order AND answer options
  useEffect(() => {
    setQuizQuestions(shuffleQuestionOptions(shuffle(phase1Quiz)));
  }, []);

  // Poll lockout countdown every minute
  useEffect(() => {
    if (!lockoutInfo.isLocked) return;
    const interval = setInterval(() => {
      const updated = getQuizLockoutInfo(currentUser?.id);
      setLockoutInfo(updated);
    }, 60000);
    return () => clearInterval(interval);
  }, [lockoutInfo.isLocked, currentUser]);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — QUIZ LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const handleSelectAnswer = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
    const q = quizQuestions[currentQ];
    const correct = index === q.correctIndex;
    setQuizAnswers((prev) => [...prev, { questionId: q.id, selectedIndex: index, correct }]);
  };

  const handleNextQuestion = () => {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setQuizDone(true);
    }
  };

  const handleQuizPassed = useCallback(async () => {
    if (!currentUser) return;
    markPhase1Complete(currentUser.id);
    loadRecord();
    // Email owner
    await sendQuezEmail({
      subject: `[Quez Training] Phase 1 Complete — ${currentUser.name}`,
      templateParams: {
        to_name: 'Owner',
        subject: `[Quez Training] Phase 1 Complete — ${currentUser.name}`,
        message: `Phase 1 training complete.\n\nEmployee: ${currentUser.name}\nRole: ${currentUser.role}\nDate: ${new Date().toLocaleDateString()}\nResult: PASSED (quiz score ≥ 80%)\n\nNext step: Phase 2 — Supervised Hands-On Training.\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
      },
    });
  }, [currentUser, loadRecord]);

  const handleQuizFailed = useCallback(() => {
    if (!currentUser) return;
    setQuizLockout(currentUser.id);
    loadRecord();
    const lockout = getQuizLockoutInfo(currentUser.id);
    setLockoutInfo(lockout);
  }, [currentUser, loadRecord]);

  useEffect(() => {
    if (!quizDone || !currentUser) return;
    const correctCount = quizAnswers.filter((a) => a.correct).length;
    const passed = correctCount >= 12;
    if (passed) {
      handleQuizPassed();
    } else {
      handleQuizFailed();
    }
  }, [quizDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetakeQuiz = () => {
    setQuizQuestions(shuffleQuestionOptions(shuffle(phase1Quiz)));
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setQuizAnswers([]);
    setQuizDone(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — SKILL SIGN-OFF LOGIC
  // ─────────────────────────────────────────────────────────────────────────
  const handleUnsignSkill = (skillId) => {
    const updated = new Set(signedSkills);
    updated.delete(skillId);
    setSignedSkills(updated);
    savePhase2Progress(currentUser.id, [...updated]);
  };

  const handlePhase2Complete = () => {
    setCountersignModal({
      type: 'phase2complete',
      title: lang === 'es' ? 'Completar Fase 2' : 'Complete Phase 2',
      description:
        lang === 'es'
          ? 'El entrenador confirma que todas las habilidades de la Fase 2 han sido demostradas correctamente. Esta acción no se puede deshacer.'
          : 'Trainer confirms all Phase 2 skills have been demonstrated correctly. This cannot be undone.',
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 + PHASE 3 — UNIFIED COUNTERSIGN HANDLER
  // ─────────────────────────────────────────────────────────────────────────
  const handleCountersignConfirmUnified = async (trainerName) => {
    const modal = countersignModal;
    setCountersignModal(null);

    if (modal.type === 'skill' && modal.skillId) {
      // Phase 2 skill sign-off
      const updated = new Set(signedSkills);
      updated.add(modal.skillId);
      setSignedSkills(updated);
      savePhase2Progress(currentUser.id, [...updated]);

    } else if (modal.type === 'skill' && modal.drinkId) {
      // Phase 3 drink sign-off
      const updated = new Set(signedDrinks);
      updated.add(modal.drinkId);
      setSignedDrinks(updated);
      savePhase3Progress(currentUser.id, [...updated]);

    } else if (modal.type === 'phase2complete') {
      markPhase2Complete(currentUser.id, trainerName);
      clearPhase2Progress(currentUser.id);
      loadRecord();
      await sendQuezEmail({
        subject: `[Quez Training] Phase 2 Complete — ${currentUser.name}`,
        templateParams: {
          to_name: 'Owner',
          subject: `[Quez Training] Phase 2 Complete — ${currentUser.name}`,
          message: `Phase 2 training complete.\n\nEmployee: ${currentUser.name}\nRole: ${currentUser.role}\nDate: ${new Date().toLocaleDateString()}\nTrainer: ${trainerName}\nResult: All hands-on skills confirmed\n\nNext step: Phase 3 — Drink Proficiency.\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
        },
      });

    } else if (modal.type === 'phase3complete') {
      markPhase3Complete(currentUser.id, trainerName);
      clearPhase3Progress(currentUser.id);
      loadRecord();
      await sendQuezEmail({
        subject: `[Quez Training] Phase 3 Complete — ${currentUser.name}`,
        templateParams: {
          to_name: 'Owner',
          subject: `[Quez Training] Phase 3 Complete — ${currentUser.name}`,
          message: `Phase 3 training complete. Employee is ready for role upgrade.\n\nEmployee: ${currentUser.name}\nRole: ${currentUser.role}\nDate: ${new Date().toLocaleDateString()}\nTrainer: ${trainerName}\nResult: All 15 drinks demonstrated to standard\n\nAction Required: Owner or Manager must approve role upgrade in the Training Approval screen.\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
        },
      });
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE STATUS HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const phase1Complete = record?.phase1?.passed === true;
  const phase2Complete = record?.phase2?.passed === true;
  const phase3Complete = record?.phase3?.passed === true;

  const totalSkills = phase2SkillGroups.reduce((acc, g) => acc + g.skills.length, 0);
  const phase2Progress = signedSkills.size;
  const allSkillsSigned = phase2Progress >= totalSkills;

  const totalDrinks = phase3Drinks.length;
  const phase3Progress = signedDrinks.size;
  const allDrinksSigned = phase3Progress >= totalDrinks;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PHASE PROGRESS BAR
  // ─────────────────────────────────────────────────────────────────────────
  const renderPhaseBar = () => {
    const phases = [
      {
        key: 'phase1',
        label: { en: 'Phase 1', es: 'Fase 1' },
        sub: { en: 'Knowledge & Quiz', es: 'Conocimiento y Quiz' },
        complete: phase1Complete,
        locked: false,
      },
      {
        key: 'phase2',
        label: { en: 'Phase 2', es: 'Fase 2' },
        sub: { en: 'Hands-On Skills', es: 'Habilidades Prácticas' },
        complete: phase2Complete,
        locked: !phase1Complete,
      },
      {
        key: 'phase3',
        label: { en: 'Phase 3', es: 'Fase 3' },
        sub: { en: 'Drink Proficiency', es: 'Dominio de Bebidas' },
        complete: phase3Complete,
        locked: !phase2Complete,
      },
    ];

    return (
      <div style={styles.phaseBar}>
        {phases.map((ph, idx) => {
          const isActive = activePhase === ph.key;
          const canTap = !ph.locked;
          return (
            <React.Fragment key={ph.key}>
              <button
                style={{
                  ...styles.phaseStep,
                  ...(isActive ? styles.phaseStepActive : {}),
                  opacity: ph.locked ? 0.4 : 1,
                  cursor: canTap ? 'pointer' : 'default',
                }}
                onClick={() => canTap && setActivePhase(ph.key)}
                disabled={ph.locked}
              >
                <div style={styles.phaseIcon}>
                  {ph.complete ? (
                    <span style={{ color: '#4CAF50', fontSize: 20 }}>✓</span>
                  ) : ph.locked ? (
                    <span style={{ color: '#666', fontSize: 16 }}>🔒</span>
                  ) : (
                    <span style={{ color: isActive ? '#D4AF37' : '#888', fontWeight: 700, fontSize: 14 }}>
                      {idx + 1}
                    </span>
                  )}
                </div>
                <div>
                  <div style={{ ...styles.phaseLabel, color: isActive ? '#D4AF37' : ph.complete ? '#4CAF50' : '#ccc' }}>
                    {ph.label[lang]}
                  </div>
                  <div style={styles.phaseSub}>{ph.sub[lang]}</div>
                </div>
              </button>
              {idx < phases.length - 1 && (
                <div style={{ ...styles.phaseConnector, backgroundColor: phase1Complete && idx === 0 ? '#D4AF37' : phase2Complete && idx === 1 ? '#D4AF37' : '#333' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PHASE 1
  // ─────────────────────────────────────────────────────────────────────────
  const renderPhase1 = () => {
    const correctCount = quizAnswers.filter((a) => a.correct).length;
    const passed = correctCount >= 12;

    return (
      <div>
        {/* Phase 1 complete banner */}
        {phase1Complete && (
          <div style={styles.completeBanner}>
            <span>✓</span>
            <div>
              <div style={{ fontWeight: 700 }}>
                {lang === 'es' ? 'Fase 1 Completa' : 'Phase 1 Complete'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {lang === 'es' ? 'Completada el' : 'Completed'} {formatDate(record?.phase1?.date)}
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={styles.tabBar}>
          <button
            style={{ ...styles.tab, ...(p1Tab === 'study' ? styles.tabActive : {}) }}
            onClick={() => setP1Tab('study')}
          >
            {lang === 'es' ? 'Material de Estudio' : 'Study Material'}
          </button>
          <button
            style={{ ...styles.tab, ...(p1Tab === 'quiz' ? styles.tabActive : {}) }}
            onClick={() => setP1Tab('quiz')}
          >
            {lang === 'es' ? 'Quiz' : 'Quiz'}
            {phase1Complete && <span style={styles.tabBadgeGreen}> ✓</span>}
          </button>
        </div>

        {p1Tab === 'study' && renderPhase1Study()}
        {p1Tab === 'quiz' && renderPhase1Quiz(correctCount, passed)}
      </div>
    );
  };

  const renderPhase1Study = () => (
    <div style={styles.section}>
      {phase1Sections.map((sec) => {
        const isOpen = expandedSections[sec.id];
        return (
          <div key={sec.id} style={styles.accordionItem}>
            <button
              style={styles.accordionHeader}
              onClick={() => setExpandedSections((prev) => ({ ...prev, [sec.id]: !prev[sec.id] }))}
            >
              <span>
                {sec.title[lang]}
                {sec.required && (
                  <span style={styles.requiredBadge}>
                    {lang === 'es' ? ' OBLIGATORIO' : ' REQUIRED'}
                  </span>
                )}
              </span>
              <span style={{ color: '#D4AF37' }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div style={styles.accordionBody}>
                {sec.content[lang].map((item, i) => (
                  <div key={i} style={styles.contentBlock}>
                    <div style={styles.contentHeading}>{item.heading}</div>
                    <div style={styles.contentBody}>{item.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPhase1Quiz = (correctCount, passed) => {
    if (lockoutInfo.isLocked && !phase1Complete) {
      return (
        <div style={styles.section}>
          <div style={styles.lockoutCard}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={styles.lockoutTitle}>
              {lang === 'es' ? 'Quiz Bloqueado' : 'Quiz Locked'}
            </div>
            <div style={styles.lockoutBody}>
              {lang === 'es'
                ? `No pasaste el quiz. Revisa el material de estudio. Intenta de nuevo en ${lockoutInfo.remainingHours}h ${lockoutInfo.remainingMinutes}m.`
                : `Quiz failed. Review the study material. Retry available in ${lockoutInfo.remainingHours}h ${lockoutInfo.remainingMinutes}m.`}
            </div>
          </div>
        </div>
      );
    }

    if (quizDone) {
      return (
        <div style={styles.section}>
          <div style={passed ? styles.passCard : styles.failCard}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{passed ? '🎉' : '❌'}</div>
            <div style={styles.resultTitle}>
              {passed
                ? (lang === 'es' ? '¡Aprobado!' : 'Passed!')
                : (lang === 'es' ? 'No Aprobado' : 'Not Passed')}
            </div>
            <div style={styles.resultScore}>
              {correctCount} / {quizQuestions.length} {lang === 'es' ? 'correctas' : 'correct'}
            </div>
            {!passed && (
              <>
                <div style={{ color: '#ccc', fontSize: 14, marginTop: 8 }}>
                  {lang === 'es'
                    ? 'Preguntas incorrectas — revisa estas secciones:'
                    : 'Missed questions — review these sections:'}
                </div>
                {quizAnswers.filter((a) => !a.correct).map((a) => {
                  const q = phase1Quiz.find((q) => q.id === a.questionId);
                  return q ? (
                    <div key={a.questionId} style={styles.missedQ}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{q.question[lang]}</div>
                      <div style={{ color: '#4CAF50', fontSize: 13 }}>
                        ✓ {q.options[lang][q.correctIndex]}
                      </div>
                      <div style={{ color: '#888', fontSize: 12 }}>{q.explanation[lang]}</div>
                    </div>
                  ) : null;
                })}
                {lockoutInfo.isLocked ? (
                  <div style={{ marginTop: 16, color: '#aaa', fontSize: 13 }}>
                    {lang === 'es'
                      ? `Bloqueado por 24 horas. Tiempo restante: ${lockoutInfo.remainingHours || 24}h ${lockoutInfo.remainingMinutes || 0}m`
                      : `Locked for 24 hours. Time remaining: ${lockoutInfo.remainingHours || 24}h ${lockoutInfo.remainingMinutes || 0}m`}
                  </div>
                ) : (
                  <button style={{ ...styles.btnGold, marginTop: 18, width: '100%' }} onClick={handleRetakeQuiz}>
                    {lang === 'es' ? 'Reintentar Quiz' : 'Retake Quiz'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    // Show quiz (or already-passed state)
    if (phase1Complete) {
      return (
        <div style={styles.section}>
          <div style={styles.alreadyPassedCard}>
            <div style={{ fontSize: 32 }}>✓</div>
            <div style={{ fontWeight: 700, color: '#4CAF50' }}>
              {lang === 'es' ? 'Quiz Aprobado' : 'Quiz Passed'}
            </div>
            <div style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
              {lang === 'es' ? 'Completado el' : 'Completed on'} {formatDate(record?.phase1?.date)}
            </div>
          </div>
        </div>
      );
    }

    const q = quizQuestions[currentQ];
    if (!q) return null;

    const progress = ((currentQ) / quizQuestions.length) * 100;

    return (
      <div style={styles.section}>
        <div style={styles.quizProgress}>
          <div style={styles.quizProgressBar}>
            <div style={{ ...styles.quizProgressFill, width: `${progress}%` }} />
          </div>
          <div style={styles.quizProgressLabel}>
            {currentQ + 1} / {quizQuestions.length}
          </div>
        </div>

        <div style={styles.quizCard}>
          <div style={styles.quizQuestion}>{q.question[lang]}</div>
          <div style={styles.quizOptions}>
            {q.options[lang].map((opt, idx) => {
              let bg = '#1A1A1A';
              let border = '1px solid #333';
              let color = '#F5F0E8';
              if (showFeedback) {
                if (idx === q.correctIndex) { bg = '#1a3a1a'; border = '1px solid #4CAF50'; color = '#4CAF50'; }
                else if (idx === selectedAnswer && idx !== q.correctIndex) { bg = '#3a1a1a'; border = '1px solid #f44336'; color = '#f44336'; }
              } else if (idx === selectedAnswer) {
                border = '1px solid #D4AF37';
              }
              return (
                <button
                  key={idx}
                  style={{ ...styles.quizOption, background: bg, border, color }}
                  onClick={() => handleSelectAnswer(idx)}
                  disabled={showFeedback}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div style={styles.quizFeedback}>
              <div style={{ color: selectedAnswer === q.correctIndex ? '#4CAF50' : '#f44336', fontWeight: 700, marginBottom: 4 }}>
                {selectedAnswer === q.correctIndex
                  ? (lang === 'es' ? '✓ Correcto' : '✓ Correct')
                  : (lang === 'es' ? '✗ Incorrecto' : '✗ Incorrect')}
              </div>
              <div style={{ color: '#ccc', fontSize: 14 }}>{q.explanation[lang]}</div>
              <button style={{ ...styles.btnGold, marginTop: 16, width: '100%' }} onClick={handleNextQuestion}>
                {currentQ < quizQuestions.length - 1
                  ? (lang === 'es' ? 'Siguiente Pregunta' : 'Next Question')
                  : (lang === 'es' ? 'Ver Resultados' : 'See Results')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PHASE 2
  // ─────────────────────────────────────────────────────────────────────────
  const renderPhase2 = () => {
    if (!phase1Complete) {
      return (
        <div style={styles.lockedPhase}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={styles.lockedTitle}>
            {lang === 'es' ? 'Completa la Fase 1 primero' : 'Complete Phase 1 first'}
          </div>
          <div style={styles.lockedBody}>
            {lang === 'es'
              ? 'Debes aprobar el quiz de la Fase 1 antes de comenzar el entrenamiento práctico.'
              : 'You must pass the Phase 1 quiz before starting hands-on training.'}
          </div>
        </div>
      );
    }

    if (phase2Complete) {
      return (
        <div>
          <div style={styles.completeBanner}>
            <span>✓</span>
            <div>
              <div style={{ fontWeight: 700 }}>
                {lang === 'es' ? 'Fase 2 Completa' : 'Phase 2 Complete'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {lang === 'es' ? 'Entrenador:' : 'Trainer:'} {record?.phase2?.trainerName} · {formatDate(record?.phase2?.date)}
              </div>
            </div>
          </div>
          {/* Still show skills for reference */}
          {renderPhase2Skills(true)}
        </div>
      );
    }

    return (
      <div>
        <div style={styles.phaseIntro}>
          <p style={styles.phaseIntroText}>
            {lang === 'es'
              ? 'El entrenador firma cada habilidad cuando está satisfecho de que puedes realizarla correctamente e independientemente. No firmes para avanzar — una habilidad no firmada es una responsabilidad.'
              : 'Trainer signs each skill when satisfied you can perform it correctly and independently. Do not sign off to move training along — an unsigned skill becomes a liability.'}
          </p>
          <div style={styles.progressPill}>
            {phase2Progress} / {totalSkills} {lang === 'es' ? 'habilidades confirmadas' : 'skills confirmed'}
          </div>
        </div>

        {renderPhase2Skills(false)}

        {allSkillsSigned && !phase2Complete && (
          <div style={styles.completePhaseSection}>
            <p style={styles.completePhaseNote}>
              {lang === 'es'
                ? 'Todas las habilidades han sido confirmadas. El entrenador puede cerrar la Fase 2.'
                : 'All skills have been confirmed. Trainer may now close out Phase 2.'}
            </p>
            <button style={styles.btnGoldLarge} onClick={handlePhase2Complete}>
              {lang === 'es' ? 'Cerrar Fase 2' : 'Complete Phase 2'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPhase2Skills = (readOnly) => (
    <div style={styles.section}>
      {phase2SkillGroups.map((group) => (
        <div key={group.id} style={styles.skillGroup}>
          <div style={styles.skillGroupHeader}>{group.title[lang]}</div>
          {group.skills.map((skill) => {
            const signed = signedSkills.has(skill.id) || phase2Complete;
            return (
              <div key={skill.id} style={{ ...styles.skillRow, ...(signed ? styles.skillRowSigned : {}) }}>
                <div style={styles.skillInfo}>
                  {skill.critical && <span style={styles.criticalBadge}>⚠</span>}
                  <div>
                    <div style={styles.skillName}>{skill.skill[lang]}</div>
                    <div style={styles.skillNote}>{skill.note[lang]}</div>
                  </div>
                </div>
                <div style={styles.skillAction}>
                  {signed ? (
                    <div style={styles.signedBadge}>
                      {!readOnly && (
                        <button style={styles.unsignBtn} onClick={() => handleUnsignSkill(skill.id)}>✕</button>
                      )}
                      <span style={{ color: '#4CAF50', fontWeight: 700 }}>✓</span>
                    </div>
                  ) : !readOnly ? (
                    <button style={styles.signBtn} onClick={() => {
                      setCountersignModal({
                        type: 'skill',
                        skillId: skill.id,
                        drinkId: null,
                        title: lang === 'es' ? 'Confirmar Habilidad' : 'Confirm Skill Sign-Off',
                        description: lang === 'es'
                          ? 'El entrenador confirma que esta habilidad fue demostrada correctamente e independientemente.'
                          : 'Trainer confirms this skill was demonstrated correctly and independently.',
                      });
                    }}>
                      {lang === 'es' ? 'Firmar' : 'Sign Off'}
                    </button>
                  ) : (
                    <span style={{ color: '#555' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — PHASE 3
  // ─────────────────────────────────────────────────────────────────────────
  const renderPhase3 = () => {
    if (!phase2Complete) {
      return (
        <div style={styles.lockedPhase}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={styles.lockedTitle}>
            {lang === 'es' ? 'Completa la Fase 2 primero' : 'Complete Phase 2 first'}
          </div>
          <div style={styles.lockedBody}>
            {lang === 'es'
              ? 'Debes completar todas las habilidades de la Fase 2 antes de la prueba de bebidas.'
              : 'You must complete all Phase 2 skills before drink proficiency testing.'}
          </div>
        </div>
      );
    }

    if (phase3Complete) {
      return (
        <div>
          <div style={styles.completeBanner}>
            <span>✓</span>
            <div>
              <div style={{ fontWeight: 700 }}>
                {lang === 'es' ? 'Fase 3 Completa' : 'Phase 3 Complete'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {lang === 'es' ? 'Entrenador:' : 'Trainer:'} {record?.phase3?.trainerName} · {formatDate(record?.phase3?.date)}
              </div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.8 }}>
                {lang === 'es'
                  ? 'Pendiente de aprobación del dueño o gerente.'
                  : 'Awaiting Owner or Manager role upgrade approval.'}
              </div>
            </div>
          </div>
          {renderPhase3Drinks(true)}
        </div>
      );
    }

    return (
      <div>
        <div style={styles.phaseIntro}>
          <p style={styles.phaseIntroText}>
            {lang === 'es'
              ? 'El entrenador observa cada bebida siendo construida sin instrucción. Aprobado = ingredientes correctos, secuencia correcta, presentación correcta, dentro del tiempo objetivo.'
              : 'Trainer observes each drink being built without coaching. Pass = correct ingredients, correct build sequence, correct presentation, within target build time.'}
          </p>

          {/* Pass standards reference */}
          <div style={styles.standardsGrid}>
            {phase3Standards[lang].map((s) => (
              <div key={s.label} style={styles.standardCard}>
                <div style={styles.standardLabel}>{s.label}</div>
                <div style={styles.standardDesc}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={styles.progressPill}>
            {phase3Progress} / {totalDrinks} {lang === 'es' ? 'bebidas confirmadas' : 'drinks confirmed'}
          </div>
        </div>

        {renderPhase3Drinks(false)}

        {allDrinksSigned && !phase3Complete && (
          <div style={styles.completePhaseSection}>
            <p style={styles.completePhaseNote}>
              {lang === 'es'
                ? 'Las 15 bebidas han sido confirmadas. El entrenador puede cerrar la Fase 3.'
                : 'All 15 drinks have been confirmed. Trainer may now close out Phase 3.'}
            </p>
            <button
              style={styles.btnGoldLarge}
              onClick={() => {
                setCountersignModal({
                  type: 'phase3complete',
                  title: lang === 'es' ? 'Completar Fase 3' : 'Complete Phase 3',
                  description: lang === 'es'
                    ? 'El entrenador confirma que las 15 bebidas fueron demostradas al estándar. El empleado estará listo para aprobación del dueño.'
                    : 'Trainer confirms all 15 drinks were demonstrated to standard. Employee will be ready for Owner approval.',
                });
              }}
            >
              {lang === 'es' ? 'Cerrar Fase 3' : 'Complete Phase 3'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPhase3Drinks = (readOnly) => {
    // Group drinks by category
    const categories = [];
    const seen = new Set();
    phase3Drinks.forEach((d) => {
      const cat = d.category[lang];
      if (!seen.has(cat)) { seen.add(cat); categories.push(cat); }
    });

    return (
      <div style={styles.section}>
        {categories.map((cat) => (
          <div key={cat} style={styles.skillGroup}>
            <div style={styles.skillGroupHeader}>{cat}</div>
            {phase3Drinks
              .filter((d) => d.category[lang] === cat)
              .map((drink) => {
                const signed = signedDrinks.has(drink.id) || phase3Complete;
                return (
                  <div key={drink.id} style={{ ...styles.skillRow, ...(signed ? styles.skillRowSigned : {}) }}>
                    <div style={styles.skillInfo}>
                      <div>
                        <div style={styles.skillName}>{drink.name}</div>
                        <div style={styles.skillNote}>{drink.prepType[lang]}</div>
                      </div>
                    </div>
                    <div style={styles.skillAction}>
                      {signed ? (
                        <div style={styles.signedBadge}>
                          {!readOnly && !phase3Complete && (
                            <button style={styles.unsignBtn} onClick={() => {
                              const updated = new Set(signedDrinks);
                              updated.delete(drink.id);
                              setSignedDrinks(updated);
                              savePhase3Progress(currentUser.id, [...updated]);
                            }}>✕</button>
                          )}
                          <span style={{ color: '#4CAF50', fontWeight: 700 }}>✓</span>
                        </div>
                      ) : !readOnly ? (
                        <button style={styles.signBtn} onClick={() => {
                          setCountersignModal({
                            type: 'skill',
                            skillId: null,
                            drinkId: drink.id,
                            title: lang === 'es' ? 'Confirmar Bebida' : 'Confirm Drink Sign-Off',
                            description: lang === 'es'
                              ? `El entrenador observó "${drink.name}" construida correctamente sin instrucción. Ingredientes, secuencia, presentación y tiempo — todo dentro del estándar.`
                              : `Trainer observed "${drink.name}" built correctly without coaching. Ingredients, sequence, presentation, and build time — all within standard.`,
                          });
                        }}>
                          {lang === 'es' ? 'Firmar' : 'Sign Off'}
                        </button>
                      ) : (
                        <span style={{ color: '#555' }}>—</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        ))}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={styles.headerTitle}>
          {lang === 'es' ? 'Portal de Entrenamiento' : 'Training Portal'}
        </div>
        <div style={styles.headerSub}>
          {currentUser?.name} · {currentUser?.role}
        </div>
      </div>

      {/* All 3 phases complete — awaiting approval */}
      {phase1Complete && phase2Complete && phase3Complete && (
        <div style={styles.soloReadyBanner}>
          <div style={{ fontSize: 28 }}>🏆</div>
          <div>
            <div style={{ fontWeight: 700, color: '#D4AF37' }}>
              {lang === 'es' ? 'Todas las Fases Completas' : 'All Phases Complete'}
            </div>
            <div style={{ fontSize: 13, color: '#ccc', marginTop: 2 }}>
              {lang === 'es'
                ? 'Pendiente de aprobación del dueño o gerente para actualización de rol.'
                : 'Awaiting Owner or Manager approval for role upgrade.'}
            </div>
          </div>
        </div>
      )}

      {/* Phase progress bar */}
      {renderPhaseBar()}

      {/* Phase content */}
      <div style={styles.phaseContent}>
        {activePhase === 'phase1' && renderPhase1()}
        {activePhase === 'phase2' && renderPhase2()}
        {activePhase === 'phase3' && renderPhase3()}
      </div>

      {/* Trainer countersign modal */}
      {countersignModal && (
        <TrainerCountersignModal
          lang={lang}
          title={countersignModal.title}
          description={countersignModal.description}
          onConfirm={handleCountersignConfirmUnified}
          onCancel={() => setCountersignModal(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = {
  container: {
    backgroundColor: '#0D0D0D',
    minHeight: '100vh',
    color: '#F5F0E8',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    paddingBottom: 80,
  },
  header: {
    backgroundColor: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    padding: '20px 20px 16px',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: {
    color: '#D4AF37',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 700,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Georgia, serif',
    fontWeight: 700,
    color: '#F5F0E8',
  },
  headerSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  phaseBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 12px',
    backgroundColor: '#111',
    borderBottom: '1px solid #222',
    overflowX: 'auto',
  },
  phaseStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'none',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    flexShrink: 0,
  },
  phaseStepActive: {
    backgroundColor: '#1A1A1A',
  },
  phaseIcon: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#222',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  phaseSub: {
    fontSize: 11,
    color: '#666',
  },
  phaseConnector: {
    height: 2,
    width: 24,
    flexShrink: 0,
  },
  phaseContent: {
    padding: '0 16px',
  },
  section: {
    paddingTop: 12,
  },
  completeBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a3a1a',
    border: '1px solid #4CAF50',
    borderRadius: 10,
    padding: '14px 16px',
    margin: '16px 0 8px',
    color: '#4CAF50',
    fontSize: 20,
  },
  soloReadyBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#1a1600',
    border: '1px solid #D4AF37',
    borderRadius: 10,
    padding: '14px 16px',
    margin: '16px 16px 0',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    margin: '16px 0 4px',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: '10px 8px',
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 7,
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#2A2A2A',
    color: '#D4AF37',
  },
  tabBadgeGreen: {
    color: '#4CAF50',
  },
  accordionItem: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #222',
  },
  accordionHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#1A1A1A',
    border: 'none',
    color: '#F5F0E8',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  accordionBody: {
    backgroundColor: '#111',
    padding: '12px 16px',
  },
  contentBlock: {
    marginBottom: 16,
  },
  contentHeading: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contentBody: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 1.6,
  },
  requiredBadge: {
    backgroundColor: '#D4AF37',
    color: '#0D0D0D',
    fontSize: 10,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 4,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  phaseIntro: {
    margin: '16px 0 8px',
  },
  phaseIntroText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 1.6,
    margin: '0 0 12px',
    fontStyle: 'italic',
    borderLeft: '3px solid #D4AF37',
    paddingLeft: 12,
  },
  progressPill: {
    display: 'inline-block',
    backgroundColor: '#1A1A1A',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: 700,
    padding: '6px 14px',
    borderRadius: 20,
  },
  skillGroup: {
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #222',
  },
  skillGroupHeader: {
    backgroundColor: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 1,
    padding: '10px 14px',
    textTransform: 'uppercase',
  },
  skillRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: '1px solid #1a1a1a',
    backgroundColor: '#0D0D0D',
    gap: 10,
  },
  skillRowSigned: {
    backgroundColor: '#0a1a0a',
  },
  skillInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  criticalBadge: {
    color: '#FFA500',
    fontSize: 16,
    flexShrink: 0,
    marginTop: 1,
  },
  skillName: {
    color: '#F5F0E8',
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  skillNote: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  skillAction: {
    flexShrink: 0,
  },
  signBtn: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  signedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  unsignBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontSize: 12,
    cursor: 'pointer',
    padding: '2px 4px',
  },
  completePhaseSection: {
    margin: '24px 0',
    padding: '20px',
    backgroundColor: '#111',
    borderRadius: 12,
    border: '1px solid #D4AF37',
    textAlign: 'center',
  },
  completePhaseNote: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 16,
  },
  lockedPhase: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#888',
    marginTop: 12,
  },
  lockedBody: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 1.6,
  },
  lockoutCard: {
    backgroundColor: '#1a0a0a',
    border: '1px solid #8B0000',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
  },
  lockoutTitle: {
    color: '#f44336',
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  lockoutBody: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 1.6,
  },
  quizProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  quizProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  quizProgressFill: {
    height: '100%',
    backgroundColor: '#D4AF37',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  quizProgressLabel: {
    color: '#888',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },
  quizCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: '20px 16px',
    border: '1px solid #222',
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: 600,
    color: '#F5F0E8',
    lineHeight: 1.5,
    marginBottom: 20,
  },
  quizOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  quizOption: {
    width: '100%',
    padding: '14px 16px',
    textAlign: 'left',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    lineHeight: 1.4,
    transition: 'all 0.15s',
  },
  quizFeedback: {
    marginTop: 20,
    padding: '16px',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  passCard: {
    backgroundColor: '#1a3a1a',
    border: '1px solid #4CAF50',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
  },
  failCard: {
    backgroundColor: '#1a0a0a',
    border: '1px solid #8B0000',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: '#F5F0E8',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 18,
    color: '#D4AF37',
    fontWeight: 600,
  },
  missedQ: {
    textAlign: 'left',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: '12px 14px',
    marginTop: 12,
  },
  alreadyPassedCard: {
    backgroundColor: '#1a3a1a',
    border: '1px solid #4CAF50',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  standardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    margin: '12px 0',
  },
  standardCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: '10px 12px',
    border: '1px solid #2A2A2A',
  },
  standardLabel: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  standardDesc: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 1.4,
  },
  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modal: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #D4AF37',
    borderRadius: 14,
    padding: '24px 20px',
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  goldText: {
    color: '#D4AF37',
    fontSize: 18,
  },
  modalTitle: {
    color: '#F5F0E8',
    fontSize: 17,
    fontWeight: 700,
    margin: 0,
  },
  modalDesc: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 20,
    paddingLeft: 28,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    color: '#888',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#F5F0E8',
    fontSize: 15,
    appearance: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#F5F0E8',
    fontSize: 20,
    letterSpacing: 6,
    boxSizing: 'border-box',
  },
  errorText: {
    color: '#f44336',
    fontSize: 13,
    margin: '0 0 12px',
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  btnSecondary: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#888',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGold: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#D4AF37',
    border: 'none',
    borderRadius: 8,
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnGoldLarge: {
    padding: '14px 28px',
    backgroundColor: '#D4AF37',
    border: 'none',
    borderRadius: 10,
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
};
