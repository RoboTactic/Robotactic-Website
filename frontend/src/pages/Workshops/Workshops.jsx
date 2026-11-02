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
import WorkshopsComingSoon from './WorkshopsComingSoon';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Workshops.css';

export default function Workshops() {
  const [selectedDay, setSelectedDay] = useState('all');
  const [filtered, setFiltered] = useState(false); // local results transition only after a user change
  const selectDay = (id) => { setSelectedDay(id); setFiltered(true); };
  const { data, loading, error, reload } = useApiData('workshops');
  const { language, dir, t } = useLanguage();
  // presentWorkshop localizes titles and dates, so it re-runs when the language changes
  const workshops = useMemo(() => (data || []).map(presentWorkshop), [data, language]);
  // Coming Soon only for a successful, empty response — never while loading or after an error.
  const comingSoon = !loading && !error && Array.isArray(data) && data.length === 0;
  const workshopDays = useMemo(() => {
    const groups = [...new Map(workshops.map((workshop) => {
      const date = new Date(workshop.startAt);
      const key = new Intl.DateTimeFormat('en-CA', { calendar: 'gregory', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
      const label = new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory', { dateStyle: 'full' }).format(new Date(workshop.startAt));
      return [key, { id: key, label, heading: label }];
    })).values()];
    return [{ id: 'all', label: language === 'en' ? 'All workshops' : 'عرض الكل' }, ...groups];
  }, [workshops, language]);
  const visibleWorkshops = useMemo(
    () => selectedDay === 'all' ? workshops : workshops.filter((item) => new Intl.DateTimeFormat('en-CA', { calendar: 'gregory', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(item.startAt)) === selectedDay),
    [selectedDay, workshops],
  );
  const selectedDayDetails = workshopDays.find((day) => day.id === selectedDay);
  const rootRef = useRef(null);

  return (
    <div ref={rootRef} className="workshops-page" dir={dir}>
      <WorkshopsCircuit rootRef={rootRef} selectedDay={selectedDay} count={loading ? -1 : visibleWorkshops.length} />
      <header className="workshops-hero">
        <img className="workshops-hero__pattern" src={circuitPattern} alt="" />
        <div className="workshops-page__container workshops-hero__content">
          <div className="workshops-overline"><span lang="en">WORKSHOPS</span><i /></div>
          <h1>{t('ورش العمل', 'Workshops')}</h1>
          <p>{t('اكتشف ورش العمل التقنية والتطبيقية عن بُعد، واطّلع على تفاصيلها ومواعيدها وروابط التسجيل الرسمية.',
            'Discover our online technical and hands-on workshops, with their details, schedules and official registration links.')}</p>
        </div>
      </header>

      {/* A day filter with only "All" has nothing to filter. */}
      {!comingSoon && <section className="workshops-filters" aria-labelledby="workshop-day-filter-title">
        <div className="workshops-page__container">
          <SectionHeading id="workshop-day-filter-title">{t('استعرض ورش العمل', 'Browse workshops')}</SectionHeading>
          <FilterChips items={workshopDays} selectedId={selectedDay} onSelect={selectDay}
            ariaLabel={t('تصفية الورش حسب اليوم', 'Filter workshops by day')} className="workshops-filters__list"
            onItemClick={(_, event) => event.currentTarget.scrollIntoView({
              behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'nearest', inline: 'nearest',
            })} />
        </div>
      </section>}

      <section className="workshops-results" aria-live="polite">
        <div className="workshops-page__container">
          {selectedDay !== 'all' && <h2 className="workshops-results__day">{selectedDayDetails?.heading}</h2>}
          {comingSoon ? <WorkshopsComingSoon /> : <ApiState loading={loading} error={error} onRetry={reload} />}
          {!loading && !error && visibleWorkshops.length ? (
            <div className={`workshops-grid${filtered ? ' workshops-grid--changed' : ''}`} key={selectedDay}>
              {visibleWorkshops.map((workshop) => (
                <WorkshopCard key={workshop.id} workshop={workshop} workshopIcon={workshopIcon} teamIcon={teamIcon} />
              ))}
            </div>
          ) : !loading && !error && workshops.length > 0 && (
            <div className="workshops-empty">
              <h2>{t('لا توجد ورش في هذا اليوم.', 'No workshops on this day.')}</h2>
              <p>{t('اختر يومًا آخر للاطلاع على الورش المنشورة.', 'Choose another day to see the published workshops.')}</p>
            </div>
          )}
        </div>
      </section>
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
