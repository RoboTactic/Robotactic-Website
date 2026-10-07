const hasValidStart = (value) => value && Number.isFinite(Date.parse(value));

export function buildTimelineEvents(competitions, workshops) {
  const competitionEvents = (Array.isArray(competitions) ? competitions : [])
    .map((item) => ({
      key: `competition-${item.id}`,
      kind: 'competition',
      title: item.name_ar || item.name_en,
      description: item.description_ar || item.description_en || '',
      startAt: hasValidStart(item.start_at) ? item.start_at : null,
      endAt: hasValidStart(item.start_at) ? item.end_at : null,
      speakers: [],
      href: '/competitions',
    }));

  const workshopEvents = (Array.isArray(workshops) ? workshops : [])
    .filter((item) => hasValidStart(item.start_at))
    .map((item) => ({
      key: `workshop-${item.id}`,
      kind: 'workshop',
      title: item.title_ar || item.title_en,
      description: item.description_ar || item.description_en || '',
      startAt: item.start_at,
      endAt: item.end_at,
      speakers: Array.isArray(item.speakers) ? item.speakers : [],
      href: '/workshops',
    }));

  return [...competitionEvents, ...workshopEvents].sort((a, b) => {
    const first = a.startAt ? Date.parse(a.startAt) : Number.POSITIVE_INFINITY;
    const second = b.startAt ? Date.parse(b.startAt) : Number.POSITIVE_INFINITY;
    return first - second || a.key.localeCompare(b.key);
  });
}
