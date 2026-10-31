const express = require("express");
const router = express.Router();
//validate user's access token
const validateUserToken = require("../../middleware/validateUserToken.middleware");
//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

const {
    retrieveCoinSellers,
    retrieveCoinSellerPlans
} = require("../../controllers/client/coinSeller.controller");



router.get(
    "/retrieveCoinSellers",
    //  validateUserToken, checkAccessWithSecretKey(),
    retrieveCoinSellers
);

router.get(
    "/retrieveCoinSellerPlans/:sellerUniqueId",
    // validateUserToken, checkAccessWithSecretKey(),
    retrieveCoinSellerPlans
);

module.exports = router;

