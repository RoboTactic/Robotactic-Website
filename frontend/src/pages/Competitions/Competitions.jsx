import { useRef } from 'react';
import { useApiData } from '../../services/api/useApiData';
import { presentCompetition } from '../../services/api/presentRecords';
import ApiState from '../../components/ApiState/ApiState';
import CompetitionCard from '../../components/CompetitionCard/CompetitionCard';
import Icon from '../../components/Icon/Icon';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import ctaPattern from './assets/cta-pattern.svg';
import CompetitionsCircuit from './CompetitionsCircuit';
import CompetitionsComingSoon from './CompetitionsComingSoon';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Competitions.css';

export default function Competitions() {
  const { data, loading, error, reload } = useApiData('competitions');
  const { dir, t } = useLanguage();
  const competitions = (data || []).map(presentCompetition);
  // Coming Soon only for a successful, empty response — never while loading or after an error.
  const comingSoon = !loading && !error && Array.isArray(data) && data.length === 0;
  const scrollToCompetitions = () => {
    document.getElementById('competition-tracks')?.scrollIntoView({ behavior: 'smooth' });
  };

  const rootRef = useRef(null);

  return (
    <div ref={rootRef} className="competitions-page" dir={dir}>
      <CompetitionsCircuit rootRef={rootRef} />
      <header className="competitions-hero">
        <img className="competitions-hero__pattern" src={circuitPattern} alt="" />
        <div className="competitions-page__container competitions-hero__content">
          <div className="competitions-overline"><span lang="en">COMPETITIONS</span><i /></div>
          <h1>{t('المسابقات', 'Competitions')}</h1>
          <p>{t('ثلاثة مسارات تنافسية رسمية تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، وتختبر مهارات التصميم والبرمجة وحل المشكلات والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية.',
            'Three official competition tracks for secondary and university students, testing design, programming, problem-solving and strategic thinking through hands-on challenges modelled on real-world scenarios.')}</p>
        </div>
      </header>

      <section className="competitions-tracks" id="competition-tracks" aria-label={t('مسارات المسابقات', 'Competition tracks')}>
        {comingSoon ? (
          <div className="competitions-page__container"><CompetitionsComingSoon /></div>
        ) : (
          <div className="competitions-page__container competitions-grid">
            <ApiState loading={loading} error={error} onRetry={reload} />
            {competitions.map((competition) => (
              <CompetitionCard key={competition.id} competition={competition}
                icon={<Icon name={competition.icon} />} />
            ))}
          </div>
        )}
      </section>

      {/* "Choose your track" scrolls to the tracks, so it only appears once real tracks have loaded
          (not while loading, after an error, or for an empty list). */}
      {competitions.length > 0 && <section className="competitions-cta">
        <div className="competitions-page__container competitions-cta__band">
          <img src={ctaPattern} alt="" className="competitions-cta__pattern" />
          <div className="competitions-cta__content">
            <h2>{t('اختر مسارك', 'Choose your track')}</h2>
            <p>{t('اختر المسار المناسب لفريقك وابدأ التسجيل.', 'Pick the right track for your team and start registering.')}</p>
          </div>
          <button type="button" onClick={scrollToCompetitions}>{t('استعرض المسابقات', 'Browse competitions')}</button>
        </div>
      </section>}
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
