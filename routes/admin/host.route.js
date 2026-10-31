const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const upload = require("../../middleware/upload");
const HostController = require("../../controllers/admin/host.controller");

// ================= HOST REQUEST =================
route.get(
  "/fetchHostRequest",
  checkAccessWithSecretKey(),
  HostController.fetchHostRequest
);

route.patch(
  "/handleHostRequest",
  checkAccessWithSecretKey(),
  HostController.handleHostRequest
);

// ================= AGENCY =================
route.patch(
  "/assignHostToAgency",
  checkAccessWithSecretKey(),
  HostController.assignHostToAgency
);

route.get(
  "/listAgencyHosts",
  checkAccessWithSecretKey(),
  HostController.listAgencyHosts
);

// ================= CREATE HOST (S3) =================
route.post(
  "/createHost",
  checkAccessWithSecretKey(),
  upload("host").fields([
    { name: "image", maxCount: 1 },
    { name: "photoGallery", maxCount: 20 },
    { name: "video", maxCount: 20 },
    { name: "liveVideo", maxCount: 20 },
    { name: "profileVideo", maxCount: 20 },
  ]),
  HostController.createHost
);

// ================= UPDATE HOST (S3) =================
route.patch(
  "/updateHost",
  checkAccessWithSecretKey(),
  upload("host").fields([
    { name: "image", maxCount: 1 },
    { name: "photoGallery", maxCount: 20 },
    { name: "video", maxCount: 20 },
    { name: "liveVideo", maxCount: 20 },
    { name: "profileVideo", maxCount: 20 },
  ]),
  HostController.updateHost
);

// ================= STATUS / PROFILE =================
route.patch(
  "/toggleHostStatusByType",
  checkAccessWithSecretKey(),
  HostController.toggleHostStatusByType
);

route.get(
  "/fetchHostProfile",
  checkAccessWithSecretKey(),
  HostController.fetchHostProfile
);

route.get(
  "/fetchHostList",
  checkAccessWithSecretKey(),
  HostController.fetchHostList
);

route.get("/summary", checkAccessWithSecretKey(), HostController.hostSummary);
route.get("/presence", checkAccessWithSecretKey(), HostController.hostPresence);

// ================= DELETE =================
route.delete(
  "/deleteHost",
  checkAccessWithSecretKey(),
  HostController.deleteHost
);

module.exports = route;
