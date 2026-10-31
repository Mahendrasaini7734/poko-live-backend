//express
const express = require("express");
const route = express.Router();
const checkAccessWithSecretKey = require("../../checkAccess");
const GiftController = require("../../controllers/admin/gift.controller");
const upload = require("../../middleware/upload");

//create gift
route.post(
  "/addGift",
  checkAccessWithSecretKey(),
  upload("gift").fields([
    { name: "image", maxCount: 1 },
    { name: "svgaImage", maxCount: 1 },
  ]),
  GiftController.addGift
);

//update gift
route.patch(
  "/modifyGift",
  checkAccessWithSecretKey(),
  upload("gift").fields([
    { name: "image", maxCount: 1 },
    { name: "svgaImage", maxCount: 1 },
  ]),
  GiftController.modifyGift
);

//get gifts
route.get("/retrieveGifts", checkAccessWithSecretKey(), GiftController.retrieveGifts);

//delete gift
route.delete("/discardGift", checkAccessWithSecretKey(), GiftController.discardGift);

module.exports = route;
