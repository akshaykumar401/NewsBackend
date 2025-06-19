import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

// Sending Comment Method...
const sendComment = asyncHandler(async (req, res) => {
  const { postId, comment } = req.body;
  const userId = req.user._id;  // UserId from the authenticated user

  // Finding Post...
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Creating Comment...
  const newComment = await Comment.create({
    userId: userId,
    postId: postId,
    comment: comment,
    userName: req.user.username,
  });

  // Pushing Comment to Post
  post.comments.push(newComment._id);
  await post.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        newComment,
        "Comment added successfully",
      )
    );
});


export {
  sendComment,
}