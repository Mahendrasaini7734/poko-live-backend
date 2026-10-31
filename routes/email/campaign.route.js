const express = require("express");
const router = express.Router();

const EmailCampaignController = require("../../controllers/email/emailCampaign.controller");

router.post(
  "/createCampaign",
  EmailCampaignController.createCampaign
);

module.exports = router;