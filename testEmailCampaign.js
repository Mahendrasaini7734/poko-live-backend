require("dotenv").config({ path: ".env" });
require("./util/connection");

const {
    createCampaignFromEligibleUsers
} = require("./services/emailCampaign.service");

const {
    processEmailCampaign
} = require("./services/emailCampaign.worker");

const runTest = async () => {
    try {
        const campaign =
            await createCampaignFromEligibleUsers({
                name: "Zigo Test Campaign",
                subject: "We Miss You on Zigo Live 💜",
                sender: "hello",
                userIds: [
                    "6aa2b4626f9cb26e067e3ad2"
                ]
            });

        console.log(
            "Campaign Created:",
            campaign.campaign._id
        );

        const result =
            await processEmailCampaign(
                campaign.campaign._id
            );

        console.log(
            "Campaign Result:",
            result
        );

        process.exit(0);

    } catch (error) {
        console.error(
            "Test Campaign Error:",
            error
        );

        process.exit(1);
    }
};

runTest();