// ============================================================
// QUEZ APP LITE — Pre-Launch Master Timeline
// Owner-only multi-month launch checklist (source: I-02_Pre-Launch-Master-Timeline).
// Progress in localStorage[quez_pre_launch_progress], included in JSON backup.
// ============================================================

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PHASES, CRITICAL_GATES, CATEGORY_COLORS, TOTAL_TASKS } from '../data/preLaunchTimeline';
import { getPreLaunchProgress, setPreLaunchTaskDone, setPreLaunchTaskNotes } from '../utils/storage';

const PANEL_COLLAPSE_KEY = 'quez_prelaunch_panel_collapsed';
function getCollapseState() {
  try { return JSON.parse(localStorage.getItem(PANEL_COLLAPSE_KEY) || '{}') || {}; }
  catch { return {}; }
}
function persistCollapse(id, collapsed) {
  const state = getCollapseState();
  state[id] = collapsed;
  try { localStorage.setItem(PANEL_COLLAPSE_KEY, JSON.stringify(state)); } catch {}
}

function fmtCompletedDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function PreLaunchTimeline() {
  const { currentUser } = useApp();
  const [progress, setProgress] = useState(() => getPreLaunchProgress());
  const [notesOpenFor, setNotesOpenFor] = useState(null);

  const isOwner = currentUser?.role === 'owner';

  const totalDone = useMemo(
    () => Object.values(progress).filter((v) => v && v.done).length,
    [progress]
  );
  const pct = TOTAL_TASKS > 0 ? Math.round((totalDone / TOTAL_TASKS) * 100) : 0;

  const refresh = () => setProgress(getPreLaunchProgress());

  const handleToggle = (taskId) => {
    const current = progress[taskId];
    const nextDone = !(current && current.done);
    setPreLaunchTaskDone(taskId, nextDone, currentUser?.name || 'system');
    refresh();
  };

  const handleNotesChange = (taskId, notes) => {
    setPreLaunchTaskNotes(taskId, notes);
    refresh();
  };

  if (!isOwner) {
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
          <div style={S.headerTitle}>Pre-Launch Timeline</div>
          <div style={S.headerSub}>Owner only</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          This checklist is owner-only.
        </div>
      </div>
    );
  }

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>Pre-Launch Timeline</div>
        <div style={S.headerSub}>
          {totalDone} / {TOTAL_TASKS} complete · Soft Open Feb 2027
        </div>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>
      </div>

      <div style={S.body}>
        {/* Critical Gates — separate top-of-screen view */}
        <CollapsibleSection id="gates" title="⚠ Critical Gates" subtitle="If any of these slip, the launch slips.">
          {CRITICAL_GATES.map((g) => {
            const allDone = g.taskIds.every((tid) => progress[tid] && progress[tid].done);
            const someDone = g.taskIds.some((tid) => progress[tid] && progress[tid].done);
            return (
              <div key={g.id} style={S.gateRow}>
                <div style={{ ...S.gateBadge, ...(allDone ? S.gateBadgeDone : someDone ? S.gateBadgePartial : S.gateBadgePending) }}>
                  {allDone ? '✓' : someDone ? '◐' : '○'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.gateLabel}>{g.label}</div>
                  <div style={S.gateMeta}>
                    <span style={{ color: '#D4AF37' }}>{g.when}</span>
                    <span style={{ color: '#888' }}> · gates: {g.gates}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CollapsibleSection>

        {/* Each phase — collapsible */}
        {PHASES.map((phase) => {
          const done = phase.tasks.filter((t) => progress[t.id] && progress[t.id].done).length;
          const total = phase.tasks.length;
          return (
            <CollapsibleSection
              key={phase.id}
              id={phase.id}
              title={phase.title}
              subtitle={phase.subtitle}
              headerRight={
                <span style={S.sectionCount}>{done}/{total}</span>
              }
            >
              {phase.tasks.map((task) => {
                const state = progress[task.id] || {};
                const done = !!state.done;
                const notesOpen = notesOpenFor === task.id;
                const catColor = CATEGORY_COLORS[task.category] || '#888';
                return (
                  <div key={task.id} style={{ ...S.taskRow, ...(done ? S.taskRowDone : {}) }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(task.id)}
                      style={{ ...S.checkbox, ...(done ? S.checkboxDone : {}) }}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done && <span style={S.checkboxCheck}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={S.taskMetaRow}>
                        <span style={S.taskWhen}>{task.when}</span>
                        <span style={{ ...S.taskCatChip, color: catColor, borderColor: catColor + '55', background: catColor + '15' }}>
                          {task.category}
                        </span>
                        {done && state.completedAt && (
                          <span style={S.taskCompletedAt}>✓ {fmtCompletedDate(state.completedAt)}</span>
                        )}
                      </div>
                      <div style={{ ...S.taskText, ...(done ? S.taskTextDone : {}) }}>
                        {task.text}
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotesOpenFor(notesOpen ? null : task.id)}
                        style={S.notesToggle}
                      >
                        {state.notes
                          ? `📝 Notes (${state.notes.length} chars)`
                          : notesOpen ? '— Hide notes' : '+ Add notes'}
                      </button>
                      {notesOpen && (
                        <textarea
                          value={state.notes || ''}
                          onChange={(e) => handleNotesChange(task.id, e.target.value)}
                          placeholder="Vendor names, quotes, follow-ups..."
                          style={S.notesInput}
                          rows={3}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </CollapsibleSection>
          );
        })}
      </div>
    </div>
  );
}

function CollapsibleSection({ id, title, subtitle, headerRight, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const state = getCollapseState();
    return id in state ? !!state[id] : true;
  });
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    persistCollapse(id, next);
  };
  return (
    <div style={S.section}>
      <div style={{ ...S.sectionHeader, borderBottom: collapsed ? 'none' : S.sectionHeader.borderBottom }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          style={S.sectionHeaderBtn}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.sectionTitle}>{title}</div>
            {subtitle && <div style={S.sectionSub}>{subtitle}</div>}
          </div>
          <span
            aria-hidden="true"
            style={{
              color: '#D4AF37',
              fontSize: 16,
              transition: 'transform 0.18s ease',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              display: 'inline-block',
              marginLeft: 8,
            }}
          >▾</span>
        </button>
        {headerRight && <div onClick={(e) => e.stopPropagation()} style={{ marginLeft: 8 }}>{headerRight}</div>}
      </div>
      {!collapsed && <div style={S.sectionBody}>{children}</div>}
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10 },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },
  progressBar: { height: 4, background: '#222', borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #D4AF37, #B8941C)', transition: 'width 0.3s ease' },

  body: { padding: '12px 12px' },

  section: { margin: '12px 0', background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10, overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid rgba(212,175,55,0.1)' },
  sectionHeaderBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', font: 'inherit', textAlign: 'left', minWidth: 0 },
  sectionTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontFamily: 'sans-serif' },
  sectionSub: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionCount: { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, color: '#D4AF37', fontSize: 11, padding: '2px 9px', fontWeight: 700 },
  sectionBody: { padding: '4px 0' },

  taskRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: '1px solid #222' },
  taskRowDone: { opacity: 0.62 },
  checkbox: { width: 24, height: 24, borderRadius: 6, border: '2px solid #555', background: 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxDone: { background: '#D4AF37', borderColor: '#D4AF37' },
  checkboxCheck: { color: '#0D0D0D', fontWeight: 900, fontSize: 14 },
  taskMetaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  taskWhen: { fontSize: 10, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.06em', textTransform: 'uppercase' },
  taskCatChip: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid', letterSpacing: '0.04em' },
  taskCompletedAt: { fontSize: 10, color: '#4CAF50', fontWeight: 700 },
  taskText: { fontSize: 13, color: '#F5F0E8', lineHeight: 1.45 },
  taskTextDone: { textDecoration: 'line-through', color: '#888' },
  notesToggle: { marginTop: 6, padding: '4px 0', background: 'transparent', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  notesInput: { width: '100%', marginTop: 6, padding: '8px 10px', background: '#0D0D0D', border: '1px solid #333', borderRadius: 6, color: '#F5F0E8', fontFamily: 'inherit', fontSize: 13, resize: 'vertical' },

  gateRow: { display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #222' },
  gateBadge: { width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  gateBadgePending: { background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.4)', color: '#E05252' },
  gateBadgePartial: { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' },
  gateBadgeDone:    { background: 'rgba(76,175,80,0.15)',  border: '1px solid rgba(76,175,80,0.4)',  color: '#4CAF50' },
  gateLabel: { fontSize: 13, color: '#F5F0E8', fontWeight: 600, marginBottom: 2 },
  gateMeta: { fontSize: 11, lineHeight: 1.4 },
};
