// ============================================================
// QUEZ APP LITE — OrderScreen.jsx
// KDS-style order view. Orders flow in from Square Terminal webhooks
// (Q4 2026 integration). Until Square is live, an owner-only demo
// seeder pushes mock orders so the queue can be exercised end-to-end.
//
// Two tabs:
//   1. Queue   — live orders with timer, urgency, RECIPE drilldown
//   2. Recent  — last completed orders with recall
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { drinkRecipes } from '../data/drinkRecipes';
import { MODIFIER_GROUPS, getModLabel, visibleOptions, visibleGroups } from '../data/drinkModifiers';
import { fmtClock } from '../utils/timeFormat';
import {
  getActiveOrders,
  addOrder,
  updateOrderItems,
  cancelOrder,
  completeOrder,
  getNextOrderNumber,
  getRecentCompletedOrders,
  getRecentCancelledOrders,
  updateOrderNote,
  saveActiveOrders,
  logAudit,
  getBuildTimeStats,
} from '../utils/storage';

const PREP_LABELS = {
  hot:     { en: 'Hot',     es: 'Caliente' },
  iced:    { en: 'Iced',    es: 'Frío' },
  blended: { en: 'Blended', es: 'Licuado' },
};

const PREP_COLORS = {
  hot:     '#F07B7B',
  iced:    '#7BB3F0',
  blended: '#B37BF0',
};

function availablePreps(drink) {
  return Object.keys(drink.buildSteps);
}

function newItemId() {
  return 'itm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

// Canonical "h:mm am" — see src/utils/timeFormat.js
const formatClock = fmtClock;

// Detect "honey added to a cold drink that has espresso" — raw honey/syrup must
// be mixed with the hot espresso first to dissolve. The warning only makes sense
// when there's actually a hot espresso shot in the build (so a pure cold brew,
// chai, or lemonade with extra honey shouldn't show "mix with HOT espresso").
function drinkHasEspresso(drinkId) {
  const drink = drinkRecipes.find((d) => d.id === drinkId);
  if (!drink) return false;
  const ingredients = Object.values(drink.ingredients || {}).flat().join(' ');
  const steps = Object.values(drink.buildSteps || {}).flat().join(' ');
  return /espresso/i.test(ingredients) || /espresso/i.test(steps);
}
function hasColdHoneyMix(item) {
  if (!item) return false;
  const isCold = item.prepType === 'iced' || item.prepType === 'blended';
  const mods = item.modifiers || [];
  if (!isCold || !mods.includes('extra_honey')) return false;
  return drinkHasEspresso(item.drinkId);
}

const HONEY_WARN = {
  en: 'SPECIAL — Mix added honey into HOT espresso BEFORE adding ice. Honey will not dissolve in cold liquid.',
  es: 'ESPECIAL — Mezcla la miel agregada con espresso CALIENTE ANTES del hielo. La miel no se disuelve en líquido frío.',
};

// KDS urgency thresholds (seconds). Green = building, yellow = aging, red = late.
const URGENCY_YELLOW_S = 180;
const URGENCY_RED_S    = 300;

function ageSeconds(createdAt) {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
}
function urgencyTier(seconds) {
  if (seconds >= URGENCY_RED_S)    return 'red';
  if (seconds >= URGENCY_YELLOW_S) return 'yellow';
  return 'green';
}
// Per-order urgency keyed off the order's build-time target. The barista has
// something concrete to beat instead of a hidden global threshold. Falls
// back to the old time-based tiers when no target is available.
function urgencyTierByTarget(seconds, targetSec) {
  if (!targetSec || targetSec <= 0) return urgencyTier(seconds);
  if (seconds >= targetSec + 60) return 'red';
  if (seconds >= targetSec)      return 'yellow';
  return 'green';
}
const URGENCY_COLOR = {
  green:  '#4CAF50',
  yellow: '#FFB84A',
  red:    '#E05252',
};

// Day-one fallback when getBuildTimeStats has no history yet. Numbers picked
// from real bar timing on a typical 12oz drink.
const FALLBACK_TARGET_SEC = { espresso: 90, drip: 30, iced: 60, blended: 90 };
// Minimum completed-order samples before the per-prep baseline is trusted.
// Below this we use the fallback — one fast test completion shouldn't drag
// the target down to ":10" and make every later ticket look impossibly slow.
const BASELINE_MIN_SAMPLES = 5;

// Slowest-prep target for an order. Hot prep splits into espresso vs drip via
// the recipe's tags.usesEspresso flag so a 12oz drip coffee doesn't share a
// 90-second target with a double-shot latte.
function targetSecondsForOrder(order, baseline) {
  const recipeIsEspresso = (drinkId) => {
    const d = drinkRecipes.find((dr) => dr.id === drinkId);
    return !!(d && d.tags && d.tags.usesEspresso);
  };
  const targets = (order.items || []).map((it) => {
    let key = it.prepType;
    if (key === 'hot') key = recipeIsEspresso(it.drinkId) ? 'espresso' : 'drip';
    const bucket = baseline?.byPrep?.[key];
    const trustable = bucket && bucket.count >= BASELINE_MIN_SAMPLES && bucket.avgSec > 0;
    return trustable ? bucket.avgSec : (FALLBACK_TARGET_SEC[key] || 60);
  });
  return targets.length ? Math.max(...targets) : 0;
}

// "5:09 / 3:30" timer label. Target stays terse to fit the pill.
function fmtTimerWithTarget(seconds, targetSec) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const cur = `${m}:${s.toString().padStart(2, '0')}`;
  if (!targetSec) return cur;
  const tm = Math.floor(targetSec / 60);
  const ts = targetSec % 60;
  return `${cur} / ${tm}:${ts.toString().padStart(2, '0')}`;
}

// Shared AudioContext that persists across chime calls. iOS Safari blocks audio
// before a user gesture has occurred — we unlock it via the first user click
// captured on the screen (see audioUnlock effect below).
let sharedAudioCtx = null;
function getAudioCtx() {
  if (sharedAudioCtx) return sharedAudioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  sharedAudioCtx = new Ctx();
  return sharedAudioCtx;
}

// Two-tone chime when a new order lands. Resumes a suspended context if needed.
function playNewOrderChime() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);              // A5
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.16);       // E5
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore — audio is a nice-to-have, never a blocker
  }
}

// Single-tone urgent chime when a ticket crosses into red (≥ 5 min). Lower,
// softer, only fires once per ticket — escalation, not alarm.
function playUrgentChime() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);              // A4 — lower than new-order
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.75);
  } catch {
    // ignore
  }
}

export default function OrderScreen() {
  const { currentUser, language } = useApp();
  const lang = language || 'en';
  const isOwnerOrManager = currentUser?.role === 'owner' || currentUser?.role === 'manager';
  const isTrainee = currentUser?.role === 'trainee';

  const [view, setView]               = useState('queue');      // 'queue' | 'recent'
  const [recentDays, setRecentDays]   = useState(1);             // 1 = today only, 7 = last week (owner/mgr only)
  const [recentCancelled, setRecentCancelled] = useState(null); // for undo snackbar
  const [customModInput, setCustomModInput] = useState('');     // inline custom mod text (edit picker)
  const [pickerDrink, setPickerDrink] = useState(null);         // drink being configured in picker modal
  const [editingItemId, setEditingItemId] = useState(null);     // when editing an item already in an order
  const [editingOrder, setEditingOrder]   = useState(null);     // the queue order being edited
  const [pickerSize, setPickerSize]   = useState('12oz');
  const [pickerPrep, setPickerPrep]   = useState('hot');
  const [pickerMods, setPickerMods]   = useState([]);
  const [pickerNote, setPickerNote]   = useState('');
  const [activeOrders, setActiveOrders] = useState([]);
  // Inline recipe expansion on KDS tiles. Only one item can be expanded at a
  // time across the whole queue — tapping another item's RECIPE swaps focus.
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [toast, setToast]             = useState(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [nameEditOrder, setNameEditOrder] = useState(null);  // order being inline-edited for orderNote
  const [nameEditDraft, setNameEditDraft] = useState('');
  const [cancelModal, setCancelModal] = useState(null);   // order awaiting cancel reason
  const [cancelOtherText, setCancelOtherText] = useState('');
  // Catering order builder — owner/manager only. Line-item builder: each
  // line is one (drink, size, prep, qty). The whole order ships as ONE
  // ticket with window='catering' so the bar sees a single labeled order.
  const [cateringModal, setCateringModal] = useState(false);
  const [cateringLines, setCateringLines] = useState([]);  // [{drinkId, size, prepType, qty}]
  const [cateringTime, setCateringTime] = useState('');  // 'HH:MM' (today) or '' for now
  const [cateringNote, setCateringNote] = useState('');

  const loadOrders = useCallback(() => {
    setActiveOrders(getActiveOrders());
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // 5-second poll so future Square webhook arrivals show up without a user
  // gesture. Visibility-aware: when the iPad screen is off or the app is
  // backgrounded, the poll is suspended (saves ~25% battery on a 5-hour
  // shift). Re-fires immediately on resume so the queue is current.
  useEffect(() => {
    let intervalId = null;
    const start = () => {
      if (intervalId) return;
      loadOrders();
      intervalId = setInterval(loadOrders, 5000);
    };
    const stop = () => {
      if (!intervalId) return;
      clearInterval(intervalId);
      intervalId = null;
    };
    if (document.visibilityState === 'visible') start();
    const onVis = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      stop();
    };
  }, [loadOrders]);

  // Chime when a brand-new REAL non-catering order appears. Practice orders
  // are training noise; catering orders are owner-scheduled in advance and
  // don't need an immediate ding (their pickup time is the alert).
  const previousOrderIdsRef = useRef(null);
  useEffect(() => {
    const currentIds = new Set(activeOrders.map((o) => o.id));
    if (previousOrderIdsRef.current === null) {
      previousOrderIdsRef.current = currentIds;
      return;
    }
    const arrived = activeOrders.filter(
      (o) => !previousOrderIdsRef.current.has(o.id) && !o.practice && o.window !== 'catering',
    );
    if (arrived.length > 0) playNewOrderChime();
    previousOrderIdsRef.current = currentIds;
  }, [activeOrders]);

  // Track tickets that have already escalated to red so the urgent chime
  // fires at most once per order. Also skips practice orders (same reason).
  const redAlertedIdsRef = useRef(new Set());
  useEffect(() => {
    if (view !== 'queue') return;
    activeOrders.forEach((o) => {
      if (o.practice) return;
      const age = ageSeconds(o.createdAt);
      const tier = urgencyTier(age);
      if (tier === 'red' && !redAlertedIdsRef.current.has(o.id)) {
        redAlertedIdsRef.current.add(o.id);
        playUrgentChime();
      }
    });
    // Garbage-collect ids that are no longer in the queue (completed/cancelled)
    const currentIds = new Set(activeOrders.map((o) => o.id));
    redAlertedIdsRef.current.forEach((id) => {
      if (!currentIds.has(id)) redAlertedIdsRef.current.delete(id);
    });
  });

  // Audio unlock — iOS Safari + Chrome autoplay policies block AudioContext
  // until a user gesture occurs. First click anywhere in the screen counts,
  // and we resume the shared context so subsequent chimes play.
  useEffect(() => {
    if (audioUnlocked) return undefined;
    const unlock = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      setAudioUnlocked(true);
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [audioUnlocked]);

  // 1-second tick so per-order timers in the Queue view update live.
  // eslint-disable-next-line no-unused-vars
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    if (view !== 'queue' || activeOrders.length === 0) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [view, activeOrders.length]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Picker (edit path only — opens prefilled from existing queue item) ──
  const editExistingItem = (item, order = null) => {
    const drink = drinkRecipes.find((d) => d.id === item.drinkId);
    if (!drink) return;
    setPickerDrink(drink);
    setPickerSize(item.size);
    setPickerPrep(item.prepType);
    setPickerMods(item.modifiers || []);
    setPickerNote(item.note || '');
    setEditingItemId(item.itemId);
    setEditingOrder(order);
  };

  const closePicker = () => {
    setPickerDrink(null);
    setPickerMods([]);
    setPickerNote('');
    setEditingItemId(null);
    setEditingOrder(null);
  };

  // When prep changes, drop any temp/ice options that no longer apply
  const changePickerPrep = (newPrep) => {
    setPickerPrep(newPrep);
    setPickerMods((prev) => {
      const tempIceGroup = MODIFIER_GROUPS.find((g) => g.id === 'temp_ice');
      const stillVisible = new Set(visibleOptions(tempIceGroup, newPrep, pickerDrink).map((o) => o.id));
      const tempIceIds = new Set(tempIceGroup.options.map((o) => o.id));
      return prev.filter((id) => !tempIceIds.has(id) || stillVisible.has(id));
    });
  };

  const toggleMod = (group, optionId) => {
    setPickerMods((prev) => {
      const isSelected = prev.includes(optionId);
      if (group.multi) {
        return isSelected ? prev.filter((id) => id !== optionId) : [...prev, optionId];
      }
      // Single-select group: replace any other selection in this group
      const groupIds = new Set(group.options.map((o) => o.id));
      const withoutGroup = prev.filter((id) => !groupIds.has(id));
      return isSelected ? withoutGroup : [...withoutGroup, optionId];
    });
  };

  const confirmPicker = () => {
    if (!pickerDrink || !editingItemId || !editingOrder) return;
    const itemBase = {
      drinkId: pickerDrink.id,
      drinkName: pickerDrink.name,
      size: pickerSize,
      prepType: pickerPrep,
      modifiers: pickerMods,
      note: pickerNote.trim(),
    };
    const newItems = editingOrder.items.map((it) =>
      it.itemId === editingItemId ? { ...it, ...itemBase } : it
    );
    updateOrderItems(editingOrder.id, newItems);
    loadOrders();
    closePicker();
    showToast(lang === 'es' ? 'Pedido actualizado' : 'Order updated');
  };

  // ─── Practice seeder (all roles, pre-Square integration) ─────────────────
  // Practice orders are flagged so completeOrder() skips the drink_log — keeps
  // reports clean while baristas drill or owners test KDS workflow.
  const seedPracticeOrders = () => {
    const samples = drinkRecipes.slice(0, 12);
    const now = Date.now();
    // Ages tuned to cross all 3 urgency tiers: green, green, yellow, red
    const ageSpecs = [25, 100, 220, 360];
    // Seeder mixes both windows so the bar sees both pills in the same queue
    const windows = ['drive-thru', 'walk-up', 'drive-thru', 'walk-up'];
    const customers = ['Sarah K.', 'Mike R.', 'Lauren P.', 'Jay D.'];
    const sizes = ['12oz', '16oz'];

    for (let i = 0; i < 4; i++) {
      const drink = samples[Math.floor(Math.random() * samples.length)];
      const preps = Object.keys(drink.buildSteps || {});
      const prep = preps[Math.floor(Math.random() * preps.length)] || 'hot';
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const item = {
        itemId: newItemId(),
        drinkId: drink.id,
        drinkName: drink.name,
        size,
        prepType: prep,
        modifiers: [],
        note: '',
        done: false,
      };
      addOrder({
        id: 'ord_prac_' + Date.now() + '_' + i,
        number: getNextOrderNumber(),
        createdAt: new Date(now - ageSpecs[i] * 1000).toISOString(),
        takenBy: 'PRACTICE',
        items: [item],
        orderNote: customers[i],
        window: windows[i],
        tip: 0,
        practice: true,
      });
    }
    loadOrders();
    showToast(lang === 'es' ? '4 pedidos de práctica agregados' : '4 practice orders added');
  };

  // Add a custom modifier on-the-fly inside the picker
  const addCustomMod = () => {
    const trimmed = customModInput.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}`;
    // Store as a synthetic id that we'll render via fallback in getModLabel
    setPickerMods((p) => [...p, `__custom__:${trimmed}`]);
    setCustomModInput('');
    void id;
  };

  // ─── Queue handlers ──────────────────────────────────────────────────────
  // Default line factory — picks the first available prep so the dropdown
  // can never start out-of-sync with the recipe's buildSteps map.
  const makeCateringLine = (drink, qty = 6) => {
    const d = drink || drinkRecipes[0];
    const preps = Object.keys(d?.buildSteps || { hot: 1 });
    return {
      lineKey: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      drinkId: d?.id,
      size: '12oz',
      prepType: preps[0] || 'hot',
      qty,
    };
  };

  // Open the catering builder with one starter line (owner/manager only).
  const openCateringModal = () => {
    setCateringLines([makeCateringLine(drinkRecipes[0])]);
    setCateringTime('');
    setCateringNote('');
    setCateringModal(true);
  };

  // Mutate one line in the array immutably.
  const updateCateringLine = (lineKey, patch) => {
    setCateringLines((prev) => prev.map((ln) => {
      if (ln.lineKey !== lineKey) return ln;
      const next = { ...ln, ...patch };
      // If the drink changed, the previous prepType may not exist on the
      // new recipe — clamp it to the new recipe's first valid prep.
      if (patch.drinkId && patch.drinkId !== ln.drinkId) {
        const d = drinkRecipes.find((dr) => dr.id === patch.drinkId);
        const preps = Object.keys(d?.buildSteps || { hot: 1 });
        if (!preps.includes(next.prepType)) next.prepType = preps[0] || 'hot';
      }
      return next;
    }));
  };

  const removeCateringLine = (lineKey) => {
    setCateringLines((prev) => prev.filter((ln) => ln.lineKey !== lineKey));
  };

  // Total drinks across all lines (drives the Create button label).
  const cateringTotalQty = cateringLines.reduce((sum, ln) => sum + (parseInt(ln.qty, 10) || 0), 0);
  const cateringValid = cateringLines.length > 0 && cateringTotalQty > 0 &&
    cateringLines.every((ln) => ln.drinkId && (parseInt(ln.qty, 10) || 0) > 0);

  // Flatten all lines into one items[] array and ship as a single ticket.
  const createCateringOrder = () => {
    if (!cateringValid) return;
    let createdAt;
    if (cateringTime) {
      // Parse HH:MM today. If the time is earlier than now, treat as tomorrow.
      const [hh, mm] = cateringTime.split(':').map((n) => parseInt(n, 10));
      const sched = new Date();
      sched.setHours(hh || 0, mm || 0, 0, 0);
      if (sched.getTime() < Date.now()) sched.setDate(sched.getDate() + 1);
      createdAt = sched.toISOString();
    } else {
      createdAt = new Date().toISOString();
    }
    const items = [];
    for (const ln of cateringLines) {
      const drink = drinkRecipes.find((d) => d.id === ln.drinkId);
      if (!drink) continue;
      const qty = Math.max(1, parseInt(ln.qty, 10) || 1);
      for (let i = 0; i < qty; i++) {
        items.push({
          itemId: newItemId(),
          drinkId: drink.id,
          drinkName: drink.name,
          size: ln.size,
          prepType: ln.prepType,
          modifiers: [],
          note: '',
          done: false,
        });
      }
    }
    if (items.length === 0) return;
    addOrder({
      id: 'ord_cater_' + Date.now(),
      number: getNextOrderNumber(),
      createdAt,
      takenBy: currentUser?.name || 'Catering',
      items,
      orderNote: cateringNote.trim(),
      window: 'catering',
      tip: 0,
    });
    setCateringModal(false);
    loadOrders();
    showToast(lang === 'es'
      ? `Pedido de catering de ${items.length} bebidas creado`
      : `${items.length}-drink catering order created`);
  };

  // Toggle visual "built" state on a single line — strikethrough so the
  // barista doesn't double-build a drink on a multi-drink ticket. Cosmetic
  // only: Mark Complete still works regardless of which lines are checked.
  const toggleItemBuilt = (order, itemId) => {
    const items = order.items.map((it) =>
      it.itemId === itemId ? { ...it, built: !it.built } : it
    );
    updateOrderItems(order.id, items);
    loadOrders();
  };

  const handleCompleteOrder = (order) => {
    // Trainees can only complete practice orders. Real orders are read-only.
    if (isTrainee && !order.practice) {
      showToast(lang === 'es'
        ? 'Solo pedidos de práctica pueden cerrarse en modo trainee'
        : 'Trainees can only complete practice orders');
      return;
    }
    const completed = completeOrder(order.id);
    loadOrders();
    if (completed) {
      showToast(lang === 'es' ? `Pedido #${order.number} completado` : `Order #${order.number} completed`);
    }
  };

  const handleCancelOrder = (order) => {
    if (isTrainee && !order.practice) {
      showToast(lang === 'es'
        ? 'Solo pedidos de práctica pueden cancelarse en modo trainee'
        : 'Trainees can only cancel practice orders');
      return;
    }
    // Open the reason modal for EVERY cancel — including practice. Reason:
    // (a) practice mode should rehearse the full real flow, including the
    // pick-a-reason habit; (b) earlier code skipped the modal for practice
    // and made the new feature look broken in dev. The storage layer
    // already skips writing the cancelled-history entry for practice orders.
    setCancelOtherText('');
    setCancelModal(order);
  };

  // Applies the actual cancellation after the reason has been chosen (or skipped
  // for practice orders). Pulls the undo-snackbar back to its original behavior.
  const finishCancel = (order, reason) => {
    cancelOrder(order.id, reason);
    logAudit('order_cancelled', {
      orderId: order.id,
      orderNumber: order.number,
      reason: reason?.category || null,
      reasonNote: reason?.note || null,
      by: currentUser?.name,
    });
    setRecentCancelled(order);
    loadOrders();
    setTimeout(() => {
      setRecentCancelled((cur) => (cur && cur.id === order.id ? null : cur));
    }, 6000);
  };

  const undoCancel = () => {
    if (!recentCancelled) return;
    const restored = recentCancelled;
    const orders = getActiveOrders();
    orders.unshift(restored);
    saveActiveOrders(orders);
    logAudit('order_uncancelled', { orderId: restored.id, orderNumber: restored.number, by: currentUser?.name });
    setRecentCancelled(null);
    loadOrders();
    showToast(lang === 'es' ? 'Cancelación deshecha' : 'Cancellation undone');
  };

  // Move a completed order back into the active queue (recall)
  const handleRecallOrder = (order) => {
    if (!window.confirm(lang === 'es'
      ? `¿Volver a abrir pedido #${order.number}? Sus bebidas ya están contadas hoy.`
      : `Reopen order #${order.number}? Its drinks have already been counted today.`)) return;
    const orders = getActiveOrders();
    // Reset items' done flag so they need to be re-completed
    const reopened = { ...order, items: order.items.map((it) => ({ ...it, done: false })), reopenedAt: new Date().toISOString() };
    delete reopened.completedAt;
    orders.unshift(reopened);
    saveActiveOrders(orders);
    loadOrders();
    setView('queue');
    showToast(lang === 'es' ? `Pedido #${order.number} reabierto` : `Order #${order.number} reopened`);
  };

  // Inline recipe block — rendered inside the order tile so the barista can
  // read the recipe without losing the order context (other items, modifiers,
  // timer). No photo to keep the tile lean.
  const renderInlineRecipe = (item) => {
    const drink = drinkRecipes.find((d) => d.id === item.drinkId);
    if (!drink) return null;
    const ingredients = drink.ingredients[item.size] || [];
    const baseSteps = drink.buildSteps[item.prepType] || [];
    const needsHoneyMix = hasColdHoneyMix({
      drinkId: drink.id, prepType: item.prepType, modifiers: item.modifiers,
    });
    const steps = needsHoneyMix
      ? [
          (lang === 'es'
            ? '** PRIMERO: Mezcla la bomba extra de miel con espresso CALIENTE en taza separada hasta disolver. NO la pongas directamente sobre hielo. **'
            : '** FIRST: Mix the extra honey pump with HOT espresso in a separate cup until dissolved. DO NOT pour directly onto ice. **'),
          ...baseSteps,
        ]
      : baseSteps;
    return (
      <div style={S.inlineRecipe}>
        <div style={S.inlineRecipeHeader}>
          <span style={S.inlineRecipeTitle}>{drink.name}</span>
          <span style={S.inlineRecipeMeta}>
            ⏱ {drink.buildTime}
          </span>
        </div>
        {ingredients.length > 0 && (
          <div style={S.inlineRecipeBlock}>
            <div style={S.inlineRecipeLabel}>
              {lang === 'es' ? 'Ingredientes' : 'Ingredients'}
            </div>
            {ingredients.map((ing, i) => (
              <div key={i} style={S.inlineRecipeIng}>
                <span style={{ color: '#D4AF37' }}>·</span> {ing}
              </div>
            ))}
          </div>
        )}
        <div style={S.inlineRecipeBlock}>
          <div style={S.inlineRecipeLabel}>
            {lang === 'es' ? 'Pasos' : 'Build Steps'}
          </div>
          {steps.map((s, i) => (
            <div key={i} style={S.inlineRecipeStep}>
              <span style={S.inlineRecipeStepNum}>{i + 1}</span>
              <span style={{ color: '#ddd' }}>{s}</span>
            </div>
          ))}
        </div>
        {drink.tip && (
          <div style={S.inlineRecipeTip}>💡 {drink.tip}</div>
        )}
      </div>
    );
  };

  // ─── Render: Take Order ──────────────────────────────────────────────────
  // ─── Render: Queue ───────────────────────────────────────────────────────
  const renderQueue = () => {
    if (activeOrders.length === 0) {
      return (
        <div style={S.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
          <div style={S.emptyTitle}>
            {lang === 'es' ? 'Todo al día' : 'All caught up'}
          </div>
          <div style={S.emptyBody}>
            {lang === 'es'
              ? 'Sin pedidos esperando. Square Terminal alimentará pedidos aquí en vivo.'
              : 'No drinks in the queue. Square Terminal will feed live orders here.'}
          </div>
          <button style={S.demoBtn} onClick={seedPracticeOrders}>
            ✦ {lang === 'es' ? 'Ronda de Práctica (4 pedidos)' : 'Practice Round (4 orders)'}
          </button>
          <div style={S.demoBtnHint}>
            {lang === 'es'
              ? 'Pedidos de práctica no cuentan en los reportes.'
              : 'Practice orders don\'t count toward reports.'}
          </div>
          {isOwnerOrManager && (
            <button
              style={{ ...S.demoBtn, marginTop: 10 }}
              onClick={openCateringModal}
            >
              🎂 {lang === 'es' ? 'Nuevo Pedido de Catering' : 'New Catering Order'}
            </button>
          )}
        </div>
      );
    }

    // Sort the queue oldest-first so the visual layout matches build order
    // (top-left = build next). Real orders always come before practice; within
    // each group, oldest createdAt wins. The first tile gets the NEXT UP badge.
    const sortedActiveOrders = [...activeOrders].sort((a, b) => {
      if (!!a.practice !== !!b.practice) return a.practice ? 1 : -1;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const nextUpId = sortedActiveOrders.find((o) => !o.practice)?.id
      || sortedActiveOrders[0]?.id;
    // Pull the 7-day build-time baseline once per render — gives the timer
    // pill a concrete target like "5:09 / 3:30" instead of an opaque urgency
    // color. Cheap (localStorage read) so no need to memoize.
    const buildBaseline = getBuildTimeStats(7);

    return (
      <div style={S.queueList}>
        {sortedActiveOrders.map((order) => {
          const total = order.items.length;
          const hasSpecial = order.items.some(hasColdHoneyMix);
          const isNextUp = order.id === nextUpId && sortedActiveOrders.length > 1;
          const ageMin = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
          const isStale = ageMin >= 30;
          const age   = ageSeconds(order.createdAt);
          const targetSec = targetSecondsForOrder(order, buildBaseline);
          const tier  = urgencyTierByTarget(age, targetSec);
          const tierColor = URGENCY_COLOR[tier];
          // Honey-cold-mix safety border takes precedence over age-based urgency.
          const urgencyBorder = !hasSpecial && tier !== 'green'
            ? { border: `1px solid ${tierColor}`, boxShadow: `0 0 0 1px ${tierColor}22 inset` }
            : {};
          return (
            <div key={order.id} style={{ ...S.orderCard, ...urgencyBorder, ...(hasSpecial ? S.orderCardSpecial : {}) }}>
              {hasSpecial && (
                <div
                  className={age < 5 ? 'quez-special-pulse' : undefined}
                  style={S.specialBanner}
                >
                  ⚠ {lang === 'es' ? 'PEDIDO ESPECIAL' : 'SPECIAL ORDER'} —{' '}
                  {lang === 'es' ? 'revisa la instrucción de miel' : 'see honey-mix step'}
                </div>
              )}
              {/* 3-zone header: order # (left), timer (center), window (right). */}
              <div style={S.orderHeader}>
                <div style={S.orderHeaderLeft}>
                  <div style={{ ...S.orderNumber, ...(hasSpecial ? { color: '#FFB3B3' } : {}) }}>
                    {lang === 'es' ? 'Pedido' : 'Order'} #{order.number}
                    {order.window === 'catering' && new Date(order.createdAt).getTime() > Date.now() && (
                      <span style={{ color: '#D4AF37', fontSize: 11, marginLeft: 8, fontWeight: 600 }}>
                        {lang === 'es' ? 'para ' : 'for '}{formatClock(order.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={S.orderHeaderCenter}>
                  <div style={{ ...S.timerPill, color: tierColor, borderColor: tierColor }}>
                    ⏱ {fmtTimerWithTarget(age, targetSec)}
                  </div>
                </div>
                <div style={S.orderHeaderRight}>
                  {order.window && (() => {
                    const styles = order.window === 'drive-thru' ? S.windowPillDrive
                      : order.window === 'catering' ? S.windowPillCatering
                      : S.windowPillWalk;
                    const icon = order.window === 'drive-thru' ? '🚗'
                      : order.window === 'catering' ? '🎂'
                      : '🚶';
                    const label = order.window === 'drive-thru'
                      ? (lang === 'es' ? 'Auto-Servicio' : 'Drive Thru')
                      : order.window === 'catering'
                      ? (lang === 'es' ? 'Catering' : 'Catering')
                      : (lang === 'es' ? 'Ventanilla' : 'Walk Up');
                    return (
                      <div style={{ ...S.windowPill, ...styles }}>
                        {icon} <span style={{ marginLeft: 4 }}>{label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Meta line: NEXT UP badge, customer name, drink count when >1,
                  stale-age warning when >30 min. Renders only when non-empty. */}
              {(isNextUp || order.orderNote || total > 1 || isStale) && (
                <div style={S.orderSubMeta}>
                  {isNextUp && (
                    <span style={S.nextUpBadge}>
                      ◉ {lang === 'es' ? 'SIGUIENTE' : 'NEXT UP'}
                    </span>
                  )}
                  {/* Customer name chip — only renders if there's a name. Pencil
                      alone (no chip) appears when name is empty so the barista
                      can still tap to add. */}
                  <button
                    onClick={() => {
                      setNameEditOrder(order);
                      setNameEditDraft(order.orderNote || '');
                    }}
                    style={order.orderNote ? S.nameEditChip : S.nameEditChipEmpty}
                    title={lang === 'es' ? 'Editar nombre' : 'Edit name'}
                  >
                    {order.orderNote && (
                      <span style={{ color: '#D4AF37', fontWeight: 700 }}>{order.orderNote}</span>
                    )}
                    <span style={S.nameEditPencil}>✎</span>
                  </button>
                  {total > 1 && (
                    <span style={S.progressTag}>
                      {total} {lang === 'es' ? 'bebidas' : 'drinks'}
                    </span>
                  )}
                  {isStale && (
                    <span style={S.staleBadge}>
                      ⚠ {ageMin} {lang === 'es' ? 'min' : 'min ago'}
                    </span>
                  )}
                </div>
              )}

              <div style={S.itemList}>
                {order.items.map((it) => (
                  <div key={it.itemId} style={{
                    ...S.queueItem,
                    ...(hasColdHoneyMix(it) ? S.queueItemWarn : {}),
                    ...(it.built ? S.queueItemBuilt : {}),
                  }}>
                    <div style={S.itemMain}>
                      <div style={S.itemTop}>
                        {/* Built checkbox — visual strikethrough only. Mark Complete
                            still completes the whole ticket regardless of which
                            lines are checked off. Helps prevent double-builds. */}
                        <button
                          style={{
                            background: it.built ? 'rgba(39,174,96,0.18)' : 'transparent',
                            border: it.built ? '1px solid #27AE60' : '1px solid #444',
                            color: it.built ? '#27AE60' : '#555',
                            borderRadius: 5,
                            width: 22, height: 22,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 13, fontWeight: 800,
                            padding: 0, marginRight: 6, fontFamily: 'inherit',
                          }}
                          onClick={() => toggleItemBuilt(order, it.itemId)}
                          title={lang === 'es' ? 'Marcar como hecho' : 'Mark as built'}
                          aria-pressed={!!it.built}
                        >
                          {it.built ? '✓' : ''}
                        </button>
                        <span style={{ ...S.sizePill, color: PREP_COLORS[it.prepType] }}>
                          {it.size}
                        </span>
                        <span style={{ ...S.prepPill, color: PREP_COLORS[it.prepType], borderColor: PREP_COLORS[it.prepType] }}>
                          {PREP_LABELS[it.prepType][lang]}
                        </span>
                      </div>
                      <div style={{
                        ...S.itemName,
                        ...(it.built ? { textDecoration: 'line-through', color: '#666' } : {}),
                      }}>
                        {it.drinkName}
                      </div>
                      {(it.modifiers?.length > 0 || it.note) && (
                        <div style={S.modsFrame}>
                          <span style={S.modsFrameLabel}>
                            ⚠ {lang === 'es' ? 'MODS' : 'MODS'}:
                          </span>
                          <div style={S.modsFrameContent}>
                            {(it.modifiers || []).map((mid) => (
                              <span key={mid} style={S.modTagBold}>{getModLabel(mid, lang)}</span>
                            ))}
                            {it.note && (
                              <span style={S.noteTagBold}>📝 {it.note}</span>
                            )}
                          </div>
                        </div>
                      )}
                      {hasColdHoneyMix(it) && (
                        <div style={S.itemWarn}>
                          ⚠ ** {HONEY_WARN[lang] || HONEY_WARN.en} **
                        </div>
                      )}
                    </div>
                    <div style={S.queueItemActions}>
                      <button style={S.iconBtn} onClick={() => editExistingItem(it, order)} title="Edit">✎</button>
                      <button
                        style={expandedItemId === it.itemId ? S.recipeBtnActive : S.recipeBtnSubtle}
                        onClick={() => setExpandedItemId(
                          expandedItemId === it.itemId ? null : it.itemId
                        )}
                        title="Show recipe"
                      >
                        {expandedItemId === it.itemId ? '▼ ' : ''}
                        {lang === 'es' ? 'RECETA' : 'RECIPE'}
                      </button>
                    </div>
                  </div>
                ))}
                {/* Inline recipe expansion — render the recipe for whichever
                    item in THIS order is currently expanded. Sits below the
                    item rows so the order context stays visible. */}
                {order.items.some((x) => x.itemId === expandedItemId) && (() => {
                  const it = order.items.find((x) => x.itemId === expandedItemId);
                  return renderInlineRecipe(it);
                })()}
              </div>

              {/* orderNote (customer name) lives in the header meta line —
                  no duplicate banner here. Tap the header to edit. */}

              {(() => {
                const locked = isTrainee && !order.practice;
                return (
                  <>
                    {locked && (
                      <div style={S.traineeLockHint}>
                        🔒 {lang === 'es'
                          ? 'Pedido real — solo modo lectura para trainees'
                          : 'Live order — read-only for trainees'}
                      </div>
                    )}
                    <div style={S.orderActions}>
                      <button
                        style={{ ...S.cancelBtn, ...(locked ? S.btnDisabled : {}) }}
                        disabled={locked}
                        onClick={() => handleCancelOrder(order)}
                        title={lang === 'es' ? 'Cancelar' : 'Cancel'}
                        aria-label={lang === 'es' ? 'Cancelar' : 'Cancel'}
                      >
                        ✕
                      </button>
                      <button
                        style={{ ...S.completeBtn, ...(locked ? S.btnDisabled : {}) }}
                        disabled={locked}
                        onClick={() => handleCompleteOrder(order)}
                      >
                        {lang === 'es' ? 'Marcar Completo' : 'Mark Complete'}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: Recent Completed Orders ─────────────────────────────────────
  const renderRecent = () => {
    const recent = getRecentCompletedOrders(recentDays);
    const rangeToggle = isOwnerOrManager && (
      <div style={S.rangeToggleRow}>
        <button
          style={{ ...S.rangeToggleBtn, ...(recentDays === 1 ? S.rangeToggleBtnActive : {}) }}
          onClick={() => setRecentDays(1)}
        >
          {lang === 'es' ? 'Hoy' : 'Today'}
        </button>
        <button
          style={{ ...S.rangeToggleBtn, ...(recentDays === 7 ? S.rangeToggleBtnActive : {}) }}
          onClick={() => setRecentDays(7)}
        >
          {lang === 'es' ? '7 Días' : '7 Days'}
        </button>
      </div>
    );

    if (recent.length === 0) {
      return (
        <>
          {rangeToggle}
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Nada completo todavía' : 'Nothing complete yet'}</div>
            <div style={S.emptyBody}>
              {lang === 'es'
                ? 'Ve a hacer un café. Los pedidos terminados aparecen aquí.'
                : 'Go make some coffee — completed orders land here.'}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
      {rangeToggle}
      <div style={S.queueList}>
        {recent.map((order) => {
          const itemCount = order.items.length;
          return (
            <div key={order.id} style={{ ...S.orderCard, opacity: 0.85 }}>
              {/* 3-zone header mirrors the Queue tile: order # left,
                  completion-time chip center (where the timer was on Queue),
                  window pill right. */}
              <div style={S.orderHeader}>
                <div style={S.orderHeaderLeft}>
                  <div style={S.orderNumber}>
                    {lang === 'es' ? 'Pedido' : 'Order'} #{order.number}
                  </div>
                </div>
                <div style={S.orderHeaderCenter}>
                  <div style={S.completedPill}>
                    ✓ {formatClock(order.completedAt)}
                  </div>
                </div>
                <div style={S.orderHeaderRight}>
                  {order.window && (() => {
                    const styles = order.window === 'drive-thru' ? S.windowPillDrive
                      : order.window === 'catering' ? S.windowPillCatering
                      : S.windowPillWalk;
                    const icon = order.window === 'drive-thru' ? '🚗'
                      : order.window === 'catering' ? '🎂'
                      : '🚶';
                    const label = order.window === 'drive-thru'
                      ? (lang === 'es' ? 'Auto-Servicio' : 'Drive Thru')
                      : order.window === 'catering'
                      ? (lang === 'es' ? 'Catering' : 'Catering')
                      : (lang === 'es' ? 'Ventanilla' : 'Walk Up');
                    return (
                      <div style={{ ...S.windowPill, ...styles }}>
                        {icon} <span style={{ marginLeft: 4 }}>{label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Sub-meta: customer name + drink count when >1. Mirrors the
                  Queue tile minus the NEXT UP / stale signals. */}
              {(order.orderNote || itemCount > 1) && (
                <div style={S.orderSubMeta}>
                  {order.orderNote && (
                    <span style={{ ...S.nameEditChip, cursor: 'default' }} title={order.orderNote}>
                      <span style={{ color: '#D4AF37', fontWeight: 700 }}>{order.orderNote}</span>
                    </span>
                  )}
                  {itemCount > 1 && (
                    <span style={S.progressTag}>
                      {itemCount} {lang === 'es' ? 'bebidas' : 'drinks'}
                    </span>
                  )}
                </div>
              )}

              <div style={S.itemList}>
                {order.items.map((it) => (
                  <div key={it.itemId} style={{
                    ...S.queueItem,
                    ...(it.built ? S.queueItemBuilt : {}),
                  }}>
                    <div style={S.itemMain}>
                      <div style={S.itemTop}>
                        <span style={{
                          color: '#27AE60', fontSize: 16, marginRight: 6,
                          display: 'inline-flex', alignItems: 'center',
                        }}>✓</span>
                        <span style={{ ...S.sizePill, color: PREP_COLORS[it.prepType] }}>{it.size}</span>
                        <span style={{ ...S.prepPill, color: PREP_COLORS[it.prepType], borderColor: PREP_COLORS[it.prepType] }}>
                          {PREP_LABELS[it.prepType][lang]}
                        </span>
                      </div>
                      <div style={{ ...S.itemName, textDecoration: 'line-through', color: '#666' }}>
                        {it.drinkName}
                      </div>
                      {(it.modifiers?.length > 0 || it.note) && (
                        <div style={S.modsFrame}>
                          <span style={S.modsFrameLabel}>
                            {lang === 'es' ? 'MODS' : 'MODS'}:
                          </span>
                          <div style={S.modsFrameContent}>
                            {(it.modifiers || []).map((mid) => (
                              <span key={mid} style={S.modTagBold}>{getModLabel(mid, lang)}</span>
                            ))}
                            {it.note && (
                              <span style={S.noteTagBold}>📝 {it.note}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button style={S.reopenBtn} onClick={() => handleRecallOrder(order)}>
                ↻ {lang === 'es' ? 'Reabrir Pedido' : 'Reopen Order'}
              </button>
            </div>
          );
        })}
      </div>
      </>
    );
  };

  // ─── Render: Cancelled Orders (owner/manager only) ───────────────────────
  const renderCancelled = () => {
    const cancelled = getRecentCancelledOrders(recentDays);
    const rangeToggle = isOwnerOrManager && (
      <div style={S.rangeToggleRow}>
        <button
          style={{ ...S.rangeToggleBtn, ...(recentDays === 1 ? S.rangeToggleBtnActive : {}) }}
          onClick={() => setRecentDays(1)}
        >
          {lang === 'es' ? 'Hoy' : 'Today'}
        </button>
        <button
          style={{ ...S.rangeToggleBtn, ...(recentDays === 7 ? S.rangeToggleBtnActive : {}) }}
          onClick={() => setRecentDays(7)}
        >
          {lang === 'es' ? '7 Días' : '7 Days'}
        </button>
      </div>
    );
    if (cancelled.length === 0) {
      return (
        <>
          {rangeToggle}
          <div style={S.empty}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑</div>
            <div style={S.emptyTitle}>{lang === 'es' ? 'Sin cancelaciones' : 'No cancellations'}</div>
            <div style={S.emptyBody}>
              {lang === 'es'
                ? 'Cuando se cancele un pedido, aparece aquí para investigación.'
                : "Cancelled orders show up here for owner investigation."}
            </div>
          </div>
        </>
      );
    }
    return (
      <>
        {rangeToggle}
        <div style={S.queueList}>
          {cancelled.map((order) => (
            <div key={order.id} style={{ ...S.orderCard, opacity: 0.8, borderColor: 'rgba(224,82,82,0.35)' }}>
              <div style={S.orderHeader}>
                <div>
                  <div style={{ ...S.orderNumber, color: '#FFB3B3' }}>
                    #{order.number} · {lang === 'es' ? 'CANCELADO' : 'CANCELLED'}
                  </div>
                  <div style={S.orderMeta}>
                    {lang === 'es' ? 'Tomado' : 'Taken'}: {formatClock(order.createdAt)}
                    {' · '}{lang === 'es' ? 'Cancelado' : 'Cancelled'}: {formatClock(order.cancelledAt)}
                    {order.orderNote && <> · <span style={{ color: '#D4AF37' }}>{order.orderNote}</span></>}
                  </div>
                  {order.cancelReason && (() => {
                    const labels = {
                      fat_finger:    { en: '↩ Fat finger',    es: '↩ Toque equivocado' },
                      customer_left: { en: '🚶 Customer left', es: '🚶 Cliente se fue' },
                      comp_remake:   { en: '🔁 Comp / Remake', es: '🔁 Cortesía / re-hacer' },
                      other:         { en: '· Other',          es: '· Otro' },
                    };
                    const lbl = labels[order.cancelReason.category] || labels.other;
                    return (
                      <div style={{
                        marginTop: 6,
                        display: 'inline-block',
                        background: 'rgba(224,82,82,0.08)',
                        border: '1px solid rgba(224,82,82,0.35)',
                        color: '#FFB3B3',
                        borderRadius: 6,
                        padding: '3px 8px',
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {lbl[lang] || lbl.en}
                        {order.cancelReason.note && (
                          <span style={{ marginLeft: 6, color: '#ddd', fontWeight: 400, fontStyle: 'italic' }}>
                            — {order.cancelReason.note}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div style={S.progressTag}>{order.items.length} {lang === 'es' ? 'bebidas' : 'drinks'}</div>
              </div>
              <div style={S.itemList}>
                {order.items.map((it) => (
                  <div key={it.itemId} style={{ ...S.queueItem, opacity: 0.85 }}>
                    <div style={S.itemMain}>
                      <div style={S.itemTop}>
                        <span style={{ ...S.sizePill, color: PREP_COLORS[it.prepType] }}>{it.size}</span>
                        <span style={{ ...S.prepPill, color: PREP_COLORS[it.prepType], borderColor: PREP_COLORS[it.prepType] }}>
                          {PREP_LABELS[it.prepType][lang]}
                        </span>
                      </div>
                      <div style={S.itemName}>{it.drinkName}</div>
                      {(it.modifiers?.length > 0 || it.note) && (
                        <div style={S.modsRow}>
                          {(it.modifiers || []).map((mid) => (
                            <span key={mid} style={S.modTag}>{getModLabel(mid, lang)}</span>
                          ))}
                          {it.note && <span style={S.noteTag}>📝 {it.note}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // ─── Render: Drink Picker Modal ─────────────────────────────────────────
  const renderPicker = () => {
    if (!pickerDrink) return null;
    const preps = availablePreps(pickerDrink);
    return (
      <div style={S.overlay} onClick={closePicker}>
        <div style={S.modal} onClick={(e) => e.stopPropagation()}>
          <div style={S.modalGold}>✦</div>
          <h3 style={S.modalTitle}>{pickerDrink.name}</h3>
          <div style={S.modalSub}>{pickerDrink.prepType}</div>

          {/* Size */}
          <div style={S.formLabel}>{lang === 'es' ? 'Tamaño' : 'Size'}</div>
          <div style={S.toggleRow}>
            {['12oz', '16oz'].map((s) => (
              <button
                key={s}
                style={{ ...S.toggleBtn, ...(pickerSize === s ? S.toggleBtnActiveGold : {}) }}
                onClick={() => setPickerSize(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Prep type */}
          {preps.length > 0 && (
            <>
              <div style={S.formLabel}>{lang === 'es' ? 'Preparación' : 'Prep'}</div>
              <div style={S.toggleRow}>
                {preps.map((p) => {
                  const active = pickerPrep === p;
                  const color = PREP_COLORS[p];
                  return (
                    <button
                      key={p}
                      style={{
                        ...S.toggleBtn,
                        ...(active ? { background: color + '22', border: `1px solid ${color}`, color } : {}),
                      }}
                      onClick={() => changePickerPrep(p)}
                    >
                      {PREP_LABELS[p][lang]}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Modifier groups — only the ones that apply to THIS drink */}
          <div style={S.modsSection}>
            <div style={S.modsHeader}>
              {lang === 'es' ? 'Personalizar (opcional)' : 'Customize (optional)'}
            </div>
            {(() => {
              const groupsForDrink = visibleGroups(pickerPrep, pickerDrink);
              if (groupsForDrink.length === 0) {
                return (
                  <div style={{ fontSize: 12, color: '#888', padding: '8px 0', lineHeight: 1.5 }}>
                    {lang === 'es'
                      ? 'No hay opciones rápidas para esta bebida — usa el campo de Notas abajo para personalizar.'
                      : 'No quick options for this drink — use the Notes field below to customize.'}
                  </div>
                );
              }
              return groupsForDrink.map((group) => {
                const opts = visibleOptions(group, pickerPrep, pickerDrink);
                return (
                  <div key={group.id} style={S.modGroup}>
                    <div style={S.modGroupLabel}>{group.label[lang]}</div>
                    <div style={S.modOptionsRow}>
                      {opts.map((opt) => {
                        const selected = pickerMods.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            style={{
                              ...S.modOption,
                              ...(selected ? {
                                background: group.color + '22',
                                border: `1px solid ${group.color}`,
                                color: group.color,
                              } : {}),
                            }}
                            onClick={() => toggleMod(group, opt.id)}
                          >
                            {opt.label[lang]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}

            {/* Custom modifier — one-off chip */}
            <div style={S.modGroup}>
              <div style={S.modGroupLabel}>
                {lang === 'es' ? 'Modificador personalizado' : 'Custom modifier'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={customModInput}
                  onChange={(e) => setCustomModInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomMod(); } }}
                  placeholder={lang === 'es' ? 'p. ej. medio dulce, espuma extra' : 'e.g. half-sweet, extra foam'}
                  style={{ ...S.modNoteInput, flex: 1 }}
                  maxLength={40}
                />
                <button
                  type="button"
                  style={{
                    background: 'rgba(212,175,55,0.18)',
                    border: '1px solid #D4AF37',
                    color: '#D4AF37',
                    borderRadius: 7,
                    padding: '0 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onClick={addCustomMod}
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Free-text note */}
            <div style={S.modGroup}>
              <div style={S.modGroupLabel}>
                {lang === 'es' ? 'Nota especial' : 'Special note'}
              </div>
              <input
                type="text"
                value={pickerNote}
                onChange={(e) => setPickerNote(e.target.value)}
                placeholder={lang === 'es' ? 'p. ej. nombre del cliente, alergia...' : 'e.g. customer name, allergy...'}
                style={S.modNoteInput}
                maxLength={120}
              />
            </div>
          </div>

          <div style={S.modalActions}>
            <button style={S.btnCancel} onClick={closePicker}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button style={S.btnGold} onClick={confirmPicker}>
              {editingItemId
                ? (lang === 'es' ? 'Guardar Cambios' : 'Save Changes')
                : (lang === 'es' ? 'Agregar al Pedido' : 'Add to Order')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main render ─────────────────────────────────────────────────────────
  const queueCount = activeOrders.length;

  return (
    <div style={S.screen}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Pedidos' : 'Orders'}</div>
        <div style={S.headerSub}>
          {lang === 'es' ? 'Cola de bar' : 'Bar queue'}
          {!audioUnlocked && (
            <span style={S.audioLockedHint}>
              · 🔇 {lang === 'es' ? 'toca para activar sonido' : 'tap to enable sound'}
            </span>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        <button
          style={{ ...S.tab, ...(view === 'queue' ? S.tabActive : {}) }}
          onClick={() => setView('queue')}
        >
          {lang === 'es' ? 'Cola' : 'Queue'}
          {queueCount > 0 && <span style={S.badge}>{queueCount}</span>}
        </button>
        <button
          style={{ ...S.tab, ...(view === 'recent' ? S.tabActive : {}) }}
          onClick={() => setView('recent')}
        >
          {lang === 'es' ? 'Recientes' : 'Recent'}
        </button>
        {isOwnerOrManager && (
          <button
            style={{ ...S.tab, ...(view === 'cancelled' ? S.tabActive : {}) }}
            onClick={() => setView('cancelled')}
          >
            {lang === 'es' ? 'Cancelados' : 'Cancelled'}
          </button>
        )}
      </div>

      <div style={S.body}>
        {view === 'queue'     && renderQueue()}
        {view === 'recent'    && renderRecent()}
        {view === 'cancelled' && renderCancelled()}
      </div>

      {renderPicker()}

      {/* Inline customer-name editor — opens from tapping the order header */}
      {/* Catering order builder — same drink × N qty, optional scheduled time. */}
      {cateringModal && (
        <div style={S.overlay} onClick={() => setCateringModal(false)}>
          <div style={{ ...S.modal, maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalGold}>🎂</div>
            <h3 style={S.modalTitle}>
              {lang === 'es' ? 'Nuevo Pedido de Catering' : 'New Catering Order'}
            </h3>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
              {lang === 'es'
                ? 'Mezcla bebidas en un solo ticket. Programa una hora o deja en blanco para "ahora".'
                : 'Mix drinks on one ticket. Schedule a time or leave blank for "now".'}
            </div>

            {cateringLines.map((ln, idx) => {
              const drink = drinkRecipes.find((d) => d.id === ln.drinkId);
              const preps = Object.keys(drink?.buildSteps || { hot: 1 });
              return (
                <div
                  key={ln.lineKey}
                  style={{
                    border: '1px solid rgba(212,175,55,0.15)',
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 10,
                    background: 'rgba(212,175,55,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#D4AF37', letterSpacing: '0.08em', fontWeight: 800 }}>
                      {(lang === 'es' ? 'LÍNEA ' : 'LINE ')}{idx + 1}
                    </span>
                    {cateringLines.length > 1 && (
                      <button
                        onClick={() => removeCateringLine(ln.lineKey)}
                        style={{
                          background: 'transparent', border: 'none', color: '#888',
                          fontSize: 16, cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit',
                        }}
                        aria-label="Remove line"
                      >✕</button>
                    )}
                  </div>

                  <div style={S.formLabel}>{lang === 'es' ? 'Bebida' : 'Drink'}</div>
                  <select
                    style={{ ...S.modNoteInput, paddingRight: 30 }}
                    value={ln.drinkId || ''}
                    onChange={(e) => updateCateringLine(ln.lineKey, { drinkId: e.target.value })}
                  >
                    {drinkRecipes.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={S.formLabel}>{lang === 'es' ? 'Tamaño' : 'Size'}</div>
                      <select
                        style={S.modNoteInput}
                        value={ln.size}
                        onChange={(e) => updateCateringLine(ln.lineKey, { size: e.target.value })}
                      >
                        <option value="8oz">8 oz</option>
                        <option value="12oz">12 oz</option>
                        <option value="16oz">16 oz</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={S.formLabel}>{lang === 'es' ? 'Preparación' : 'Prep'}</div>
                      <select
                        style={S.modNoteInput}
                        value={ln.prepType}
                        onChange={(e) => updateCateringLine(ln.lineKey, { prepType: e.target.value })}
                      >
                        {preps.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ width: 80 }}>
                      <div style={S.formLabel}>{lang === 'es' ? 'Cant.' : 'Qty'}</div>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={ln.qty}
                        onChange={(e) => updateCateringLine(ln.lineKey, {
                          qty: Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1)),
                        })}
                        style={S.modNoteInput}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => setCateringLines((prev) => [...prev, makeCateringLine(drinkRecipes[0])])}
              style={{
                width: '100%', padding: '10px',
                background: 'transparent',
                border: '1px dashed rgba(212,175,55,0.4)',
                borderRadius: 8, color: '#D4AF37',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                marginBottom: 12, fontFamily: 'inherit',
                letterSpacing: '0.04em',
              }}
            >
              + {lang === 'es' ? 'Agregar bebida' : 'Add drink'}
            </button>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <div style={{ flex: 1 }}>
                <div style={S.formLabel}>
                  {lang === 'es' ? 'Hora (opcional)' : 'Time (optional)'}
                </div>
                <input
                  type="time"
                  value={cateringTime}
                  onChange={(e) => setCateringTime(e.target.value)}
                  style={S.modNoteInput}
                />
              </div>
              <div style={{ flex: 2 }}>
                <div style={S.formLabel}>
                  {lang === 'es' ? 'Nota (cliente, evento)' : 'Note (customer, event)'}
                </div>
                <input
                  type="text"
                  value={cateringNote}
                  onChange={(e) => setCateringNote(e.target.value)}
                  placeholder={lang === 'es' ? 'Methodist, 7:00 AM' : 'Methodist, 7:00 AM'}
                  maxLength={80}
                  style={S.modNoteInput}
                />
              </div>
            </div>

            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setCateringModal(false)}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                style={{ ...S.btnGold, opacity: cateringValid ? 1 : 0.5 }}
                disabled={!cateringValid}
                onClick={createCateringOrder}
              >
                {lang === 'es'
                  ? `Crear (${cateringTotalQty} bebida${cateringTotalQty !== 1 ? 's' : ''})`
                  : `Create (${cateringTotalQty} drink${cateringTotalQty !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel reason modal — 3-button quick-pick + free-text fallback. */}
      {cancelModal && (() => {
        const order = cancelModal;
        const close = () => setCancelModal(null);
        const pick = (category) => {
          close();
          finishCancel(order, { category, note: '' });
        };
        const pickOther = () => {
          const note = cancelOtherText.trim();
          if (!note) return;
          close();
          finishCancel(order, { category: 'other', note });
        };
        const btn = (label, sub, color, onClick) => (
          <button
            onClick={onClick}
            style={{
              display: 'block', width: '100%',
              background: 'transparent',
              border: `1px solid ${color}`,
              color, borderRadius: 8,
              padding: '11px 12px',
              fontFamily: 'inherit', cursor: 'pointer',
              marginBottom: 8, textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.02em' }}>{label}</div>
            {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{sub}</div>}
          </button>
        );
        return (
          <div style={S.overlay} onClick={close}>
            <div style={{ ...S.modal, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
              <div style={S.modalGold}>✦</div>
              <h3 style={S.modalTitle}>
                {lang === 'es' ? `Cancelar Pedido #${order.number}` : `Cancel Order #${order.number}`}
              </h3>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                {lang === 'es' ? '¿Por qué se cancela? Esto va al registro de auditoría.' : 'Why is this being cancelled? Goes into the audit log.'}
              </div>
              {btn(
                lang === 'es' ? '↩ Toque equivocado' : '↩ Fat finger',
                lang === 'es' ? 'Toqué Cancelar por error' : 'Tapped Cancel by mistake',
                '#888', () => pick('fat_finger'),
              )}
              {btn(
                lang === 'es' ? '🚶 Cliente se fue' : '🚶 Customer left',
                lang === 'es' ? 'El cliente no esperó' : 'They didn\'t wait for the drink',
                '#FFB84A', () => pick('customer_left'),
              )}
              {btn(
                lang === 'es' ? '🔁 Cortesía / re-hacer' : '🔁 Comp / Remake',
                lang === 'es' ? 'Bebida mala, se reharia' : 'Drink was off — rebuilding',
                '#E05252', () => pick('comp_remake'),
              )}
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                  {lang === 'es' ? 'Otro motivo' : 'Other reason'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={cancelOtherText}
                    onChange={(e) => setCancelOtherText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') pickOther(); }}
                    placeholder={lang === 'es' ? 'Describe brevemente' : 'Describe briefly'}
                    maxLength={80}
                    style={{ ...S.modNoteInput, flex: 1 }}
                  />
                  <button
                    onClick={pickOther}
                    disabled={!cancelOtherText.trim()}
                    style={{
                      background: cancelOtherText.trim() ? '#D4AF37' : '#2A2A2A',
                      color: cancelOtherText.trim() ? '#0D0D0D' : '#555',
                      border: 'none', borderRadius: 7, padding: '0 14px',
                      fontWeight: 800, fontSize: 12, cursor: cancelOtherText.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit',
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
              <button
                onClick={close}
                style={{
                  width: '100%', marginTop: 4,
                  background: 'transparent', border: 'none',
                  color: '#666', fontSize: 12, padding: 8,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {lang === 'es' ? 'No cancelar — volver' : 'Don\'t cancel — back'}
              </button>
            </div>
          </div>
        );
      })()}

      {nameEditOrder && (
        <div style={S.overlay} onClick={() => setNameEditOrder(null)}>
          <div style={{ ...S.modal, maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalGold}>✦</div>
            <h3 style={S.modalTitle}>
              {lang === 'es' ? 'Nombre del Cliente' : 'Customer Name'}
            </h3>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              {lang === 'es'
                ? `Etiqueta visible para pedido #${nameEditOrder.number}.`
                : `Tag visible on order #${nameEditOrder.number}.`}
            </div>
            <input
              autoFocus
              value={nameEditDraft}
              onChange={(e) => setNameEditDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateOrderNote(nameEditOrder.id, nameEditDraft);
                  setNameEditOrder(null);
                  loadOrders();
                  showToast(lang === 'es' ? 'Nombre guardado' : 'Name saved');
                }
              }}
              placeholder={lang === 'es' ? 'p. ej. Sarah, mesa 2' : 'e.g. Sarah, table 2'}
              maxLength={40}
              style={S.modNoteInput}
            />
            <div style={S.modalActions}>
              <button style={S.btnCancel} onClick={() => setNameEditOrder(null)}>
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                style={S.btnGold}
                onClick={() => {
                  updateOrderNote(nameEditOrder.id, nameEditDraft);
                  setNameEditOrder(null);
                  loadOrders();
                  showToast(lang === 'es' ? 'Nombre guardado' : 'Name saved');
                }}
              >
                {lang === 'es' ? 'Guardar' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={S.toast}>{toast}</div>}

      {recentCancelled && (
        <div style={S.undoBar}>
          <span>
            {lang === 'es'
              ? `Pedido #${recentCancelled.number} cancelado`
              : `Order #${recentCancelled.number} cancelled`}
          </span>
          <button style={S.undoBtn} onClick={undoCancel}>
            {lang === 'es' ? '↩ Deshacer' : '↩ Undo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const S = {
  screen: {
    backgroundColor: '#0D0D0D',
    minHeight: '100vh',
    color: '#F5F0E8',
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    paddingBottom: 100,
  },
  header: {
    background: '#1A1A1A',
    borderBottom: '1px solid #D4AF37',
    padding: '20px 20px 14px',
    textAlign: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  audioLockedHint: { marginLeft: 6, color: '#FFB84A', fontStyle: 'italic' },
  rangeToggleRow: { display: 'flex', gap: 6, marginBottom: 12 },
  rangeToggleBtn: {
    background: '#1A1A1A',
    border: '1px solid #333',
    color: '#888',
    borderRadius: 14,
    padding: '4px 12px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.06em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  rangeToggleBtnActive: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
  },

  tabBar: {
    display: 'flex',
    gap: 4,
    margin: '14px 14px 0',
    background: '#1A1A1A',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: { background: '#2A2A2A', color: '#D4AF37' },
  badge: {
    background: '#D4AF37',
    color: '#0D0D0D',
    fontSize: 11,
    fontWeight: 800,
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: '12px 14px 100px' },

  // Repeat-last quick action
  repeatBtn: {
    width: '100%',
    background: 'rgba(212,175,55,0.10)',
    border: '1px solid rgba(212,175,55,0.45)',
    color: '#D4AF37',
    borderRadius: 10,
    padding: '11px 12px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    marginBottom: 12,
    fontFamily: 'inherit',
  },

  // Category filter chips
  catFilter: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  catChip: {
    background: '#1A1A1A',
    border: '1px solid #333',
    borderRadius: 16,
    color: '#888',
    fontSize: 12,
    padding: '5px 12px',
    cursor: 'pointer',
  },
  catChipActive: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
  },

  // Drink grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  tile: {
    background: '#161616',
    border: '1px solid rgba(212,175,55,0.15)',
    borderRadius: 12,
    padding: '14px 12px',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 4,
    minHeight: 86,
    transition: 'transform 0.12s ease, border-color 0.15s ease',
  },
  tileName: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1.2,
    fontFamily: '\'Playfair Display\', Georgia, serif',
    color: '#F5F0E8',
  },
  tilePrep: {
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 600,
    marginTop: 4,
  },

  // Draft order bar (sticky)
  draftBar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 80,
    background: '#1A1A1A',
    borderTop: '2px solid #D4AF37',
    padding: '12px 14px',
    boxShadow: '0 -4px 18px rgba(0,0,0,0.5)',
    maxHeight: 280,
    overflowY: 'auto',
    zIndex: 5,
  },
  draftHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  draftTitle: { color: '#D4AF37', fontWeight: 700, fontSize: 14 },
  sendBtn: {
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
  },
  draftList: { display: 'flex', flexDirection: 'column', gap: 5 },
  draftItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: '#0D0D0D',
    border: '1px solid #222',
    borderRadius: 7,
    padding: '6px 10px',
  },
  draftItemTop: { display: 'flex', alignItems: 'center', gap: 7 },
  draftName: { fontSize: 13, color: '#F5F0E8', flex: 1 },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 14,
    padding: '0 4px',
  },
  editBtnSmall: {
    background: 'none',
    border: '1px solid #333',
    color: '#888',
    borderRadius: 5,
    width: 22,
    height: 22,
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: 'inherit',
  },
  iconBtn: {
    background: 'transparent',
    border: '1px solid #333',
    color: '#888',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 12,
    flexShrink: 0,
  },
  queueItemActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    alignItems: 'center',
  },
  orderNoteBanner: {
    background: 'rgba(212,175,55,0.08)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37',
    borderRadius: 6,
    padding: '7px 10px',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 10,
  },
  orderNoteInput: {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 7,
    color: '#F5F0E8',
    fontFamily: 'inherit',
    fontSize: 12,
    padding: '7px 10px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: 8,
  },
  tipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 7,
    padding: '4px 10px',
  },
  tipLabel: {
    fontSize: 11,
    color: '#888',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  tipPrefix: { color: '#D4AF37', fontWeight: 700, fontSize: 14 },
  tipInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    fontSize: 14,
    padding: '6px 0',
    outline: 'none',
    textAlign: 'right',
  },
  undoBar: {
    position: 'fixed',
    bottom: 110,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1A1A1A',
    border: '1px solid #D4AF37',
    borderRadius: 10,
    padding: '10px 14px',
    color: '#F5F0E8',
    fontSize: 13,
    fontWeight: 600,
    zIndex: 1500,
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  undoBtn: {
    background: 'transparent',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    borderRadius: 7,
    padding: '5px 12px',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Pills
  sizePill: {
    fontSize: 11,
    fontWeight: 700,
    background: '#222',
    border: '1px solid #333',
    borderRadius: 4,
    padding: '2px 6px',
  },
  prepPill: {
    fontSize: 11,
    fontWeight: 700,
    background: 'transparent',
    border: '1px solid',
    borderRadius: 4,
    padding: '2px 6px',
  },

  // Queue — responsive grid: 1 column on phones, 2-3 columns on tablets.
  // Phones land in a 360px minmax so the layout never tries to squeeze two
  // tickets onto an iPhone width; iPad portrait fits 2 cols, landscape 3.
  queueList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 14,
    alignItems: 'start',
  },
  orderCard: {
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: 14,
  },
  orderCardSpecial: {
    border: '2px solid #E05252',
    background: 'linear-gradient(180deg, rgba(224,82,82,0.10), rgba(224,82,82,0.03) 60%, #111)',
    boxShadow: '0 0 0 1px rgba(224,82,82,0.25) inset, 0 0 18px rgba(224,82,82,0.18)',
  },
  specialBanner: {
    background: 'rgba(224,82,82,0.18)',
    border: '1px solid #E05252',
    color: '#FFB3B3',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: '0.08em',
    textAlign: 'center',
    padding: '6px 10px',
    borderRadius: 6,
    marginBottom: 10,
  },
  queueItemWarn: {
    background: 'rgba(224,82,82,0.07)',
    border: '1px solid #E05252',
  },
  // Built (strikethrough): dim the row so the eye skips it on re-glance.
  queueItemBuilt: {
    opacity: 0.55,
  },
  itemWarn: {
    marginTop: 6,
    background: 'rgba(224,82,82,0.12)',
    border: '1px solid #E05252',
    color: '#FFB3B3',
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.35,
    padding: '5px 8px',
    borderRadius: 5,
  },
  warnCallout: {
    background: 'rgba(224,82,82,0.10)',
    border: '1px solid #E05252',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 14,
  },
  warnHeader: {
    color: '#E05252',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: '0.12em',
    marginBottom: 4,
  },
  warnBody: {
    color: '#FFD0D0',
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 600,
  },
  orderHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  orderHeaderLeft: { display: 'flex', alignItems: 'center', minWidth: 0 },
  orderHeaderCenter: { display: 'flex', justifyContent: 'center' },
  orderHeaderRight: { display: 'flex', justifyContent: 'flex-end', minWidth: 0 },
  orderNumber: { fontSize: 17, fontWeight: 700, color: '#D4AF37', whiteSpace: 'nowrap' },
  orderSubMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
    fontSize: 12,
  },
  nextUpBadge: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.10em',
    color: '#D4AF37',
    background: 'rgba(212,175,55,0.12)',
    border: '1px solid #D4AF37',
    borderRadius: 5,
    padding: '3px 8px',
    whiteSpace: 'nowrap',
  },
  staleBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#FFB84A',
    background: 'rgba(255,184,74,0.10)',
    border: '1px solid #FFB84A',
    borderRadius: 5,
    padding: '3px 7px',
    whiteSpace: 'nowrap',
  },
  nameEditChipEmpty: {
    background: 'transparent',
    border: '1px dashed rgba(212,175,55,0.30)',
    borderRadius: 5,
    padding: '1px 7px',
    color: '#666',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  progressTag: {
    background: '#0D0D0D',
    border: '1px solid #333',
    color: '#ccc',
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 700,
    fontSize: 13,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  headerRight: { display: 'flex', alignItems: 'center', gap: 8 },
  windowPill: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.02em',
    padding: '4px 9px',
    borderRadius: 6,
    border: '1px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  // Inline name-edit chip — sits in the order meta row. Only this small target
  // is tappable; the rest of the header is no longer a click surface.
  nameEditChip: {
    background: 'transparent',
    border: '1px dashed rgba(212,175,55,0.30)',
    borderRadius: 5,
    padding: '1px 7px',
    fontSize: 12,
    color: '#ddd',
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    lineHeight: 1.3,
  },
  nameEditPencil: {
    color: '#888',
    fontSize: 10,
    opacity: 0.85,
  },
  windowPillDrive: {
    background: 'rgba(123, 179, 240, 0.10)',
    borderColor: '#7BB3F0',
    color: '#7BB3F0',
  },
  windowPillWalk: {
    background: 'rgba(76, 217, 175, 0.10)',
    borderColor: '#4CD9AF',
    color: '#4CD9AF',
  },
  windowPillCatering: {
    background: 'rgba(212, 175, 55, 0.10)',
    borderColor: '#D4AF37',
    color: '#D4AF37',
  },
  traineeLockHint: {
    marginBottom: 8,
    padding: '6px 10px',
    background: 'rgba(123,179,240,0.06)',
    border: '1px solid rgba(123,179,240,0.30)',
    color: '#7BB3F0',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 600,
    textAlign: 'center',
    letterSpacing: '0.04em',
  },
  btnDisabled: {
    background: '#2A2A2A',
    color: '#555',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  timerPill: {
    background: '#0D0D0D',
    border: '1px solid',
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 800,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    minWidth: 64,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  // Recent tab: sits in the same center zone as the Queue timer pill, but
  // shows the wall-clock completion time in green so the operator can see
  // at a glance when the ticket was finished.
  completedPill: {
    background: 'rgba(39,174,96,0.10)',
    border: '1px solid #27AE60',
    color: '#27AE60',
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 700,
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  recipeBtn: {
    background: 'rgba(212,175,55,0.12)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    borderRadius: 7,
    padding: '5px 9px',
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  // Subtle outline-only variant for the per-item recipe trigger on KDS tiles.
  // Less visual weight than the take-order recipe button so it doesn't
  // compete with Mark Complete for the barista's eye.
  recipeBtnSubtle: {
    background: 'transparent',
    border: '1px solid rgba(212,175,55,0.30)',
    color: 'rgba(212,175,55,0.85)',
    borderRadius: 7,
    padding: '5px 9px',
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  // Active state: filled when the recipe is currently expanded inline.
  recipeBtnActive: {
    background: 'rgba(212,175,55,0.20)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    borderRadius: 7,
    padding: '5px 9px',
    fontWeight: 800,
    fontSize: 10,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
  },
  // Inline recipe panel — compact in-tile version of the recipe modal.
  inlineRecipe: {
    marginTop: 8,
    padding: 12,
    background: '#0D0D0D',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 8,
  },
  inlineRecipeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: '1px solid rgba(212,175,55,0.15)',
  },
  inlineRecipeTitle: {
    fontFamily: 'Georgia, serif',
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: 700,
  },
  inlineRecipeMeta: {
    fontSize: 11,
    color: '#888',
  },
  inlineRecipeBlock: { marginBottom: 8 },
  inlineRecipeLabel: {
    fontSize: 10,
    color: '#888',
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 4,
  },
  inlineRecipeIng: { fontSize: 12, color: '#ddd', lineHeight: 1.5, paddingLeft: 4 },
  inlineRecipeStep: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  inlineRecipeStepNum: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37',
    borderRadius: 4,
    width: 18, height: 18,
    fontSize: 10,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlineRecipeTip: {
    marginTop: 4,
    fontSize: 11,
    color: '#FFB84A',
    fontStyle: 'italic',
  },
  itemList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#0D0D0D',
    border: '1px solid #222',
    borderRadius: 8,
    padding: '8px 10px',
  },
  itemMain: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  itemTop: { display: 'flex', gap: 6 },
  itemName: { fontSize: 14, fontWeight: 600, color: '#F5F0E8' },
  helpBtn: {
    background: 'transparent',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    borderRadius: '50%',
    width: 28,
    height: 28,
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 14,
    flexShrink: 0,
  },
  orderActions: { display: 'flex', gap: 8, alignItems: 'stretch' },
  // Cancel is now an icon-only button so it doesn't compete with Mark Complete
  // for visual weight. Touch target stays 44px tall to meet iOS guidelines.
  cancelBtn: {
    flex: '0 0 auto',
    width: 44,
    background: 'transparent',
    border: '1px solid #555',
    color: '#888',
    borderRadius: 8,
    padding: '0',
    fontWeight: 600,
    fontSize: 18,
    cursor: 'pointer',
    minHeight: 44,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'inherit',
  },
  completeBtn: {
    flex: 1,
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    padding: '10px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    minHeight: 44,
  },
  // Reopen Order on the Recent tab — full-width muted ghost so it doesn't
  // try to compete with anything for attention. Distinct from cancelBtn
  // which is now a 44pt icon-only button on the Queue tab.
  reopenBtn: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #555',
    color: '#aaa',
    borderRadius: 8,
    padding: '0 14px',
    minHeight: 44,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },

  // Empty state
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 14, lineHeight: 1.6, marginBottom: 20 },
  demoBtn: {
    marginTop: 8,
    background: 'rgba(212,175,55,0.10)',
    border: '1px solid rgba(212,175,55,0.45)',
    color: '#D4AF37',
    borderRadius: 10,
    padding: '11px 18px',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  demoBtnHint: {
    marginTop: 6,
    fontSize: 10,
    color: '#666',
    letterSpacing: '0.06em',
    fontStyle: 'italic',
  },

  // Modals
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: '#1A1A1A',
    border: '1px solid #D4AF37',
    borderRadius: 14,
    padding: '22px 20px',
    width: '100%',
    maxWidth: 380,
    maxHeight: '88vh',
    overflowY: 'auto',
  },
  modalGold: { color: '#D4AF37', fontSize: 20, marginBottom: 6 },
  modalTitle: { color: '#F5F0E8', fontSize: 19, fontWeight: 700, margin: '0 0 4px' },
  modalSub: { color: '#888', fontSize: 13, marginBottom: 16, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' },
  formLabel: {
    fontSize: 10,
    color: '#888',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
    margin: '12px 0 6px',
  },
  toggleRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  toggleBtn: {
    flex: 1,
    minWidth: 70,
    background: '#2A2A2A',
    border: '1px solid #333',
    borderRadius: 7,
    color: '#888',
    padding: '9px 12px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  toggleBtnActiveGold: {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
  },
  modalActions: { display: 'flex', gap: 10, marginTop: 18 },
  btnCancel: {
    flex: 1,
    padding: '11px',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#888',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnGold: {
    flex: 2,
    padding: '11px',
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },

  // Modifier tags + section
  // Gold-bordered MODS frame — replaces the inline mod row so modifiers
  // can't be missed at a glance. Renders only when an item has modifiers
  // or a free-text note.
  modsFrame: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
    padding: '6px 10px',
    background: 'rgba(212,175,55,0.08)',
    border: '1px solid rgba(212,175,55,0.55)',
    borderRadius: 6,
  },
  modsFrameLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.10em',
    color: '#D4AF37',
    whiteSpace: 'nowrap',
    paddingTop: 2,
  },
  modsFrameContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
  },
  modTagBold: {
    fontSize: 12,
    color: '#F5E4A8',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  noteTagBold: {
    fontSize: 12,
    color: '#F5E4A8',
    fontStyle: 'italic',
    fontWeight: 600,
  },
  modsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  modTag: {
    fontSize: 11,
    background: 'rgba(212,175,55,0.10)',
    border: '1px solid rgba(212,175,55,0.35)',
    color: '#D4AF37',
    borderRadius: 4,
    padding: '2px 7px',
    whiteSpace: 'nowrap',
  },
  modTagBig: {
    fontSize: 13,
    background: 'rgba(212,175,55,0.12)',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    borderRadius: 6,
    padding: '4px 10px',
    fontWeight: 600,
  },
  noteTag: {
    fontSize: 11,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid #444',
    color: '#ddd',
    borderRadius: 4,
    padding: '2px 7px',
    fontStyle: 'italic',
  },
  noteTagBig: {
    fontSize: 13,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid #555',
    color: '#eee',
    borderRadius: 6,
    padding: '4px 10px',
    fontStyle: 'italic',
  },
  modsSection: {
    marginTop: 18,
    padding: '12px 0 4px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
  },
  modsHeader: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 800,
    marginBottom: 10,
  },
  modGroup: {
    marginBottom: 12,
  },
  modGroupLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: 700,
    marginBottom: 6,
    letterSpacing: '0.04em',
  },
  modOptionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  modOption: {
    background: '#222',
    border: '1px solid #333',
    color: '#aaa',
    borderRadius: 16,
    padding: '5px 11px',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  modNoteInput: {
    width: '100%',
    background: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 7,
    color: '#F5F0E8',
    fontFamily: 'inherit',
    fontSize: 13,
    padding: '8px 11px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  modsCallout: {
    background: 'rgba(212,175,55,0.06)',
    border: '1px solid rgba(212,175,55,0.25)',
    borderRadius: 8,
    padding: '10px 12px',
    marginBottom: 14,
  },
  modsCalloutLabel: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#D4AF37',
    fontWeight: 800,
    marginBottom: 6,
  },

  // Recipe modal blocks
  recipePhoto: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    borderRadius: 10,
    margin: '6px 0 14px',
    border: '1px solid rgba(212,175,55,0.30)',
  },
  recipePhotoPlaceholder: {
    width: '100%',
    aspectRatio: '16 / 9',
    background: 'linear-gradient(135deg, rgba(212,175,55,0.10), rgba(212,175,55,0.02) 70%)',
    border: '1px dashed rgba(212,175,55,0.35)',
    borderRadius: 10,
    margin: '6px 0 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  recipePhotoTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 18,
    color: '#D4AF37',
    letterSpacing: '0.03em',
    fontWeight: 700,
    textAlign: 'center',
    padding: '0 12px',
  },
  recipePhotoSub: {
    fontSize: 10,
    color: '#888',
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  recipeBlock: { marginBottom: 14 },
  recipeLabel: {
    fontSize: 10,
    color: '#666',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: 7,
  },
  recipeIng: { fontSize: 13, color: '#ddd', marginBottom: 4, lineHeight: 1.4 },
  recipeStep: { display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#ddd', lineHeight: 1.5 },
  recipeStepNum: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontWeight: 700,
  },
  recipeTip: {
    background: 'rgba(212,175,55,0.08)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 12,
    color: '#ccc',
    lineHeight: 1.5,
    marginTop: 6,
  },

  // Toast
  toast: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 22px',
    background: '#1a3a1a',
    border: '1px solid #4CAF50',
    borderRadius: 10,
    color: '#F5F0E8',
    fontSize: 13,
    fontWeight: 600,
    zIndex: 2000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
};
