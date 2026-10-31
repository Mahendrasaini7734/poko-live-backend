const Admin = require("../../models/admin.model");
const Setting = require("../../models/setting.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { deleteFromS3 } = require("../../util/s3Service");
const firebase = require("../../util/privateKey");
/* ======================================================
   REGISTER ADMIN (Firebase)
====================================================== */
exports.registerAdmin = async (req, res) => {
  try {
    const { uid, email, password, token, privateKey } = req.body;

    if (!uid || !email || !password || !token || !privateKey) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Save Firebase private key (only once)
    let setting = await Setting.findOne({});
    if (!setting) {
      await Setting.create({ privateKey });
    }

    // Verify Firebase token
    const decoded = await firebase.auth.verifyIdToken(token);
    if (decoded.uid !== uid) {
      return res.status(401).json({
        status: false,
        message: "Invalid Firebase token",
      });
    }
    


    // Check existing admin
    const exists = await Admin.findOne({ uid });
    if (exists) {
      return res.status(409).json({
        status: false,
        message: "Admin already registered",
      });
    }

    const admin = await Admin.create({
      uid,
      email: email.toLowerCase(),
      name: "Admin",
    });

    return res.status(201).json({
      status: true,
      message: "Admin registered successfully",
      data: admin,
    });
  } catch (error) {
    console.error("Register Admin Error:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    });
  }
};

/* ===============================
   LOGIN ADMIN
================================ */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    // Find admin
    const admin = await Admin.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }
      console.log("admin" ,admin)

    // Generate JWT
    const token = jwt.sign(
      {
        adminId: admin._id,
        uuid: admin.uid,
      },
      process.env.JWT_SECRET || "ADMIN_SECRET_KEY",
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      status: true,
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        uuid: admin.uid,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

/* ======================================================
   UPDATE ADMIN PROFILE (S3 IMAGE)
====================================================== */
exports.modifyAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select(
      "uuid name email imageUrl imageKey"
    );

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    // Update basic fields
    if (req.body.name) admin.name = req.body.name;
    if (req.body.email) admin.email = req.body.email.trim();

    // Update image (S3)
    if (req.file) {
      const oldImageKey = admin.imageKey;

      admin.imageUrl = req.file.location;
      admin.imageKey = req.file.key;

      await admin.save();

      // delete old image AFTER successful save
      if (oldImageKey) {
        try {
          await deleteFromS3(oldImageKey);
        } catch (err) {
          console.error("Old admin image delete failed:", err.message);
        }
      }
    } else {
      await admin.save();
    }

    return res.status(200).json({
      status: true,
      message: "Admin profile updated successfully",
      data: {
        id: admin._id,
        uuid: admin.uuid,
        name: admin.name,
        email: admin.email,
        image: admin.imageUrl || "",
      },
    });
  } catch (error) {
    console.error("Modify Admin Profile Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

/* ======================================================
   GET ADMIN PROFILE
====================================================== */
exports.retrieveAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select(
      "_id uuid name email imageUrl"
    );

    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Admin profile retrieved successfully",
      data: {
        id: admin._id,
        uuid: admin.uuid,
        name: admin.name,
        email: admin.email,
        image: admin.imageUrl || "",
      },
    });
  } catch (error) {
    console.error("Retrieve Admin Profile Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

/* ======================================================
   CHANGE PASSWORD
====================================================== */
exports.modifyPassword = async (req, res) => {
  try {
    const { oldPass, newPass, confirmPass } = req.body;

    if (!oldPass || !newPass || !confirmPass) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    if (newPass !== confirmPass) {
      return res.status(400).json({
        status: false,
        message: "Passwords do not match",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPass, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Old password is incorrect",
      });
    }

    admin.password = await bcrypt.hash(newPass, 10);
    await admin.save();

    return res.status(200).json({
      status: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Modify Password Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};


//set Password
exports.performPasswordReset = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Passwords do not match",
      });
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    return res.status(200).json({
      status: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
    });
  }
};

