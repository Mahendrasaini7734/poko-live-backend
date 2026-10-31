const express = require("express");

const router = express.Router();

const EmailController = require("../../controllers/email/email.controller");
const emailCampaign = require("./campaign.route");

router.post(
  "/sendEmail",
  EmailController.sendEmail
);

router.use(
  "/campaign",
  emailCampaign
);

module.exports = router;