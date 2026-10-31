const express = require("express");
const route = express.Router();

const uploadToS3 = require("../../middleware/upload");
const checkAccessWithSecretKey = require("../../checkAccess");
const AgencyController = require("../../controllers/admin/agency.controller");

// create agency
route.post(
  "/createAgency",
  checkAccessWithSecretKey(),
  uploadToS3('agency').single("image"), // 
  AgencyController.createAgency
);

// update agency
route.patch(
  "/updateAgency",
  checkAccessWithSecretKey(),
  uploadToS3('agency').single("image"), // 
  AgencyController.updateAgency
);

// toggle agency block status
route.patch(
  "/toggleAgencyBlockStatus",
  checkAccessWithSecretKey(),
  AgencyController.toggleAgencyBlockStatus
);

// get agencies
route.get(
  "/getAgencies",
  checkAccessWithSecretKey(),
  AgencyController.getAgencies
);

// delete agency
route.delete(
  "/deleteAgency",
  checkAccessWithSecretKey(),
  AgencyController.deleteAgency
);

// get active agencies list (assign host under agency)
route.get(
  "/getActiveAgenciesList",
  checkAccessWithSecretKey(),
  AgencyController.getActiveAgenciesList
);

module.exports = route;
