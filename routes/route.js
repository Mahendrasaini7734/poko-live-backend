//express
const express = require("express");
const route = express.Router();

//admin index.js
const admin = require("./admin/route");
//agency index.js
const agency = require("./agency/route");
const client = require("./client/route");
const email = require("./email/route");


route.use("/admin", admin);
route.use("/agency", agency);
route.use("/client", client);
route.use("/email", email);
module.exports = route;

