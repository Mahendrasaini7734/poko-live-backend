const User = require("../models/user.model");
const EmailSuppression = require("../models/emailSuppression.model");

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const getEligibleUsers = async () => {
  const suppressedEmails =
    await EmailSuppression
      .find({})
      .select("email")
      .lean();

  const suppressedSet = new Set(
    suppressedEmails
      .map((item) =>
        item.email?.toLowerCase().trim()
      )
      .filter(Boolean)
  );

  const users = await User
    .find({
      email: {
        $exists: true,
        $nin: [null, ""]
      }
    })
    .select("_id email")
    .lean();

  if (!users.length) {
    console.log(
      "[EMAIL ELIGIBILITY] No users found."
    );

    return [];
  }

  let invalidCount = 0;
  let suppressedCount = 0;

  const eligibleUsers = [];

  for (const user of users) {
    if (!user.email) {
      continue;
    }

    const email =
      user.email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(email)) {
      invalidCount++;
      continue;
    }

    if (suppressedSet.has(email)) {
      suppressedCount++;
      continue;
    }

    eligibleUsers.push({
      _id: user._id,
      email
    });
  }

  console.log(
    `[EMAIL ELIGIBILITY] Total users with email: ${users.length}`
  );

  console.log(
    `[EMAIL ELIGIBILITY] Invalid emails skipped: ${invalidCount}`
  );

  console.log(
    `[EMAIL ELIGIBILITY] Suppressed emails skipped: ${suppressedCount}`
  );

  console.log(
    `[EMAIL ELIGIBILITY] Eligible users: ${eligibleUsers.length}`
  );

  return eligibleUsers;
};

module.exports = {
  getEligibleUsers
};