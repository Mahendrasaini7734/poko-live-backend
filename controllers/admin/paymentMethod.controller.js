const PaymentMethod = require("../../models/paymentMethod.model");
const { getMediaUrl, getMediaUrls } = require("../../util/media");
const deleteMedia = require("../../util/deletefile");


//fs
const fs = require("fs");

// Add Payment Method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { name, details } = req.body;

    console.log("========== ADD PAYMENT METHOD ==========");
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);
    console.log("========================================");

    if (!name || !String(name).trim()) {
      return res.status(200).json({
        status: false,
        message: "Name is required.",
      });
    }

    let parsedDetails = details || [];

    // multipart/form-data mein details string aa sakti hai
    if (typeof parsedDetails === "string") {
      try {
        parsedDetails = JSON.parse(parsedDetails);
      } catch (error) {
        parsedDetails = [parsedDetails];
      }
    }

    if (!Array.isArray(parsedDetails)) {
      return res.status(200).json({
        status: false,
        message:
          "Details must be an array of strings.",
      });
    }

    // ==========================================
    // GET IMAGE FROM req.files
    // ==========================================

    const imageFile =
      req.files?.image?.[0] || null;

    console.log(
      "Payment Image File:",
      imageFile
    );

    const imageKey =
      imageFile?.key || "";

    console.log(
      "Payment Image Key:",
      imageKey
    );

    // ==========================================
    // CREATE PAYMENT METHOD
    // ==========================================

    const method = new PaymentMethod({
      name: String(name).trim(),

      // DB mein sirf S3 key save hogi
      image: imageKey,

      details: parsedDetails,
    });

    await method.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    const responseData = {
      ...method.toObject(),

      image: method.image
        ? getMediaUrl(method.image)
        : "",
    };

    console.log(
      "Saved Payment Method:",
      responseData
    );

    return res.status(200).json({
      status: true,
      message:
        "Payment method has been created by the admin.",
      data: responseData,
    });
  } catch (error) {
    console.error(
      "❌ addPaymentMethod Error:",
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

//Update Payment Method
// Modify Payment Method
exports.modifyPaymentMethod = async (req, res) => {
  try {
    const {
      paymentMethodId,
      name,
      details,
    } = req.body;

    console.log(
      "========== MODIFY PAYMENT METHOD =========="
    );

    console.log(
      "BODY:",
      req.body
    );

    console.log(
      "FILES:",
      req.files
    );

    console.log(
      "============================================"
    );

    if (!paymentMethodId) {
      return res.status(200).json({
        status: false,
        message:
          "paymentMethodId is required.",
      });
    }

    const method =
      await PaymentMethod.findById(
        paymentMethodId
      );

    if (!method) {
      return res.status(200).json({
        status: false,
        message:
          "Payment method not found.",
      });
    }

    // ==========================================
    // IMAGE
    // ==========================================

    const imageFile =
      req.files?.image?.[0] || null;

    if (imageFile) {
      const imageKey =
        imageFile.key || "";

      console.log(
        "New Payment Image:",
        imageKey
      );

      if (imageKey) {
        // DB mein sirf new S3 key save karo
        method.image = imageKey;
      }
    }

    // ==========================================
    // NAME
    // ==========================================

    if (
      name !== undefined &&
      name !== null
    ) {
      const trimmedName =
        String(name).trim();

      if (!trimmedName) {
        return res.status(200).json({
          status: false,
          message:
            "Name cannot be empty.",
        });
      }

      method.name = trimmedName;
    }

    // ==========================================
    // DETAILS
    // ==========================================

    if (details !== undefined) {
      let parsedDetails = details;

      // multipart/form-data mein
      // details string aa sakti hai
      if (
        typeof parsedDetails ===
        "string"
      ) {
        try {
          parsedDetails =
            JSON.parse(parsedDetails);
        } catch (error) {
          parsedDetails = [
            parsedDetails,
          ];
        }
      }

      if (!Array.isArray(parsedDetails)) {
        return res.status(200).json({
          status: false,
          message:
            "Details must be an array of strings.",
        });
      }

      method.details =
        parsedDetails;
    }

    await method.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    const responseData = {
      ...method.toObject(),

      image: method.image
        ? getMediaUrl(
          method.image
        )
        : "",
    };

    console.log(
      "Updated Payment Method:",
      responseData
    );

    return res.status(200).json({
      status: true,
      message:
        "Payment method has been updated by the admin.",
      data: responseData,
    });
  } catch (error) {
    console.error(
      "❌ modifyPaymentMethod Error:",
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

//handle the isActive status of the payment method
exports.updatePaymentMethodStatus = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.query;

    if (!paymentMethodId) {
      return res.status(200).json({ status: false, message: "paymentMethodId is required." });
    }

    const method = await PaymentMethod.findById(paymentMethodId);
    if (!method) {
      return res.status(200).json({ status: false, message: "Payment method not found." });
    }

    method.isActive = !method.isActive;
    await method.save();

    return res.status(200).json({
      status: true,
      message: "Payment method has been updated successfully.",
      data: method,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message || "Internal Server Error" });
  }
};

//Get All Payment Methods
// Retrieve payment methods for admin
exports.retrievePaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find()
      .sort({ createdAt: -1 })
      .lean();

    const data = methods.map((method) => ({
      ...method,

      image: method.image
        ? getMediaUrl(method.image)
        : "",
    }));

    return res.status(200).json({
      status: true,
      message:
        "Retrieved payment methods for the admin.",
      data,
    });
  } catch (error) {
    console.error(
      "❌ retrievePaymentMethods Error:",
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

//Disable Payment Method
exports.discardPaymentMethod = async (req, res, next) => { try { const { paymentMethodId } = req.query; if (!paymentMethodId) { return res.status(200).json({ status: false, message: "paymentMethodId is required." }); } const method = await PaymentMethod.findById(paymentMethodId).select("_id image"); if (!method) { return res.status(200).json({ status: false, message: "Payment method does not exist." }); } res.status(200).json({ status: true, message: "Payment method has been disabled by the admin." }); if (method.image) { const imagePath = method.image.includes("storage") ? "storage" + method.image.split("storage")[1] : ""; if (imagePath && fs.existsSync(imagePath)) { const imageName = imagePath.split("/").pop(); if (!["male.png", "female.png"].includes(imageName)) { fs.unlinkSync(imagePath); } } } await PaymentMethod.findByIdAndDelete(paymentMethodId); } catch (error) { console.error(error); return res.status(500).json({ status: false, message: error.message || "Internal Server Error" }); } };
