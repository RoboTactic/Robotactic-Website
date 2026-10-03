import { useEffect, useState } from 'react';
import SectionHeading from '../SectionHeading/SectionHeading';
import './Countdown.css';

const UNITS = [['days', 'يوم'], ['hours', 'ساعة'], ['minutes', 'دقيقة'], ['seconds', 'ثانية']]; // RTL: days first = rightmost

function remaining(target) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return { days: Math.floor(ms / 864e5), hours: Math.floor(ms / 36e5) % 24, minutes: Math.floor(ms / 6e4) % 60, seconds: Math.floor(ms / 1e3) % 60 };
}

/* Show a live countdown only when the official start time is available. */
export default function Countdown({ overline, title, note, targetDate }) {
  const [values, setValues] = useState(() => (targetDate ? remaining(targetDate) : null));
  useEffect(() => {
    if (!targetDate) { setValues(null); return undefined; }
    setValues(remaining(targetDate));
    const id = setInterval(() => setValues(remaining(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const pad = n => String(n).padStart(2, '0');
  const summary = values ? UNITS.map(([k, l]) => `${values[k]} ${l}`).join('، ') : '';

  return (
    <div className="countdown">
      <div className="countdown__text">
        <SectionHeading overline={overline} title={title} className="countdown__heading" />
        {note && <p className="countdown__note t-caption">{note}</p>}
      </div>
      {values && <ul className="countdown__units" role="timer" aria-label={`الوقت المتبقي: ${summary}`}>
        {UNITS.map(([key, label]) => (
          <li className="countdown__unit" key={key} aria-hidden="true">
            <span className="countdown__value t-numeral" lang="en">{pad(values[key])}</span>
            <span className="countdown__label t-caption">{label}</span>
          </li>
        ))}
      </ul>}
    </div>
  );
}
