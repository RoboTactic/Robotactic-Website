const repository = require("../database/publicContentRepository");
const { publicContentCache } = require('./publicContentCache');

const cached = (pool, key, load, ttl) => publicContentCache(pool).read(key, load, ttl);

module.exports = {
  getTeamMembers: (pool) => cached(pool, 'team-members', () => repository.getTeamMembers(pool)),
  getSiteSettings: (pool) => cached(pool, 'site-settings', () => repository.getSiteSettings(pool)),
  getCompetitions: (pool) => cached(pool, 'competitions', () => repository.getCompetitions(pool)),
  getWorkshops: (pool) => cached(pool, 'workshops', () => repository.getWorkshops(pool)),
  getProjects: (pool) => cached(pool, 'projects', () => repository.getProjects(pool)),
  getAnnouncements: (pool) => cached(pool, 'announcements', () => repository.getAnnouncements(pool)),
  getTimelineEvents: (pool, currentOnly) => cached(pool, `timeline-events:${Boolean(currentOnly)}`, () => repository.getTimelineEvents(pool, currentOnly), currentOnly ? 5_000 : 30_000),
  getSponsors: (pool) => cached(pool, 'sponsors', () => repository.getSponsors(pool)),
  getFaqs: (pool) => cached(pool, 'faqs', () => repository.getFaqs(pool)),
};
