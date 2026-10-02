import { useMemo, useState } from 'react';
import WorkshopCard from '../../components/WorkshopCard/WorkshopCard';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import { workshopDays, workshopEmptyState, workshops } from '../../data/workshops';
import circuitPattern from './assets/circuit-pattern.svg';
import workshopIcon from './assets/workshop.svg';
import teamIcon from './assets/team.svg';
import './Workshops.css';

export default function Workshops() {
  const [selectedDay, setSelectedDay] = useState('all');
  const visibleWorkshops = useMemo(
    () => selectedDay === 'all' ? workshops : workshops.filter((item) => item.dayId === selectedDay),
    [selectedDay],
  );
  const selectedDayDetails = workshopDays.find((day) => day.id === selectedDay);

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

      <section className="workshops-filters" aria-labelledby="workshop-day-filter-title">
        <div className="workshops-page__container">
          <SectionHeading id="workshop-day-filter-title">استعرض ورش العمل</SectionHeading>
          <FilterChips items={workshopDays} selectedId={selectedDay} onSelect={setSelectedDay}
            ariaLabel="تصفية الورش حسب اليوم" className="workshops-filters__list"
            onItemClick={(_, event) => event.currentTarget.scrollIntoView({
              behavior: 'smooth', block: 'nearest', inline: 'nearest',
            })} />
        </div>
      </section>

      <section className="workshops-results" aria-live="polite">
        <div className="workshops-page__container">
          {selectedDay !== 'all' && <h2 className="workshops-results__day">{selectedDayDetails?.heading}</h2>}
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
