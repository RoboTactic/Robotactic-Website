import { useMemo, useState } from 'react';
import WorkshopCard from '../../components/WorkshopCard/WorkshopCard';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import { workshopAudiences, workshopDays, workshopEmptyState, workshops } from '../../data/workshops';
import circuitPattern from './assets/circuit-pattern.svg';
import workshopIcon from './assets/workshop.svg';
import teamIcon from './assets/team.svg';
import './Workshops.css';

export default function Workshops() {
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedAudience, setSelectedAudience] = useState('all');
  const visibleWorkshops = useMemo(
    () => workshops.filter((item) => (
      (selectedDay === 'all' || item.dayId === selectedDay)
      && (selectedAudience === 'all' || item.audienceId === selectedAudience)
    )),
    [selectedAudience, selectedDay],
  );
  return (
    <div className="workshops-page" dir="rtl">
      <header className="workshops-hero">
        <img className="workshops-hero__pattern" src={circuitPattern} alt="" />
        <div className="workshops-page__container workshops-hero__content">
          <div className="workshops-overline"><span>WORKSHOPS</span><i /></div>
          <h1>ورش العمل</h1>
          <p>اكتشف ورش العمل التقنية والتطبيقية عن بُعد، واطّلع على تفاصيلها ومواعيدها وروابط التسجيل الرسمية.</p>
        </div>
      </header>

      <section className="workshops-filters" aria-labelledby="workshop-filters-title">
        <div className="workshops-page__container">
          <SectionHeading id="workshop-filters-title">استعرض ورش العمل</SectionHeading>
          <div className="workshops-filters__controls">
            <FilterChips items={workshopAudiences} selectedId={selectedAudience} onSelect={setSelectedAudience}
              ariaLabel="تصفية الورش حسب الفئة المستهدفة" className="workshops-filters__list"
              onItemClick={(_, event) => event.currentTarget.scrollIntoView({
                behavior: 'smooth', block: 'nearest', inline: 'nearest',
              })} />
            <label className="workshops-day-select">
              <span>تصفية الورش حسب اليوم</span>
              <select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}>
                {workshopDays.map((day) => <option key={day.id} value={day.id}>{day.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="workshops-results" aria-live="polite">
        <div className="workshops-page__container">
          {visibleWorkshops.length ? (
            <div className="workshops-grid">
              {visibleWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} workshopIcon={workshopIcon} teamIcon={teamIcon} />
              ))}
            </div>
          ) : (
            <div className="workshops-empty">
              <h2>{workshopEmptyState.title}</h2>
              <p>{workshopEmptyState.description}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
