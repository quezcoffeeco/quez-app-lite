// ============================================================
// QUEZ APP LITE — AdminHub.jsx
// Single landing for everything owner/manager. Tiles are grouped
// into functional sections so the operator doesn't have to bounce
// between Admin and Settings to reach a thing. Tiles for individual
// Settings sub-sections deep-link via the 'settings:<sectionId>'
// route so a tap lands directly on the right accordion.
// ============================================================

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  getTraineesReadyForApproval,
  isWeeklyChecklistDue, isWeeklySubmittedThisWeek,
  isMonthlyChecklistDue, isMonthlySubmittedThisMonth,
  isQuarterlyChecklistDue, isQuarterlySubmittedThisQuarter,
  isAnnualChecklistDue, isAnnualSubmittedThisYear,
  getActiveTraineesSummary, getLowStockItems,
} from '../utils/storage';

export default function AdminHub() {
  const { push, language, currentUser } = useApp();
  const lang = language || 'en';
  const isOwner = currentUser?.role === 'owner';

  // ── Live badges keep counts current ──
  const pendingCount  = getTraineesReadyForApproval().length;
  const traineeCount  = getActiveTraineesSummary().length;
  const lowStockCount = getLowStockItems().length;
  const periodicDue =
    (isWeeklyChecklistDue() && !isWeeklySubmittedThisWeek()) ||
    (isMonthlyChecklistDue() && !isMonthlySubmittedThisMonth()) ||
    (isQuarterlyChecklistDue() && !isQuarterlySubmittedThisQuarter()) ||
    (isAnnualChecklistDue() && !isAnnualSubmittedThisYear());

  // Tile shape: { route, icon, title, desc, badge?, ownerOnly? }
  // Sections reordered so the most-frequent reasons to open Admin land
  // at the top: numbers / stock / waste, then people, then the menu, then
  // schedule + compliance, then rare technical config.
  const SECTIONS = [
    {
      id: 'operations',
      label: lang === 'es' ? 'Operaciones' : 'Operations',
      tiles: [
        { route: 'reports', icon: '📊',
          title: lang === 'es' ? 'Reportes' : 'Reports',
          desc:  lang === 'es' ? 'Bebidas · Trabajo · Personalizaciones · CSV' : 'Drinks · Labor · Customizations · CSV export' },
        { route: 'inventory', icon: '📦',
          title: lang === 'es' ? 'Inventario' : 'Inventory',
          desc:  lang === 'es' ? 'Niveles par · alertas de stock bajo' : 'Par levels · low-stock alerts',
          badge: lowStockCount },
        { route: 'wasteLog', icon: '🗑',
          title: lang === 'es' ? 'Registro de Desperdicio' : 'Waste & Remake Log',
          desc:  lang === 'es' ? 'Bebidas desechadas con motivo' : 'Track dumped drinks with reasons' },
      ],
    },
    {
      id: 'team',
      label: lang === 'es' ? 'Equipo' : 'Team',
      tiles: [
        { route: 'trainees', icon: '🎓',
          title: lang === 'es' ? 'Trainees Activos' : 'Active Trainees',
          desc:  lang === 'es' ? 'Progreso y próximos pasos por trainee' : 'Progress and next steps for each trainee',
          badge: traineeCount },
        { route: 'trainingApproval', icon: '✅',
          title: lang === 'es' ? 'Aprobación de Entrenamiento' : 'Training Approval',
          desc:  lang === 'es' ? 'Promover trainees que completaron todas las fases' : 'Promote trainees who finished all phases',
          badge: pendingCount },
        { route: 'settings:employees', icon: '👥',
          title: lang === 'es' ? 'Empleados' : 'Employees',
          desc:  lang === 'es' ? 'Agregar · editar · roles · PINs · salarios' : 'Add · edit · roles · PINs · wages' },
        { route: 'settings:training', icon: '🎯',
          title: lang === 'es' ? 'Ajustes de Entrenamiento' : 'Training Settings',
          desc:  lang === 'es' ? 'Bypass para demos · pasos de aprobación' : 'Demo bypass · approval flow' },
      ],
    },
    {
      id: 'menu',
      label: lang === 'es' ? 'Menú y Marca' : 'Menu & Brand',
      tiles: [
        { route: 'settings:menu', icon: '☕',
          title: lang === 'es' ? 'Gestión del Menú' : 'Menu Management',
          desc:  lang === 'es' ? 'Bebidas · precios · 86 · disponibilidad' : 'Drinks · prices · 86 · availability' },
        { route: 'settings:todayOps', icon: '✦',
          title: lang === 'es' ? 'Operaciones de Hoy' : "Today's Operations",
          desc:  lang === 'es' ? 'Estacional · ubicación · meta · playlist' : 'Seasonal · location · goal · playlist' },
        { route: 'settings:locations', icon: '📍',
          title: lang === 'es' ? 'Ubicaciones' : 'Locations',
          desc:  lang === 'es' ? 'Lista de paradas · horario semanal' : 'Stops list · weekly schedule' },
      ],
    },
    {
      id: 'compliance',
      label: lang === 'es' ? 'Horario y Cumplimiento' : 'Schedule & Compliance',
      tiles: [
        { route: 'periodicChecklists', icon: '📅',
          title: lang === 'es' ? 'Listas Periódicas' : 'Periodic Checklists',
          desc:  lang === 'es' ? 'Semanal · Mensual · Trimestral · Anual' : 'Weekly · Monthly · Quarterly · Annual',
          badge: periodicDue ? '!' : 0 },
        { route: 'settings:periodicDue', icon: '🗓',
          title: lang === 'es' ? 'Horario de Periódicos' : 'Periodic Schedule',
          desc:  lang === 'es' ? 'Cuándo vencen semanal · mensual · trimestral · anual' : 'When weekly · monthly · quarterly · annual are due' },
        { route: 'settings:timeLocks', icon: '🕐',
          title: lang === 'es' ? 'Bloqueos de Hora' : 'Time Locks',
          desc:  lang === 'es' ? 'Cuándo se desbloquean apertura y cierre' : 'When opening / closing unlock' },
      ],
    },
    {
      id: 'system',
      label: lang === 'es' ? 'Sistema' : 'System',
      tiles: [
        { route: 'auditLog', icon: '📜', ownerOnly: true,
          title: lang === 'es' ? 'Registro de Auditoría' : 'Audit Log',
          desc:  lang === 'es' ? 'Resets · turnos · aprobaciones · cancelaciones' : 'PIN resets · shifts · approvals · cancels' },
        { route: 'settings:email', icon: '✉️', ownerOnly: true,
          title: lang === 'es' ? 'Configuración de Correo' : 'Email Configuration',
          desc:  lang === 'es' ? 'EmailJS · destinatarios de reportes' : 'EmailJS · report recipients' },
        { route: 'settings:dataBackup', icon: '💾',
          title: lang === 'es' ? 'Datos y Respaldo' : 'Data & Backup',
          desc:  lang === 'es' ? 'Exportar · restaurar · auto-respaldo' : 'Export · restore · auto-backup' },
        { route: 'settings:language', icon: '🌐',
          title: lang === 'es' ? 'Idioma' : 'Language',
          desc:  lang === 'es' ? 'Inglés · Español' : 'English · Spanish' },
      ],
    },
  ];

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Administración' : 'Admin'}</div>
        <div style={S.headerSub}>
          {lang === 'es' ? 'Todas las herramientas de gerencia en un lugar' : 'All management tools in one place'}
        </div>
      </div>

      <div style={S.body}>
        {SECTIONS.map((section) => {
          const tiles = section.tiles.filter((t) => !t.ownerOnly || isOwner);
          if (tiles.length === 0) return null;
          return (
            <div key={section.id} style={S.section}>
              <div style={S.sectionHeader}>{section.label}</div>
              <div className="quez-admin-grid" style={S.grid}>
                {tiles.map((tile) => (
                  <button
                    key={tile.route}
                    style={S.tile}
                    onClick={() => push(tile.route)}
                  >
                    <div style={S.tileIcon}>{tile.icon}</div>
                    <div style={S.tileText}>
                      <div style={S.tileTitle}>{tile.title}</div>
                      <div style={S.tileDesc}>{tile.desc}</div>
                    </div>
                    {tile.badge ? (
                      <div style={typeof tile.badge === 'number' ? S.badgeNum : S.badgeAlert}>
                        {tile.badge}
                      </div>
                    ) : (
                      <span style={S.chev}>›</span>
                    )}
                  </button>
                ))}
              </div>
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
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 13, color: '#888', marginTop: 2 },
  body: { padding: '14px 16px' },
  section: { marginBottom: 22 },
  sectionHeader: {
    color: '#D4AF37',
    fontSize: 11,
    letterSpacing: '0.16em',
    fontWeight: 800,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingLeft: 2,
  },
  grid: { display: 'grid', gap: 10, gridTemplateColumns: '1fr' },
  tile: {
    width: '100%',
    background: '#111',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '14px',
    color: '#F5F0E8',
    fontFamily: 'inherit',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    textAlign: 'left',
    minHeight: 64,
  },
  tileIcon: { fontSize: 26, width: 36, textAlign: 'center', flexShrink: 0 },
  tileText: { flex: 1, minWidth: 0 },
  tileTitle: { fontSize: 15, fontWeight: 700, color: '#F5F0E8' },
  tileDesc:  { fontSize: 11, color: '#888', marginTop: 2, lineHeight: 1.35 },
  chev: { fontSize: 22, color: '#555', flexShrink: 0 },
  badgeNum: { background: '#D4AF37', color: '#0D0D0D', fontWeight: 800, fontSize: 13, borderRadius: 14, padding: '4px 10px', minWidth: 28, textAlign: 'center', flexShrink: 0 },
  badgeAlert: { background: '#E05252', color: '#fff', fontWeight: 800, fontSize: 14, borderRadius: '50%', width: 26, height: 26, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
