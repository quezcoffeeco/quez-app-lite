// ============================================================
// QUEZ APP LITE — Schedule.jsx
// Weekly shift scheduling. Owner/Manager creates shifts; staff view their own.
// ============================================================

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  getEmployees,
  getShiftsForDate,
  getSchedule,
  addShift,
  updateShift,
  removeShift,
  isoDateKey,
  logAudit,
  getSettings,
  getReportRecipients,
  downloadCsv,
  getCalendarNote,
  setCalendarNote,
} from '../utils/storage';
import { sendQuezEmail } from '../utils/emailjs';
import { fmtShiftTime } from '../utils/timeFormat';

const DAY_LABELS = {
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  es: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
};

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay()); // back to Sunday
  return x;
}

// Schedule shifts are stored as 24-hour "HH:MM" — fmtShiftTime renders them
// in the canonical "h:mm am" format used everywhere else in the app.
const fmtTime = fmtShiftTime;

export default function Schedule() {
  const { language, currentUser } = useApp();
  const lang = language || 'en';
  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  const [weekStart, setWeekStart] = useState(() => startOfWeek());
  const [editor, setEditor] = useState(null); // { dateStr, shift? }
  const [refresh, setRefresh] = useState(0); // bump to reload
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'calendar'
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const [emailStatus, setEmailStatus] = useState(''); // '' | 'sending' | 'sent' | 'error'

  const week = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const employees = getEmployees().filter((e) => e.active !== false);

  const goPrev = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d); };
  const goNext = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d); };
  const goThis = () => setWeekStart(startOfWeek());

  const formatRange = () => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(weekStart)} – ${fmt(end)}`;
  };

  const handleSaveShift = (data) => {
    const { dateStr, shiftId, employeeId, start, end, note } = data;
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;
    if (shiftId) {
      updateShift(dateStr, shiftId, { employeeId, employeeName: emp.name, start, end, note });
      logAudit('shift_update', { dateStr, shiftId, employeeName: emp.name, by: currentUser?.name });
    } else {
      addShift(dateStr, { employeeId, employeeName: emp.name, start, end, note });
      logAudit('shift_create', { dateStr, employeeName: emp.name, by: currentUser?.name });
    }
    setRefresh((n) => n + 1);
    setEditor(null);
  };

  const handleRemove = (dateStr, shiftId, employeeName) => {
    if (!window.confirm(lang === 'es' ? `¿Eliminar turno de ${employeeName}?` : `Delete shift for ${employeeName}?`)) return;
    removeShift(dateStr, shiftId);
    logAudit('shift_delete', { dateStr, shiftId, employeeName, by: currentUser?.name });
    setRefresh((n) => n + 1);
  };

  // ── Email schedule ─────────────────────────────────────────
  function buildScheduleEmail(range) {
    let title = '';
    let startDate;
    let dayCount;
    const now = new Date(weekStart);

    if (range === 'thisWeek') {
      title = 'This Week';
      startDate = new Date(weekStart);
      dayCount = 7;
    } else if (range === 'nextWeek') {
      title = 'Next Week';
      startDate = new Date(weekStart); startDate.setDate(startDate.getDate() + 7);
      dayCount = 7;
    } else if (range === 'month') {
      title = 'This Month';
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      dayCount = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }

    const schedule = getSchedule();
    const lines = [];
    let totalShifts = 0;
    const seenDays = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = isoDateKey(d);
      const list = (schedule[key] || []).slice().sort((a, b) => (a.start || '').localeCompare(b.start || ''));
      if (list.length === 0) continue;
      seenDays.push(d);
      const dayLine = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      lines.push(`\n${dayLine}`);
      for (const s of list) {
        lines.push(`  ${fmtTime(s.start)}–${fmtTime(s.end)}  ${s.employeeName}${s.note ? ' — ' + s.note : ''}`);
        totalShifts += 1;
      }
    }

    if (totalShifts === 0) {
      return {
        subject: `[Quez Schedule] ${title} — no shifts scheduled`,
        body: `No shifts were scheduled for ${title.toLowerCase()}.\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
      };
    }
    return {
      subject: `[Quez Schedule] ${title} — ${totalShifts} shifts`,
      body:
        `Schedule — ${title}\n` +
        `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${(() => {
          const e = new Date(startDate); e.setDate(e.getDate() + dayCount - 1);
          return e.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        })()}\n` +
        `${totalShifts} shifts across ${seenDays.length} day${seenDays.length !== 1 ? 's' : ''}\n` +
        `${lines.join('\n')}\n\nQUEZ COFFEE CO. LLC · Council Bluffs, Iowa`,
    };
  }

  async function sendScheduleEmail(range) {
    setEmailMenuOpen(false);
    setEmailStatus('sending');
    const settings = getSettings();
    const recipients = getReportRecipients();
    const report = buildScheduleEmail(range);
    try {
      for (const to of recipients) {
        await sendQuezEmail({
          subject: report.subject,
          templateParams: {
            to_email: to,
            subject: report.subject,
            message: report.body,
            operator: currentUser?.name || 'Schedule',
            location: settings?.locations?.[0] || 'Quez Coffee Co.',
            timestamp: new Date().toISOString(),
          },
        });
      }
      setEmailStatus('sent');
      logAudit('schedule_emailed', { range, recipients: recipients.length, by: currentUser?.name });
    } catch (e) {
      console.warn('Schedule email failed:', e);
      setEmailStatus('error');
    }
    setTimeout(() => setEmailStatus(''), 3500);
  }

  function exportScheduleCsv(range = 'thisWeek') {
    const schedule = getSchedule();
    let startDate, dayCount, label;
    if (range === 'thisWeek')  { startDate = new Date(weekStart);                                   dayCount = 7;  label = 'this-week'; }
    else if (range === 'nextWeek') { startDate = new Date(weekStart); startDate.setDate(startDate.getDate() + 7); dayCount = 7; label = 'next-week'; }
    else { startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1); dayCount = new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 0).getDate(); label = 'month'; }
    const rows = [];
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(startDate); d.setDate(startDate.getDate() + i);
      const k = isoDateKey(d);
      (schedule[k] || []).forEach((s) => {
        rows.push({
          date: k,
          weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
          employee: s.employeeName,
          start: s.start,
          end: s.end,
          note: s.note || '',
        });
      });
    }
    if (rows.length === 0) {
      setEmailStatus('sent'); // reuse status for "nothing to export"
      return;
    }
    downloadCsv(`schedule-${label}-${new Date().toISOString().slice(0,10)}.csv`, rows);
    setEmailMenuOpen(false);
  }

  return (
    <div style={S.screen}>
      <div style={S.header}>
        <div style={S.headerLogo}>✦ QUEZ COFFEE CO.</div>
        <div style={S.headerTitle}>{lang === 'es' ? 'Horario' : 'Schedule'}</div>
        <div style={S.headerSub}>{formatRange()}</div>
      </div>

      {/* View toggle + email actions */}
      <div style={S.toolbar}>
        <div style={S.viewToggle}>
          <button
            style={{ ...S.viewBtn, ...(viewMode === 'week' ? S.viewBtnActive : {}) }}
            onClick={() => setViewMode('week')}
          >
            {lang === 'es' ? 'Semana' : 'Week'}
          </button>
          <button
            style={{ ...S.viewBtn, ...(viewMode === 'calendar' ? S.viewBtnActive : {}) }}
            onClick={() => setViewMode('calendar')}
          >
            {lang === 'es' ? 'Calendario' : 'Calendar'}
          </button>
        </div>
        {isAdmin && (
          <div style={{ position: 'relative' }}>
            <button style={S.emailBtn} onClick={() => setEmailMenuOpen((o) => !o)}>
              ✉ {lang === 'es' ? 'Enviar' : 'Email'}
            </button>
            {emailMenuOpen && (
              <div style={S.emailMenu}>
                <div style={S.emailMenuLabel}>{lang === 'es' ? 'Enviar Correo' : 'Email'}</div>
                <button style={S.emailMenuItem} onClick={() => sendScheduleEmail('thisWeek')}>
                  ✉ {lang === 'es' ? 'Esta Semana' : 'This Week'}
                </button>
                <button style={S.emailMenuItem} onClick={() => sendScheduleEmail('nextWeek')}>
                  ✉ {lang === 'es' ? 'Próxima Semana' : 'Next Week'}
                </button>
                <button style={S.emailMenuItem} onClick={() => sendScheduleEmail('month')}>
                  ✉ {lang === 'es' ? 'Este Mes' : 'This Month'}
                </button>
                <div style={{ ...S.emailMenuLabel, marginTop: 4 }}>{lang === 'es' ? 'Exportar CSV' : 'CSV Export'}</div>
                <button style={S.emailMenuItem} onClick={() => exportScheduleCsv('thisWeek')}>
                  ⬇ {lang === 'es' ? 'Esta Semana' : 'This Week'}
                </button>
                <button style={S.emailMenuItem} onClick={() => exportScheduleCsv('nextWeek')}>
                  ⬇ {lang === 'es' ? 'Próxima Semana' : 'Next Week'}
                </button>
                <button style={S.emailMenuItem} onClick={() => exportScheduleCsv('month')}>
                  ⬇ {lang === 'es' ? 'Este Mes' : 'This Month'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {emailStatus && (
        <div style={{
          ...S.statusBar,
          color: emailStatus === 'error' ? '#E05252' : '#4CAF50',
        }}>
          {emailStatus === 'sending'
            ? (lang === 'es' ? 'Enviando reporte...' : 'Sending schedule...')
            : emailStatus === 'sent'
            ? (lang === 'es' ? '✓ Reporte enviado' : '✓ Schedule sent')
            : (lang === 'es' ? '✗ Error al enviar' : '✗ Failed to send')}
        </div>
      )}

      <div style={S.weekNav}>
        <button style={S.navBtn} onClick={goPrev}>‹</button>
        <button style={S.todayBtn} onClick={goThis}>{lang === 'es' ? 'Esta Semana' : 'This Week'}</button>
        <button style={S.navBtn} onClick={goNext}>›</button>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView
          baseDate={weekStart}
          schedule={getSchedule()}
          isAdmin={isAdmin}
          currentUserId={currentUser?.id}
          lang={lang}
          onAddShift={(dateStr) => isAdmin && setEditor({ dateStr })}
        />
      ) : (
      <div style={S.body}>
        {week.map((d) => {
          const dateStr = isoDateKey(d);
          const shifts = getShiftsForDate(dateStr).slice().sort((a, b) => (a.start || '').localeCompare(b.start || ''));
          const isToday = isoDateKey(new Date()) === dateStr;
          // Everyone sees the WHOLE schedule. Only admins can edit/add/delete.
          const allShifts = shifts;
          const note = getCalendarNote(dateStr);
          return (
            <div key={dateStr} style={{ ...S.dayCard, ...(isToday ? S.dayCardToday : {}) }}>
              <div style={S.dayHeader}>
                <div>
                  <div style={S.dayName}>
                    {DAY_LABELS[lang][d.getDay()]}
                    {isToday && <span style={S.todayPill}>{lang === 'es' ? 'Hoy' : 'Today'}</span>}
                  </div>
                  <div style={S.dayDate}>
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={S.addBtn} onClick={() => {
                      const next = window.prompt(lang === 'es' ? 'Nota para este día (deja vacío para borrar):' : 'Note for this day (leave blank to clear):', note);
                      if (next !== null) {
                        setCalendarNote(dateStr, next);
                        setRefresh((n) => n + 1);
                      }
                    }}>
                      📝
                    </button>
                    <button style={S.addBtn} onClick={() => setEditor({ dateStr })}>
                      + {lang === 'es' ? 'Turno' : 'Shift'}
                    </button>
                  </div>
                )}
              </div>

              {note && (
                <div style={S.noteBanner}>
                  📝 {note}
                </div>
              )}

              {allShifts.length === 0 ? (
                <div style={S.empty}>
                  {currentUser?.role === 'trainee'
                    ? (lang === 'es' ? 'En entrenamiento — sin turnos asignados todavía' : "You're in training — no shifts assigned yet")
                    : (lang === 'es' ? 'Sin turnos programados' : 'No shifts scheduled')}
                </div>
              ) : (
                <div style={S.shiftList}>
                  {allShifts.map((s) => {
                    const isMine = s.employeeId === currentUser?.id;
                    return (
                      <div key={s.id} style={{ ...S.shiftRow, ...(isMine ? S.shiftRowMine : {}) }}>
                        <div style={S.shiftMain}>
                          <div style={S.shiftName}>
                            {s.employeeName}
                            {isMine && <span style={S.youPill}>{lang === 'es' ? 'TÚ' : 'YOU'}</span>}
                          </div>
                          <div style={S.shiftTime}>{fmtTime(s.start)} – {fmtTime(s.end)}</div>
                          {s.note && <div style={S.shiftNote}>📝 {s.note}</div>}
                        </div>
                        {isAdmin && (
                          <div style={S.shiftActions}>
                            <button style={S.iconBtn} onClick={() => setEditor({ dateStr, shift: s })}>✎</button>
                            <button style={{ ...S.iconBtn, color: '#E05252' }} onClick={() => handleRemove(dateStr, s.id, s.employeeName)}>✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {editor && (
        <ShiftEditor
          lang={lang}
          dateStr={editor.dateStr}
          shift={editor.shift}
          employees={employees}
          onSave={handleSaveShift}
          onClose={() => setEditor(null)}
        />
      )}

      {/* Force re-render when refresh bumps */}
      <div style={{ display: 'none' }}>{refresh}</div>
    </div>
  );
}

// ── Calendar View (month grid) ────────────────────────────
function CalendarView({ baseDate, schedule, isAdmin, currentUserId, lang, onAddShift }) {
  const [cursor, setCursor] = useState(() => new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));

  const monthName = cursor.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
  const firstDow  = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const lastDate  = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div style={CV.wrap}>
      <div style={CV.monthNav}>
        <button style={CV.navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button>
        <div style={CV.monthLabel}>{monthName}</div>
        <button style={CV.navBtn} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button>
      </div>

      <div style={CV.dowRow}>
        {(lang === 'es' ? ['D','L','M','M','J','V','S'] : ['S','M','T','W','T','F','S']).map((c, i) => (
          <div key={i} style={CV.dowCell}>{c}</div>
        ))}
      </div>

      <div style={CV.grid}>
        {cells.map((d, i) => {
          if (d === null) return <div key={i} style={CV.cellEmpty} />;
          const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const all = schedule[dateStr] || [];
          const hasMine = all.some((s) => s.employeeId === currentUserId);
          const isToday = dateStr === todayKey;
          return (
            <button
              key={i}
              style={{ ...CV.cell, ...(isToday ? CV.cellToday : {}), ...(all.length > 0 ? CV.cellHasShift : {}) }}
              onClick={() => isAdmin && onAddShift(dateStr)}
              disabled={!isAdmin}
            >
              <div style={{ ...CV.cellNum, ...(hasMine ? { color: '#D4AF37', fontWeight: 800 } : {}) }}>{d}</div>
              {all.length > 0 && (
                <div style={CV.cellDots}>
                  {all.slice(0, 3).map((s, idx) => (
                    <span key={idx} style={{ ...CV.dot, background: s.employeeId === currentUserId ? '#D4AF37' : '#888' }} />
                  ))}
                  {all.length > 3 && <span style={{ ...CV.dot, background: '#555' }} />}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CV = {
  wrap: { padding: '12px 14px' },
  monthNav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  monthLabel: { fontFamily: 'Georgia, serif', fontSize: 17, color: '#D4AF37', fontWeight: 700 },
  navBtn: { background: '#2A2A2A', border: '1px solid #333', color: '#D4AF37', width: 34, height: 34, borderRadius: 9, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit' },
  dowRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 },
  dowCell: { textAlign: 'center', fontSize: 10, color: '#888', fontWeight: 700, letterSpacing: '0.08em' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  cell: { aspectRatio: '1', background: '#111', border: '1px solid #2A2A2A', borderRadius: 7, color: '#ccc', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '5px 4px 4px', overflow: 'hidden' },
  cellEmpty: { aspectRatio: '1' },
  cellToday: { border: '1px solid #D4AF37', boxShadow: '0 0 0 1px rgba(212,175,55,0.2) inset' },
  cellHasShift: { background: 'rgba(212,175,55,0.06)' },
  cellNum: { fontSize: 13, fontWeight: 600 },
  cellDots: { display: 'flex', gap: 3, marginBottom: 2 },
  dot: { width: 5, height: 5, borderRadius: '50%', background: '#D4AF37' },
};

// ── Shift Editor Modal ────────────────────────────────────
function ShiftEditor({ lang, dateStr, shift, employees, onSave, onClose }) {
  const [employeeId, setEmployeeId] = useState(shift?.employeeId || '');
  const [start, setStart] = useState(shift?.start || '06:00');
  const [end,   setEnd]   = useState(shift?.end   || '13:00');
  const [note,  setNote]  = useState(shift?.note  || '');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!employeeId) { setErr(lang === 'es' ? 'Selecciona un empleado.' : 'Pick an employee.'); return; }
    if (start >= end) { setErr(lang === 'es' ? 'La hora de fin debe ser después de la de inicio.' : 'End must be after start.'); return; }
    onSave({ dateStr, shiftId: shift?.id, employeeId, start, end, note: note.trim() });
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalGold}>✦</div>
        <h3 style={S.modalTitle}>
          {shift
            ? (lang === 'es' ? 'Editar Turno' : 'Edit Shift')
            : (lang === 'es' ? 'Nuevo Turno' : 'New Shift')}
        </h3>
        <div style={S.modalSub}>{new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>

        <div style={S.field}>
          <label style={S.fieldLabel}>{lang === 'es' ? 'Empleado' : 'Employee'}</label>
          <select style={S.input} value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setErr(''); }}>
            <option value="">{lang === 'es' ? '— Selecciona —' : '— Pick one —'}</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLabel}>{lang === 'es' ? 'Inicio' : 'Start'}</label>
            <input style={S.input} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.fieldLabel}>{lang === 'es' ? 'Fin' : 'End'}</label>
            <input style={S.input} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        <div style={S.field}>
          <label style={S.fieldLabel}>{lang === 'es' ? 'Nota (opcional)' : 'Note (optional)'}</label>
          <input style={S.input} value={note} onChange={(e) => setNote(e.target.value)} maxLength={100}
            placeholder={lang === 'es' ? 'p. ej. apertura, evento especial' : 'e.g. opening shift, special event'} />
        </div>

        {err && <div style={S.errorMsg}>{err}</div>}

        <div style={S.modalActions}>
          <button style={S.btnCancel} onClick={onClose}>{lang === 'es' ? 'Cancelar' : 'Cancel'}</button>
          <button style={S.btnGold} onClick={submit}>{lang === 'es' ? 'Guardar' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

const S = {
  screen: { background: '#0D0D0D', minHeight: '100vh', color: '#F5F0E8', fontFamily: "'Inter','Helvetica Neue',sans-serif", paddingBottom: 100 },
  header: { background: '#1A1A1A', borderBottom: '1px solid #D4AF37', padding: '20px 20px 14px', textAlign: 'center' },
  headerLogo: { color: '#D4AF37', fontSize: 11, letterSpacing: 3, fontWeight: 700, marginBottom: 4 },
  headerTitle: { fontSize: 22, fontFamily: 'Georgia, serif', fontWeight: 700, color: '#F5F0E8' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 2 },

  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px', background: '#111', borderBottom: '1px solid #1a1a1a' },
  viewToggle: { display: 'flex', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 9, padding: 3, gap: 3 },
  viewBtn: { background: 'transparent', border: 'none', color: '#888', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  viewBtnActive: { background: 'rgba(212,175,55,0.16)', color: '#D4AF37' },
  emailBtn: { background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.45)', color: '#D4AF37', borderRadius: 9, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  emailMenu: { position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#1A1A1A', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 10, padding: 4, zIndex: 50, minWidth: 160, boxShadow: '0 6px 20px rgba(0,0,0,0.55)' },
  emailMenuItem: { display: 'block', width: '100%', background: 'transparent', border: 'none', color: '#F5F0E8', padding: '9px 12px', borderRadius: 6, textAlign: 'left', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  emailMenuLabel: { fontSize: 9, color: '#666', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '6px 12px 3px' },
  statusBar: { textAlign: 'center', padding: '6px 12px', fontSize: 12, fontWeight: 700, background: '#0D0D0D', borderBottom: '1px solid #1a1a1a' },
  weekNav: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#111', borderBottom: '1px solid #222' },
  navBtn: { background: '#2A2A2A', border: '1px solid #333', color: '#D4AF37', width: 38, height: 38, borderRadius: 10, fontSize: 18, cursor: 'pointer', fontFamily: 'inherit' },
  todayBtn: { flex: 1, background: 'rgba(212,175,55,0.12)', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },

  body: { padding: '12px 14px' },
  dayCard: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 12, padding: 12, marginBottom: 10 },
  dayCardToday: { borderColor: '#D4AF37', boxShadow: '0 0 0 1px rgba(212,175,55,0.2) inset' },
  dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayName: { fontSize: 15, fontWeight: 700, color: '#F5F0E8', display: 'flex', alignItems: 'center', gap: 8 },
  dayDate: { fontSize: 11, color: '#888' },
  todayPill: { background: '#D4AF37', color: '#0D0D0D', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10, letterSpacing: '0.08em' },
  addBtn: { background: 'rgba(212,175,55,0.12)', border: '1px solid #D4AF37', color: '#D4AF37', borderRadius: 7, padding: '5px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },

  empty: { fontSize: 12, color: '#555', fontStyle: 'italic', padding: '4px 0' },
  shiftList: { display: 'flex', flexDirection: 'column', gap: 6 },
  shiftRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#0D0D0D', border: '1px solid #222', borderRadius: 8 },
  shiftRowMine: { background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.45)' },
  youPill: { display: 'inline-block', marginLeft: 8, background: '#D4AF37', color: '#0D0D0D', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em' },
  noteBanner: { background: 'rgba(212,175,55,0.10)', border: '1px solid rgba(212,175,55,0.40)', color: '#D4AF37', fontSize: 12, fontWeight: 600, padding: '7px 10px', borderRadius: 7, marginBottom: 8 },
  shiftMain: { flex: 1 },
  shiftName: { fontSize: 14, fontWeight: 600, color: '#F5F0E8' },
  shiftTime: { fontSize: 12, color: '#D4AF37', marginTop: 2 },
  shiftNote: { fontSize: 11, color: '#888', marginTop: 3, fontStyle: 'italic' },
  shiftActions: { display: 'flex', gap: 6 },
  iconBtn: { background: 'transparent', border: '1px solid #333', color: '#888', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontFamily: 'inherit' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#1A1A1A', border: '1px solid #D4AF37', borderRadius: 14, padding: '22px 20px', width: '100%', maxWidth: 400 },
  modalGold: { color: '#D4AF37', fontSize: 20, marginBottom: 6 },
  modalTitle: { color: '#F5F0E8', fontSize: 19, fontWeight: 700, margin: '0 0 4px' },
  modalSub: { color: '#888', fontSize: 13, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { display: 'block', fontSize: 10, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 },
  input: { width: '100%', background: '#0D0D0D', border: '1px solid #333', borderRadius: 7, color: '#F5F0E8', fontFamily: 'inherit', fontSize: 14, padding: '9px 11px', outline: 'none', boxSizing: 'border-box' },
  errorMsg: { color: '#E05252', fontSize: 12, marginTop: 4, marginBottom: 4 },
  modalActions: { display: 'flex', gap: 10, marginTop: 14 },
  btnCancel: { flex: 1, padding: '11px', background: '#0D0D0D', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnGold: { flex: 2, padding: '11px', background: '#D4AF37', color: '#0D0D0D', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' },
};
