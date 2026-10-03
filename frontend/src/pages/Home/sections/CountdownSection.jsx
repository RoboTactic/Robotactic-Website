import Countdown from '../../../components/Countdown/Countdown';
import { countdown } from '../../../data/home';
import { useApiData } from '../../../services/api/useApiData';
import ApiState from '../../../components/ApiState/ApiState';

export default function CountdownSection() {
  const { data, loading, error, reload } = useApiData('site-settings');
  const targetDate = data?.event_start_at || null;
  return (
    <section className="band home-countdown" aria-label="العد التنازلي لانطلاق الملتقى">
      <div className="container">
        <Countdown {...countdown} targetDate={targetDate} note={targetDate ? '' : 'موعد الملتقى سيعلن لاحقًا.'} />
        <ApiState loading={loading} error={error} onRetry={reload} />
      </div>
    </section>
  );
}
