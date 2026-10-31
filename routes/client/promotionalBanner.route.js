const express = require("express");

const router = express.Router();
//validate user's access token
const validateUserToken = require("../../middleware/validateUserToken.middleware");
//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");


const { retrievePromotionalBanners } = require("../../controllers/client/promotionalBanner.controller");

router.get(
  "/retrievePromotionalBanners", checkAccessWithSecretKey(), validateUserToken,
  retrievePromotionalBanners
);

module.exports = router;