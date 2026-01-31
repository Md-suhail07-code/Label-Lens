import express from "express";
import { changePassword, forgotPassword, login, logout, signUp, updateUSer, verifyEmail, verifyOtp } from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp/:email", verifyOtp);
router.post("/change-password/:email", changePassword);
router.put("/update-user", isAuthenticated, updateUSer);

export default router;