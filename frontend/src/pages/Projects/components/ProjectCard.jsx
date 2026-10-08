function SocialIcon({ type, url, memberName }) {
  const label = type === 'linkedin' ? 'LinkedIn' : 'X';
  const content = type === 'linkedin' ? 'in' : 'X';
  const className = `project-social project-social--${type}`;

  if (!url) {
    return <span className={className} aria-hidden="true">{content}</span>;
  }

  return (
    <a className={className} href={url} target="_blank" rel="noopener noreferrer"
      aria-label={`${label} — ${memberName}`}>
      {content}
    </a>
  );
}

function ProjectMember({ member }) {
  const hasAffordance = member.showLinkedIn || member.showX || member.linkedinUrl || member.xUrl;

  return (
    <div className="project-card__member">
      <span>{member.name}</span>
      {hasAffordance && (
        <span className="project-card__socials">
          {(member.showX || member.xUrl) && <SocialIcon type="x" url={member.xUrl} memberName={member.name} />}
          {(member.showLinkedIn || member.linkedinUrl) && (
            <SocialIcon type="linkedin" url={member.linkedinUrl} memberName={member.name} />
          )}
        </span>
      )}
    </div>
  );
}

export default function ProjectCard({ project, teamIcon }) {
  return (
    <article className="project-card">
      {/* The project's own category, surfaced on the media for scanning; the details list
          below still carries it for assistive tech, so this badge is decorative. */}
      {project.categoryLabel && <span className="project-card__badge" aria-hidden="true">{project.categoryLabel}</span>}
      {project.imageUrl ? (
        <img className="project-card__image" src={project.imageUrl} alt={project.imageAlt || ''} />
      ) : (
        <div className="project-card__placeholder">
          <img src={teamIcon} alt="" width="24" height="24" />
          <span>صورة المشروع عند توفرها</span>
        </div>
      )}

      <div className="project-card__heading">
        <h3>{project.title}</h3>
        <p>{project.teamName}</p>
      </div>

      <p className="project-card__description">{project.description}</p>

      <div className="project-card__members">
        {project.members.map((member) => <ProjectMember key={member.name} member={member} />)}
      </div>

      <dl className="project-card__details">
        <div><dt>التصنيف</dt><dd>{project.categoryLabel}</dd></div>
        <div><dt>مرحلة المشاركة</dt><dd>{project.stage}</dd></div>
      </dl>
    </article>
  );
}
