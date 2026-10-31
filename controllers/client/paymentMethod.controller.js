const PaymentMethod = require("../../models/paymentMethod.model");


// Get active payment methods
const {
  getMediaUrl
} = require("../../util/media");

// Get active payment methods
exports.getActivePaymentMethods = async (req, res) => {
  try {
    console.log(
      "========== FETCH PAYMENT METHODS =========="
    );

    const paymentMethods =
      await PaymentMethod.find({
        isActive: true,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    const data = paymentMethods.map((method) => ({
      ...method,

      image: method.image
        ? getMediaUrl(method.image)
        : "",
    }));

    console.log(
      "Payment Methods Count:",
      data.length
    );

    console.log(
      "Payment Methods:",
      data
    );

    console.log(
      "============================================"
    );

    return res.status(200).json({
      status: true,

      message:
        data.length > 0
          ? "Active payment methods retrieved successfully."
          : "No active payment methods found.",

      data,
    });
  } catch (error) {
    console.error(
      "❌ Error fetching active payment methods:",
      error
    );

    return res.status(500).json({
      status: false,
      message:
        error.message ||
        "Internal Server Error",
    });
  }
};
