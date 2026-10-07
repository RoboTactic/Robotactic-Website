import { useRef } from 'react';
import { useApiData } from '../../services/api/useApiData';
import { presentCompetition } from '../../services/api/presentRecords';
import ApiState from '../../components/ApiState/ApiState';
import CompetitionCard from '../../components/CompetitionCard/CompetitionCard';
import cansatIcon from './assets/cansat.svg';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import controllerIcon from './assets/controller.svg';
import ctaPattern from './assets/cta-pattern.svg';
import sensorIcon from './assets/sensor.svg';
import CompetitionsCircuit from './CompetitionsCircuit';
import './Competitions.css';

const competitionIcons = {
  cansat: cansatIcon,
  controller: controllerIcon,
  sensor: sensorIcon,
};

export default function Competitions() {
  const { data, loading, error, reload } = useApiData('competitions');
  const competitions = (data || []).map(presentCompetition);
  const scrollToCompetitions = () => {
    document.getElementById('competition-tracks')?.scrollIntoView({ behavior: 'smooth' });
  };

  const rootRef = useRef(null);

  return (
    <div ref={rootRef} className="competitions-page" dir="rtl">
      <CompetitionsCircuit rootRef={rootRef} />
      <header className="competitions-hero">
        <img className="competitions-hero__pattern" src={circuitPattern} alt="" />
        <div className="competitions-page__container competitions-hero__content">
          <div className="competitions-overline"><span>COMPETITIONS</span><i /></div>
          <h1>المسابقات</h1>
          <p>ثلاثة مسارات تنافسية رسمية تستهدف طلاب وطالبات المرحلتين الثانوية والجامعية، وتختبر مهارات التصميم والبرمجة وحل المشكلات والتفكير الاستراتيجي من خلال تحديات عملية تحاكي مواقف واقعية.</p>
        </div>
      </header>

      <section className="competitions-tracks" id="competition-tracks" aria-label="مسارات المسابقات">
        <div className="competitions-page__container competitions-grid">
          <ApiState loading={loading} error={error} empty={!loading && !error && !competitions.length ? 'لا توجد مسابقات منشورة حاليًا.' : ''} onRetry={reload} />
          {competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition}
              icon={competitionIcons[competition.icon]} />
          ))}
        </div>
      </section>

      <section className="competitions-cta">
        <div className="competitions-page__container competitions-cta__band">
          <img src={ctaPattern} alt="" className="competitions-cta__pattern" />
          <div className="competitions-cta__content">
            <h2>اختر مسارك</h2>
            <p>اختر المسار المناسب لفريقك وابدأ التسجيل.</p>
          </div>
          <button type="button" onClick={scrollToCompetitions}>استعرض المسابقات</button>
        </div>
      </section>
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
