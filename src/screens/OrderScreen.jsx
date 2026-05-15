// ============================================================
// QUEZ APP LITE — OrderScreen.jsx
// Session 10: Take Order + Order Queue
//
// Two internal tabs:
//   1. Take Order  — pick drinks + size + prep, send to queue
//   2. Queue       — open orders, check off each drink, "?" opens recipe
// Completed orders write to today's drink log for end-of-day reporting.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { drinkRecipes, DRINK_CATEGORIES, PREP_TYPE_COLORS } from '../data/drinkRecipes';
import { MODIFIER_GROUPS, getModLabel, visibleOptions } from '../data/drinkModifiers';
import { fmtClock } from '../utils/timeFormat';
import {
  getActiveOrders,
  addOrder,
  updateOrderItems,
  cancelOrder,
  completeOrder,
  getNextOrderNumber,
  getRecentCompletedOrders,
  saveActiveOrders,
  saveLastOrder,
  getLastOrder,
  logAudit,
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

export default function OrderScreen() {
  const { currentUser, language } = useApp();
  const lang = language || 'en';

  const [view, setView]               = useState('take');      // 'take' | 'queue' | 'recent'
  const [draftItems, setDraftItems]   = useState([]);          // items in current draft order
  const [draftNote, setDraftNote]     = useState('');          // order-level note (customer name, urgency)
  const [draftTip, setDraftTip]       = useState('');          // dollar amount; freeform for cash tips
  const [recentCancelled, setRecentCancelled] = useState(null);// for undo snackbar
  const [customModInput, setCustomModInput] = useState('');    // inline custom mod text
  const [pickerDrink, setPickerDrink] = useState(null);        // drink being configured in picker modal
  const [editingItemId, setEditingItemId] = useState(null);    // when editing an item already in an order
  const [editingOrder, setEditingOrder]   = useState(null);    // the queue order being edited (if any)
  const [pickerSize, setPickerSize]   = useState('12oz');
  const [pickerPrep, setPickerPrep]   = useState('hot');
  const [pickerMods, setPickerMods]   = useState([]);          // selected modifier option ids
  const [pickerNote, setPickerNote]   = useState('');          // free-text note
  const [activeOrders, setActiveOrders] = useState([]);
  const [recipeModal, setRecipeModal] = useState(null);        // { drink, size, prep, modifiers, note }
  const [toast, setToast]             = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | category key

  const loadOrders = useCallback(() => {
    setActiveOrders(getActiveOrders());
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ─── Drink picker ────────────────────────────────────────────────────────
  const openPicker = (drink) => {
    const preps = availablePreps(drink);
    setPickerDrink(drink);
    setPickerSize('12oz');
    setPickerPrep(preps[0]);
    setPickerMods([]);
    setPickerNote('');
    setEditingItemId(null);
    setEditingOrder(null);
  };

  // Open the picker prefilled with an existing item — used to edit
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
      const stillVisible = new Set(visibleOptions(tempIceGroup, newPrep).map((o) => o.id));
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
    if (!pickerDrink) return;
    const itemBase = {
      drinkId: pickerDrink.id,
      drinkName: pickerDrink.name,
      size: pickerSize,
      prepType: pickerPrep,
      modifiers: pickerMods,
      note: pickerNote.trim(),
    };

    // Path 1: editing an item already inside a queued order
    if (editingItemId && editingOrder) {
      const newItems = editingOrder.items.map((it) =>
        it.itemId === editingItemId ? { ...it, ...itemBase } : it
      );
      updateOrderItems(editingOrder.id, newItems);
      loadOrders();
      closePicker();
      showToast(lang === 'es' ? 'Pedido actualizado' : 'Order updated');
      return;
    }

    // Path 2: editing an item in the local draft (not yet sent)
    if (editingItemId) {
      setDraftItems((prev) => prev.map((it) =>
        it.itemId === editingItemId ? { ...it, ...itemBase } : it
      ));
      closePicker();
      return;
    }

    // Path 3: adding a brand-new item to the draft
    const item = { itemId: newItemId(), ...itemBase, done: false };
    setDraftItems((prev) => [...prev, item]);
    closePicker();
  };

  const removeDraftItem = (itemId) => {
    setDraftItems((prev) => prev.filter((it) => it.itemId !== itemId));
  };

  const sendToQueue = () => {
    if (draftItems.length === 0) return;
    const tipNum = parseFloat(draftTip);
    const order = {
      id: 'ord_' + Date.now(),
      number: getNextOrderNumber(),
      createdAt: new Date().toISOString(),
      takenBy: currentUser?.name || 'Unknown',
      items: draftItems,
      orderNote: draftNote.trim(),
      tip: Number.isFinite(tipNum) && tipNum > 0 ? Math.round(tipNum * 100) / 100 : 0,
    };
    addOrder(order);
    saveLastOrder(currentUser?.id, draftItems);
    setDraftItems([]);
    setDraftNote('');
    setDraftTip('');
    loadOrders();
    showToast(lang === 'es' ? `Pedido #${order.number} enviado a la cola` : `Order #${order.number} sent to queue`);
    setView('queue');
  };

  // Repeat last order — pre-fills the draft with what this user sent last time
  const repeatLastOrder = () => {
    const last = getLastOrder(currentUser?.id);
    if (!last || last.length === 0) return;
    const items = last.map((it) => ({
      ...it,
      itemId: newItemId(),
      done: false,
    }));
    setDraftItems((prev) => [...prev, ...items]);
    showToast(lang === 'es' ? `${items.length} bebida(s) agregada(s)` : `Added ${items.length} drink(s) from last order`);
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
  const toggleItemDone = (order, itemId) => {
    const items = order.items.map((it) => (
      it.itemId === itemId ? { ...it, done: !it.done } : it
    ));
    updateOrderItems(order.id, items);
    loadOrders();
  };

  const handleCompleteOrder = (order) => {
    const completed = completeOrder(order.id);
    loadOrders();
    if (completed) {
      showToast(lang === 'es' ? `Pedido #${order.number} completado` : `Order #${order.number} completed`);
    }
  };

  const handleCancelOrder = (order) => {
    // Tentatively remove + show an undo snackbar — no destructive confirm dialog.
    // Audit log fires synchronously so back-to-back cancels never drop an entry.
    cancelOrder(order.id);
    logAudit('order_cancelled', { orderId: order.id, orderNumber: order.number, by: currentUser?.name });
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

  const openRecipe = (item) => {
    const drink = drinkRecipes.find((d) => d.id === item.drinkId);
    if (drink) setRecipeModal({
      drink,
      size: item.size,
      prep: item.prepType,
      modifiers: item.modifiers || [],
      note: item.note || '',
    });
  };

  // ─── Render: Take Order ──────────────────────────────────────────────────
  const renderTake = () => {
    const filteredDrinks =
      categoryFilter === 'all'
        ? drinkRecipes
        : drinkRecipes.filter((d) => d.category === categoryFilter);

    const hasLast = (getLastOrder(currentUser?.id) || []).length > 0;

    return (
      <>
        {/* Repeat-last quick action */}
        {hasLast && draftItems.length === 0 && (
          <button style={S.repeatBtn} onClick={repeatLastOrder}>
            ↻ {lang === 'es' ? 'Repetir Último Pedido' : 'Repeat Last Order'}
          </button>
        )}

        {/* Category filter */}
        <div style={S.catFilter}>
          <button
            style={{ ...S.catChip, ...(categoryFilter === 'all' ? S.catChipActive : {}) }}
            onClick={() => setCategoryFilter('all')}
          >
            {lang === 'es' ? 'Todo' : 'All'}
          </button>
          {DRINK_CATEGORIES.map((c) => (
            <button
              key={c.key}
              style={{ ...S.catChip, ...(categoryFilter === c.key ? S.catChipActive : {}) }}
              onClick={() => setCategoryFilter(c.key)}
            >
              {c.label[lang]}
            </button>
          ))}
        </div>

        {/* Drink grid */}
        <div style={S.grid}>
          {filteredDrinks.map((d) => (
            <button key={d.id} style={S.tile} onClick={() => openPicker(d)}>
              <div style={S.tileName}>{d.name}</div>
              <div style={{ ...S.tilePrep, color: PREP_TYPE_COLORS[d.prepType] || '#888' }}>
                {d.prepType}
              </div>
            </button>
          ))}
        </div>

        {/* Draft order summary (sticky bottom) */}
        {draftItems.length > 0 && (
          <div style={S.draftBar}>
            <div style={S.draftHeader}>
              <span style={S.draftTitle}>
                {lang === 'es' ? 'Pedido actual' : 'Current order'} · {draftItems.length}
              </span>
              <button style={S.sendBtn} onClick={sendToQueue}>
                {lang === 'es' ? 'Enviar a Cola' : 'Send to Queue'}
              </button>
            </div>
            <div style={S.draftList}>
              {draftItems.map((it) => (
                <div key={it.itemId} style={S.draftItem}>
                  <div style={S.draftItemTop}>
                    <span style={{ ...S.sizePill, color: PREP_COLORS[it.prepType] }}>
                      {it.size}
                    </span>
                    <span style={{ ...S.prepPill, color: PREP_COLORS[it.prepType], borderColor: PREP_COLORS[it.prepType] }}>
                      {PREP_LABELS[it.prepType][lang]}
                    </span>
                    <span style={S.draftName}>{it.drinkName}</span>
                    <button style={S.editBtnSmall} onClick={() => editExistingItem(it)}>✎</button>
                    <button style={S.removeBtn} onClick={() => removeDraftItem(it.itemId)}>✕</button>
                  </div>
                  {(it.modifiers?.length > 0 || it.note) && (
                    <div style={S.modsRow}>
                      {(it.modifiers || []).map((mid) => (
                        <span key={mid} style={S.modTag}>{getModLabel(mid, lang)}</span>
                      ))}
                      {it.note && (
                        <span style={S.noteTag}>📝 {it.note}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Order-level note */}
            <input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              placeholder={lang === 'es' ? 'Nota del pedido (nombre del cliente, urgencia...)' : 'Order note (customer name, urgency...)'}
              style={S.orderNoteInput}
              maxLength={140}
            />
            {/* Tip line */}
            <div style={S.tipRow}>
              <span style={S.tipLabel}>{lang === 'es' ? 'Propina' : 'Tip'}</span>
              <span style={S.tipPrefix}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={draftTip}
                onChange={(e) => setDraftTip(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                style={S.tipInput}
                maxLength={6}
              />
            </div>
          </div>
        )}
      </>
    );
  };

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
              ? 'Sin pedidos esperando. Disfruta el momento.'
              : 'No drinks in the queue. Enjoy the breather.'}
          </div>
        </div>
      );
    }

    return (
      <div style={S.queueList}>
        {activeOrders.map((order) => {
          const total = order.items.length;
          const done  = order.items.filter((it) => it.done).length;
          const ready = done === total;
          const hasSpecial = order.items.some(hasColdHoneyMix);
          return (
            <div key={order.id} style={{ ...S.orderCard, ...(hasSpecial ? S.orderCardSpecial : {}) }}>
              {hasSpecial && (
                <div style={S.specialBanner}>
                  ⚠ {lang === 'es' ? 'PEDIDO ESPECIAL' : 'SPECIAL ORDER'} —{' '}
                  {lang === 'es' ? 'revisa la instrucción de miel' : 'see honey-mix step'}
                </div>
              )}
              <div style={S.orderHeader}>
                <div>
                  <div style={{ ...S.orderNumber, ...(hasSpecial ? { color: '#FFB3B3' } : {}) }}>
                    {lang === 'es' ? 'Pedido' : 'Order'} #{order.number}
                  </div>
                  <div style={S.orderMeta}>
                    {formatClock(order.createdAt)} · {order.takenBy}
                  </div>
                </div>
                <div style={S.progressTag}>{done}/{total}</div>
              </div>

              <div style={S.itemList}>
                {order.items.map((it) => (
                  <div key={it.itemId} style={{
                    ...S.queueItem,
                    ...(it.done ? S.queueItemDone : {}),
                    ...(hasColdHoneyMix(it) && !it.done ? S.queueItemWarn : {}),
                  }}>
                    <button
                      style={{ ...S.checkbox, ...(it.done ? S.checkboxDone : {}) }}
                      onClick={() => toggleItemDone(order, it.itemId)}
                    >
                      {it.done ? '✓' : ''}
                    </button>
                    <div style={S.itemMain}>
                      <div style={S.itemTop}>
                        <span style={{ ...S.sizePill, color: PREP_COLORS[it.prepType] }}>
                          {it.size}
                        </span>
                        <span style={{ ...S.prepPill, color: PREP_COLORS[it.prepType], borderColor: PREP_COLORS[it.prepType] }}>
                          {PREP_LABELS[it.prepType][lang]}
                        </span>
                      </div>
                      <div style={{ ...S.itemName, ...(it.done ? S.itemNameDone : {}) }}>
                        {it.drinkName}
                      </div>
                      {(it.modifiers?.length > 0 || it.note) && (
                        <div style={S.modsRow}>
                          {(it.modifiers || []).map((mid) => (
                            <span key={mid} style={S.modTag}>{getModLabel(mid, lang)}</span>
                          ))}
                          {it.note && (
                            <span style={S.noteTag}>📝 {it.note}</span>
                          )}
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
                      <button style={S.helpBtn} onClick={() => openRecipe(it)} title="Recipe">?</button>
                    </div>
                  </div>
                ))}
              </div>

              {order.orderNote && (
                <div style={S.orderNoteBanner}>
                  📝 {order.orderNote}
                </div>
              )}

              <div style={S.orderActions}>
                <button style={S.cancelBtn} onClick={() => handleCancelOrder(order)}>
                  {lang === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  style={{ ...S.completeBtn, ...(ready ? {} : S.completeBtnDisabled) }}
                  onClick={() => ready && handleCompleteOrder(order)}
                  disabled={!ready}
                >
                  {lang === 'es' ? 'Marcar Completo' : 'Mark Complete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── Render: Recent Completed Orders ─────────────────────────────────────
  const renderRecent = () => {
    const recent = getRecentCompletedOrders(1);
    if (recent.length === 0) {
      return (
        <div style={S.empty}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={S.emptyTitle}>{lang === 'es' ? 'Nada completo todavía' : 'Nothing complete yet'}</div>
          <div style={S.emptyBody}>
            {lang === 'es'
              ? 'Ve a hacer un café. Los pedidos terminados aparecen aquí.'
              : 'Go make some coffee — completed orders land here.'}
          </div>
        </div>
      );
    }

    return (
      <div style={S.queueList}>
        {recent.map((order) => {
          const itemCount = order.items.length;
          return (
            <div key={order.id} style={{ ...S.orderCard, opacity: 0.85 }}>
              <div style={S.orderHeader}>
                <div>
                  <div style={S.orderNumber}>#{order.number}</div>
                  <div style={S.orderMeta}>
                    {formatClock(order.createdAt)} → {formatClock(order.completedAt)} · {order.takenBy}
                  </div>
                </div>
                <div style={S.progressTag}>{itemCount} {lang === 'es' ? 'bebidas' : 'drinks'}</div>
              </div>

              <div style={{ ...S.itemList, marginBottom: 10 }}>
                {order.items.map((it) => (
                  <div key={it.itemId} style={{ ...S.queueItem, opacity: 0.85 }}>
                    <span style={{ color: '#D4AF37', fontSize: 16, marginRight: 4 }}>✓</span>
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

              {order.orderNote && (
                <div style={S.orderNoteBanner}>📝 {order.orderNote}</div>
              )}

              <button style={S.cancelBtn} onClick={() => handleRecallOrder(order)}>
                ↻ {lang === 'es' ? 'Reabrir Pedido' : 'Reopen Order'}
              </button>
            </div>
          );
        })}
      </div>
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

          {/* Modifier groups */}
          <div style={S.modsSection}>
            <div style={S.modsHeader}>
              {lang === 'es' ? 'Personalizar (opcional)' : 'Customize (optional)'}
            </div>
            {MODIFIER_GROUPS.map((group) => {
              const opts = visibleOptions(group, pickerPrep);
              if (opts.length === 0) return null;
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
            })}

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

  // ─── Render: Recipe Modal ────────────────────────────────────────────────
  const renderRecipeModal = () => {
    if (!recipeModal) return null;
    const { drink, size, prep, modifiers = [], note = '' } = recipeModal;
    const ingredients = drink.ingredients[size] || [];
    const baseSteps   = drink.buildSteps[prep] || [];
    const needsHoneyMix = hasColdHoneyMix({ drinkId: drink.id, prepType: prep, modifiers });
    const steps = needsHoneyMix
      ? [
          (lang === 'es'
            ? '** PRIMERO: Mezcla la bomba extra de miel con espresso CALIENTE en taza separada hasta disolver. NO la pongas directamente sobre hielo. **'
            : '** FIRST: Mix the extra honey pump with HOT espresso in a separate cup until dissolved. DO NOT pour directly onto ice. **'),
          ...baseSteps,
        ]
      : baseSteps;
    return (
      <div style={S.overlay} onClick={() => setRecipeModal(null)}>
        <div style={{ ...S.modal, maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
          <div style={S.modalGold}>✦</div>
          <h3 style={S.modalTitle}>{drink.name}</h3>
          <div style={S.modalSub}>
            <span style={{ ...S.sizePill, color: PREP_COLORS[prep] }}>{size}</span>
            <span style={{ ...S.prepPill, color: PREP_COLORS[prep], borderColor: PREP_COLORS[prep] }}>
              {PREP_LABELS[prep][lang]}
            </span>
            <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>⏱ {drink.buildTime}</span>
          </div>

          {(modifiers.length > 0 || note) && (
            <div style={S.modsCallout}>
              <div style={S.modsCalloutLabel}>
                {lang === 'es' ? 'Personalizaciones' : 'Customizations'}
              </div>
              <div style={S.modsRow}>
                {modifiers.map((mid) => (
                  <span key={mid} style={S.modTagBig}>{getModLabel(mid, lang)}</span>
                ))}
                {note && <span style={S.noteTagBig}>📝 {note}</span>}
              </div>
            </div>
          )}

          {needsHoneyMix && (
            <div style={S.warnCallout}>
              <div style={S.warnHeader}>⚠ {lang === 'es' ? 'AVISO ESPECIAL' : 'SPECIAL NOTICE'}</div>
              <div style={S.warnBody}>** {HONEY_WARN[lang] || HONEY_WARN.en} **</div>
            </div>
          )}

          <div style={S.recipeBlock}>
            <div style={S.recipeLabel}>{lang === 'es' ? 'Ingredientes' : 'Ingredients'}</div>
            {ingredients.map((ing, i) => (
              <div key={i} style={S.recipeIng}>
                <span style={{ color: '#D4AF37' }}>·</span> {ing}
              </div>
            ))}
          </div>

          <div style={S.recipeBlock}>
            <div style={S.recipeLabel}>{lang === 'es' ? 'Pasos' : 'Build Steps'}</div>
            {steps.map((s, i) => (
              <div key={i} style={S.recipeStep}>
                <span style={S.recipeStepNum}>{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {drink.tip && (
            <div style={S.recipeTip}>💡 {drink.tip}</div>
          )}

          <div style={S.modalActions}>
            <button style={S.btnGold} onClick={() => setRecipeModal(null)}>
              {lang === 'es' ? 'Cerrar' : 'Close'}
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
          {lang === 'es' ? 'Tomar y completar pedidos' : 'Take and complete orders'}
        </div>
      </div>

      {/* Tab bar */}
      <div style={S.tabBar}>
        <button
          style={{ ...S.tab, ...(view === 'take' ? S.tabActive : {}) }}
          onClick={() => setView('take')}
        >
          {lang === 'es' ? 'Tomar' : 'Take'}
        </button>
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
      </div>

      <div style={S.body}>
        {view === 'take'   && renderTake()}
        {view === 'queue'  && renderQueue()}
        {view === 'recent' && renderRecent()}
      </div>

      {renderPicker()}
      {renderRecipeModal()}

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
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

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

  // Queue
  queueList: { display: 'flex', flexDirection: 'column', gap: 14 },
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
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  orderNumber: { fontSize: 17, fontWeight: 700, color: '#D4AF37' },
  orderMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  progressTag: {
    background: '#0D0D0D',
    border: '1px solid #333',
    color: '#ccc',
    borderRadius: 8,
    padding: '5px 10px',
    fontWeight: 700,
    fontSize: 13,
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
  queueItemDone: {
    background: 'rgba(212,175,55,0.05)',
    border: '1px solid rgba(212,175,55,0.25)',
    opacity: 0.55,
  },
  checkbox: {
    width: 28,
    height: 28,
    background: '#0D0D0D',
    border: '1.5px solid #555',
    borderRadius: 7,
    color: '#0D0D0D',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s ease',
  },
  checkboxDone: {
    background: '#D4AF37',
    border: '1.5px solid #D4AF37',
    color: '#0D0D0D',
  },
  itemMain: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  itemTop: { display: 'flex', gap: 6 },
  itemName: { fontSize: 14, fontWeight: 600, color: '#F5F0E8' },
  itemNameDone: { color: '#888', textDecoration: 'line-through', textDecorationThickness: 2 },
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
  orderActions: { display: 'flex', gap: 8 },
  cancelBtn: {
    flex: 1,
    background: 'transparent',
    border: '1px solid #555',
    color: '#888',
    borderRadius: 8,
    padding: '10px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  completeBtn: {
    flex: 2,
    background: '#D4AF37',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 8,
    padding: '10px',
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
  },
  completeBtnDisabled: {
    background: '#2A2A2A',
    color: '#555',
    cursor: 'not-allowed',
  },

  // Empty state
  empty: { textAlign: 'center', padding: '60px 20px' },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', marginBottom: 8 },
  emptyBody: { color: '#555', fontSize: 14, lineHeight: 1.6 },

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
