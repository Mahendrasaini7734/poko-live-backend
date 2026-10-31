//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const DashboardController = require("../../controllers/admin/dashboard.controller");

//get dashboard count
route.get("/fetchDashboardMetrics", checkAccessWithSecretKey(), DashboardController.fetchDashboardMetrics);

//get chat analytic
route.get("/retrieveChartStats", checkAccessWithSecretKey(), DashboardController.retrieveChartStats);

//get new user
route.get("/getNewUsers", checkAccessWithSecretKey(), DashboardController.getNewUsers);

//get top agency
route.get("/getTopPerformingAgencies", checkAccessWithSecretKey(), DashboardController.getTopPerformingAgencies);

//get top performing hosts
route.get("/getTopPerformingHosts", checkAccessWithSecretKey(), DashboardController.getTopPerformingHosts);

//get top spenders
route.get("/fetchTopSpenders", checkAccessWithSecretKey(), DashboardController.fetchTopSpenders);

// ---- Dashboard V2 (date-range + growth aware, feed + live + platform) ----
const DashboardV2 = require("../../controllers/admin/dashboardV2.controller");
route.get("/v2/overview", checkAccessWithSecretKey(), DashboardV2.overview);
route.get("/v2/trends", checkAccessWithSecretKey(), DashboardV2.trends);

module.exports = route;
