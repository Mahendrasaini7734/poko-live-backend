const {
  SESv2Client,
  SendEmailCommand
} = require("@aws-sdk/client-sesv2");

const sesClient = new SESv2Client({
  region: "ap-south-1"
});

const allowedSenders = {
  hello: "Zigo Live <hello@zigolive.stackearn.com>",
  support: "Zigo Support <support@zigolive.stackearn.com>",
  team: "Zigo Team <team@zigolive.stackearn.com>",
  noreply: "Zigo Live <noreply@zigolive.stackearn.com>"
};

const sendEmail = async ({
  sender = "hello",
  to,
  subject,
  html,
  text,
  campaignId,
  recipientId
}) => {
  if (!to) {
    throw new Error("Recipient email is required");
  }

  if (!subject) {
    throw new Error("Email subject is required");
  }

  if (!html && !text) {
    throw new Error("Email body is required");
  }

  const fromEmailAddress = allowedSenders[sender];

  if (!fromEmailAddress) {
    throw new Error(
      `Invalid sender. Allowed senders: ${Object.keys(allowedSenders).join(", ")}`
    );
  }

  const command = new SendEmailCommand({
    FromEmailAddress: fromEmailAddress,

    Destination: {
      ToAddresses: [to]
    },

    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8"
        },

        Body: {
          ...(html && {
            Html: {
              Data: html,
              Charset: "UTF-8"
            }
          }),

          ...(text && {
            Text: {
              Data: text,
              Charset: "UTF-8"
            }
          })
        }
      }
    },

    ConfigurationSetName: "zigo-production",

    EmailTags: [
      {
        Name: "campaignId",
        Value: String(campaignId || "unknown")
      },
      {
        Name: "recipientId",
        Value: String(recipientId || "unknown")
      }
    ]
  });

  const response = await sesClient.send(command);

  return {
    messageId: response.MessageId,
    sender: fromEmailAddress
  };
};

module.exports = {
  sendEmail
};