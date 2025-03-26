import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudnary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";

// Create Post Method...
const createPost = asyncHandler(async (req, res) => {
  const { title, description } = req.body

  // Cheaking is All Field is Given
  if (!title && !description) {
    throw new ApiError(404, "Please Fill All Field");
  }

  // Uploading Referance Image
  let imageLocalPath
  if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
    imageLocalPath = req.files.image[0].path;
  }

  // Uploading them to Cloudinary if imageLocalPath exists.
  const refImage = await uploadOnCloudnary(imageLocalPath);

  // Creating Post Object
  const newPost = await Post.create({
    user: req.user._id,
    title,
    description,
    referanceImage: refImage?.url || "",
  })

  const user = await User.findById(req.user._id)
  user.post.push(newPost._id)
  await user.save({ validateBeforeSave: false })

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        newPost,
        "Post Created Successfully",
      )
    );

})

// Delete Post Method...
const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params

  // finding Post and delete
  const post = await Post.findByIdAndDelete(id)

  // Finding user
  const user = await User.findById(req.user?._id)

  // Removing Post from User
  user.post.pull(post._id)
  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Post Deleted Successfully",
      )
    )
})

// View All Post Method...
const viewAllPost = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate("user").select("-password -refreshToken")

  if (!posts || posts.length === 0) {
    return res
      .status(202)
      .json(
        new ApiResponse(
          202,
          [],
          "No Posts Found",
        )
      )
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        posts,
        "Posts Retrieved Successfully",
      )
    )
})

// View Login User Post Method...
const viewUserPost = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.user?._id }).populate("user").select("-password -refreshToken")

  // if Not Having Post
  if (!posts || posts.length === 0) {
    return res
      .status(202)
      .json(
        new ApiResponse(
          202,
          [],
          "No Posts Found",
        )
      )
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        posts,
        "Posts Retrieved Successfully",
      )
    )
})

export {
  createPost,
  deletePost,
  viewAllPost,
  viewUserPost
}