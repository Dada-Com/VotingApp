const express = require("express");
const {
  createEleCommission,
  loginEleCommission,
  checkEleCommission,
  logoutEleCommission,
} = require("../controller/EleCommissonAuth");
const passport = require("passport");

const router = express.Router();
//  /auth is already added in base path
router
  .post("/signup-EleCommission", createEleCommission)
  .post(
    "/login-EleCommission",
    passport.authenticate("localEleCommission"),
    loginEleCommission
  )
  .get(
    "/check-EleCommission",
    passport.authenticate("jwtEleCommission"),
    checkEleCommission
  )
  .get("/logoutEleCommission", logoutEleCommission);
exports.router = router;
