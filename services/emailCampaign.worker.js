const EmailCampaignRecipient = require("../models/emailCampaignRecipient.model");
const EmailCampaign = require("../models/emailCampaign.model");
const SesService = require("./ses.service");
const zigoEmailTemplate = require("../templates/zigoEmail.template");

const SEND_RATE = 10;
const DELAY = 1000 / SEND_RATE;
const BATCH_SIZE = 500;
const SES_TIMEOUT = 30000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sendEmailWithTimeout = async (emailData) => {
  return Promise.race([
    SesService.sendEmail(emailData),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `SES request timeout after ${SES_TIMEOUT}ms`
          )
        );
      }, SES_TIMEOUT);
    }),
  ]);
};

const processEmailCampaign = async (campaignId) => {
  console.log(
    `\n[EMAIL WORKER] 🚀 Worker started: ${campaignId}`
  );

  let campaign =
    await EmailCampaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Email campaign not found");
  }

  console.log(
    `[EMAIL WORKER] 📊 Campaign status: ${campaign.status}`
  );

  console.log(
    `[EMAIL WORKER] 👥 Total recipients: ${campaign.totalRecipients}`
  );

  if (
    !["QUEUED", "PROCESSING"].includes(
      campaign.status
    )
  ) {
    throw new Error(
      `Campaign cannot be processed in ${campaign.status} status`
    );
  }

  await EmailCampaign.findByIdAndUpdate(
    campaignId,
    {
      status: "PROCESSING",
      startedAt:
        campaign.startedAt || new Date(),
      lastProcessedAt: new Date(),
    }
  );

  let processed = 0;

  while (true) {
    campaign =
      await EmailCampaign.findById(
        campaignId
      ).lean();

    if (!campaign) {
      throw new Error(
        "Email campaign not found"
      );
    }

    if (campaign.status === "PAUSED") {
      console.log(
        `[EMAIL WORKER] ⏸ Campaign paused: ${campaignId}`
      );

      break;
    }

    if (campaign.status === "CANCELLED") {
      console.log(
        `[EMAIL WORKER] 🛑 Campaign cancelled: ${campaignId}`
      );

      break;
    }

    const recipients =
      await EmailCampaignRecipient.find({
        campaignId,
        status: "PENDING",
      })
        .sort({
          createdAt: 1,
        })
        .limit(BATCH_SIZE)
        .lean();

    console.log(
      `[EMAIL WORKER] 📦 Pending batch: ${recipients.length}`
    );

    if (!recipients.length) {
      console.log(
        `[EMAIL WORKER] ✅ No pending recipients remaining`
      );

      break;
    }

    for (const recipient of recipients) {
      try {
        const lockedRecipient =
          await EmailCampaignRecipient.findOneAndUpdate(
            {
              _id: recipient._id,
              status: "PENDING",
            },
            {
              status: "SENDING",
              $inc: {
                attempts: 1,
              },
            },
            {
              new: true,
            }
          );

        if (!lockedRecipient) {
          console.log(
            `[EMAIL WORKER] ⚠️ Recipient already locked: ${recipient.email}`
          );

          continue;
        }


        const html =
          zigoEmailTemplate({
            userName: "Zigo User",
            title: campaign.subject,
            message:
              "We have something exciting waiting for you on Zigo Live. Come back and connect with your community.",
            buttonText:
              "Open Zigo Live",
            buttonUrl:
              "https://play.google.com/store/apps/details?id=com.stackearn.zigo.live&pcampaignid=web_share",
            unsubscribeUrl:
              "https://zigolive.stackearn.com/unsubscribe",
          });
        const result = await sendEmailWithTimeout({
          sender: campaign.sender,
          to: lockedRecipient.email,
          subject: campaign.subject,
          html,
          text:
            "We have something exciting waiting for you on Zigo Live. Come back and connect with your community.",

          campaignId: campaignId,
          recipientId: lockedRecipient._id
        });

        await EmailCampaignRecipient.findByIdAndUpdate(
          lockedRecipient._id,
          {
            status: "SENT",
            messageId:
              result.messageId,
            sentAt: new Date(),
            errorMessage: null,
          }
        );

        await EmailCampaign.findByIdAndUpdate(
          campaignId,
          {
            $inc: {
              sent: 1,
            },
            $set: {
              lastProcessedAt:
                new Date(),
            },
          }
        );

        processed++;

        const currentCampaign =
          await EmailCampaign.findById(
            campaignId
          )
            .select(
              "totalRecipients sent failed"
            )
            .lean();

        const total =
          currentCampaign
            ?.totalRecipients || 0;

        const sent =
          currentCampaign?.sent || 0;

        const failed =
          currentCampaign?.failed || 0;

        const remaining =
          Math.max(
            total - sent - failed,
            0
          );

        console.log(
          `[EMAIL WORKER] 📊 Progress: ${sent}/${total} sent | Failed: ${failed} | Remaining: ${remaining}`
        );

        await sleep(DELAY);
      } catch (error) {
        console.error(
          `\n[EMAIL WORKER] ❌ Failed: ${recipient.email}`
        );

        console.error(
          `[EMAIL WORKER] ❌ Error: ${error.message}`
        );

        await EmailCampaignRecipient.findByIdAndUpdate(
          recipient._id,
          {
            status: "FAILED",
            failedAt: new Date(),
            errorMessage:
              error.message,
          }
        );

        await EmailCampaign.findByIdAndUpdate(
          campaignId,
          {
            $inc: {
              failed: 1,
            },
            $set: {
              lastProcessedAt:
                new Date(),
            },
          }
        );

        processed++;

        const currentCampaign =
          await EmailCampaign.findById(
            campaignId
          )
            .select(
              "totalRecipients sent failed"
            )
            .lean();

        const total =
          currentCampaign
            ?.totalRecipients || 0;

        const sent =
          currentCampaign?.sent || 0;

        const failed =
          currentCampaign?.failed || 0;

        const remaining =
          Math.max(
            total - sent - failed,
            0
          );

        console.log(
          `[EMAIL WORKER] 📊 Progress: ${sent}/${total} sent | Failed: ${failed} | Remaining: ${remaining}`
        );

        await sleep(DELAY);
      }
    }
  }

  console.log(
    `[EMAIL WORKER] 🔍 Checking remaining recipients...`
  );

  const remaining =
    await EmailCampaignRecipient.countDocuments(
      {
        campaignId,
        status: {
          $in: [
            "PENDING",
            "SENDING",
          ],
        },
      }
    );

  console.log(
    `[EMAIL WORKER] ⏳ Remaining recipients: ${remaining}`
  );

  const latestCampaign =
    await EmailCampaign.findById(
      campaignId
    ).lean();

  if (
    remaining === 0 &&
    latestCampaign &&
    ![
      "PAUSED",
      "CANCELLED",
    ].includes(
      latestCampaign.status
    )
  ) {
    await EmailCampaign.findByIdAndUpdate(
      campaignId,
      {
        status: "COMPLETED",
        completedAt: new Date(),
        lastProcessedAt: new Date(),
      }
    );

    console.log(
      `[EMAIL WORKER] ✅ Campaign marked as COMPLETED`
    );
  }

  const finalCampaign =
    await EmailCampaign.findById(
      campaignId
    ).lean();

  console.log(`
📧 EMAIL CAMPAIGN COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Campaign ID        : ${campaignId}
👥 Total Recipients : ${finalCampaign?.totalRecipients || 0}
✅ Emails Sent      : ${finalCampaign?.sent || 0}
❌ Failed           : ${finalCampaign?.failed || 0}
📦 Processed Run    : ${processed}
⏳ Remaining        : ${remaining}
📊 Status           : ${finalCampaign?.status || "UNKNOWN"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  return {
    campaignId,
    totalRecipients:
      finalCampaign?.totalRecipients || 0,
    sent:
      finalCampaign?.sent || 0,
    failed:
      finalCampaign?.failed || 0,
    processed,
    remaining,
    status:
      finalCampaign?.status || "UNKNOWN",
  };
};

module.exports = {
  processEmailCampaign,
};