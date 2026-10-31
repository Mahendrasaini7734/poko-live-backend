const EmailCampaign = require("../../models/emailCampaign.model");
const EmailCampaignRecipient = require("../../models/emailCampaignRecipient.model");
const EmailSuppression = require("../../models/emailSuppression.model");

const createCampaign = async (req, res) => {
  try {
    const {
      name,
      subject,
      sender = "hello",
      userIds = []
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Campaign name is required"
      });
    }

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Campaign subject is required"
      });
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one user is required"
      });
    }

    const User = require("../../models/user/user.model");

    const users = await User.find({
      _id: {
        $in: userIds
      },
      email: {
        $exists: true,
        $ne: ""
      }
    })
      .select("_id email")
      .lean();

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "No eligible users found"
      });
    }

    const emails = users.map((user) =>
      user.email.toLowerCase().trim()
    );

    const suppressedEmails = await EmailSuppression.find({
      email: {
        $in: emails
      }
    })
      .select("email")
      .lean();

    const suppressedSet = new Set(
      suppressedEmails.map((item) => item.email)
    );

    const eligibleUsers = users.filter((user) => {
      const email = user.email.toLowerCase().trim();

      return !suppressedSet.has(email);
    });

    if (!eligibleUsers.length) {
      return res.status(400).json({
        success: false,
        message: "All selected users are suppressed"
      });
    }

    const campaign = await EmailCampaign.create({
      name,
      subject,
      sender,
      status: "QUEUED",
      totalRecipients: eligibleUsers.length,
      createdBy: req.user?._id || null
    });

    const recipients = eligibleUsers.map((user) => ({
      campaignId: campaign._id,
      userId: user._id,
      email: user.email.toLowerCase().trim(),
      status: "PENDING"
    }));

    await EmailCampaignRecipient.insertMany(recipients);

    return res.status(201).json({
      success: true,
      message: "Email campaign created successfully",
      data: {
        campaignId: campaign._id,
        name: campaign.name,
        subject: campaign.subject,
        sender: campaign.sender,
        totalRecipients: eligibleUsers.length,
        status: campaign.status
      }
    });
  } catch (error) {
    console.error("Create Email Campaign Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create email campaign",
      error: error.message
    });
  }
};

module.exports = {
  createCampaign
};