const SesService = require("../../services/ses.service");
const zigoEmailTemplate = require("../../templates/zigoEmail.template");

const sendEmail = async (req, res) => {
  try {
    const {
      sender = "hello",
      to,
      userName,
      title,
      message,
      buttonText,
      buttonUrl,
      bannerUrl,
      unsubscribeUrl
    } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required"
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Email title is required"
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Email message is required"
      });
    }

    const html = zigoEmailTemplate({
      userName,
      title,
      message,
      buttonText,
      buttonUrl,
      bannerUrl,
      unsubscribeUrl
    });

    const result = await SesService.sendEmail({
      sender,
      to,
      subject: title,
      html,
      text: message
    });

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: result
    });
  } catch (error) {
    console.error("Send Email Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message
    });
  }
};

module.exports = {
  sendEmail
};