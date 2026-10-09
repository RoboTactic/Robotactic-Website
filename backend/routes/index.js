const express = require("express");
const healthRoutes = require("./healthRoutes");
const { createPublicContentController } = require("../controllers/publicContentController");
const { createAdminContentController } = require("../controllers/adminContentController");
const { createAdminUserController } = require("../controllers/adminUserController");
const { createSpeakerController } = require("../controllers/speakerController");
const { createImageController } = require("../controllers/imageController");
const { createDashboardStatsController } = require("../controllers/dashboardStatsController");
const { createDashboardLookupController } = require("../controllers/dashboardLookupController");
const { createAuthController } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { requireTrustedOrigin } = require("../middleware/requireTrustedOrigin");
const { rateLimitAdminWrites } = require("../middleware/rateLimitAdminWrites");

const { createAboutController } = require("../controllers/aboutController");

const CONTENT_SCOPES = {
  competitions: "competitions", teams: "teams", workshops: "workshops",
  projects: "projects", announcements: "announcements", "team-members": "team-members",
};

function createApiRoutes({ pool, authTokenSecret, corsOrigins, isProduction }) {
  const router = express.Router();
  const publicRouter = express.Router();
  const adminRouter = express.Router();
  const authRouter = express.Router();
  const aboutController = createAboutController(pool);
  const publicController = createPublicContentController(pool);
  const contentController = createAdminContentController(pool);
  const userController = createAdminUserController(pool);
  const speakerController = createSpeakerController(pool);
  const imageController = createImageController();
  const statsController = createDashboardStatsController(pool);
  const lookupController = createDashboardLookupController(pool);
  const authController = createAuthController({ pool, tokenSecret: authTokenSecret, isProduction });
  const requireAuth = authenticate({ pool, tokenSecret: authTokenSecret, isProduction });
  const checkOrigin = requireTrustedOrigin(corsOrigins);

  router.use("/health", healthRoutes);

  publicRouter.get("/about", aboutController.publicGet);
  publicRouter.get("/team-members", publicController.teamMembers);
  publicRouter.get("/site-settings", publicController.siteSettings);
  publicRouter.get("/competitions", publicController.competitions);
  publicRouter.get("/workshops", publicController.workshops);
  publicRouter.get("/projects", publicController.projects);
  publicRouter.get("/announcements", publicController.announcements);
  publicRouter.get("/timeline-events", publicController.timelineEvents);
  publicRouter.get("/sponsors", publicController.sponsors);
  publicRouter.get("/faqs", publicController.faqs);
  router.use("/public", publicRouter);

  authRouter.get("/login-options", authController.loginOptions);
  authRouter.post("/login", checkOrigin, authController.login);
  authRouter.post("/logout", checkOrigin, requireAuth, authController.logout);
  authRouter.get("/session", requireAuth, authController.session);
  router.use("/auth", authRouter);

  adminRouter.use(requireAuth);
  adminRouter.use(checkOriginOnWrite(corsOrigins));
  adminRouter.use(rateLimitAdminWrites);

  adminRouter.get("/stats", authorize("dashboard"), statsController.get);
  adminRouter.get("/lookups/workshops", authorize("speakers"), lookupController.workshops);
  adminRouter.get("/lookups/competitions", authorize("teams"), lookupController.competitions);

  adminRouter.post("/images/:resource", (request, _response, next) => {
    if (!["competitions", "workshops", "projects", "announcements", "about", "team-members"].includes(request.params.resource)) {
      return next(require("../utils/httpError").httpError(404, "Route not found."));
    }
    return authorize(request.params.resource)(request, _response, next);
  }, express.raw({ type: "*/*", limit: "5mb" }), imageController.upload);

  adminRouter.get("/about", authorize("about"), aboutController.get);
  adminRouter.patch("/about", authorize("about"), aboutController.update);

  for (const [resource, scope] of Object.entries(CONTENT_SCOPES)) {
    const resourceRouter = express.Router();
    resourceRouter.use(authorize(scope));
    resourceRouter.get("/", contentController.list(resource));
    resourceRouter.post("/", contentController.create(resource));
    resourceRouter.get("/:id", contentController.get(resource));
    resourceRouter.patch("/:id", contentController.update(resource));
    resourceRouter.delete("/:id", contentController.remove(resource));
    adminRouter.use(`/${resource}`, resourceRouter);
  }

  const speakerRouter = express.Router();
  speakerRouter.use(authorize("speakers"));
  speakerRouter.get("/", speakerController.list);
  speakerRouter.post("/", speakerController.create);
  speakerRouter.get("/:id", speakerController.get);
  speakerRouter.patch("/:id", speakerController.update);
  speakerRouter.delete("/:id", speakerController.remove);
  speakerRouter.post("/:id/workshops", speakerController.addWorkshop);
  speakerRouter.patch("/:id/workshops/:workshopId", speakerController.updateWorkshop);
  speakerRouter.delete("/:id/workshops/:workshopId", speakerController.removeWorkshop);
  adminRouter.use("/speakers", speakerRouter);

  const adminUsers = express.Router();
  adminUsers.use(authorize("users"));
  adminUsers.get("/", userController.list);
  adminUsers.post("/", userController.create);
  adminUsers.get("/:id", userController.get);
  adminUsers.patch("/:id", userController.update);
  adminUsers.delete("/:id", userController.remove);
  adminRouter.use("/users", adminUsers);

  router.use("/admin", adminRouter);
  return router;
}

function checkOriginOnWrite(origins) {
  const verify = requireTrustedOrigin(origins);
  return (request, response, next) => {
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return verify(request, response, next);
    next();
  };
}

module.exports = { createApiRoutes };
