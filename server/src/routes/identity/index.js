const express = require("express");
const authController = require("../../controllers/identity/auth.controller");
const passwordController = require("../../controllers/identity/password.controller");
const requireAuth = require("../../middleware/auth");
const { loginLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

router.post("/auth/register", authController.register);
router.post("/auth/login", loginLimiter, authController.login);
router.post("/auth/otp/verify", authController.verifyOtp);
router.post("/auth/otp/resend", authController.resendOtp);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", requireAuth, authController.me);
router.post("/auth/dev-admin-signin", authController.devAdminSignIn);

router.post("/password/forgot", passwordController.forgotPassword);
router.post("/password/reset", passwordController.resetPassword);

module.exports = router;
