//express
const express = require("express");
const route = express.Router();

const upload = require("../../middleware/upload");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//controller
const ChatController = require("../../controllers/client/chat.controller");

//validate user's access token
const validateUserToken = require("../../middleware/validateUserToken.middleware");

//send message ( image or audio ) ( user )
route.post(
  "/pushChatMessage",
  validateUserToken,
  checkAccessWithSecretKey(),
  upload("user").fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  ChatController.pushChatMessage
);

//get old chat ( user )
route.get("/fetchChatHistory", validateUserToken, checkAccessWithSecretKey(), ChatController.fetchChatHistory);


//send message ( image or audio ) ( host )
route.post(
  "/submitChatMessage",
  checkAccessWithSecretKey(),
upload("chat").fields([
  { name: "image", maxCount: 5 },
  { name: "audio", maxCount: 5},
]),
  ChatController.submitChatMessage
);

//get old chat ( host )
route.get("/retrieveChatHistory", checkAccessWithSecretKey(), ChatController.retrieveChatHistory);

module.exports = route;
