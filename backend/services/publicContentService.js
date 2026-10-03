const repository = require("../database/publicContentRepository");

module.exports = {
  getSiteSettings: (pool) => repository.getSiteSettings(pool),
  getCompetitions: (pool) => repository.getCompetitions(pool),
  getWorkshops: (pool) => repository.getWorkshops(pool),
  getProjects: (pool) => repository.getProjects(pool),
  getAnnouncements: (pool) => repository.getAnnouncements(pool),
  getTimelineEvents: (pool, currentOnly) => repository.getTimelineEvents(pool, currentOnly),
  getSponsors: (pool) => repository.getSponsors(pool),
  getFaqs: (pool) => repository.getFaqs(pool),
};
