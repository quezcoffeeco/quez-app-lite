// ============================================================
// QUEZ APP LITE — AdminHub.jsx
// Tile hub for higher-level functions. Owner + Manager.
// Tile order is per-user (saved to employee.adminLayout).
// ============================================================

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  getTraineesReadyForApproval, isWeeklyChecklistDue, isWeeklySubmittedThisWeek,
  isMonthlyChecklistDue, isMonthlySubmittedThisMonth, isQuarterlyChecklistDue,
  isQuarterlySubmittedThisQuarter, isAnnualChecklistDue, isAnnualSubmittedThisYear,
  getActiveTraineesSummary, getPendingSwapCount, getLowStockItems,
  getMyAdminLayout, saveMyAdminLayout, moveItem,
} from '../utils/storage';

export default function AdminHub() {
  const { push, language, currentUser } = useApp();
  const lang = language || 'en';
  const isOwner = currentUser?.role === 'owner';

  const pendingCount  = getTraineesReadyForApproval().length;
  const traineeCount  = getActiveTraineesSummary().length;
  const pendingSwaps  = getPendingSwapCount();
  const lowStockCount = getLowStockItems().length;
  const periodicDue =
    (isWeeklyChecklistDue() && !isWeeklySubmittedThisWeek()) ||
    (isMonthlyChecklistDue() && !isMonthlySubmittedThisMonth()) ||
    (isQuarterlyChecklistDue() && !isQuarterlySubmittedThisQuarter()) ||
    (isAnnualChecklistDue() && !isAnnualSubmittedThisYear());

  // Tile definitions keyed by stable id
  const TILE_DEFS = {
    reports:           { icon: '📊', title: { en: 'Reports', es: 'Reportes' },
                         desc: { en: 'Drinks · Labor · Customizations · CSV export', es: 'Bebidas · Trabajo · Personalizaciones · CSV' }, badge: 0 },
    schedule:          { icon: '📆', title: { en: 'Schedule', es: 'Horario' },
                         desc: { en: 'Build and view weekly shifts', es: 'Construir y ver turnos semanales' }, badge: 0 },
    timesheet:         { icon: '⏰', title: { en: 'Timesheet', es: 'Hoja de Tiempo' },
                         desc: { en: 'Edit time-clock punches · fix forgotten clock-outs', es: 'Editar registros · arreglar salidas olvidadas' }, badge: 0 },
    shiftSwaps:        { icon: '🔄', title: { en: 'Shift Swaps', es: 'Cambios de Turno' },
                         desc: { en: 'Approve / deny shift swap requests', es: 'Aprobar / negar solicitudes de cambio' }, badge: pendingSwaps },
    inventory:         { icon: '📦', title: { en: 'Inventory', es: 'Inventario' },
                         desc: { en: 'Par levels · low-stock alerts', es: 'Niveles par · alertas de stock bajo' }, badge: lowStockCount },
    wasteLog:          { icon: '🗑', title: { en: 'Waste & Remake Log', es: 'Registro de Desperdicio' },
                         desc: { en: 'Track dumped drinks with reasons', es: 'Bebidas desechadas con motivo' }, badge: 0 },
    trainingApproval:  { icon: '✅', title: { en: 'Training Approval', es: 'Aprobación de Entrenamiento' },
                         desc: { en: 'Promote trainees who finished all phases', es: 'Promover trainees que completaron todas las fases' }, badge: pendingCount },
    trainees:          { icon: '🎓', title: { en: 'Active Trainees', es: 'Trainees Activos' },
                         desc: { en: 'Progress and next steps for each trainee', es: 'Progreso y próximos pasos por trainee' }, badge: traineeCount },
    periodicChecklists:{ icon: '📅', title: { en: 'Periodic Checklists', es: 'Listas Periódicas' },
                         desc: { en: 'Weekly · Monthly · Quarterly · Annual', es: 'Semanal · Mensual · Trimestral · Anual' }, badge: periodicDue ? '!' : 0 },
    settings:          { icon: '⚙', title: { en: 'Settings', es: 'Ajustes' },
                         desc: isOwner
                           ? { en: 'Employees · Menu · Locations · EmailJS', es: 'Empleados · Menú · Ubicaciones · EmailJS' }
                           : { en: 'Employees · 86 menu · Locations (owner items read-only)', es: 'Empleados · 86 menú · Ubicaciones (artículos del dueño solo lectura)' },
                         badge: 0 },
    ...(isOwner ? {
      auditLog:        { icon: '📜', title: { en: 'Audit Log', es: 'Registro de Auditoría' },
                         desc: { en: 'PIN resets · shifts · approvals · cancels', es: 'Resets · turnos · aprobaciones · cancelaciones' }, badge: 0 },
    } : {}),
  };

  const DEFAULT_ORDER = [
    'reports', 'schedule', 'timesheet', 'shiftSwaps', 'inventory', 'wasteLog',
    'trainingApproval', 'trainees', 'periodicChecklists', 'settings',
    ...(isOwner ? ['auditLog'] : []),
  ];

  const [editMode, setEditMode] = useState(false);
  const [order, setOrder] = useState(DEFAULT_ORDER);

  useEffect(() => {
    if (!currentUser) return;
    const saved = getMyAdminLayout(currentUser.id);
    if (saved?.order && saved.order.length > 0) {
      // Forward-compat: add new tiles to the end
      const known = new Set(DEFAULT_ORDER);
      const next = saved.order.filter((id) => known.has(id));
      DEFAULT_ORDER.forEach((id) => { if (!next.includes(id)) next.push(id); });
      setOrder(next);
    } else {
      setOrder(DEFAULT_ORDER);
    }
    // eslint-disable-next-line
  }, [currentUser?.id, isOwner]);

  const move = (id, direction) => {
    const next = moveItem(order, id, direction);
    setOrder(next);
    saveMyAdminLayout(currentUser?.id, { order: next });
  };

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Administración' : 'Admin'}</div>
        <div style={S.headerSub}>
          {lang === 'es' ? 'Herramientas de gerencia' : 'Management tools'}
        </div>
      </div>

      <div style={S.body}>
        <div style={S.editBar}>
          <button
            style={editMode ? S.editBarBtnActive : S.editBarBtn}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode
              ? (lang === 'es' ? '✓ Listo' : '✓ Done')
              : (lang === 'es' ? '✎ Reordenar' : '✎ Reorder')}
          </button>
          {editMode && (
            <span style={S.editHint}>
              {lang === 'es' ? 'Mueve los botones a tu gusto' : 'Move tiles to your liking'}
            </span>
          )}
        </div>

        {order.map((id, idx) => {
          const tile = TILE_DEFS[id];
          if (!tile) return null;
          return (
            <div key={id} style={{ position: 'relative' }}>
              <button
                style={S.tile}
                onClick={() => !editMode && push(id)}
              >
                <div style={S.tileIcon}>{tile.icon}</div>
                <div style={S.tileText}>
                  <div style={S.tileTitle}>{tile.title[lang]}</div>
                  <div style={S.tileDesc}>{tile.desc[lang]}</div>
                </div>
                {tile.badge ? (
                  <div style={typeof tile.badge === 'number' ? S.badgeNum : S.badgeAlert}>
                    {tile.badge}
                  </div>
                ) : (
                  <span style={S.chev}>›</span>
                )}
              </button>
              {editMode && (
                <div style={S.editOverlay}>
                  <button
                    style={{ ...S.editBtn, opacity: idx === 0 ? 0.3 : 1 }}
                    disabled={idx === 0}
                    onClick={() => move(id, 'up')}
                    title="Move up"
                  >↑</button>
                  <button
                    style={{ ...S.editBtn, opacity: idx === order.length - 1 ? 0.3 : 1 }}
                    disabled={idx === order.length - 1}
                    onClick={() => move(id, 'down')}
                    title="Move down"
                  >↓</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    textAlign: 'center',
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  body: { padding: '16px' },
  editBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
  editBarBtn: { background: 'transparent', border: '1px solid rgba(212,175,55,0.40)', color: '#D4AF37', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit' },
  editBarBtnActive: { background: 'linear-gradient(180deg, #E6C661, #D4AF37)', border: 'none', color: '#0D0D0D', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', cursor: 'pointer', fontFamily: 'inherit' },
  editHint: { fontSize: 11, color: '#888', fontStyle: 'italic' },
  tile: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '16px',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    textAlign: 'left',
  },
  tileIcon: { fontSize: 28, width: 40, textAlign: 'center', flexShrink: 0 },
  tileText: { flex: 1 },
  tileTitle: { fontSize: 16, fontWeight: 700, color: '#F5F0E8' },
  tileDesc:  { fontSize: 12, color: '#888', marginTop: 3 },
  chev: { fontSize: 22, color: '#555', flexShrink: 0 },
  badgeNum: { background: '#D4AF37', color: '#0D0D0D', fontWeight: 800, fontSize: 13, borderRadius: 14, padding: '4px 10px', minWidth: 28, textAlign: 'center' },
  badgeAlert: { background: '#E05252', color: '#fff', fontWeight: 800, fontSize: 14, borderRadius: '50%', width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  editOverlay: { position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, background: 'rgba(13,13,13,0.92)', border: '1px solid rgba(212,175,55,0.40)', borderRadius: 8, padding: '4px 5px', zIndex: 2, backdropFilter: 'blur(6px)' },
  editBtn: { width: 26, height: 26, background: 'transparent', border: 'none', color: '#D4AF37', borderRadius: 5, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
};
