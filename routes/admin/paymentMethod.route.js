//express
const express = require("express");
const route = express.Router();

//multer
const upload = require("../../middleware/upload");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const PaymentMethodController = require("../../controllers/admin/paymentMethod.controller");

//Create Payment Method
route.post("/addPaymentMethod", checkAccessWithSecretKey(),   upload("payment").fields([
    { name: "image", maxCount: 1 },

  ]), PaymentMethodController.addPaymentMethod);

//Update Payment Method
route.patch("/modifyPaymentMethod", checkAccessWithSecretKey(),  upload("payment").fields([
    { name: "image", maxCount: 1 },

  ]), PaymentMethodController.modifyPaymentMethod);

//handle the isActive status of the payment method
route.patch("/updatePaymentMethodStatus", checkAccessWithSecretKey(),  PaymentMethodController.updatePaymentMethodStatus);

//Get All Payment Methods
route.get("/retrievePaymentMethods", checkAccessWithSecretKey(), PaymentMethodController.retrievePaymentMethods);

//Disable Payment Method
route.delete("/discardPaymentMethod", checkAccessWithSecretKey(), PaymentMethodController.discardPaymentMethod);

module.exports = route;
