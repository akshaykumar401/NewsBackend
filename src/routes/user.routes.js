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
  deleteUserProfile,
  generateReferanceToken,
  followAndFollingUser,
  displayFollowingUser,
  unFollowUser,
  displayOtherUserProfile,
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

// Generate Referance Token
router.route("/generateReferanceToken").get(
  generateReferanceToken
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

// Follow and Following User
router.route("/follow/:userId").patch(
  verifyJWT,
  followAndFollingUser
)

// Unfollow User
router.route("/unfollow/:userId").patch(
  verifyJWT,
  unFollowUser
)

// Display Folling user...
router.route("/following").get(
  verifyJWT,
  displayFollowingUser
)

// Display Other User Profile
router.route("/otherUserProfile/:username").get(
  verifyJWT,
  displayOtherUserProfile
)


export default router;