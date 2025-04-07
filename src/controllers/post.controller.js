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
  if (!title || !description) {
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

  // Remove Password and refreshToken from posts
  posts.forEach(post => {
    if (post.user) {
      post.user.password = undefined;
      post.user.refreshToken = undefined;
    }
  });

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
  const posts = await Post.find({ user: req.user?._id }).populate("user")

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

  // Remove Password and refreshToken from posts
  posts.forEach(post => {
    if (post.user) {
      post.user.password = undefined;
      post.user.refreshToken = undefined;
    }
  });

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

// Edit Post Method...
const editPost = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description } = req.body
  // Uploading Referance Image
  let imageLocalPath
  if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
    imageLocalPath = req.files.image[0].path;
  }

  if (title && imageLocalPath && description) {
    // Uploading them to Cloudinary if imageLocalPath exists.
    const refImage = await uploadOnCloudnary(imageLocalPath);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          description,
          referanceImage: refImage?.url
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (title && imageLocalPath) {
    // Uploading them to Cloudinary if imageLocalPath exists.
    const refImage = await uploadOnCloudnary(imageLocalPath);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          referanceImage: refImage?.url
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (description && imageLocalPath) {
    // Uploading them to Cloudinary if imageLocalPath exists.
    const refImage = await uploadOnCloudnary(imageLocalPath);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          description,
          referanceImage: refImage?.url
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (description && title) {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          description,
          title
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (title) {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          title
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (description) {
    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          description
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (imageLocalPath) {
    // Uploading them to Cloudinary if imageLocalPath exists.
    const refImage = await uploadOnCloudnary(imageLocalPath);

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $set: {
          referanceImage: refImage?.url,
        }
      },
      { new: true }
    )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          post,
          "Post Updated Successfully",
        )
      )
  }

  if (!title && !description && !imageLocalPath) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          [],
          "Please fill in the required fields",
        )
      )
  }
})

// display single Post Methode...
const getPost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Finding user...
  const post = await Post.findById({ _id: id }).populate("user");

  if (!post) {
    return res
      .status(404)
      .json(
        new ApiError(
          404,
          [],
          "Post not found",
        )
      )
  }

  // Remove Password and refreshToken
  post.user.password = undefined;
  post.user.refreshToken = undefined;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        post,
        "Post Retrieved Successfully",
      )
    )
})

export {
  createPost,
  deletePost,
  viewAllPost,
  viewUserPost,
  editPost,
  getPost
}