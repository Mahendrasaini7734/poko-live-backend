const express = require("express");
const route = express.Router();

//Controller
const coinplanController = require("../../controllers/client/coinPlan.controller");

//validate user's access token
const validateUserToken = require("../../middleware/validateUserToken.middleware");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//get coinplan
route.get("/getCoinPackage", validateUserToken, checkAccessWithSecretKey(), coinplanController.getCoinPackage);

//purchase coinPlan ( coinPlan history )
route.post("/recordCoinPlanPurchase", validateUserToken, checkAccessWithSecretKey(), coinplanController.recordCoinPlanPurchase);

//which payment gateways are currently allowed (backend settings)
route.get("/paymentGateways", validateUserToken, checkAccessWithSecretKey(), coinplanController.getPaymentGateways);

//Razorpay: server creates the order, server verifies the payment
route.post("/razorpay/createOrder", validateUserToken, checkAccessWithSecretKey(), coinplanController.createRazorpayOrder);
route.post("/razorpay/verify", validateUserToken, checkAccessWithSecretKey(), coinplanController.verifyRazorpayPa   yment);
route.get("/razorpay/order/:orderId", validateUserToken, checkAccessWithSecretKey(), coinplanController.getRazorpayOrderStatus);

//Razorpay webhook: authenticated by signature, NOT by user token / app secret key
route.post("/razorpay/webhook", coinplanController.razorpayWebhook);

module.exports = route;
