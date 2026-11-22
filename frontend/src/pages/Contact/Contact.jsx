import Icon from '../../components/Icon/Icon';
import SectionHeading from '../../components/SectionHeading/SectionHeading';
import { contact } from '../../data/site';
import { faqs } from '../../data/faq';
import { useLanguage } from '../../services/api/publicContentLanguage';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import './Contact.css';

export default function Contact() {
  const { language, dir, t } = useLanguage();

  return (
    <div className="contact-page" lang={language} dir={dir}>
      <header className="contact-page__hero">
        <img className="contact-page__pattern" src={circuitPattern} alt="" />
        <div className="container">
          <SectionHeading as="h1" size="h1" overline="CONTACT & FAQ"
            title={t('التواصل والأسئلة الشائعة', 'Contact & FAQ')}
            description={t(contact.tagline)} />
        </div>
      </header>

      <div className="container contact-page__body">
        <section className="contact-page__contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="t-h2">{t(contact.title)}</h2>
          {contact.intro.map(paragraph => <p className="contact-page__intro" key={paragraph[1]}>{t(paragraph)}</p>)}
          <ul className="contact-page__channels">
            {contact.channels.map(channel => {
              const external = !channel.href.startsWith('mailto:');
              return (
                <li key={channel.key}>
                  <a className="contact-page__channel" href={channel.href}
                    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                    aria-label={external ? `${t(channel.label)} — ${t('يفتح في نافذة جديدة', 'opens in a new tab')}` : undefined}>
                    <span className="contact-page__channel-icon"><Icon name={channel.icon} size={22} /></span>
                    <span className="contact-page__channel-text">
                      <span>{t(channel.label)}</span>
                      {channel.value && <span className="contact-page__email" dir="ltr">{channel.value}</span>}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="contact-page__faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="t-h2">{t('الأسئلة الشائعة', 'Frequently asked questions')}</h2>
          <div className="contact-page__questions">
            {faqs.map(faq => (
              <details className="contact-page__question" key={faq.id}>
                <summary>
                  <h3>{t(faq.question)}</h3>
                  <span className="contact-page__toggle" aria-hidden="true" />
                </summary>
                <p className="contact-page__answer">{t(faq.answer)}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
