import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon/Icon';

const pad = value => String(value).padStart(2, '0');
const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && hour < 24 && minute < 60 ? date : null;
};

export default function DateTimeField({ name, defaultValue = '', required, language }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseDate(defaultValue) || new Date());
  const [focused, setFocused] = useState(() => dateKey(parseDate(defaultValue) || new Date()));
  const root = useRef(null);
  const trigger = useRef(null);
  const input = useRef(null);
  const popup = useRef(null);
  const [position, setPosition] = useState(undefined);
  const dialogId = useId();
  const locale = language === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB';
  const label = (ar, en) => language === 'ar' ? ar : en;
  const selected = parseDate(value);
  const hour = selected?.getHours() || 0;
  const minute = selected?.getMinutes() || 0;

  useEffect(() => setValue(defaultValue), [defaultValue, name]);
  useLayoutEffect(() => {
    if (!open) { setPosition(undefined); return; }
    function place() {
      if (window.innerWidth < 700) { setPosition(undefined); return; }
      const anchor = root.current.getBoundingClientRect();
      const panel = popup.current.getBoundingClientRect();
      const edge = language === 'ar' ? window.innerWidth - anchor.right : anchor.left;
      setPosition({
        insetInlineStart: Math.max(12, Math.min(edge, window.innerWidth - panel.width - 12)),
        insetInlineEnd: 'auto',
        insetBlockStart: Math.max(12, Math.min(anchor.bottom + 8, window.innerHeight - panel.height - 12)),
        marginInline: 0,
      });
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, language]);
  useEffect(() => {
    input.current?.setCustomValidity(value && !parseDate(value) ? label('أدخل تاريخًا ووقتًا صالحين أو اختر من التقويم.', 'Enter a valid date and time or choose from the calendar.') : '');
  }, [value, language]);
  useEffect(() => {
    if (!open) return;
    const close = event => {
      if (event.type === 'keydown' && event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      } else if (event.type !== 'keydown' && !root.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    document.addEventListener('focusin', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('focusin', close);
    };
  }, [open]);
  useEffect(() => {
    if (open) root.current?.querySelector(`[data-day="${focused}"]`)?.focus();
  }, [open, focused, view]);

  function showCalendar() {
    const date = selected || new Date();
    setView(new Date(date.getFullYear(), date.getMonth(), 1));
    setFocused(dateKey(date));
    setOpen(true);
  }
  function choose(date, nextHour = hour, nextMinute = minute) {
    setValue(`${dateKey(date)}T${pad(nextHour)}:${pad(nextMinute)}`);
  }
  function moveMonth(offset) {
    setView(new Date(view.getFullYear(), view.getMonth() + offset, 1));
  }
  function moveFocus(event, date) {
    const horizontal = language === 'ar' ? -1 : 1;
    let next = new Date(date);
    if (event.key === 'ArrowRight') next.setDate(next.getDate() + horizontal);
    else if (event.key === 'ArrowLeft') next.setDate(next.getDate() - horizontal);
    else if (event.key === 'ArrowDown') next.setDate(next.getDate() + 7);
    else if (event.key === 'ArrowUp') next.setDate(next.getDate() - 7);
    else if (event.key === 'Home') next.setDate(next.getDate() - next.getDay());
    else if (event.key === 'End') next.setDate(next.getDate() + 6 - next.getDay());
    else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const month = next.getMonth() + (event.key === 'PageUp' ? -1 : 1);
      const day = next.getDate();
      next = new Date(next.getFullYear(), month, 1);
      next.setDate(Math.min(day, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    } else return;
    event.preventDefault();
    setView(new Date(next.getFullYear(), next.getMonth(), 1));
    setFocused(dateKey(next));
  }
  const start = new Date(view.getFullYear(), view.getMonth(), 1);
  start.setDate(1 - start.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2026, 9, 4 + index));
  const today = dateKey(new Date());

  return <div className="dash-date-field" ref={root}>
    <div className="dash-date-input">
      <input type="hidden" name={name} value={value}/>
      <input ref={input} id={`dash-date-${name}`} type="text" dir="ltr" value={value.replace('T', ' ')} onChange={event => setValue(event.target.value.replace(' ', 'T'))} required={required} maxLength={16} placeholder="YYYY-MM-DD HH:mm" autoComplete="off" aria-describedby={`${dialogId}-hint`} onKeyDown={event => { if (event.altKey && event.key === 'ArrowDown') { event.preventDefault(); showCalendar(); } }}/>
      <button type="button" className="dash-calendar-trigger" ref={trigger} aria-label={label('اختيار التاريخ والوقت', 'Choose date and time')} aria-expanded={open} aria-controls={open ? dialogId : undefined} onClick={() => open ? setOpen(false) : showCalendar()}><Icon name="calendar" size={20}/></button>
    </div>
    <span className="dash-date-hint" id={`${dialogId}-hint`}>{label('اختر من التقويم أو اكتب بالتنسيق الموضح.', 'Choose from the calendar or type in the format shown.')}</span>
    {open && <div className="dash-date-popover" ref={popup} style={position} id={dialogId} role="dialog" aria-label={label('اختيار التاريخ والوقت', 'Choose date and time')}>
      <div className="dash-calendar-heading">
        <h2 aria-live="polite">{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(view)}</h2>
        <div className="dash-calendar-months">
          <button type="button" aria-label={label('الشهر السابق', 'Previous month')} onClick={() => moveMonth(-1)}>−</button>
          <button type="button" aria-label={label('الشهر التالي', 'Next month')} onClick={() => moveMonth(1)}>+</button>
        </div>
      </div>
      <div className="dash-calendar-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day.getDay()}>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}</span>)}</div>
      <div className="dash-calendar-days" role="grid" aria-label={label('أيام الشهر', 'Days of month')}>
        {Array.from({ length: 6 }, (_, week) => <div role="row" key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
          const key = dateKey(day);
          const active = selected && dateKey(selected) === key;
          const outside = day.getMonth() !== view.getMonth();
          return <div role="gridcell" key={key} aria-selected={Boolean(active)}><button type="button" data-day={key} tabIndex={focused === key ? 0 : -1} className={`${active ? 'is-selected' : ''} ${outside ? 'is-outside' : ''}`} aria-current={key === today ? 'date' : undefined} aria-label={new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(day)} onKeyDown={event => moveFocus(event, day)} onClick={() => { choose(day); setView(new Date(day.getFullYear(), day.getMonth(), 1)); setFocused(key); }}>{day.getDate()}</button></div>;
        })}</div>)}
      </div>
      <div className="dash-calendar-time">
        <label>{label('الساعة', 'Hour')}<input type="number" min="0" max="23" value={hour} onChange={event => { const next = Number(event.target.value); if (event.target.value && next >= 0 && next <= 23) choose(selected || new Date(), next, minute); }}/></label>
        <label>{label('الدقيقة', 'Minute')}<input type="number" min="0" max="59" value={minute} onChange={event => { const next = Number(event.target.value); if (event.target.value && next >= 0 && next <= 59) choose(selected || new Date(), hour, next); }}/></label>
      </div>
      <div className="dash-calendar-footer">
        <button type="button" className="dash-action" onClick={() => { choose(new Date()); setView(new Date()); setFocused(today); }}>{label('اليوم', 'Today')}</button>
        <button type="button" className="dash-action" onClick={() => { setValue(''); setOpen(false); trigger.current?.focus(); }}>{label('مسح', 'Clear')}</button>
        <button type="button" className="dash-action dash-action--primary" onClick={() => { setOpen(false); trigger.current?.focus(); }}>{label('تم', 'Done')}</button>
      </div>
    </div>}
  </div>;
}
