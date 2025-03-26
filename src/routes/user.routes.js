import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  sigIn,
  login,
  logout,
  forgotPassword,
  getUserProfile,
  updateUserDetail,
  updateUserProfile,
  deleteUserProfile
} from "../controllers/user.controller.js";

const router = Router()

// Signup Route...
router.route("/sigin").post(
  upload.fields([
    {
      name: "avator",
      maxCount: 1
    }
  ]),
  sigIn
)

// Login Route...
router.route("/login").post(
  login
)

// Forget Password
router.route("/forgotPassword").post(
  forgotPassword
)

// Secure Routes
// Logout Route...
router.route("/logout").post(
  verifyJWT,
  logout
)

// Get User Profile
router.route("/userProfile").get(
  verifyJWT,
  getUserProfile
)

// Update user Profile
router.route("/updateProfile").patch(
  verifyJWT,
  updateUserDetail
)

// Updating user Profile Pic
router.route("/updateAvator").patch(
  verifyJWT,
  upload.single("avator"),
  updateUserProfile
)

// Delete User Profile
router.route("/deleteProfile").delete(
  verifyJWT,
  deleteUserProfile
)

export default router;