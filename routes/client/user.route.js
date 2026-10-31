//express
const express = require("express");
const route = express.Router();

const upload = require("../../middleware/upload");

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../checkAccess");

//validateFirebaseToken
const validateAuthToken = require("../../middleware/verifyAuthToken.middleware");

//validate user's access token
const validateUserToken = require("../../middleware/validateUserToken.middleware");

//controller
const UserController = require("../../controllers/client/user.controller");

//check the user is exists or not with loginType 3 quick (identity)
route.post("/quickUserVerification", checkAccessWithSecretKey(), UserController.quickUserVerification);

//user login or sign up
route.post("/signInOrSignUpUser", validateAuthToken, checkAccessWithSecretKey(), UserController.signInOrSignUpUser);

//update profile of the user
route.patch("/modifyUserProfile", validateUserToken, checkAccessWithSecretKey(), upload('user').single("image"), UserController.modifyUserProfile);

//get user profile
route.get("/retrieveUserProfile", validateUserToken, checkAccessWithSecretKey(), UserController.retrieveUserProfile);

//delete user
route.delete("/deactivateMyAccount", validateUserToken, checkAccessWithSecretKey(), UserController.deactivateMyAccount);

module.exports = route;
