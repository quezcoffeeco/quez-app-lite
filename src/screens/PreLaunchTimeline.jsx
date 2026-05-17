// ============================================================
// QUEZ APP LITE — Pre-Launch Master Timeline
// Owner-only multi-month launch checklist (source: I-02_Pre-Launch-Master-Timeline).
// Progress in localStorage[quez_pre_launch_progress], included in JSON backup.
// ============================================================

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PHASES, CRITICAL_GATES, CATEGORY_COLORS, PRE_SOFT_OPEN_PLAYBOOK } from '../data/preLaunchTimeline';
import {
  getPreLaunchProgress,
  setPreLaunchTaskDone,
  setPreLaunchTaskNotes,
  setPreLaunchTaskHidden,
} from '../utils/storage';

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

// ── Date helpers ────────────────────────────────────────────
function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function parseTargetDate(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return Number.isNaN(d.getTime()) ? null : d;
}
function fmtPretty(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// Status badge shown on each task. Logic:
//  • Done + completedAt: "✓ on time" / "N days early" / "N days late"
//  • Open + far future:  subtle "Due <date>"
//  • Open + within 30d:  "Due in N days" (gold)
//  • Open + today:       "Due today" (red)
//  • Open + overdue:     "N days overdue" (red)
function getDateStatus(task, progressEntry) {
  const target = parseTargetDate(task.targetDate);
  if (!target) return null;
  const done = progressEntry && progressEntry.done;
  if (done) {
    const completed = progressEntry.completedAt ? new Date(progressEntry.completedAt) : null;
    if (!completed) return { tone: 'done', label: `✓ Due ${fmtPretty(target)}` };
    const completedMid = new Date(completed); completedMid.setHours(0, 0, 0, 0);
    const delta = daysBetween(target, completedMid);
    if (delta > 0)  return { tone: 'early', label: `✓ ${delta} day${delta !== 1 ? 's' : ''} early` };
    if (delta < 0)  return { tone: 'late',  label: `✓ ${-delta} day${-delta !== -1 ? 's' : ''} late` };
    return { tone: 'done', label: '✓ on time' };
  }
  const today = todayMidnight();
  const delta = daysBetween(target, today);
  if (delta < 0)  return { tone: 'overdue',  label: `${-delta} day${-delta !== -1 ? 's' : ''} overdue` };
  if (delta === 0) return { tone: 'today',   label: 'Due today' };
  if (delta <= 30) return { tone: 'soon',    label: `Due in ${delta} day${delta !== 1 ? 's' : ''}` };
  return { tone: 'far', label: `Due ${fmtPretty(target)}` };
}

const STATUS_STYLES = {
  early:   { color: '#4CAF50', background: 'rgba(76,175,80,0.12)',  border: '1px solid rgba(76,175,80,0.4)'  },
  done:    { color: '#4CAF50', background: 'rgba(76,175,80,0.12)',  border: '1px solid rgba(76,175,80,0.4)'  },
  late:    { color: '#E0A050', background: 'rgba(224,160,80,0.12)', border: '1px solid rgba(224,160,80,0.4)' },
  overdue: { color: '#E05252', background: 'rgba(224,82,82,0.15)',  border: '1px solid rgba(224,82,82,0.45)' },
  today:   { color: '#E05252', background: 'rgba(224,82,82,0.15)',  border: '1px solid rgba(224,82,82,0.45)' },
  soon:    { color: '#D4AF37', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)' },
  far:     { color: '#888',    background: 'transparent',           border: '1px solid #333' },
};

export default function PreLaunchTimeline() {
  const { currentUser } = useApp();
  const [progress, setProgress] = useState(() => getPreLaunchProgress());
  const [notesOpenFor, setNotesOpenFor] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  const isOwner = currentUser?.role === 'owner';

  // Counts ignore hidden tasks so "X / Y done" reflects what's actually on your plate.
  const { totalDone, visibleTotal, hiddenCount } = useMemo(() => {
    let done = 0, visible = 0, hidden = 0;
    PHASES.forEach((p) => p.tasks.forEach((t) => {
      const entry = progress[t.id] || {};
      if (entry.hidden) { hidden += 1; return; }
      visible += 1;
      if (entry.done) done += 1;
    }));
    return { totalDone: done, visibleTotal: visible, hiddenCount: hidden };
  }, [progress]);

  const pct = visibleTotal > 0 ? Math.round((totalDone / visibleTotal) * 100) : 0;
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
  const handleHide = (taskId, taskText) => {
    if (!window.confirm(`Hide this task?\n\n"${taskText.slice(0, 80)}${taskText.length > 80 ? '…' : ''}"\n\nYou can show hidden tasks via the toggle at the top.`)) return;
    setPreLaunchTaskHidden(taskId, true);
    refresh();
  };
  const handleUnhide = (taskId) => {
    setPreLaunchTaskHidden(taskId, false);
    refresh();
  };

  // Hard gate: this screen is owner-only. Managers (who otherwise share the
  // Owner Dashboard) cannot view the pre-launch checklist. Belt-and-suspenders
  // on top of the dashboard tile already being owner-gated.
  if (!isOwner) {
    return (
      <div style={S.screen}>
        <div style={S.header}>
          <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
          <div style={S.headerTitle}>Pre-Launch Timeline</div>
          <div style={S.headerSub}>Owner only</div>
        </div>
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 20, color: '#D4AF37', marginBottom: 8,
          }}>
            Owner Only
          </div>
          <div style={{ color: '#888', fontSize: 14, maxWidth: 320, lineHeight: 1.6 }}>
            The pre-launch timeline is restricted to the business owner.
            Manager and barista roles don't have access to this checklist.
          </div>
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
          {totalDone} / {visibleTotal} complete · {pct}% · Soft Open Feb 2027
        </div>
        <div style={S.progressBar}>
          <div style={{ ...S.progressFill, width: `${pct}%` }} />
        </div>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            style={S.showHiddenBtn}
          >
            {showHidden ? `Hide hidden tasks` : `Show ${hiddenCount} hidden task${hiddenCount !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      <div style={S.body}>
        {/* Critical Gates — separate top-of-screen view.
            Hidden tasks are excluded from gate completion: a gate is done
            when all of its NON-HIDDEN referenced tasks are done. Gates
            whose every task is hidden drop out of the list entirely. */}
        {(() => {
          const isHidden = (tid) => !!(progress[tid] && progress[tid].hidden);
          const visibleGates = CRITICAL_GATES.filter((g) =>
            g.taskIds.some((tid) => !isHidden(tid))
          );
          const gateAllDone = (g) => {
            const live = g.taskIds.filter((tid) => !isHidden(tid));
            return live.length > 0 && live.every((tid) => progress[tid] && progress[tid].done);
          };
          const gateSomeDone = (g) =>
            g.taskIds.filter((tid) => !isHidden(tid)).some((tid) => progress[tid] && progress[tid].done);
          const gateDone = visibleGates.filter(gateAllDone).length;
          const gatePct = visibleGates.length > 0 ? Math.round((gateDone / visibleGates.length) * 100) : 0;
          return (
        <CollapsibleSection
          id="gates"
          title="⚠ Critical Gates"
          subtitle="If any of these slip, the launch slips."
          progressPct={gatePct}
          headerRight={<span style={S.sectionCount}>{gateDone}/{visibleGates.length}</span>}
        >
          {visibleGates.map((g) => {
            const allDone = gateAllDone(g);
            const someDone = gateSomeDone(g);
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
          );
        })()}

        {/* Each phase — collapsible */}
        {PHASES.map((phase) => {
          const visibleTasks = phase.tasks.filter((t) => {
            const entry = progress[t.id] || {};
            return showHidden ? true : !entry.hidden;
          });
          if (visibleTasks.length === 0) return null;
          const tasksForCount = phase.tasks.filter((t) => !(progress[t.id] && progress[t.id].hidden));
          const done = tasksForCount.filter((t) => progress[t.id] && progress[t.id].done).length;
          const total = tasksForCount.length;
          const phasePct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <CollapsibleSection
              key={phase.id}
              id={phase.id}
              title={phase.title}
              subtitle={phase.subtitle}
              progressPct={phasePct}
              headerRight={
                <span style={S.sectionCount}>{done}/{total}</span>
              }
            >
              {visibleTasks.map((task) => {
                const state = progress[task.id] || {};
                const done = !!state.done;
                const hidden = !!state.hidden;
                const notesOpen = notesOpenFor === task.id;
                const catColor = CATEGORY_COLORS[task.category] || '#888';
                const status = getDateStatus(task, state);
                return (
                  <div key={task.id} style={{ ...S.taskRow, ...(done ? S.taskRowDone : {}), ...(hidden ? S.taskRowHidden : {}) }}>
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
                        {status && (
                          <span style={{ ...S.statusChip, ...STATUS_STYLES[status.tone] }}>
                            {status.label}
                          </span>
                        )}
                        {hidden && (
                          <span style={S.hiddenChip}>hidden</span>
                        )}
                      </div>
                      <div style={{ ...S.taskText, ...(done ? S.taskTextDone : {}) }}>
                        {task.text}
                      </div>
                      <div style={S.taskActions}>
                        <button
                          type="button"
                          onClick={() => setNotesOpenFor(notesOpen ? null : task.id)}
                          style={S.notesToggle}
                        >
                          {state.notes
                            ? `📝 Notes (${state.notes.length} chars)`
                            : notesOpen ? '— Hide notes' : '+ Add notes'}
                        </button>
                        {hidden ? (
                          <button type="button" onClick={() => handleUnhide(task.id)} style={S.unhideBtn}>
                            ↺ Unhide
                          </button>
                        ) : (
                          <button type="button" onClick={() => handleHide(task.id, task.text)} style={S.hideBtn}>
                            ✕ Hide
                          </button>
                        )}
                      </div>
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

        {/* ── Pre-Soft-Open Preview Playbook ──
            Optional reference at the very bottom. Items live in the same
            quez_pre_launch_progress store but are intentionally NOT counted
            in any progress bar or critical gate — every counter above only
            iterates PHASES, never PRE_SOFT_OPEN_PLAYBOOK.groups. */}
        <PlaybookBlock
          playbook={PRE_SOFT_OPEN_PLAYBOOK}
          progress={progress}
          notesOpenFor={notesOpenFor}
          setNotesOpenFor={setNotesOpenFor}
          handleToggle={handleToggle}
          handleNotesChange={handleNotesChange}
        />
      </div>
    </div>
  );
}

function PlaybookBlock({ playbook, progress, notesOpenFor, setNotesOpenFor, handleToggle, handleNotesChange }) {
  const [collapsed, setCollapsed] = useState(() => {
    const state = getCollapseState();
    return playbook.id in state ? !!state[playbook.id] : true;
  });
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    persistCollapse(playbook.id, next);
  };
  // Item count is informational only — don't include it in the screen totals.
  const totalItems = playbook.groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems = playbook.groups.reduce(
    (s, g) => s + g.items.filter((i) => progress[i.id] && progress[i.id].done).length,
    0
  );
  return (
    <div style={S.playbookSection}>
      <div style={{ ...S.sectionHeader, borderBottom: collapsed ? 'none' : S.sectionHeader.borderBottom }}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          style={S.sectionHeaderBtn}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={S.playbookTitle}>📓 {playbook.title}</div>
            {playbook.subtitle && <div style={S.sectionSub}>{playbook.subtitle}</div>}
          </div>
          <span
            aria-hidden="true"
            style={{
              color: '#7BB3F0',
              fontSize: 16,
              transition: 'transform 0.18s ease',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              display: 'inline-block',
              marginLeft: 8,
            }}
          >▾</span>
        </button>
        <div onClick={(e) => e.stopPropagation()} style={{ marginLeft: 8 }}>
          <span style={S.playbookBadge}>NOT IN PROGRESS</span>
        </div>
      </div>
      {!collapsed && (
        <div style={S.playbookBody}>
          {playbook.intro && (
            <div style={S.playbookIntro}>{playbook.intro}</div>
          )}
          <div style={S.playbookCount}>{doneItems} / {totalItems} items checked</div>
          {playbook.groups.map((group) => (
            <div key={group.label} style={S.playbookGroup}>
              <div style={S.playbookGroupLabel}>{group.label}</div>
              {group.items.map((item) => {
                const state = progress[item.id] || {};
                const done = !!state.done;
                const notesOpen = notesOpenFor === item.id;
                return (
                  <div key={item.id} style={{ ...S.taskRow, ...(done ? S.taskRowDone : {}) }}>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      style={{ ...S.checkbox, ...(done ? S.checkboxDone : {}) }}
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done && <span style={S.checkboxCheck}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...S.taskText, ...(done ? S.taskTextDone : {}) }}>
                        {item.text}
                      </div>
                      <div style={S.taskActions}>
                        <button
                          type="button"
                          onClick={() => setNotesOpenFor(notesOpen ? null : item.id)}
                          style={S.notesToggle}
                        >
                          {state.notes
                            ? `📝 Notes (${state.notes.length} chars)`
                            : notesOpen ? '— Hide notes' : '+ Add notes'}
                        </button>
                      </div>
                      {notesOpen && (
                        <textarea
                          value={state.notes || ''}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          placeholder="Vendor names, quotes, follow-ups..."
                          style={S.notesInput}
                          rows={3}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleSection({ id, title, subtitle, headerRight, progressPct, children }) {
  const [collapsed, setCollapsed] = useState(() => {
    const state = getCollapseState();
    return id in state ? !!state[id] : true;
  });
  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    persistCollapse(id, next);
  };
  const hasProgress = typeof progressPct === 'number';
  const pct = hasProgress ? Math.max(0, Math.min(100, progressPct)) : 0;
  const allDone = hasProgress && pct >= 100;
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
      {hasProgress && (
        <div style={S.sectionProgressTrack}>
          <div
            style={{
              ...S.sectionProgressFill,
              width: `${pct}%`,
              background: allDone
                ? 'linear-gradient(90deg, #4CAF50, #6BBF6E)'
                : 'linear-gradient(90deg, #D4AF37, #B8941C)',
            }}
          />
        </div>
      )}
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
  progressBar: { height: 8, background: '#222', borderRadius: 4, marginTop: 10, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #D4AF37, #B8941C)', transition: 'width 0.3s ease' },
  showHiddenBtn: { marginTop: 10, background: 'transparent', border: '1px solid #333', color: '#888', fontSize: 11, padding: '4px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em' },

  body: { padding: '12px 12px' },

  section: { margin: '12px 0', background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.15)', borderRadius: 10, overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid rgba(212,175,55,0.1)' },
  sectionHeaderBtn: { flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', font: 'inherit', textAlign: 'left', minWidth: 0 },
  sectionTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontFamily: 'sans-serif' },
  sectionSub: { fontSize: 11, color: '#888', marginTop: 2 },
  sectionCount: { background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.25)', borderRadius: 10, color: '#D4AF37', fontSize: 11, padding: '2px 9px', fontWeight: 700 },
  sectionProgressTrack: { height: 3, background: '#0D0D0D', overflow: 'hidden' },
  sectionProgressFill: { height: '100%', transition: 'width 0.3s ease' },
  sectionBody: { padding: '4px 0' },

  taskRow: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: '1px solid #222' },
  taskRowDone: { opacity: 0.62 },
  taskRowHidden: { opacity: 0.45, borderLeft: '3px solid #333' },
  checkbox: { width: 24, height: 24, borderRadius: 6, border: '2px solid #555', background: 'transparent', cursor: 'pointer', flexShrink: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxDone: { background: '#D4AF37', borderColor: '#D4AF37' },
  checkboxCheck: { color: '#0D0D0D', fontWeight: 900, fontSize: 14 },
  taskMetaRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  taskWhen: { fontSize: 10, fontWeight: 700, color: '#D4AF37', letterSpacing: '0.06em', textTransform: 'uppercase' },
  taskCatChip: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, border: '1px solid', letterSpacing: '0.04em' },
  statusChip: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.04em' },
  hiddenChip: { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, color: '#666', border: '1px solid #444', letterSpacing: '0.04em', textTransform: 'uppercase' },
  taskText: { fontSize: 13, color: '#F5F0E8', lineHeight: 1.45 },
  taskTextDone: { textDecoration: 'line-through', color: '#888' },
  taskActions: { display: 'flex', gap: 12, marginTop: 6, alignItems: 'center' },
  notesToggle: { padding: '4px 0', background: 'transparent', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  hideBtn: { padding: '4px 0', background: 'transparent', border: 'none', color: '#666', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' },
  unhideBtn: { padding: '4px 8px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 6, marginLeft: 'auto', fontWeight: 700 },
  notesInput: { width: '100%', marginTop: 6, padding: '8px 10px', background: '#0D0D0D', border: '1px solid #333', borderRadius: 6, color: '#F5F0E8', fontFamily: 'inherit', fontSize: 13, resize: 'vertical' },

  gateRow: { display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #222' },
  gateBadge: { width: 26, height: 26, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 },
  gateBadgePending: { background: 'rgba(224,82,82,0.15)', border: '1px solid rgba(224,82,82,0.4)', color: '#E05252' },
  gateBadgePartial: { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)', color: '#D4AF37' },
  gateBadgeDone:    { background: 'rgba(76,175,80,0.15)',  border: '1px solid rgba(76,175,80,0.4)',  color: '#4CAF50' },
  gateLabel: { fontSize: 13, color: '#F5F0E8', fontWeight: 600, marginBottom: 2 },
  gateMeta: { fontSize: 11, lineHeight: 1.4 },

  // Playbook block — visually distinct (blue accent) so it reads as
  // "reference material, not part of the timeline".
  playbookSection: { marginTop: 24, marginBottom: 12, background: '#141A22', border: '1px dashed rgba(123,179,240,0.45)', borderRadius: 10, overflow: 'hidden' },
  playbookTitle: { fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7BB3F0', fontFamily: 'sans-serif' },
  playbookBadge: { background: 'rgba(123,179,240,0.12)', border: '1px solid rgba(123,179,240,0.4)', borderRadius: 10, color: '#7BB3F0', fontSize: 9, padding: '3px 8px', fontWeight: 800, letterSpacing: '0.1em' },
  playbookBody: { padding: '12px 14px 8px' },
  playbookIntro: { fontSize: 12, color: '#C8C0B0', lineHeight: 1.5, marginBottom: 12, padding: '10px 12px', background: 'rgba(123,179,240,0.06)', border: '1px solid rgba(123,179,240,0.18)', borderRadius: 8 },
  playbookCount: { fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 },
  playbookGroup: { marginBottom: 14 },
  playbookGroupLabel: { fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7BB3F0', marginBottom: 6, paddingLeft: 2 },
};
