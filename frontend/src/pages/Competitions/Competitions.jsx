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
          <p>{t('تجمع مسابقات RoboTactic بين التحديات الهندسية والتقنية التي تختبر قدرات المشاركين في تصميم الروبوتات وبرمجتها والتحكم بها، من خلال منافسات عملية تتطلب الدقة والكفاءة والتفكير الاستراتيجي.',
            'RoboTactic competitions bring together engineering and technical challenges that test participants’ abilities to design, program, and control robots through hands-on contests requiring precision, efficiency, and strategic thinking.')}</p>
          <p>{t('وتتنوع المنافسات بين تحديات التحكم بالروبوتات، والملاحة الذاتية وحل المتاهات، وبرمجان الطائرات بدون طيار، بما يتيح للمشاركين توظيف مهاراتهم التقنية والهندسية في بيئة تنافسية تعزز الابتكار والعمل الجماعي والتميز.',
            'The competitions range from robot-control challenges and autonomous navigation and maze-solving to a dedicated drone hackathon, allowing participants to apply their technical and engineering skills in a competitive environment that fosters innovation, teamwork, and excellence.')}</p>
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
                icon={<Icon name={competition.icon} />} showSupervisors />
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
