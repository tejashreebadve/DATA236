const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const doc = {
  openapi: "3.0.0",
  info: { title: "Lab1 Airbnb API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8000" }],
  paths: {
    "/api/auth/signup": { post: { summary: "Signup", responses: { "200": { description: "OK" } } } },
    "/api/auth/login": { post: { summary: "Login", responses: { "200": { description: "OK" } } } },
    "/api/auth/logout": { post: { summary: "Logout", responses: { "200": { description: "OK" } } } },
    // add more paths as needed…
  }
};
router.use('/', swaggerUi.serve, swaggerUi.setup(doc));
module.exports = router;
