const express = require("express");
const route = express.Router();

const checkAccessWithSecretKey = require("../../checkAccess");
const validateUserToken = require("../../middleware/validateUserToken.middleware");
const DailyTaskController = require("../../controllers/client/dailyTask.controller");

route.get("/", validateUserToken, checkAccessWithSecretKey(), DailyTaskController.getDailyTask);

module.exports = route;
