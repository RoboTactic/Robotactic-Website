const express = require("express");
const healthRoutes = require("./healthRoutes");
const { createPublicContentController } = require("../controllers/publicContentController");
const { createAdminContentController } = require("../controllers/adminContentController");
const { createAdminUserController } = require("../controllers/adminUserController");
const { createAuthController } = require("../controllers/authController");
const { authenticate } = require("../middleware/authenticate");
const { authorize } = require("../middleware/authorize");
const { requireTrustedOrigin } = require("../middleware/requireTrustedOrigin");
const { rateLimitAdminWrites } = require("../middleware/rateLimitAdminWrites");

const CONTENT_SCOPES = {
  competitions: "competitions", teams: "teams", workshops: "workshops",
  participants: "participants", projects: "projects", announcements: "announcements",
};

function createApiRoutes({ pool, authTokenSecret, corsOrigins, isProduction }) {
  const router = express.Router();
  const publicRouter = express.Router();
  const adminRouter = express.Router();
  const authRouter = express.Router();
  const publicController = createPublicContentController(pool);
  const contentController = createAdminContentController(pool);
  const userController = createAdminUserController(pool);
  const authController = createAuthController({ pool, tokenSecret: authTokenSecret, isProduction });
  const requireAuth = authenticate({ pool, tokenSecret: authTokenSecret, isProduction });
  const checkOrigin = requireTrustedOrigin(corsOrigins);

  router.use("/health", healthRoutes);

  publicRouter.get("/site-settings", publicController.siteSettings);
  publicRouter.get("/competitions", publicController.competitions);
  publicRouter.get("/workshops", publicController.workshops);
  publicRouter.get("/projects", publicController.projects);
  publicRouter.get("/announcements", publicController.announcements);
  publicRouter.get("/timeline-events", publicController.timelineEvents);
  publicRouter.get("/sponsors", publicController.sponsors);
  publicRouter.get("/faqs", publicController.faqs);
  router.use("/public", publicRouter);

  authRouter.post("/login", checkOrigin, authController.login);
  authRouter.post("/logout", checkOrigin, requireAuth, authController.logout);
  authRouter.get("/session", requireAuth, authController.session);
  router.use("/auth", authRouter);

  adminRouter.use(requireAuth);
  adminRouter.use(checkOriginOnWrite(corsOrigins));
  adminRouter.use(rateLimitAdminWrites);

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

  const adminUsers = express.Router();
  adminUsers.use(authorize("users"));
  adminUsers.get("/", userController.list);
  adminUsers.post("/", userController.create);
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
