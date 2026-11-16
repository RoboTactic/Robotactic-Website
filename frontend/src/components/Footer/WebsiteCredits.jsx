import { useEffect, useRef } from 'react';
import Icon from '../Icon/Icon';
import { useLanguage } from '../../services/api/publicContentLanguage';
import { websiteCredit } from './websiteCredit';
import './WebsiteCredits.css';

const credit = websiteCredit();

export default function WebsiteCredits({ open, onClose }) {
  const dialogRef = useRef(null);
  const { language, dir, t } = useLanguage();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  if (!credit) return null;

  return (
    <dialog
      ref={dialogRef}
      id="website-credits-dialog"
      className="website-credits-dialog"
      lang={language}
      dir={dir}
      aria-labelledby="website-credits-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right
            || event.clientY < bounds.top || event.clientY > bounds.bottom) {
            event.currentTarget.close();
          }
        }
      }}
    >
      <button
        type="button"
        className="website-credits-dialog__close"
        onClick={() => dialogRef.current?.close()}
        aria-label={t('إغلاق', 'Close')}
        autoFocus
      >
        <Icon name="close" size={20} />
      </button>
      <div className="website-credits">
        <header className="website-credits__head">
          <span className="website-credits__icon" aria-hidden="true"><Icon name="project" size={24} /></span>
          <p className="website-credits__eyebrow">{t('تنفيذ وتطوير الموقع', 'Website Design & Development')}</p>
          <h2 id="website-credits-title" className="website-credits__title">{t(credit.name)}</h2>
        </header>
        <ul className="website-credits__groups">
          {credit.groups.map((group) => (
            <li key={group.key} className="website-credits__group">
              <div className="website-credits__lead">
                <span className="website-credits__role">{t(group.title)}</span>
                <span className="website-credits__name">{t(group.lead)}</span>
              </div>
              <ul className="website-credits__members">
                {group.members.map((member) => (
                  <li key={member[1]} className="website-credits__member">{t(member)}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
