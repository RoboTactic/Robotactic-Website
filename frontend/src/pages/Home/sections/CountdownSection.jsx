import Countdown from '../../../components/Countdown/Countdown';
import { countdown } from '../../../data/home';
import { useApiData } from '../../../services/api/useApiData';
import ApiState from '../../../components/ApiState/ApiState';
import { useLanguage } from '../../../services/api/publicContentLanguage';

export default function CountdownSection() {
  const { data, loading, error, reload } = useApiData('site-settings');
  const targetDate = data?.event_start_at || null;
  const { t } = useLanguage();
  return (
    <section className="band home-countdown" aria-label={t('العد التنازلي لانطلاق الملتقى', 'Countdown to the forum launch')}>
      <div className="container">
        <Countdown {...countdown} title={t(countdown.title)} targetDate={targetDate} note={targetDate ? '' : t('موعد الملتقى سيعلن لاحقًا.', 'The forum date will be announced soon.')} />
        <ApiState loading={loading} error={error} onRetry={reload} />
      </div>
    </section>
  );
}
