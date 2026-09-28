import Countdown from '../../../components/Countdown/Countdown';
import { countdown } from '../../../data/home';

export default function CountdownSection() {
  return (
    <section className="band home-countdown" aria-label="العد التنازلي لانطلاق الملتقى">
      <div className="container">
        <Countdown {...countdown} />
      </div>
    </section>
  );
}
