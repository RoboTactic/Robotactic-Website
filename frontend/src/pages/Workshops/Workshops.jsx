import { useMemo, useRef, useState } from 'react';
import ApiState from '../../components/ApiState/ApiState';
import { useApiData } from '../../services/api/useApiData';
import { presentWorkshop } from '../../services/api/presentRecords';
import WorkshopCard from '../../components/WorkshopCard/WorkshopCard';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import circuitPattern from './assets/circuit-pattern.svg';
import workshopIcon from './assets/workshop.svg';
import teamIcon from './assets/team.svg';
import { prefersReducedMotion } from '../../motion/signalBus';
import WorkshopsCircuit from './WorkshopsCircuit';
import './Workshops.css';

export default function Workshops() {
  const [selectedDay, setSelectedDay] = useState('all');
  const [filtered, setFiltered] = useState(false); // local results transition only after a user change
  const selectDay = (id) => { setSelectedDay(id); setFiltered(true); };
  const { data, loading, error, reload } = useApiData('workshops');
  const workshops = useMemo(() => (data || []).map(presentWorkshop), [data]);
  const workshopDays = useMemo(() => {
    const groups = [...new Map(workshops.map((workshop) => {
      const date = new Date(workshop.startAt);
      const key = new Intl.DateTimeFormat('en-CA', { calendar: 'gregory', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
      const label = new Intl.DateTimeFormat(document.documentElement.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory', { dateStyle: 'full' }).format(new Date(workshop.startAt));
      return [key, { id: key, label, heading: label }];
    })).values()];
    return [{ id: 'all', label: document.documentElement.lang === 'en' ? 'All workshops' : 'عرض الكل' }, ...groups];
  }, [workshops]);
  const visibleWorkshops = useMemo(
    () => selectedDay === 'all' ? workshops : workshops.filter((item) => new Intl.DateTimeFormat('en-CA', { calendar: 'gregory', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(item.startAt)) === selectedDay),
    [selectedDay, workshops],
  );
  const selectedDayDetails = workshopDays.find((day) => day.id === selectedDay);
  const rootRef = useRef(null);

  return (
    <div ref={rootRef} className="workshops-page" dir="rtl">
      <WorkshopsCircuit rootRef={rootRef} selectedDay={selectedDay} count={loading ? -1 : visibleWorkshops.length} />
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
          <FilterChips items={workshopDays} selectedId={selectedDay} onSelect={selectDay}
            ariaLabel="تصفية الورش حسب اليوم" className="workshops-filters__list"
            onItemClick={(_, event) => event.currentTarget.scrollIntoView({
              behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'nearest', inline: 'nearest',
            })} />
        </div>
      </section>

      <section className="workshops-results" aria-live="polite">
        <div className="workshops-page__container">
          {selectedDay !== 'all' && <h2 className="workshops-results__day">{selectedDayDetails?.heading}</h2>}
          <ApiState loading={loading} error={error} empty={!loading && !error && !workshops.length ? 'لا توجد ورش منشورة حاليًا.' : ''} onRetry={reload} />
          {!loading && !error && visibleWorkshops.length ? (
            <div className={`workshops-grid${filtered ? ' workshops-grid--changed' : ''}`} key={selectedDay}>
              {visibleWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} workshopIcon={workshopIcon} teamIcon={teamIcon} />
              ))}
            </div>
          ) : !loading && !error && workshops.length > 0 && (
            <div className="workshops-empty">
              <h2>لا توجد ورش في هذا اليوم.</h2>
              <p>اختر يومًا آخر للاطلاع على الورش المنشورة.</p>
            </div>
          )}
        </div>
      </section>
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
