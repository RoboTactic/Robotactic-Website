const service = require("../services/publicContentService");

function createPublicContentController(pool) {
  return {
    siteSettings: async (_request, response) => response.json({ data: await service.getSiteSettings(pool) }),
    competitions: async (_request, response) => response.json({ data: await service.getCompetitions(pool) }),
    workshops: async (_request, response) => response.json({ data: await service.getWorkshops(pool) }),
    projects: async (_request, response) => response.json({ data: await service.getProjects(pool) }),
    announcements: async (_request, response) => response.json({ data: await service.getAnnouncements(pool) }),
    timelineEvents: async (request, response) => {
      if (request.query.current !== undefined && !["true", "false"].includes(request.query.current)) {
        const error = new Error("current must be true or false.");
        error.statusCode = 400;
        throw error;
      }
      const current = request.query.current === "true";
      response.json({ data: await service.getTimelineEvents(pool, current) });
    },
    sponsors: async (_request, response) => response.json({ data: await service.getSponsors(pool) }),
    faqs: async (_request, response) => response.json({ data: await service.getFaqs(pool) }),
  };
}

module.exports = { createPublicContentController };
