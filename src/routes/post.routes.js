import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  deletePost,
  viewAllPost,
  viewUserPost
} from "../controllers/post.controller.js";

const router = Router()

// Secure Route
// Create Post
router.route("/createPost").post(
  verifyJWT,
  upload.fields([
    {
      name: "image",
      maxCount: 1
    }
  ]),
  createPost
)

// Delete Post -> req.param(id)
router.route("/c/:id").get(
  verifyJWT,
  deletePost
)

// Edit Post


// View All Post
router.route("/viewAllpost").get(
  verifyJWT,
  viewAllPost
)

// View Current User Post
router.route("/viewUserPost").get(
  verifyJWT,
  viewUserPost
)

// View Post -> req.param(id)




export default router;