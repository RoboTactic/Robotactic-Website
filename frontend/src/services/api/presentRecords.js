const categoryLabels = {
  combat: ['قتال آلي', 'Combat'], simulation: ['محاكاة', 'Simulation'],
  sensing: ['استشعار', 'Sensing'], other: ['أخرى', 'Other'],
  defense: ['دفاعي', 'Defense'], invention: ['ابتكاري', 'Invention'],
};

const locale = () => document.documentElement.lang === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory';
const isEnglish = () => document.documentElement.lang === 'en';
const localized = (ar, en) => isEnglish() ? (en || ar || '') : (ar || en || '');
const dateOf = (value, options) => value ? new Intl.DateTimeFormat(locale(), options).format(new Date(value)) : '—';

export function presentCompetition(row) {
  const category = categoryLabels[row.category_code] || categoryLabels.other;
  const size = row.team_size_min == null && row.team_size_max == null ? '—'
    : row.team_size_min != null && row.team_size_max != null ? `${row.team_size_min}–${row.team_size_max}`
      : String(row.team_size_min ?? row.team_size_max);
  const date = row.start_at ? dateOf(row.start_at, { dateStyle: 'medium' }) : '—';
  return {
    id: row.id,
    title: localized(row.name_ar, row.name_en),
    level: row.audience_type || null,
    focus: category[isEnglish() ? 1 : 0],
    categoryLabel: category[isEnglish() ? 1 : 0],
    audience: row.audience_type || '—',
    teamSize: size,
    date,
    registrationStatus: row.registration_status,
    registrationUrl: row.registration_url,
    icon: row.category_code === 'sensing' ? 'sensor' : row.category_code === 'combat' ? 'controller' : 'simulation',
  };
}

export function presentWorkshop(row) {
  return {
    id: row.id,
    title: localized(row.title_ar, row.title_en),
    presenter: row.presenter_name,
    description: localized(row.description_ar, row.description_en),
    date: dateOf(row.start_at, { dateStyle: 'medium' }),
    time: dateOf(row.start_at, { hour: 'numeric', minute: '2-digit' }),
    availableSeats: row.available_seats,
    registrationStatus: row.registration_status,
    registrationUrl: row.registration_url,
    startAt: row.start_at,
  };
}

export function presentProject(row) {
  const kind = categoryLabels[row.project_type] || categoryLabels.other;
  return {
    id: row.id,
    title: localized(row.name_ar, row.name_en),
    teamName: row.team_name,
    description: localized(row.description_ar, row.description_en),
    categoryId: row.project_type,
    categoryLabel: localized(row.category_name_ar, row.category_name_en) || kind[isEnglish() ? 1 : 0],
    stage: localized(row.stage_ar, row.stage_en) || '—',
    imageUrl: row.image_url,
    imageAlt: localized(row.name_ar, row.name_en),
    members: (row.members || []).map((member) => ({
      name: member.name,
      linkedinUrl: member.linkedin_url || '',
      xUrl: member.x_url || '',
      showLinkedIn: Boolean(member.linkedin_url),
      showX: Boolean(member.x_url),
    })),
  };
}

export function presentTimelineEvent(row) {
  return {
    id: row.id,
    status: new Date(row.start_at) <= new Date() ? 'live' : 'upcoming',
    title: localized(row.title_ar, row.title_en),
    time: dateOf(row.start_at, { hour: 'numeric', minute: '2-digit' }),
    location: localized(row.location_ar, row.location_en),
  };
}
