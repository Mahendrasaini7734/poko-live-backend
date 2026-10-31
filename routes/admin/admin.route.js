const express = require("express");
const router = express.Router();
const AdminController = require("../../controllers/admin/admin.controller");
const checkAccessWithSecretKey = require("../../checkAccess");
const validateAdminToken = require("../../middleware/verifyAdminAuthToken.middleware");
const upload = require("../../middleware/upload");

/**
 * ADMIN AUTH
 */

// Admin signup
router.post(
  "/registerAdmin",
  checkAccessWithSecretKey(),
  AdminController.registerAdmin
);

// Admin login
router.post(
  "/validateAdminLogin",
  // checkAccessWithSecretKey(),
  AdminController.adminLogin
);


/**
 * ADMIN PROFILE
 */


// Update admin profile (with image)
router.patch(
  "/modifyAdminProfile",
  // checkAccessWithSecretKey(),
  validateAdminToken,
  upload("admin").single("image"),
  AdminController.modifyAdminProfile
);

// Get admin profile
router.get(
  "/retrieveAdminProfile",
  // checkAccessWithSecretKey(),
  validateAdminToken,
  AdminController.retrieveAdminProfile
);

/**
 * PASSWORD MANAGEMENT
 */

// Change password (old → new)
router.post(
  "/modifyPassword",
  // checkAccessWithSecretKey(),
  validateAdminToken,
  AdminController.modifyPassword
);

// Reset password (force set)
router.patch(
  "/performPasswordReset",
  // checkAccessWithSecretKey(),
  validateAdminToken,
  AdminController.performPasswordReset
);

module.exports = router;



