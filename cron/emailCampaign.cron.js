const cron = require("node-cron");

const {
  createCampaignFromEligibleUsers
} = require("../services/emailCampaign.service");

const {
  processEmailCampaign
} = require("../services/emailCampaign.worker");

const startEmailCampaignCron = () => {
  cron.schedule(
    "0 19 0 * * *",
    async () => {
      try {
        console.log(
          "\n[EMAIL CRON] 🚀 Starting daily email campaign..."
        );
        

        const campaign =
          await createCampaignFromEligibleUsers({
            name: `Zigo Campaign ${new Date().toISOString()}`,
            subject: "💜 Zigo Live is waiting for you!",
            sender: "team"
          });

        if (campaign.skipped) {
          console.log(
            "[EMAIL CRON] ℹ️ No eligible users today. Nothing to send."
          );

          return;
        }

        console.log(
          `[EMAIL CRON] ✅ Campaign created: ${campaign.campaign._id}`
        );

        console.log(
          `[EMAIL CRON] 👥 Total eligible users: ${campaign.totalRecipients}`
        );

        console.log(
          "[EMAIL CRON] 🚀 Starting email worker..."
        );

        const result =
          await processEmailCampaign(
            campaign.campaign._id
          );

        console.log(
          "\n[EMAIL CRON] 🎉 Campaign completed"
        );

        console.log(
          `Total Recipients : ${result.totalRecipients}`
        );

        console.log(
          `Emails Sent      : ${result.sent}`
        );

        console.log(
          `Failed           : ${result.failed}`
        );

        console.log(
          `Processed        : ${result.processed}`
        );

        console.log(
          `Remaining        : ${result.remaining}`
        );

        console.log(
          `Status           : ${result.status}`
        );

      } catch (error) {
        console.error(
          "[EMAIL CRON] ❌ Error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata"
    }
  );

  console.log(
    "[EMAIL CRON] ⏰ Daily email campaign cron started — 12:38 AM IST"
  );
};

module.exports = {
  startEmailCampaignCron
};