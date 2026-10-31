// server-only secrets must never reach the app binary / network
const stripServerSecrets = (setting) => {
  const { privateKey, razorpaySecretKey, ...safe } = setting;
  return safe;
};

//get setting
exports.retrieveAppSettings = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    return res.status(200).json({ status: true, message: "Success", data: stripServerSecrets(setting) });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};

//get setting
exports.getSystemConfiguration = async (req, res) => {
  try {
    const setting = settingJSON ? settingJSON : null;
    if (!setting) {
      return res.status(200).json({ status: false, message: "Setting does not found." });
    }

    const filteredData = {
      privacyPolicyLink: setting.privacyPolicyLink,
      termsOfUsePolicyLink: setting.termsOfUsePolicyLink,
    };

    return res.status(200).json({ status: true, message: "Success", data: filteredData });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Internal Server Error" });
  }
};
