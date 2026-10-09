import SectionHeading from '../../../components/SectionHeading/SectionHeading';
import Chip from '../../../components/Chip/Chip';
import { useApiData } from '../../../services/api/useApiData';
import { translated, contentLanguage } from '../../../services/api/publicContentLanguage';
import ApiState from '../../../components/ApiState/ApiState';

export default function AboutSection() {
  const { data, loading, error, reload } = useApiData('about');
  const language = contentLanguage();
  const ar = language === 'ar';
  const values = data?.[`values_${language}`] || [];
  return (
    <section className="home-section about" aria-labelledby="about-title" lang={language} dir={ar ? 'rtl' : 'ltr'}>
      <div className="container about__inner">
        <div className="about__heading">
          <SectionHeading overline="ABOUT ROBOTACTIC" title={<span id="about-title">{translated(data, 'title', language) || (ar ? 'عن الملتقى' : 'About RoboTactic')}</span>} description={translated(data, 'subtitle', language)} />
          <ApiState {...{ loading, error }} onRetry={reload} empty={!loading && !error && !data ? (ar ? 'محتوى عن الملتقى قيد التحديث.' : 'About content is being updated.') : ''} />
          {!loading && !error && data && <p className="about__body info-page__copy">{translated(data, 'body', language)}</p>}
        </div>
        <div className="about__content">
          <ul className="about__values" aria-label={ar ? 'قيم الملتقى' : 'Event values'}>
            {values.map((value, index) => <li key={`${index}-${value}`}><Chip tone="outline">{value}</Chip></li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
