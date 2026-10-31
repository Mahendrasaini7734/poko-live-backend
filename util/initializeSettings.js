//settingJson
const settingJson = require("../data");
async function initializeSettings() {
  try {
    const setting = settingJson;
    if (setting) {
      global.settingJSON = setting;
      console.log("✅ Settings Initialized");
    } else {
      global.settingJSON = settingJson;
    }
  } catch (error) {
    console.error("❌ Failed to initialize settings:", error);
  }
}

module.exports = initializeSettings;
