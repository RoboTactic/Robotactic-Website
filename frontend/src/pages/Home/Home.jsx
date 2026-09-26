import SectionHeading from '../../components/SectionHeading/SectionHeading';
import Countdown from '../../components/Countdown/Countdown';

export default function Home() {
  return (
    <>
      <section className="hero container">
        <p>RoboTactic 2026</p>
        <h1>ابتكار يقوده التفكير</h1>
      </section>

      <section className="container section">
        <SectionHeading title="عن الملتقى" />
      </section>

      <section className="container section">
        <SectionHeading title="المسابقات" />
      </section>

      <section className="container section">
        <SectionHeading title="ورش العمل" />
      </section>

      <section className="container section">
        <Countdown />
      </section>
    </>
  );
}
