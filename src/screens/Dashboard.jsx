// ============================================================
// QUEZ APP LITE — Dashboard.jsx
// Role-aware home screen. Routes:
//   owner / manager  → existing full OwnerDashboard
//   leadBarista      → ShiftDashboard with periodic-due indicators
//   barista          → ShiftDashboard
//   trainee          → TraineeDashboard (training progress)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import OwnerDashboard from './OwnerDashboard';
import {
  getTrainingRecord,
  getActiveOrders,
  isDailyChecklistSubmittedToday,
  loadChecklistState,
  isWeeklyChecklistDue,
  isWeeklySubmittedThisWeek,
  isMonthlyChecklistDue,
  isMonthlySubmittedThisMonth,
  isQuarterlyChecklistDue,
  isQuarterlySubmittedThisQuarter,
  isAnnualChecklistDue,
  isAnnualSubmittedThisYear,
  getMyDrinkCountToday,
  getSeasonalDrink,
  getTodayLocation,
  getTodayLocationUpdatedAt,
  getEightySixed,
  getLatestHandoffNote,
  postHandoffNote,
  getDailyGoal,
  getCurrentStreak,
  getMyWeekStats,
  getMyRecentDrinks,
  getLowStockItems,
  getEmployees,
  fetchWeather,
  weatherCodeToIcon,
  weatherDrinkSuggestion,
  getBirthdaysThisWeek,
  getMyAchievements,
  getPlaylistUrl,
  getMyHomeLayout,
  saveMyHomeLayout,
  moveItem,
} from '../utils/storage';
import { getTodayBrandStandard } from '../data/brandStandards';
import { drinkRecipes } from '../data/drinkRecipes';
import { getModLabel } from '../data/drinkModifiers';
import { fmtRelTime as fmtRelTimeShared } from '../utils/timeFormat';

function todayLong(lang) {
  return new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ── Default card order for each dashboard ──
function getShiftDefaultOrder(isLead) {
  // Hero (briefing) leads. Mega-stat next (primary tap target → Orders).
  // Daily Checklist link sits above quick actions so a pending checklist is
  // impossible to miss. My Last 5 sits high for mid-rush recall per the
  // simulated converged spec. Goal/streak is demoted to a compact chip.
  //
  // REMOVED from default: weather (hidden), drinkGuideLink (in primary nav
  // for baristas now), ordersLink (duplicates the mega-stat tap target).
  const base = [
    'briefing',
    'megaStat',
    'barTotal',
    'dailyChecklistLink',
    'myRecentDrinks',
    'quickActions',
    'brandStandard',
    'goal',
    'birthdays',
    'weekStats',
    'achievements',
  ];
  if (isLead) {
    // Low-stock should be the FIRST card a lead sees after the hero — it's
    // their reason for opening the dashboard. Periodic link goes at the end
    // (red-bordered when due, so it self-promotes).
    base.splice(2, 0, 'lowStock');
    base.push('periodicLink');
  }
  return base;
}

function getTraineeDefaultOrder() {
  return ['trainingProgress', 'practiceRound', 'trainerCard', 'drinkGuideLink', 'brandStandard'];
}

function getTimeOfDayGreeting(lang = 'en') {
  const h = new Date().getHours();
  if (h < 5)  return lang === 'es' ? 'Buenas noches' : 'Good night';
  if (h < 12) return lang === 'es' ? 'Buenos días'   : 'Good morning';
  if (h < 17) return lang === 'es' ? 'Buenas tardes' : 'Good afternoon';
  if (h < 22) return lang === 'es' ? 'Buenas noches' : 'Good evening';
  return            lang === 'es' ? 'Buenas noches'  : 'Late night';
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((p) => p[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('');
}

const fmtRelTime = fmtRelTimeShared;

function dateKeyCompactToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

export default function Dashboard() {
  const { currentUser, language } = useApp();
  const role = currentUser?.role;

  if (role === 'owner' || role === 'manager') {
    return <OwnerDashboard />;
  }
  if (role === 'trainee') {
    return <TraineeDashboard user={currentUser} language={language} />;
  }
  // barista, leadBarista, anything else
  return <ShiftDashboard user={currentUser} language={language} />;
}

// ─── TRAINEE DASHBOARD ──────────────────────────────────────────────────────
function TraineeDashboard({ user, language }) {
  const { navigate } = useApp();
  const lang = language || 'en';
  const [record, setRecord] = useState(null);
  const [trainerDisplayName, setTrainerDisplayName] = useState('');
  const [playlistUrl, setPlaylistUrlState] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayoutState] = useState(null);

  // Pinned for trainees: training progress IS the point of being a trainee
  const PINNED = ['trainingProgress'];

  useEffect(() => {
    if (!user) return;
    setRecord(getTrainingRecord(user.id));
    setPlaylistUrlState(getPlaylistUrl());
    const employees = getEmployees();
    const me = employees.find((e) => e.id === user.id);
    // Trainer can be linked by id (new) or name (legacy)
    let trainerEmp = null;
    if (me?.trainerId) trainerEmp = employees.find((e) => e.id === me.trainerId);
    if (!trainerEmp && me?.trainerName) trainerEmp = employees.find((e) => e.name === me.trainerName);
    setTrainerDisplayName(trainerEmp?.name || me?.trainerName || '');
    // Layout
    const saved = getMyHomeLayout(user.id);
    setLayoutState(saved || { order: getTraineeDefaultOrder(), hidden: [] });
  }, [user]);

  const updateLayout = (next) => {
    setLayoutState(next);
    saveMyHomeLayout(user.id, next);
  };
  const moveCard = (id, direction) => {
    if (!layout) return;
    updateLayout({ ...layout, order: moveItem(layout.order, id, direction) });
  };
  const toggleHide = (id) => {
    if (!layout || PINNED.includes(id)) return;
    const hidden = new Set(layout.hidden || []);
    if (hidden.has(id)) hidden.delete(id); else hidden.add(id);
    updateLayout({ ...layout, hidden: Array.from(hidden) });
  };

  const p1 = !!record?.phase1?.passed;
  const p2 = !!record?.phase2?.passed;
  const p3 = !!record?.phase3?.passed;
  const completedCount = (p1 ? 1 : 0) + (p2 ? 1 : 0) + (p3 ? 1 : 0);
  const nextLabel = p1
    ? (p2 ? (p3 ? (lang === 'es' ? 'Esperando aprobación' : 'Awaiting approval')
                : (lang === 'es' ? 'Comenzar Fase 3' : 'Start Phase 3'))
          : (lang === 'es' ? 'Comenzar Fase 2' : 'Start Phase 2'))
    : (lang === 'es' ? 'Comenzar Fase 1 — Quiz' : 'Start Phase 1 — Quiz');

  const firstName = user?.name?.split(' ')[0] || '';
  const initials  = getInitials(user?.name);

  return (
    <div style={S.screen}>
      <div style={S.headerPersonal}>
        <div style={S.avatar}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.headerSubLight}>{getTimeOfDayGreeting(lang)},</div>
          <div style={S.headerTitle}>{firstName}</div>
          <div style={S.headerSubSmall}>{todayLong(lang)}</div>
        </div>
        {playlistUrl && (
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" style={S.playlistBtn} title="Today's playlist">▶</a>
        )}
      </div>

      <div style={S.body}>
        {/* Edit Layout toolbar */}
        <div style={S.editBar}>
          <button
            style={editMode ? S.editBarBtnActive : S.editBarBtn}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode
              ? (lang === 'es' ? '✓ Listo' : '✓ Done')
              : (lang === 'es' ? '✎ Editar Inicio' : '✎ Edit Home')}
          </button>
          {editMode && (
            <span style={S.editHint}>
              {lang === 'es' ? 'Reordena · oculta · arregla a tu gusto' : 'Reorder · hide · arrange'}
            </span>
          )}
        </div>

        {(() => {
          if (!layout) return null;
          const order = layout.order || [];
          const hidden = new Set(layout.hidden || []);

          const CARDS = {
            trainerCard: () => trainerDisplayName && (
              <div style={S.briefingCard}>
                <div style={S.briefingLabel}>{lang === 'es' ? 'Tu Entrenador' : 'Your Trainer'}</div>
                <div style={S.briefingRow}>
                  <span style={S.briefingIcon}>👤</span>
                  <span style={S.briefingText}>
                    <b>{trainerDisplayName}</b> — {lang === 'es' ? 'pregúntale cuando necesites ayuda.' : 'ask them when you need help.'}
                  </span>
                </div>
              </div>
            ),
            brandStandard: () => (
              <div style={S.brandStandardCard}>
                <span style={S.brandStandardIcon}>✦</span>
                <span style={S.brandStandardText}>
                  {getTodayBrandStandard()[lang] || getTodayBrandStandard().en}
                </span>
              </div>
            ),
            trainingProgress: () => (
              <div style={S.card}>
                <div style={S.cardLabel}>{lang === 'es' ? 'Tu Entrenamiento' : 'Your Training'}</div>
                <div style={S.bigStat}>{completedCount} / 3</div>
                <div style={S.bigStatSub}>{lang === 'es' ? 'fases completas' : 'phases complete'}</div>
                <div style={S.phaseList}>
                  {[
                    { k: 'p1', label: lang === 'es' ? 'Fase 1 · Conocimiento y Quiz' : 'Phase 1 · Knowledge & Quiz', done: p1 },
                    { k: 'p2', label: lang === 'es' ? 'Fase 2 · Habilidades Prácticas' : 'Phase 2 · Hands-On Skills',    done: p2 },
                    { k: 'p3', label: lang === 'es' ? 'Fase 3 · Dominio de Bebidas' : 'Phase 3 · Drink Proficiency',     done: p3 },
                  ].map((p) => (
                    <div key={p.k} style={S.phaseRow}>
                      <span style={{ color: p.done ? '#D4AF37' : '#555', fontSize: 16 }}>{p.done ? '✓' : '○'}</span>
                      <span style={{ color: p.done ? '#D4AF37' : '#aaa', fontSize: 14 }}>{p.label}</span>
                    </div>
                  ))}
                </div>
                <button style={S.btnGold} onClick={() => !editMode && navigate('training')}>
                  {nextLabel}
                </button>
              </div>
            ),
            practiceRound: () => (
              <button
                style={S.practiceCard}
                onClick={() => !editMode && navigate('orders')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🎯</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={S.linkTitle}>
                      {lang === 'es' ? 'Ronda de Práctica' : 'Practice Round'}
                    </div>
                    <div style={S.linkSub}>
                      {lang === 'es'
                        ? 'Pedidos simulados — no cuentan en reportes. Práctica honesta.'
                        : "Simulated orders — won't count toward reports. Drill freely."}
                    </div>
                  </div>
                  <span style={S.chev}>›</span>
                </div>
              </button>
            ),
            drinkGuideLink: () => (
              <button style={S.linkCard} onClick={() => !editMode && navigate('drinkGuide')}>
                <span style={S.linkIcon}>☕</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={S.linkTitle}>{lang === 'es' ? 'Guía de Bebidas' : 'Drink Build Guide'}</div>
                  <div style={S.linkSub}>{lang === 'es' ? 'Las 15 recetas del menú' : 'All 15 menu recipes'}</div>
                </div>
                <span style={S.chev}>›</span>
              </button>
            ),
          };

          const knownIds = Object.keys(CARDS);
          const safeOrder = order.filter((id) => knownIds.includes(id));
          knownIds.forEach((id) => { if (!safeOrder.includes(id)) safeOrder.push(id); });

          // Empty-state hint when everything is hidden
          const allHidden = safeOrder.every((id) => hidden.has(id));
          if (allHidden && !editMode) {
            return (
              <div style={S.emptyHomeHint}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🪟</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 12 }}>
                  {lang === 'es' ? 'Has ocultado todas las tarjetas.' : "You've hidden all home cards."}
                </div>
                <button style={S.editBarBtnActive} onClick={() => setEditMode(true)}>
                  ✎ {lang === 'es' ? 'Editar Inicio' : 'Edit Home'}
                </button>
              </div>
            );
          }

          return safeOrder.map((id, idx) => {
            const content = CARDS[id]?.();
            const isPinned = PINNED.includes(id);
            const isHidden = hidden.has(id);
            if (!editMode && (isHidden || !content)) return null;
            return (
              <div key={id} style={S.cardWrapper}>
                {content || (
                  <div style={S.cardStub}>
                    <span style={{ color: '#666', fontSize: 11, fontStyle: 'italic' }}>
                      {lang === 'es' ? 'Vacío ahora — aparecerá cuando aplique' : 'Empty now — appears when relevant'}
                    </span>
                  </div>
                )}
                {editMode && (
                  <div style={S.cardEditOverlay}>
                    <button
                      style={{ ...S.cardEditBtn, opacity: idx === 0 ? 0.3 : 1 }}
                      disabled={idx === 0}
                      onClick={() => moveCard(id, 'up')}
                      title="Move up"
                    >↑</button>
                    <button
                      style={{ ...S.cardEditBtn, opacity: idx === safeOrder.length - 1 ? 0.3 : 1 }}
                      disabled={idx === safeOrder.length - 1}
                      onClick={() => moveCard(id, 'down')}
                      title="Move down"
                    >↓</button>
                    {isPinned ? (
                      <span style={S.cardPinned} title="Pinned — can't be hidden">📌</span>
                    ) : (
                      <button
                        style={{ ...S.cardEditBtn, color: isHidden ? '#E05252' : '#D4AF37' }}
                        onClick={() => toggleHide(id)}
                        title={isHidden ? 'Show' : 'Hide'}
                      >{isHidden ? '🚫' : '👁'}</button>
                    )}
                  </div>
                )}
                {editMode && isHidden && <div style={S.cardHiddenOverlay} />}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

// ─── SHIFT DASHBOARD (Barista / Lead Barista) ───────────────────────────────
function ShiftDashboard({ user, language }) {
  const { navigate } = useApp();
  const lang = language || 'en';
  const isLead = user?.role === 'leadBarista';

  const [openOrderCount, setOpenOrderCount] = useState(0);
  const [myDrinksToday, setMyDrinksToday] = useState(0);
  const [checklistSubmitted, setChecklistSubmitted] = useState(false);
  const [periodicAlerts, setPeriodicAlerts] = useState({ weekly: false, monthly: false, quarterly: false, annual: false });
  // Pre-shift briefing data
  const [seasonal, setSeasonal] = useState('');
  const [location, setLocation] = useState('');
  const [locationUpdatedAt, setLocationUpdatedAt] = useState(null);
  const [eightySixed, setEightySixed] = useState([]);
  const [handoffNote, setHandoffNote] = useState(null);
  const [myRecentDrinks, setMyRecentDrinks] = useState([]);
  const [recipeModal, setRecipeModal] = useState(null);    // { drink, size, prep, modifiers } for tap-to-recipe
  // Goal + week stats + low-stock
  const [dailyGoal, setDailyGoalState] = useState(0);
  const [todayDrinkTotal, setTodayDrinkTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weekStats, setWeekStats] = useState({ drinks: 0, hours: 0, drinksPerHour: 0 });
  const [lowStock, setLowStock] = useState([]);
  // Hand-off modal
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [handoffDraft, setHandoffDraft] = useState('');
  // Weather, birthdays, achievements, playlist
  const [weather, setWeather] = useState(null);
  const [birthdays, setBirthdays] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [playlistUrl, setPlaylistUrlState] = useState('');
  // Layout editor
  const [editMode, setEditMode] = useState(false);
  const [layout, setLayoutState] = useState(null);

  const load = useCallback(() => {
    if (!user) return;
    setOpenOrderCount(getActiveOrders().length);
    setMyDrinksToday(getMyDrinkCountToday(user.name));
    setChecklistSubmitted(isDailyChecklistSubmittedToday());
    // Briefing
    setSeasonal(getSeasonalDrink());
    setLocation(getTodayLocation());
    setLocationUpdatedAt(getTodayLocationUpdatedAt());
    setEightySixed(getEightySixed());
    setHandoffNote(getLatestHandoffNote());
    // Goal + week
    setDailyGoalState(getDailyGoal());
    const log = (() => { try { return JSON.parse(localStorage.getItem(`quez_drink_log_${dateKeyCompactToday()}`) || '[]'); } catch { return []; }})();
    setTodayDrinkTotal(log.length);
    setStreak(getCurrentStreak(user.id));
    setWeekStats(getMyWeekStats(user.name, user.id));
    setMyRecentDrinks(getMyRecentDrinks(user.name, 5));
    setBirthdays(getBirthdaysThisWeek());
    setAchievements(getMyAchievements(user.id, user.name));
    setPlaylistUrlState(getPlaylistUrl());
    if (isLead) {
      setLowStock(getLowStockItems().slice(0, 5));
      setPeriodicAlerts({
        weekly:    isWeeklyChecklistDue()    && !isWeeklySubmittedThisWeek(),
        monthly:   isMonthlyChecklistDue()   && !isMonthlySubmittedThisMonth(),
        quarterly: isQuarterlyChecklistDue() && !isQuarterlySubmittedThisQuarter(),
        annual:    isAnnualChecklistDue()    && !isAnnualSubmittedThisYear(),
      });
    }
    void loadChecklistState;
  }, [user, isLead]);

  // Fetch weather once on mount + refresh hourly. Cached 30 min in storage.
  useEffect(() => {
    let cancelled = false;
    fetchWeather().then((w) => { if (!cancelled) setWeather(w); }).catch(() => {});
    const id = setInterval(() => {
      fetchWeather().then((w) => { if (!cancelled) setWeather(w); }).catch(() => {});
    }, 60 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Tight poll of open-order count — the mega-stat is the dashboard's
  // headline number; the 60-second load() refresh felt stale. Reads only
  // the active orders array, doesn't touch the rest of the dashboard data.
  useEffect(() => {
    const id = setInterval(() => setOpenOrderCount(getActiveOrders().length), 5000);
    return () => clearInterval(id);
  }, []);

  // Also load fresh data when the screen mounts (covers nav-back / HMR)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  // Load saved layout (or default) on mount
  useEffect(() => {
    if (!user) return;
    const saved = getMyHomeLayout(user.id);
    setLayoutState(saved || { order: getShiftDefaultOrder(isLead), hidden: [] });
  }, [user, isLead]);

  // dailyChecklistLink is pinned — too operationally important to be hideable.
  // (Old PINNED also included ordersLink; that card is gone, mega-stat replaces it.)
  const PINNED = ['dailyChecklistLink'];

  const updateLayout = (next) => {
    setLayoutState(next);
    saveMyHomeLayout(user.id, next);
  };

  const moveCard = (id, direction) => {
    if (!layout) return;
    updateLayout({ ...layout, order: moveItem(layout.order, id, direction) });
  };

  const toggleHide = (id) => {
    if (!layout || PINNED.includes(id)) return;
    const hidden = new Set(layout.hidden || []);
    if (hidden.has(id)) hidden.delete(id); else hidden.add(id);
    updateLayout({ ...layout, hidden: Array.from(hidden) });
  };

  const submitHandoff = () => {
    if (!handoffDraft.trim()) return;
    postHandoffNote(handoffDraft, user?.name);
    setHandoffDraft('');
    setHandoffModalOpen(false);
    load();
  };

  useEffect(() => { load(); }, [load]);

  const periodicDue = Object.values(periodicAlerts).some(Boolean);

  const firstName = user?.name?.split(' ')[0] || '';
  const initials  = getInitials(user?.name);

  return (
    <div style={S.screen}>
      <div style={S.headerPersonal}>
        <div style={S.avatar}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.headerSub}>{getTimeOfDayGreeting(lang)},</div>
          <div style={S.headerTitle}>{firstName}</div>
          <div style={S.headerSubSmall}>{todayLong(lang)}</div>
        </div>
        {playlistUrl && (
          <a href={playlistUrl} target="_blank" rel="noopener noreferrer" style={S.playlistBtn} title="Today's playlist">
            ▶
          </a>
        )}
      </div>

      <div style={S.body}>
        {/* Edit Layout toolbar */}
        <div style={S.editBar}>
          <button
            style={editMode ? S.editBarBtnActive : S.editBarBtn}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode
              ? (lang === 'es' ? '✓ Listo' : '✓ Done')
              : (lang === 'es' ? '✎ Editar Inicio' : '✎ Edit Home')}
          </button>
          {editMode && (
            <span style={S.editHint}>
              {lang === 'es' ? 'Reordena · oculta · arregla a tu gusto' : 'Reorder · hide · arrange'}
            </span>
          )}
        </div>

        {(() => {
          if (!layout) return null;
          const order = layout.order || [];
          const hidden = new Set(layout.hidden || []);

          // ── Card registry — each key maps to a render function ────────────
          const CARDS = {
            weather: () => weather && (
              <div style={S.weatherStrip}>
                <div style={S.weatherNow}>
                  <span style={S.weatherIcon}>{weatherCodeToIcon(weather.currentCode).icon}</span>
                  <div>
                    <div style={S.weatherTemp}>{weather.currentTemp}°F</div>
                    <div style={S.weatherSub}>
                      {weatherCodeToIcon(weather.currentCode).label} · {(weatherDrinkSuggestion(weather.currentTemp))[lang]}
                    </div>
                  </div>
                </div>
                {weather.daily && weather.daily.length > 0 && (
                  <div style={S.weatherDays}>
                    {weather.daily.slice(0, 3).map((d, i) => {
                      const w = weatherCodeToIcon(d.code);
                      const dt = new Date(d.date + 'T12:00:00');
                      return (
                        <div key={d.date} style={S.weatherDayPill}>
                          <div style={S.weatherDayLbl}>{i === 0 ? (lang === 'es' ? 'Hoy' : 'Today') : dt.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div style={{ fontSize: 14 }}>{w.icon}</div>
                          <div style={S.weatherDayHL}>{d.high}° / {d.low}°</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ),
            birthdays: () => birthdays.length > 0 && (
              <div style={S.birthdayCard}>
                <span style={{ fontSize: 18 }}>🎂</span>
                <div style={{ flex: 1 }}>
                  {birthdays.slice(0, 2).map(({ employee, date }) => {
                    const isToday = (new Date()).toDateString() === date.toDateString();
                    return (
                      <div key={employee.id} style={S.birthdayLine}>
                        <b style={{ color: '#D4AF37' }}>{employee.name}</b>
                        {isToday
                          ? <span style={{ marginLeft: 6, fontWeight: 700 }}> — {lang === 'es' ? '¡es hoy!' : "it's today!"}</span>
                          : <span style={{ marginLeft: 6, color: '#aaa' }}> — {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>}
                      </div>
                    );
                  })}
                  {birthdays.length > 2 && (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>+ {birthdays.length - 2} more this week</div>
                  )}
                </div>
              </div>
            ),
            briefing: () => {
              // Always render — each column shows a positive empty state
              // ("Nothing — full menu", "No note — all clear") so a fresh
              // dashboard tells the user "we're in good shape today" rather
              // than disappearing.
              const locationStale = locationUpdatedAt
                && (Date.now() - new Date(locationUpdatedAt).getTime()) > 12 * 60 * 60 * 1000;
              return (
                <div className="quez-hero-grid" style={S.heroCard}>
                  {/* Col 1 — 86'd first (most operationally urgent) */}
                  <div style={{ ...S.heroCol, ...(eightySixed.length > 0 ? S.heroCol86 : {}) }}>
                    <div style={S.heroColLabel}>{lang === 'es' ? '86\'D HOY' : '86\'D TODAY'}</div>
                    {eightySixed.length > 0 ? (
                      <div style={{ ...S.heroColBody, color: '#FFB3B3', fontWeight: 700 }}>
                        {eightySixed.map((m) => m.name).join(', ')}
                      </div>
                    ) : (
                      <div style={{ ...S.heroColBody, color: '#6a6a6a' }}>
                        {lang === 'es' ? 'Nada — menú completo' : 'Nothing — full menu'}
                      </div>
                    )}
                  </div>
                  {/* Col 2 — Where's Quez (with stale flag) */}
                  <div style={{ ...S.heroCol, ...(locationStale ? S.heroColStale : {}) }}>
                    <div style={S.heroColLabel}>
                      📍 {lang === 'es' ? 'HOY EN' : 'TODAY AT'}
                      {locationStale && <span style={S.heroStaleHint}> · {lang === 'es' ? 'desactualizado' : 'stale'}</span>}
                    </div>
                    <div style={S.heroColBody}>{location || (lang === 'es' ? 'Sin ubicación' : 'No location set')}</div>
                    {seasonal && (
                      <div style={S.heroColSub}>🌟 {seasonal}</div>
                    )}
                  </div>
                  {/* Col 3 — Note for next shift (latest hand-off) */}
                  <div style={S.heroCol}>
                    <div style={S.heroColLabel}>📝 {lang === 'es' ? 'NOTA DE TURNO' : 'SHIFT NOTE'}</div>
                    {handoffNote ? (
                      <>
                        <div style={S.heroColBody}>"{handoffNote.text}"</div>
                        <div style={S.heroColSub}>— {handoffNote.byName} · {fmtRelTime(handoffNote.at)}</div>
                      </>
                    ) : (
                      <div style={{ ...S.heroColBody, color: '#6a6a6a', fontStyle: 'italic' }}>
                        {lang === 'es' ? 'Sin nota — todo limpio' : 'No note — all clear'}
                      </div>
                    )}
                  </div>
                </div>
              );
            },
            megaStat: () => (
              <button style={S.megaStatBtn} onClick={() => !editMode && navigate('orders')}>
                <div style={S.megaStatNum}>{openOrderCount}</div>
                <div style={S.megaStatLbl}>
                  {openOrderCount === 1
                    ? (lang === 'es' ? 'pedido en la cola' : 'order on deck')
                    : (lang === 'es' ? 'pedidos en la cola' : 'orders on deck')}
                </div>
                <div style={S.megaStatSub}>
                  {lang === 'es' ? 'toca para abrir la cola' : 'tap to open queue'} ›
                </div>
              </button>
            ),
            // Bar-wide drinks-served-today tile. Trish's #1 ask after a week
            // of use — barista-personal count wasn't what she needed; she
            // wanted the whole-trailer total at a glance.
            barTotal: () => (
              <div style={S.barTotalCard}>
                <div style={S.barTotalLeft}>
                  <div style={S.barTotalNum}>{todayDrinkTotal}</div>
                  <div style={S.barTotalLbl}>
                    {lang === 'es' ? 'bebidas hoy · barra completa' : 'drinks today · whole bar'}
                  </div>
                </div>
                <div style={S.barTotalRight}>
                  <div style={S.barTotalMine}>
                    {lang === 'es' ? 'mías' : 'mine'}: <b style={{ color: '#D4AF37' }}>{myDrinksToday}</b>
                  </div>
                  {dailyGoal > 0 && (
                    <div style={S.barTotalMine}>
                      {lang === 'es' ? 'meta' : 'goal'}: <b style={{ color: '#888' }}>{dailyGoal}</b>
                    </div>
                  )}
                </div>
              </div>
            ),
            myRecentDrinks: () => myRecentDrinks.length > 0 && (
              <div style={S.miniCard}>
                <div style={S.miniLabel}>
                  {lang === 'es'
                    ? `Mis Últimas ${myRecentDrinks.length}`
                    : `My Last ${myRecentDrinks.length} ${myRecentDrinks.length === 1 ? 'Drink' : 'Drinks'}`}
                  <span style={{ marginLeft: 8, color: '#666', fontWeight: 400, fontSize: 10, fontStyle: 'italic' }}>
                    {lang === 'es' ? 'toca para ver receta' : 'tap to view recipe'}
                  </span>
                </div>
                {myRecentDrinks.map((d, i) => {
                  const mods = (d.modifiers || []).filter((m) => !m.startsWith('__custom__:'));
                  const customNote = (d.modifiers || []).find((m) => m.startsWith('__custom__:'));
                  const customText = customNote ? customNote.slice('__custom__:'.length) : '';
                  return (
                    <button
                      key={d.orderId + '_' + i}
                      onClick={() => {
                        if (editMode) return;
                        const drink = drinkRecipes.find((dr) => dr.id === d.drinkId);
                        if (drink) setRecipeModal({ drink, size: d.size, prep: d.prepType, modifiers: d.modifiers || [], note: d.note || '' });
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #1a1a1a',
                        padding: '7px 2px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        color: '#F5F0E8',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: '#ddd', fontSize: 13, fontWeight: 600 }}>{d.drinkName}</span>
                          <span style={{ color: '#666', fontSize: 11, marginLeft: 6 }}>· {d.size}</span>
                          <span style={{
                            color: '#888', fontSize: 10, marginLeft: 6,
                            textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700,
                          }}>
                            {d.prepType}
                          </span>
                        </div>
                        <span style={{ color: '#888', fontSize: 11, flexShrink: 0 }}>{fmtRelTime(d.completedAt)}</span>
                      </div>
                      {(mods.length > 0 || customText || d.note) && (
                        <div style={{ marginTop: 3, color: '#999', fontSize: 11, fontStyle: 'italic', lineHeight: 1.35 }}>
                          {mods.map((m) => getModLabel(m, lang)).join(' · ')}
                          {mods.length > 0 && (customText || d.note) ? ' · ' : ''}
                          {customText}
                          {customText && d.note ? ' · ' : ''}
                          {d.note ? `📝 ${d.note}` : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ),
            brandStandard: () => (
              <div style={S.brandStandardCard}>
                <span style={S.brandStandardIcon}>✦</span>
                <span style={S.brandStandardText}>
                  {getTodayBrandStandard()[lang] || getTodayBrandStandard().en}
                </span>
              </div>
            ),
            // Old stats row replaced by megaStat above. Kept here only so
            // legacy saved layouts still resolve — renders the "my drinks
            // today" stat compactly.
            stats: () => (
              <div style={S.miniCard}>
                <div style={S.miniLabel}>{lang === 'es' ? 'Mis Bebidas Hoy' : 'My Drinks Today'}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#D4AF37', fontFamily: 'Georgia, serif' }}>
                  {myDrinksToday}
                </div>
              </div>
            ),
            goal: () => dailyGoal > 0 && (
              <div style={S.miniCard}>
                <div style={S.goalHeader}>
                  <span style={S.miniLabel}>{lang === 'es' ? 'Meta Diaria' : 'Daily Goal'}</span>
                  {streak > 0 && <span style={S.streakPill}>🔥 {streak}-{lang === 'es' ? 'día' : 'day'} streak</span>}
                </div>
                <div style={S.goalRow}>
                  <div style={S.goalBar}>
                    <div style={{ ...S.goalBarFill, width: `${Math.min(100, (todayDrinkTotal / dailyGoal) * 100)}%` }} />
                  </div>
                  <span style={S.goalCount}>{todayDrinkTotal} / {dailyGoal}</span>
                </div>
              </div>
            ),
            quickActions: () => (
              <div style={S.quickRow}>
                <button style={S.quickBtn} onClick={() => navigate('wasteLog')}>
                  <span style={S.quickIcon}>🗑</span>
                  <span style={S.quickLabel}>{lang === 'es' ? 'Desperdicio' : 'Waste'}</span>
                </button>
                {isLead && (
                  <button style={S.quickBtn} onClick={() => navigate('inventory')}>
                    <span style={S.quickIcon}>📦</span>
                    <span style={S.quickLabel}>{lang === 'es' ? 'Inventario' : 'Inventory'}</span>
                  </button>
                )}
                <button style={S.quickBtn} onClick={() => setHandoffModalOpen(true)}>
                  <span style={S.quickIcon}>📝</span>
                  <span style={S.quickLabel}>{lang === 'es' ? 'Nota Turno' : 'Note for next shift'}</span>
                </button>
              </div>
            ),
            weekStats: () => weekStats.drinks > 0 && (
              <div style={S.miniCard}>
                <div style={S.miniLabel}>{lang === 'es' ? 'Mi Semana' : 'My Week So Far'}</div>
                <div style={S.weekStatsRow}>
                  <div style={S.weekStat}>
                    <div style={S.weekStatNum}>{weekStats.drinks}</div>
                    <div style={S.weekStatLbl}>{lang === 'es' ? 'bebidas' : 'drinks'}</div>
                  </div>
                </div>
              </div>
            ),
            achievements: () => achievements.length > 0 && (
              <div style={S.miniCard}>
                <div style={S.miniLabel}>{lang === 'es' ? 'Logros' : 'Achievements'}</div>
                <div style={S.achievementRow}>
                  {achievements.map((a) => (
                    <span key={a.id} style={S.achievementPill}>
                      <span style={{ fontSize: 16 }}>{a.icon}</span>
                      <span>{a.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            ),
            // LOW STOCK = AMBER (money-bleeding, not shutdown-grade).
            // Numeric values rounded for display — raw inventory may hold
            // fractional units like 2.987 gal from deduction; show 3.0.
            lowStock: () => isLead && lowStock.length > 0 && (
              <div style={{ ...S.miniCard, border: '1px solid rgba(255,184,74,0.45)', background: 'rgba(255,184,74,0.04)' }}>
                <div style={S.miniLabel}>
                  <span style={{ color: '#FFB84A' }}>⚠ {lang === 'es' ? 'Stock Bajo' : 'Low Stock'}</span>
                </div>
                {lowStock.map((i) => {
                  const onHand = Number.isInteger(i.onHand) ? i.onHand : Math.round((i.onHand ?? 0) * 10) / 10;
                  return (
                    <div key={i.id} style={S.shiftLine}>
                      <span style={{ color: '#ddd' }}>{i.name}</span>
                      <span style={{ color: '#FFB84A' }}>{onHand}/{i.par} {i.unit}</span>
                    </div>
                  );
                })}
              </div>
            ),
            // DAILY CHECKLIST = RED border when pending (regulatory; shutdown-grade).
            dailyChecklistLink: () => (
              <button
                style={{
                  ...S.linkCard,
                  ...(!checklistSubmitted ? { border: '2px solid #E05252', background: 'rgba(224,82,82,0.04)' } : {}),
                }}
                onClick={() => !editMode && navigate('dailyChecklist')}
              >
                <span style={S.linkIcon}>☑</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ ...S.linkTitle, ...(!checklistSubmitted ? { color: '#FFB3B3' } : {}) }}>
                    {lang === 'es' ? 'Lista Diaria' : 'Daily Checklist'}
                  </div>
                  <div style={S.linkSub}>
                    {checklistSubmitted
                      ? (lang === 'es' ? 'Enviada hoy ✓' : 'Submitted today ✓')
                      : (lang === 'es' ? 'PENDIENTE — apertura, medio servicio, cierre' : 'PENDING — open, mid, close')}
                  </div>
                </div>
                <span style={S.chev}>›</span>
              </button>
            ),
            // ordersLink + drinkGuideLink removed from barista CARDS — orders
            // are reached via the mega-stat tap target; drink guide is now a
            // primary nav tab. Saved layouts referencing these ids are
            // silently dropped by the knownIds.filter() below.

            // Periodic checklist link — same red-bordered treatment as the
            // daily checklist when anything is due. Periodic submissions feed
            // DIAL compliance and equipment-maintenance records, so a missed
            // periodic is in the same shutdown-grade category as daily.
            periodicLink: () => isLead && (
              <button
                style={{
                  ...S.linkCard,
                  ...(periodicDue ? { border: '2px solid #E05252', background: 'rgba(224,82,82,0.04)' } : {}),
                }}
                onClick={() => !editMode && navigate('periodicChecklists')}
              >
                <span style={S.linkIcon}>📅</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ ...S.linkTitle, ...(periodicDue ? { color: '#FFB3B3' } : {}) }}>
                    {lang === 'es' ? 'Listas Periódicas' : 'Periodic Checklists'}
                  </div>
                  <div style={S.linkSub}>
                    {periodicDue
                      ? (lang === 'es' ? 'PENDIENTE — semanal · mensual · trimestral · anual' : 'PENDING — weekly · monthly · quarterly · annual')
                      : (lang === 'es' ? 'Todo al día ✓' : 'All current ✓')}
                  </div>
                </div>
                <span style={S.chev}>›</span>
              </button>
            ),
          };

          // Compute renderable cards (apply migration for forward-compat)
          const knownIds = Object.keys(CARDS);
          const safeOrder = order.filter((id) => knownIds.includes(id));
          knownIds.forEach((id) => { if (!safeOrder.includes(id)) safeOrder.push(id); });

          // Empty-state hint when user has hidden every hideable card OR no card has content yet
          const noVisibleContent = safeOrder.every((id) => {
            if (hidden.has(id)) return true;
            const c = CARDS[id]?.();
            return !c;
          });
          if (noVisibleContent && !editMode) {
            return (
              <div style={S.emptyHomeHint}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🪟</div>
                <div style={{ fontSize: 14, color: '#aaa', marginBottom: 12 }}>
                  {lang === 'es' ? 'Has ocultado todas las tarjetas — o ninguna tiene contenido todavía.' : "You've hidden all home cards — or nothing has content yet."}
                </div>
                <button style={S.editBarBtnActive} onClick={() => setEditMode(true)}>
                  ✎ {lang === 'es' ? 'Editar Inicio' : 'Edit Home'}
                </button>
              </div>
            );
          }
          return safeOrder.map((id, idx) => {
            const content = CARDS[id]?.();
            // Skip cards that have no content right now, unless in edit mode
            // (in edit mode show a stub so the user can still reorder them)
            const isPinned = PINNED.includes(id);
            const isHidden = hidden.has(id);
            if (!editMode && (isHidden || !content)) return null;
            return (
              <div key={id} style={S.cardWrapper}>
                {content || (
                  <div style={S.cardStub}>
                    <span style={{ color: '#666', fontSize: 11, fontStyle: 'italic' }}>
                      {lang === 'es' ? 'Vacío ahora — aparecerá cuando aplique' : 'Empty now — appears when relevant'}
                    </span>
                  </div>
                )}
                {editMode && (
                  <div style={S.cardEditOverlay}>
                    <button
                      style={{ ...S.cardEditBtn, opacity: idx === 0 ? 0.3 : 1 }}
                      disabled={idx === 0}
                      onClick={() => moveCard(id, 'up')}
                      title="Move up"
                    >↑</button>
                    <button
                      style={{ ...S.cardEditBtn, opacity: idx === safeOrder.length - 1 ? 0.3 : 1 }}
                      disabled={idx === safeOrder.length - 1}
                      onClick={() => moveCard(id, 'down')}
                      title="Move down"
                    >↓</button>
                    {isPinned ? (
                      <span style={S.cardPinned} title="Pinned — can't be hidden">📌</span>
                    ) : (
                      <button
                        style={{ ...S.cardEditBtn, color: isHidden ? '#E05252' : '#D4AF37' }}
                        onClick={() => toggleHide(id)}
                        title={isHidden ? 'Show' : 'Hide'}
                      >{isHidden ? '🚫' : '👁'}</button>
                    )}
                  </div>
                )}
                {editMode && isHidden && <div style={S.cardHiddenOverlay} />}
              </div>
            );
          });
        })()}
      </div>

      {/* Hand-off note modal */}
      {handoffModalOpen && (
        <div style={S.overlay} onClick={() => setHandoffModalOpen(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 6 }}>✦</div>
            <h3 style={{ color: '#F5F0E8', fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
              {lang === 'es' ? 'Nota para el Próximo Turno' : 'Note for the Next Shift'}
            </h3>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {lang === 'es' ? 'Visible para todos durante 24 horas.' : 'Visible to everyone for 24 hours.'}
            </div>
            <textarea
              autoFocus
              value={handoffDraft}
              onChange={(e) => setHandoffDraft(e.target.value)}
              placeholder={lang === 'es' ? 'p. ej. la espresso #2 está lenta, revisar al abrir' : 'e.g. espresso #2 is dragging — descale at open'}
              maxLength={240}
              rows={4}
              style={{
                width: '100%',
                background: '#0D0D0D',
                border: '1px solid #333',
                borderRadius: 8,
                color: '#F5F0E8',
                fontFamily: 'inherit',
                fontSize: 14,
                padding: '10px 12px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={{ flex: 1, padding: 11, background: '#0D0D0D', border: '1px solid #333', borderRadius: 8, color: '#888', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setHandoffModalOpen(false)}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button style={{ flex: 2, padding: 11, background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: handoffDraft.trim() ? 1 : 0.5 }} disabled={!handoffDraft.trim()} onClick={submitHandoff}>
                {lang === 'es' ? 'Publicar' : 'Post Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe modal — opened from "My Last 5 Drinks" tap; same build flow
          as the Orders RECIPE button so mid-rush re-reference is one tap. */}
      {recipeModal && (() => {
        const { drink, size, prep, modifiers = [], note = '' } = recipeModal;
        const ingredients = drink.ingredients?.[size] || [];
        const steps = drink.buildSteps?.[prep] || [];
        const visibleMods = modifiers.filter((m) => !m.startsWith('__custom__:'));
        const customMods = modifiers
          .filter((m) => m.startsWith('__custom__:'))
          .map((m) => m.slice('__custom__:'.length));
        return (
          <div style={S.overlay} onClick={() => setRecipeModal(null)}>
            <div style={{ ...S.modal, maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ color: '#D4AF37', fontSize: 18, marginBottom: 4 }}>✦</div>
              <h3 style={{ color: '#F5F0E8', fontSize: 19, fontWeight: 700, margin: '0 0 6px' }}>{drink.name}</h3>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#222', border: '1px solid #333', borderRadius: 4, padding: '2px 6px', color: '#aaa' }}>{size}</span>
                <span style={{ fontSize: 11, fontWeight: 700, border: '1px solid #555', borderRadius: 4, padding: '2px 6px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{prep}</span>
                {drink.buildTime && <span style={{ color: '#888', fontSize: 12, marginLeft: 4 }}>⏱ {drink.buildTime}</span>}
              </div>

              {(visibleMods.length > 0 || customMods.length > 0 || note) && (
                <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800, marginBottom: 6 }}>
                    {lang === 'es' ? 'Personalizaciones' : 'Customizations'}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {visibleMods.map((m) => (
                      <span key={m} style={{ fontSize: 12, background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', borderRadius: 5, padding: '2px 8px' }}>{getModLabel(m, lang)}</span>
                    ))}
                    {customMods.map((c, i) => (
                      <span key={'c' + i} style={{ fontSize: 12, background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.35)', color: '#D4AF37', borderRadius: 5, padding: '2px 8px' }}>{c}</span>
                    ))}
                    {note && (
                      <span style={{ fontSize: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid #444', color: '#ddd', borderRadius: 5, padding: '2px 8px', fontStyle: 'italic' }}>📝 {note}</span>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 7 }}>
                  {lang === 'es' ? 'Ingredientes' : 'Ingredients'}
                </div>
                {ingredients.map((ing, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#ddd', marginBottom: 4, lineHeight: 1.4 }}>
                    <span style={{ color: '#D4AF37' }}>·</span> {ing}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 7 }}>
                  {lang === 'es' ? 'Pasos' : 'Build Steps'}
                </div>
                {steps.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#ddd', lineHeight: 1.5 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>

              {drink.tip && (
                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#ccc', lineHeight: 1.5, marginBottom: 14 }}>
                  💡 {drink.tip}
                </div>
              )}

              <button
                style={{ width: '100%', padding: 11, background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
                onClick={() => setRecipeModal(null)}
              >
                {lang === 'es' ? 'Cerrar' : 'Close'}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  screen: {
    background: '#0D0D0D',
    minHeight: '100vh',
    color: '#F5F0E8',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    paddingBottom: 100,
  },
  header: {
    background: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    padding: '20px 20px 14px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  body: { padding: '14px 16px' },

  card: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 800,
    marginBottom: 12,
  },
  bigStat: { fontSize: 42, fontFamily: 'Georgia, serif', color: '#D4AF37', fontWeight: 700, lineHeight: 1 },
  bigStatSub: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 14 },
  phaseList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  phaseRow: { display: 'flex', alignItems: 'center', gap: 10 },

  btnGold: {
    width: '100%',
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    padding: '12px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: '12px 10px',
    textAlign: 'center',
  },
  statLabel: { fontSize: 10, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 },
  statValue: { fontSize: 18, color: '#F5F0E8', fontWeight: 700, fontFamily: 'Georgia, serif' },

  headerPersonal: {
    background: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    padding: '20px 18px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #D4AF37, #B8941C)',
    color: '#0D0D0D',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Georgia, serif',
    fontSize: 20,
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: '0 0 0 2px #0D0D0D, 0 0 0 3px rgba(212,175,55,0.45)',
  },
  headerSubSmall: { fontSize: 11, color: '#666', marginTop: 1 },
  headerSubLight: { fontSize: 12, color: '#888', marginBottom: 0 },
  emptyHomeHint: {
    background: '#111',
    border: '1px dashed #2A2A2A',
    borderRadius: 12,
    padding: '32px 20px',
    textAlign: 'center',
    marginTop: 8,
  },
  playlistBtn: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.10)',
    border: '1px solid rgba(212,175,55,0.45)',
    color: '#D4AF37',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    textDecoration: 'none',
    flexShrink: 0,
  },

  weatherStrip: {
    background: 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 12,
  },
  weatherNow: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 },
  weatherIcon: { fontSize: 30, lineHeight: 1, flexShrink: 0 },
  weatherTemp: { fontSize: 24, fontFamily: 'Georgia, serif', color: '#F5F0E8', fontWeight: 700, lineHeight: 1 },
  weatherSub: { fontSize: 11, color: '#aaa', marginTop: 3, lineHeight: 1.35 },
  weatherDays: { display: 'flex', gap: 6 },
  weatherDayPill: {
    flex: 1,
    background: '#0D0D0D',
    border: '1px solid #222',
    borderRadius: 8,
    padding: '6px 4px',
    textAlign: 'center',
  },
  weatherDayLbl: { fontSize: 9, color: '#888', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  weatherDayHL: { fontSize: 11, color: '#ddd', marginTop: 1 },

  birthdayCard: {
    background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.04))',
    border: '1px solid rgba(212,175,55,0.40)',
    borderRadius: 12,
    padding: '12px 14px',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  birthdayLine: { fontSize: 13, color: '#F5F0E8', lineHeight: 1.45 },

  payRow: { display: 'flex', gap: 12, alignItems: 'stretch' },
  payStat: { flex: 1, textAlign: 'center' },
  payNum:     { fontSize: 22, fontFamily: 'Georgia, serif', color: '#F5F0E8', fontWeight: 700 },
  payNumGold: { fontSize: 22, fontFamily: 'Georgia, serif', color: '#D4AF37', fontWeight: 700 },
  payLbl: { fontSize: 10, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, marginTop: 3 },

  achievementRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  achievementPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(212,175,55,0.10)',
    border: '1px solid rgba(212,175,55,0.40)',
    color: '#D4AF37',
    borderRadius: 16,
    padding: '5px 11px',
    fontSize: 12,
    fontWeight: 700,
  },

  // Layout edit mode
  editBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  editBarBtn: {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.40)',
    color: '#D4AF37',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  editBarBtnActive: {
    background: 'linear-gradient(180deg, #E6C661, #D4AF37)',
    border: 'none',
    color: '#0D0D0D',
    borderRadius: 8,
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  editHint: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  cardWrapper: { position: 'relative', marginBottom: 10 },
  cardStub: { background: '#0D0D0D', border: '1px dashed #2A2A2A', borderRadius: 10, padding: 12, textAlign: 'center' },
  cardEditOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    display: 'flex',
    gap: 4,
    background: 'rgba(13,13,13,0.92)',
    border: '1px solid rgba(212,175,55,0.40)',
    borderRadius: 8,
    padding: '4px 5px',
    zIndex: 2,
    backdropFilter: 'blur(6px)',
  },
  cardEditBtn: {
    width: 26,
    height: 26,
    background: 'transparent',
    border: 'none',
    color: '#D4AF37',
    borderRadius: 5,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  cardPinned: {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
  },
  cardHiddenOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(13,13,13,0.55)',
    border: '1px dashed #555',
    borderRadius: 12,
    pointerEvents: 'none',
  },

  briefingCard: {
    background: '#111',
    border: '1px solid rgba(212,175,55,0.40)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 12,
  },

  // ── HERO CARD ──────────────────────────────────────────────────────────
  // Three columns on landscape tablet, stacks to single column on phone
  // via the .quez-hero-grid class in App.css.
  heroCard: {
    background: '#111',
    border: '1px solid rgba(212,175,55,0.40)',
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroCol: {
    padding: '12px 14px',
    minWidth: 0,
  },
  heroCol86: {
    background: 'rgba(224,82,82,0.06)',
  },
  heroColStale: {
    background: 'rgba(255,184,74,0.06)',
  },
  heroColLabel: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: '0.12em',
    fontWeight: 800,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroColBody: {
    fontSize: 14,
    color: '#F5F0E8',
    lineHeight: 1.4,
    fontWeight: 600,
  },
  heroColSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    lineHeight: 1.4,
  },
  heroStaleHint: {
    color: '#FFB84A',
    fontWeight: 600,
    fontStyle: 'italic',
  },

  // ── MEGA STAT ──────────────────────────────────────────────────────────
  megaStatBtn: {
    width: '100%',
    background: 'linear-gradient(180deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02) 70%)',
    border: '1px solid rgba(212,175,55,0.45)',
    borderRadius: 14,
    padding: '20px 16px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#F5F0E8',
    textAlign: 'center',
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  megaStatNum: {
    fontSize: 56,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    color: '#D4AF37',
    lineHeight: 1,
  },
  megaStatLbl: {
    fontSize: 13,
    color: '#F5F0E8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginTop: 4,
  },
  megaStatSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // ── BAR TOTAL ──────────────────────────────────────────────────────────
  barTotalCard: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  barTotalLeft: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  barTotalNum: {
    fontSize: 32,
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 700,
    color: '#F5F0E8',
    lineHeight: 1,
  },
  barTotalLbl: {
    fontSize: 11,
    color: '#888',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginTop: 4,
  },
  barTotalRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 3,
    fontSize: 12,
    color: '#aaa',
  },
  barTotalMine: {
    fontSize: 12,
    color: '#aaa',
  },
  briefingLabel: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 800,
    marginBottom: 10,
  },
  briefingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  briefingIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  briefingText: {
    fontSize: 13,
    color: '#ddd',
    lineHeight: 1.4,
  },
  handoffNote: {
    background: 'rgba(212,175,55,0.07)',
    border: '1px solid rgba(212,175,55,0.30)',
    borderRadius: 7,
    padding: '8px 11px',
    marginTop: 6,
  },
  handoffMeta: { fontSize: 10, color: '#D4AF37', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 },
  handoffText: { fontSize: 13, color: '#F5F0E8', fontStyle: 'italic', lineHeight: 1.4 },

  brandStandardCard: {
    background: 'rgba(212,175,55,0.05)',
    border: '1px dashed rgba(212,175,55,0.30)',
    borderRadius: 10,
    padding: '10px 14px',
    marginBottom: 14,
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  brandStandardIcon: { color: '#D4AF37', fontSize: 13, marginTop: 1 },
  brandStandardText: { fontSize: 12, color: '#ccc', lineHeight: 1.45, fontStyle: 'italic' },

  goalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  streakPill: { fontSize: 10, color: '#FFB13B', fontWeight: 800, letterSpacing: '0.04em' },
  goalRow: { display: 'flex', alignItems: 'center', gap: 10 },
  goalBar: { flex: 1, height: 8, background: '#222', borderRadius: 4, overflow: 'hidden' },
  goalBarFill: { height: '100%', background: 'linear-gradient(90deg, #D4AF37, #E6C661)', borderRadius: 4, transition: 'width 0.4s ease' },
  goalCount: { fontSize: 13, fontWeight: 700, color: '#D4AF37', minWidth: 64, textAlign: 'right' },

  quickRow: { display: 'flex', gap: 6, marginBottom: 10 },
  quickBtn: {
    flex: 1,
    background: '#111',
    border: '1px solid #2A2A2A',
    color: '#D4AF37',
    borderRadius: 10,
    padding: '10px 6px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    transition: 'transform 0.12s ease, background 0.15s ease',
  },
  quickIcon: { fontSize: 18 },
  quickLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' },

  weekStatsRow: { display: 'flex', justifyContent: 'space-around', textAlign: 'center' },
  weekStat: { flex: 1 },
  weekStatNum: { fontSize: 22, fontFamily: 'Georgia, serif', color: '#D4AF37', fontWeight: 700 },
  weekStatLbl: { fontSize: 10, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700, marginTop: 2 },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#1A1A1A', border: '1px solid #D4AF37', borderRadius: 14, padding: '22px 20px', width: '100%', maxWidth: 420 },

  miniCard: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 10, padding: '11px 14px', marginBottom: 10 },
  miniLabel: { fontSize: 10, color: '#888', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 },
  miniRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  miniPill: { display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(76,175,80,0.10)', border: '1px solid rgba(76,175,80,0.35)', color: '#7BB37B', borderRadius: 14, padding: '4px 10px', fontSize: 12, fontWeight: 600 },
  miniDot: { width: 6, height: 6, borderRadius: '50%', background: '#4CAF50' },
  shiftLine: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid #1a1a1a' },

  linkCard: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    textAlign: 'left',
  },
  practiceCard: {
    width: '100%',
    background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02) 70%)',
    border: '1px solid rgba(212,175,55,0.50)',
    borderRadius: 12,
    padding: '14px 16px',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    cursor: 'pointer',
    marginBottom: 10,
  },
  linkIcon: { fontSize: 22, width: 32, textAlign: 'center', flexShrink: 0 },
  linkTitle: { fontSize: 15, fontWeight: 700, color: '#F5F0E8' },
  linkSub: { fontSize: 12, color: '#888', marginTop: 2 },
  chev: { fontSize: 22, color: '#555', flexShrink: 0 },
  dotAlert: { width: 9, height: 9, borderRadius: '50%', background: '#E05252', flexShrink: 0 },
};
