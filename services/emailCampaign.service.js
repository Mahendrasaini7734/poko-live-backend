const EmailCampaign = require("../models/emailCampaign.model");
const EmailCampaignRecipient = require("../models/emailCampaignRecipient.model");
const User = require("../models/user.model");

const {
  getEligibleUsers
} = require("./emailEligibility.service");

const createCampaignFromEligibleUsers = async ({
  name,
  subject,
  sender = "hello",
  userIds = []
}) => {
  if (!name) {
    throw new Error("Campaign name is required");
  }

  if (!subject) {
    throw new Error("Campaign subject is required");
  }

  let users = [];

  if (userIds.length > 0) {
    users = await User
      .find({
        _id: {
          $in: userIds
        },
        email: {
          $exists: true,
          $nin: [null, ""]
        }
      })
      .select("_id email")
      .lean();
  } else {
    users = await getEligibleUsers();
  }

  if (!users.length) {
    console.log(
      "[EMAIL CAMPAIGN] ℹ️ No eligible users found. Campaign skipped."
    );

    return {
      campaign: null,
      totalRecipients: 0,
      skipped: true
    };
  }

  const campaign = await EmailCampaign.create({
    name,
    subject,
    sender,
    status: "QUEUED",
    totalRecipients: users.length,
    source: "SYSTEM"
  });

  const recipients = users.map((user) => ({
    campaignId: campaign._id,
    userId: user._id,
    email: user.email.toLowerCase().trim(),
    status: "PENDING"
  }));

  await EmailCampaignRecipient.insertMany(
    recipients,
    {
      ordered: false
    }
  );

  console.log(
    `[EMAIL CAMPAIGN] ✅ Campaign created with ${users.length} recipients`
  );

  return {
    campaign,
    totalRecipients: users.length,
    skipped: false
  };
};

module.exports = {
  createCampaignFromEligibleUsers
};