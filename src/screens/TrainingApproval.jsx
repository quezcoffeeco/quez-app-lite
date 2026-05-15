import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  getTraineesReadyForApproval,
  getAllTrainingRecords,
  approveTraineeRoleUpgrade,
} from '../utils/storage';
import { sendQuezEmail } from '../utils/emailjs';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrainingApproval() {
  const { currentUser, language } = useApp();
  const lang = language || 'en';

  const [pending, setPending] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { employee, record }
  const [toast, setToast] = useState(null); // { message, type }
  const [view, setView] = useState('pending'); // 'pending' | 'history'

  const loadData = useCallback(() => {
    setPending(getTraineesReadyForApproval());
    setAllRecords(getAllTrainingRecords());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (employee, record) => {
    const approverName = currentUser?.name || 'Owner';
    const result = approveTraineeRoleUpgrade(employee.id, approverName);

    if (result.success) {
      loadData();
      // Send approval email to owner
      await sendQuezEmail({
        subject: `[Quez Training] Role Upgrade Approved — ${employee.name}`,
        templateParams: {
          to_name: 'Owner',
          subject: `[Quez Training] Role Upgrade Approved — ${employee.name}`,
          message: `Role upgrade approved.\n\nEmployee: ${employee.name}\nPrevious Role: Trainee\nNew Role: Barista\nApproved By: ${approverName}\nDate: ${new Date().toLocaleDateString()}\n\nTraining Summary:\n  Phase 1 — Completed: ${formatDate(record.phase1?.date)}${record.phase1?.bypassed ? ' (bypass)' : ''}\n  Phase 2 — Completed: ${formatDate(record.phase2?.date)} · Trainer: ${record.phase2?.trainerName || '—'}${record.phase2?.bypassed ? ' (bypass)' : ''}\n  Phase 3 — Completed: ${formatDate(record.phase3?.date)} · Trainer: ${record.phase3?.trainerName || '—'}${record.phase3?.bypassed ? ' (bypass)' : ''}\n\nThis employee is now cleared as Barista. Further role upgrades (Lead Barista, Manager) must be done manually in Settings.\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa · Veteran Owned & Operated`,
        },
      });
      showToast(result.message);
      setConfirmModal(null);
    } else {
      showToast(result.message, 'error');
    }
  };

  // ─── CONFIRM MODAL
  const renderConfirmModal = () => {
    if (!confirmModal) return null;
    const { employee, record } = confirmModal;
    return (
      <div style={styles.overlay}>
        <div style={styles.modal}>
          <div style={styles.modalGold}>✦</div>
          <h3 style={styles.modalTitle}>
            {lang === 'es' ? 'Aprobar Actualización de Rol' : 'Approve Role Upgrade'}
          </h3>
          <div style={styles.modalEmployee}>{employee.name}</div>
          <div style={styles.modalInfo}>
            {lang === 'es' ? 'Trainee → Barista' : 'Trainee → Barista'}
          </div>

          <div style={styles.modalSummary}>
            {[
              { label: 'Phase 1', date: record.phase1?.date, trainer: null, bypassed: record.phase1?.bypassed },
              { label: 'Phase 2', date: record.phase2?.date, trainer: record.phase2?.trainerName, bypassed: record.phase2?.bypassed },
              { label: 'Phase 3', date: record.phase3?.date, trainer: record.phase3?.trainerName, bypassed: record.phase3?.bypassed },
            ].map((p) => (
              <div key={p.label} style={styles.summaryRow}>
                <span style={styles.summaryLabel}>{p.label}</span>
                <span style={styles.summaryValue}>
                  {formatDate(p.date)}
                  {p.trainer && ` · ${p.trainer}`}
                  {p.bypassed && (
                    <span style={styles.bypassTag}>
                      {lang === 'es' ? ' bypass' : ' bypass'}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <p style={styles.modalNote}>
            {lang === 'es'
              ? 'Esta acción actualizará el rol del empleado a Barista de forma permanente. El registro de entrenamiento se conservará para siempre.'
              : 'This will permanently upgrade the employee\'s role to Barista. The training record is preserved permanently.'}
          </p>

          <div style={styles.modalActions}>
            <button style={styles.btnCancel} onClick={() => setConfirmModal(null)}>
              {lang === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button style={styles.btnApprove} onClick={() => handleApprove(employee, record)}>
              {lang === 'es' ? 'Aprobar y Actualizar' : 'Approve & Upgrade'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── PENDING + IN-PROGRESS LIST
  const renderPending = () => {
    // Trainees who have started but not yet finished all 3 phases
    const inProgress = allRecords.filter(({ employee, record }) => {
      if (employee.role !== 'trainee') return false;
      const p1 = !!record.phase1?.passed;
      const p2 = !!record.phase2?.passed;
      const p3 = !!record.phase3?.passed;
      const anyStarted = p1 || p2 || p3;
      const allDone = p1 && p2 && p3;
      return anyStarted && !allDone;
    });

    if (pending.length === 0 && inProgress.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={styles.emptyTitle}>
            {lang === 'es' ? 'Sin trainees activos' : 'No active trainees'}
          </div>
          <div style={styles.emptyBody}>
            {lang === 'es'
              ? 'Cuando un trainee comience el entrenamiento aparecerá aquí.'
              : 'When a trainee begins training they will appear here.'}
          </div>
        </div>
      );
    }

    const renderPhaseRows = (record) => (
      <div style={styles.phaseRows}>
        {[
          { key: 'phase1', label: lang === 'es' ? 'Fase 1' : 'Phase 1', data: record.phase1, hasTrainer: false },
          { key: 'phase2', label: lang === 'es' ? 'Fase 2' : 'Phase 2', data: record.phase2, hasTrainer: true },
          { key: 'phase3', label: lang === 'es' ? 'Fase 3' : 'Phase 3', data: record.phase3, hasTrainer: true },
        ].map((p) => {
          const done = !!p.data?.passed;
          return (
            <div key={p.key} style={styles.phaseRow}>
              <span style={styles.phaseRowLabel}>
                <span style={{ color: done ? '#4CAF50' : '#555', marginRight: 6 }}>
                  {done ? '✓' : '○'}
                </span>
                {p.label}
              </span>
              <span style={styles.phaseRowValue}>
                {done ? (
                  <>
                    {formatDate(p.data.date)}
                    {p.hasTrainer && p.data.trainerName && (
                      <span style={{ color: '#888' }}> · {p.data.trainerName}</span>
                    )}
                    {p.data.bypassed && <span style={styles.bypassTag}> bypass</span>}
                  </>
                ) : (
                  <span style={{ color: '#666' }}>
                    {lang === 'es' ? 'Pendiente' : 'Pending'}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    );

    return (
      <div style={styles.list}>
        {/* Ready for approval */}
        {pending.map(({ employee, record }) => (
          <div key={employee.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardName}>{employee.name}</div>
                <div style={styles.cardRole}>
                  {lang === 'es' ? 'Trainee → Barista' : 'Trainee → Barista'}
                </div>
              </div>
              <div style={styles.readyBadge}>
                {lang === 'es' ? 'Listo' : 'Ready'}
              </div>
            </div>
            {renderPhaseRows(record)}
            <button
              style={styles.approveBtn}
              onClick={() => setConfirmModal({ employee, record })}
            >
              {lang === 'es' ? 'Aprobar y Actualizar Rol' : 'Approve & Upgrade Role'}
            </button>
          </div>
        ))}

        {/* In progress */}
        {inProgress.map(({ employee, record }) => {
          const completedCount =
            (record.phase1?.passed ? 1 : 0) +
            (record.phase2?.passed ? 1 : 0) +
            (record.phase3?.passed ? 1 : 0);
          return (
            <div key={employee.id} style={styles.historyCard}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.cardName}>{employee.name}</div>
                  <div style={styles.cardRole}>
                    {lang === 'es' ? 'Trainee — en progreso' : 'Trainee — in progress'}
                  </div>
                </div>
                <div style={styles.progressBadge}>
                  {completedCount}/3 {lang === 'es' ? 'fases' : 'phases'}
                </div>
              </div>
              {renderPhaseRows(record)}
              <div style={styles.waitingNote}>
                {lang === 'es'
                  ? 'Aprobación disponible cuando las 3 fases estén completas.'
                  : 'Approval becomes available once all 3 phases are complete.'}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── HISTORY LIST (all training records)
  const renderHistory = () => {
    const completed = allRecords.filter(({ record }) =>
      record.phase1?.passed || record.phase2?.passed || record.phase3?.passed
    );

    if (completed.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div style={styles.emptyTitle}>
            {lang === 'es' ? 'Sin historial de entrenamiento' : 'No training history'}
          </div>
          <div style={styles.emptyBody}>
            {lang === 'es'
              ? 'Los registros aparecerán aquí cuando los empleados comiencen el entrenamiento.'
              : 'Records will appear here as employees begin training.'}
          </div>
        </div>
      );
    }

    return (
      <div style={styles.list}>
        {completed.map(({ employee, record }) => {
          const p1 = record.phase1?.passed;
          const p2 = record.phase2?.passed;
          const p3 = record.phase3?.passed;
          const upgraded = record.roleUpgraded;
          return (
            <div key={employee.id} style={styles.historyCard}>
              <div style={styles.historyHeader}>
                <div>
                  <div style={styles.cardName}>{employee.name}</div>
                  <div style={styles.cardRole}>{employee.role}</div>
                </div>
                {upgraded && (
                  <div style={styles.upgradedBadge}>
                    {lang === 'es' ? 'Aprobado' : 'Approved'}
                  </div>
                )}
              </div>

              <div style={styles.phaseRows}>
                {[
                  {
                    label: lang === 'es' ? 'Fase 1' : 'Phase 1',
                    passed: p1,
                    date: record.phase1?.date,
                    trainer: null,
                    bypassed: record.phase1?.bypassed,
                  },
                  {
                    label: lang === 'es' ? 'Fase 2' : 'Phase 2',
                    passed: p2,
                    date: record.phase2?.date,
                    trainer: record.phase2?.trainerName,
                    bypassed: record.phase2?.bypassed,
                  },
                  {
                    label: lang === 'es' ? 'Fase 3' : 'Phase 3',
                    passed: p3,
                    date: record.phase3?.date,
                    trainer: record.phase3?.trainerName,
                    bypassed: record.phase3?.bypassed,
                  },
                ].map((p) => (
                  <div key={p.label} style={styles.phaseRow}>
                    <span style={styles.phaseRowLabel}>
                      <span style={{ color: p.passed ? '#4CAF50' : '#555', marginRight: 6 }}>
                        {p.passed ? '✓' : '○'}
                      </span>
                      {p.label}
                    </span>
                    <span style={styles.phaseRowValue}>
                      {p.passed ? (
                        <>
                          {formatDate(p.date)}
                          {p.trainer && <span style={{ color: '#888' }}> · {p.trainer}</span>}
                          {p.bypassed && <span style={styles.bypassTag}> bypass</span>}
                        </>
                      ) : (
                        <span style={{ color: '#444' }}>—</span>
                      )}
                    </span>
                  </div>
                ))}

                {upgraded && (
                  <div style={{ ...styles.phaseRow, borderTop: '1px solid #D4AF37', marginTop: 4, paddingTop: 10 }}>
                    <span style={{ ...styles.phaseRowLabel, color: '#D4AF37' }}>
                      {lang === 'es' ? 'Aprobado por' : 'Approved by'}
                    </span>
                    <span style={{ ...styles.phaseRowValue, color: '#D4AF37' }}>
                      {record.roleUpgradeApprovedBy} · {formatDate(record.roleUpgradeDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
          {lang === 'es' ? 'Aprobación de Entrenamiento' : 'Training Approval'}
        </div>
        <div style={styles.headerSub}>
          {lang === 'es' ? 'Solo Dueño y Gerente' : 'Owner & Manager Only'}
        </div>
      </div>

      {/* Pending count banner */}
      {pending.length > 0 && (
        <div style={styles.pendingBanner}>
          <span style={{ fontSize: 20 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: '#D4AF37' }}>
              {pending.length} {lang === 'es'
                ? `empleado${pending.length > 1 ? 's' : ''} listo${pending.length > 1 ? 's' : ''} para aprobación`
                : `employee${pending.length > 1 ? 's' : ''} ready for approval`}
            </div>
            <div style={{ fontSize: 13, color: '#aaa' }}>
              {lang === 'es'
                ? 'Todas las fases de entrenamiento completadas.'
                : 'All training phases completed.'}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(view === 'pending' ? styles.tabActive : {}) }}
          onClick={() => setView('pending')}
        >
          {lang === 'es' ? 'Pendientes' : 'Pending'}
          {pending.length > 0 && (
            <span style={styles.badge}>{pending.length}</span>
          )}
        </button>
        <button
          style={{ ...styles.tab, ...(view === 'history' ? styles.tabActive : {}) }}
          onClick={() => setView('history')}
        >
          {lang === 'es' ? 'Historial' : 'History'}
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {view === 'pending' && renderPending()}
        {view === 'history' && renderHistory()}
      </div>

      {/* Confirm modal */}
      {renderConfirmModal()}

      {/* Toast */}
      {toast && (
        <div style={{ ...styles.toast, backgroundColor: toast.type === 'error' ? '#8B0000' : '#1a3a1a', borderColor: toast.type === 'error' ? '#f44336' : '#4CAF50' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

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
  pendingBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1a1600',
    borderBottom: '1px solid #D4AF37',
    padding: '14px 20px',
  },
  tabBar: {
    display: 'flex',
    gap: 4,
    margin: '16px 16px 0',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#2A2A2A',
    color: '#D4AF37',
  },
  badge: {
    backgroundColor: '#D4AF37',
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
  content: {
    padding: '12px 16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  card: {
    backgroundColor: '#111',
    border: '1px solid #D4AF37',
    borderRadius: 12,
    padding: '16px',
  },
  historyCard: {
    backgroundColor: '#111',
    border: '1px solid #222',
    borderRadius: 12,
    padding: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#F5F0E8',
  },
  cardRole: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: '#1a3a1a',
    border: '1px solid #4CAF50',
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
  },
  upgradedBadge: {
    backgroundColor: '#1a1600',
    border: '1px solid #D4AF37',
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
  },
  progressBadge: {
    backgroundColor: 'rgba(123,179,240,0.10)',
    border: '1px solid #7BB3F0',
    color: '#7BB3F0',
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 20,
  },
  waitingNote: {
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: '4px 8px 0',
  },
  phaseRows: {
    marginBottom: 16,
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    overflow: 'hidden',
  },
  phaseRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderBottom: '1px solid #1a1a1a',
  },
  phaseRowLabel: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: 600,
  },
  phaseRowValue: {
    fontSize: 13,
    color: '#F5F0E8',
    textAlign: 'right',
  },
  bypassTag: {
    backgroundColor: '#2A2A2A',
    color: '#888',
    fontSize: 10,
    padding: '1px 5px',
    borderRadius: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  approveBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#D4AF37',
    border: 'none',
    borderRadius: 10,
    color: '#0D0D0D',
    fontSize: 15,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 0.5,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: '#888',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#555',
    fontSize: 14,
    lineHeight: 1.6,
  },
  // Modal
  overlay: {
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
  modalGold: {
    color: '#D4AF37',
    fontSize: 20,
    marginBottom: 8,
  },
  modalTitle: {
    color: '#F5F0E8',
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 4px',
  },
  modalEmployee: {
    fontSize: 22,
    fontWeight: 700,
    color: '#D4AF37',
    marginBottom: 2,
  },
  modalInfo: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  modalSummary: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid #1a1a1a',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: 600,
  },
  summaryValue: {
    color: '#F5F0E8',
    fontSize: 13,
  },
  modalNote: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  modalActions: {
    display: 'flex',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    padding: '13px',
    backgroundColor: '#0D0D0D',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#888',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnApprove: {
    flex: 2,
    padding: '13px',
    backgroundColor: '#D4AF37',
    border: 'none',
    borderRadius: 8,
    color: '#0D0D0D',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
  },
  toast: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '14px 24px',
    borderRadius: 10,
    border: '1px solid',
    color: '#F5F0E8',
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    whiteSpace: 'nowrap',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
};
