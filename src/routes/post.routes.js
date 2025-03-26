import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  deletePost
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

// View Current User Post

// View Post -> req.param(id)




export default router;